---
name: docs-refresh
description: "Fetch and summarize current official documentation for a framework/API decision before implementation."
argument-hint: "[topic]"
disable-model-invocation: true
allowed-tools: "Read WebFetch WebSearch Agent"
model: sonnet
effort: high
---


# Docs Refresh

Research topic: `$ARGUMENTS`

1. Read `.claude/docs/doc-sources.md`.
2. Use `docs-research-librarian`.
3. Prefer official docs. Use third-party sources only as secondary context and label them.
4. Summarize actionable guidance, breaking changes, examples to follow and pitfalls.
5. Do not edit code.
