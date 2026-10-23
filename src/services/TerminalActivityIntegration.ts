/**
 * Integration helper for terminal events with Agent Monitor
 * Keeps agent monitor activity clock updated when terminal commands execute
 */

import { TerminalTracker } from '../trackers/TerminalTracker';
import { AgentMonitor } from './AgentMonitor';
import { Logger } from '../utils/Logger';

export class TerminalActivityIntegration {
  constructor(
    private terminalTracker: TerminalTracker,
    private agentMonitor: AgentMonitor
  ) {}

  /**
   * Start monitoring terminal commands and update agent activity
   * This keeps the inactivity detector aware of terminal activity
   */
  public startMonitoring(): void {
    // We'll poll terminal commands and update agent monitor
    // This is a simple implementation that can be enhanced with event-based integration

    const originalRecordCommand = this.terminalTracker.recordCommand.bind(
      this.terminalTracker
    );

    // Wrap recordCommand to update agent monitor activity
    this.terminalTracker.recordCommand = async (command) => {
      const result = await originalRecordCommand(command);
      // Update agent monitor activity time
      this.agentMonitor.updateActivityTime();
      Logger.debug(`Terminal activity updated - Agent monitor notified`);
      return result;
    };

    Logger.info('Terminal activity integration started');
  }

  public dispose(): void {
    Logger.info('Terminal activity integration stopped');
  }
}
