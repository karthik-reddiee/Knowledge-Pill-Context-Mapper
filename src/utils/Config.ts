import * as vscode from 'vscode';

export class Config {
  static getInactivityTimeout(): number {
    const config = vscode.workspace.getConfiguration('knowledge-pill');
    return config.get<number>('inactivityTimeout', 300);
  }

  static getExcludePatterns(): string[] {
    const config = vscode.workspace.getConfiguration('knowledge-pill');
    return config.get<string[]>('excludePatterns', [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.DS_Store',
    ]);
  }

  static getAutoExport(): boolean {
    const config = vscode.workspace.getConfiguration('knowledge-pill');
    return config.get<boolean>('autoExport', false);
  }
}
