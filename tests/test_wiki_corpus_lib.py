"""
Unit tests for scripts/wiki_corpus_lib.py.
Run: python3 -m pytest tests/test_wiki_corpus_lib.py -v
"""

import json
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

from wiki_corpus_lib import (
    FRONTMATTER_RE,
    extract_raw_note_id,
    extract_youtube_id,
    find_source_by_raw_note_id,
    is_enriched,
    is_quarantined,
    iter_source_paths,
    load_blocklists,
    load_source,
    needs_review,
    parse_frontmatter,
    review_outcome,
    serialize_frontmatter,
    write_source,
)


# ---------------------------------------------------------------------------
# parse_frontmatter
# ---------------------------------------------------------------------------

def test_parse_frontmatter_valid():
    text = "---\ntitle: foo\n---\nbody text"
    fm, body = parse_frontmatter(text)
    assert fm == {"title": "foo"}
    assert body == "body text"


def test_parse_frontmatter_multiline_body():
    text = "---\nkey: val\n---\nline1\nline2\n"
    fm, body = parse_frontmatter(text)
    assert fm == {"key": "val"}
    assert body == "line1\nline2\n"


def test_parse_frontmatter_no_delimiter_returns_none():
    text = "just plain body"
    fm, body = parse_frontmatter(text)
    assert fm is None
    assert body == "just plain body"


def test_parse_frontmatter_yaml_error_returns_none():
    text = "---\ntrue: [unclosed\n---\nbody"
    fm, body = parse_frontmatter(text)
    assert fm is None


def test_parse_frontmatter_empty_yaml_returns_empty_dict():
    text = "---\n\n---\nbody"
    fm, body = parse_frontmatter(text)
    assert fm == {}
    assert body == "body"


def test_parse_frontmatter_unicode():
    text = "---\ntitle: 中文標題\nvisibility: public\n---\n內容\n"
    fm, body = parse_frontmatter(text)
    assert fm["title"] == "中文標題"
    assert fm["visibility"] == "public"


# ---------------------------------------------------------------------------
# serialize_frontmatter
# ---------------------------------------------------------------------------

def test_serialize_frontmatter_roundtrip():
    fm = {"title": "foo", "visibility": "public"}
    body = "some body\n"
    text = serialize_frontmatter(fm, body)
    assert text.startswith("---\n")
    fm2, body2 = parse_frontmatter(text)
    assert fm2 == fm
    assert body2 == body


def test_serialize_frontmatter_unicode_preserved():
    fm = {"title": "中文標題"}
    text = serialize_frontmatter(fm, "")
    assert "中文標題" in text
    assert "\\u" not in text  # allow_unicode=True


def test_serialize_frontmatter_field_order_preserved():
    fm = {"z_field": 1, "a_field": 2}
    text = serialize_frontmatter(fm, "")
    assert text.index("z_field") < text.index("a_field")


# ---------------------------------------------------------------------------
# load_source / write_source
# ---------------------------------------------------------------------------

def test_load_source_valid(tmp_path):
    p = tmp_path / "note.md"
    p.write_text("---\ntitle: bar\n---\nbody\n", encoding="utf-8")
    fm, body = load_source(p)
    assert fm == {"title": "bar"}
    assert body == "body\n"


def test_load_source_no_frontmatter_returns_none(tmp_path):
    p = tmp_path / "note.md"
    p.write_text("plain text", encoding="utf-8")
    fm, body = load_source(p)
    assert fm is None


def test_write_source_creates_file(tmp_path):
    p = tmp_path / "out.md"
    write_source(p, {"k": "v"}, "body\n")
    assert p.exists()
    fm, body = load_source(p)
    assert fm == {"k": "v"}
    assert body == "body\n"


def test_write_source_roundtrip(tmp_path):
    p = tmp_path / "note.md"
    fm = {"title": "test", "visibility": "internal", "enriched": True}
    body = "content line\n"
    write_source(p, fm, body)
    fm2, body2 = load_source(p)
    assert fm2 == fm
    assert body2 == body


# ---------------------------------------------------------------------------
# extract_raw_note_id
# ---------------------------------------------------------------------------

def test_extract_raw_note_id_from_dict():
    assert extract_raw_note_id({"raw_note_id": "123456789012345678"}) == "123456789012345678"


def test_extract_raw_note_id_missing_returns_none():
    assert extract_raw_note_id({"title": "no id"}) is None


def test_extract_raw_note_id_empty_string_returns_none():
    assert extract_raw_note_id({"raw_note_id": ""}) is None


def test_extract_raw_note_id_from_path(tmp_path):
    p = tmp_path / "note.md"
    p.write_text('---\nraw_note_id: "999000111222333444"\n---\nbody', encoding="utf-8")
    assert extract_raw_note_id(p) == "999000111222333444"


def test_extract_raw_note_id_from_path_no_frontmatter_returns_none(tmp_path):
    p = tmp_path / "note.md"
    p.write_text("no frontmatter", encoding="utf-8")
    assert extract_raw_note_id(p) is None


# ---------------------------------------------------------------------------
# extract_youtube_id
# ---------------------------------------------------------------------------

def test_extract_youtube_id_present():
    assert extract_youtube_id({"youtube_id": "dQw4w9WgXcQ"}) == "dQw4w9WgXcQ"


def test_extract_youtube_id_missing_returns_none():
    assert extract_youtube_id({"title": "no yt"}) is None


# ---------------------------------------------------------------------------
# is_enriched
# ---------------------------------------------------------------------------

def test_is_enriched_true():
    assert is_enriched({"enriched": True}) is True


def test_is_enriched_false_values():
    assert is_enriched({"enriched": False}) is False
    assert is_enriched({}) is False


# ---------------------------------------------------------------------------
# is_quarantined
# ---------------------------------------------------------------------------

def test_is_quarantined_dict_has_key():
    assert is_quarantined({"quarantine": {"needs_review": True}}) is True


def test_is_quarantined_dict_no_key():
    assert is_quarantined({"title": "clean"}) is False


def test_is_quarantined_raw_text_positive():
    text = "---\nquarantine:\n  needs_review: true\n---\nbody\n"
    assert is_quarantined(text) is True


def test_is_quarantined_raw_text_negative():
    text = "---\ntitle: plain\nvisibility: public\n---\nbody\n"
    assert is_quarantined(text) is False


# ---------------------------------------------------------------------------
# needs_review
# ---------------------------------------------------------------------------

def test_needs_review_explicitly_true():
    assert needs_review({"quarantine": {"needs_review": True}}) is True


def test_needs_review_explicitly_false():
    assert needs_review({"quarantine": {"needs_review": False}}) is False


def test_needs_review_absent_quarantine():
    assert needs_review({}) is False


def test_needs_review_quarantine_no_key():
    assert needs_review({"quarantine": {"review_outcome": "keep_internal"}}) is False


# ---------------------------------------------------------------------------
# review_outcome
# ---------------------------------------------------------------------------

def test_review_outcome_keep_internal():
    fm = {"quarantine": {"review_outcome": "keep_internal"}}
    assert review_outcome(fm) == "keep_internal"


def test_review_outcome_restore_public():
    fm = {"quarantine": {"review_outcome": "restore_public"}}
    assert review_outcome(fm) == "restore_public"


def test_review_outcome_pending_coerces_to_none():
    fm = {"quarantine": {"review_outcome": "pending"}}
    assert review_outcome(fm) is None


def test_review_outcome_absent_returns_none():
    assert review_outcome({}) is None


def test_review_outcome_empty_string_returns_none():
    fm = {"quarantine": {"review_outcome": ""}}
    assert review_outcome(fm) is None


# ---------------------------------------------------------------------------
# iter_source_paths
# ---------------------------------------------------------------------------

def test_iter_source_paths_yields_md_files(tmp_path):
    (tmp_path / "a.md").write_text("x")
    (tmp_path / "b.md").write_text("x")
    (tmp_path / "other.txt").write_text("x")
    names = [p.name for p in iter_source_paths(tmp_path)]
    assert "a.md" in names
    assert "b.md" in names
    assert "other.txt" not in names


def test_iter_source_paths_excludes_hidden(tmp_path):
    (tmp_path / ".hidden.md").write_text("x")
    (tmp_path / "visible.md").write_text("x")
    names = [p.name for p in iter_source_paths(tmp_path)]
    assert ".hidden.md" not in names
    assert "visible.md" in names


def test_iter_source_paths_sorted(tmp_path):
    (tmp_path / "c.md").write_text("x")
    (tmp_path / "a.md").write_text("x")
    (tmp_path / "b.md").write_text("x")
    names = [p.name for p in iter_source_paths(tmp_path)]
    assert names == sorted(names)


# ---------------------------------------------------------------------------
# find_source_by_raw_note_id
# ---------------------------------------------------------------------------

def test_find_source_by_raw_note_id_with_hint(tmp_path):
    p = tmp_path / "note.md"
    p.write_text('---\nraw_note_id: "42"\n---\nbody', encoding="utf-8")
    result = find_source_by_raw_note_id(tmp_path, "42", filename_hint="note.md")
    assert result == p


def test_find_source_by_raw_note_id_scan_fallback(tmp_path):
    p = tmp_path / "note.md"
    p.write_text('---\nraw_note_id: "99"\n---\nbody', encoding="utf-8")
    result = find_source_by_raw_note_id(tmp_path, "99")
    assert result == p


def test_find_source_by_raw_note_id_hint_wrong_id_falls_back(tmp_path):
    p1 = tmp_path / "note1.md"
    p2 = tmp_path / "note2.md"
    p1.write_text('---\nraw_note_id: "111"\n---\n', encoding="utf-8")
    p2.write_text('---\nraw_note_id: "222"\n---\n', encoding="utf-8")
    # hint points to note1 but we want id "222"
    result = find_source_by_raw_note_id(tmp_path, "222", filename_hint="note1.md")
    assert result == p2


def test_find_source_by_raw_note_id_not_found(tmp_path):
    assert find_source_by_raw_note_id(tmp_path, "nonexistent") is None


# ---------------------------------------------------------------------------
# load_blocklists
# ---------------------------------------------------------------------------

def test_load_blocklists_both_sections(tmp_path):
    bl = tmp_path / "blocklist.json"
    bl.write_text(json.dumps({
        "blocklist": {"123456789": {"reason": "delete_outcome"}},
        "youtube_blocklist": {"dQw4w9WgX": {"reason": "off_topic"}},
    }), encoding="utf-8")
    raw_bl, yt_bl = load_blocklists(bl)
    assert "123456789" in raw_bl
    assert "dQw4w9WgX" in yt_bl


def test_load_blocklists_missing_file_returns_empty(tmp_path):
    raw_bl, yt_bl = load_blocklists(tmp_path / "nonexistent.json")
    assert raw_bl == {}
    assert yt_bl == {}


def test_load_blocklists_empty_sections(tmp_path):
    bl = tmp_path / "blocklist.json"
    bl.write_text(json.dumps({"_comment": "empty file"}), encoding="utf-8")
    raw_bl, yt_bl = load_blocklists(bl)
    assert raw_bl == {}
    assert yt_bl == {}


def test_load_blocklists_null_sections_treated_as_empty(tmp_path):
    bl = tmp_path / "blocklist.json"
    bl.write_text(json.dumps({"blocklist": None, "youtube_blocklist": None}), encoding="utf-8")
    raw_bl, yt_bl = load_blocklists(bl)
    assert raw_bl == {}
    assert yt_bl == {}
