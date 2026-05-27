---
name: validate-quality
description: "Run project quality gates: typecheck, lint, tests and build where available, then summarize failures and fixes."
argument-hint: "[optional scope]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Bash(git status *) Bash(git diff *) Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *) Agent"
model: sonnet
effort: high
---


# Validate Quality

Validate scope: `$ARGUMENTS`

1. Inspect `package.json` scripts.
2. Run available checks in this order when present:
   - typecheck
   - lint
   - test:ci or test
   - build
   - test:e2e
3. If a check fails, diagnose the failure and propose or implement fixes depending on user request.
4. Use `qa-a11y-performance-engineer` for independent validation if code changed.
5. Return exact commands and results.
