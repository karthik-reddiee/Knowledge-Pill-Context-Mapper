/**
 * Terminal Command Recording Helper
 * Provides utilities for capturing and recording terminal commands
 * Can be used by external integrations or terminal extensions
 */

import { TerminalTracker } from '../trackers/TerminalTracker';
import { TerminalCommand } from '../models/TerminalCommand';
import { Logger } from '../utils/Logger';

export class TerminalRecorder {
  constructor(private terminalTracker: TerminalTracker) {}

  /**
   * Record a command execution
   * Terminal: name of terminal or default
   * Command: the command that was executed
   * ExitCode: optional exit code if known
   */
  public async recordExecution(
    command: string,
    terminal: string = 'default',
    exitCode?: number
  ): Promise<void> {
    const terminalCommand: TerminalCommand = {
      command: command,
      timestamp: new Date().toISOString(),
      terminal: terminal,
      exitCode: exitCode,
    };

    await this.terminalTracker.recordCommand(terminalCommand);
  }

  /**
   * Record multiple commands
   */
  public async recordBatch(
    commands: Array<{ command: string; terminal?: string; exitCode?: number }>
  ): Promise<void> {
    for (const cmd of commands) {
      await this.recordExecution(
        cmd.command,
        cmd.terminal || 'default',
        cmd.exitCode
      );
    }
  }

  /**
   * Get filter for checking if commands should be recorded
   */
  public getFilter() {
    return this.terminalTracker.getCommandFilter();
  }

  /**
   * Get all recorded commands
   */
  public getCommands(): TerminalCommand[] {
    return this.terminalTracker.getCommands();
  }
}
