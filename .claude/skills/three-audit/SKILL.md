---
name: three-audit
description: "Audit Three.js/WebGL code for lifecycle, disposal, RAF cleanup, resize handling, performance, and Vite/React browser integration."
argument-hint: "[scope]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Agent Bash(npm run typecheck) Bash(npm run lint) Bash(npm run test) Bash(npm run test -- *) Bash(npm run build)"
model: sonnet
effort: high
---


# Three.js Audit

Audit scope: `$ARGUMENTS`

Use `threejs-webgl-engineer` and `qa-a11y-performance-engineer`.

Check:

- Browser-only isolation.
- Renderer cleanup.
- Geometry/material/texture disposal.
- RAF cancellation.
- Resize listener cleanup.
- Asset loading and fallback.
- Reduced motion/static fallback.
- Bundle impact.
