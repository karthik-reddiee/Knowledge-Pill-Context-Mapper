import * as vscode from 'vscode';
import { ActivityTracker } from '../trackers/ActivityTracker';
import { TerminalTracker } from '../trackers/TerminalTracker';
import { AgentMonitor } from '../services/AgentMonitor';
import { Logger } from '../utils/Logger';
import { Config } from '../utils/Config';

export class StartTrackingCommand {
  constructor(
    private activityTracker: ActivityTracker,
    private terminalTracker: TerminalTracker,
    private agentMonitor: AgentMonitor
  ) {}

  public async execute(): Promise<void> {
    try {
      Logger.info('Starting tracking...');

      // Start all trackers
      await this.activityTracker.startTracking();
      await this.terminalTracker.startTracking();

      // Start agent monitor with configured timeout
      const timeout = Config.getInactivityTimeout();
      this.agentMonitor.setInactivityTimeout(timeout);
      this.agentMonitor.startMonitoring();

      vscode.window.showInformationMessage('Knowledge Pill tracking started');
      Logger.info('All trackers activated');
    } catch (error) {
      Logger.error('Error starting tracking', error as Error);
      vscode.window.showErrorMessage('Failed to start tracking');
    }
  }
}
