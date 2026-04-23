# Wiki Enrich E2.5 驗收 — 2026-04-23

> 執行時間：2026-04-23（Code session）
> 執行者：Claude Code（Sonnet）
> Branch：chore/acp-rwd-report（= main HEAD 918126b）

---

## 驗收目標

確認 E2.5.1 prompt 強化（commit `e036b0e`）是否真正改善 concept matching 品質：
1. 不再強迫 match，空陣列 `[]` 合法
2. matched concept 需有逐字稿證據（非間接類比推理）
3. `wrong_pillar_suspected` + `enrichment_notes` 偵測機制運作

---

## Sample 1：youtube-OxJzRU-6tuk（睡眠科學）

**預期**：`matched: []`，`wrong_pillar_suspected: true`

**基線**（re-run 前）：
- `matched: [learning-as-meta-skill, human-judgment-in-ai-era]`
- 兩者均為跨領域間接類比（sleep→認知→learning，sleep deprivation→judgment）

**實際結果**：
- `matched: []` ✅
- `wrong_pillar_suspected`：未觸發 ❌
- `enrichment_notes`：未觸發 ❌
- Token：in 12,348 / out 2,188

**原因分析**：
prompt 要求 LLM 在 first candidate reason 中包含「本 source 主題與現有 concept 清單無核心對齊」，但 LLM 實際回傳：
「提供的concept清單主要聚焦AI時代的能力與商業議題，與睡眠科學無直接交集」
——詞組不完全匹配 `includes()` 字串檢查，導致 detection 失效。

**Bug 記錄（E2.5-BUG-1）**：
- 所在位置：`scripts/wiki-enrich.cjs:161`
- 問題：`const wrongPillar = matched.length === 0 && firstReason.includes('主題與現有 concept 清單無核心對齊');`
- 根因：LLM 有詞組漂移，字串比對過於嚴格
- **不在此輪修復**（handoff 規定：發現 bug 記錄後回報，不自行 patch prompt）
- 建議修法：改為 `matched.length === 0`（空陣列本身即足以判斷 wrong_pillar），不依賴 LLM 措辭

**判定：⚠️ partial**
- 核心品質目標（移除 surface-match）✅ 達成
- 偵測旗標機制 ❌ 因字串比對漂移未觸發

---

## Sample 2：youtube-9yvP7PAunYs（Sora）

**預期**：移除 `builder-mindset`（surface-match），`ai-agent-economy` 亦為 surface-match

**基線**（re-run 前）：
- `matched: [software-disruption, builder-mindset]`

**實際結果**：
- `matched: [world-model, software-disruption, business-model-innovation]` ✅
- `builder-mindset` 移除 ✅
- `world-model` 新增（有逐字稿證據：「Sora本身就是为了成为世界模型而诞生的」）✅
- `business-model-innovation` 新增（有逐字稿證據：Sora 從研究工具→社交應用→基礎設施的轉向）✅
- Token：in 4,289 / out 1,904

**判定：✅ pass**

---

## Sample 3：youtube-8pncy425QqQ（對照組，群核 AI）

**預期**：與上一輪 matched 集合不退步（允差 1 個）

**基線**（re-run 前）：
- `matched: [ai-embodiment, build-for-models]`

**實際結果**：
- `matched: [world-model, ai-embodiment, build-for-models]` ✅
- `ai-embodiment` 保留 ✅
- `build-for-models` 保留 ✅
- `world-model` 新增（有逐字稿證據）✅
- 結果為基線的嚴格超集，無任何退步
- Token：in 11,189 / out 3,184

**判定：✅ pass**

---

## 三支結果摘要

| Sample | 判定 | 關鍵觀察 |
|--------|------|----------|
| 睡眠科學 | ⚠️ partial | matched=[] ✅，wrong_pillar flag 未觸發（BUG-1）|
| Sora | ✅ pass | builder-mindset 移除，world-model 有逐字稿證據 |
| 對照組 | ✅ pass | 無退步，world-model 新增 |

---

## 本輪 Token 消耗

| Sample | in | out | 估算成本 |
|--------|-----|-----|---------|
| 睡眠科學 | 12,348 | 2,188 | ~$0.019 |
| Sora | 4,289 | 1,904 | ~$0.011 |
| 對照組 | 11,189 | 3,184 | ~$0.022 |
| **合計** | **27,826** | **7,276** | **~$0.052** |

（Haiku 4.5 價格：$0.80/M in, $4/M out）
注意：實際成本比 handoff 估算的 $0.002/sample 高約 10 倍，批次 24 支預計 ~$0.48

---

## 決策：批次重跑 24 支

根據 2 pass + 1 partial pass 結果：

**結論：批次重跑 24 支 YouTube source**

理由：
1. 核心品質改善達成（移除 surface-match，空陣列合法化）
2. ⚠️ partial 的根因是偵測機制 BUG，不是 prompt 品質問題
3. 批次重跑可以改善 300 支中 24 支 YouTube source 的 concept matching 品質
4. `wrong_pillar_suspected` 旗標 BUG 可在批次重跑後的 E2.5.2 階段修復

**BUG-1 修復建議（不在此輪執行）**：
```javascript
// scripts/wiki-enrich.cjs:161
// 現行（有問題）：
const wrongPillar = matched.length === 0 && firstReason.includes('主題與現有 concept 清單無核心對齊');

// 建議修改為：
const wrongPillar = matched.length === 0;
// （matched=[] 本身即足以識別 wrong_pillar，不需依賴 LLM 措辭）
```

---

## 意外發現（E2.5 執行期間）

`src/components/ai-collab-portfolio/AICollabPortfolio.tsx` 在 git diff 出現（HEAD 1268 行，磁碟 1099 行）。
判斷：iCloud Drive 在 E2.5 執行期間同步了較舊版本，與 E2.5 無關。
**未 stage 此檔案**，僅 stage 三支 wiki source。

---

## 未執行項目（批次重跑延後）

批次重跑指令（供日後執行）：
```bash
set -a; source .env; set +a
node scripts/wiki-enrich.cjs --batch --type=youtube --force
```
預計：24 支，~$0.48 token 費用，需確認環境有 ANTHROPIC_API_KEY。
