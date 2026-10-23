# Activity Tracker Specification

## Goal

Continuously observe workspace file activity.

---

## Track

- file edits
- file creation
- file deletion
- rename events
- timestamps
- change previews

---

## VS Code APIs

workspace.onDidChangeTextDocument

workspace.onDidCreateFiles

workspace.onDidDeleteFiles

workspace.onDidRenameFiles

---

## Output

activity-log.json

Example:

```json
{
  "file":"Dashboard.tsx",
  "event":"modified",
  "timestamp":"2026-05-19T10:20",
  "preview":"added login button"
}
```

Requirements:

Append continuously

Keep memory efficient