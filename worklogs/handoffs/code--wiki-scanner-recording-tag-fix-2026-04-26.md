建議模型: Sonnet
Task Size: S（預估 10-15 分鐘）

---

# [WIKI] Scanner 錄音筆記 tag 偵測修正

## Step -1 環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull
```

---

## 背景

2026-04-26 Cowork session 在處理 2026-04-23 handoff 列出的 6 則 ingest 候選時，發現 `scripts/build_wiki_ingest_report.py` 有一個 tag 字串比對漏洞，會把錄音筆記誤分到 public：

**案例**：`notes/04_AI與科技/AI时代顶尖程序员的价值与工作模式_1907582940029449232.md`
- 原 handoff 標記 public（scanner 產出）
- 實際 frontmatter system tag 是 `"录音笔记"`（無「卡」字）
- 但 scanner 比對的是 `"录音卡笔记"`（有「卡」字）
- 結果：永遠 mismatch → 錄音筆記被當成普通 public 內容
- 後果：449232 差點被當 public 直接 ingest，需要 Cowork 手動逐則檢查 tags 才抓到

如果 Cowork 沒比對 GitHub 上的真實 tags，這則錄音內容就會進公開 wiki。

## 確切 bug 位置

`scripts/build_wiki_ingest_report.py` line 44-47：

```python
has_recording_tag = any(
    tag.get("name") == "录音卡笔记" and tag.get("type") == "system"
    for tag in tags
)
```

只比對精確字串 `"录音卡笔记"`，漏掉實際 tag `"录音笔记"`。

---

## Step 0 偵察

執行前先確認真實 tag 變體：

```bash
# 列出 get_筆記 中所有 system tag 的 name 變體
cd ~/Desktop/01_專案進行中/get_筆記
grep -hoE '"name": *"[^"]*录音[^"]*"' notes/**/*.md 2>/dev/null | sort | uniq -c

# 同時看一下其他 system tag 變體
grep -hoE '"name": *"[^"]*笔记"[^,]*"type": *"system"' notes/**/*.md 2>/dev/null | head -20
```

**預期發現**：至少有兩種 system tag 變體
- `录音笔记`（短的，04_AI與科技/449232 是這個）
- `录音卡笔记`（長的，project instructions 寫的）

可能還有第三種變體（如 `会议录音` 之類），先查清楚再改。

---

## 具體步驟

### 步驟 1：擴大 has_recording_tag 偵測

把 line 44-47 改成 contains 比對，同時涵蓋兩種變體：

```python
has_recording_tag = any(
    "录音" in tag.get("name", "") and tag.get("type") == "system"
    for tag in tags
)
```

理由：用 contains `"录音"` 比 OR 列舉 `["录音笔记", "录音卡笔记"]` 更穩健，未來如果出現新變體（如 `录音转写笔记`、`会议录音`）也能被涵蓋。`type == "system"` 已經夠約束範圍，不會誤抓到 user/ai type 的筆記內容裡含「录音」二字。

### 步驟 2：把規則統一抽出來成常數

避免之後再有第二個地方寫死字串。建議：

```python
# 在檔案頂端
RECORDING_TAG_KEYWORD = "录音"

# determine_visibility 內
def has_recording_tag(tags):
    return any(
        RECORDING_TAG_KEYWORD in tag.get("name", "") and tag.get("type") == "system"
        for tag in tags
    )
```

### 步驟 3：補回歸驗證

把 449232 加進測試清單，確認新 scanner 能正確判定為 internal：

```bash
# 跑一次 scanner，看 worklogs/wiki-ingest-pending.md 結果
python3 scripts/build_wiki_ingest_report.py

# 檢查 449232 應該出現在 internal 區段，不在 public
grep "449232" worklogs/wiki-ingest-pending.md
```

### 步驟 4：commit + push

```bash
git add scripts/build_wiki_ingest_report.py
git commit -m "fix(wiki): scanner now detects all 录音* system tags as recording

Previous code matched exact string '录音卡笔记' but actual tags include
'录音笔记' (without 卡). Switched to contains '录音' to cover both
variants and any future ones.

Discovered while triaging 2026-04-23 handoff: note 449232
(AI时代顶尖程序员) was misclassified as public because its tag is
'录音笔记' not '录音卡笔记'."

git push
```

---

## 驗證方式

- [ ] 偵察階段已確認所有 `录音*` system tag 變體
- [ ] 修改後 449232 在新 scanner 下被分類為 internal
- [ ] 重跑 scanner 沒有破壞其他既有分類（diff `worklogs/wiki-ingest-pending.md` before/after）
- [ ] commit 推到 origin/main

---

## 注意事項

- ⚠️ 這個 bug 的 user-facing 影響：scanner 把錄音內容算進 public 配額，可能誤導 Paul 排 ingest 批次。修完之後 `worklogs/wiki-ingest-pending.md` 的 public 數字會下降，internal 數字上升，這是預期行為。
- ⚠️ Cowork session 已經人工攔截 449232 沒讓它進 wiki，這次修法是預防未來重蹈覆轍。
- ⚠️ project instructions（`.cursorrules` 或類似檔案）裡如果也寫死 `"录音卡笔记"`，順手一起改成「凡 system tag 含『录音』」。

---

## 回報格式（遵循護欄 #14，commit SHA 三態）

```
✅ Step 0 偵察: 找到 N 種 录音* tag 變體（列出）
✅ Step 1 擴大偵測: commit {SHA} pushed
✅ Step 2 抽常數（如做）: commit {SHA} pushed
✅ Step 3 回歸驗證: 449232 → internal ✓
✅ Step 4 push: origin/main 已更新

scanner 修正前後 public/internal 計數差異：
- public: M → N (-X)
- internal: P → Q (+X)
```

---

## 本輪 metrics

修 1 個 scanner 字串比對 bug，預防錄音內容誤進公開 wiki。改動範圍最多 10 行，純邏輯修正不動 schema。
