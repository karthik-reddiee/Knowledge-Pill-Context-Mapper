# User Workflow

## Scenario

User starts building with AI.

AI may stop because:

- token limit
- timeout
- crash
- context overflow

Knowledge Pill should preserve progress.

---

## Flow

Step 1

User opens VS Code

↓

Step 2

AI begins coding

↓

Step 3

Knowledge Pill tracks activity

↓

Step 4

AI stops unexpectedly

↓

Step 5

AgentMonitor detects inactivity

↓

Step 6

Popup:

AI activity stopped

Export Knowledge Pill?

↓

Step 7

User clicks Export

↓

Step 8

Project snapshot generated (project-snapshot.json)

↓

Step 9

User uploads ZIP into another AI system

↓

Step 10

AI resumes immediately

---

## Phase 4

Knowledge Pill now scans the workspace and generates a structured application snapshot before export. This snapshot is stored in `project-snapshot.json` and includes project metadata, dependencies, Git context, recent files, and folder structure.

### Example Command

To manually trigger a workspace scan, use the following command in the Command Palette:

1. Open Command Palette (Cmd+Shift+P on macOS or Ctrl+Shift+P on Windows/Linux).
2. Type `Knowledge Pill: Scan Project` and press Enter.

Expected user effort:

Minimal

Everything should happen automatically.

---

## Phase 5

Knowledge Pill introduces the ability to generate a comprehensive knowledge summary from project activity logs, terminal commands, and snapshots. This feature outputs the following files:

- `project-summary.md`
- `completed-tasks.md`
- `pending-tasks.md`
- `current-status.md`
- `resume-instructions.md`

### Example Command

To generate a knowledge summary, use the following command in the Command Palette:

1. Open Command Palette (Cmd+Shift+P on macOS or Ctrl+Shift+P on Windows/Linux).
2. Type `Knowledge Pill: Generate Knowledge` and press Enter.

Expected user effort:

Minimal

The process is automated and provides immediate feedback.