---
name: pr-summary
description: "Summarize current git diff into a high-quality PR description with test evidence and risk notes."
argument-hint: "[optional context]"
disable-model-invocation: true
allowed-tools: "Read Glob Grep Bash(git status *) Bash(git diff *) Bash(git log *)"
model: sonnet
effort: medium
---


# PR Summary

Context: `$ARGUMENTS`

Use the current git diff to produce:

```md
## Summary
## Changes
## Validation
## Screenshots / visual notes
## Risks
## Rollback
```

Do not claim validation that was not run.
