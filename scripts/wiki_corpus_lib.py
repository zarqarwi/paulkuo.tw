from __future__ import annotations

"""
Shared frontmatter + source helpers for the wiki ingest pipeline.

Pure functions; I/O limited to load_source / write_source / iter_source_paths /
find_source_by_raw_note_id / load_blocklists.

Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).
"""

import json
import re
from pathlib import Path
from typing import Iterator, Optional

import yaml

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n(.*)", re.DOTALL)


# ---------------------------------------------------------------------------
# Frontmatter I/O
# ---------------------------------------------------------------------------

def parse_frontmatter(text: str) -> tuple[Optional[dict], str]:
    """Parse frontmatter from markdown text.

    Returns (fm_dict, body).  fm is None when the delimiter pattern is absent
    or the YAML block raises a parse error.  An empty-but-valid YAML block
    returns {} (not None) so callers can distinguish 'error' from 'empty'.
    """
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    try:
        fm = yaml.safe_load(m.group(1))
    except yaml.YAMLError:
        return None, m.group(2)
    return fm if fm is not None else {}, m.group(2)


def serialize_frontmatter(fm: dict, body: str) -> str:
    """Serialize frontmatter dict + body back to a markdown string."""
    fm_yaml = yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
    return "---\n" + fm_yaml + "---\n" + body


def load_source(path: Path) -> tuple[Optional[dict], str]:
    """Read a source file and parse its frontmatter.

    Returns (fm_dict, body).  fm is None when parsing fails.
    """
    text = path.read_text(encoding="utf-8")
    return parse_frontmatter(text)


def write_source(path: Path, fm: dict, body: str) -> None:
    """Serialize frontmatter + body and write to path."""
    path.write_text(serialize_frontmatter(fm, body), encoding="utf-8")


# ---------------------------------------------------------------------------
# ID extraction
# ---------------------------------------------------------------------------

def extract_raw_note_id(fm_or_path) -> Optional[str]:
    """Return raw_note_id as str, or None if absent / unreadable.

    Accepts a frontmatter dict or a Path (reads & parses the file).
    """
    if isinstance(fm_or_path, Path):
        fm, _ = load_source(fm_or_path)
        if fm is None:
            return None
        val = fm.get("raw_note_id")
    else:
        val = fm_or_path.get("raw_note_id") if isinstance(fm_or_path, dict) else None
    return str(val) if val else None


def extract_youtube_id(fm: dict) -> Optional[str]:
    """Return youtube_id as str, or None if absent."""
    val = fm.get("youtube_id") if isinstance(fm, dict) else None
    return str(val) if val else None


# ---------------------------------------------------------------------------
# Status checks
# ---------------------------------------------------------------------------

def is_enriched(fm: dict) -> bool:
    """True when enriched: true is set in frontmatter."""
    return bool(fm.get("enriched"))


def is_quarantined(fm_or_text) -> bool:
    """True when a quarantine block is present.

    Accepts a frontmatter dict (key presence) or a raw markdown str
    (fast substring check — same approach used by quarantine-classify.py
    to pre-filter files before full YAML parsing).
    """
    if isinstance(fm_or_text, dict):
        return "quarantine" in fm_or_text
    return "quarantine:" in fm_or_text


def needs_review(fm: dict) -> bool:
    """True when quarantine.needs_review is explicitly True."""
    quarantine = fm.get("quarantine") or {}
    return quarantine.get("needs_review") is True


def review_outcome(fm: dict) -> Optional[str]:
    """Return quarantine.review_outcome, coercing the sentinel 'pending' to None."""
    quarantine = fm.get("quarantine") or {}
    outcome = quarantine.get("review_outcome")
    if not outcome or outcome == "pending":
        return None
    return outcome


# ---------------------------------------------------------------------------
# Source discovery
# ---------------------------------------------------------------------------

def iter_source_paths(sources_dir: Path) -> Iterator[Path]:
    """Yield all non-hidden .md files in sources_dir, sorted by name."""
    for path in sorted(sources_dir.glob("*.md")):
        if not path.name.startswith("."):
            yield path


def find_source_by_raw_note_id(
    sources_dir: Path,
    raw_note_id: str,
    filename_hint: Optional[str] = None,
) -> Optional[Path]:
    """Find a source file by its raw_note_id frontmatter field.

    Tries filename_hint first (O(1) if correct), then falls back to a full
    directory scan.  Returns None when no match is found.
    """
    if filename_hint:
        candidate = sources_dir / filename_hint
        if candidate.exists():
            fm, _ = load_source(candidate)
            if fm and str(fm.get("raw_note_id", "")) == raw_note_id:
                return candidate
    for path in iter_source_paths(sources_dir):
        fm, _ = load_source(path)
        if fm and str(fm.get("raw_note_id", "")) == raw_note_id:
            return path
    return None


# ---------------------------------------------------------------------------
# Blocklist loader
# ---------------------------------------------------------------------------

def load_blocklists(blocklist_path: Path) -> tuple[dict, dict]:
    """Load wiki-ingest-blocklist.json.

    Returns (raw_note_id_blocklist, youtube_blocklist).  Both dicts are empty
    when the file is absent or unreadable.
    """
    if not blocklist_path.exists():
        return {}, {}
    try:
        doc = json.loads(blocklist_path.read_text(encoding="utf-8"))
    except Exception:
        return {}, {}
    return doc.get("blocklist", {}) or {}, doc.get("youtube_blocklist", {}) or {}
