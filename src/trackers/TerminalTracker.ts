import * as vscode from 'vscode';
import { TerminalCommand } from '../models/TerminalCommand';
import { TerminalHistoryService } from '../services/TerminalHistoryService';
import { CommandFilter } from '../utils/CommandFilter';
import { Logger } from '../utils/Logger';

export class TerminalTracker {
  private disposables: vscode.Disposable[] = [];
  private commands: TerminalCommand[] = [];
  private isTracking: boolean = false;
  private lastCommandTime: number = 0;
  private historyService: TerminalHistoryService | null = null;
  private commandFilter: CommandFilter;
  private terminalExecutionIds = new Map<vscode.Terminal, string>();

  constructor() {
    this.commandFilter = new CommandFilter();
    this.initializeStorage();
    this.setupListeners();
  }

  private initializeStorage(): void {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspacePath = workspaceFolders[0].uri.fsPath;
      this.historyService = new TerminalHistoryService(workspacePath);
    }
  }

  private setupListeners(): void {
    // Track terminal opens
    const openDisposable = vscode.window.onDidOpenTerminal((terminal) =>
      this.onDidOpenTerminal(terminal)
    );
    this.disposables.push(openDisposable);

    // Track terminal closes
    const closeDisposable = vscode.window.onDidCloseTerminal((terminal) =>
      this.onDidCloseTerminal(terminal)
    );
    this.disposables.push(closeDisposable);

    Logger.info('Terminal tracker listeners registered');
  }

  private onDidOpenTerminal(terminal: vscode.Terminal): void {
    if (!this.isTracking) {
      return;
    }

    const terminalName = terminal.name || 'default';
    Logger.debug(`Terminal opened: ${terminalName}`);
    this.terminalExecutionIds.set(terminal, this.generateExecutionId());
  }

  private onDidCloseTerminal(terminal: vscode.Terminal): void {
    if (!this.isTracking) {
      return;
    }

    const terminalName = terminal.name || 'default';
    Logger.debug(`Terminal closed: ${terminalName}`);
    this.terminalExecutionIds.delete(terminal);
  }

  /**
   * Record a command execution
   * Called by external sources (terminal watchers, command interceptors)
   */
  public async recordCommand(command: TerminalCommand): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    // Filter for relevant commands
    if (!this.commandFilter.isRelevant(command.command)) {
      return;
    }

    // Sanitize command
    const sanitizedCommand: TerminalCommand = {
      ...command,
      command: this.commandFilter.sanitize(command.command),
    };

    this.commands.push(sanitizedCommand);
    this.lastCommandTime = Date.now();

    // Persist to storage
    if (this.historyService) {
      await this.historyService.appendCommand(sanitizedCommand);
    }

    Logger.debug(
      `Command recorded: ${sanitizedCommand.command} (${sanitizedCommand.terminal})`
    );
  }

  public async startTracking(): Promise<void> {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    this.lastCommandTime = Date.now();

    // Load existing commands from storage
    if (this.historyService) {
      const history = await this.historyService.loadTerminalHistory();
      this.commands = history.commands;
      Logger.debug(`Loaded ${this.commands.length} commands from storage`);
    } else {
      this.commands = [];
    }

    // Track existing terminals
    for (const terminal of vscode.window.terminals) {
      this.terminalExecutionIds.set(terminal, this.generateExecutionId());
    }

    Logger.info('Terminal tracking started');
  }

  public stopTracking(): void {
    this.isTracking = false;
    Logger.info('Terminal tracking stopped');
  }

  public getCommands(): TerminalCommand[] {
    return [...this.commands];
  }

  public getLastCommandTime(): number {
    return this.lastCommandTime;
  }

  public isActive(): boolean {
    return this.isTracking;
  }

  public clear(): void {
    this.commands = [];
    this.lastCommandTime = 0;
  }

  public getHistoryService(): TerminalHistoryService | null {
    return this.historyService;
  }

  public getCommandFilter(): CommandFilter {
    return this.commandFilter;
  }

  private generateExecutionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.stopTracking();
    this.terminalExecutionIds.clear();
  }
}
