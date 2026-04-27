#!/usr/bin/env python3
"""
Validate article frontmatter `derived_from` field — every slug must exist
under `src/content/wiki/sources/` AND have visibility=public.

SSOT: docs/article-derived-from.md
Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).

Usage:
    python3 scripts/wiki-derived-from-validate.py                       # validate all articles
    python3 scripts/wiki-derived-from-validate.py path/to/article.md    # single file
    python3 scripts/wiki-derived-from-validate.py --strict              # exit 1 on any missing or non-public slug

Exit codes:
    0  all derived_from slugs valid (or absent / empty)
    1  --strict mode + at least one missing or non-public slug
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


def load_source_visibility_map(sources_dir: Path = WIKI_SOURCES_DIR) -> dict[str, str]:
    """Return slug → visibility for all wiki sources. Default visibility is 'public'."""
    result: dict[str, str] = {}
    if not sources_dir.is_dir():
        return result
    for p in iter_source_paths(sources_dir):
        fm, _ = load_source(p)
        visibility = (fm or {}).get("visibility", "public")
        result[p.stem] = str(visibility)
    return result


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


def validate_one(
    article_path: Path,
    valid_slugs: set[str],
    visibility_map: dict[str, str] | None = None,
) -> list[str]:
    """Return a list of invalid slugs for this article (empty when all good).

    Special markers:
    - `<not-a-list:{type}>` — derived_from is present but not a list (mis-fill)
    - `<not-found:{slug}>` — slug does not exist in sources
    - `<not-public:{slug}>` — slug exists but visibility != public
    """
    fm, _ = load_source(article_path)
    if fm is None:
        return []  # no frontmatter — not an error for this check
    derived = fm.get("derived_from")
    if derived is None:
        return []
    if not isinstance(derived, list):
        return [f"<not-a-list:{type(derived).__name__}>"]
    errors: list[str] = []
    for s in derived:
        if s not in valid_slugs:
            errors.append(f"<not-found:{s}>")
        elif visibility_map is not None and visibility_map.get(s, "public") != "public":
            errors.append(f"<not-public:{s}>")
    return errors


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strict = "--strict" in sys.argv

    file_arg = args[0] if args else None
    articles = collect_articles(file_arg)
    valid_slugs = known_source_slugs()
    visibility_map = load_source_visibility_map()

    public_count = sum(1 for v in visibility_map.values() if v == "public")
    internal_count = len(visibility_map) - public_count

    total = 0
    with_derived = 0
    with_missing = 0
    with_non_public = 0
    all_errors: list[tuple[Path, list[str]]] = []

    for path in articles:
        total += 1
        fm, _ = load_source(path)
        if fm and (fm.get("derived_from") or []):
            with_derived += 1
        errors = validate_one(path, valid_slugs, visibility_map)
        if errors:
            has_missing = any(e.startswith("<not-found:") or e.startswith("<not-a-list:") for e in errors)
            has_non_public = any(e.startswith("<not-public:") for e in errors)
            if has_missing:
                with_missing += 1
            if has_non_public:
                with_non_public += 1
            all_errors.append((path, errors))

    print("=== Article derived_from validation ===")
    print(f"Articles scanned:    {total}")
    print(f"With derived_from:   {with_derived}")
    print(f"Wiki sources known:  {len(valid_slugs)} (public: {public_count}, internal: {internal_count})")
    print(f"Missing slugs in:    {with_missing} article(s)")
    print(f"Non-public slugs in: {with_non_public} article(s)")

    if all_errors:
        print()
        print("Invalid references:")
        for path, errors in all_errors:
            try:
                rel = path.relative_to(ROOT)
            except ValueError:
                rel = path
            print(f"  {rel}")
            for e in errors:
                print(f"    - {e}")

    if strict and all_errors:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
