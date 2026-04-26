建議模型: Sonnet（規則修補 + schema 小改 + 文件，無高風險邏輯）
Task Size: M（預估 45-60 分鐘）
優先級: P2 — Level 2 治理收殼，承接 04-26 大型 handoff（commit `9920fbb`）

---

# [WIKI] Handoff A — Classifier 強化 + Schema 補完 + Quarantine SOP

## Step -1 環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull
git status
```

確認 working tree clean、HEAD 在 origin/main、沒有並行 Code session。

---

## 為什麼做這件事

承接 commit `9920fbb`（4 Tier 治理改造）的收殼。Tier 1A classifier 跑出 **54/65 進 needs_human_review**（規格估 5-15）。原因：

1. **規則 hardcode 在 .py**：未來改規則要改 code，無測試覆蓋
2. **沒有簡繁體對映**：規則寫「无免费午餐」但 source 標題寫「無免費午餐」就漏命中
3. **關鍵詞列表手寫不全**：54 筆裡有大量公開知識（馬斯克、辛頓、決策方法論）只是換了詞就沒命中

加上 4534ace 加的 `quarantine:` block 沒在 schema 中定義（zod 預設靜默 strip）——typo 不會被擋。

本 handoff 一次補完三個工程治理 loose ends：

| 項目 | 為什麼必做 |
|------|-----------|
| 1. Schema 加 quarantine z.object 定義 | 防 typo 進 frontmatter，audit 鏈完整 |
| 2. Classifier 規則 YAML 化 + 簡繁對映 + 重跑 | 規則可維護、覆蓋率提升、預期 needs_human_review 降至 15-25 |
| 3. Quarantine review SOP 文件 | 下次 incident 不用重新摸索 |

跑完後 Cowork 會：
- 對 needs_human_review 剩餘筆數做最終人工審查
- 寫 Handoff B 套用 outcome

---

## Step 0 偵察（一定要做）

> 上輪教訓：Cowork handoff 的假設可能再次過時。Step 0 偵察是護欄。

### 0.1 確認 4 Tier handoff（9920fbb）的成果都在

```bash
ls scripts/wiki-quarantine-classify.py worklogs/incidents/quarantine-overrides-2026-04-26.yml
ls docs/wiki-visibility-rules.md scripts/wiki-sensitivity-scan.py
grep "sensitivity" src/content.config.ts | head -5
ls src/content/wiki/sources_pending/
ls data/wiki-ingest-blocklist.json tests/test_wiki_scanner.py scripts/wiki-consistency-check.py
ls .github/workflows/wiki-visibility-check.yml
```

### 0.2 確認 65 筆 quarantine 仍存在且未被改動

```bash
grep -lE "^quarantine:" src/content/wiki/sources/*.md | wc -l
# 預期 65
```

### 0.3 確認當前 build / test / check 都通過

```bash
npm run build 2>&1 | tail -10
npm run test:wiki-scanner 2>&1 | tail -5
npm run check:wiki-visibility
```

### 0.4 確認 classifier 當前命中分布

```bash
cat worklogs/incidents/quarantine-classification-2026-04-26.md | head -20
# 預期: restore_public=7 / keep_internal=1 / delete=1 / redact_and_restore=2 / needs_human_review=54
```

任一偵察結果偏離預期 → 停下來在 commit message 解釋再繼續。

---

## 步驟 1：Schema 加 quarantine 定義

`src/content.config.ts` 在 wikiSchema（或 source schema）加：

```typescript
quarantine: z.object({
  reason: z.string(),
  original_visibility: z.enum(['public', 'internal']),
  quarantined_at: z.string(),
  needs_review: z.boolean().default(true),
  review_outcome: z.enum([
    'pending',
    'restore_public',
    'keep_internal',
    'delete',
    'redact_and_restore',
  ]).default('pending'),
  // Audit metadata（後續 Handoff B 寫入時用到）
  reviewer: z.string().optional(),       // 'paul' | 'cowork' | 'auto'
  reviewed_at: z.string().optional(),    // ISO date
  reasoning: z.string().optional(),       // 為什麼下這個 outcome
  re_review_after: z.string().optional(), // 選填，例：'2031-04-26' 商務內容 5 年後可重審
}).optional(),
```

**注意**：
- `.optional()` 確保現有 source 不需 backfill
- review_outcome enum 跟 classifier 輸出對齊
- audit metadata 欄位給 Handoff B 寫入用

```bash
npm run build 2>&1 | tail -10
# 預期 pass。65 筆現有 quarantine block 應符合新 schema
# 若不符（例如缺 quarantined_at），先停下來——4534ace 寫法跟新定義不對齊，先決定改哪邊
```

---

## 步驟 2：建立繁簡對映 helper

新建 `scripts/wiki_text_normalize.py`：

```python
#!/usr/bin/env python3
"""
Text normalization helpers for wiki scripts.
- s2t: 簡繁對映（用 opencc 或 fallback table）
- contains_normalized: 將 haystack 與 needle 都轉繁體後比對
"""

# Fallback table for common simplified→traditional pairs in Paul's wiki content
SIMPLIFIED_TO_TRADITIONAL = {
    "马": "馬", "无": "無", "费": "費", "决": "決", "策": "策",
    "电": "電", "脑": "腦", "网": "網", "络": "絡", "学": "學",
    "习": "習", "经": "經", "济": "濟", "环": "環", "医": "醫",
    "疗": "療", "药": "藥", "数": "數", "据": "據", "类": "類",
    "结": "結", "构": "構", "实": "實", "现": "現", "错": "錯",
    "误": "誤", "发": "發", "应": "應", "讨": "討", "论": "論",
    "说": "說", "话": "話", "动": "動", "态": "態", "状": "狀",
    "时": "時", "间": "間", "线": "線", "样": "樣", "标": "標",
    "题": "題", "记": "記", "录": "錄", "笔": "筆", "听": "聽",
    "见": "見", "视": "視", "频": "頻", "营": "營", "业": "業",
    "项": "項", "认": "認", "识": "識", "证": "證", "号": "號",
    "顿": "頓", "码": "碼", "单": "單", "双": "雙", "极": "極",
    "终": "終", "复": "復", "杂": "雜", "续": "續", "图": "圖",
    "运": "運", "灵": "靈", "导": "導", "辑": "輯",
}

try:
    from opencc import OpenCC
    _cc_s2t = OpenCC('s2t')
    def s2t(text: str) -> str:
        return _cc_s2t.convert(text)
except ImportError:
    def s2t(text: str) -> str:
        return "".join(SIMPLIFIED_TO_TRADITIONAL.get(c, c) for c in text)


def normalize(text: str) -> str:
    """Convert to traditional + lowercase ASCII + strip."""
    if not text:
        return ""
    return s2t(text).lower().strip()


def contains_normalized(haystack: str, needle: str) -> bool:
    return normalize(needle) in normalize(haystack)
```

```bash
pip install opencc --quiet  # 推薦，比 fallback table 完整。失敗也 OK
```

---

## 步驟 3：規則 YAML 化

新建 `data/wiki-quarantine-rules.yml`（規則順序敏感）：

```yaml
version: 2
last_updated: "2026-04-26"

rules:
  - outcome: delete
    description: "含具名公司/合作對象/商務洽談關鍵詞，永久下架"
    match:
      title_or_content_any:
        # 已知具名公司
        - 新医美学集团
        - 新醫美學集團
        - 日本CET
        - 佳龙科技
        - 佳龍科技
        # 商務情境關鍵詞
        - 理事长合作
        - 理事長合作
        - 合作项目
        - 合作項目
        - 合作条件
        - 合作條件
        - 合作条款
        - 合作條款
        - 项目规划
        - 項目規劃
        - 合作洽谈
        - 合作洽談
        - 海外市场拓展
        - 海外市場拓展
        - 商业合作与项目推进
        - 商業合作與項目推進
        - 业务拓展
        - 業務拓展

  - outcome: keep_internal
    description: "Paul 私人感觸/追思，永久 internal"
    match:
      title_any:
        - 庞牧师
        - 龐牧師
        - 怀念
        - 懷念
        - 追思
        - 离世
        - 離世
        - 对...的影响
        - 對...的影響

  - outcome: restore_public
    description: "公開人物觀點/演講轉錄/通用知識方法論，可恢復 public"
    match:
      title_or_tags_any:
        # 公開人物
        - 马斯克
        - 馬斯克
        - 辛顿
        - 辛頓
        - Hinton
        - 芒格
        - Munger
        - Musk
        - 巴菲特
        - 達利歐
        - 达利欧
        - 乔布斯
        - 賈伯斯
        # 公開研究/概念
        - 无免费午餐
        - 無免費午餐
        - 概率分布
        - 機率分布
        - 全息宇宙
        - 神经可塑性
        - 神經可塑性
        - Claude Skills
        - 决策公式
        - 決策公式
        - AI预测
        - AI預測
        - AI 趋势
        - AI 趨勢
        - AGI
        # 環保 pillar 公開知識
        - 循环经济
        - 循環經濟
        - 二手回收
        - 岩棉回收
        - 材料替代
        - 永续
        - 永續
        # 通用方法論/書籍/概念
        - 人生能量管理
        - 突破恐惧
        - 突破恐懼
        - 尖毛草定律
        - 复利
        - 複利
        - 重尾
        - 结构性财富
        - 結構性財富
        - 系统思维
        - 系統思維
        - 第一性原理
        - 心智模型
        - 元认知
        - 元認知
        - 认知重评
        - 認知重評
        - 习惯
        - 習慣
        - 人性

  - outcome: redact_and_restore
    description: "題材公開但夾雜個人/合作元素，去識別化後可恢復"
    match:
      title_or_content_any:
        - 医疗数据合作
        - 醫療數據合作
        - AI医疗领域合作
        - AI醫療領域合作
        - AI药物设计
        - AI藥物設計
        - 预防医学服务设计
        - 預防醫學服務設計
        - 员工健康长照方案
        - 員工健康長照方案
        - 长照服务模式
        - 長照服務模式
```

修改 `scripts/wiki-quarantine-classify.py`：移除 hardcode RULES dict，改成從 YAML 讀，比對改用 `contains_normalized()`：

```python
import yaml
from wiki_text_normalize import contains_normalized

RULES_FILE = Path("data/wiki-quarantine-rules.yml")
with open(RULES_FILE) as f:
    RULES_CONFIG = yaml.safe_load(f)
RULES = RULES_CONFIG["rules"]

def matches_rule(rule, fm, body):
    title = fm.get("title", "")
    tags = fm.get("tags", []) or []
    tags_str = " ".join(str(t) for t in tags)
    title_and_tags = f"{title} {tags_str}"
    full = f"{title} {tags_str} {body}"

    m = rule["match"]
    if "title_or_content_any" in m:
        return any(contains_normalized(full, kw) for kw in m["title_or_content_any"])
    if "title_any" in m:
        return any(contains_normalized(title, kw) for kw in m["title_any"])
    if "title_or_tags_any" in m:
        return any(contains_normalized(title_and_tags, kw) for kw in m["title_or_tags_any"])
    return False
```

```bash
python3 scripts/wiki-quarantine-classify.py
# 預期 needs_human_review 從 54 降至 15-25，加總仍為 65
# overrides yaml 自動覆寫
```

---

## 步驟 4：Classifier 規則測試

新建 `tests/test_wiki_quarantine_classifier.py`：

```python
"""
Tests for scripts/wiki-quarantine-classify.py rule matching.
規則改了 → fixture 沒對齊 → CI fail。
"""
import sys
import importlib.util
from pathlib import Path

# Load classifier module（檔名含連字號，要用 importlib）
spec = importlib.util.spec_from_file_location(
    "wiki_quarantine_classify",
    Path(__file__).parent.parent / "scripts" / "wiki-quarantine-classify.py"
)
classifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(classifier)


def test_delete_company_name_simplified():
    fm = {"title": "新医美学集团业务介绍", "tags": []}
    rule = next(r for r in classifier.RULES if r["outcome"] == "delete")
    assert classifier.matches_rule(rule, fm, "")

def test_delete_company_name_traditional():
    """簡繁對映核心測試"""
    fm = {"title": "新醫美學集團業務介紹", "tags": []}
    rule = next(r for r in classifier.RULES if r["outcome"] == "delete")
    assert classifier.matches_rule(rule, fm, "")

def test_restore_public_musk_simplified():
    fm = {"title": "马斯克最新十大预言", "tags": []}
    rule = next(r for r in classifier.RULES if r["outcome"] == "restore_public")
    assert classifier.matches_rule(rule, fm, "")

def test_restore_public_musk_traditional():
    fm = {"title": "馬斯克最新十大預言", "tags": []}
    rule = next(r for r in classifier.RULES if r["outcome"] == "restore_public")
    assert classifier.matches_rule(rule, fm, "")

def test_keep_internal_pastor():
    fm = {"title": "对庞牧师的怀念与追思", "tags": []}
    rule = next(r for r in classifier.RULES if r["outcome"] == "keep_internal")
    assert classifier.matches_rule(rule, fm, "")

def test_redact_business_collab():
    fm = {"title": "AI 醫療領域合作探討", "tags": []}
    rule = next(r for r in classifier.RULES if r["outcome"] == "redact_and_restore")
    assert classifier.matches_rule(rule, fm, "")

def test_no_rule_matches_returns_human_review():
    fm = {"title": "毫不相關的標題", "tags": []}
    for rule in classifier.RULES:
        assert not classifier.matches_rule(rule, fm, "")
```

```bash
pytest tests/test_wiki_quarantine_classifier.py -v
```

---

## 步驟 5：Quarantine Review SOP

新建 `docs/wiki-quarantine-sop.md`：

```markdown
# Wiki Quarantine Review SOP

> 適用情境：scanner / ingest pipeline 發現 source 內容可能敏感，需要 review 後才能決定 visibility outcome。
> 上次發動：2026-04-26 incident（scanner 录音 tag 偵測 bug 引發 65 筆 audit）

## 觸發條件

任一情況發生時啟動本 SOP：
1. 既有 source 被反查發現含敏感屬性（如錄音、人名、合作條件）
2. 新 ingest 的 source 命中 sensitivity detector（business_confidential / contains_pii）
3. 系統規則變更後既有 corpus 需重新審查

## 流程（5 階段）

### Stage 1: Mark — 標記 quarantine

對涉及的 source 加 `quarantine:` block：

```yaml
quarantine:
  reason: "簡述發動原因（例：scanner_bug_2026_04_26_录音_tag_misdetection）"
  original_visibility: <當前的 visibility>
  quarantined_at: "<ISO date>"
  needs_review: true
  review_outcome: pending
```

不改 visibility（除非已知必須立即下架）。

### Stage 2: Classify — 自動分類

```bash
python3 scripts/wiki-quarantine-classify.py
```

產出：
- `worklogs/incidents/quarantine-classification-<date>.md`（人讀報表）
- `worklogs/incidents/quarantine-overrides-<date>.yml`（機讀，下階段用）

5 個 bucket：
- `restore_public`：恢復 public
- `keep_internal`：永久 internal
- `delete`：移檔 + 加 blocklist
- `redact_and_restore`：去識別化後恢復 public
- `needs_human_review`：規則打不到，下階段 Paul 審

### Stage 3: Human Review — 人工裁決

Paul 對 `needs_human_review` 桶逐筆裁決，更新 overrides yaml：

```yaml
1907123456789:
  outcome: restore_public
  reviewer: paul
  reviewed_at: "2026-04-27"
  reasoning: "公開講座轉錄，無敏感資訊"
```

（Cowork 可協助粗分類，Paul final approve）

### Stage 4: Apply — 套用 outcome

跑 apply script（**Handoff B 範圍**）：

```bash
python3 scripts/wiki-quarantine-apply.py worklogs/incidents/quarantine-overrides-<date>.yml
```

對應行為：
- `restore_public`：把 visibility 改 public，移除 quarantine block
- `keep_internal`：保持 internal，移除 needs_review 標記
- `delete`：移除檔案 + raw_note_id 加 `data/wiki-ingest-blocklist.json`
- `redact_and_restore`：手動去識別化後設 outcome 為 restore_public 重跑

### Stage 5: Verify — 驗收

- `npm run build` 通過
- `npm run check:wiki-visibility` 通過
- 前端無痕視窗 spot-check
- Issue #157 同步狀態

## 防呆原則

1. **不直接 delete**：deny-list 永久記錄，scanner 不會重複掃出
2. **不改 visibility 為 private**：schema 不接受
3. **保留 audit 鏈**：reviewer / reviewed_at / reasoning 必填
4. **`re_review_after` 為選填**：商務內容 N 年後可能可重審

## 相關文件

- `docs/wiki-visibility-rules.md`：visibility 規則 SSOT
- `data/wiki-quarantine-rules.yml`：classifier 規則
- `scripts/wiki-quarantine-classify.py`：自動分類腳本
- `scripts/wiki-sensitivity-scan.py`：敏感詞 detector
```

---

## 整合驗證

```bash
npm run build 2>&1 | tail -10
pytest tests/test_wiki_quarantine_classifier.py -v
python3 scripts/wiki-quarantine-classify.py
npm run test:wiki-scanner
npm run check:wiki-visibility
```

預期 needs_human_review 從 54 → 15-25。

---

## Commit 計畫（3 commits）

```bash
# Commit 1: Schema quarantine 定義
git add src/content.config.ts
git commit -m "feat(wiki): add quarantine schema definition

Previously zod silently stripped unknown 'quarantine:' keys, allowing
typos to pass through unvalidated. Now formally defined with audit
metadata fields (reviewer, reviewed_at, reasoning, re_review_after).

Backwards-compat: .optional() so non-quarantined sources unaffected."
git push

# Commit 2: Classifier YAML 化 + 簡繁對映
git add data/wiki-quarantine-rules.yml scripts/wiki-quarantine-classify.py scripts/wiki_text_normalize.py tests/test_wiki_quarantine_classifier.py worklogs/incidents/quarantine-*.{md,yml}
git commit -m "feat(wiki): externalize classifier rules + 簡繁 mapping

- Rules moved from hardcoded Python dict to data/wiki-quarantine-rules.yml
- Simplified/Traditional Chinese normalization via opencc (or fallback table)
- Re-classifier run: needs_human_review {N1} → {N2}
- Added pytest fixtures for rule regression"
git push

# Commit 3: Quarantine SOP
git add docs/wiki-quarantine-sop.md
git commit -m "docs(wiki): quarantine review SOP

5-stage flow: Mark → Classify → Human Review → Apply → Verify.
Documents the workflow followed in 04-26 incident response so future
quarantine events don't require re-discovery."
git push
```

---

## 注意事項

- ⚠️ **Step 0 任一發現偏離預期 → 停下來在 commit message 解釋**
- ⚠️ **Schema 改動先驗證 build 通過再 commit**。若 65 筆現有 quarantine block 不符新 schema，先停下來決定改哪邊
- ⚠️ **不要動既有 65 筆 source 的 frontmatter**
- ⚠️ **不要動 4534ace 的 audit log markdown**（worklogs/incidents/recording-quarantine-2026-04-26.md）
- ⚠️ **重跑 classifier 後 overrides yaml 會被覆寫**——預期行為，但 commit message 標清「覆寫前 N1，覆寫後 N2」
- ⚠️ Opencc 安裝失敗也不要中斷——fallback table 可以撐，回報時提一下用了哪個
- ⚠️ 遵循「同 repo 不開並行 Code session」原則

---

## 回報格式

```
✅ Step 0.1 9920fbb 成果檔案: 全部存在 ✓
✅ Step 0.2 quarantine: 65 ✓ all internal
✅ Step 0.3 build/test/check: 全 pass
✅ Step 0.4 classifier 命中分布: 7/1/1/2/54

✅ 步驟 1 schema quarantine: commit {SHA1} pushed, build pass
✅ 步驟 2 簡繁對映 helper: opencc 已裝 / fallback table
✅ 步驟 3 規則 YAML 化 + 重跑 classifier: commit {SHA2} pushed
   - needs_human_review: 54 → {N}
   - 各 bucket 變化: restore_public {7→?} / keep_internal {1→?} / delete {1→?} / redact_and_restore {2→?}
   - 加總 = 65 ✓
✅ 步驟 4 classifier 規則測試: pytest {N} passed
✅ 步驟 5 Quarantine SOP: commit {SHA3} pushed

整合驗證:
- npm run build: pass
- pytest tests/test_wiki_quarantine_classifier.py: pass
- npm run test:wiki-scanner: pass（不受影響）
- npm run check:wiki-visibility: pass
```

---

## 後續（不在本 handoff 範圍）

1. **Handoff B**：Paul 對 needs_human_review 剩餘筆數做最終裁決後，Code 寫 `scripts/wiki-quarantine-apply.py` 並執行所有 outcome
2. **Sensitivity 補檔**：對既有 sources 跑 detector 一次性 backfill sensitivity 欄位（不急）
3. **Pre-commit hook**：用 husky 接 consistency check 為 pre-commit（手動跑也夠用）

---

## 本輪 metrics

3 個 commit、新增 5 個檔（rules.yml / normalize helper / classifier test / SOP / 重跑後的 classification.md）+ 2 個既有檔修改（content.config.ts / classify.py）。預期 needs_human_review 從 54 降至 15-25，後續 Paul 人工審查工作量降低 60-70%。
