---
name: i18n-audit
description: "Audit i18next/react-i18next localization for this Vite/React app: keys, fallbacks, routing, and type safety."
argument-hint: "[scope]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Agent Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *)"
model: sonnet
effort: high
---


# i18n Audit

Audit scope: `$ARGUMENTS`

Use `i18next-localization-engineer`.

Check:

- Hardcoded user-facing strings.
- Missing or inconsistent keys.
- Namespace loading.
- Plurals/interpolation.
- Router and browser translation boundaries.
- TypeScript i18n resource typing.
- Locale routing and fallback behavior.

Return findings with severity and exact files.
