import * as vscode from 'vscode';
import * as path from 'path';
import { Activity } from '../models/Activity';
import { StorageService } from '../services/StorageService';
import { PreviewGenerator } from '../utils/PreviewGenerator';
import { Logger } from '../utils/Logger';

export class ActivityTracker {
  private disposables: vscode.Disposable[] = [];
  private activities: Activity[] = [];
  private isTracking: boolean = false;
  private lastActivityTime: number = 0;
  private storageService: StorageService | null = null;

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspacePath = workspaceFolders[0].uri.fsPath;
      this.storageService = new StorageService(workspacePath);
    }
  }

  private setupListeners(): void {
    // Track text document changes (edits)
    const changeDisposable = vscode.workspace.onDidChangeTextDocument(
      (event) => this.onDidChangeTextDocument(event)
    );
    this.disposables.push(changeDisposable);

    // Track file creation
    const createDisposable = vscode.workspace.onDidCreateFiles((event) =>
      this.onDidCreateFiles(event)
    );
    this.disposables.push(createDisposable);

    // Track file deletion
    const deleteDisposable = vscode.workspace.onDidDeleteFiles((event) =>
      this.onDidDeleteFiles(event)
    );
    this.disposables.push(deleteDisposable);

    // Track file rename
    const renameDisposable = vscode.workspace.onDidRenameFiles((event) =>
      this.onDidRenameFiles(event)
    );
    this.disposables.push(renameDisposable);

    Logger.info('Activity tracker listeners registered');
  }

  private onDidChangeTextDocument(
    event: vscode.TextDocumentChangeEvent
  ): void {
    if (!this.isTracking) {
      return;
    }

    const doc = event.document;
    const relativePath = this.getRelativePath(doc.uri.fsPath);
    const now = new Date().toISOString();

    // Generate preview from changes
    let preview = '';
    if (event.contentChanges.length > 0) {
      const changes = event.contentChanges.map((change) => ({
        oldText: change.text,
        newText: change.text,
      }));
      preview = PreviewGenerator.fromChanges(changes);
    }

    const activity: Activity = {
      file: relativePath,
      event: 'modified',
      timestamp: now,
      preview: preview || PreviewGenerator.fromPath(relativePath),
    };

    this.recordActivity(activity);
  }

  private onDidCreateFiles(event: vscode.FileCreateEvent): void {
    if (!this.isTracking) {
      return;
    }

    const now = new Date().toISOString();

    for (const file of event.files) {
      const relativePath = this.getRelativePath(file.fsPath);
      const activity: Activity = {
        file: relativePath,
        event: 'created',
        timestamp: now,
        preview: `created new file`,
      };

      this.recordActivity(activity);
    }
  }

  private onDidDeleteFiles(event: vscode.FileDeleteEvent): void {
    if (!this.isTracking) {
      return;
    }

    const now = new Date().toISOString();

    for (const file of event.files) {
      const relativePath = this.getRelativePath(file.fsPath);
      const activity: Activity = {
        file: relativePath,
        event: 'deleted',
        timestamp: now,
        preview: `deleted file`,
      };

      this.recordActivity(activity);
    }
  }

  private onDidRenameFiles(event: vscode.FileRenameEvent): void {
    if (!this.isTracking) {
      return;
    }

    const now = new Date().toISOString();

    for (const file of event.files) {
      const oldPath = this.getRelativePath(file.oldUri.fsPath);
      const newPath = this.getRelativePath(file.newUri.fsPath);

      const activity: Activity = {
        file: newPath,
        event: 'renamed',
        timestamp: now,
        preview: `renamed from ${oldPath}`,
        oldPath: oldPath,
      };

      this.recordActivity(activity);
    }
  }

  private getRelativePath(filePath: string): string {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspacePath = workspaceFolders[0].uri.fsPath;
      return path.relative(workspacePath, filePath);
    }
    return filePath;
  }

  private async recordActivity(activity: Activity): Promise<void> {
    this.activities.push(activity);
    this.lastActivityTime = Date.now();

    // Persist to storage
    if (this.storageService) {
      await this.storageService.appendActivity(activity);
    }

    Logger.debug(
      `Activity recorded: ${activity.event} ${activity.file}`
    );
  }

  public async startTracking(): Promise<void> {
    if (this.isTracking) {
      return;
    }
    this.isTracking = true;
    this.lastActivityTime = Date.now();
    
    // Load existing activities from storage
    if (this.storageService) {
      const log = await this.storageService.loadActivityLog();
      this.activities = log.activities;
      Logger.debug(`Loaded ${this.activities.length} activities from storage`);
    } else {
      this.activities = [];
    }

    this.setupListeners();
    Logger.info('Activity tracking started');
  }

  public stopTracking(): void {
    this.isTracking = false;
    Logger.info('Activity tracking stopped');
  }

  public getActivities(): Activity[] {
    return [...this.activities];
  }

  public getLastActivityTime(): number {
    return this.lastActivityTime;
  }

  public isActive(): boolean {
    return this.isTracking;
  }

  public clear(): void {
    this.activities = [];
    this.lastActivityTime = 0;
  }

  public getStorageService(): StorageService | null {
    return this.storageService;
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.stopTracking();
  }
}
