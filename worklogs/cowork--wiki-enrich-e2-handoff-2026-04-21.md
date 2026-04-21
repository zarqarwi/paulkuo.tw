# Cowork → Code Handoff: Wiki Enrichment CLI E2（含 E1 bug 修正）

> 建立：2026-04-21
> Cowork session：LLM Wiki 專案
> 目標 session：Code [WIKI]
> 前序 handoff：
> - `worklogs/cowork--wiki-enrich-cli-handoff-2026-04-21.md`（E1 設計）
> - `worklogs/code--wiki-enrich-e1-complete-2026-04-21.md`（E1 回報，commit `78973ad`）
> - `worklogs/cowork--wiki-enrich-e1-review-2026-04-21.md`（E1 審查回覆，commit `8ae0658`）
> **建議模型**：Claude Sonnet 4.6 + Effort Medium

---

## ✅ 放行 E2（有條件）

Paul 手動驗收 `youtube-8pncy425QqQ-ai` 通過：

| 驗收項 | 結果 |
|-------|------|
| CLI 正式寫檔 | ✅ 成功，8009 chars transcript，tokens in 10242 / out 2417 |
| `git diff` body 未動 | ✅ 只有 frontmatter 60 行 insertions，0 deletions |
| `npm run build` | ⚠️ 失敗 → 手動修 `enriched_at` 引號後 ✅ 548 頁建置通過 |

E2 批次前必須先修下方 **1 個 bug + 3 個 prompt 強化**，再重跑一次 `youtube-8pncy425QqQ-ai` 確認 matched 收斂，才批次跑其餘 24 支。

---

## 必修 1：Bug — enriched_at 日期需加引號

### 現象

CLI 寫出來的 YAML：
```yaml
enriched_at: 2026-04-21
```

YAML 解析器自動轉成 JavaScript `Date` 物件，但 Astro schema 宣告 `enriched_at: z.string()`，validation 失敗：

```
[InvalidContentEntryDataError] wiki_sources → youtube-8pncy425qqq-ai data does not match collection schema.
  enriched_at: Expected type `"string"`, received `"date"`
```

### 修法（二選一，推薦選項 A）

**選項 A — 改 CLI 寫入邏輯（推薦）**

在 `scripts/wiki-enrich.cjs` 組 frontmatter 字串時，日期欄位一律用雙引號包：

```javascript
// 不好
`enriched_at: ${today}\n`

// 好
`enriched_at: "${today}"\n`
```

一致性高、對未來人工閱讀 YAML 最直觀。

**選項 B — 改 schema**

`src/content.config.ts`：
```typescript
enriched_at: z.coerce.date().optional(),
// 或
enriched_at: z.union([z.string(), z.date()]).optional(),
```

缺點：frontmatter 風格不統一（其他字串欄位都有引號）。

### 驗收

修完後跑：
```bash
node scripts/wiki-enrich.cjs youtube-8pncy425QqQ-ai --force
npm run build
```

不手動改檔就能通過。

---

## 必修 2：Prompt Q1 — summary 字數硬性 280-320

### 觀察

E1 dry-run：230 字（太短）
E1 正式寫檔：約 320 字（剛好卡上限，但偶爾超過會被截斷）

### 修改

`scripts/wiki-enrich.cjs` system prompt 第 3 條改為：

```
3. summary 字數必須在 280-320 之間。少於 280 需補充背景脈絡或論點延伸；
   超過 320 需精簡，不要堆疊冗詞。
```

---

## 必修 3：Prompt Q2 — matched 只列核心主題

### 觀察

`youtube-8pncy425QqQ-ai`（群核空間智能訪談）matched 列了 6 個：
- ✅ `ai-embodiment` — 核心
- ✅ `human-ai-collaboration` — 核心
- ⚠️ `build-for-models` — 沾邊
- ⚠️ `enterprise-ai-adoption` — 沾邊
- ❌ `one-person-team` — 完全不相關
- ❌ `learning-as-meta-skill` — 完全不相關

Haiku 在 concept matching 上**過度慷慨**，會污染知識圖譜。

### 修改

`scripts/wiki-enrich.cjs` system prompt 第 7 條改為：

```
7. concept_links.matched：只從提供的 concept 清單挑選；只列「核心主題」—
   即該 concept 是影片/文章的主軸或論述骨幹。沾邊、輔助性提及的 concept
   放到 candidates 的 reason 裡說明，不放 matched。寧可少列精準的 3 個，
   不要多列勉強的 5 個。
```

### 驗收

重跑 `youtube-8pncy425QqQ-ai --force` 後，matched 應收斂到 **2-3 個核心 concept**（預期 `ai-embodiment` + `human-ai-collaboration`）。

---

## 必修 4：Prompt Q3 — slug 分類規則

### 觀察

E1 正式寫檔 candidates 全用英文 kebab-case（`spatial-intelligence`、`world-models-infrastructure`、`3d-asset-economy`、`gpu-compute-moat`）—
技術術語走英文方向正確 ✅，但目前是 Haiku 自己判斷，沒有明文規則。

### 修改

`scripts/wiki-enrich.cjs` system prompt 新增第 9 條：

```
9. concept_links.candidates 的 slug_zh 欄位命名：
   - 技術術語、產業概念、國際通用主題 → 英文 kebab-case
     （如 spatial-intelligence, world-model-stack）
   - 在地議題、台灣特有情境、中文人文概念 → 中文 slug
     （如 台灣循環經濟, 在地供應鏈）
   - 判斷基準：該 slug 若要對英語圈讀者說明是否自然？
     自然→用英文；需中文語境才成立→用中文。
   欄位名保留 slug_zh（frontmatter schema 不動），內容可為中英任一。
```

---

## E2 Scope

### 必做

- [ ] 修上面 4 件事（bug + 3 prompt）
- [ ] 先用 `--force` 重跑 `youtube-8pncy425QqQ-ai` 驗證修正到位
- [ ] `--batch` 模式：掃描 `src/content/wiki/sources/` 下所有 frontmatter 無 `enriched_at` 的 YouTube source
- [ ] 逐一呼叫 Haiku 4.5，每支之間 `sleep 1000ms`（避免 rate limit）
- [ ] 進度顯示：`[3/25] youtube-xxx-ai` + 成功 / 失敗計數
- [ ] 跳過已 enriched（除非 `--force`）
- [ ] 失敗不中斷：單支失敗寫入 `logs/wiki-enrich-YYYY-MM-DD.log`，繼續下一支
- [ ] 結束時印統計：`✓ 22 成功 / ✗ 3 失敗`

### 額外 flags

- `--type=youtube` 只處理 YouTube 來源
- `--pillar=ai` 只處理指定 pillar
- `--dry-run` + `--batch` 組合可預覽批次範圍不實際呼叫 API
- `--force` 覆寫已 enriched（加警告提示，但不擋）

### 不做（留 E3+）

- Pass 2 新 concept 候選佇列 → `worklogs/concept-candidates.md`
- Sonnet fallback 觸發
- 整合進 scheduled tasks

---

## 驗收樣本處理

Paul 決策：**保留 `youtube-8pncy425QqQ-ai` 當驗收樣本**。

E2 批次時用 `--force` 覆寫這支，方便對比修正前後的 matched 差異：
- 修正前（E1 寫入）：matched 6 個（含沾邊的）
- 修正後（E2 寫入）：matched 應收斂到 2-3 個核心

---

## 完成後請做

1. commit + push（遵循 Paul 的 handoff push 規則）
2. 更新本 handoff 加「Code 回報」區塊，貼：
   - 批次完成統計（成功 / 失敗 / 總 token / 總成本）
   - `youtube-8pncy425QqQ-ai` 修正前後 matched 對比
   - 3 支隨機抽樣的摘要品質確認
   - 失敗案例（若有）的錯誤訊息
3. Cowork 抽查品質後，再決定是否進 E3

---

## 跨專案影響檢查

| 檔案 | E2 影響 |
|------|--------|
| `scripts/wiki-enrich.cjs` | 修 bug + 3 prompt + 擴批次邏輯 |
| `src/content.config.ts` | 不動（除非選方案 B） |
| 所有 `src/content/wiki/sources/youtube-*.md` | frontmatter 追加 enrichment 欄位 |
| `.env` | 不動 |
| `package.json` | 不動 |
| Worker / KV seed | 零影響（search 仍索引 concept，enriched source 不影響 KV） |

---

## 決策備忘

- **為何選項 A 勝出**：frontmatter 風格一致，其他字串欄位（如 `enriched_by: haiku-4.5`）Code 這次也有加引號嗎？如果沒有，順便一起補。統一風格對未來人眼維護友善。
- **為何堅持重跑驗收**：prompt 改完沒實測 = 不知道 matched 真的有收斂。只有 25 支可以試錯，每支都寶貴。
- **為何保留驗收樣本**：對比修正前後的 diff 是 prompt engineering 的最好證據。Code 也能從中學到 Haiku 放任模式長什麼樣。