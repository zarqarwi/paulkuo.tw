"""
Unit tests for scripts/wiki-build-derived-index.py.

Run: python3 -m pytest tests/test_wiki_build_derived_index.py -v

SSOT for derived_from: docs/article-derived-from.md
Phase 4 Step A verification suite.
"""

from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures" / "derived_index"
SCRIPT = PROJECT_ROOT / "scripts" / "wiki-build-derived-index.py"

sys.path.insert(0, str(PROJECT_ROOT / "scripts"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_script():
    spec = importlib.util.spec_from_file_location("wiki_build_derived_index", SCRIPT)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_mod = _load_script()
build_index = _mod.build_index
load_source_visibility_map = _mod.load_source_visibility_map


def _copy_fixtures(tmp_path: Path) -> tuple[Path, Path]:
    articles_root = tmp_path / "articles"
    sources_dir = tmp_path / "sources"
    shutil.copytree(FIXTURES_DIR / "articles", articles_root)
    shutil.copytree(FIXTURES_DIR / "sources", sources_dir)
    return articles_root, sources_dir


def _run_cli(*extra_args, articles_root=None, sources_dir=None, output=None) -> subprocess.CompletedProcess:
    cmd = [sys.executable, str(SCRIPT)]
    if articles_root:
        cmd += ["--articles-root", str(articles_root)]
    if sources_dir:
        cmd += ["--sources-dir", str(sources_dir)]
    if output:
        cmd += ["--output", str(output)]
    cmd += list(extra_args)
    return subprocess.run(cmd, capture_output=True, text=True)


# ---------------------------------------------------------------------------
# Test 1: basic zh-only
# ---------------------------------------------------------------------------

def test_basic_zh_only(tmp_path):
    """Single zh article referencing source-1 → one index entry with correct metadata."""
    articles_root = tmp_path / "articles"
    articles_root.mkdir()
    sources_dir = tmp_path / "sources"
    sources_dir.mkdir()

    (articles_root / "my-article.md").write_text(
        "---\ntitle: 我的文章\ndate: 2026-03-01\npillar: ai\nderived_from:\n  - source-1\n---\nbody\n",
        encoding="utf-8",
    )
    (sources_dir / "source-1.md").write_text("---\ntitle: Source One\n---\n", encoding="utf-8")

    index, total, with_derived, missing, non_public = build_index(articles_root, sources_dir, strict=False)

    assert total == 1
    assert with_derived == 1
    assert missing == []
    assert non_public == []
    assert "source-1" in index
    entries = index["source-1"]
    assert len(entries) == 1
    e = entries[0]
    assert e["article_slug"] == "my-article"
    assert e["lang"] == "zh"
    assert e["title"] == "我的文章"
    assert e["date"] == "2026-03-01"
    assert e["pillar"] == "ai"


# ---------------------------------------------------------------------------
# Test 2: multi-lang articles all referencing same source
# ---------------------------------------------------------------------------

def test_multi_lang_same_source(tmp_path):
    """zh + en + ja articles all reference source-1 → three entries, each with correct lang."""
    articles_root, sources_dir = _copy_fixtures(tmp_path)
    index, total, with_derived, missing, _ = build_index(articles_root, sources_dir, strict=False)

    assert "source-1" in index
    entries = index["source-1"]
    langs = {e["lang"] for e in entries}
    assert "zh" in langs
    assert "en" in langs
    # zh-article-1 and zh-article-2 both reference source-1, so zh appears
    assert langs >= {"zh", "en"}


def test_multi_lang_different_langs_correct(tmp_path):
    """Each lang subdir article gets the correct lang code in the index."""
    articles_root, sources_dir = _copy_fixtures(tmp_path)
    index, _, _, _, _ = build_index(articles_root, sources_dir, strict=False)

    all_entries = [e for entries in index.values() for e in entries]
    lang_map = {e["article_slug"]: e["lang"] for e in all_entries}

    assert lang_map.get("zh-article-1") == "zh"
    assert lang_map.get("zh-article-2") == "zh"
    assert lang_map.get("en-article-1") == "en"
    assert lang_map.get("ja-article-1") == "ja"


# ---------------------------------------------------------------------------
# Test 3: multiple articles same source → sorted newest first
# ---------------------------------------------------------------------------

def test_multi_articles_same_source_sorted_desc(tmp_path):
    """Two zh articles referencing source-1 are sorted newest date first."""
    articles_root, sources_dir = _copy_fixtures(tmp_path)
    index, _, _, _, _ = build_index(articles_root, sources_dir, strict=False)

    assert "source-1" in index
    zh_entries = [e for e in index["source-1"] if e["lang"] == "zh"]
    assert len(zh_entries) == 2
    dates = [e["date"] for e in zh_entries]
    assert dates == sorted(dates, reverse=True), f"Expected descending order, got {dates}"


# ---------------------------------------------------------------------------
# Test 4: empty or missing derived_from → no entry
# ---------------------------------------------------------------------------

def test_empty_or_missing_derived_from(tmp_path):
    """Articles with derived_from=[] or no derived_from key produce no index entries."""
    articles_root = tmp_path / "articles"
    articles_root.mkdir()
    sources_dir = tmp_path / "sources"
    sources_dir.mkdir()
    (sources_dir / "source-1.md").write_text("---\ntitle: S1\n---\n", encoding="utf-8")

    # empty list
    (articles_root / "empty-list.md").write_text(
        "---\ntitle: Empty\ndate: 2026-01-01\npillar: ai\nderived_from: []\n---\n",
        encoding="utf-8",
    )
    # missing key entirely
    (articles_root / "no-key.md").write_text(
        "---\ntitle: No Key\ndate: 2026-01-01\npillar: ai\n---\n",
        encoding="utf-8",
    )

    index, total, with_derived, _, _ = build_index(articles_root, sources_dir, strict=False)

    assert total == 2
    assert with_derived == 0
    assert index == {}


# ---------------------------------------------------------------------------
# Test 5: invalid slug + --strict → exit 1 with slug name in stderr
# ---------------------------------------------------------------------------

def test_invalid_slug_strict_exits_1(tmp_path):
    """Article referencing a non-existent slug + --strict → exit code 1, slug in stderr."""
    articles_root = tmp_path / "articles"
    articles_root.mkdir()
    sources_dir = tmp_path / "sources"
    sources_dir.mkdir()
    (sources_dir / "real-source.md").write_text("---\ntitle: Real\n---\n", encoding="utf-8")

    (articles_root / "bad-article.md").write_text(
        "---\ntitle: Bad\ndate: 2026-01-01\npillar: ai\nderived_from:\n  - ghost-slug\n---\n",
        encoding="utf-8",
    )
    output = tmp_path / "out.json"
    result = _run_cli("--strict", articles_root=articles_root, sources_dir=sources_dir, output=output)

    assert result.returncode == 1
    assert "ghost-slug" in result.stderr


# ---------------------------------------------------------------------------
# Test 6: invalid slug without --strict → exit 0, warning in stderr, no bad entry
# ---------------------------------------------------------------------------

def test_invalid_slug_non_strict_exits_0(tmp_path):
    """Invalid slug without --strict → exit 0, warning printed, JSON has no entry for bad slug."""
    articles_root = tmp_path / "articles"
    articles_root.mkdir()
    sources_dir = tmp_path / "sources"
    sources_dir.mkdir()
    (sources_dir / "real-source.md").write_text("---\ntitle: Real\n---\n", encoding="utf-8")

    (articles_root / "bad-article.md").write_text(
        "---\ntitle: Bad\ndate: 2026-01-01\npillar: ai\nderived_from:\n  - ghost-slug\n---\n",
        encoding="utf-8",
    )
    output = tmp_path / "out.json"
    result = _run_cli(articles_root=articles_root, sources_dir=sources_dir, output=output)

    assert result.returncode == 0
    assert "ghost-slug" in result.stderr  # warning printed
    index = json.loads(output.read_text(encoding="utf-8"))
    assert "ghost-slug" not in index


# ---------------------------------------------------------------------------
# Test 7 (bonus): article with no date → entry included, date is empty string, sinks to bottom
# ---------------------------------------------------------------------------

def test_build_index_returns_5_tuple(tmp_path):
    """build_index now returns a 5-tuple including non_public list."""
    articles_root = tmp_path / "articles"
    articles_root.mkdir()
    sources_dir = tmp_path / "sources"
    sources_dir.mkdir()
    (sources_dir / "src.md").write_text("---\ntitle: S\nvisibility: public\n---\n", encoding="utf-8")
    (articles_root / "art.md").write_text(
        "---\ntitle: A\ndate: 2026-01-01\npillar: ai\nderived_from:\n  - src\n---\n",
        encoding="utf-8",
    )
    result = build_index(articles_root, sources_dir, strict=False)
    assert len(result) == 5  # index, total, with_derived, missing, non_public


# ---------------------------------------------------------------------------
# Test E1a: internal source slug NOT written to index
# ---------------------------------------------------------------------------

def test_build_index_skips_internal_source(tmp_path):
    """Article referencing an internal source → slug does not appear in the index."""
    articles_root = tmp_path / "articles"
    articles_root.mkdir()
    sources_dir = tmp_path / "sources"
    sources_dir.mkdir()
    (sources_dir / "pub.md").write_text("---\ntitle: Pub\nvisibility: public\n---\n", encoding="utf-8")
    (sources_dir / "int.md").write_text("---\ntitle: Int\nvisibility: internal\n---\n", encoding="utf-8")
    (articles_root / "art.md").write_text(
        "---\ntitle: A\ndate: 2026-01-01\npillar: ai\nderived_from:\n  - int\n---\n",
        encoding="utf-8",
    )

    index, total, with_derived, missing, non_public = build_index(articles_root, sources_dir, strict=False)

    assert "int" not in index
    assert len(non_public) == 1
    assert non_public[0] == ("art", "int")
    assert missing == []


# ---------------------------------------------------------------------------
# Test E1b: internal source + --strict → exit 1
# ---------------------------------------------------------------------------

def test_build_index_strict_fails_on_internal(tmp_path):
    """Article with internal derived_from + --strict → exit 1, slug in stderr."""
    articles_root = tmp_path / "articles"
    articles_root.mkdir()
    sources_dir = tmp_path / "sources"
    sources_dir.mkdir()
    (sources_dir / "int.md").write_text("---\ntitle: Int\nvisibility: internal\n---\n", encoding="utf-8")
    (articles_root / "art.md").write_text(
        "---\ntitle: A\ndate: 2026-01-01\npillar: ai\nderived_from:\n  - int\n---\n",
        encoding="utf-8",
    )
    output = tmp_path / "out.json"
    result = _run_cli("--strict", articles_root=articles_root, sources_dir=sources_dir, output=output)

    assert result.returncode == 1
    assert "int" in result.stderr


# ---------------------------------------------------------------------------
# Test E1c: public source with explicit visibility=public → included normally
# ---------------------------------------------------------------------------

def test_build_index_explicit_public_visibility_included(tmp_path):
    """Source with explicit visibility=public is included in the index as normal."""
    articles_root = tmp_path / "articles"
    articles_root.mkdir()
    sources_dir = tmp_path / "sources"
    sources_dir.mkdir()
    (sources_dir / "pub.md").write_text("---\ntitle: Pub\nvisibility: public\n---\n", encoding="utf-8")
    (articles_root / "art.md").write_text(
        "---\ntitle: A\ndate: 2026-04-01\npillar: ai\nderived_from:\n  - pub\n---\n",
        encoding="utf-8",
    )

    index, _, _, missing, non_public = build_index(articles_root, sources_dir, strict=False)

    assert "pub" in index
    assert missing == []
    assert non_public == []


def test_date_missing_falls_to_bottom(tmp_path):
    """Article missing date field → entry still included, date='', sorted below dated entries."""
    articles_root = tmp_path / "articles"
    articles_root.mkdir()
    sources_dir = tmp_path / "sources"
    sources_dir.mkdir()
    (sources_dir / "source-1.md").write_text("---\ntitle: S1\n---\n", encoding="utf-8")

    (articles_root / "dated.md").write_text(
        "---\ntitle: Dated\ndate: 2026-04-01\npillar: ai\nderived_from:\n  - source-1\n---\n",
        encoding="utf-8",
    )
    (articles_root / "no-date.md").write_text(
        "---\ntitle: No Date\npillar: ai\nderived_from:\n  - source-1\n---\n",
        encoding="utf-8",
    )

    index, _, _, _, _ = build_index(articles_root, sources_dir, strict=False)
    entries = index["source-1"]
    assert len(entries) == 2
    # dated entry comes first (descending); no-date entry has date=""
    assert entries[0]["date"] == "2026-04-01"
    assert entries[1]["date"] == ""
