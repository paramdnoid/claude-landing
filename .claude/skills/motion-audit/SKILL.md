---
name: motion-audit
description: "Audit GSAP motion code for React integration, cleanup, reduced motion, ScrollTrigger and performance."
argument-hint: "[scope]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Agent Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *)"
model: sonnet
effort: high
---


# Motion Audit

Audit scope: `$ARGUMENTS`

Use `gsap-motion-engineer` and `qa-a11y-performance-engineer`.

Check:

- Client-only boundaries.
- `useGSAP`/context cleanup.
- Plugin registration.
- Reduced motion support.
- ScrollTrigger cleanup.
- Animation of performant properties.
- Hydration/layout risks.
