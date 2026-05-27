---
name: implement-feature
description: "Implement a feature with specialist-agent coordination, official-doc checks, quality gates and final review."
argument-hint: "[feature description]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Edit Write Agent Bash(git status *) Bash(git diff *) Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *)"
model: sonnet
effort: high
---


# Implement Feature

Implement: `$ARGUMENTS`

Follow this process:

1. Create a brief plan and identify which agents are needed.
2. Delegate domain-specific analysis to specialists before editing.
3. If the task touches Next.js App Router, Tailwind v4, i18n, Three.js or GSAP APIs that may have changed, ask `docs-research-librarian` for current official guidance.
4. Edit only after the plan is coherent.
5. Keep changes minimal and file ownership clear.
6. Run available validation scripts.
7. Invoke `senior-code-reviewer` plus relevant specialist reviewer(s).
8. Fix findings or explicitly document why they are not applicable.
9. Final response must include files changed, validation commands, result and remaining risks.
