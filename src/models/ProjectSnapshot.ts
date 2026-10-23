export interface ProjectSnapshot {
  workspace: string;
  timestamp: string;
  packageJson?: Record<string, unknown>;
  dependencies?: string[];
  gitBranch?: string;
  gitStatus?: string;
  recentFiles?: string[];
  folderStructure?: FolderNode;
  readme?: string;
}

export interface FolderNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FolderNode[];
}
