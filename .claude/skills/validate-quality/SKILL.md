---
name: validate-quality
description: "Run full project quality gates: typecheck, lint, tests, build and E2E where available, then summarize failures and fixes."
argument-hint: "[optional scope]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Bash(git status *) Bash(git diff *) Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *) Agent"
model: sonnet
effort: high
---


# Validate Quality

Validate scope: `$ARGUMENTS`

1. Inspect `package.json` scripts.
2. Run the full validation set in this order when present:
   - typecheck
   - lint
   - test:ci or test
   - build
   - test:e2e
3. Treat `test:e2e` as required for release validation and browser-visible changes, even though the automatic Stop hook only runs fast gates.
4. If a check fails, diagnose the failure and propose or implement fixes depending on user request.
5. Use `qa-a11y-performance-engineer` for independent validation if code changed.
6. Return exact commands and results.
