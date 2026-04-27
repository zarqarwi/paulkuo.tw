#!/usr/bin/env python3
"""Build wiki ingest pending list report.

Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).
"""

import os
import re
import sys
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# Visibility rules live in scripts/wiki_visibility.py — see docs/wiki-visibility-rules.md (SSOT).
sys.path.insert(0, str(Path(__file__).resolve().parent))
from wiki_visibility import determine_visibility
from wiki_corpus_lib import iter_source_paths, extract_raw_note_id, load_blocklists

# Get ingested note_ids from wiki sources
wiki_sources_dir = Path("/Users/apple/Desktop/01_專案進行中/paulkuo.tw/src/content/wiki/sources")
ingested_ids = set()

for _src_path in iter_source_paths(wiki_sources_dir):
    _raw_id = extract_raw_note_id(_src_path)
    if _raw_id:
        ingested_ids.add(_raw_id)

print(f"Found {len(ingested_ids)} ingested note IDs")

# Load blocklist — raw_note_ids permanently excluded from scanner candidates.
# Populated by quarantine apply (delete outcomes) and manual skips.
blocklist_path = Path("/Users/apple/Desktop/01_專案進行中/paulkuo.tw/data/wiki-ingest-blocklist.json")
blocklist, _ = load_blocklists(blocklist_path)
print(f"Blocklist: {len(blocklist)} note(s) excluded")

# Scan get_筆記 folders
get_notes_dir = Path("/Users/apple/Desktop/01_專案進行中/get_筆記/notes")

# Visibility logic now lives in scripts/wiki_visibility.py (imported above).

# Collect all notes
pending_notes = defaultdict(list)  # visibility -> list of (folder, title, note_id)
total_notes = 0

for subfolder in sorted(get_notes_dir.iterdir()):
    if not subfolder.is_dir() or subfolder.name.startswith("01_"):
        continue  # skip 01_專欄文章 for now
    
    for md_file in sorted(subfolder.glob("*.md")):
        if md_file.name.startswith("_"):
            continue
        
        total_notes += 1
        
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()
                
                # Extract note_id and title from frontmatter
                note_id_match = re.search(r'note_id:\s*"([^"]+)"', content)
                title_match = re.search(r'title:\s*"([^"]+)"', content)
                tags_match = re.search(r'tags:\s*(\[.*?\])', content, re.DOTALL)
                
                if not note_id_match:
                    continue
                
                note_id = note_id_match.group(1)
                title = title_match.group(1) if title_match else md_file.stem
                
                # Parse tags
                tags = []
                if tags_match:
                    try:
                        tags_str = tags_match.group(1)
                        # Simple JSON-like parsing
                        tags = json.loads(tags_str)
                    except:
                        pass
                
                # Skip if already ingested
                if note_id in ingested_ids:
                    continue

                # Skip if in blocklist (delete outcome / manual exclude)
                if note_id in blocklist:
                    continue
                
                # Determine visibility
                visibility = determine_visibility(subfolder.name, tags)
                
                pending_notes[visibility].append({
                    "folder": subfolder.name,
                    "title": title,
                    "note_id": note_id
                })
        except Exception as e:
            print(f"Error processing {md_file}: {e}")

# Count ingested and pending
public_count = len(pending_notes.get("public", []))
internal_count = len(pending_notes.get("internal", []))
private_count = len(pending_notes.get("private", []))
total_pending = public_count + internal_count + private_count
total_ingestible = public_count + internal_count

# Build report
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
report = f"""# Wiki Ingest 待處理清單
> 掃描時間：{now}
> 已 ingest：{len(ingested_ids)} 篇
> 新發現：{total_pending} 篇

"""

if total_ingestible > 0:
    report += f"⚠️ 有新內容待 ingest\n\n"
else:
    report += f"✓ 目前沒有新的待 ingest 內容\n\n"

# Public section
if public_count > 0:
    report += f"## 可 ingest（public + internal）\n\n"
    report += f"### public（可直接 ingest）\n"
    report += f"共 {public_count} 篇\n\n"
    report += f"| # | 資料夾 | 標題 | note_id |\n"
    report += f"|---|--------|------|----------|\n"
    
    for i, note in enumerate(sorted(pending_notes.get("public", []), key=lambda x: x["folder"]), 1):
        report += f"| {i} | {note['folder']} | {note['title']} | {note['note_id']} |\n"
    
    report += "\n"

# Internal section
if internal_count > 0:
    report += f"### internal（需去識別化 ingest）\n"
    report += f"共 {internal_count} 篇\n\n"
    report += f"| # | 資料夾 | 標題 | note_id |\n"
    report += f"|---|--------|------|----------|\n"
    
    for i, note in enumerate(sorted(pending_notes.get("internal", []), key=lambda x: x["folder"]), 1):
        report += f"| {i} | {note['folder']} | {note['title']} | {note['note_id']} |\n"
    
    report += "\n"

# Private section
if private_count > 0:
    report += f"## 跳過（private）\n"
    report += f"共 {private_count} 篇（09_會議錄音、07_生活雜記等）\n\n"

# Recommendations
if total_ingestible > 0:
    report += f"## 建議\n"
    report += f"- 優先 ingest public 類別的 {public_count} 篇\n"
    if internal_count > 0:
        report += f"- 後續需去識別化處理 {internal_count} 篇 internal 內容\n"
    report += f"- 建議分批處理，每批 5-10 篇\n"

# Write report
output_path = Path("/Users/apple/Desktop/01_專案進行中/paulkuo.tw/worklogs/wiki-ingest-pending.md")
output_path.parent.mkdir(parents=True, exist_ok=True)

with open(output_path, "w", encoding="utf-8") as f:
    f.write(report)

print(f"✓ Report written to {output_path}")
print(f"  Public: {public_count}, Internal: {internal_count}, Private: {private_count}")
