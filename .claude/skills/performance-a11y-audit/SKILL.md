---
name: performance-a11y-audit
description: "Audit frontend performance, accessibility, Core Web Vitals risks, runtime behavior, bundle size, and interaction quality."
argument-hint: "[scope]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Agent Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *)"
model: sonnet
effort: high
---


# Performance and Accessibility Audit

Audit scope: `$ARGUMENTS`

Use `qa-a11y-performance-engineer`, plus stack specialists as needed.

Check:

- Browser-only boundaries.
- Bundle-heavy imports.
- Unnecessary client runtime work.
- Semantic HTML and ARIA.
- Keyboard/focus management.
- Reduced motion.
- Image/font/layout stability.
- Test/build validation.
