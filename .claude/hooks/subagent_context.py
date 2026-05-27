#!/usr/bin/env python3
"""Inject shared standards into every subagent context."""
import json
import sys
from typing import Any


def main() -> None:
    try:
        data: dict[str, Any] = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    agent_type = data.get("agent_type", "unknown-agent")
    context = f"""
You are running as subagent `{agent_type}` in the Senior Frontend Agent Team.
Before making recommendations or edits, follow these project documents when relevant:
- CLAUDE.md
- .claude/docs/agent-collaboration-protocol.md
- .claude/docs/coding-standards.md
- .claude/docs/frontend-quality-gates.md
- .claude/docs/doc-sources.md

Hard rules:
1. Prefer current official docs over memory for version-sensitive framework behavior.
2. Use strict TypeScript and avoid `any`.
3. Respect React Rules of Hooks and Next.js Server/Client Component boundaries.
4. No hardcoded user-facing UI strings when i18n is in scope.
5. Clean up GSAP and Three.js side effects.
6. Return a concise report with assumptions, files inspected, changes, validation and risks.
""".strip()
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SubagentStart",
            "additionalContext": context,
        }
    }))


if __name__ == "__main__":
    main()
