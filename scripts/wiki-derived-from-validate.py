#!/usr/bin/env python3
"""
Validate article frontmatter `derived_from` field — every slug must exist
under `src/content/wiki/sources/`.

SSOT: docs/article-derived-from.md
Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).

Usage:
    python3 scripts/wiki-derived-from-validate.py                       # validate all articles
    python3 scripts/wiki-derived-from-validate.py path/to/article.md    # single file
    python3 scripts/wiki-derived-from-validate.py --strict              # exit 1 on any missing slug

Exit codes:
    0  all derived_from slugs valid (or absent / empty)
    1  --strict mode + at least one missing slug
    2  CLI usage error
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

from wiki_corpus_lib import iter_source_paths, load_source  # noqa: E402

ARTICLES_DIRS = [
    ROOT / "src" / "content" / "articles",
    ROOT / "src" / "content" / "articles" / "en",
    ROOT / "src" / "content" / "articles" / "ja",
    ROOT / "src" / "content" / "articles" / "zh-cn",
]
WIKI_SOURCES_DIR = ROOT / "src" / "content" / "wiki" / "sources"


def known_source_slugs(sources_dir: Path = WIKI_SOURCES_DIR) -> set[str]:
    """Return the set of all wiki source slugs (filename stems)."""
    if not sources_dir.is_dir():
        return set()
    return {p.stem for p in iter_source_paths(sources_dir)}


def collect_articles(arg: str | None) -> list[Path]:
    """Return the list of article paths to validate."""
    if arg:
        p = Path(arg)
        if not p.exists():
            print(f"❌ {arg}: file not found", file=sys.stderr)
            sys.exit(2)
        return [p]
    paths: list[Path] = []
    for d in ARTICLES_DIRS:
        if d.is_dir():
            # Top-level articles dir contains language subdirs; only take
            # *.md directly in that directory, not recursively.
            paths.extend(sorted(d.glob("*.md")))
    return paths


def validate_one(article_path: Path, valid_slugs: set[str]) -> list[str]:
    """Return a list of missing slugs for this article (empty when all good).

    Special markers:
    - `<not-a-list:{type}>` — derived_from is present but not a list (mis-fill)
    """
    fm, _ = load_source(article_path)
    if fm is None:
        return []  # no frontmatter — not an error for this check
    derived = fm.get("derived_from")
    if derived is None:
        return []
    if not isinstance(derived, list):
        return [f"<not-a-list:{type(derived).__name__}>"]
    return [s for s in derived if s not in valid_slugs]


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strict = "--strict" in sys.argv

    file_arg = args[0] if args else None
    articles = collect_articles(file_arg)
    valid_slugs = known_source_slugs()

    total = 0
    with_derived = 0
    with_missing = 0
    all_missing: list[tuple[Path, list[str]]] = []

    for path in articles:
        total += 1
        fm, _ = load_source(path)
        if fm and (fm.get("derived_from") or []):
            with_derived += 1
        missing = validate_one(path, valid_slugs)
        if missing:
            with_missing += 1
            all_missing.append((path, missing))

    print("=== Article derived_from validation ===")
    print(f"Articles scanned:   {total}")
    print(f"With derived_from:  {with_derived}")
    print(f"Wiki sources known: {len(valid_slugs)}")
    print(f"Missing slugs in:   {with_missing} article(s)")

    if all_missing:
        print()
        print("Missing references:")
        for path, slugs in all_missing:
            try:
                rel = path.relative_to(ROOT)
            except ValueError:
                rel = path
            print(f"  {rel}")
            for s in slugs:
                print(f"    - {s}")

    if strict and all_missing:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
