# Recommended Workflow

## Feature Work

1. `/team-plan <task>`
2. Confirm or adjust the plan.
3. `/implement-feature <task>`
4. `/code-review <scope>`
5. `/validate-quality`

## Bug Fix

1. Use `debugger`/relevant specialist to reproduce.
2. Add failing test if practical.
3. Fix narrowly.
4. Run targeted test, then full available gates.
5. Review regression risk.

## Refactor

1. `/refactor-safely <scope and goal>`
2. Require unchanged public behavior.
3. Run tests before and after when possible.
4. Avoid mixed feature+refactor changes.

## Documentation-Sensitive Work

Use `/docs-refresh <topic>` before implementing when touching:

- Next.js App Router caching, routing, Server Actions or metadata.
- Tailwind v4 configuration/theme syntax.
- i18next typed resources or Next.js integration.
- Three.js renderer/asset APIs.
- GSAP React integration.
- Claude Code agents/hooks/skills/settings.
