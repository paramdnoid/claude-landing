---
name: refactor-safely
description: "Refactor a module or component while preserving behavior, with before/after validation and independent review."
argument-hint: "[scope and goal]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Edit Write Agent Bash(git status *) Bash(git diff *) Bash(npm run typecheck) Bash(npm run lint) Bash(npm run test) Bash(npm run test -- *) Bash(npm run build)"
model: sonnet
effort: high
---


# Refactor Safely

Refactor: `$ARGUMENTS`

Rules:

1. Establish current behavior and tests before editing.
2. Keep scope narrow.
3. Do not combine feature work with refactor.
4. Preserve public APIs unless explicitly asked.
5. Use `typescript-strict-engineer` and `senior-code-reviewer`.
6. Run before/after validation if possible.
7. Return exact behavior-preservation evidence.
