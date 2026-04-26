建議模型: Opus（多檔多層工程改造，schema 動到 build 一錯整站爆，要穩）
Task Size: L（預估 90-120 分鐘）
優先級: P1 — 補完 04-26 incident 暴露的治理漏洞

---

# [WIKI] Visibility 治理體系工程化改造（4 Tier 一次到位）

## Step -1 環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull
git status
# 確認 working tree clean，HEAD 在 origin/main，沒有並行 Code session 開在這個 repo
```

---

## 為什麼做這件事（Context）

2026-04-26 發生 scanner tag 字串比對 bug 事件：
- Scanner 漏抓 75+1 筆錄音 tag 變體（root cause 已修，commit `b0931a4`）
- 後續發現 65 筆 source 有錄音/敏感屬性，全部加了 quarantine block（commit `4534ace`）
- Cowork 寫 handoff 假設 visibility=public 對外曝光，**但實際全部一直是 internal**——Code 在 Step 0 偵察抓到，沒走到改檔

**事件暴露的根本問題不是 bug，是治理**：
1. **沒有單一真相源（SSOT）**：scanner 推測一次、ingest pipeline 強制一次、前端 filter 排除一次——三處規則散落，靠運氣對齊
2. **沒有敏感詞自動防線**：scanner 只看 tag 變體，沒掃內容裡的公司名、人名、合作金額
3. **沒有 ingest staging**：scanner 候選清單直接跑 ingest 落 `src/content/wiki/sources/`，錯了直接污染正式 corpus
4. **沒有防再犯機制**：被決定 delete 的 raw_note_id 沒有 blocklist，下次 scanner 又會掃出來
5. **沒有 schema 自我說明**：source 為什麼是 internal？是錄音？是商務？是個人感觸？frontmatter 看不出來

本 handoff 一次補完上述五個漏洞，分四個 Tier：

| Tier | 範圍 | Commit |
|------|------|--------|
| 1A | Quarantine classifier（規則化分類，不執行 outcome） | classifier + audit log |
| 2 | Schema sensitivity 欄位 + visibility SSOT 文件 + 敏感詞 detector | schema + docs + scripts |
| 3 | Ingest staging（sources_pending/ → sources/ 兩階段） | staging infra |
| 4 | Deny-list + scanner 白盒測試 + CI 一致性檢查 | tests + CI |

**Tier 1 的 outcome 執行不在本 handoff 範圍**——人工裁決需要 Paul，會另開小 handoff。本次只把 classifier 寫好、跑出建議。

---

## Step 0 偵察（一定要做，不要跳）

> 上次 04-26 的教訓就是 Cowork handoff 假設沒驗證，Code 在 Step 0 抓到救了一命。本次 handoff 的所有後續步驟也建立在這些假設上，**任一發現偏離就停下來**。

### 0.1 確認 schema 現狀

```bash
cat src/content.config.ts | head -100
# 預期看到 visibility: z.enum(['public', 'internal']) 沒有 'private'
# 預期 quarantine 區塊已被 schema 接受（4534ace 應該已加 schema 支援，不然 build 會壞）
# 記下實際 schema 結構，後續 Tier 2 schema 改動要相容
```

如果 schema 沒有 quarantine 欄位但 65 筆 source 已寫 quarantine block——這代表 schema 用 `.passthrough()` 或 `.catchall()`。記下實際做法，Tier 2 要用同模式加 sensitivity。

### 0.2 確認三組件 visibility 邏輯位置

```bash
# Scanner 端
grep -n "visibility" scripts/build_wiki_ingest_report.py

# Ingest pipeline 端（YouTube ingest、wiki-enrich 等）
grep -rn "visibility" scripts/wiki-*.cjs scripts/wiki-*.py 2>/dev/null

# 前端
grep -rn "visibility" src/pages/wiki/ src/components/wiki/ 2>/dev/null

# KV
grep -n "visibility\|sources" scripts/wiki-kv-seed.cjs
```

**預期發現**（依上輪 incident 偵察）：
- Scanner: 推測 visibility（建議性質，輸出到 worklogs/）
- Ingest pipeline: 強制按資料夾規則寫入 frontmatter
- 前端 `src/pages/wiki/[slug].astro:29`: `visibility === 'public'` filter
- KV: 只 seed concepts/，不含 sources/

如果三處邏輯位置與上述不符，**停下來，把實際位置寫進本 handoff 的 commit message，再繼續**。

### 0.3 確認 65 筆 quarantine 現狀

```bash
# 找出有 quarantine block 的 source
grep -lE "^quarantine:" src/content/wiki/sources/*.md | wc -l
# 預期 65

# 確認都是 internal
for f in $(grep -lE "^quarantine:" src/content/wiki/sources/*.md); do
  vis=$(grep "^visibility:" "$f" | head -1)
  echo "$vis  $(basename $f)"
done | grep -v "internal"
# 預期空輸出（沒有非 internal 的 quarantine source）
```

如果結果偏離預期（例如 ≠65 或有非 internal），停下來找 Paul。

### 0.4 確認 Astro 目前能 build

```bash
npm run build 2>&1 | tail -30
# 或 npm run dev:astro
# 預期通過。如果現在就壞，本 handoff 改 schema 會更壞，先停下來修。
```

---

## Tier 1A：Quarantine Classifier（不執行 outcome）

### 目標
寫規則化 classifier 對 65 筆 quarantine source 跑分類，產出建議 outcome list。**不直接執行**——人工裁決後另開小 handoff 套用。

### 1A.1 寫 `scripts/wiki-quarantine-classify.py`

詳細實作見本檔末附錄 A（含完整可執行 Python 腳本）。摘要：
- Rule-based classifier，5 個 bucket：restore_public / keep_internal / delete / redact_and_restore / needs_human_review
- 規則順序敏感（delete 規則最嚴格、最先檢查）
- 輸出兩個檔：
  - `worklogs/incidents/quarantine-classification-2026-04-26.md`（人讀）
  - `worklogs/incidents/quarantine-overrides-2026-04-26.yml`（機讀，後續 apply step 用）
- **只讀，不改任何 source 檔案**
- Idempotent

執行：

```bash
pip install pyyaml --quiet
python3 scripts/wiki-quarantine-classify.py
```

驗收：
- 兩個輸出檔產生
- 五個 bucket 數字加總應為 65
- `needs_human_review` 預估 5-15 筆

**重要**：classifier 不能修改任何 source 檔案 frontmatter。如有意外修改，立刻 `git restore`。

---

## Tier 2：Schema 升級 + Visibility SSOT + 敏感詞 Detector

### 2.1 Schema 加 sensitivity 欄位

`src/content.config.ts` 在 source 的 zod schema 加：

```typescript
sensitivity: z.enum([
  "safe",                    // 預設，無敏感資訊
  "contains_pii",            // 含個資（人名、聯絡方式）
  "business_confidential",   // 含商業機密（公司名、合作條件、金額）
  "personal_reflection",     // 個人感觸/私人經驗
]).optional().default("safe"),
```

**注意**：
- `.optional().default("safe")` 確保現有 source 不需 backfill 就能 build
- 不動 visibility enum 結構，**不引入 `private`**（避免重蹈 04-26 失誤）
- concepts/entities schema 如果有同款欄位需求，同步更新

### 2.2 visibility 規則 SSOT 文件

新建 `docs/wiki-visibility-rules.md` 作為**唯一規則來源**。內容詳見附錄 B。重點：
- visibility 值定義（public/internal，沒有 private）
- 資料夾預設規則 + 條件升級
- sensitivity 欄位定義
- Tag 變體完整清單（涵蓋 `录音卡笔记`、`录音笔记`、`录音测试`，及任何 contains `录音` 的 forward-compat）
- 三組件規則執行位置 + 必須引用本文

把現有 scanner / pipeline / 前端 visibility 邏輯的 inline comment 改成「`# See docs/wiki-visibility-rules.md`」，避免規則重複。

### 2.3 敏感詞 Detector

新建 `scripts/wiki-sensitivity-scan.py`，詳細實作見附錄 C。功能：
- 偵測公司名 pattern（`XX 公司/集團/科技/生技` + 已知名單）
- 偵測 PII pattern（電話、Email）
- 偵測商業關鍵詞（合作條件、合約金額、業務拓展...）
- 偵測個人感觸關鍵詞（怀念、追思、離世、對我的影響...）
- 輸出建議 sensitivity 等級 + flag list

ingest pipeline 落檔前 shell out 呼叫，自動寫 sensitivity 欄位、命中 business_confidential 強制 internal。具體整合點看 Step 0.2 偵察結果決定（最可能在 `wiki-enrich.cjs` 或 ingest 主腳本）。

---

## Tier 3：Ingest Staging（sources_pending/ → sources/）

### 目標
新 ingest 不直接落 `src/content/wiki/sources/`，先落 `src/content/wiki/sources_pending/`，待人工或自動 review pass 才搬。錯了不污染正式 corpus。

### 3.1 建立 staging 目錄結構

```bash
mkdir -p src/content/wiki/sources_pending
touch src/content/wiki/sources_pending/.gitkeep
```

### 3.2 註冊新 collection

`src/content.config.ts` 加 `sources_pending` collection：

```typescript
const sourcesPendingCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // 與 sources schema 相同，但加：
    pending_status: z.enum(["awaiting_review", "approved", "rejected"]).default("awaiting_review"),
    review_notes: z.string().optional(),
    pending_since: z.string(), // ISO date
  }).passthrough(),
});

export const collections = {
  sources: sourcesCollection,
  sources_pending: sourcesPendingCollection, // NEW
  concepts: conceptsCollection,
  entities: entitiesCollection,
};
```

### 3.3 修改 ingest pipeline 落點

找所有 ingest 腳本（Step 0.2 已偵察出來），把「寫入 sources/」改成「寫入 sources_pending/」並加 `pending_status: awaiting_review` + `pending_since: <ISO date>`。

**不破壞 idempotency**：本日 commit `2fdd571` 的 4 筆 source 在 sources/ 是正確落地，不被 staging 邏輯誤搬回 sources_pending/。

### 3.4 寫 promote script

`scripts/wiki-pending-promote.py`，詳細實作見附錄 D。功能：
- 掃 sources_pending/，依 pending_status 處理
  - `approved` → strip 多餘欄位，搬到 sources/
  - `rejected` → 直接刪
  - `awaiting_review` → skip
- Idempotent

### 3.5 staging 不影響前端 build

確認 `src/pages/wiki/[slug].astro` 用 `getCollection('sources')` 而非 `'sources_pending'`，pending 內容不會被建成 page。

---

## Tier 4：Deny-list + Scanner 白盒測試 + CI 一致性檢查

### 4.1 Deny-list 機制

新建 `data/wiki-ingest-blocklist.json`（初始空白，未來 quarantine apply 流程的 delete outcome 會自動寫入）：

```json
{
  "_comment": "raw_note_id 列在這裡的 scanner 永遠不會列為 ingest 候選。包含被決定 delete 的、和已知雜訊的。",
  "_format": {
    "raw_note_id": {
      "reason": "string (delete_outcome | manual_skip | duplicate)",
      "added_at": "ISO date",
      "added_by": "Cowork|Code|Paul"
    }
  },
  "blocklist": {}
}
```

修改 `scripts/build_wiki_ingest_report.py`，scan 開始前載入 blocklist，note_id 命中則 skip：

```python
import json
blocklist_path = Path("data/wiki-ingest-blocklist.json")
blocklist = {}
if blocklist_path.exists():
    blocklist = json.load(open(blocklist_path)).get("blocklist", {})

# 在 collect notes 迴圈內
if note_id in blocklist:
    continue
```

### 4.2 Scanner 白盒測試

新建 `tests/wiki-scanner.test.py`（pytest）。詳細實作見附錄 E。測試案例：
- 各種 `录音*` system tag 變體（卡/無卡/測試）都正確判 internal
- 非錄音的 AI链接笔记 仍正確判 public
- 06_個人成長與學習 資料夾恆 internal
- 05_商務會議 含錄音 → private、不含錄音 → internal
- Forward-compat：未來新增 `录音转写笔记` 變體也應命中

執行：

```bash
pip install pytest --quiet
pytest tests/wiki-scanner.test.py -v
```

### 4.3 CI 一致性檢查

新建 `scripts/wiki-consistency-check.py`，驗證：
- Scanner（`build_wiki_ingest_report.py`）引用 SSOT doc
- Frontend（`[slug].astro`）引用 SSOT doc
- Schema visibility enum 仍是 `['public','internal']`
- SSOT doc 存在於 `docs/wiki-visibility-rules.md`

詳細實作見附錄 F。

加 npm scripts：

```json
"scripts": {
  "check:wiki-visibility": "python3 scripts/wiki-consistency-check.py",
  "test:wiki-scanner": "pytest tests/wiki-scanner.test.py -v"
}
```

如有 GitHub Actions（`.github/workflows/`），加 step 跑這兩個指令。如無 CI，至少 npm script 可手動跑。

---

## 整合驗證

四 Tier 跑完後：

```bash
# 1. Schema 通過
npm run build 2>&1 | tail -10

# 2. Scanner test 通過
npm run test:wiki-scanner

# 3. Consistency check 通過
npm run check:wiki-visibility

# 4. Classifier 跑出 65 筆建議
python3 scripts/wiki-quarantine-classify.py

# 5. Sensitivity scanner spot-check
python3 scripts/wiki-sensitivity-scan.py src/content/wiki/sources/getnote-178104-medical-aesthetics-overseas.md
# 預期: suggested_sensitivity=business_confidential

# 6. 前端 spot-check（無痕視窗）
# https://paulkuo.tw/wiki/ 應正常運作
```

---

## Commit 計畫（4 commits）

依 Tier 順序，每個 Tier 一個 commit。**任一 commit 失敗不要硬跑下一個**。

```bash
# Commit 1: Tier 1A
git add scripts/wiki-quarantine-classify.py worklogs/incidents/quarantine-classification-2026-04-26.md worklogs/incidents/quarantine-overrides-2026-04-26.yml
git commit -m "feat(wiki): quarantine classifier for 65 sources"
git push

# Commit 2: Tier 2
git add src/content.config.ts docs/wiki-visibility-rules.md scripts/wiki-sensitivity-scan.py
git commit -m "feat(wiki): visibility governance — sensitivity field, SSOT doc, detector"
git push

# Commit 3: Tier 3
git add src/content/wiki/sources_pending/ src/content.config.ts scripts/wiki-pending-promote.py scripts/wiki-*ingest*.{cjs,py}
git commit -m "feat(wiki): ingest staging via sources_pending/"
git push

# Commit 4: Tier 4
git add data/wiki-ingest-blocklist.json scripts/build_wiki_ingest_report.py tests/wiki-scanner.test.py scripts/wiki-consistency-check.py package.json
git commit -m "feat(wiki): deny-list + scanner tests + CI consistency check"
git push
```

---

## 注意事項

- ⚠️ **Step 0 任一發現偏離預期 → 停下來在 commit message 解釋**
- ⚠️ **Schema 改動會影響整個 build**，每個 commit 後跑 `npm run build`，壞了立刻 `git revert`
- ⚠️ **不要動 65 筆 quarantine source 的 frontmatter**。Tier 1A 只讀，Tier 2 sensitivity 是 optional 不需 backfill
- ⚠️ **不要動本日 push 的 4 個檔**（`getnote-196368/149520/366608/711952`，commit `2fdd571`）
- ⚠️ **Staging 改動不能影響現有 ingest 流程的 idempotency**
- ⚠️ 遵循「同 repo 不開並行 Code session」原則
- ⚠️ **Tier 1A 的 outcome 不執行**，本 handoff 只跑 classifier 輸出 review queue

---

## 回報格式（遵循護欄 #14）

```
✅ Step 0.1 schema 現狀: visibility = enum(['public','internal']), quarantine = {actual structure}
✅ Step 0.2 三組件邏輯位置: scanner={file:line}, pipeline={...}, frontend={...}, KV={...}
✅ Step 0.3 quarantine 現狀: N=65, all internal ✓
✅ Step 0.4 Astro build: passes

✅ Tier 1A: commit {SHA1} pushed
   - bucket counts: restore_public={N1} / keep_internal={N2} / delete={N3} / redact_and_restore={N4} / needs_human_review={N5}
   - 加總 = 65 ✓
✅ Tier 2: commit {SHA2} pushed
   - schema sensitivity 加好，build 通過
   - SSOT doc 寫好，三組件 inline comment 已加引用
   - sensitivity scanner spot-check: {例子結果}
✅ Tier 3: commit {SHA3} pushed
   - sources_pending/ 建立，schema 註冊
   - ingest pipeline 已切到 staging 落點
   - promote script idempotent
✅ Tier 4: commit {SHA4} pushed
   - blocklist 接入 scanner
   - scanner test: pytest 全綠
   - consistency check: pass

整合驗證:
- npm run build: pass
- npm run test:wiki-scanner: pass
- npm run check:wiki-visibility: pass
- 前端 spot-check: 無異常
```

---

## 後續（不在本 handoff 範圍）

1. **Phase 2 outcome 執行**：Cowork + Paul 完成 65 筆人工裁決 → 開 small handoff 用 `quarantine-overrides-2026-04-26.yml` 執行 outcome
2. **Pre-commit hook**：用 husky 接 consistency check 成 pre-commit
3. **Sensitivity 補檔**：對既有 sources 一次性 backfill sensitivity 欄位
4. **Staging UI**：Cowork dashboard 加 staging review 流程

---

## 本輪 metrics

INCIDENT 後續工程化改造：~10 個新檔 + ~5 個既有檔修改。改動範圍大但分四個 commit 隔離風險，每 Tier 獨立可 revert。

---

# 附錄

## 附錄 A：`scripts/wiki-quarantine-classify.py` 完整實作

```python
#!/usr/bin/env python3
"""
Quarantine Classifier for 65 sources marked needs_review by 4534ace.

Output: worklogs/incidents/quarantine-classification-2026-04-26.md
- 5 buckets: restore_public / keep_internal / delete / redact_and_restore / needs_human_review
- Writes a YAML override file for the future apply step

Idempotent. Does NOT modify source files.
"""

import re
import yaml
from pathlib import Path
from datetime import datetime
from collections import defaultdict

SOURCES_DIR = Path("src/content/wiki/sources")
TODAY = datetime.now().strftime("%Y-%m-%d")

# === RULES ===
# 順序敏感：上面的規則先命中。delete 最嚴格先檢查。

RULES = [
    {
        "outcome": "delete",
        "description": "含具名公司/合作對象/商務洽談關鍵詞，永久下架",
        "match": {
            "title_or_content_any": [
                "新医美学集团", "日本CET", "佳龙科技", "理事长合作",
                "合作项目", "合作条件", "项目规划", "合作洽谈",
                "海外市场拓展", "商业合作与项目推进",
            ],
        },
    },
    {
        "outcome": "keep_internal",
        "description": "Paul 私人感觸/追思，永久 internal",
        "match": {
            "title_any": ["庞牧师", "对...的怀念", "离世对我的影响"],
        },
    },
    {
        "outcome": "restore_public",
        "description": "公開人物觀點/演講轉錄/通用知識方法論，可恢復 public",
        "match": {
            "title_or_tags_any": [
                "马斯克", "辛顿", "Hinton", "芒格", "Munger", "Musk",
                "无免费午餐", "概率分布", "全息宇宙", "神经可塑性",
                "Claude Skills", "决策公式",
                "循环经济", "二手回收", "岩棉回收", "材料替代",
                "人生能量管理", "突破恐惧", "尖毛草定律", "复利",
                "重尾", "结构性财富",
            ],
        },
    },
    {
        "outcome": "redact_and_restore",
        "description": "題材公開但夾雜個人/合作元素，去識別化後可恢復",
        "match": {
            "title_or_content_any": [
                "醫療數據合作", "AI 醫療領域合作", "AI 藥物設計",
                "預防醫學服務設計", "員工健康長照方案",
            ],
        },
    },
]


def load_source(path):
    with open(path) as f:
        content = f.read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
    if not m:
        return None, ""
    try:
        fm = yaml.safe_load(m.group(1))
    except Exception as e:
        print(f"YAML parse error in {path.name}: {e}")
        return None, ""
    return fm, m.group(2)


def matches_rule(rule, fm, body):
    title = fm.get("title", "")
    tags = fm.get("tags", []) or []
    tags_str = " ".join(str(t) for t in tags)
    title_and_tags = f"{title} {tags_str}"
    full = f"{title} {tags_str} {body}"
    m = rule["match"]
    if "title_or_content_any" in m:
        return any(kw in full for kw in m["title_or_content_any"])
    if "title_any" in m:
        return any(kw in title for kw in m["title_any"])
    if "title_or_tags_any" in m:
        return any(kw in title_and_tags for kw in m["title_or_tags_any"])
    return False


def classify(fm, body):
    for rule in RULES:
        if matches_rule(rule, fm, body):
            return rule["outcome"], rule["description"]
    return None, None


quarantine_files = sorted([
    f for f in SOURCES_DIR.glob("*.md")
    if "quarantine:" in f.read_text()
])

results = defaultdict(list)
overrides = {}

for f in quarantine_files:
    fm, body = load_source(f)
    if not fm:
        results["parse_error"].append(f.name)
        continue
    outcome, reason = classify(fm, body)
    if outcome:
        results[outcome].append({
            "file": f.name,
            "raw_note_id": fm.get("raw_note_id", ""),
            "title": fm.get("title", ""),
            "matched_rule": reason,
        })
        overrides[fm.get("raw_note_id", "")] = {
            "outcome": outcome,
            "matched_rule": reason,
            "auto_classified": True,
            "classified_at": TODAY,
        }
    else:
        results["needs_human_review"].append({
            "file": f.name,
            "raw_note_id": fm.get("raw_note_id", ""),
            "title": fm.get("title", ""),
        })

# Write outputs
out_md = Path("worklogs/incidents/quarantine-classification-2026-04-26.md")
out_yaml = Path("worklogs/incidents/quarantine-overrides-2026-04-26.yml")
out_md.parent.mkdir(parents=True, exist_ok=True)

with open(out_md, "w") as f:
    f.write(f"# Quarantine Classification — {TODAY}\n\n")
    f.write("Auto-classified, rule-based. Does NOT execute outcomes.\n\n## Summary\n")
    for bucket in ["restore_public", "keep_internal", "delete",
                   "redact_and_restore", "needs_human_review", "parse_error"]:
        f.write(f"- {bucket}: {len(results.get(bucket, []))}\n")
    f.write("\n## Bucket Details\n")
    for bucket in ["restore_public", "keep_internal", "delete",
                   "redact_and_restore", "needs_human_review"]:
        items = results.get(bucket, [])
        if not items:
            continue
        f.write(f"\n### {bucket} ({len(items)})\n\n")
        for item in items:
            f.write(f"- `{item['raw_note_id']}` — {item['title']}\n")
            if "matched_rule" in item:
                f.write(f"  - Rule: {item['matched_rule']}\n")

with open(out_yaml, "w") as f:
    yaml.safe_dump(overrides, f, allow_unicode=True, sort_keys=True)

print(f"Classification: {out_md}")
print(f"Overrides: {out_yaml}")
for bucket in ["restore_public", "keep_internal", "delete",
               "redact_and_restore", "needs_human_review", "parse_error"]:
    print(f"  {bucket}: {len(results.get(bucket, []))}")
```

## 附錄 B：`docs/wiki-visibility-rules.md` 模板

```markdown
# Wiki Visibility 規則（單一真相源）

> Last updated: 2026-04-26
> 三組件（scanner / ingest pipeline / 前端）的 visibility 邏輯必須引用本文。

## Visibility 值定義

| value | 意義 | 前端展示 | KV seed | 對外可訪問 |
|-------|------|---------|---------|-----------|
| public | 公開可見 | 渲染 | seed | yes |
| internal | 個人/敏感不對外 | 跳過 | skip | no |

**沒有 private 值**。Schema 不接受。試圖改成 private 會破壞 build。

## 資料夾預設規則

| 資料夾 | 預設 visibility | 條件升級 |
|--------|---------------|---------|
| 01_專欄文章 | public | 含 system tag `录音*`（含「录音」的） |
| 03_環保循環經濟 | public | 同上 |
| 04_AI與科技 | public | 同上 |
| 02_醫療健康 | internal | — |
| 05_商務會議 | internal | 含 `录音*` → 自動 sensitivity: business_confidential |
| 06_個人成長與學習 | internal | — |
| 07_生活雜記 | private（不 ingest） | — |
| 08_其他 | internal | — |
| 09_會議錄音 | private（不 ingest） | — |

## Sensitivity 欄位

| value | 何時用 |
|-------|-------|
| safe | 預設，無敏感資訊 |
| contains_pii | 含具名個人資訊（人名、電話、Email） |
| business_confidential | 含公司名、合作條件、金額 |
| personal_reflection | Paul 個人感觸、追思 |

`sensitivity` 是 visibility 之外的補充。前端不顯示，純內部分類。

## Tag 變體（系統錄音）

下列 system tag name 都被視為「錄音內容」：
- 录音卡笔记
- 录音笔记
- 录音测试
- 任何 contains 「录音」的 system tag（forward-compat）

## 規則執行位置

| 組件 | 檔案 | 規則段落 | 必須引用本文 |
|------|------|---------|------------|
| Scanner | `scripts/build_wiki_ingest_report.py` | `determine_visibility()` | yes |
| Ingest pipeline | `scripts/wiki-*.cjs` | ingest 寫 frontmatter 處 | yes |
| 前端 | `src/pages/wiki/[slug].astro` | `visibility === 'public'` filter | yes |
| KV seed | `scripts/wiki-kv-seed.cjs` | 目前 sources 不 seed | yes |

任何上述組件的修改必須同步更新本文，CI 會檢查。
```

## 附錄 C：`scripts/wiki-sensitivity-scan.py` 完整實作

```python
#!/usr/bin/env python3
"""
Sensitivity scanner: detects PII / business confidential markers in source content.
Used by ingest pipeline as a pre-write check.
"""

import re
import json
import sys

COMPANY_NAME_PATTERNS = [
    r"[A-Z][A-Za-z0-9]+\s*(公司|集團|企業|科技|生技)",
    r"(新医美学|日本CET|佳龙科技|台积电|台積電)",
]
PII_PATTERNS = [
    r"\d{4}[-\s]?\d{3,4}[-\s]?\d{3,4}",
    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
]
BUSINESS_KEYWORDS = [
    "合作條件", "合作條款", "合約金額", "投資金額", "授權金",
    "合作項目", "合作洽談", "業務拓展", "商務會議",
    "合作對象", "合作夥伴", "理事長",
]
PERSONAL_REFLECTION_KEYWORDS = [
    "怀念", "追思", "離世", "對我的影響", "私人感觸",
]


def scan(text):
    flags = []
    for pat in COMPANY_NAME_PATTERNS:
        m = re.findall(pat, text)
        if m:
            flags.append(("company_name", m[:3]))
    for pat in PII_PATTERNS:
        m = re.findall(pat, text)
        if m:
            flags.append(("pii", m[:3]))
    for kw in BUSINESS_KEYWORDS:
        if kw in text:
            flags.append(("business_keyword", [kw]))
    for kw in PERSONAL_REFLECTION_KEYWORDS:
        if kw in text:
            flags.append(("personal_reflection", [kw]))

    types = {f[0] for f in flags}
    if "company_name" in types or "business_keyword" in types:
        suggested = "business_confidential"
    elif "pii" in types:
        suggested = "contains_pii"
    elif "personal_reflection" in types:
        suggested = "personal_reflection"
    else:
        suggested = "safe"
    return suggested, flags


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python wiki-sensitivity-scan.py <file.md>")
        sys.exit(1)
    with open(sys.argv[1]) as f:
        text = f.read()
    suggested, flags = scan(text)
    print(json.dumps({
        "file": sys.argv[1],
        "suggested_sensitivity": suggested,
        "flags": [(t, list(v)) for t, v in flags],
    }, ensure_ascii=False, indent=2))
```

## 附錄 D：`scripts/wiki-pending-promote.py` 完整實作

```python
#!/usr/bin/env python3
"""
Promote sources_pending/*.md to sources/ if pending_status=approved.
Reject (delete) if rejected. Skip if awaiting_review.
Idempotent.
"""
import re
import yaml
from pathlib import Path

PENDING = Path("src/content/wiki/sources_pending")
SOURCES = Path("src/content/wiki/sources")

approved, rejected, skipped = [], [], []

for f in PENDING.glob("*.md"):
    if f.name.startswith("."):
        continue
    content = f.read_text()
    m = re.match(r'^---\n(.*?)\n---\n(.*)', content, re.DOTALL)
    if not m:
        continue
    fm = yaml.safe_load(m.group(1))
    status = fm.get("pending_status", "awaiting_review")
    if status == "approved":
        for key in ["pending_status", "review_notes", "pending_since"]:
            fm.pop(key, None)
        new_content = "---\n" + yaml.safe_dump(fm, allow_unicode=True, sort_keys=False) + "---\n" + m.group(2)
        target = SOURCES / f.name
        target.write_text(new_content)
        f.unlink()
        approved.append(f.name)
    elif status == "rejected":
        f.unlink()
        rejected.append(f.name)
    else:
        skipped.append(f.name)

print(f"Approved: {len(approved)}")
print(f"Rejected: {len(rejected)}")
print(f"Awaiting: {len(skipped)}")
```

## 附錄 E：`tests/wiki-scanner.test.py`

```python
"""
Tests for scripts/build_wiki_ingest_report.py determine_visibility()

每個 system tag 變體都應該有 fixture。新增變體不寫 fixture → CI fail。
"""
import sys
sys.path.insert(0, ".")
from scripts.build_wiki_ingest_report import determine_visibility


def test_recording_variant_with_ka():
    tags = [{"name": "录音卡笔记", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "internal"

def test_recording_variant_without_ka():
    """Bug fixed in b0931a4."""
    tags = [{"name": "录音笔记", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "internal"

def test_recording_variant_test():
    tags = [{"name": "录音测试", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "internal"

def test_ai_link_note_is_public():
    tags = [{"name": "AI链接笔记", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "public"

def test_personal_growth_folder_always_internal():
    tags = []
    assert determine_visibility("06_個人成長與學習", tags) == "internal"

def test_meeting_folder_recording_is_private():
    tags = [{"name": "录音卡笔记", "type": "system"}]
    assert determine_visibility("05_商務會議", tags) == "private"

def test_meeting_folder_no_recording_is_internal():
    tags = []
    assert determine_visibility("05_商務會議", tags) == "internal"

def test_future_recording_variant():
    """Forward-compat: 未來新增變體 contains 录音 應命中"""
    tags = [{"name": "录音转写笔记", "type": "system"}]
    assert determine_visibility("04_AI與科技", tags) == "internal"
```

## 附錄 F：`scripts/wiki-consistency-check.py`

```python
#!/usr/bin/env python3
"""
CI: verify visibility logic across components reference SSOT doc.
"""
import sys
from pathlib import Path


def check_doc_reference(file: Path, marker: str = "wiki-visibility-rules.md"):
    if not file.exists():
        return False, f"{file} not found"
    if marker not in file.read_text():
        return False, f"{file} does not reference docs/wiki-visibility-rules.md"
    return True, "ok"


errors = []

ok, msg = check_doc_reference(Path("scripts/build_wiki_ingest_report.py"))
if not ok:
    errors.append(f"Scanner: {msg}")

ok, msg = check_doc_reference(Path("src/pages/wiki/[slug].astro"))
if not ok:
    errors.append(f"Frontend: {msg}")

schema_path = Path("src/content.config.ts")
if schema_path.exists():
    schema_content = schema_path.read_text()
    if "z.enum(['public', 'internal'])" not in schema_content and \
       'z.enum(["public", "internal"])' not in schema_content:
        errors.append("Schema: visibility enum changed unexpectedly")
    if "wiki-visibility-rules.md" not in schema_content:
        errors.append("Schema: missing SSOT reference")

if not Path("docs/wiki-visibility-rules.md").exists():
    errors.append("SSOT doc missing")

if errors:
    print("Visibility consistency check FAILED")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
print("Visibility consistency check passed")
```
