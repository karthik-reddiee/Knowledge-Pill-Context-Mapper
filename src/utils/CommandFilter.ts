/**
 * Filters terminal commands to identify relevant ones
 * Captures npm, git, build, and script commands
 */

export class CommandFilter {
  // Patterns of relevant commands
  private relevantPrefixes = [
    'npm',
    'yarn',
    'pnpm',
    'git',
    'make',
    'gradle',
    'mvn',
    'dotnet',
    'node',
    'python',
    'go',
    'rust',
    'cargo',
    'docker',
  ];

  // Script patterns
  private scriptPatterns = [
    'build',
    'dev',
    'test',
    'start',
    'serve',
    'run',
    'deploy',
    'compile',
    'lint',
    'format',
    'check',
  ];

  /**
   * Check if a command is relevant and should be tracked
   */
  public isRelevant(command: string): boolean {
    if (!command || command.trim().length === 0) {
      return false;
    }

    const parts = command.trim().split(/\s+/);
    const firstPart = parts[0].toLowerCase();

    // Check if starts with relevant prefix
    for (const prefix of this.relevantPrefixes) {
      if (firstPart.startsWith(prefix)) {
        return true;
      }
    }

    // Check if contains script patterns
    for (const pattern of this.scriptPatterns) {
      if (command.toLowerCase().includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract command name for grouping
   */
  public getCommandType(command: string): string {
    const parts = command.trim().split(/\s+/);
    if (parts.length === 0) {
      return 'unknown';
    }

    const firstPart = parts[0].toLowerCase();

    // npm, yarn, etc.
    if (this.relevantPrefixes.includes(firstPart)) {
      // For npm/yarn, get the subcommand (install, run, etc.)
      if (firstPart === 'npm' || firstPart === 'yarn' || firstPart === 'pnpm') {
        return firstPart + ':' + (parts[1] || 'exec');
      }
      return firstPart;
    }

    // Check for script patterns
    for (const pattern of this.scriptPatterns) {
      if (command.toLowerCase().includes(pattern)) {
        return pattern;
      }
    }

    return firstPart;
  }

  /**
   * Sanitize command for logging (remove sensitive info)
   */
  public sanitize(command: string): string {
    // Remove API keys, tokens, passwords (basic patterns)
    let sanitized = command
      .replace(/--token\s+\S+/g, '--token [REDACTED]')
      .replace(/--password\s+\S+/g, '--password [REDACTED]')
      .replace(/--api-key\s+\S+/g, '--api-key [REDACTED]')
      .replace(/--secret\s+\S+/g, '--secret [REDACTED]');

    return sanitized;
  }

  /**
   * Extract main command and arguments
   */
  public parse(
    command: string
  ): { main: string; args: string[]; type: string } {
    const parts = command.trim().split(/\s+/);
    return {
      main: parts[0] || '',
      args: parts.slice(1),
      type: this.getCommandType(command),
    };
  }
}
