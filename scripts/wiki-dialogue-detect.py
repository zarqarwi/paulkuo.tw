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
from wiki_dialogue_lib import (  # noqa: E402
    detect_dialogue,
    TITLE_KEYWORDS,
    SPEAKER_PATTERNS,
    MIN_UNIQUE_SPEAKERS,
    MIN_TOTAL_MARKERS,
)


def parse_md(path: Path):
    """Split markdown into (frontmatter_dict, body_str). Returns ({}, '') on parse error."""
    text = path.read_text(encoding='utf-8')
    if not text.startswith('---'):
        return {}, text
    parts = text.split('---', 2)
    if len(parts) < 3:
        return {}, text
    try:
        fm = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        fm = {}
    return fm, parts[2]


def write_frontmatter(path: Path, fm: dict, result: dict):
    """Merge dialogue fields into frontmatter and rewrite the file."""
    _, body = parse_md(path)
    fm['dialogue'] = result['dialogue']
    fm['dialogue_inference'] = result['dialogue_inference']
    if 'speakers' in result:
        fm['speakers'] = result['speakers']
    new_text = '---\n' + yaml.dump(fm, allow_unicode=True, sort_keys=False) + '---' + body
    path.write_text(new_text, encoding='utf-8')


def load_quarantine_rules():
    """Return set of slugs that have has_recording_tag + business_meeting conditions."""
    rules_path = ROOT / 'data' / 'wiki-quarantine-rules.yml'
    if not rules_path.exists():
        return set()
    try:
        data = yaml.safe_load(rules_path.read_text(encoding='utf-8')) or {}
    except yaml.YAMLError:
        return set()
    # Collect slugs from sources that have both tags
    recording_and_meeting = set()
    sources_dir = SOURCES_DIR
    for md_path in sources_dir.glob('*.md'):
        fm, _ = parse_md(md_path)
        tags = fm.get('tags', []) or []
        if 'recording' in tags and 'business_meeting' in tags:
            recording_and_meeting.add(md_path.stem)
    return recording_and_meeting


def run_dry_run():
    files = sorted(SOURCES_DIR.glob('*.md'))
    total = len(files)
    print(f'=== Wiki Dialogue Marker Detector — DRY-RUN ===\n')
    print(f'Scanning {SOURCES_DIR.relative_to(ROOT)} ... {total} files\n')

    results = []
    for path in files:
        fm, body = parse_md(path)
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
            _, body = parse_md(fp_path)
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
    files = sorted(SOURCES_DIR.glob('*.md'))
    updated = 0
    for path in files:
        fm, body = parse_md(path)
        r = detect_dialogue(fm, body)
        write_frontmatter(path, fm, r)
        updated += 1
    print(f'Applied dialogue fields to {updated} files.')


def run_spot(slug: str):
    path = SOURCES_DIR / f'{slug}.md'
    if not path.exists():
        # try without extension
        candidates = list(SOURCES_DIR.glob(f'{slug}*'))
        if not candidates:
            print(f'ERROR: {slug} not found in {SOURCES_DIR}')
            sys.exit(1)
        path = candidates[0]
    fm, body = parse_md(path)
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
