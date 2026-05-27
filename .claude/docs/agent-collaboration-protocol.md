# Agent Collaboration Protocol

## Roles

- **Team Lead Orchestrator**: decomposes work, assigns agents, prevents file conflicts, synthesizes output.
- **Docs Research Librarian**: verifies current official documentation and summarizes version-sensitive guidance.
- **Specialist Engineers**: implement only in their domain and document tradeoffs.
- **Integration Engineer**: resolves cross-cutting interactions between Vite, React, i18n, motion and 3D.
- **Quality/Security Reviewers**: independently inspect code without assuming implementers are correct.

## Delegation Rules

1. Use specialists when a task touches their domain.
2. Do not let multiple agents modify the same file simultaneously unless one owns the final integration.
3. Read-only review agents must not edit files; they return findings with severity and file references.
4. Implementation agents must produce a validation plan before editing.
5. The lead must reconcile conflicting recommendations explicitly.
6. When `team-lead-orchestrator` is invoked as a subagent, it plans and synthesizes only; the main session or an Agent Team lead performs actual delegation.

## Standard Agent Output

Every agent returns:

```md
## Summary
## Assumptions
## Files inspected
## Proposed/actual changes
## Validation performed
## Risks and follow-ups
```

Review agents return:

```md
## Verdict: pass | pass-with-nits | changes-requested | blocked
## Critical issues
## High issues
## Medium issues
## Low issues
## Positive notes
## Required validation
```

## Conflict Resolution

Priority order:

1. Security and data safety
2. Correctness and type safety
3. Accessibility
4. Runtime performance and bundle size
5. Maintainability
6. Visual polish

When tradeoffs are unavoidable, document the decision and why lower-priority concerns were accepted.
