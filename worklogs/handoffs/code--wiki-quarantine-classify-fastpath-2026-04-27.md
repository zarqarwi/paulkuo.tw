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
| `tests/test_wiki_quarantine_classify.py` | 加 — 5 個 fast-path unit test |

**不動的檔案**：
- `data/wiki-quarantine-rules.yml`（rules 配置不變）
- `scripts/wiki_visibility.py`、`wiki_dialogue_lib.py`、`wiki_text_normalize.py`（共用模組不動）
- `scripts/wiki-quarantine-apply.py`（不動 apply 邏輯）
- 任何 source 檔案（classify 不寫 source）

---

## 4. 跨專案影響盤點

| 範圍 | 影響 | 行動 |
|------|------|------|
| 同 repo 其他 script | 無 — `wiki-quarantine-classify.py` 不被任何 pipeline import | — |
| Output 檔案 | `worklogs/incidents/quarantine-classification-2026-04-26.md` 會被覆蓋（重跑） | 預期，符合腳本既有行為 |
| Output 檔案 | `worklogs/incidents/quarantine-overrides-2026-04-26.yml`（draft）會更新 | 預期，但**不要動 `quarantine-overrides-2026-04-26-final.yml`**（這份是人工決議 source of truth）|
| Daily pipeline | scripts/wiki-daily-pipeline.sh 是否會自動跑 classify？ | 需檢查 — 若是，重跑後 daily output 會反映新分類 |
| 其他 repo / 外部系統 | 無 | — |

**要查的事**：開工前 `grep -r 'wiki-quarantine-classify' scripts/` 確認沒有其他腳本 import 或 invoke，避免漏標影響。

---

## 5. Implementation（實作）

### 5.1 修改 `classify()` 函式

當前位置（約 line 80-84）：

```python
def classify(fm, body):
    for rule in RULES:
        if matches_rule(rule, fm, body):
            return rule["outcome"], rule["description"]
    return None, None
```

改為：

```python
# 4 種已知 outcome bucket（與 apply.py 對應）
VALID_FAST_PATH_OUTCOMES = {
    "restore_public",
    "keep_internal",
    "delete",
    "redact_and_restore",
}


def classify(fm, body):
    # Fast-path：已有人工決議的直接照既有 outcome 歸 bucket，不重判
    # 觸發條件：quarantine.needs_review === False（明確標記不需重 review）
    #          且 quarantine.review_outcome 是已知 4 個 bucket 之一
    quarantine = fm.get("quarantine", {}) or {}
    if quarantine.get("needs_review") is False:
        existing_outcome = quarantine.get("review_outcome")
        if existing_outcome in VALID_FAST_PATH_OUTCOMES:
            return existing_outcome, "fast_path:already_reviewed"

    # 既有 rule-based 分類
    for rule in RULES:
        if matches_rule(rule, fm, body):
            return rule["outcome"], rule["description"]
    return None, None
```

### 5.2 設計考量

- **`is False` 不用 `not`**：避免 `needs_review` 缺欄位（None）被當 falsy 觸發 fast-path。明確只在 `False` 時走快通道
- **`existing_outcome in VALID_FAST_PATH_OUTCOMES` 白名單**：避免 outcome 字串拼錯或人工填了奇怪值時靜默歸錯 bucket
- **`fast_path:already_reviewed` 描述字串**：在 classify report 中能一眼看出是快通道命中還是 rule 命中
- **Fall-through 行為**：若 `needs_review == True`（人工標記需重 review）或 outcome 缺/無效 → 走原本 rule loop，行為跟現在完全一樣

---

## 6. Acceptance Criteria（驗收條件）

| 檢查項 | 期望 |
|------|------|
| `pytest tests/test_wiki_quarantine_classify.py -v` | 全 pass（含新增的 5 個 fast-path test）|
| `python scripts/wiki-quarantine-classify.py` 重跑 | 不噴錯 |
| 重跑後 `quarantine-classification-2026-04-26.md` summary | needs_human_review = **0**（從 13 降到 0）|
| 重跑後 summary | TOTAL = **18**（不變）|
| 重跑後 keep_internal bucket | 從 2 → **15**（多 13 支 fast-path 命中）|
| 重跑後 redact_and_restore bucket | **3**（不變，原有 rule 命中）|
| 重跑後 restore_public / delete | **0 / 0**（不變）|
| `python scripts/wiki-consistency-check.py` | pass |
| `git diff scripts/wiki-quarantine-classify.py` | 只動 `classify()` 函式 + 加常數，不動其他 |

---

## 7. Test Plan（5 個 unit test）

新增 `tests/test_wiki_quarantine_classify.py`（若已存在則 append）：

```python
from wiki_quarantine_classify import classify  # adjust import path as needed


def test_fast_path_keep_internal():
    """needs_review=False + outcome=keep_internal → 直接 keep_internal"""
    fm = {
        "title": "test",
        "quarantine": {
            "needs_review": False,
            "review_outcome": "keep_internal",
        },
    }
    outcome, reason = classify(fm, "")
    assert outcome == "keep_internal"
    assert reason == "fast_path:already_reviewed"


def test_fast_path_restore_public():
    """fast-path 對 4 個 bucket 都生效"""
    fm = {
        "title": "test",
        "quarantine": {
            "needs_review": False,
            "review_outcome": "restore_public",
        },
    }
    outcome, _ = classify(fm, "")
    assert outcome == "restore_public"


def test_fast_path_skipped_when_needs_review_true():
    """needs_review=True → fall through 走 rule loop（保留彈性）"""
    fm = {
        "title": "幹細胞培養",  # 不命中任何 rule
        "quarantine": {
            "needs_review": True,
            "review_outcome": "keep_internal",  # 即使有 outcome 也不應該走 fast-path
        },
        "tags": [],
    }
    outcome, _ = classify(fm, "")
    # 應該 fall through 到 needs_human_review（rule 沒命中）
    assert outcome is None


def test_fast_path_skipped_when_outcome_missing():
    """needs_review=False 但 outcome 缺 → fall through"""
    fm = {
        "title": "測試",
        "quarantine": {
            "needs_review": False,
            # review_outcome 缺
        },
        "tags": [],
    }
    outcome, _ = classify(fm, "")
    assert outcome is None  # rule 沒命中


def test_fast_path_skipped_when_outcome_invalid():
    """outcome 不在白名單 → fall through，不誤歸 bucket"""
    fm = {
        "title": "測試",
        "quarantine": {
            "needs_review": False,
            "review_outcome": "weird_value",
        },
        "tags": [],
    }
    outcome, _ = classify(fm, "")
    assert outcome is None  # rule 沒命中


def test_fast_path_skipped_when_no_quarantine_block():
    """無 quarantine block → fall through 走 rule（行為跟改前完全一樣）"""
    fm = {"title": "測試", "tags": []}
    outcome, _ = classify(fm, "")
    assert outcome is None  # rule 沒命中
```

跑：`pytest tests/test_wiki_quarantine_classify.py -v`

---

## 8. Commit Plan

建議 3 個小 commit（方便 review、好回滾）：

```
1. feat(wiki-quarantine-classify): add fast-path for already-reviewed sources
   - 加 VALID_FAST_PATH_OUTCOMES 常數
   - classify() 開頭加 fast-path 檢查 quarantine.needs_review + review_outcome
   - 不動其他邏輯

2. test(wiki-quarantine-classify): cover fast-path scenarios
   - 6 個 test case：4 個 bucket 命中 + needs_review=true fall-through + 缺欄位 fall-through

3. chore(classify-output): re-run classify after fast-path enabled
   - 重跑 wiki-quarantine-classify.py
   - 預期 needs_human_review 從 13 → 0
   - 對應 quarantine-classification-2026-04-26.md 更新
```

---

## 9. Notes & Hand-back

完成後**回報以下三項**給下個 Cowork session：

1. **3 個 commit SHA**（feat/test/chore）
2. **重跑 classify 後的 summary**（貼出來確認 needs_human_review = 0、TOTAL = 18）
3. **任何意外發現**（例如：重跑時看到既有 redact_and_restore 3 支也應該套 fast-path？或者其他 bucket 數字跟預期不一致？）

寫完別忘了：
- `git push` 推回 main（依 feedback_handoff_push 紀律）
- 寫一份 Code session handoff 摘要 push 到 `worklogs/code--wiki-quarantine-classify-fastpath-2026-04-27.md`（依 feedback_handoff_local 雙寫紀律）
- 不要動 `quarantine-overrides-2026-04-26-final.yml`（人工決議 source of truth，別覆蓋）

下個 Cowork session 會接手：
- 同步 Issue #157
- 評估後續是否要把同樣 fast-path 套到 `wiki-quarantine-apply.py`（若需要）
- 評估是否新增 v6 handoff

---

*Cowork session 2026-04-27 產出*
*遵循 v5 handoff「9 段 Code handoff」格式 + feedback_model_recommendation + feedback_cross_project_impact*
