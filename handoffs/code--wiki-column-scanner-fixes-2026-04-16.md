# Handoff → Code：Column Scanner 兩個 bug 修補

- **建議模型**：Haiku 4.5（兩處小修，已有明確 reproduction）
- **Size**：XS（5-10 分鐘）
- **前置**：`scripts/scan_column_notes.py` 已上線（commit `970c2f3`）。Cowork 跑首次掃描後發現 2 個品質問題。

---

## 起手路徑

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
cat worklogs/wiki-column-pending.md   # 看當前輸出，重點看 _duplicates 行 + 兩個空白 title
cat scripts/scan_column_notes.py      # 主要要修這支
```

---

## Bug 1：`_duplicates` 資料夾沒被 skip

### Reproduction

`worklogs/wiki-column-pending.md` 顯示：

```
| _duplicates | 1 | 0 | 1 |
```

而那個檔（`507816`）出現在「新發現待 ingest」表內，但其實這是 duplicates 不該 ingest。

### 修復

在 scanner 的目錄 walk 邏輯加 skip。對齊 `wiki_rescan.py` 的做法：

```python
SKIP_FOLDERS = ["_duplicates"]

for root, dirs, files in os.walk(COLUMN_DIR):
    dirs[:] = [d for d in dirs if d not in SKIP_FOLDERS]
    ...
```

**重點**：用 `dirs[:] = [...]` 原地修改 `dirs` 才能讓 `os.walk` 真的 skip（不然只是過濾出來但還是會遞迴進去）。

---

## Bug 2：萬維鋼 untitled 檔的 title 空白

### Reproduction

報告中萬維鋼專欄這 2 行 title 欄空白：

```
| 617272 |  | 萬維鋼_現代思維工具100講 | public |
| 705416 |  | 萬維鋼_現代思維工具100講 | public |
```

實際檔案：`untitled_617272.md` / `untitled_705416.md`，frontmatter 是這樣：

```yaml
---
note_id: "1906302190444617272"
title: ""
created: "2026-04-05 17:44:24"
...
---

# untitled

社会地位越高的人越容易用双赢的"正和"思维看待合作...
```

`title: ""` 是**空字串**（不是 missing key），所以 regex 抓得到但拿到空值。

### 修復

加 fallback 邏輯：

```python
# 從 frontmatter 抓 title
title_match = re.search(r'title:\s*"?([^"\n]*)"?', fm_content)
title = title_match.group(1).strip() if title_match else ""

# Fallback 1：title 空 → 從 body 第一段非標題文字抽
if not title:
    body_after_fm = content.split('---', 2)[2] if content.count('---') >= 2 else ""
    # 跳過 # 標題行（如 "# untitled"），抓第一段非空、非標題的句子
    for line in body_after_fm.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        # 取前 40 字 + ... 作為標題
        title = line[:40] + ('...' if len(line) > 40 else '')
        break

# Fallback 2：還是空 → 標記為 (untitled)
if not title:
    title = f"(untitled) {filename}"
```

預期結果：
- 617272 → `社会地位越高的人越容易用双赢的"正和"思维看待合作，而地位较...`
- 705416 → `自由能原理让我重新理解了生命的本质——生命就是不断与环境对齐...`

---

## 驗證

```bash
python3 scripts/scan_column_notes.py
cat worklogs/wiki-column-pending.md
```

預期輸出比對：

| 項目 | 修前 | 修後 |
|------|------|------|
| 掃描檔案數 | 49 | 48（少 1，因為 _duplicates skip）|
| 新發現可 ingest | 19 | 18（少那 1 篇 duplicates）|
| _duplicates 在「各專欄分布」表 | 出現 | 消失 |
| 617272 / 705416 title 欄 | 空白 | 有 fallback 內容 |

---

## Step：commit + push

```bash
git add scripts/scan_column_notes.py worklogs/wiki-column-pending.md
git commit -m "$(cat <<'EOF'
scripts(scan_column_notes): fix _duplicates skip + empty title fallback

兩個首次跑掃描後發現的品質問題：
- _duplicates 資料夾沒 skip → 對齊 wiki_rescan.py 的 SKIP_FOLDERS
- frontmatter title="" 時抓到空字串 → fallback 用 body 第一段非標題文字

驗證：49 → 48 檔，19 → 18 新發現，萬維鋼 617272/705416 title 補齊

Ref: #157

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"

git push origin main
```

---

## Issue #157 回報

簡短 comment：

```
✅ scan_column_notes.py 兩個 bug 修補完成

- _duplicates skip 對齊 wiki_rescan.py
- title 空字串 fallback 用 body 第一段
- 重跑後 worklogs/wiki-column-pending.md 已更新（19 → 18 新發現）
```

---

## 建議模型 / Effort

- **本 handoff**：Haiku 4.5 / XS（5-10 分鐘）
- 兩個 bug 都已附 reproduction + 修復 code，純執行
