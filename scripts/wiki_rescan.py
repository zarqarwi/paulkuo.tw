#!/usr/bin/env python3
"""Wiki ingest rescan: compare get_筆記 notes vs ingested sources."""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wiki_visibility import has_recording_tag  # noqa: E402
from wiki_corpus_lib import parse_frontmatter  # noqa: E402

notes_dir = os.path.expanduser("~/Desktop/01_專案進行中/get_筆記/notes")
sources_dir = os.path.expanduser("~/Desktop/01_專案進行中/paulkuo.tw/src/content/wiki/sources")
skip_folders = ["_duplicates"]

all_notes = {}

for root, dirs, files in os.walk(notes_dir):
    dirs[:] = [d for d in dirs if d not in skip_folders]
    folder = os.path.basename(root)
    if folder == "notes":
        continue
    for f in files:
        if not f.endswith(".md") or f.startswith("."):
            continue
        filepath = os.path.join(root, f)
        id_match = re.search(r"_(\d{6,})\.md$", f)
        if not id_match:
            continue
        note_id = id_match.group(1)
        last6 = note_id[-6:]
        try:
            with open(filepath, "r", encoding="utf-8") as fh:
                content = fh.read()
            fm_data, body = parse_frontmatter(content)
            fm_data = fm_data or {}
            title = str(fm_data.get("title", "") or "").strip() or f
            is_untitled = title.lower() == "untitled"
            is_empty = len(body.strip()) < 50
            tags = fm_data.get("tags", []) or []
            is_recording = has_recording_tag(tags)
        except:
            is_recording = False
            title = f
            is_untitled = False
            is_empty = False
        all_notes[last6] = {
            "folder": folder,
            "title": title[:60],
            "recording": is_recording,
            "untitled": is_untitled,
            "empty": is_empty,
        }

ingested_ids = set()
for f in os.listdir(sources_dir):
    if f.startswith("getnote-"):
        m = re.search(r"getnote-(\d{6})", f)
        if m:
            ingested_ids.add(m.group(1))

ingested = []
private_skip = []
empty_skip = []
remaining = []

for last6, info in all_notes.items():
    if last6 in ingested_ids:
        ingested.append(info)
    elif info["recording"]:
        private_skip.append(info)
    elif info["untitled"] or info["empty"]:
        empty_skip.append(info)
    else:
        remaining.append(info)

folder_stats = {}
for last6, info in all_notes.items():
    folder = info["folder"]
    if folder not in folder_stats:
        folder_stats[folder] = {"total": 0, "ingested": 0, "private": 0, "empty": 0, "remaining": 0}
    folder_stats[folder]["total"] += 1
    if last6 in ingested_ids:
        folder_stats[folder]["ingested"] += 1
    elif info["recording"]:
        folder_stats[folder]["private"] += 1
    elif info["untitled"] or info["empty"]:
        folder_stats[folder]["empty"] += 1
    else:
        folder_stats[folder]["remaining"] += 1

print("=== get_筆記 Ingest 完成度報告 ===")
print(f"筆記總數: {len(all_notes)}")
print(f"已 ingest: {len(ingested)}")
print(f"Private 跳過: {len(private_skip)}")
print(f"空白/untitled 跳過: {len(empty_skip)}")
print(f"尚未處理: {len(remaining)}")
total_actionable = len(ingested) + len(remaining)
if total_actionable > 0:
    pct = len(ingested) / total_actionable * 100
    print(f"完成率(排除 private+空白): {pct:.1f}%")
print()

print("=== 各資料夾明細 ===")
for folder in sorted(folder_stats.keys()):
    s = folder_stats[folder]
    actionable = s["ingested"] + s["remaining"]
    pct = (s["ingested"] / actionable * 100) if actionable > 0 else 100
    tag = "done" if s["remaining"] == 0 else f"left {s['remaining']}"
    print(f"  {folder}: {s['total']}t | in{s['ingested']} | priv{s['private']} | blank{s['empty']} | {tag} ({pct:.0f}%)")
print()

print("=== 尚未處理的筆記 ===")
by_folder = {}
for info in remaining:
    folder = info["folder"]
    if folder not in by_folder:
        by_folder[folder] = []
    by_folder[folder].append(info)

for folder in sorted(by_folder.keys()):
    print(f"\n  {folder} ({len(by_folder[folder])}p):")
    for info in by_folder[folder][:10]:
        print(f"    - {info['title']}")
    if len(by_folder[folder]) > 10:
        print(f"    ... +{len(by_folder[folder])-10} more")
