import * as vscode from 'vscode';
import { ActivityTracker } from '../trackers/ActivityTracker';
import { TerminalTracker } from '../trackers/TerminalTracker';
import { AgentMonitor } from '../services/AgentMonitor';
import { Logger } from '../utils/Logger';

export class StatusCommand {
  constructor(
    private activityTracker: ActivityTracker,
    private terminalTracker: TerminalTracker,
    private agentMonitor: AgentMonitor
  ) {}

  public async execute(): Promise<void> {
    try {
      Logger.info('Fetching status...');

      const activityStatus = this.activityTracker.isActive()
        ? 'Active'
        : 'Inactive';
      const terminalStatus = this.terminalTracker.isActive()
        ? 'Active'
        : 'Inactive';
      const monitorStatus = this.agentMonitor.isActive()
        ? 'Active'
        : 'Inactive';

      const activitiesCount = this.activityTracker.getActivities().length;
      const commandsCount = this.terminalTracker.getCommands().length;
      const inactivityDuration =
        this.agentMonitor.getInactivityDuration().toFixed(1);

      const status = `
Knowledge Pill Status:
- Activity Tracker: ${activityStatus} (${activitiesCount} recorded)
- Terminal Tracker: ${terminalStatus} (${commandsCount} recorded)
- Agent Monitor: ${monitorStatus} (inactivity: ${inactivityDuration}s)
      `.trim();

      vscode.window.showInformationMessage(status);
      Logger.info('Status: ' + status.replace(/\n/g, ' | '));
    } catch (error) {
      Logger.error('Error getting status', error as Error);
      vscode.window.showErrorMessage('Failed to get status');
    }
  }
}
