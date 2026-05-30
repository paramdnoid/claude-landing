# Frontend Quality Gates

## Must Pass Before Completion

1. `typecheck` if available.
2. `lint` if available.
3. `test` or `test:ci` if available.
4. `build` for Vite or production-impacting changes if available.
5. Manual review of browser-only/server-only boundaries.
6. Accessibility review for interactive UI.
7. i18n review for visible copy.
8. Cleanup review for GSAP/Three.js side effects.

The automatic Stop hook enforces the fast gates above: `typecheck`, `lint`,
`test:ci` or `test`, and `build`. It intentionally does not run `test:e2e` on
every completion.

Run `test:e2e` through `/validate-quality`, Playwright/browser QA, or release
validation whenever work affects routing, forms, locale switching, focus
behavior, motion, WebGL fallbacks, or other browser-visible flows.

## Failure Policy

- Do not mark work complete with known failing gates.
- If a gate fails because of pre-existing unrelated issues, isolate evidence and state why it is unrelated.
- If a gate is missing, recommend adding it, but do not invent success.
- If a command cannot run due to environment limitations, report the exact limitation.

## Review Severity

- **Critical**: data loss, secrets exposure, build impossible, security vulnerability, runtime crash on primary path.
- **High**: broken UX, runtime error, major accessibility block, incorrect localization, unbounded resource leak.
- **Medium**: maintainability issue, non-critical performance issue, incomplete tests.
- **Low**: style, naming, minor duplication.
