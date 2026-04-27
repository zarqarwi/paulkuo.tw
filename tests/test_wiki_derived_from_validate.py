"""
Unit tests for scripts/wiki-derived-from-validate.py.

Run: python3 -m pytest tests/test_wiki_derived_from_validate.py -v

Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).
SSOT for derived_from: docs/article-derived-from.md.
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))


# Load the validator module directly from its filename (it has a hyphen so
# `import wiki-derived-from-validate` is not a valid Python statement).
def _load_validator():
    spec = importlib.util.spec_from_file_location(
        "wiki_derived_from_validate",
        PROJECT_ROOT / "scripts" / "wiki-derived-from-validate.py",
    )
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


validator = _load_validator()
validate_one = validator.validate_one
known_source_slugs = validator.known_source_slugs


# ---------------------------------------------------------------------------
# validate_one
# ---------------------------------------------------------------------------

def test_validate_one_no_derived_from(tmp_path):
    """Article without derived_from key returns []."""
    p = tmp_path / "article.md"
    p.write_text("---\ntitle: foo\npillar: ai\n---\nbody\n", encoding="utf-8")
    assert validate_one(p, valid_slugs={"any-slug"}) == []


def test_validate_one_empty_list(tmp_path):
    """derived_from: [] returns []."""
    p = tmp_path / "article.md"
    p.write_text(
        "---\ntitle: foo\npillar: ai\nderived_from: []\n---\nbody\n",
        encoding="utf-8",
    )
    assert validate_one(p, valid_slugs={"slug-a"}) == []


def test_validate_one_all_valid(tmp_path):
    """All slugs present in valid_slugs — returns []."""
    p = tmp_path / "article.md"
    p.write_text(
        "---\ntitle: foo\npillar: ai\nderived_from:\n  - slug-a\n  - slug-b\n---\nbody\n",
        encoding="utf-8",
    )
    assert validate_one(p, valid_slugs={"slug-a", "slug-b", "slug-c"}) == []


def test_validate_one_some_missing(tmp_path):
    """Mix of valid and missing — returns only the missing ones."""
    p = tmp_path / "article.md"
    p.write_text(
        "---\ntitle: foo\npillar: ai\nderived_from:\n"
        "  - slug-a\n  - missing-slug\n  - slug-b\n---\nbody\n",
        encoding="utf-8",
    )
    missing = validate_one(p, valid_slugs={"slug-a", "slug-b"})
    assert missing == ["missing-slug"]


def test_validate_one_all_missing(tmp_path):
    """No slugs match — returns all of them."""
    p = tmp_path / "article.md"
    p.write_text(
        "---\ntitle: foo\npillar: ai\nderived_from:\n  - x\n  - y\n---\nbody\n",
        encoding="utf-8",
    )
    missing = validate_one(p, valid_slugs={"a", "b"})
    assert missing == ["x", "y"]


def test_validate_one_not_a_list(tmp_path):
    """derived_from filled as a string instead of list — flagged with marker."""
    p = tmp_path / "article.md"
    p.write_text(
        "---\ntitle: foo\npillar: ai\nderived_from: just-a-string\n---\nbody\n",
        encoding="utf-8",
    )
    missing = validate_one(p, valid_slugs={"just-a-string"})
    assert len(missing) == 1
    assert missing[0].startswith("<not-a-list:")
    assert "str" in missing[0]


def test_validate_one_no_frontmatter(tmp_path):
    """File without frontmatter returns [] (not an error for this check)."""
    p = tmp_path / "article.md"
    p.write_text("plain markdown body, no frontmatter\n", encoding="utf-8")
    assert validate_one(p, valid_slugs={"anything"}) == []


def test_validate_one_unicode_slug(tmp_path):
    """Non-ASCII slug works as long as it matches valid_slugs."""
    p = tmp_path / "article.md"
    p.write_text(
        "---\ntitle: foo\npillar: ai\nderived_from:\n  - getnote-中文-slug\n---\nbody\n",
        encoding="utf-8",
    )
    assert validate_one(p, valid_slugs={"getnote-中文-slug"}) == []


# ---------------------------------------------------------------------------
# known_source_slugs
# ---------------------------------------------------------------------------

def test_known_source_slugs_returns_stems(tmp_path):
    """Reads .md filenames in sources_dir and returns their stems."""
    (tmp_path / "alpha.md").write_text("---\ntitle: a\n---\nx\n", encoding="utf-8")
    (tmp_path / "beta.md").write_text("---\ntitle: b\n---\nx\n", encoding="utf-8")
    (tmp_path / "gamma.txt").write_text("ignored", encoding="utf-8")  # non-md
    (tmp_path / ".hidden.md").write_text("hidden", encoding="utf-8")  # hidden
    slugs = known_source_slugs(sources_dir=tmp_path)
    assert slugs == {"alpha", "beta"}


def test_known_source_slugs_missing_dir_returns_empty(tmp_path):
    """When sources_dir does not exist, returns empty set."""
    missing = tmp_path / "does-not-exist"
    assert known_source_slugs(sources_dir=missing) == set()


def test_known_source_slugs_empty_dir_returns_empty(tmp_path):
    """Empty directory → empty set."""
    assert known_source_slugs(sources_dir=tmp_path) == set()
