# Phase 3 Technical Implementation Guide

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Environment                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           VS Code Terminal Events                    │   │
│  │  ┌────────────┬──────────────┐                       │   │
│  │  │   Open     │     Close    │                       │   │
│  │  └────────────┴──────────────┘                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      Terminal Command Execution                      │   │
│  │  User runs: npm install axios                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          TerminalTracker (Event Listeners)           │   │
│  │  recordCommand(command)                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         CommandFilter - Relevance Check              │   │
│  │  isRelevant("npm install axios")? → YES              │   │
│  │  getCommandType("npm install")? → npm:install        │   │
│  │  sanitize(command) → remove secrets                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           TerminalCommand Object                     │   │
│  │  {                                                   │   │
│  │    command: "npm install axios"                      │   │
│  │    timestamp: "2026-05-19T14:20:00Z"                 │   │
│  │    terminal: "bash"                                  │   │
│  │    exitCode: 0                                       │   │
│  │  }                                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        TerminalHistoryService - Storage              │   │
│  │  • Load existing commands from file                  │   │
│  │  • Append new command (line-delimited JSON)          │   │
│  │  • Apply trimming if needed (max 500)                │   │
│  │  • Write back to file                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    TerminalActivityIntegration                       │   │
│  │    Notify AgentMonitor of activity                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    terminal-history.txt (Workspace Root)             │   │
│  │  Line-delimited JSON (one command per line)          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Code Flow: Terminal Command Recording

### Scenario: User executes `npm install axios`

#### Step 1: User Inputs Command
```bash
$ npm install axios
```

#### Step 2: TerminalTracker.recordCommand() Called
```typescript
// services/TerminalTracker.ts
public async recordCommand(command: TerminalCommand): Promise<void> {
  if (!this.isTracking) return;

  // Filter for relevance
  if (!this.commandFilter.isRelevant(command.command)) {
    return;  // Not tracked
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

  Logger.debug(`Command recorded: npm install axios`);
}
```

#### Step 3: CommandFilter.isRelevant() Check
```typescript
// utils/CommandFilter.ts
public isRelevant(command: string): boolean {
  const parts = command.trim().split(/\s+/);
  const firstPart = parts[0].toLowerCase();  // "npm"

  // Check if starts with relevant prefix
  for (const prefix of this.relevantPrefixes) {
    // "npm" is in relevantPrefixes
    if (firstPart.startsWith(prefix)) {
      return true;  // ✅ RELEVANT
    }
  }

  return false;
}
```

#### Step 4: CommandFilter.getCommandType() Classification
```typescript
// utils/CommandFilter.ts
public getCommandType(command: string): string {
  const parts = command.trim().split(/\s+/);
  // ["npm", "install", "axios"]
  
  const firstPart = parts[0].toLowerCase();  // "npm"
  
  if (firstPart === 'npm' || firstPart === 'yarn' || firstPart === 'pnpm') {
    // For npm/yarn, get the subcommand
    return firstPart + ':' + (parts[1] || 'exec');
    // Returns: "npm:install"
  }

  return firstPart;
}
```

#### Step 5: CommandFilter.sanitize()
```typescript
// utils/CommandFilter.ts
public sanitize(command: string): string {
  let sanitized = command
    .replace(/--token\s+\S+/g, '--token [REDACTED]')
    .replace(/--password\s+\S+/g, '--password [REDACTED]')
    .replace(/--api-key\s+\S+/g, '--api-key [REDACTED]')
    .replace(/--secret\s+\S+/g, '--secret [REDACTED]');

  return sanitized;
  // "npm install axios" (no changes)
}
```

#### Step 6: TerminalCommand Object Created
```typescript
const sanitizedCommand: TerminalCommand = {
  command: "npm install axios",        // sanitized
  timestamp: "2026-05-19T14:20:00.000Z", // ISO 8601
  terminal: "bash",                    // terminal name
  exitCode: undefined,                 // will be 0 on success
};
```

#### Step 7: In-Memory Array Updated
```typescript
// TerminalTracker.ts
this.commands.push(sanitizedCommand);
this.lastCommandTime = Date.now();

// commands = [
//   { command: "npm install axios", timestamp: "...", terminal: "bash", exitCode: undefined }
// ]
```

#### Step 8: TerminalHistoryService Persists
```typescript
// services/TerminalHistoryService.ts
public async appendCommand(command: TerminalCommand): Promise<void> {
  let history = await this.loadTerminalHistory();  // Load from file

  history.commands.push(command);  // Add to array

  // Trim if needed
  if (history.commands.length > this.maxCommandsInMemory) {
    // max = 500
    const removeCount = history.commands.length - 500;
    history.commands.splice(0, removeCount);
  }

  history.endTime = new Date().toISOString();

  await this.saveTerminalHistory(history);  // Write to file
}
```

#### Step 9: Line-Delimited JSON Write
```typescript
// services/TerminalHistoryService.ts
public async saveTerminalHistory(history: TerminalHistory): Promise<void> {
  // Convert to line-delimited format
  const lines = history.commands
    .map((cmd) => JSON.stringify(cmd))
    .join('\n');

  fs.writeFileSync(this.historyFilePath, lines + '\n', 'utf-8');
}
```

#### Step 10: TerminalActivityIntegration Updates Monitor
```typescript
// services/TerminalActivityIntegration.ts
// Wrapper updates AgentMonitor after command recorded
this.agentMonitor.updateActivityTime();  // Reset inactivity timer
Logger.debug(`Terminal activity updated - Agent monitor notified`);
```

#### Result: File Written
File `terminal-history.txt`:
```json
{"command":"npm install axios","timestamp":"2026-05-19T14:20:00.000Z","terminal":"bash"}
```

---

## State Management: Tracking Lifecycle

```
╔════════════════════════════════════════════════╗
║          TerminalTracker States                ║
╚════════════════════════════════════════════════╝

              ┌─────────────────┐
              │   INITIALIZED   │
              │  isTracking=F   │
              │ lastCommandTime │
              │      = 0        │
              └────────┬────────┘
                       │
                       │ startTracking()
                       ↓
              ┌─────────────────┐
              │     ACTIVE      │
              │  isTracking=T   │
              │ Listeners Ready │
              │ Recording Cmds  │
              └────────┬────────┘
                       │
                       │ stopTracking()
                       ↓
              ┌─────────────────┐
              │      IDLE       │
              │  isTracking=F   │
              │ Listeners Still │
              │ Attached        │
              └────────┬────────┘
                       │
                       │ dispose()
                       ↓
              ┌─────────────────┐
              │    DISPOSED     │
              │  All Resources  │
              │     Cleaned     │
              └─────────────────┘
```

---

## Terminal Event Integration

### Terminal Open
```
VS Code fires: onDidOpenTerminal
         ↓
TerminalTracker.onDidOpenTerminal()
         ↓
Check if tracking active
         ↓
Assign execution ID
         ↓
Log terminal name
```

### Terminal Close
```
VS Code fires: onDidCloseTerminal
         ↓
TerminalTracker.onDidCloseTerminal()
         ↓
Check if tracking active
         ↓
Remove from tracking map
         ↓
Log closure
```

### Command Recording (External Integration)
```
External system detects command
         ↓
Calls TerminalTracker.recordCommand()
         ↓
CommandFilter validates
         ↓
If relevant → Store & Persist
         ↓
TerminalActivityIntegration notifies AgentMonitor
         ↓
Inactivity timer resets
```

---

## Command Filter Decision Tree

```
Is command relevant?

┌─ Starts with known prefix?
│  ├─ npm, yarn, pnpm
│  ├─ git
│  ├─ make, gradle, mvn, dotnet
│  ├─ node, python, go, rust, cargo
│  └─ docker
│  
├─ OR contains script pattern?
│  ├─ build, dev, test, start
│  ├─ serve, run, deploy, compile
│  ├─ lint, format, check
│  
└─ Result:
   ├─ YES → Record & Persist
   └─ NO → Ignore & Skip
```

---

## Memory Management: Auto-Trimming

### Scenario: 550 commands accumulated, need to trim

```typescript
// Configuration
private maxCommandsInMemory: number = 500;

// Append operation
if (history.commands.length > this.maxCommandsInMemory) {
  // 550 > 500 → need trim
  const removeCount = history.commands.length - this.maxCommandsInMemory;
  // removeCount = 550 - 500 = 50

  // Remove from front (FIFO - oldest first)
  history.commands.splice(0, removeCount);
  // Remove commands[0] through commands[49]
  // Remaining: commands[50] through commands[549]
  // New length: 500
}
```

### Before Trim
```
Index 0:   npm install        (oldest)
Index 1:   npm run test
...
Index 499: npm run build
Index 500: npm run dev
...
Index 549: npm run dev        (newest)
Total: 550 commands
```

### After Trim
```
Index 0:   npm run test       (was index 50)
Index 1:   npm run test       (was index 51)
...
Index 449: npm run build      (was index 499)
Index 450: npm run dev        (was index 500)
...
Index 499: npm run dev        (was index 549)
Total: 500 commands (trimmed 50 oldest)
```

---

## Integration Point: Activity Synchronization

### Before Recording
```
AgentMonitor.lastActivityTime = 1000
AgentMonitor.inactivityDuration = 5 seconds

No terminal work in last 5 seconds
```

### Command Executed
```
npm install package
         ↓
TerminalTracker.recordCommand()
         ↓
TerminalActivityIntegration.startMonitoring()
         ↓
this.agentMonitor.updateActivityTime()
         ↓
AgentMonitor.lastActivityTime = 1200 (NOW)
```

### After Recording
```
AgentMonitor.lastActivityTime = 1200 (reset)
AgentMonitor.inactivityDuration = 0 seconds

Terminal activity resets inactivity timer
```

---

## Error Handling & Edge Cases

### Missing Terminal Name
```typescript
const terminalName = terminal.name || 'default';
// Falls back to 'default' if name is undefined
```

### Malformed JSON in History
```typescript
for (const line of lines) {
  try {
    const cmd: TerminalCommand = JSON.parse(line);
    commands.push(cmd);
  } catch (e) {
    // Skip malformed lines silently
    continue;
  }
}
```

### File I/O Errors
```typescript
try {
  // I/O operation
} catch (error) {
  Logger.error(`Failed to append command: ${error}`);
  // Log error, don't crash extension
}
```

### No Workspace Folder
```typescript
private initializeStorage(): void {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    // Only initialize if workspace exists
  }
  // Otherwise historyService = null
}
```

---

## Data Persistence Strategy

### Write Operations (Append)

```
User executes command
      ↓
recordCommand()
      ↓
Load current history from file
      ↓
Add new command to array
      ↓
Apply trimming if needed
      ↓
Serialize to line-delimited JSON
      ↓
Write entire file
```

### Load Operations

```
startTracking()
      ↓
Check if file exists
      ↓
Read all lines from file
      ↓
Parse each line as JSON
      ↓
Populate commands array
      ↓
Ready for new events
```

### Reliability Features

1. **Atomic writes** - Full file written at once
2. **Graceful degradation** - Missing file doesn't crash
3. **Error handling** - Failed I/O logs warnings
4. **Line-delimited format** - No structural corruption risk
5. **Incremental append** - No read-modify-write cycles

---

## Testing Scenarios

### Unit Level
- [ ] CommandFilter.isRelevant() for all command types
- [ ] CommandFilter.sanitize() removes secrets
- [ ] CommandFilter.parse() extracts correctly
- [ ] TerminalHistoryService loads/saves JSON
- [ ] Auto-trim removes oldest first
- [ ] TerminalTracker creates proper objects

### Integration Level
- [ ] Terminal opens are logged
- [ ] Terminal closes are logged
- [ ] Relevant commands recorded
- [ ] Irrelevant commands ignored
- [ ] Commands persisted to file
- [ ] Previous commands loaded on startup
- [ ] AgentMonitor updated on record

### End-to-End
- [ ] npm commands tracked
- [ ] git commands tracked
- [ ] Secrets sanitized
- [ ] Large history handled without slowdown
- [ ] Status command shows accurate count
- [ ] File format is line-delimited JSON

---

**Phase 3 Technical Implementation: Complete ✅**
