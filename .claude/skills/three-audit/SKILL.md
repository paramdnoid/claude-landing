---
name: three-audit
description: "Audit Three.js code for renderer lifecycle, disposal, RAF cleanup, resize handling, performance and Next.js client-only integration."
argument-hint: "[scope]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Agent Bash(npm run *) Bash(pnpm *) Bash(yarn *) Bash(bun run *)"
model: sonnet
effort: high
---


# Three.js Audit

Audit scope: `$ARGUMENTS`

Use `threejs-webgl-engineer` and `qa-a11y-performance-engineer`.

Check:

- Client-only isolation.
- Renderer cleanup.
- Geometry/material/texture disposal.
- RAF cancellation.
- Resize listener cleanup.
- Asset loading and fallback.
- Reduced motion/static fallback.
- Bundle impact.
