# Code Handoff — `wiki-quarantine-classify.py` Fast-Path Rule

> 收件人：Code session（zarqarwi/paulkuo.tw）
> 來源：Cowork session 2026-04-27（v5 handoff finding）
> 上游分析：[`worklogs/cowork--quarantine-13-review-2026-04-27.md`](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--quarantine-13-review-2026-04-27.md)（commit `0d89de0`）
> 模型 / Effort：**Sonnet 4.6 / Low（約 30 min）**

---

## 1. Goal（目標）

在 `scripts/wiki-quarantine-classify.py` 加 fast-path 規則：對已有 `quarantine.review_outcome` + `quarantine.needs_review == false` 的 source，**直接照既有決議歸 bucket，不重判**。

預期效果：下次重跑 classify，`needs_human_review` bucket 從 13 降到 0；其他 bucket 數字維持或順移。

---

## 2. Context（背景）

v5 handoff 提到「13 支 needs_human_review 等 Paul 過目」。Cowork 抽 2 支驗證 frontmatter 後發現：

- 13/13 已有 `quarantine.review_outcome: keep_internal` + `needs_review: false`
- 跟 `worklogs/incidents/quarantine-overrides-2026-04-26-final.yml` 的 keep_internal bucket 100% 對齊
- 04-26 上輪 Paul 已決議完成

**根因**：`wiki-quarantine-classify.py` 重跑時沒讀 `quarantine.review_outcome` 既有值，把已決議內容當新 quarantine 重判。`apply.py` 有「skip:already_applied」邏輯，`classify.py` 沒有對應的 fast-path。

**為什麼推薦 fast-path 而非「apply 時清 quarantine block」**：保留 `quarantine.reasoning` 審計痕跡，未來 source 來源回溯時還看得到「為什麼這支 internal」的脈絡。

---

## 3. Files（涉及檔案）

| 檔案 | 動作 |
|------|------|
| `scripts/wiki-quarantine-classify.py` | 改 — 加 fast-path |
| `tests/test_wiki_quarantine_classify.py` | 加 — fast-path unit tests |

**不動的檔案**：
- `data/wiki-quarantine-rules.yml`（rules 配置不變）
- `scripts/wiki_visibility.py`、`wiki_dialogue_lib.py`、`wiki_text_normalize.py`（共用模組不動）
- `scripts/wiki-quarantine-apply.py`（不動 apply 邏輯）
- 任何 source 檔案（classify 不寫 source）

---

## 8. Commit Plan

```
1. feat(wiki-quarantine-classify): add fast-path for already-reviewed sources
2. test(wiki-quarantine-classify): cover fast-path scenarios
3. chore(classify-output): re-run classify after fast-path enabled
```

---

## ✅ Code 完成回報（2026-04-27）

**執行結果：needs_human_review 13 → 0，TOTAL=18 不變。**

### 實作

`classify()` 開頭加 7 行 fast-path（`e38cae6`）：

```python
def classify(fm, body):
    quarantine = fm.get("quarantine") or {}
    if quarantine.get("review_outcome") and quarantine.get("needs_review") is False:
        outcome = quarantine["review_outcome"]
        return outcome, f"fast-path: existing review_outcome={outcome}"
    ...
```

條件：`review_outcome` 已設定 **且** `needs_review is False`（嚴格比對）。

### 測試（`f3a7f92`，4 tests 新增，共 26 pass）

| 測試 | 驗什麼 |
|------|--------|
| `test_fast_path_honours_keep_internal` | 無規則命中時仍回傳 review_outcome |
| `test_fast_path_overrides_rule_match` | 規則原本火 redact→keep，fast-path 覆蓋為 keep_internal |
| `test_fast_path_skipped_when_needs_review_true` | needs_review=True 不走 fast-path，落回規則 |
| `test_fast_path_skipped_when_no_review_outcome` | 無 review_outcome 不走 fast-path，落回規則 |

### Commit 清單

| SHA | 類型 | 說明 |
|-----|------|------|
| `e38cae6` | feat | add fast-path for existing human review decisions |
| `f3a7f92` | test | 4 unit tests for fast-path rule |
| `4b9e326` | chore | classify output + worklog + handoff |

### 重跑 summary

```
Found 18 quarantined sources

Bucket                    Count
-----------------------------------
restore_public            0
keep_internal             18
delete                    0
redact_and_restore        0
needs_human_review        0
parse_error               0
-----------------------------------
TOTAL                     18
```

### 意外發現

無。原 redact_and_restore 3 筆也有 `review_outcome: keep_internal` + `needs_review: false`，
fast-path 正確將它們覆蓋為 keep_internal（符合 Paul 人工決議）。

### 未動的 source of truth

- `worklogs/incidents/quarantine-overrides-2026-04-26-final.yml` — **未修改**

### 後續（Cowork 接手）

- 同步 Issue #157
- 評估是否新增 v6 handoff
