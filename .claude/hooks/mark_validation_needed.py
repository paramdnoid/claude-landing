#!/usr/bin/env python3
"""Mark project validation as needed after source file writes/edits."""
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

SOURCE_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".css", ".scss", ".json", ".mdx",
}
SOURCE_NAMES = {"package.json", "next.config.js", "next.config.ts", "tailwind.config.js", "tailwind.config.ts", "tsconfig.json"}


def main() -> None:
    try:
        data: dict[str, Any] = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool = data.get("tool_name")
    if tool not in {"Edit", "Write"}:
        sys.exit(0)

    file_path = str((data.get("tool_input") or {}).get("file_path") or "")
    if not file_path:
        sys.exit(0)

    path = Path(file_path)
    if path.name not in SOURCE_NAMES and path.suffix.lower() not in SOURCE_EXTENSIONS:
        sys.exit(0)

    cwd = Path(data.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or ".").resolve()
    state_dir = cwd / ".claude" / ".state"
    state_dir.mkdir(parents=True, exist_ok=True)
    state_file = state_dir / "validation-needed.json"

    payload = {
        "needed": True,
        "reason": "Source file changed via Claude Code tool.",
        "file_path": file_path,
        "tool": tool,
        "updated_at": time.time(),
        "session_id": data.get("session_id"),
    }
    state_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    sys.exit(0)


if __name__ == "__main__":
    main()
