"""hook 공통 함수. 입력(JSON)을 읽고, 결과를 Claude Code 형식으로 낸다."""
import sys
sys.dont_write_bytecode = True  # __pycache__ 를 만들지 않는다
import json
import os
from pathlib import Path

ROOT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or Path(__file__).resolve().parents[2]).resolve()


def read_input():
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def rel_path(file_path):
    """절대 경로를 저장소 기준 상대 경로(슬래시)로. 저장소 밖이면 None."""
    if not file_path:
        return None
    try:
        return Path(file_path).resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return None


def pre_decision(decision, reason):
    """PreToolUse: decision = 'deny' | 'ask'"""
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": decision,
        "permissionDecisionReason": reason,
    }}, ensure_ascii=False))
    sys.exit(0)


def post_context(text):
    """PostToolUse: 막지 않고 Claude에게 알려준다."""
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PostToolUse",
        "additionalContext": text,
    }}, ensure_ascii=False))
    sys.exit(0)
