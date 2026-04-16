<!-- 建議模型：Sonnet 4.6 + Medium | Task Size: S (<30 min) -->

# Handoff: 修復 wiki ingest scanner 跳過 01_專欄文章 + 不遞迴掃描子資料夾

## 背景

`scripts/build_wiki_ingest_report.py` 是每日自動掃描腳本，比對 get_筆記 notes/ 和已 ingest 的 wiki sources，產出待 ingest 清單。

目前有兩個 bug：
1. **第 65 行直接 `continue` 跳過 `01_專欄文章`** — 這個資料夾有大量 public 內容該掃描
2. **只掃一層目錄**（`subfolder.glob("*.md")`）— 01_專欄文章 底下有巢狀子資料夾（`快刀青衣_專欄/`、`快刀青衣_AI龙虾十日谈/`、`萬維鋼_現代思維工具100講/`、`OpenClaw_上手准备/`），目前全部漏掉

今天 Cowork 手動讀取 `快刀青衣_專欄/` 25 個檔案的 frontmatter，確認全部已 ingest。但腳本層面的 bug 導致每次掃描都會漏報，Cowork 得手動補查。

## Step 0 偵察

```bash
# 確認目前跳過邏輯
grep -n "01_" scripts/build_wiki_ingest_report.py

# 確認 01_專欄文章 底下有哪些子資料夾
ls -d /Users/apple/Desktop/01_專案進行中/get_筆記/notes/01_專欄文章/*/

# 確認 glob 模式
grep -n "glob" scripts/build_wiki_ingest_report.py
```

## 具體步驟

### 修改 1：移除 01_專欄文章 skip

檔案：`scripts/build_wiki_ingest_report.py`，第 63-65 行

目前：
```python
for subfolder in sorted(get_notes_dir.iterdir()):
    if not subfolder.is_dir() or subfolder.name.startswith("01_"):
        continue  # skip 01_專欄文章 for now
```

改成：
```python
for subfolder in sorted(get_notes_dir.iterdir()):
    if not subfolder.is_dir():
        continue
```

### 修改 2：改為遞迴掃描

目前第 67 行：
```python
for md_file in sorted(subfolder.glob("*.md")):
```

改成：
```python
for md_file in sorted(subfolder.rglob("*.md")):
```

這樣 `01_專欄文章/快刀青衣_專欄/*.md` 等巢狀路徑都會被掃到。

### 修改 3：report 中保留子資料夾路徑

目前 pending_notes 只記錄 `subfolder.name`（如 `01_專欄文章`），看不出是哪個子系列。建議改成記錄相對路徑：

```python
# 在 pending_notes append 時
relative_folder = str(md_file.parent.relative_to(get_notes_dir))
pending_notes[visibility].append({
    "folder": relative_folder,  # 改用相對路徑，如 "01_專欄文章/快刀青衣_專欄"
    "title": title,
    "note_id": note_id
})
```

### 修改 4（順手修）：01_專欄文章 的錄音卡筆記降級

目前 `determine_visibility` 函式對 01_專欄文章 的 `has_recording_tag` 判斷有 bug：

```python
if folder == "01_專欄文章":
    return "public" if not has_recording_tag else "public"  # ← 不管有沒有都是 public
```

根據 Project Instructions，01_專欄文章 的錄音卡筆記應降為 internal。改成：

```python
if folder.startswith("01_專欄文章"):  # startswith 以涵蓋子資料夾路徑
    return "internal" if has_recording_tag else "public"
```

同理 03_環保循環經濟 也有一樣的 bug（第 57 行），一併修：
```python
elif folder.startswith("03_環保循環經濟"):
    return "internal" if has_recording_tag else "public"
```

注意：因為改成 relative path 後 folder 會是 `01_專欄文章/快刀青衣_專欄` 這種格式，`determine_visibility` 的所有 `folder ==` 判斷都要改成 `folder.startswith()`。完整對照：

| 原本 | 改成 |
|------|------|
| `folder == "01_專欄文章"` | `folder.startswith("01_專欄文章")` |
| `folder == "02_醫療健康"` | `folder.startswith("02_醫療健康")` |
| `folder == "03_環保循環經濟"` | `folder.startswith("03_環保循環經濟")` |
| `folder == "04_AI與科技"` | `folder.startswith("04_AI與科技")` |
| `folder == "05_商務會議"` | `folder.startswith("05_商務會議")` |
| `folder == "06_個人成長與學習"` | `folder.startswith("06_個人成長與學習")` |
| `folder == "07_生活雜記"` | `folder.startswith("07_生活雜記")` |
| `folder == "08_其他"` | `folder.startswith("08_其他")` |
| `folder == "09_會議錄音"` | `folder.startswith("09_會議錄音")` |

## 上游假設

1. get_筆記 notes/ 的 frontmatter 格式不變（`note_id: "..."` YAML 欄位）
2. wiki sources 的 `raw_note_id` 是完整 19 位數 note_id（已確認）
3. 01_專欄文章 底下的子資料夾結構穩定（快刀青衣_專欄、快刀青衣_AI龙虾十日谈、萬維鋼_現代思維工具100講、OpenClaw_上手准备）

## 驗證方式

```bash
# 跑一次腳本，確認 01_專欄文章 有出現在輸出
cd /Users/apple/Desktop/01_專案進行中/paulkuo.tw
python3 scripts/build_wiki_ingest_report.py 2>&1 | head -20

# 確認產出的 report 裡有 01_專欄文章 的條目
grep "01_專欄文章" worklogs/wiki-ingest-pending.md

# 確認已 ingest 的筆記不會出現在 pending 清單
# 快刀青衣_專欄 全部 25 篇已 ingest，不該出現在 pending 表格中
grep "快刀青衣_專欄" worklogs/wiki-ingest-pending.md
# 預期：不出現（全部已 ingest）

# 萬維鋼 有 4 篇 pending，應出現
grep "萬維鋼" worklogs/wiki-ingest-pending.md
# 預期：出現 4 筆
```

驗證來源：本機 terminal grep

## 注意事項

- 這個腳本跑在 Cowork 排程（wiki-ingest-scanner, 每日 10:02），改完腳本後排程自動生效，不需要額外更新 scheduled task
- `rglob("*.md")` 可能會掃到非筆記的 md 檔（如 README），但目前 get_筆記 資料夾沒有這類檔案，風險低
- 不可逆操作：無

## 信心等級

**高** — 問題明確（跳過邏輯 + glob 模式 + visibility 判斷 bug），改法直觀，四處修改都是獨立的小改動。

## Integration Checklist

- [ ] Cowork scheduled task `wiki-ingest-scanner` 使用同一支腳本，改完自動生效
- [ ] 報告格式有變（folder 欄位從 `01_專欄文章` 變成 `01_專欄文章/快刀青衣_專欄`），Cowork 消化報告的邏輯不需要改（是手動閱讀）
- [ ] 不影響其他 scripts（wiki_rescan.py、wiki-kv-seed.cjs、wiki-youtube-ingest.cjs）
- [ ] 不影響 wiki source 的 ingest 流程本身，只改掃描報告
