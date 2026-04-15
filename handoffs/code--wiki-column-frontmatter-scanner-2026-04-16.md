# Handoff → Code：Wiki Column Frontmatter Scanner

- **建議模型**：Sonnet 4.6（簡單腳本，但要正確處理 frontmatter parsing）
- **Size**：S（20 分鐘）
- **前置**：無，獨立工具開發。但跟 Batch 2（萬維鋼專欄 ingest）強相關 — 這支腳本會被 Cowork 用來掃描專欄目錄，省下大量手動讀檔的工序。

---

## 問題

`wiki-ingest-scanner`（Cowork scheduled task）目前用「檔名後 6 位 note_id」做 diff 比對。但 `notes/01_專欄文章/` 下的 6 個專欄子資料夾的檔案命名格式不同：

```
notes/01_專欄文章/萬維鋼精英日課/38_张泉灵 × 脱不花：欢迎加入超级学习者的世界.md
```

檔名沒帶 19 位 note_id，必須讀檔內 frontmatter 才能拿到：

```yaml
---
note_id: "1902961749566065952"
...
---
```

01_專欄文章 下總共約 30+ 個 column 檔案，每次 wiki-ingest-scanner 都要重複手動讀，效率太差。

---

## 目標

寫一支 `scripts/scan_column_notes.py`，自動：

1. 遞迴掃描 `~/Desktop/01_專案進行中/get_筆記/notes/01_專欄文章/` 下所有 `.md` 檔
2. 解析 frontmatter，抓 `note_id`
3. 用後 6 位比對 `~/Desktop/01_專案進行中/paulkuo.tw/src/content/wiki/sources/getnote-*.md` 的後綴
4. 輸出待 ingest 清單到 `worklogs/wiki-column-pending.md`（**獨立檔案，不混進 wiki-ingest-pending.md**）

---

## 技術細節

### 路徑

- 來源：`~/Desktop/01_專案進行中/get_筆記/notes/01_專欄文章/`
- 已 ingest：`~/Desktop/01_專案進行中/paulkuo.tw/src/content/wiki/sources/`
- 輸出：`~/Desktop/01_專案進行中/paulkuo.tw/worklogs/wiki-column-pending.md`（每次覆寫，不 append）

### Frontmatter parsing

不要引入 PyYAML 等外部依賴。用 regex 抓 `note_id`：

```python
import re

frontmatter_match = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
if frontmatter_match:
    note_id_match = re.search(r'note_id:\s*"?(\d+)"?', frontmatter_match.group(1))
    if note_id_match:
        note_id = note_id_match.group(1)
```

### 已 ingest 比對

讀 sources 目錄所有 `getnote-*.md` 檔名，提取後 6 位數作為 set：

```python
import re, os

ingested = set()
for f in os.listdir(SOURCES_DIR):
    m = re.match(r'getnote-(\d{6})-', f)
    if m:
        ingested.add(m.group(1))
```

然後對每個 column 檔的 `note_id` 取後 6 位，看是否在 set 裡。

### 額外資料

從 column 檔抽出：
- `title`（從 frontmatter）
- 子資料夾名（如「萬維鋼精英日課」「香帥財富報告」）
- 是否帶 `录音笔记` system tag（`录音笔记` 字串出現在 tags 裡 → 降級為 internal）

### 輸出格式

```markdown
# 01_專欄文章 待 ingest 清單

> 自動產出 by `scripts/scan_column_notes.py`
> 掃描時間：{ISO timestamp}

## 摘要

| 項目 | 數量 |
|------|------|
| 掃描檔案數 | N |
| 已 ingest | M |
| 新發現可 ingest | K |

## 各專欄分布

| 專欄 | 總數 | 已 ingest | 新發現 |
|------|------|----------|--------|
| 萬維鋼精英日課 | ... | ... | ... |
| ... | ... | ... | ... |

## 新發現待 ingest

| note_id 後 6 碼 | 標題 | 專欄 | visibility |
|---|---|---|---|
| ... | ... | ... | public |
```

---

## Visibility 規則（給 column 檔）

01_專欄文章 在專案 instructions 中歸類為 **public**。但有 system tag `录音笔记` 的要降級為 internal。其他全部 public。

---

## Step：commit + push

```bash
git add scripts/scan_column_notes.py
git commit -m "$(cat <<'EOF'
scripts: add column frontmatter scanner

掃描 01_專欄文章 下所有 .md，從 frontmatter 取 note_id 比對 wiki sources，
產出待 ingest 清單到 worklogs/wiki-column-pending.md。

省下手動讀 30+ 個專欄檔的工序，給 Cowork 的 batch 2 ingest 用。

Ref: #157

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"

git push origin main
```

---

## 驗證

```bash
python3 scripts/scan_column_notes.py
cat worklogs/wiki-column-pending.md
```

預期至少找到萬維鋼專欄的 4 個新發現（後 6 碼：617272, 705416, 912984, 666072 — 這是 Cowork 在 2026-04-14 已比對過的）。如果結果差太多就要 debug。

---

## 整合到 scheduled task（可選）

如果想讓這支腳本在 `wiki-ingest-scanner` 排程時也跑，請告訴 Paul 在 Cowork 排程設定加一行：

```
python3 scripts/scan_column_notes.py
```

但這是可選的——Cowork 在 batch 2 啟動時手動跑也行。

---

## Issue #157 回報

加 comment：
```
✅ scripts/scan_column_notes.py 上線

- 自動掃描 01_專欄文章 下所有 column 檔的 frontmatter note_id
- 輸出 worklogs/wiki-column-pending.md
- 給 Cowork batch 2 ingest 用
```

---

## 建議模型 / Effort

- **本 handoff**：Sonnet 4.6 / S（20 分鐘）
- Haiku 也可，但 frontmatter parsing 的 edge case（YAML quote、tags 巢狀 JSON）要小心，Sonnet 比較穩
