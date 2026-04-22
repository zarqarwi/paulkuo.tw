# Cowork 下一視窗 Handoff — Wiki Enrichment 等 Code E2.5 回報

> 建立：2026-04-21 晚
> 前一視窗 Cowork session：LLM Wiki 專案
> 上一個動作：推 E2.5 handoff + 更新 Issue #157 儀表板 + 更新 memory
> **下個視窗建議模型**：Claude Sonnet 4.6 + Effort Medium（或 Opus 4.6 如果要做品質審查）

---

## 現況一句話

**Enrichment CLI E2 批次完成但品質有問題，E2.5 修正 handoff 已推，下一個 Cowork 視窗主要工作：驗收 Code E2.5 回報 + 決定是否批次重跑 24 支。**

---

## 最近軌跡

| 階段 | Commit | 狀態 |
|------|--------|------|
| E1 設計 | `83493a2` | ✅ |
| E1 實作 | `78973ad` | ✅ |
| E1 審查 | `8ae0658` | ✅ |
| E2 batch + bug fix | `8741187` | ✅ 26/29 成功、$0.04 |
| **E2.5 handoff（Cowork 抽查）** | `185584b` | ✅ 已推 |
| **Issue #157 更新** | comment `4289830838` | ✅ |
| **E2.5 實作（Code）** | — | ⏳ 等 Code 接手 |

---

## 下個視窗第一件事

**開場先做 session-handoff skill 的狀態確認流程**：

1. 讀 Issue #157 最新進度（看有沒有新 comment）
2. 檢查 git log 最新 commits（看 Code 有沒有推 E2.5 修正）
3. 看 `worklogs/` 有沒有 Code 回報的新檔案

如果 **Code 還沒動**：不用著急，E2.5 不是急件，Paul 可能還沒開 [WIKI] session 給 Code。

如果 **Code 已經回報 E2.5 完成**：進下一步驗收流程。

---

## E2.5 驗收檢查清單（Code 回報後用）

### 硬性檢查

- [ ] `scripts/wiki-enrich.cjs` system prompt 第 7 條有「空陣列合法」規則
- [ ] `scripts/wiki-enrich.cjs` system prompt 新增第 10 條「matched 需逐字稿證據」
- [ ] CLI 有 wrong-pillar 偵測邏輯
- [ ] `src/content.config.ts` 加 `wrong_pillar_suspected: z.boolean().optional()` + `enrichment_notes: z.string().optional()`
- [ ] `npm run build` 通過（schema 新欄位不能壞既有 frontmatter）

### 3 支測試樣本實測

| Source | 預期結果 | 實測 | 通過？ |
|--------|---------|------|-------|
| `youtube-OxJzRU-6tuk-OxJzRU-6tuk`（睡眠） | matched=`[]`、wrong_pillar_suspected=true | ? | ? |
| `youtube-9yvP7PAunYs-openai-sora`（Sora） | matched 移除 builder-mindset + ai-agent-economy，保留或改成 software-disruption/ai-embodiment | ? | ? |
| `youtube-8pncy425QqQ-ai`（對照組） | 不退步，仍保留 `ai-embodiment`、`build-for-models`、`human-ai-collaboration` | ? | ? |

### 獨立抽查（避開 Code 挑的樣本）

從剩下 23 支已 enrich 的 YouTube source 裡隨機挑 2 支自己看：
- frontmatter matched 是不是核心主題？
- candidates reason 有沒有附逐字稿證據？
- wrong_pillar_suspected 有沒有誤觸發或該觸發沒觸發？

---

## 驗收通過後的決策樹

### 情境 A：3 支測試 + 2 支抽查全過

→ 放行批次重跑 23 支 `--force`
→ 跑完統計 wrong_pillar_suspected 觸發數
→ 下一步進 E3（Concept candidates 佇列處理）

### 情境 B：測試樣本通過但抽查找到新 bug

→ 不批次重跑
→ 開 E2.6 handoff 列新問題
→ Code 繼續修

### 情境 C：測試樣本就沒通過

→ Rollback commit + 重開 E2.5 規格
→ 可能需要換模型（Haiku 4.5 → Sonnet 4.6 fallback）

---

## 參考檔案

- **E2.5 handoff**（主要）：`worklogs/cowork--wiki-enrich-e2-review-2026-04-21.md` — commit `185584b`
- E2 handoff：`worklogs/cowork--wiki-enrich-e2-handoff-2026-04-21.md`
- E1 審查回覆：`worklogs/cowork--wiki-enrich-e1-review-2026-04-21.md`
- E1 handoff：`worklogs/cowork--wiki-enrich-cli-handoff-2026-04-21.md`
- Issue #157 最新 comment：https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4289830838
- memory 檔：`.auto-memory/project_llmwiki_enrichment_cli.md`

---

## 重要提醒

### 不要重複 Cowork 抽查時的錯誤

上次審查時原本只看 Code 挑的 3 支樣本（都是精準的 AI 影片），差點放行批次。後來獨立抽查才發現 matched 嚴重偏差。

**下次驗收 E2.5 時的抽查原則**：
- 至少挑 1 支非典型 AI 主題的影片（例如偏生活、偏商業策略）
- 至少挑 1 支 matched 空陣列的影片，確認 wrong_pillar_suspected 有正確標記
- 不要只看 Code 提出的「成功案例」

### Handoff push 紀律

寫完 handoff 必須 `git push` 或用 `mcp__github__create_or_update_file` 推到 main，不然下個 session 的 Code 讀不到。

---

## 跨專案影響提醒

E2.5 改動涉及：
- `scripts/wiki-enrich.cjs`（enrichment 邏輯）
- `src/content.config.ts`（schema）
- `src/content/wiki/sources/youtube-*.md`（frontmatter）
- Worker / KV seed：零影響

**不影響**：Formosa ESG、主站其他頁、get_筆記 ingest、YouTube pull pipeline。

---

## Paul 決策偏好備忘

- E2 驗收時 Paul 說「同意A」= 選項 A（CLI 寫入邏輯加引號）— 一致性優於 schema 寬鬆
- Paul 重視「獨立抽查」而非「看報告漂亮就放行」
- Paul 希望空陣列合法 — 寧可缺連結也不要假連結污染圖譜
- Paul 預算意識：E2 花 $0.04 是可接受範圍，但重跑也要看有沒有實質品質提升
