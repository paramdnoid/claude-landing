---
name: create-component
description: "Create or upgrade a React/Next.js component with TypeScript, Tailwind, accessibility, i18n and tests where appropriate."
argument-hint: "[ComponentName] [purpose]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Edit Write Agent Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *)"
model: sonnet
effort: high
---


# Create Component

Create or improve component: `$ARGUMENTS`

Requirements:

1. Determine whether the component should be Server or Client.
2. If Client, keep the client boundary minimal.
3. Type props strictly.
4. Use Tailwind according to existing project conventions.
5. Add i18n keys for user-facing text.
6. Ensure keyboard and screenreader accessibility.
7. Add tests or document why not practical.
8. Run typecheck/lint/test/build if available.

Use `react-senior-engineer`, `typescript-strict-engineer`, `tailwind-design-system-engineer` and `i18next-localization-engineer` as needed.
