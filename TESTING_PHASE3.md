# Phase 3 Testing Guide - Terminal Command Tracking

## Overview

This guide provides comprehensive testing procedures for the Terminal Tracking system implemented in Phase 3. All tests focus on command filtering, persistence, and integration with the Activity Monitor.

---

## Pre-Test Setup

### 1. Build Verification

```bash
cd /Users/wallstreet62/Desktop/knowledge-pill
npm run compile
```

Expected output:
```
✅ Compilation successful
✅ No errors or warnings
✅ webpack build: 56.7 KiB
✅ Exit code: 0
```

### 2. File Cleanup

Remove previous test files to start fresh:

```bash
rm -f terminal-history.txt activity-log.json
```

### 3. Launch Extension

Open VS Code in the workspace:

```bash
code /Users/wallstreet62/Desktop/knowledge-pill
```

Press `F5` to launch Extension Development Host (EDH).

---

## Test Suite 1: Command Recording

### Test 1.1: Basic Command Recording

**Objective**: Verify that relevant commands are recorded when executed

**Steps**:
1. Run Start Tracking command:
   - `Cmd+Shift+P` → `Knowledge Pill: Start Tracking`
   - Observe: "Knowledge Pill tracking started"

2. Open integrated terminal (`` Ctrl+` ``)

3. Execute a basic npm command:
   ```bash
   npm install axios
   ```

4. Wait 1 second

5. Check file:
   ```bash
   cat terminal-history.txt
   ```

**Expected Result**:
```json
{"command":"npm install axios","timestamp":"2026-05-19T14:20:00.000Z","terminal":"bash","exitCode":0}
```

**Verify**:
- ✅ Command is present in file
- ✅ Timestamp is ISO 8601 format
- ✅ Terminal name is recorded
- ✅ File is line-delimited JSON

---

### Test 1.2: Multiple Command Recording

**Objective**: Verify multiple commands are all recorded

**Steps**:
1. (From Test 1.1, tracking still active)

2. Execute several commands in sequence:
   ```bash
   npm run dev
   git add .
   git commit -m "test commit"
   npm run build
   ```

3. Wait 2 seconds

4. Check file again:
   ```bash
   cat terminal-history.txt
   ```

**Expected Result**:
```json
{"command":"npm install axios","timestamp":"2026-05-19T14:20:00.000Z","terminal":"bash","exitCode":0}
{"command":"npm run dev","timestamp":"2026-05-19T14:20:15.000Z","terminal":"bash","exitCode":0}
{"command":"git add .","timestamp":"2026-05-19T14:20:30.000Z","terminal":"bash","exitCode":0}
{"command":"git commit -m \"test commit\"","timestamp":"2026-05-19T14:20:45.000Z","terminal":"bash","exitCode":0}
{"command":"npm run build","timestamp":"2026-05-19T14:21:00.000Z","terminal":"bash","exitCode":0}
```

**Verify**:
- ✅ All 5 commands recorded
- ✅ Commands in correct order
- ✅ Each has unique timestamp
- ✅ No lines skipped

---

### Test 1.3: Irrelevant Commands Filtered

**Objective**: Verify that non-development commands are NOT recorded

**Steps**:
1. (From Test 1.2, tracking still active)

2. Execute commands that should NOT be tracked:
   ```bash
   ls -la
   cd src
   pwd
   echo "hello"
   cat file.txt
   ```

3. Wait 1 second

4. Count lines in file:
   ```bash
   wc -l terminal-history.txt
   ```

**Expected Result**:
- File still has 5 lines (from Test 1.2)
- No new lines added for the non-dev commands

**Verify**:
- ✅ ls, cd, pwd, echo, cat NOT recorded
- ✅ File line count unchanged (still 5)

---

### Test 1.4: Command Filtering by Type

**Objective**: Test all supported command types

**Steps**:
1. Stop tracking:
   ```
   Cmd+Shift+P → Knowledge Pill: Stop Tracking
   ```

2. Clear files:
   ```bash
   rm -f terminal-history.txt activity-log.json
   ```

3. Start tracking again:
   ```
   Cmd+Shift+P → Knowledge Pill: Start Tracking
   ```

4. Execute commands from each category:

   **Package managers**:
   ```bash
   npm install lodash
   yarn add express
   pnpm install react
   ```

   **Version control**:
   ```bash
   git status
   git branch -a
   git log --oneline
   ```

   **Build tools**:
   ```bash
   make build
   ./gradlew test
   dotnet build
   mvn clean install
   ```

   **Runtimes**:
   ```bash
   node script.js
   python main.py
   go run main.go
   ```

5. Wait 2 seconds

6. Check file:
   ```bash
   cat terminal-history.txt | wc -l
   ```

**Expected Result**:
- Approximately 12 commands recorded
- All commands from supported types present

**Verify**:
- ✅ npm commands recorded
- ✅ yarn commands recorded
- ✅ pnpm commands recorded
- ✅ git commands recorded
- ✅ make, gradle, dotnet, mvn recorded
- ✅ node, python, go recorded

---

## Test Suite 2: Command Sanitization

### Test 2.1: Token Removal

**Objective**: Verify sensitive tokens are redacted

**Steps**:
1. (Tracking should be active from Test 1.4)

2. Execute commands with various secrets:
   ```bash
   npm login --token abc123def456xyz
   npm login --api-key secret-api-key-123
   git clone https://token:password@github.com/user/repo.git
   docker login --username myuser --password mypass123
   npm config set authToken eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
   ```

3. Check file:
   ```bash
   cat terminal-history.txt | tail -5
   ```

**Expected Result**:
All sensitive values should be replaced with `[REDACTED]`:
```json
{"command":"npm login --token [REDACTED]","timestamp":"...","terminal":"bash","exitCode":0}
{"command":"npm login --api-key [REDACTED]","timestamp":"...","terminal":"bash","exitCode":0}
{"command":"git clone https://[REDACTED]","timestamp":"...","terminal":"bash","exitCode":0}
{"command":"docker login --username myuser --password [REDACTED]","timestamp":"...","terminal":"bash","exitCode":0}
```

**Verify**:
- ✅ `--token` values replaced
- ✅ `--api-key` values replaced
- ✅ `--password` values replaced
- ✅ `--secret` values replaced (if present)

---

### Test 2.2: Command Structure Preserved

**Objective**: Verify non-sensitive parts are preserved

**Steps**:
1. (From Test 2.1)

2. Check a sanitized command:
   ```bash
   cat terminal-history.txt | grep "npm login" | head -1
   ```

**Example from file**:
```json
{"command":"npm login --token [REDACTED]","timestamp":"2026-05-19T14:25:00.000Z","terminal":"bash","exitCode":0}
```

**Verify**:
- ✅ `npm login` prefix is intact
- ✅ `--token` flag is intact
- ✅ Only the value is redacted
- ✅ Command is still parseable

---

## Test Suite 3: Memory Management

### Test 3.1: Command Count in Status

**Objective**: Verify status command shows accurate count

**Steps**:
1. (From Test 2.2, after many commands executed)

2. Check status:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```

3. Observe status message showing command count:
   ```
   Knowledge Pill Status:
   - Activity Tracker: Active (N recorded)
   - Terminal Tracker: Active (M recorded)
   - Agent Monitor: Active (inactivity: X.Xs)
   ```

4. Verify the count matches file:
   ```bash
   wc -l terminal-history.txt
   ```

**Expected Result**:
- Status shows correct command count
- Count matches line count in file

**Verify**:
- ✅ Count accurate
- ✅ Terminal Tracker shows "Active"

---

### Test 3.2: Auto-Trimming (Simulation)

**Objective**: Verify auto-trim activates at 500 commands

**Steps**:

1. Stop tracking and clear:
   ```bash
   # Cmd+Shift+P → Stop Tracking
   rm -f terminal-history.txt
   ```

2. Start tracking again

3. Create test script to generate many commands:
   ```bash
   for i in {1..550}; do
     npm run test 2>/dev/null || true
   done
   ```

   (This will execute npm commands in rapid succession)

4. Wait for completion

5. Check file line count:
   ```bash
   wc -l terminal-history.txt
   ```

**Expected Result**:
- Line count ≤ 500 (not 550)
- File exists and is readable
- Newest commands preserved

**Verify**:
- ✅ File has ≤ 500 lines
- ✅ No corruption
- ✅ Oldest commands removed (FIFO)

---

## Test Suite 4: Persistence

### Test 4.1: Load on Startup

**Objective**: Verify commands are loaded from file when tracking starts

**Steps**:
1. (From previous tests, terminal-history.txt should have commands)

2. Note current command count:
   ```bash
   wc -l terminal-history.txt
   ```
   Example: `42`

3. Check status:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```
   Verify it shows same count as file

4. Stop tracking:
   ```
   Cmd+Shift+P → Knowledge Pill: Stop Tracking
   ```

5. Start tracking again:
   ```
   Cmd+Shift+P → Knowledge Pill: Start Tracking
   ```

6. Check status immediately:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```

**Expected Result**:
- Status still shows 42 recorded commands
- Previous commands were loaded from file

**Verify**:
- ✅ Commands loaded on startup
- ✅ Count preserved across stop/start
- ✅ In-memory array populated

---

### Test 4.2: File Format Integrity

**Objective**: Verify file stays valid and readable

**Steps**:
1. (From Test 4.1)

2. Parse and validate file:
   ```bash
   python3 << 'EOF'
   import json
   with open('terminal-history.txt', 'r') as f:
       lines = f.readlines()
       for i, line in enumerate(lines):
           try:
               obj = json.loads(line.strip())
               assert 'command' in obj
               assert 'timestamp' in obj
               assert 'terminal' in obj
           except Exception as e:
               print(f"Line {i}: Invalid - {e}")
               exit(1)
   print(f"✅ All {len(lines)} lines are valid JSON")
   EOF
   ```

**Expected Result**:
```
✅ All 42 lines are valid JSON
```

**Verify**:
- ✅ File is valid line-delimited JSON
- ✅ Each line has required fields
- ✅ No corruption detected

---

## Test Suite 5: Integration with Activity Monitor

### Test 5.1: Activity Clock Reset

**Objective**: Verify terminal activity resets inactivity timer

**Steps**:
1. Clean start - remove files and restart:
   ```bash
   rm -f terminal-history.txt activity-log.json
   code /Users/wallstreet62/Desktop/knowledge-pill
   ```

2. Press F5 to launch Extension Development Host

3. Start tracking:
   ```
   Cmd+Shift+P → Knowledge Pill: Start Tracking
   ```

4. Get initial status:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```
   Note the inactivity value (should be near 0)

5. Wait 3 seconds (do nothing)

6. Check status again:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```
   Note the inactivity value (should be ~3s)

7. Execute a command:
   ```bash
   npm install lodash
   ```

8. Check status immediately:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```
   Note the inactivity value (should be close to 0 again)

**Expected Result**:
Inactivity durations:
1. Initial: ~0s
2. After 3s wait: ~3s
3. After command: ~0s

**Verify**:
- ✅ Inactivity increases over time
- ✅ Terminal command resets timer
- ✅ AgentMonitor integration working

---

### Test 5.2: Multiple Activity Sources

**Objective**: Verify terminal and file activity both reset timer

**Steps**:
1. (From Test 5.1)

2. Wait 2 seconds

3. Check status:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```
   Note: inactivity ~2s

4. Create a new file:
   ```bash
   touch test-file.md
   ```

5. Check status:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```
   Note: inactivity close to 0 (file activity reset it)

6. Wait 2 seconds

7. Execute command:
   ```bash
   npm run dev
   ```

8. Check status:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```
   Note: inactivity close to 0 (terminal activity reset it)

**Expected Result**:
- File activity resets timer
- Terminal activity resets timer
- Both are integrated into AgentMonitor

**Verify**:
- ✅ File and terminal activity synchronized
- ✅ AgentMonitor sees both types

---

## Test Suite 6: Edge Cases

### Test 6.1: Terminal Without Name

**Objective**: Verify handling of unnamed terminals

**Steps**:
1. (Tracking should be active)

2. Open a new terminal:
   ```
   Cmd+Shift+` (backtick) - or use Terminal menu
   ```

3. Execute a command:
   ```bash
   npm list
   ```

4. Check file:
   ```bash
   cat terminal-history.txt | tail -1
   ```

**Expected Result**:
The terminal field should be either terminal name or "default":
```json
{"command":"npm list","timestamp":"...","terminal":"bash","exitCode":0}
```

**Verify**:
- ✅ Command recorded even for unnamed terminal
- ✅ Terminal name or "default" assigned

---

### Test 6.2: Empty Command

**Objective**: Verify empty commands are handled

**Steps**:
1. (Tracking active)

2. Press Enter in terminal without typing:
   ```bash
   
   ```

3. Check file:
   ```bash
   wc -l terminal-history.txt
   ```

**Expected Result**:
- Line count unchanged
- Empty command not recorded

**Verify**:
- ✅ Empty commands filtered out
- ✅ File not modified

---

### Test 6.3: Very Long Command

**Objective**: Verify long commands are handled

**Steps**:
1. (Tracking active)

2. Execute a long command:
   ```bash
   npm install --save-exact lodash underscore moment async uuid cheerio axios express fastify koa nestjs react vue angular svelte
   ```

3. Check file:
   ```bash
   cat terminal-history.txt | tail -1 | wc -c
   ```

**Expected Result**:
- Full command recorded (no truncation)
- File readable and valid

**Verify**:
- ✅ Long commands fully preserved
- ✅ No truncation applied

---

### Test 6.4: Special Characters

**Objective**: Verify commands with quotes and special chars

**Steps**:
1. (Tracking active)

2. Execute commands with special characters:
   ```bash
   git commit -m "fix: add feature to module"
   npm run script -- --option "value with spaces"
   echo "test" > file.txt
   ```

3. Check file:
   ```bash
   cat terminal-history.txt | tail -3
   ```

**Expected Result**:
Commands should be properly JSON-escaped:
```json
{"command":"git commit -m \"fix: add feature to module\"","timestamp":"...","terminal":"bash","exitCode":0}
```

**Verify**:
- ✅ Quotes properly escaped
- ✅ Special characters preserved
- ✅ JSON remains valid

---

## Test Suite 7: Performance

### Test 7.1: File I/O Response Time

**Objective**: Verify command recording doesn't block UI

**Steps**:
1. (Tracking active)

2. Execute many commands rapidly:
   ```bash
   for i in {1..20}; do npm list > /dev/null 2>&1; done
   ```

3. Monitor extension:
   - Extension should remain responsive
   - No freezing observed
   - Commands still recorded

4. Check file:
   ```bash
   wc -l terminal-history.txt
   ```

**Expected Result**:
- All commands recorded
- UI remains responsive
- No lag/freezing

**Verify**:
- ✅ Performance acceptable
- ✅ No blocking operations

---

### Test 7.2: Large File Handling

**Objective**: Verify performance with large history

**Steps**:
1. Populate file with 500 commands (from Test 3.2 or manually)

2. Restart extension (close and reopen EDH)

3. Check status:
   ```
   Cmd+Shift+P → Knowledge Pill: Get Status
   ```

4. Observe: Should load and display count quickly

**Expected Result**:
- File loads in < 100ms
- Status command completes in < 200ms
- No timeout

**Verify**:
- ✅ Large files handled efficiently
- ✅ Startup time acceptable

---

## Cleanup & Reporting

### Final Verification Checklist

- ✅ All 7 test suites passed
- ✅ Command recording works
- ✅ Filtering accurate
- ✅ Sanitization removes secrets
- ✅ Persistence reliable
- ✅ Integration working
- ✅ Edge cases handled
- ✅ Performance acceptable

### Generate Test Report

```bash
cd /Users/wallstreet62/Desktop/knowledge-pill

# Collect final state
echo "=== Phase 3 Testing Report ===" > TESTING_PHASE3_RESULTS.txt
echo "Timestamp: $(date)" >> TESTING_PHASE3_RESULTS.txt
echo "" >> TESTING_PHASE3_RESULTS.txt
echo "Terminal History File:" >> TESTING_PHASE3_RESULTS.txt
echo "Lines: $(wc -l < terminal-history.txt)" >> TESTING_PHASE3_RESULTS.txt
echo "Size: $(du -h terminal-history.txt | cut -f1)" >> TESTING_PHASE3_RESULTS.txt
echo "" >> TESTING_PHASE3_RESULTS.txt
echo "Sample commands:" >> TESTING_PHASE3_RESULTS.txt
head -3 terminal-history.txt >> TESTING_PHASE3_RESULTS.txt

echo "" >> TESTING_PHASE3_RESULTS.txt
echo "✅ Phase 3 Testing Complete" >> TESTING_PHASE3_RESULTS.txt

cat TESTING_PHASE3_RESULTS.txt
```

---

## Troubleshooting

### Issue: Commands not recording

**Check**:
1. Is tracking active? Run status command
2. Is file writable? Check permissions:
   ```bash
   ls -la terminal-history.txt
   ```
3. Check logs for errors:
   ```bash
   # In Extension Development Host console
   ```

### Issue: Incorrect command count

**Check**:
1. File format is line-delimited JSON
2. Each line is valid JSON:
   ```bash
   python3 -c "import json; [json.loads(line) for line in open('terminal-history.txt')]"
   ```

### Issue: Performance slow

**Check**:
1. File size:
   ```bash
   du -h terminal-history.txt
   ```
2. If > 1MB, auto-trim may not be working correctly
3. Check for lock issues:
   ```bash
   lsof terminal-history.txt
   ```

---

**Phase 3 Testing Guide: Complete ✅**
