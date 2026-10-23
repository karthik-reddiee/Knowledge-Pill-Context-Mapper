import * as vscode from 'vscode';
import { ProjectScanner } from '../services/ProjectScanner';
import { Logger } from '../utils/Logger';

export class ScanProjectCommand {
  constructor(private projectScanner: ProjectScanner) {}

  public async execute(): Promise<void> {
    try {
      Logger.info('Starting project scan...');

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Knowledge Pill: Scanning project workspace',
          cancellable: false,
        },
        async () => {
          const snapshot = await this.projectScanner.scan();
          Logger.info(
            `Project scan completed with ${
              snapshot.dependencies?.length ?? 0
            } dependencies and ${snapshot.recentFiles?.length ?? 0} recent files.`
          );
        }
      );

      vscode.window.showInformationMessage(
        'Knowledge Pill project scan completed. project-snapshot.json generated.'
      );
    } catch (error) {
      Logger.error('Project scan failed', error as Error);
      vscode.window.showErrorMessage('Knowledge Pill project scan failed');
    }
  }
}
