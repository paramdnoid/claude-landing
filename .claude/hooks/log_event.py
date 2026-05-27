#!/usr/bin/env python3
"""Append selected Claude Code lifecycle events to a local JSONL audit log."""
import json
import os
import sys
import time
from pathlib import Path
from typing import Any


def main() -> None:
    try:
        data: dict[str, Any] = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    cwd = Path(data.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or ".").resolve()
    log_dir = cwd / ".claude" / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    event = {
        "ts": time.time(),
        "event": data.get("hook_event_name"),
        "session_id": data.get("session_id"),
        "cwd": str(cwd),
        "source": data.get("source"),
        "file_path": data.get("file_path"),
        "reason": data.get("reason"),
    }
    with (log_dir / "events.jsonl").open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")
    sys.exit(0)


if __name__ == "__main__":
    main()
