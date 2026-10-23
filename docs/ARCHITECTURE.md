# Knowledge Pill Architecture

## Goal

Knowledge Pill captures the full state of an AI-assisted development session and packages it into a portable format that another AI system can continue.

---

## High-Level Flow

```text
Developer
    ↓
AI Agent
    ↓
VS Code Extension
    ↓
Track Workspace Activity
    ↓
Track Terminal Activity
    ↓
Build Knowledge Context
    ↓
Generate Structured Memory
    ↓
Create ZIP
    ↓
Upload into next AI
```

---

## Core Components

### ActivityTracker

Responsibilities:

- track file edits
- track file creation
- track deletion
- record timestamps
- record content preview

Output:

activity-log.json

---

### TerminalTracker

Responsibilities:

- monitor terminal sessions
- track executed commands
- store timestamps

Output:

terminal-history.txt

---

### ProjectScanner

Responsibilities:

- scan workspace structure
- collect package.json
- collect dependencies
- collect git status
- collect recent files

Output:

project-snapshot.json

---

### AgentMonitor

Responsibilities:

Detect inactivity:

- no edits
- no terminal actions
- no generated files

Output:

popup notification

---

### KnowledgeBuilder

Responsibilities:

Convert raw logs into AI-friendly understanding.

Generate:

project-summary.md

completed-tasks.md

pending-tasks.md

current-status.md

resume-instructions.md

---

### ZipExporter

Responsibilities:

Bundle all generated files into:

knowledge-pill.zip