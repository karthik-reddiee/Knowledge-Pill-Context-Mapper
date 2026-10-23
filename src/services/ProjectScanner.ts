import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { promisify } from 'util';
import { exec } from 'child_process';
import { ProjectSnapshot, FolderNode } from '../models/ProjectSnapshot';
import { Logger } from '../utils/Logger';

const execAsync = promisify(exec);

interface FileStatEntry {
  relativePath: string;
  fullPath: string;
  mtimeMs: number;
}

export class ProjectScanner {
  private excludePatterns: string[] = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.DS_Store',
  ];

  constructor() {
    const config = vscode.workspace.getConfiguration('knowledge-pill');
    const patterns = config.get<string[]>('excludePatterns');
    if (patterns && patterns.length > 0) {
      this.excludePatterns = patterns;
    }
  }

  public async scan(): Promise<ProjectSnapshot> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder is open for ProjectScanner');
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    Logger.info(`Starting project scan for workspace: ${workspacePath}`);

    const packageJson = await this.loadPackageJson(workspacePath);
    const dependencies = this.resolveDependencies(packageJson);
    const gitBranch = await this.getGitBranch(workspacePath);
    const gitStatus = await this.getGitStatus(workspacePath);
    const readme = await this.loadReadme(workspacePath);

    const fileStats: FileStatEntry[] = [];
    const folderStructure = await this.buildFolderTree(
      workspacePath,
      '.',
      fileStats
    );

    const recentFiles = this.getRecentFiles(fileStats, 10);

    const snapshot: ProjectSnapshot = {
      workspace: workspacePath,
      timestamp: new Date().toISOString(),
      packageJson: packageJson,
      dependencies: dependencies,
      gitBranch: gitBranch,
      gitStatus: gitStatus,
      recentFiles: recentFiles,
      folderStructure: folderStructure,
      readme: readme,
    };

    await this.saveSnapshot(workspacePath, snapshot);
    Logger.info('Project scan completed successfully');

    return snapshot;
  }

  public setExcludePatterns(patterns: string[]): void {
    this.excludePatterns = patterns;
  }

  public getExcludePatterns(): string[] {
    return [...this.excludePatterns];
  }

  private async loadPackageJson(
    workspacePath: string
  ): Promise<Record<string, unknown> | undefined> {
    const packageJsonPath = path.join(workspacePath, 'package.json');
    if (!(await this.exists(packageJsonPath))) {
      return undefined;
    }

    try {
      const content = await fs.promises.readFile(packageJsonPath, 'utf-8');
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      Logger.warn(`Unable to load package.json: ${error}`);
      return undefined;
    }
  }

  private resolveDependencies(
    packageJson?: Record<string, unknown>
  ): string[] | undefined {
    if (!packageJson) {
      return undefined;
    }

    const dependencies = new Set<string>();
    const depSections = ['dependencies', 'devDependencies', 'peerDependencies'];

    for (const section of depSections) {
      const value = packageJson[section];
      if (value && typeof value === 'object') {
        for (const depName of Object.keys(value)) {
          dependencies.add(depName);
        }
      }
    }

    return Array.from(dependencies).sort();
  }

  private async getGitBranch(
    workspacePath: string
  ): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: workspacePath,
      });
      return stdout.trim();
    } catch (error) {
      Logger.warn('Unable to resolve git branch');
      return undefined;
    }
  }

  private async getGitStatus(
    workspacePath: string
  ): Promise<string | undefined> {
    try {
      const { stdout } = await execAsync('git status --short --branch', {
        cwd: workspacePath,
      });
      return stdout.trim();
    } catch (error) {
      Logger.warn('Unable to retrieve git status');
      return undefined;
    }
  }

  private async loadReadme(workspacePath: string): Promise<string | undefined> {
    const candidates = ['README.md', 'README.markdown', 'readme.md'];
    for (const candidate of candidates) {
      const readmePath = path.join(workspacePath, candidate);
      if (await this.exists(readmePath)) {
        try {
          return await fs.promises.readFile(readmePath, 'utf-8');
        } catch (error) {
          Logger.warn(`Unable to read ${candidate}: ${error}`);
          return undefined;
        }
      }
    }
    return undefined;
  }

  private async buildFolderTree(
    currentPath: string,
    relativePath: string,
    fileStats: FileStatEntry[]
  ): Promise<FolderNode> {
    const node: FolderNode = {
      name: path.basename(currentPath) || currentPath,
      type: 'folder',
      path: relativePath,
      children: [],
    };

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(currentPath, {
        withFileTypes: true,
      });
    } catch (error) {
      Logger.warn(`Unable to read directory ${currentPath}: ${error}`);
      return node;
    }

    const children: FolderNode[] = [];

    for (const entry of entries) {
      const entryRelativePath = path.join(relativePath, entry.name);
      const entryFullPath = path.join(currentPath, entry.name);

      if (this.isExcluded(entry.name, entryFullPath)) {
        continue;
      }

      if (entry.isDirectory()) {
        const childFolder = await this.buildFolderTree(
          entryFullPath,
          entryRelativePath,
          fileStats
        );
        children.push(childFolder);
      } else {
        children.push({
          name: entry.name,
          type: 'file',
          path: entryRelativePath,
        });

        try {
          const stats = await fs.promises.stat(entryFullPath);
          fileStats.push({
            relativePath: entryRelativePath,
            fullPath: entryFullPath,
            mtimeMs: stats.mtimeMs,
          });
        } catch (error) {
          Logger.debug(`Unable to stat file ${entryFullPath}: ${error}`);
        }
      }
    }

    node.children = children.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'folder' ? -1 : 1;
    });

    return node;
  }

  private getRecentFiles(
    fileStats: FileStatEntry[],
    limit: number
  ): string[] {
    return fileStats
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, limit)
      .map((entry) => entry.relativePath);
  }

  private async saveSnapshot(
    workspacePath: string,
    snapshot: ProjectSnapshot
  ): Promise<void> {
    const snapshotPath = path.join(workspacePath, 'project-snapshot.json');
    try {
      await fs.promises.writeFile(
        snapshotPath,
        JSON.stringify(snapshot, null, 2),
        'utf-8'
      );
      Logger.info(`Project snapshot written to ${snapshotPath}`);
    } catch (error) {
      Logger.error(`Failed to save project snapshot: ${error}`);
    }
  }

  private async exists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private isExcluded(name: string, fullPath: string): boolean {
    return this.excludePatterns.some((pattern) => {
      if (name === pattern) {
        return true;
      }
      const normalizedPath = fullPath.split(path.sep).join('/');
      const normalizedPattern = pattern.split(path.sep).join('/');
      return normalizedPath.includes(`/${normalizedPattern}`);
    });
  }
}
