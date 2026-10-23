export interface TerminalCommand {
  command: string;
  timestamp: string;
  terminal: string;
  exitCode?: number;
}

export interface TerminalHistory {
  commands: TerminalCommand[];
  startTime: string;
  endTime?: string;
}
