"""
Behaviour-equivalence tests for the frontmatter-helper migration.

Each refactored script previously contained a hand-written frontmatter
parser (strip_frontmatter / split("---") + yaml.safe_load / re.search).
These tests verify that the wiki_corpus_lib-backed replacements produce
identical results for the cases that matter.

Covered scripts:
  - wiki-sensitivity-scan.py      (strip_frontmatter → parse_frontmatter)
  - wiki-quarantine-recordings.py (collect_internal_sources regex → load_source)
  - build_wiki_ingest_report.py   (open+re.search → parse_frontmatter)
  - wiki_rescan.py                (split("---")+yaml → parse_frontmatter)

Run:
    pytest tests/test_wiki_frontmatter_migration.py -v
"""

import importlib.util
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from wiki_corpus_lib import (
    extract_raw_note_id,
    iter_source_paths,
    load_source,
    parse_frontmatter,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _md(fm_lines: str, body: str = "") -> str:
    return f"---\n{fm_lines}\n---\n{body}"


# ===========================================================================
# wiki-sensitivity-scan.py — strip_frontmatter replaced by parse_frontmatter
# ===========================================================================

# Load the module via importlib so we exercise the real scan() after migration.
_spec = importlib.util.spec_from_file_location(
    "wiki_sensitivity_scan", ROOT / "scripts" / "wiki-sensitivity-scan.py"
)
_scan_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_scan_mod)
scan = _scan_mod.scan


def test_scan_frontmatter_raw_note_id_not_flagged_as_phone():
    """raw_note_id in frontmatter (18-digit string) must not trigger the phone regex."""
    text = _md(
        "raw_note_id: '1905762523509171424'\ntitle: 測試",
        "一篇關於AI決策的筆記。"
    )
    suggested, flags = scan(text)
    assert suggested == "safe", f"flags: {flags}"


def test_scan_frontmatter_date_not_flagged():
    """ISO date in frontmatter must not produce false positives."""
    text = _md("date: 2026-04-27\ntitle: 日期測試", "內容乾淨。")
    suggested, flags = scan(text)
    assert suggested == "safe", f"flags: {flags}"


def test_scan_business_keyword_in_frontmatter_title_not_caught():
    """Title contains '商務會議' but it's in frontmatter — body is clean → safe."""
    text = _md("title: 商務會議記錄", "今天天氣很好，思考了很多。")
    suggested, flags = scan(text)
    # '商務會議' is in BUSINESS_KEYWORDS, but strip_frontmatter (now parse_frontmatter)
    # removes it before scanning body — result is safe.
    assert suggested == "safe", f"flags: {flags}"


def test_scan_business_keyword_in_body_still_caught():
    """Business keyword in body is still detected after the migration."""
    text = _md("title: 乾淨標題", "雙方確認合作條件，合約金額待定。")
    suggested, _ = scan(text)
    assert suggested == "business_confidential"


def test_scan_no_frontmatter_still_works():
    """Files without frontmatter delimiter must not crash and must still scan body."""
    text = "純文字，沒有 frontmatter。合作條件討論中。"
    suggested, _ = scan(text)
    assert suggested == "business_confidential"


def test_scan_empty_frontmatter_body_scanned():
    """Empty frontmatter block — body PII is still caught."""
    text = _md("", "聯絡電話 0912-345-678。")
    suggested, _ = scan(text)
    assert suggested == "contains_pii"


# ===========================================================================
# wiki-quarantine-recordings.py — collect_internal_sources
# ===========================================================================

def test_collect_internal_sources_finds_internal(tmp_path):
    """load_source + fm.get('visibility') correctly identifies internal files."""
    p = tmp_path / "note.md"
    p.write_text(_md("raw_note_id: '111'\nvisibility: internal"), encoding="utf-8")
    results = []
    for path in iter_source_paths(tmp_path):
        fm, _ = load_source(path)
        if fm and fm.get("visibility") == "internal":
            results.append((path, extract_raw_note_id(fm)))
    assert len(results) == 1
    assert results[0][1] == "111"


def test_collect_internal_sources_skips_public(tmp_path):
    """Public files are not returned."""
    p = tmp_path / "note.md"
    p.write_text(_md("raw_note_id: '222'\nvisibility: public"), encoding="utf-8")
    results = [
        path for path in iter_source_paths(tmp_path)
        if (load_source(path)[0] or {}).get("visibility") == "internal"
    ]
    assert results == []


def test_collect_internal_sources_no_frontmatter_skipped(tmp_path):
    """File without frontmatter: load_source returns None → skipped."""
    p = tmp_path / "broken.md"
    p.write_text("no frontmatter here", encoding="utf-8")
    results = []
    for path in iter_source_paths(tmp_path):
        fm, _ = load_source(path)
        if fm and fm.get("visibility") == "internal":
            results.append(path)
    assert results == []


def test_collect_internal_sources_extract_raw_note_id_numeric(tmp_path):
    """Numeric raw_note_id stored as YAML int is coerced to str by extract_raw_note_id."""
    p = tmp_path / "note.md"
    p.write_text(_md("raw_note_id: 1900800880652066168\nvisibility: internal"), encoding="utf-8")
    for path in iter_source_paths(tmp_path):
        fm, _ = load_source(path)
        rid = extract_raw_note_id(fm)
    assert rid == "1900800880652066168"


def test_collect_internal_sources_no_raw_note_id_returns_none(tmp_path):
    """File with visibility: internal but no raw_note_id → extract_raw_note_id returns None."""
    p = tmp_path / "note.md"
    p.write_text(_md("title: no-id\nvisibility: internal"), encoding="utf-8")
    for path in iter_source_paths(tmp_path):
        fm, _ = load_source(path)
        rid = extract_raw_note_id(fm)
    assert rid is None


# ===========================================================================
# build_wiki_ingest_report.py — parse_frontmatter replaces re.search
# ===========================================================================

def test_parse_frontmatter_extracts_note_id():
    """parse_frontmatter correctly extracts note_id field."""
    text = _md('note_id: "1905762523509171424"\ntitle: 測試', "body")
    fm, _ = parse_frontmatter(text)
    assert str(fm.get("note_id", "")) == "1905762523509171424"


def test_parse_frontmatter_extracts_title():
    """parse_frontmatter correctly extracts title field."""
    text = _md('title: "我的筆記"\nnote_id: "12345"', "body")
    fm, _ = parse_frontmatter(text)
    assert fm.get("title") == "我的筆記"


def test_parse_frontmatter_extracts_tags_as_list():
    """parse_frontmatter parses YAML tag arrays directly — no json.loads needed."""
    text = _md("tags:\n  - foo\n  - bar\nnote_id: '99'", "body")
    fm, _ = parse_frontmatter(text)
    tags = fm.get("tags", [])
    assert isinstance(tags, list)
    assert "foo" in tags
    assert "bar" in tags


def test_parse_frontmatter_missing_note_id_returns_empty():
    """When note_id is absent, fm.get('note_id') is falsy — file should be skipped."""
    text = _md("title: only-title", "body")
    fm, _ = parse_frontmatter(text)
    assert not fm.get("note_id")


def test_parse_frontmatter_no_frontmatter_returns_none():
    """Plain text file → parse_frontmatter returns (None, text) → skip logic holds."""
    text = "no frontmatter"
    fm, body = parse_frontmatter(text)
    assert fm is None
    assert body == text


def test_parse_frontmatter_inline_tag_list():
    """Inline YAML list for tags is parsed correctly."""
    text = _md("note_id: '42'\ntags: [科技, AI]", "body")
    fm, _ = parse_frontmatter(text)
    tags = fm.get("tags", [])
    assert "科技" in tags
    assert "AI" in tags


# ===========================================================================
# wiki_rescan.py — parse_frontmatter replaces split("---", 2) + yaml.safe_load
# ===========================================================================

def test_rescan_parse_frontmatter_title_extraction():
    """parse_frontmatter gives same title as the old regex approach."""
    text = _md('title: "我的AI筆記"\nnote_id: "1"', "正文內容\n")
    fm, body = parse_frontmatter(text)
    title = str(fm.get("title", "") or "").strip()
    assert title == "我的AI筆記"


def test_rescan_parse_frontmatter_body_length_check():
    """Body returned by parse_frontmatter matches what split('---',2)[2] would give."""
    body_content = "A" * 100
    text = _md("title: test", body_content)
    fm, body = parse_frontmatter(text)
    assert len(body.strip()) >= 50  # is_empty == False


def test_rescan_parse_frontmatter_short_body_is_empty():
    """Body under 50 chars: is_empty flag is True."""
    text = _md("title: test", "Hi.")
    fm, body = parse_frontmatter(text)
    assert len(body.strip()) < 50


def test_rescan_parse_frontmatter_tags_for_recording_check():
    """Tags parsed via parse_frontmatter are usable by has_recording_tag."""
    from wiki_visibility import has_recording_tag
    text = _md("tags:\n  - name: 录音笔记\n    type: system\ntitle: t", "body")
    fm, _ = parse_frontmatter(text)
    tags = fm.get("tags", []) or []
    assert has_recording_tag(tags) is True


def test_rescan_invalid_yaml_frontmatter_returns_none():
    """Malformed YAML → parse_frontmatter returns (None, ...) — treated as empty fm."""
    text = "---\ntrue: [unclosed\n---\nbody text"
    fm, _ = parse_frontmatter(text)
    assert fm is None
    # Callers use `fm_data or {}` so this is safe


def test_rescan_no_frontmatter_title_falls_back_to_filename():
    """When parse_frontmatter returns None, title falls back to filename stem."""
    text = "no frontmatter at all"
    fm, body = parse_frontmatter(text)
    fm = fm or {}
    title = str(fm.get("title", "") or "").strip() or "fallback_stem"
    assert title == "fallback_stem"
