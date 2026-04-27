#!/usr/bin/env python3
"""
Wiki Dialogue Marker Detector — Phase 1 (Heuristic only)

Scans src/content/wiki/sources/ frontmatter + body to detect dialogue/interview content.
Writes dialogue / dialogue_inference / speakers fields to frontmatter when --apply is used.

Run:
    python3 scripts/wiki-dialogue-detect.py --dry-run        # scan all, print distribution
    python3 scripts/wiki-dialogue-detect.py --apply          # write frontmatter (Phase 2)
    python3 scripts/wiki-dialogue-detect.py <slug>           # spot check one file
"""

import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SOURCES_DIR = ROOT / "src" / "content" / "wiki" / "sources"

sys.path.insert(0, str(ROOT / "scripts"))
from wiki_corpus_lib import load_source, write_source, iter_source_paths  # noqa: E402
from wiki_dialogue_lib import (  # noqa: E402
    detect_dialogue,
    TITLE_KEYWORDS,
    SPEAKER_PATTERNS,
    MIN_UNIQUE_SPEAKERS,
    MIN_TOTAL_MARKERS,
)


def load_quarantine_rules():
    """Return set of slugs that have has_recording_tag + business_meeting conditions."""
    rules_path = ROOT / 'data' / 'wiki-quarantine-rules.yml'
    if not rules_path.exists():
        return set()
    try:
        data = yaml.safe_load(rules_path.read_text(encoding='utf-8')) or {}
    except yaml.YAMLError:
        return set()
    recording_and_meeting = set()
    for md_path in iter_source_paths(SOURCES_DIR):
        fm, _ = load_source(md_path)
        fm = fm or {}
        tags = fm.get('tags', []) or []
        if 'recording' in tags and 'business_meeting' in tags:
            recording_and_meeting.add(md_path.stem)
    return recording_and_meeting


def run_dry_run():
    files = list(iter_source_paths(SOURCES_DIR))
    total = len(files)
    print(f'=== Wiki Dialogue Marker Detector — DRY-RUN ===\n')
    print(f'Scanning {SOURCES_DIR.relative_to(ROOT)} ... {total} files\n')

    results = []
    for path in files:
        fm, body = load_source(path)
        fm = fm or {}
        r = detect_dialogue(fm, body)
        results.append((path.stem, r))

    true_results = [(slug, r) for slug, r in results if r['dialogue']]
    false_results = [(slug, r) for slug, r in results if not r['dialogue']]

    # Breakdown by reason category
    reason_counts: dict[str, int] = {}
    for slug, r in true_results:
        reason = r['reason']
        for kw in TITLE_KEYWORDS:
            if f'title contains "{kw}"' == reason:
                key = f'title contains "{kw}"'
                break
        else:
            if 'unique speakers' in reason:
                key = '2+ unique speakers'
            elif 'single speaker dominant' in reason:
                key = '4+ markers (single dominant)'
            else:
                key = reason
        reason_counts[key] = reason_counts.get(key, 0) + 1

    print('Distribution:')
    print(f'  dialogue=true:   {len(true_results)} ({len(true_results)/total*100:.1f}%)')
    print(f'    └ by reason:')
    for k, v in sorted(reason_counts.items(), key=lambda x: -x[1]):
        print(f'        - {k}: {v}')
    print(f'  dialogue=false:  {len(false_results)} ({len(false_results)/total*100:.1f}%)')

    print(f'\nTop 10 dialogue=true samples:')
    for slug, r in true_results[:10]:
        print(f'  - {slug} (reason: {r["reason"]})')

    # False positive candidates: title keyword hit but no speaker markers
    fp_candidates = []
    for slug, r in true_results:
        if 'title contains' in r['reason']:
            fp_candidates.append((slug, r))
    if fp_candidates:
        print(f'\nTop 5 false positive candidates (title-only hit, manual review):')
        for slug, r in fp_candidates[:5]:
            fp_path = SOURCES_DIR / f'{slug}.md'
            _, body = load_source(fp_path)
            excerpt = body.strip()[:120].replace('\n', ' ')
            print(f'  - {slug} (reason: {r["reason"]}, excerpt: "{excerpt}...")')

    # Cross-check with quarantine rules
    recording_and_meeting = load_quarantine_rules()
    overlap = {slug for slug, r in true_results if slug in recording_and_meeting}
    print(f'\nCross-check with quarantine rules.yml:')
    print(f'  - 命中 has_recording_tag + business_meeting + dialogue=true: {len(overlap)} 支')
    if overlap:
        print(f'    slugs: {sorted(overlap)}')
    print(f'  - 這 {len(overlap)} 支會在 is_dialogue enable 後自動 outcome=delete')

    print(f'\n(use --apply to write frontmatter)')


def run_apply():
    updated = 0
    for path in iter_source_paths(SOURCES_DIR):
        fm, body = load_source(path)
        fm = fm or {}
        r = detect_dialogue(fm, body)
        fm['dialogue'] = r['dialogue']
        fm['dialogue_inference'] = r['dialogue_inference']
        if 'speakers' in r:
            fm['speakers'] = r['speakers']
        write_source(path, fm, body)
        updated += 1
    print(f'Applied dialogue fields to {updated} files.')


def run_spot(slug: str):
    path = SOURCES_DIR / f'{slug}.md'
    if not path.exists():
        candidates = list(SOURCES_DIR.glob(f'{slug}*'))
        if not candidates:
            print(f'ERROR: {slug} not found in {SOURCES_DIR}')
            sys.exit(1)
        path = candidates[0]
    fm, body = load_source(path)
    fm = fm or {}
    r = detect_dialogue(fm, body)
    print(f'slug:               {path.stem}')
    print(f'title:              {fm.get("title", "(no title)")}')
    print(f'dialogue:           {r["dialogue"]}')
    print(f'dialogue_inference: {r["dialogue_inference"]}')
    if 'speakers' in r:
        print(f'speakers:           {r["speakers"]}')
    print(f'reason:             {r["reason"]}')


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or args[0] == '--dry-run':
        run_dry_run()
    elif args[0] == '--apply':
        run_apply()
    else:
        run_spot(args[0])
