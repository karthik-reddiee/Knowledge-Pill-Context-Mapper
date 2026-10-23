# Phase 4 Technical Implementation Guide

## Architecture Overview

```
VS Code Workspace
      ↓
ProjectScanner.scan()
      ↓
├─ load package.json
├─ resolve dependencies
├─ load README
├─ git branch/status
├─ scan folder tree
└─ compute recent files
      ↓
project-snapshot.json
```

## Data Model

`ProjectSnapshot` includes:
- `workspace`: string
- `timestamp`: ISO 8601 timestamp
- `packageJson`: parsed `package.json` object
- `dependencies`: sorted list of dependency names
- `gitBranch`: current branch name
- `gitStatus`: short git status output
- `recentFiles`: list of 10 newest file paths
- `folderStructure`: nested `FolderNode`
- `readme`: README file content

`FolderNode` includes:
- `name`
- `type`: `file` or `folder`
- `path`
- `children`

## Code Flow

### ProjectScanner.scan()

1. Validate workspace folder exists
2. Load `package.json` if present
3. Extract dependency names
4. Determine Git branch and Git status
5. Read README content
6. Recursively walk workspace files and folders
7. Exclude configured patterns
8. Sort entries for stable tree output
9. Identify 10 most recently modified files
10. Save `project-snapshot.json`

### ScanProjectCommand.execute()

1. Display progress notification
2. Call `ProjectScanner.scan()`
3. Show success message
4. Log command completion

## Folder Tree Generation

- Traverses directories using `fs.promises.readdir`
- Uses `fs.Dirent` to distinguish folders and files
- Excludes ignored directories and files early
- Builds sorted children lists with folders before files
- Captures file modification time for recent-file ranking

## Exclude Pattern Matching

Patterns are resolved from `knowledge-pill.excludePatterns`.

Matching rules:
- Exact basename match excludes directory or file
- Any path segment containing the pattern is excluded
- Handles both filesystem separators and normalized `/`

## Git Metadata

- Git branch uses:
  - `git rev-parse --abbrev-ref HEAD`
- Git status uses:
  - `git status --short --branch`
- Both run in the workspace root
- Errors are logged and ignored if Git is unavailable

## Persistence

- Writes `project-snapshot.json` in workspace root
- Uses `JSON.stringify(snapshot, null, 2)` for readability
- Overwrites existing snapshot with fresh scan

## Error Handling

- Missing workspace folder throws a clear error
- Missing `package.json` or `README` is tolerated
- Failed Git lookups log warnings
- Directory read errors log warnings and continue

## Configuration Integration

- Reads `knowledge-pill.excludePatterns`
- Default excludes:
  - `node_modules`
  - `.git`
  - `dist`
  - `build`
  - `.DS_Store`

## Command Registration

`knowledge-pill.scanProject`
- Added to `package.json` commands
- Registered in extension activation
- Bound to command palette when workspace is open

---

## Resulting Output

A sample `project-snapshot.json` entry:

```json
{
  "workspace": "/Users/wallstreet62/Desktop/knowledge-pill",
  "timestamp": "2026-05-19T15:02:00.000Z",
  "packageJson": {
    "name": "knowledge-pill",
    "version": "0.1.0"
  },
  "dependencies": [
    "archiver"
  ],
  "gitBranch": "main",
  "gitStatus": "## main\n M README.md",
  "recentFiles": [
    "src/services/ProjectScanner.ts",
    "src/commands/ScanProjectCommand.ts"
  ],
  "folderStructure": {
    "name": "knowledge-pill",
    "type": "folder",
    "path": ".",
    "children": [ ... ]
  },
  "readme": "# Knowledge Pill\n..."
}
```
