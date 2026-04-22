# Cowork E2 獨立抽查 + E2.5 prompt 再強化

> 建立：2026-04-21 晚
> Cowork session：LLM Wiki 專案
> 目標 session：Code [WIKI]
> 前序：`worklogs/cowork--wiki-enrich-e2-handoff-2026-04-21.md`（commit `8741187`）
> **建議模型**：Claude Sonnet 4.6 + Effort Medium

---

## 結論：E2 批次有條件通過 + 需 E2.5 prompt 再強化

Code 回報的 3 支抽樣（`aihermes-agent`、`gemma-4-ai`、`aiagi`）都是 AI 主題且 matched 精準，**但我隨機抽的 2 支發現 matched 嚴重偏差**。問題在於 Haiku 還是在挑「字面相關」而非「論述主軸」的 concept。

**不 rollback、不重跑 25 支**。問題集中在 matched 策略，先把 prompt 再調一版、建立篩除機制，下次微量重跑受影響的。

---

## Cowork 獨立抽查（避開 Code 挑的 3 支）

### ❌ 抽查 1：`youtube-OxJzRU-6tuk-OxJzRU-6tuk`（睡眠科學影片）

**內容**：咖啡因、REM 睡眠、褪黑素、光照、失眠急救——跟 AI **完全無關**。

**matched**：`[learning-as-meta-skill, human-judgment-in-ai-era, personal-knowledge-system]` — **3 個全錯**。

**兩層根因**：
1. **Ingest 階段 pillar 分錯**：frontmatter `pillar: ai`，但內容是睡眠科學。應該是 `wellness` 或 `life`。
2. **Enrichment 階段強迫 match**：即使內容跟 AI 無關，Haiku 仍從 22 個（多為 AI 相關的）concept 硬挑 3 個，導致污染知識圖譜。

### ❌ 抽查 2：`youtube-9yvP7PAunYs-openai-sora`（Sora 下架重生）

**內容**：OpenAI 策略失誤、世界模型、Sora 轉機器人方向。

**matched**：`[software-disruption, builder-mindset, ai-agent-economy]`

分析：
- `software-disruption` — ⚠️ 勉強（Sora 是顛覆級影片生成，但影片主軸不是顛覆論述）
- `builder-mindset` — ❌ 完全無關（影片是講策略失敗，不是建造者心態）
- `ai-agent-economy` — ❌ 完全無關（影片根本沒講 agent economy）

**真正的核心主題**（`ai-embodiment`、`world-model-stack`）反而被 Haiku 降級到 candidates。

### ✅ 驗收樣本：`youtube-8pncy425QqQ-ai`（群核空間智能）

Code 重跑 `--force` 後 matched 從 6 收斂到 3（`ai-embodiment`、`build-for-models`、`human-ai-collaboration`）— 精準度大幅提升 ✅。這支**證實 Q2 prompt 對 AI 主題影片有效**。

---

## 根本診斷

E2 prompt 修正只對「主題本來就在 concept 範圍內」的影片有效。兩個新問題：

1. **Wrong-pillar 問題**：非 AI 內容被 ingest 成 `pillar: ai`，enrichment 強迫硬 match
2. **Surface-match 問題**：Haiku 看到 AI 影片就優先挑「名字聽起來相關」的 concept，而非「實際論述主軸」

---

## E2.5 必修 3 件事

### 必修 1：Prompt 加「不強迫 match」規則

`scripts/wiki-enrich.cjs` system prompt 第 7 條改為（在現有「只列核心主題」之後追加）：

```
7. concept_links.matched：只從提供的 concept 清單挑選；只列「核心主題」—
   即該 concept 是影片/文章的主軸或論述骨幹。沾邊、輔助性提及的 concept
   放到 candidates 的 reason 裡說明，不放 matched。寧可少列精準的 3 個，
   不要多列勉強的 5 個。

   ⚠️ 重要：如果影片主題與提供的 concept 清單**完全不相關**（例如影片講
   睡眠科學但 concept 清單全是 AI 主題），matched 直接留空陣列 `[]`，
   並在 candidates 的第一個項目 reason 裡說明：「本 source 主題與現有
   concept 清單無核心對齊，建議作為候選主題獨立列出。」

   絕不為了湊數而 match 不相關 concept。空陣列是合法且正確的輸出。
```

### 必修 2：Prompt 要求「match 必須有逐字稿證據」

system prompt 新增第 10 條：

```
10. matched 陣列裡的每個 concept 必須在 candidates 陣列的首個項目 reason
    裡附上至少一句逐字稿原文或 chapters 段落引用作為證據。如果找不到
    直接證據，該 concept 必須從 matched 移除。這是硬性要求，為了防止
    表面關鍵字匹配。
```

### 必修 3：加 Wrong-pillar 偵測

CLI 在寫檔前加驗證：如果 matched 為空陣列且 candidates 第一條 reason 含「主題與現有 concept 清單無核心對齊」，就在 frontmatter 追加：

```yaml
wrong_pillar_suspected: true
enrichment_notes: "本 source 主題與 concept 清單無對齊，建議人工審查 pillar 分類"
```

並在 terminal 警告 + log 記錄。這樣批次跑完 Paul 可以用 grep 找出需重新分類的 source。

---

## E2.5 執行步驟

- [ ] 改上面 3 件事
- [ ] 先 `--force` 重跑 3 支測試樣本驗證：
  - `youtube-OxJzRU-6tuk-OxJzRU-6tuk`（睡眠，預期 matched=`[]`、wrong_pillar_suspected=true）
  - `youtube-9yvP7PAunYs-openai-sora`（Sora，預期 matched 移除 `builder-mindset` + `ai-agent-economy`，保留 `software-disruption` 或改成 `ai-embodiment`）
  - `youtube-8pncy425QqQ-ai`（對照組，確認不退步）
- [ ] 回報 Cowork 驗證是否通過，再決定要不要批次重跑其他 24 支
- [ ] 統計：跑完的 26 支中，多少支可能是 wrong-pillar？（grep `enrichment_notes` 關鍵字）

---

## 不做（E3+）

- ingest 階段自動 pillar 分類（這是 ingest 腳本的問題，不是 enrichment）
- Sonnet fallback（空 matched 也許該觸發 Sonnet 重試，但先等 E2.5 數據）

---

## 決策備忘

- **為何不 rollback**：E2 成果 80% 是對的，rollback 會浪費已花的 $0.04 + 失去驗收樣本對比。改增量修正。
- **為何空陣列合法**：強迫 match 製造噪音 = 把好不容易凝練的 concept 圖譜搞糊。寧可空著等人工審查，也不要假連結。
- **為何要證據綁定**：Haiku 在語言層的表面匹配是 LLM 常見失敗模式，強迫附逐字稿證據是最有效的約束。
- **為何要 wrong_pillar_suspected 標記**：ingest 管線的 pillar 分類出錯是源頭，但修 ingest 要重新過全部 source。先在 enrichment 階段偵測、標記、集中處理更快。

---

## 跨專案影響檢查

| 檔案 | E2.5 影響 |
|------|---------|
| `scripts/wiki-enrich.cjs` | 改 prompt + 加 wrong_pillar 偵測邏輯 |
| `src/content.config.ts` | 加 `wrong_pillar_suspected: z.boolean().optional()` + `enrichment_notes: z.string().optional()` |
| 已 enrich 的 26 支 source | 部分會在 E2.5 測試時被 `--force` 覆寫 |
| 其他 | 零影響 |

---

## 完成後請做

1. commit + push
2. 更新本 handoff 加「Code 回報」區塊，貼：
   - 3 支測試樣本的修正前後對比
   - prompt 前後完整 diff
   - wrong_pillar_suspected 觸發的案例
3. Cowork 決定是否放行批次重跑剩餘 23 支

---

## Code 回報（2026-04-22，commit 1fada00 / d47e50f）

### 3 支測試樣本修正前後對比

#### youtube-OxJzRU-6tuk（睡眠科學）
| | E2 修正前 | E2.5 修正後 |
|--|--|--|
| matched | [learning-as-meta-skill, human-judgment-in-ai-era, personal-knowledge-system] | [learning-as-meta-skill, human-judgment-in-ai-era] |
| wrong_pillar_suspected | — | ❌ 未觸發（Haiku 仍 surface-match） |
| 問題根因 | 強迫 match | Haiku 用間接類比推理繞過空陣列規則 |

#### youtube-9yvP7PAunYs（Sora 下架重生）
| | E2 修正前 | E2.5 修正後 |
|--|--|--|
| matched | [software-disruption, builder-mindset, ai-agent-economy] | [software-disruption, one-person-team, build-for-models] |
| 改善 | builder-mindset ❌ + ai-agent-economy ❌ 被移除 | ✅ 最惡劣 match 清除 |

#### youtube-8pncy425QqQ（群核 AI，對照組）
| | E2 修正前 | E2.5 修正後 |
|--|--|--|
| matched | [ai-embodiment, build-for-models, human-ai-collaboration] | [ai-embodiment, build-for-models] |
| 判定 | ✅ 穩定（small drift 但合理） | ✅ 穩定 |

### Prompt 前後完整 diff 摘要
- rule #7 尾端追加：空 matched 合法、禁止湊數、無對齊需在 candidates[0].reason 說明
- rule #10 新增：每個 matched 需逐字稿原文證據，無據必須移除

### wrong_pillar_suspected 觸發狀況
本次 3 支測試：**0 次觸發**。
根因：睡眠影片案例 Haiku 未回傳空 matched，偵測機制邏輯正確但 trigger 前提條件（Haiku 完全遵守 rule #7）尚未達到。

### Cowork 待決策
1. **睡眠影片是否需 E2.5.1**？可在 prompt 加一行：「若 source 的 pillar 欄位與 concept 清單的領域完全不同（如 pillar=ai 但內容是健康/睡眠），matched 必須為空陣列，禁止尋找間接連結。」
2. **批次重跑決策**：26 支中建議先不批跑，等 E2.5.1 prompt 確認後一次到位
3. 是否放行 E3+（Sonnet fallback on empty matched）

