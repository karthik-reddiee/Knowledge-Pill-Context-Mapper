import * as fs from 'fs';
import * as path from 'path';
import { TerminalCommand, TerminalHistory } from '../models/TerminalCommand';
import { Logger } from '../utils/Logger';

export class TerminalHistoryService {
  private historyFilePath: string;
  private maxCommandsInMemory: number = 500;

  constructor(workspacePath: string) {
    this.historyFilePath = path.join(workspacePath, 'terminal-history.txt');
  }

  public async loadTerminalHistory(): Promise<TerminalHistory> {
    try {
      if (fs.existsSync(this.historyFilePath)) {
        const content = fs.readFileSync(this.historyFilePath, 'utf-8');
        // Parse line-by-line format (easier for CLI tools to work with)
        const commands: TerminalCommand[] = [];
        const lines = content.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const cmd: TerminalCommand = JSON.parse(line);
            commands.push(cmd);
          } catch (e) {
            // Skip malformed lines
            continue;
          }
        }

        return {
          commands: commands,
          startTime: commands.length > 0 ? commands[0].timestamp : new Date().toISOString(),
        };
      }
    } catch (error) {
      Logger.warn(`Failed to load terminal history: ${error}`);
    }

    return {
      commands: [],
      startTime: new Date().toISOString(),
    };
  }

  public async appendCommand(command: TerminalCommand): Promise<void> {
    try {
      let history = await this.loadTerminalHistory();

      // Add new command
      history.commands.push(command);

      // Trim if exceeds max
      if (history.commands.length > this.maxCommandsInMemory) {
        const removeCount = history.commands.length - this.maxCommandsInMemory;
        history.commands.splice(0, removeCount);
        Logger.debug(
          `Terminal history trimmed, removed ${removeCount} old commands`
        );
      }

      // Update end time
      history.endTime = new Date().toISOString();

      // Write to file (append mode)
      await this.saveTerminalHistory(history);
    } catch (error) {
      Logger.error(`Failed to append command: ${error}`);
    }
  }

  public async saveTerminalHistory(history: TerminalHistory): Promise<void> {
    try {
      // Use line-delimited JSON format for CLI compatibility
      const lines = history.commands
        .map((cmd) => JSON.stringify(cmd))
        .join('\n');

      fs.writeFileSync(this.historyFilePath, lines + '\n', 'utf-8');
    } catch (error) {
      Logger.error(`Failed to save terminal history: ${error}`);
    }
  }

  public getHistoryFilePath(): string {
    return this.historyFilePath;
  }

  public setMaxCommandsInMemory(max: number): void {
    this.maxCommandsInMemory = max;
  }
}
