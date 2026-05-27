#!/usr/bin/env python3
"""Block reads/writes/edits of secrets and sensitive local files."""
import json
import os
import re
import sys
from pathlib import Path
from typing import Any

SENSITIVE_PATTERNS = [
    r"(^|/)\.env$",
    r"(^|/)\.env\.local$",
    r"(^|/)\.env\..*\.local$",
    r"(^|/)\.env\.(development|production|test|staging)$",
    r"(^|/)secrets?(/|$)",
    r"(^|/)credentials?(\.|/|$)",
    r"(^|/)\.aws(/|$)",
    r"(^|/)\.ssh(/|$)",
    r"(^|/)id_rsa$",
    r"(^|/)id_ed25519$",
    r"\.(pem|key|p12|pfx|crt)$",
    r"(^|/)firebase-adminsdk.*\.json$",
    r"(^|/)service-account.*\.json$",
    r"(^|/)config/credentials\.json$",
]


def deny(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def extract_path(data: dict[str, Any]) -> str:
    tool_input = data.get("tool_input", {}) or {}
    for key in ("file_path", "path"):
        value = tool_input.get(key)
        if isinstance(value, str):
            return value
    return ""


def main() -> None:
    try:
        data: dict[str, Any] = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    if data.get("tool_name") not in {"Read", "Edit", "Write"}:
        sys.exit(0)

    file_path = extract_path(data)
    if not file_path:
        sys.exit(0)

    normalized = file_path.replace("\\", "/")
    base = os.path.basename(normalized)
    if base == ".env.example":
        sys.exit(0)

    for pattern in SENSITIVE_PATTERNS:
        if re.search(pattern, normalized, flags=re.IGNORECASE) or re.search(pattern, base, flags=re.IGNORECASE):
            deny(f"Sensitive file access blocked: {file_path}")

    # Prevent accidental writes to Claude policy files unless explicitly requested.
    if data.get("tool_name") in {"Edit", "Write"} and normalized.endswith(".claude/settings.json"):
        deny("Editing .claude/settings.json is blocked during normal implementation. Ask the user explicitly before changing project policy.")

    sys.exit(0)


if __name__ == "__main__":
    main()
