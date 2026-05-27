#!/usr/bin/env python3
"""Block dangerous Bash commands before Claude Code executes them."""
import json
import re
import shlex
import sys
from typing import Any


def deny(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def main() -> None:
    try:
        data: dict[str, Any] = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    if data.get("tool_name") != "Bash":
        sys.exit(0)

    command = str(data.get("tool_input", {}).get("command", "")).strip()
    normalized = re.sub(r"\s+", " ", command.lower())
    env_sensitive_command = re.sub(r"(^|[^\w./-])\.env\.example($|[^\w./-])", " ", normalized)

    hard_blocks = [
        (r"(^|[;&|]\s*)rm\s+-[^\n]*r[^\n]*f\b", "Destructive recursive force removal is blocked."),
        (r"(^|[;&|]\s*)sudo\b", "sudo is blocked in Claude sessions."),
        (r"git\s+reset\s+--hard", "git reset --hard is blocked."),
        (r"git\s+clean\s+-[^\n]*f", "git clean -f/-fd is blocked."),
        (r"chmod\s+777\b", "chmod 777 is blocked."),
        (r"chown\s+", "chown is blocked."),
        (r"mkfs\b", "Filesystem formatting commands are blocked."),
        (r"dd\s+if=", "Raw disk copy commands are blocked."),
        (r":\(\)\s*\{\s*:\|:&\s*}\s*;:", "Fork bomb pattern is blocked."),
        (r"(curl|wget)\b[^\n]*(\||>)\s*(sh|bash|zsh|fish)\b", "Piping downloaded scripts into a shell is blocked."),
        (r"base64\s+(-d|--decode)[^\n]*(\||>)\s*(sh|bash|zsh|fish)\b", "Executing base64-decoded shell content is blocked."),
        (r"/etc/passwd|/etc/shadow", "Access to system credential files is blocked."),
        (r"\.env(\.|\s|$)", "Shell commands targeting .env files are blocked."),
    ]

    for pattern, reason in hard_blocks:
        target = env_sensitive_command if ".env" in pattern else normalized
        if re.search(pattern, target):
            deny(reason)

    # Conservative protection against deleting project roots via ambiguous variables.
    try:
        parts = shlex.split(command)
    except ValueError:
        parts = command.split()

    if parts[:2] == ["rm", "-rf"] or (parts and parts[0] == "rm" and any("r" in p and "f" in p for p in parts[1:] if p.startswith("-"))):
        deny("rm -rf style command is blocked by policy.")

    sys.exit(0)


if __name__ == "__main__":
    main()
