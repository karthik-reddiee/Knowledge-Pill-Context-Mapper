# 🧠 Knowledge Pill

> Portable AI session memory for developers.  
> Capture the complete context of AI-assisted development and continue work instantly across AI tools.

---

# Problem

Modern AI coding tools are powerful, but they lose context.

Developers use tools such as:

- Devin
- Antigravity
- Claude Code
- Cursor Agents
- GitHub Copilot Agent
- Cline
- Other autonomous coding systems

These tools frequently stop because of:

- token limits
- session expiration
- browser refreshes
- crashes
- tool restrictions
- context window limits

When this happens:

❌ project understanding disappears

❌ AI forgets completed work

❌ unfinished work becomes unclear

❌ prompts and reasoning disappear

❌ switching AI tools requires rebuilding context

Example:

```text
Devin builds:

✓ Login page
✓ Dashboard
✓ API structure

Session stops unexpectedly

Switch to Antigravity

Antigravity knows:

Nothing
```

Current tools preserve files.

They do not preserve AI working memory.

Knowledge Pill solves that problem.

---

# Vision

Knowledge Pill creates a portable memory package that stores the full state of AI-assisted development.

Instead of exporting only code:

Export:

- project understanding
- architecture decisions
- generated code
- completed tasks
- pending tasks
- prompts
- terminal actions
- workspace activity
- progress checkpoints
- resume instructions

Output:

```text
knowledge-pill.zip
```

Upload this package into another AI tool and continue immediately.

---

# Core Idea

```text
Developer
     ↓

AI Agent
     ↓

Knowledge Pill Extension
     ↓

Tracks activity continuously
     ↓

Creates structured project memory
     ↓

Exports ZIP package
     ↓

Upload to another AI
     ↓

Resume work instantly
```

---

# Main Goal

Build a production-ready VS Code extension that continuously records project activity and generates portable AI context.

---

# Project Objectives

Version 1 MVP:

✓ Track workspace activity

✓ Track terminal activity

✓ Track project structure

✓ Track git state

✓ Generate project summaries

✓ Detect AI inactivity

✓ Export portable ZIP package

---

# Key Features

---

## 1. Activity Tracking

Observe:

- file edits
- file creation
- file deletion
- file renames
- timestamps
- content previews

Purpose:

Reconstruct project evolution.

Output:

```text
activity-log.json
```

---

## 2. Terminal Tracking

Observe:

- npm commands
- git commands
- build commands
- run scripts

Examples:

```bash
npm install axios

npm run dev

git checkout auth-feature
```

Output:

```text
terminal-history.txt
```

Purpose:

Capture development actions.

---

## 3. Project Scanner

Generate workspace understanding.

Collect:

- package.json
- dependencies
- README
- recent files
- folder structure
- git status

Exclude:

```text
node_modules
.git
dist
build
```

Output:

```text
project-snapshot.json
```

---

## 4. AI Inactivity Detection

Detect:

- no edits
- no terminal activity
- no generated files

Threshold:

```text
5 minutes
```

Show popup:

```text
AI activity stopped

Export Knowledge Pill?
```

Buttons:

```text
Export

Ignore
```

---

## 5. Knowledge Builder

Transform logs into AI understanding.

Generate:

```text
project-summary.md

completed-tasks.md

pending-tasks.md

current-status.md

resume-instructions.md
```

Example:

```text
Current Project:

Building dashboard with authentication

Completed:

Login page

Pending:

API integration

Resume:

Continue work from Dashboard.tsx
```

---

## 6. ZIP Export

Generate:

```text
knowledge-pill-YYYY-MM-DD.zip
```

Contains:

```text
knowledge-pill/

project-summary.md

completed-tasks.md

pending-tasks.md

current-status.md

resume-instructions.md

terminal-history.txt

activity-log.json

project-snapshot.json

project-tree.txt
```

Purpose:

Portable AI memory package.

---

# User Workflow

Step 1:

User opens VS Code

↓

Step 2:

AI begins coding

↓

Step 3:

Knowledge Pill silently records activity

↓

Step 4:

AI stops unexpectedly

↓

Step 5:

Extension detects inactivity

↓

Step 6:

Popup appears

```text
AI activity stopped

Export Knowledge Pill?
```

↓

Step 7:

ZIP generated

↓

Step 8:

User uploads ZIP into another AI tool

↓

Step 9:

AI resumes work

---

# System Architecture

```text
VS Code Extension

      ↓

ActivityTracker

      ↓

TerminalTracker

      ↓

ProjectScanner

      ↓

KnowledgeBuilder

      ↓

AgentMonitor

      ↓

ZipExporter
```

---

# Project Structure

```text
knowledge-pill/

README.md

docs/

ARCHITECTURE.md
WORKFLOW.md
ROADMAP.md

FEATURE_ACTIVITY_TRACKER.md
FEATURE_TERMINAL_TRACKER.md
FEATURE_PROJECT_SCANNER.md
FEATURE_AGENT_MONITOR.md
FEATURE_KNOWLEDGE_BUILDER.md
FEATURE_ZIP_EXPORTER.md


src/

commands/

trackers/

services/

models/

utils/

extension.ts
```

---

# Development Strategy

Phase 1

Extension setup

Phase 2

Activity tracking

Phase 3

Terminal tracking

Phase 4

Project scanning

Phase 5

Knowledge generation

Phase 6

ZIP export

Phase 7

AI inactivity detection

Phase 8

Optimization

---

# Future Scope

V2

Prompt tracking

Track:

- user prompts
- AI prompts
- responses

---

V3

Git intelligence

Track:

- commits
- diffs
- checkpoints

---

V4

Semantic memory

Example:

```text
Where was authentication implemented?
```

---

V5

Knowledge completeness score

```text
Context completeness:

94%
```

---

# Tech Stack

VS Code Extension API

TypeScript

Node.js

Archiver

Git integration

File system API

Optional future:

SQLite

Embeddings

Local LLM

---

# Current Status

Project initialized

Next task:

Generate extension skeleton and implement base architecture

---

Built By

U. Karthik Reddy