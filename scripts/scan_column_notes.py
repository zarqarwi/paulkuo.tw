#!/usr/bin/env python3
"""
scan_column_notes.py

掃描 01_專欄文章 下所有 .md 檔，從 frontmatter 取 note_id，
比對 wiki/sources/getnote-*.md 的後六碼，
產出待 ingest 清單到 worklogs/wiki-column-pending.md。

用途：給 Cowork 的 batch 2 ingest 使用，省下手動讀 30+ 個專欄檔的工序。
"""

import os
import re
from datetime import datetime, timezone

COLUMN_DIR = os.path.expanduser(
    "~/Desktop/01_專案進行中/get_筆記/notes/01_專欄文章"
)
SOURCES_DIR = os.path.expanduser(
    "~/Desktop/01_專案進行中/paulkuo.tw/src/content/wiki/sources"
)
OUTPUT_FILE = os.path.expanduser(
    "~/Desktop/01_專案進行中/paulkuo.tw/worklogs/wiki-column-pending.md"
)


def extract_frontmatter(content):
    """Return frontmatter dict from markdown content (regex-only, no PyYAML)."""
    fm_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not fm_match:
        return {}
    fm_str = fm_match.group(1)

    result = {}

    # note_id
    m = re.search(r'note_id:\s*"?(\d+)"?', fm_str)
    if m:
        result['note_id'] = m.group(1)

    # title
    m = re.search(r'title:\s*"?([^\n"]+)"?', fm_str)
    if m:
        result['title'] = m.group(1).strip()

    # tags — handle both inline array and multiline list
    tags_inline = re.search(r'tags:\s*\[([^\]]*)\]', fm_str)
    tags_multiline = re.search(r'tags:((?:\s*\n\s*-[^\n]+)+)', fm_str)
    tags = []
    if tags_inline:
        tags = [t.strip().strip('"').strip("'") for t in tags_inline.group(1).split(',') if t.strip()]
    elif tags_multiline:
        tags = [t.strip().lstrip('- ').strip('"').strip("'")
                for t in tags_multiline.group(1).splitlines() if t.strip().startswith('-')]
    result['tags'] = tags

    return result


def get_ingested_last6(sources_dir):
    """Return set of last-6-digit note IDs already ingested."""
    ingested = set()
    if not os.path.isdir(sources_dir):
        return ingested
    for f in os.listdir(sources_dir):
        m = re.match(r'getnote-(\d{6})-', f)
        if m:
            ingested.add(m.group(1))
    return ingested


def scan_column_notes(column_dir, ingested):
    """
    Recursively scan column_dir for .md files.
    Returns list of dicts with scan results.
    """
    results = []
    if not os.path.isdir(column_dir):
        print(f"[WARN] Column directory not found: {column_dir}")
        return results

    for root, dirs, files in os.walk(column_dir):
        dirs.sort()
        subfolder = os.path.relpath(root, column_dir)
        if subfolder == '.':
            subfolder = '（根目錄）'

        for fname in sorted(files):
            if not fname.endswith('.md') or fname.startswith('.'):
                continue

            fpath = os.path.join(root, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as fh:
                    content = fh.read()
            except Exception as e:
                print(f"[WARN] Cannot read {fpath}: {e}")
                continue

            fm = extract_frontmatter(content)
            note_id = fm.get('note_id', '')

            if not note_id:
                # No note_id in frontmatter — skip
                continue

            last6 = note_id[-6:]
            title = fm.get('title', fname.replace('.md', ''))[:80]
            tags = fm.get('tags', [])
            is_recording = '录音笔记' in tags or '录音笔记' in content[:500]

            visibility = 'internal' if is_recording else 'public'
            already_ingested = last6 in ingested

            results.append({
                'last6': last6,
                'note_id': note_id,
                'title': title,
                'subfolder': subfolder,
                'visibility': visibility,
                'ingested': already_ingested,
                'fname': fname,
            })

    return results


def build_report(results, ingested):
    """Build markdown report content."""
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

    total = len(results)
    already = sum(1 for r in results if r['ingested'])
    new_public = [r for r in results if not r['ingested'] and r['visibility'] == 'public']
    new_internal = [r for r in results if not r['ingested'] and r['visibility'] == 'internal']
    new_all = [r for r in results if not r['ingested']]

    # Per-subfolder stats
    folders = {}
    for r in results:
        sf = r['subfolder']
        if sf not in folders:
            folders[sf] = {'total': 0, 'ingested': 0, 'new': 0}
        folders[sf]['total'] += 1
        if r['ingested']:
            folders[sf]['ingested'] += 1
        else:
            folders[sf]['new'] += 1

    lines = []
    lines.append("# 01_專欄文章 待 ingest 清單")
    lines.append("")
    lines.append(f"> 自動產出 by `scripts/scan_column_notes.py`")
    lines.append(f"> 掃描時間：{now}")
    lines.append("")
    lines.append("## 摘要")
    lines.append("")
    lines.append("| 項目 | 數量 |")
    lines.append("|------|------|")
    lines.append(f"| 掃描檔案數 | {total} |")
    lines.append(f"| 已 ingest | {already} |")
    lines.append(f"| 新發現可 ingest（public） | {len(new_public)} |")
    lines.append(f"| 新發現（internal/錄音） | {len(new_internal)} |")
    lines.append(f"| 新發現合計 | {len(new_all)} |")
    lines.append("")
    lines.append("## 各專欄分布")
    lines.append("")
    lines.append("| 專欄 | 總數 | 已 ingest | 新發現 |")
    lines.append("|------|------|----------|--------|")
    for sf, stats in sorted(folders.items()):
        lines.append(f"| {sf} | {stats['total']} | {stats['ingested']} | {stats['new']} |")
    lines.append("")

    if new_public:
        lines.append("## 新發現待 ingest（public）")
        lines.append("")
        lines.append("| note_id 後 6 碼 | 標題 | 專欄 | visibility |")
        lines.append("|---|---|---|---|")
        for r in new_public:
            lines.append(f"| {r['last6']} | {r['title']} | {r['subfolder']} | public |")
        lines.append("")

    if new_internal:
        lines.append("## 新發現（internal — 含錄音卡，需去識別化）")
        lines.append("")
        lines.append("| note_id 後 6 碼 | 標題 | 專欄 | visibility |")
        lines.append("|---|---|---|---|")
        for r in new_internal:
            lines.append(f"| {r['last6']} | {r['title']} | {r['subfolder']} | internal |")
        lines.append("")

    if not new_all:
        lines.append("## 🎉 全部已 ingest，無待處理項目")
        lines.append("")

    return "\n".join(lines)


def main():
    print(f"Scanning: {COLUMN_DIR}")
    ingested = get_ingested_last6(SOURCES_DIR)
    print(f"Already ingested (last-6 set): {len(ingested)} sources")

    results = scan_column_notes(COLUMN_DIR, ingested)
    print(f"Column notes found (with note_id): {len(results)}")

    report = build_report(results, ingested)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(report)

    new_public = [r for r in results if not r['ingested'] and r['visibility'] == 'public']
    print(f"\nOutput written to: {OUTPUT_FILE}")
    print(f"New public items: {len(new_public)}")
    if new_public:
        print("\nNew public last-6 codes:")
        for r in new_public:
            print(f"  {r['last6']}  {r['title'][:60]}  [{r['subfolder']}]")


if __name__ == '__main__':
    main()
