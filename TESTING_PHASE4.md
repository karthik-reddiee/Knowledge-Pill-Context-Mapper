# Phase 4 Testing Guide - Project Scanning

## Objective

Verify the new workspace scanning functionality and the generated `project-snapshot.json` output.

---

## Pre-Test Setup

1. Build the project:
   ```bash
   cd /Users/wallstreet62/Desktop/knowledge-pill
   npm run compile
   ```

2. Remove old snapshot if present:
   ```bash
   rm -f project-snapshot.json
   ```

3. Launch the extension in Extension Development Host with F5.

---

## Test 1: Command Registration

**Goal**: Verify `Knowledge Pill: Scan Project` appears in the command palette.

Steps:
1. Open command palette: `Cmd+Shift+P`
2. Search for `Knowledge Pill: Scan Project`
3. Confirm command is visible

Expected:
- Command is present
- Command executes without immediate failure

---

## Test 2: Generate Snapshot

**Goal**: Ensure scanning produces a valid snapshot file.

Steps:
1. Run `Knowledge Pill: Scan Project`
2. Wait for completion notification
3. Verify `project-snapshot.json` exists in workspace root
4. Validate JSON format:
   ```bash
   python3 -c 'import json; json.load(open("project-snapshot.json"))'
   ```

Expected:
- File exists
- JSON parses successfully
- Contains `workspace`, `timestamp`, `folderStructure`, and `recentFiles`

---

## Test 3: Package JSON Extraction

**Goal**: Confirm dependency extraction from `package.json`.

Steps:
1. Ensure `package.json` exists in workspace root
2. Run `Knowledge Pill: Scan Project`
3. Open `project-snapshot.json`
4. Confirm `packageJson` is populated
5. Confirm `dependencies` includes known package names

Expected:
- `packageJson` is an object
- `dependencies` contains `archiver` and other listed packages

---

## Test 4: Git Metadata

**Goal**: Validate Git branch and status collection.

Steps:
1. Ensure workspace is a Git repository
2. Make a small working-tree change (e.g. edit README)
3. Run `Knowledge Pill: Scan Project`
4. Open `project-snapshot.json`
5. Confirm `gitBranch` matches current branch
6. Confirm `gitStatus` contains the short status output

Expected:
- `gitBranch` is not empty
- `gitStatus` contains branch and file status lines

---

## Test 5: Recent Files

**Goal**: Verify recent file selection works.

Steps:
1. Modify several files in the workspace
2. Run `Knowledge Pill: Scan Project`
3. Check `recentFiles` in the snapshot
4. Confirm the list contains recently modified file paths

Expected:
- Up to 10 files listed
- Newer files appear earlier in the list
- File paths are workspace-relative

---

## Test 6: Folder Structure

**Goal**: Validate folder tree generation.

Steps:
1. Run `Knowledge Pill: Scan Project`
2. Inspect `folderStructure`
3. Confirm top-level node path is `.`
4. Confirm directory children appear before files

Expected:
- `folderStructure` has nested children
- Folders sorted before files
- Paths are relative and stable

---

## Test 7: Exclude Patterns

**Goal**: Confirm ignore patterns are respected.

Steps:
1. Add a temporary ignored folder or file matching `knowledge-pill.excludePatterns`
2. Run `Knowledge Pill: Scan Project`
3. Confirm ignored entry is not present in `folderStructure`

Expected:
- `node_modules`, `.git`, `dist`, `build`, and `.DS_Store` are excluded
- Custom exclude patterns from settings are honored

---

## Test 8: Error Handling

**Goal**: Ensure scan proceeds gracefully when Git is unavailable.

Steps:
1. Use the project in a non-git directory or disable Git commands
2. Run `Knowledge Pill: Scan Project`
3. Confirm scan finishes and snapshot is written

Expected:
- No crash
- Snapshot still generated
- `gitBranch` and/or `gitStatus` may be undefined

---

## Cleanup

Remove the generated snapshot if needed:
```bash
rm -f project-snapshot.json
```

---

## Notes

- `project-snapshot.json` is intended as a workspace snapshot for future knowledge generation phases.
- The scan is intentionally read-only; no workspace files are modified.
