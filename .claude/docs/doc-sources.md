# Official Documentation Sources

Audited for this setup on 2026-05-27. Agents must prefer current official docs over memory when making framework-specific decisions.

## Claude Code

- Agent teams: https://code.claude.com/docs/en/agent-teams
- Subagents: https://code.claude.com/docs/en/sub-agents
- Skills / slash commands: https://code.claude.com/docs/en/skills
- Hooks: https://code.claude.com/docs/en/hooks
- Settings: https://code.claude.com/docs/en/settings
- Tools reference: https://code.claude.com/docs/en/tools-reference
- Agent SDK subagents: https://code.claude.com/docs/en/agent-sdk/subagents
- Agent SDK skills: https://code.claude.com/docs/en/agent-sdk/skills
- Agent SDK hooks: https://code.claude.com/docs/en/agent-sdk/hooks

## Frontend Stack

- React docs: https://react.dev/
- React Rules of Hooks: https://react.dev/reference/rules/rules-of-hooks
- React purity rules: https://react.dev/reference/rules/components-and-hooks-must-be-pure
- Vite docs: https://vite.dev/guide/
- React Router docs: https://reactrouter.com/
- Next.js App Router docs: https://nextjs.org/docs/app
- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js TypeScript config: https://nextjs.org/docs/app/api-reference/config/typescript
- Tailwind CSS docs: https://tailwindcss.com/docs
- Tailwind CSS theme variables: https://tailwindcss.com/docs/theme
- Tailwind CSS v4 upgrade guide: https://tailwindcss.com/docs/upgrade-guide
- TypeScript docs: https://www.typescriptlang.org/docs/
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- i18next docs: https://www.i18next.com/
- i18next TypeScript docs: https://www.i18next.com/overview/typescript
- react-i18next docs: https://react.i18next.com/
- react-i18next `useTranslation`: https://react.i18next.com/latest/usetranslation-hook
- react-i18next SSR / Next.js: https://react.i18next.com/latest/ssr
- next-i18next: https://github.com/i18next/next-i18next
- three.js docs: https://threejs.org/docs/
- three.js manual: https://threejs.org/manual/
- GSAP docs: https://gsap.com/docs/v3/
- GSAP React guide: https://gsap.com/resources/React/

## Documentation Research Rules

1. Use official docs first.
2. Use release notes/changelogs for version-sensitive behavior.
3. Treat Vite/React as the current project default. Use Next.js docs only when Next.js exists in the repo or a migration is explicitly requested.
4. If docs conflict with codebase conventions, state the conflict and propose the safest adaptation.
5. Never invent APIs. If unsure, search/fetch docs or inspect installed package types.
6. Include source links in implementation notes when a design depends on a specific framework behavior.
