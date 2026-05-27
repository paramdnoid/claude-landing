---
name: code-review
description: "Run a senior multi-agent code review over a path, diff or feature area."
argument-hint: "[scope: path, diff, branch, feature]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Agent Bash(git status *) Bash(git diff *) Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *)"
model: sonnet
effort: high
---


# Code Review

Review scope: `$ARGUMENTS`

1. Inspect current git diff and requested scope.
2. Run independent reviews with:
   - `senior-code-reviewer`
   - `typescript-strict-engineer`
   - `qa-a11y-performance-engineer`
   - `security-reviewer`
   - relevant specialist agents for React/Next/Tailwind/i18n/Three/GSAP.
3. Do not edit unless the user explicitly asked for fixes.
4. Return a severity-grouped review with exact file references and required validation.
