---
name: team-plan
description: "Create a Vite/React frontend implementation plan with specialist assignments and validation, without editing files."
argument-hint: "[task]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Agent Bash(git status *) Bash(git diff *)"
model: opus
effort: high
---


# Team Plan

Plan the task: `$ARGUMENTS`

1. Read `CLAUDE.md` and `.claude/docs/agent-collaboration-protocol.md`.
2. Inspect project structure, package scripts and relevant existing patterns.
3. Use `docs-research-librarian` if the task depends on version-sensitive behavior.
4. Use `team-lead-orchestrator` to split work into independent workstreams.
5. Do not edit files.
6. Return:
   - objective
   - acceptance criteria
   - relevant agents
   - files likely touched
   - implementation steps
   - validation plan
   - risks and assumptions
