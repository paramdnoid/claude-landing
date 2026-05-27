#!/usr/bin/env python3
"""Stop hook: run available quality gates after code changes and block completion on failure."""
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

SCRIPT_PRIORITY = ["typecheck", "lint", "test:ci", "test", "build"]
PACKAGE_MANAGERS = [
    ("pnpm-lock.yaml", ["pnpm"]),
    ("yarn.lock", ["yarn"]),
    ("bun.lock", ["bun", "run"]),
    ("bun.lockb", ["bun", "run"]),
    ("package-lock.json", ["npm", "run"]),
]


def load_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def detect_runner(cwd: Path) -> list[str]:
    for lock, runner in PACKAGE_MANAGERS:
        if (cwd / lock).exists():
            return runner
    return ["npm", "run"]


def run_command(cmd: list[str], cwd: Path, timeout: int) -> tuple[int, str]:
    started = time.time()
    try:
        proc = subprocess.run(
            cmd,
            cwd=str(cwd),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
        )
        elapsed = time.time() - started
        output = proc.stdout[-12000:] if proc.stdout else ""
        return proc.returncode, f"$ {' '.join(cmd)} ({elapsed:.1f}s)\n{output}"
    except FileNotFoundError:
        return 127, f"$ {' '.join(cmd)}\nCommand not found. Install the package manager or adjust .claude/hooks/quality_gate_stop.py."
    except subprocess.TimeoutExpired as exc:
        output = (exc.stdout or "") if isinstance(exc.stdout, str) else ""
        return 124, f"$ {' '.join(cmd)}\nTimed out after {timeout}s.\n{output[-4000:]}"


def block(reason: str) -> None:
    print(json.dumps({"decision": "block", "reason": reason}))
    sys.exit(0)


def main() -> None:
    if os.environ.get("CLAUDE_QUALITY_GATE", "1") in {"0", "false", "False", "off"}:
        sys.exit(0)

    try:
        data: dict[str, Any] = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    cwd = Path(data.get("cwd") or os.environ.get("CLAUDE_PROJECT_DIR") or ".").resolve()
    state_dir = cwd / ".claude" / ".state"
    needed_file = state_dir / "validation-needed.json"
    fail_file = state_dir / "quality-last-failure.json"

    if not needed_file.exists():
        sys.exit(0)

    if data.get("background_tasks"):
        # Let background tasks complete rather than racing them.
        sys.exit(0)

    package_json = cwd / "package.json"
    if not package_json.exists():
        needed_file.unlink(missing_ok=True)
        sys.exit(0)

    package = load_json(package_json)
    scripts = package.get("scripts") or {}
    selected = [name for name in SCRIPT_PRIORITY if name in scripts]

    if not selected:
        needed_file.unlink(missing_ok=True)
        sys.exit(0)

    runner = detect_runner(cwd)
    max_seconds = int(os.environ.get("CLAUDE_QUALITY_GATE_MAX_SECONDS", "300"))
    per_cmd_timeout = max(30, max_seconds // max(1, len(selected)))

    outputs: list[str] = []
    failures: list[str] = []

    for script in selected:
        cmd = runner + [script]
        code, output = run_command(cmd, cwd, per_cmd_timeout)
        outputs.append(output)
        if code != 0:
            failures.append(f"{script} failed with exit code {code}")
            break

    if failures:
        combined = "\n\n".join(outputs)
        failure_hash = hashlib.sha256(combined.encode("utf-8", errors="ignore")).hexdigest()
        last = load_json(fail_file)
        repeats = int(last.get("repeats", 0)) + 1 if last.get("hash") == failure_hash else 1
        fail_file.write_text(json.dumps({"hash": failure_hash, "repeats": repeats, "updated_at": time.time()}, indent=2), encoding="utf-8")

        reason = (
            "Quality gate failed after code changes. Fix the failing check before finalizing.\n\n"
            + "\n".join(failures)
            + "\n\nRecent output:\n"
            + combined[-6000:]
        )
        if repeats <= 4:
            block(reason)
        # Avoid infinite blocking loops; still surface the failure.
        print(json.dumps({
            "additionalContext": "Quality gate is still failing after repeated attempts. Do not claim success; report the remaining failure honestly."
        }))
        sys.exit(0)

    needed_file.unlink(missing_ok=True)
    fail_file.unlink(missing_ok=True)
    report = state_dir / "quality-last-pass.json"
    report.write_text(json.dumps({"passed": selected, "updated_at": time.time()}, indent=2), encoding="utf-8")
    sys.exit(0)


if __name__ == "__main__":
    main()
