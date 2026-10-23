import * as vscode from 'vscode';
import { ActivityTracker } from '../trackers/ActivityTracker';
import { TerminalTracker } from '../trackers/TerminalTracker';
import { AgentMonitor } from '../services/AgentMonitor';
import { Logger } from '../utils/Logger';

export class StopTrackingCommand {
  constructor(
    private activityTracker: ActivityTracker,
    private terminalTracker: TerminalTracker,
    private agentMonitor: AgentMonitor
  ) {}

  public async execute(): Promise<void> {
    try {
      Logger.info('Stopping tracking...');

      // Stop all trackers
      this.activityTracker.stopTracking();
      this.terminalTracker.stopTracking();
      this.agentMonitor.stopMonitoring();

      vscode.window.showInformationMessage('Knowledge Pill tracking stopped');
      Logger.info('All trackers deactivated');
    } catch (error) {
      Logger.error('Error stopping tracking', error as Error);
      vscode.window.showErrorMessage('Failed to stop tracking');
    }
  }
}
