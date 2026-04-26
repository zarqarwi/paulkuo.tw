# Dialogue Marker 機制設計 — Prep Doc

> 並行於 wiki-kv-seed parser 升級 Code session。
> 不是完整 design doc，是「待 Paul 看完拍板再寫 Code handoff」的中間產物。

---

## 1. 背景

Phase 2 Rule（永久化在 `data/wiki-quarantine-rules.yml` v2 的第一條）：
> 錄音 + 商務會議 + 兩人以上討論（is_dialogue）→ visibility=internal + outcome=delete

現況：前兩個條件（`has_recording_tag` / `business_meeting`）已規則化，**第三個 `is_dialogue` 還沒 enable**。命中前兩條時 fallback 標 `needs_human_review`。

要解：**怎麼自動產生 `dialogue: true/false` 寫進 source frontmatter？**

---

## 2. 現況資料結構（從 GitHub source 抽樣確認）

### YouTube source（看 `youtube-fuz8Y40Ormg-403ai.md`）
- transcript 是 Whisper STT 輸出的純文字流，**沒有 speaker label**
- 大多數內容是 monologue（說書/解析/評論）
- 流水文字，看不出講者切換

### getnote 录音卡 source（推測，未抽樣）
- transcript 同樣是 STT 輸出（從 get_筆記 App 錄音轉寫）
- 商務會議的主戰場
- raw_source_path 在 `notes/05_商務會議/` 或 `notes/09_會議錄音/`
- 也是純文字流，無 speaker label

**核心結論**：現有 transcript 沒可靠的 speaker info，要靠**外部偵測**產出 marker。

---

## 3. 方案候選

### 方案 A — 純 Heuristic（規則偵測）
- 在 transcript 找對話標記：「A：」「B：」「Q：」「Speaker 1」「主持人：」等
- title 含「對談 / 訪談 / 會議記錄 / 討論會」
- transcript 第一行是 metadata（譬如「主持人：xxx 來賓：xxx」）

| 維度 | 評估 |
|------|------|
| 成本 | 低（regex）|
| 準確度 | YouTube monologue 高，純文字流的 getnote 錄音低 |
| 覆蓋率 | YouTube 高，getnote 录音差 |

### 方案 B — Speaker Diarization（重跑 STT）
- 換 Deepgram / AssemblyAI / Whisper + pyannote
- 重新處理所有 transcript

| 維度 | 評估 |
|------|------|
| 成本 | 高（換 STT、重跑、API 費用）|
| 準確度 | 高 |
| 覆蓋率 | 完整 |
| 問題 | 對 monologue YouTube 是浪費；現有 corpus 要 backfill |

### 方案 C — LLM 判斷（Haiku-based classifier）
- 把 transcript 頭 1500 + 尾 1500 字餵 Haiku
- prompt：「判斷這段是 monologue 還是 dialogue，回 JSON: `{dialogue: bool, speaker_estimate: int}`」
- 寫進 frontmatter

| 維度 | 評估 |
|------|------|
| 成本 | 中（每筆 ~$0.001 Haiku）|
| 準確度 | 中-高 |
| 覆蓋率 | 完整 |
| 整合點 | 可在 wiki-enrich.cjs 或 ingest pipeline |

### 方案 D — title-only fallback（最弱）
- 只用 title 字眼當 dialogue 訊號
- 不做 transcript 分析

→ 當其他方案的 baseline，不單獨採用

---

## 4. 推薦：A + C 兩層組合

**第一層 A（廉價快過）：**
- title 字眼命中 → 直接 `dialogue: true`（高 precision、低 recall）
- transcript 頭部明顯講者標記 → 直接 `dialogue: true`

**第二層 C（A 沒命中時跑）：**
- transcript 頭尾餵 Haiku
- 寫進 `dialogue: true/false` + `dialogue_inference: heuristic|llm|none`

**不做 B**（diarization）— monologue 太多、成本太高、收益不明顯。

---

## 5. Frontmatter schema 提議

加進 `src/content.config.ts` wiki schema：

```typescript
dialogue: z.boolean().optional().default(false),
dialogue_inference: z.enum(['heuristic', 'llm', 'manual', 'none']).optional().default('none'),
speakers: z.array(z.string()).optional(),  // 只在能推斷時填
```

---

## 6. 整合點

| 整合點 | 動作 |
|--------|------|
| 新 ingest（YouTube）| `wiki-youtube-ingest.cjs` 加 post-processing step |
| 新 ingest（getnote）| `sync_notes.py` 同步後加 detector 步驟（在 get_筆記 repo 端）|
| 既有 corpus | 寫一次性 backfill script 跑全部 ~300 sources |
| Quarantine classifier | `data/wiki-quarantine-rules.yml` 第一條的 `is_dialogue` 從 frontmatter `dialogue` 讀取 |

---

## 7. 待 Paul 拍板（4 個決策點）

### Q1：採用 A+C 組合？還是先只做 A，延後 C？
- A only：30 min Cowork + 30 min Code，先看 heuristic 命中率
- A+C 一次到位：60 min Cowork + 90 min Code，但更穩

**我推薦 phased：先 A，看 1 週數據再決定是否加 C**

### Q2：schema 欄位用 `dialogue` 還是 `is_dialogue`？
- `dialogue`：跟其他 frontmatter 欄位（`tags`、`pillar`）一致用名詞
- `is_dialogue`：跟 `wiki-quarantine-rules.yml` 已寫的 condition key 對齊

**我推薦 `dialogue`**（frontmatter 用名詞，rules 端做 mapping）

### Q3：回頭 backfill 既有 300 sources 嗎？
- 是：corpus 完整化，但要跑 ~300 次 detector
- 否：只對未來新 ingest 啟用，舊的維持手動 review

**我推薦先 dry-run backfill 看命中分布，再決定要不要寫進去**

### Q4：Haiku call 整合到哪個 script？
- `wiki-enrich.cjs` 已用 Haiku → 自然延伸（一筆 source 一次 LLM call 同時做 enrichment + dialogue detect）
- 獨立 `wiki-dialogue-detect.cjs` → 模組化、可單獨重跑

**我推薦整合進 wiki-enrich.cjs**（少一個 script、少一輪 LLM call）

---

## 8. 工作量估計（A+C 完整）

| 步驟 | Cowork | Code | 備註 |
|------|------|------|------|
| Schema 加 3 個欄位 | 5 min | 5 min | content.config.ts |
| Heuristic detector | 10 min design | 30 min impl + tests | regex + title keywords |
| Haiku call integration | 10 min design | 45 min impl | wiki-enrich.cjs 加 step |
| Backfill 既有 300 sources | 5 min handoff | 30 min run + verify | dry-run first |
| Quarantine rules 更新 | 5 min | 5 min | enable is_dialogue |
| **總計** | 35 min | ~2 hr | 跨 2-3 個 Code session |

或 phased：
- **Phase 1（短期）**：A heuristic + schema → 30 min Cowork + 30 min Code
- **Phase 2（中期）**：C LLM + backfill → 60 min Cowork + 90 min Code

---

## 9. 推薦下一步

**先做 Phase 1（A heuristic + schema）試水**：
1. 加 schema 3 個欄位（`dialogue` / `dialogue_inference` / `speakers`）
2. 寫 heuristic detector（純 regex + title keyword）
3. 跑 dry-run 在現有 300 sources 上，看命中分布
4. 看數據再決定要不要加 Phase 2（LLM）

這個拆法的好處：
- Phase 1 完成後 quarantine rules 就能 enable `is_dialogue`（用 heuristic + title 當 source）
- Phase 2 屆時可以基於 Phase 1 的 missed cases 設計 LLM prompt
- 成本可控、可逐步驗證

---

## 10. 還沒驗證的假設（待後續確認）

- ❓ getnote 录音卡 source 的 transcript 結構（沒抽樣）
- ❓ 既有 quarantine 65 筆裡，多少是因為 `is_dialogue` 命中（如果 0，這個 marker 機制價值降低）
- ❓ get_筆記 App 內的录音卡是否有 speaker tag metadata 可帶過來

---

*建立：2026-04-26 由 Cowork 並行於 wiki-kv-seed parser Code session 寫成。*
*狀態：等 Paul 看完拍板 4 個 Q，再寫 Phase 1 Code handoff。*
