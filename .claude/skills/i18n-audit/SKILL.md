---
name: i18n-audit
description: "Audit i18next/react-i18next/Next.js localization setup, translation keys, namespaces, SSR/client boundaries and type safety."
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
- Server/client translation boundaries.
- TypeScript i18n resource typing.
- Locale routing and fallback behavior.

Return findings with severity and exact files.
