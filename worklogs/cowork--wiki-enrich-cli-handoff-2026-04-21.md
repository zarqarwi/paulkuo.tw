# Cowork → Code Handoff: Wiki Enrichment CLI E1

> 建立：2026-04-21
> Cowork session：LLM Wiki 專案
> 目標 session：Code [WIKI]
> 關聯 Issue：#157（LLM Wiki 儀表板，🔴 近期最後一項）
> **建議模型**：Claude Sonnet 4.6 + Effort Medium（骨架寫完 + dry-run 驗證）

---

## 背景

YouTube pipeline 昨天（2026-04-21）已經 deploy 完成（Worker version `73ba0930`）。
25 支 YouTube source 有逐字稿但都還只是「原始稿」狀態——沒摘要、沒 concept links、沒進知識圖譜。

Enrichment CLI 是把 source 從「原始稿」升級成「有結構知識節點」的最後一哩路。

---

## 設計決策（Paul 2026-04-21 已定調）

| 決策項 | 選擇 |
|--------|------|
| 摘要 schema | **中量版**：summary 300字 + 5 key_points + 3 concept_candidates + chapters + 3-5 quotes |
| 主力 LLM | **Haiku 4.5 主力 + Sonnet 4.6 fallback** |
| Concept 策略 | **兩階段 match + 候選佇列**（Pass 1 對齊現有 22 concept；Pass 2 新 concept 進 `worklogs/concept-candidates.md` 給 Paul 審） |
| Slug 慣例 | **新 concept 暫採方案 A**：新 concept 中文 slug、舊 22 個英文不動（長期規範待定） |

---

## E1 Scope（本次 handoff 交付）

### 必做

- [ ] `scripts/wiki-enrich.cjs` v0.1 骨架
  - dotenv loader（沿用 wiki-youtube-ingest.cjs 的零依賴寫法）
  - Anthropic SDK（`@anthropic-ai/sdk`）接 Haiku 4.5
  - `--dry-run` flag（印 JSON 結果，不寫檔）
  - 支援單 slug 輸入：`node scripts/wiki-enrich.cjs <slug> --dry-run`
  - 讀取 `src/content/wiki/sources/<slug>.md`，解析 frontmatter + body（transcript）
  - 呼叫 Haiku 產生中量版 schema（見下方 prompt 規格）
  - 輸出 JSON 到 stdout（dry-run）或寫回 frontmatter（正式）
- [ ] Prompt 規格（見下方）
- [ ] Pass 1 concept alignment：載入 `src/content/wiki/concepts/*.md` 的 frontmatter 清單，讓 LLM 從現有 22 concept 挑 match
- [ ] 環境變數檢查：`ANTHROPIC_API_KEY`（要加進 `.env`，目前只有 GROQ）

### 不做（留到 E2/E3）

- 批次模式（`--batch`）
- Pass 2 新 concept 提議 → `concept-candidates.md`
- `--force` 覆寫邏輯
- Sonnet fallback 觸發條件
- 整合進 scheduled tasks

---

## Prompt 規格（給 Haiku 4.5）

### System prompt

```
你是 Paul Kuo 的 LLM Wiki 知識管理助手。任務：把 YouTube 逐字稿或筆記內容，
升級成結構化的知識節點摘要。

輸出規則：
1. 繁體中文，台灣用語（影片/軟體/網路，不用視頻/软件/网络）
2. 嚴格輸出 JSON，無前後綴文字
3. summary 控制在 280-320 字
4. key_points 5 條，每條 20-40 字
5. quotes 3-5 條，原文金句 + timestamp（若逐字稿無時間戳，留空字串）
6. chapters 依逐字稿結構分 3-8 段
7. concept_links.matched：只從提供的 concept 清單挑選；不要發明
8. 若逐字稿品質差（口語重複、雜訊多），summary 仍需凝練；不要照抄
```

### User prompt 模板

```
## 現有 Concept 清單（只能從這裡 match）
{concept_list_json}  // [{slug, title, description}, ...]

## Source Metadata
- title: {title}
- pillar: {pillar}
- raw_note_id: {raw_note_id}
- 來源類型: {youtube | column | note}

## 逐字稿 / 原文內容
{transcript}

---

請輸出 JSON：
{
  "summary": "300 字摘要",
  "key_points": ["...", "...", "...", "...", "..."],
  "quotes": [{"text": "...", "timestamp": "MM:SS 或空字串"}, ...],
  "chapters": [{"title": "...", "start": "MM:SS 或空字串", "summary": "30 字"}, ...],
  "concept_links": {
    "matched": ["slug1", "slug2"],
    "candidates": [
      {"slug_zh": "中文slug", "title": "標題", "reason": "為何值得獨立成 concept"}
    ]
  }
}
```

---

## Frontmatter 寫入規格（非 dry-run）

在原 source.md 的 frontmatter 追加：

```yaml
enriched_at: 2026-04-21
enriched_by: haiku-4.5
summary: "..."
key_points:
  - "..."
quotes:
  - text: "..."
    timestamp: "..."
chapters:
  - title: "..."
    start: "..."
    summary: "..."
concept_links:
  matched: [...]
  candidates: [...]  # E1 先保留在 frontmatter，E3 才搬到 candidates.md
```

**原則**：body（逐字稿內容）不動，只加 frontmatter。

---

## Schema 更新

`src/content/config.ts`（Content Collections）需要加新欄位：

```ts
enriched_at: z.string().optional(),
enriched_by: z.string().optional(),
summary: z.string().optional(),
key_points: z.array(z.string()).optional(),
quotes: z.array(z.object({
  text: z.string(),
  timestamp: z.string(),
})).optional(),
chapters: z.array(z.object({
  title: z.string(),
  start: z.string(),
  summary: z.string(),
})).optional(),
concept_links: z.object({
  matched: z.array(z.string()),
  candidates: z.array(z.object({
    slug_zh: z.string(),
    title: z.string(),
    reason: z.string(),
  })),
}).optional(),
```

---

## 測試驗收

### 驗收 1：dry-run 可跑通

```bash
node scripts/wiki-enrich.cjs <某個有逐字稿的 youtube slug> --dry-run
```

預期：輸出合法 JSON，包含所有欄位，summary 字數合格。

### 驗收 2：concept alignment 有命中

選一支明顯和 `one-person-team` 或 `human-judgment-in-ai-era` 相關的影片，確認 `concept_links.matched` 有抓到。

### 驗收 3：正式寫檔

```bash
node scripts/wiki-enrich.cjs <slug>
```

預期：
- `src/content/wiki/sources/<slug>.md` frontmatter 正確追加欄位
- body 完全沒動
- `git diff` 乾淨、只動 frontmatter

### 驗收 4：schema validation

Astro build 不報錯：
```bash
npm run build
```

---

## 跨專案影響檢查

| 檔案 | 影響 |
|------|------|
| `scripts/wiki-enrich.cjs` | 新檔，零影響 |
| `src/content/config.ts` | 加 optional 欄位，舊 source 不報錯 |
| `.env` | 加 `ANTHROPIC_API_KEY` |
| `package.json` | 加 `@anthropic-ai/sdk` |
| 現有 `wiki-youtube-ingest.cjs` | 零影響 |
| Worker（`worker/`） | 零影響（本次純 CLI） |
| KV seed | 零影響（E1 只動 source frontmatter，search 索引是 concept） |

---

## 完成後請做

1. commit + push（遵循 Paul 的 handoff push 規則）
2. 更新本 handoff 加「Code 回報」區塊
3. 回報給 Cowork：哪支影片驗收通過、產出範例 JSON
4. Cowork 看過品質後才決定是否放行 E2（批次模式）

---

## 參考檔案

- `scripts/wiki-youtube-ingest.cjs` — dotenv loader + ffmpeg 模式參考
- `src/content/wiki/concepts/agentic-web.md` — concept frontmatter 範例
- `src/content/config.ts` — content collection schema 位置

---

## 決策備忘（給未來 session）

- **為何選中量版**：YouTube 30 分鐘影片值得 chapters + quotes，使用者瀏覽時直接從 frontmatter 就能吸收重點，不用開 body。
- **為何 Haiku 不 Sonnet**：25 支批次下來 Haiku 大約 $0.5 內，Sonnet 要 $3-5；品質夠用就好，不佳再 fallback。
- **為何 Pass 1 + 候選**：concept 碎片化是 wiki 最大敵人，LLM 放任建 concept 會變標籤雲。兩階段把「對齊」和「創造」分離，創造需 Paul 人審。
- **Slug 方案 A（中文為主、英文為輔）**：Paul 選定但與現有 22 個英文 slug 不一致，先維持「新的中文、舊的不動」，等新 concept 候選實際出現時再拍板。
