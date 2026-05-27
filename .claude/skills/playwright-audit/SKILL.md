---
name: playwright-audit
description: "Run a Playwright-focused browser QA audit for E2E, responsive, visual, accessibility, i18n and motion behavior."
argument-hint: "[scope or user flow]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Agent Bash(git status *) Bash(git diff *) Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *) Bash(npx playwright *) Bash(pnpm exec playwright *) Bash(yarn playwright *)"
model: sonnet
effort: high
---

# Playwright Audit

Audit scope: `$ARGUMENTS`

Use `playwright-e2e-visual-qa-engineer`.

## Required checks

1. Inspect `package.json`, Playwright config and test folders.
2. Identify available E2E commands.
3. Check whether Playwright is installed and configured.
4. Validate:
   - initial page render
   - responsive desktop/tablet/mobile behavior
   - navigation and CTA behavior
   - i18n routing/text correctness when relevant
   - keyboard accessibility
   - reduced-motion behavior
   - GSAP/Three.js fallback behavior when relevant
   - browser console errors
   - hydration/runtime errors
5. Run the narrowest relevant Playwright command first.
6. Run full E2E suite before final pass when available.
7. If failures occur, report exact reproduction commands and likely root cause.

## Preferred commands

Use whichever package manager the project already uses.

- `npm run test:e2e`
- `pnpm test:e2e`
- `yarn test:e2e`
- `bun run test:e2e`

For debugging only:

- `npx playwright test --ui`
- `npx playwright test --headed`
- `npx playwright show-report`

## Output

Return:

- Playwright setup status
- Commands executed
- Passed checks
- Failed checks
- Missing coverage
- Recommended test additions
- Verdict: `pass`, `pass-with-nits`, `changes-requested` or `blocked`
