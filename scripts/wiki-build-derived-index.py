#!/usr/bin/env python3
"""
Build the derived_from reverse index for all wiki articles across all languages.

Scans src/content/articles/{,en,ja,zh-cn}/*.md, reads derived_from frontmatter,
and outputs a reverse index (source slug → list of articles) to
data/wiki-derived-index.json.

SSOT: docs/article-derived-from.md
Phase 4 Step A — reverse index build script.

Usage:
    python3 scripts/wiki-build-derived-index.py [--strict]
                                                 [--articles-root PATH]
                                                 [--sources-dir PATH]
                                                 [--output PATH]

Exit codes:
    0  success
    1  --strict mode + at least one derived_from slug not found in sources
    2  CLI usage error
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Optional  # noqa: F401

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from wiki_corpus_lib import iter_source_paths, load_source  # noqa: E402

DEFAULT_ARTICLES_ROOT = ROOT / "src" / "content" / "articles"
DEFAULT_SOURCES_DIR = ROOT / "src" / "content" / "wiki" / "sources"
DEFAULT_OUTPUT = ROOT / "data" / "wiki-derived-index.json"

LANG_SUBDIRS = {
    "en": "en",
    "ja": "ja",
    "zh-cn": "zh-cn",
}


def detect_lang(path: Path, articles_root: Path) -> str:
    """Return the lang code based on the article's directory."""
    try:
        rel = path.relative_to(articles_root)
    except ValueError:
        return "zh"
    parts = rel.parts
    if len(parts) == 1:
        return "zh"
    subdir = parts[0]
    return LANG_SUBDIRS.get(subdir, "zh")


def iter_article_paths(articles_root: Path):
    """Yield (path, lang) for all articles across all language subdirectories."""
    if not articles_root.is_dir():
        return
    # Direct children (zh)
    for p in sorted(articles_root.glob("*.md")):
        if not p.name.startswith("."):
            yield p, "zh"
    # Language subdirectories
    for subdir, lang in LANG_SUBDIRS.items():
        lang_dir = articles_root / subdir
        if lang_dir.is_dir():
            for p in sorted(lang_dir.glob("*.md")):
                if not p.name.startswith("."):
                    yield p, lang


def known_source_slugs(sources_dir: Path) -> set[str]:
    if not sources_dir.is_dir():
        return set()
    return {p.stem for p in iter_source_paths(sources_dir)}


def load_source_visibility_map(sources_dir: Path) -> dict[str, str]:
    """Return slug → visibility for all wiki sources. Default visibility is 'public'."""
    result: dict[str, str] = {}
    if not sources_dir.is_dir():
        return result
    for p in iter_source_paths(sources_dir):
        fm, _ = load_source(p)
        visibility = (fm or {}).get("visibility", "public")
        result[p.stem] = str(visibility)
    return result


def build_index(
    articles_root: Path,
    sources_dir: Path,
    strict: bool,
) -> tuple[dict[str, list[dict]], int, int, list[tuple[str, str]], list[tuple[str, str]]]:
    """Build and return the reverse index.

    Returns:
        (index, articles_scanned, with_derived_from, missing_slugs, non_public_slugs)
        missing_slugs:    list of (article_slug, source_slug) for unknown refs
        non_public_slugs: list of (article_slug, source_slug) for internal-visibility refs
    """
    valid_slugs = known_source_slugs(sources_dir)
    source_visibility = load_source_visibility_map(sources_dir)
    index: dict[str, list[dict]] = {}
    articles_scanned = 0
    with_derived = 0
    missing: list[tuple[str, str]] = []
    non_public: list[tuple[str, str]] = []

    for path, lang in iter_article_paths(articles_root):
        articles_scanned += 1
        fm, _ = load_source(path)
        if fm is None:
            continue
        derived = fm.get("derived_from")
        if not derived or not isinstance(derived, list):
            continue
        with_derived += 1
        article_slug = path.stem
        title = str(fm.get("title") or "")
        raw_date = fm.get("date")
        date_str = str(raw_date) if raw_date else ""
        pillar = str(fm.get("pillar") or "")
        entry = {
            "article_slug": article_slug,
            "lang": lang,
            "title": title,
            "date": date_str,
            "pillar": pillar,
        }
        for slug in derived:
            if slug not in valid_slugs:
                missing.append((article_slug, slug))
                if not strict:
                    print(f"⚠️  warning: unknown source slug '{slug}' in '{article_slug}'", file=sys.stderr)
                continue
            if source_visibility.get(slug, "public") != "public":
                non_public.append((article_slug, slug))
                if not strict:
                    print(
                        f"⚠️  warning: derived_from references internal source '{slug}' in '{article_slug}' (skipping)",
                        file=sys.stderr,
                    )
                continue
            if slug not in index:
                index[slug] = []
            index[slug].append(entry)

    # Sort each source's article list by date descending; missing date sinks to bottom
    for slug in index:
        index[slug].sort(key=lambda e: e["date"] or "", reverse=True)

    return index, articles_scanned, with_derived, missing, non_public


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Build derived_from reverse index for wiki articles.")
    parser.add_argument("--strict", action="store_true", help="Exit 1 on any invalid source slug")
    parser.add_argument("--articles-root", type=Path, default=DEFAULT_ARTICLES_ROOT)
    parser.add_argument("--sources-dir", type=Path, default=DEFAULT_SOURCES_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parsed = parser.parse_args()

    strict = parsed.strict
    articles_root = parsed.articles_root
    sources_dir = parsed.sources_dir
    output = parsed.output

    index, total, with_derived, missing, non_public = build_index(articles_root, sources_dir, strict)

    if strict and (missing or non_public):
        for article_slug, source_slug in missing:
            print(f"❌ missing source slug '{source_slug}' referenced by '{article_slug}'", file=sys.stderr)
        for article_slug, source_slug in non_public:
            print(f"❌ non-public source slug '{source_slug}' referenced by '{article_slug}'", file=sys.stderr)
        sys.exit(1)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(index, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")

    source_visibility = load_source_visibility_map(sources_dir)
    public_count = sum(1 for v in source_visibility.values() if v == "public")
    internal_count = len(source_visibility) - public_count
    print("=== Build derived_from reverse index ===")
    print(f"Articles scanned:   {total}")
    print(f"With derived_from:  {with_derived}")
    print(f"Sources known:      {len(source_visibility)} (public: {public_count}, internal: {internal_count})")
    print(f"Index entries:      {len(index)}")
    print(f"Non-public skipped: {len(non_public)}")
    print(f"Output:             {output}")

    sys.exit(0)


if __name__ == "__main__":
    main()
