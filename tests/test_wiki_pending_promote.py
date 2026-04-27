"""
Tests for wiki-pending-promote.py dialogue field injection.
Run: python3 -m pytest tests/test_wiki_pending_promote.py -v
"""

import sys
import importlib.util
from pathlib import Path

import pytest
import yaml

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

# Load promote module (hyphen in filename)
_spec = importlib.util.spec_from_file_location(
    "wiki_pending_promote",
    PROJECT_ROOT / "scripts" / "wiki-pending-promote.py",
)
promote = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(promote)


# === full promote integration (uses tmp_path) ===

FIXTURE_CONTENT_WITH_DIALOGUE = """\
---
title: 主持人與來賓對談 EP1
raw_note_id: fixture_001
visibility: internal
pending_status: approved
pending_since: "2026-04-26"
---
主持人：歡迎來到節目。
來賓：謝謝邀請，很高興來這裡。
主持人：今天我們要聊 AI 的未來。
來賓：我覺得 Agent 會主導一切。
主持人：對，我也這樣認為。
"""

FIXTURE_CONTENT_MONOLOGUE = """\
---
title: AI 趨勢分析 EP99
raw_note_id: fixture_002
visibility: public
pending_status: approved
pending_since: "2026-04-26"
---
[0:00] 今天我要談的是 AI 的未來趨勢...
[1:00] 這是一個很重要的話題...
"""

FIXTURE_CONTENT_ALREADY_HAS_DIALOGUE = """\
---
title: 已有 dialogue 欄位
raw_note_id: fixture_003
visibility: internal
dialogue: true
dialogue_inference: heuristic
speakers:
  - 主持人
  - 來賓
pending_status: approved
pending_since: "2026-04-26"
---
Some content.
"""


def _run_promote_in(tmp_path, filename, content):
    """Set up a tmp pending dir + sources dir, run promote, return promoted file content."""
    pending_dir = tmp_path / "sources_pending"
    sources_dir = tmp_path / "sources"
    pending_dir.mkdir()
    sources_dir.mkdir()

    (pending_dir / filename).write_text(content, encoding="utf-8")

    # Patch module globals
    promote.PENDING = pending_dir
    promote.SOURCES = sources_dir
    promote.main()

    promoted = sources_dir / filename
    return promoted.read_text(encoding="utf-8") if promoted.exists() else None


def test_promote_injects_dialogue_true_for_dialogue_content(tmp_path):
    out = _run_promote_in(tmp_path, "ep1.md", FIXTURE_CONTENT_WITH_DIALOGUE)
    assert out is not None, "File was not promoted"
    assert "dialogue: true" in out
    assert "dialogue_inference: heuristic" in out
    assert "主持人" in out  # speaker preserved in content
    # pending fields stripped
    assert "pending_status" not in out
    assert "pending_since" not in out


def test_promote_injects_dialogue_false_for_monologue(tmp_path):
    out = _run_promote_in(tmp_path, "ep99.md", FIXTURE_CONTENT_MONOLOGUE)
    assert out is not None
    assert "dialogue: false" in out
    assert "dialogue_inference: none" in out


def test_promote_idempotent_skips_existing_dialogue(tmp_path):
    """File already has dialogue: true → injection must be skipped (no duplicate)."""
    out = _run_promote_in(tmp_path, "ep3.md", FIXTURE_CONTENT_ALREADY_HAS_DIALOGUE)
    assert out is not None
    # Exactly one occurrence of dialogue: true
    assert out.count("dialogue: true") == 1
    # Exactly one speakers block
    assert out.count("speakers:") == 1
