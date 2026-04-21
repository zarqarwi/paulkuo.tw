# Cowork → Code Handoff: Wiki Enrichment CLI E1 審查回覆

> 建立：2026-04-21
> Cowork session：LLM Wiki 專案
> 目標 session：Code [WIKI]
> 前序 handoff：`worklogs/code--wiki-enrich-e1-complete-2026-04-21.md`（commit `78973ad`）
> **建議模型**：Claude Sonnet 4.6 + Effort Medium

---

## E1 審查結果：有條件放行 E2

E1 骨架與 dry-run 品質通過審查。**但 E2 必須在 Paul 手動驗收正式寫檔後才可放行。**

Cost 驗證漂亮：每支 $0.002、25 支 $0.05，遠低於原估 $0.5。

---

## 四個問題的決策

### Q1：摘要字數 230 vs 規格 280-320 → **收緊，硬性要求 280-320**

Paul 決策：**prompt 加硬性要求 280-320 字**。

**需修改**：system prompt 第 3 條改為：
```
3. summary 字數必須在 280-320 之間。少於 280 需補充背景脈絡或論點延伸；
   超過 320 需精簡，不要堆疊冗詞。
```

原因：群核影片內容密度高，230 字壓縮過頭，資訊量明顯不足。

---

### Q2：matched 準確度 → **收緊，只列核心主題**

Paul 決策：**prompt 加「只列核心主題」原則**。

觀察：群核影片裡 `build-for-models`、`enterprise-ai-adoption` 算勉強沾邊，不是核心。Haiku 在 concept matching 上有**過度慷慨**的傾向。

**需修改**：system prompt 第 7 條改為：
```
7. concept_links.matched：只從提供的 concept 清單挑選；只列「核心主題」—
   即該 concept 是影片/文章的主軸或論述骨幹。沾邊、輔助性提及的 concept
   放到 candidates 的 reason 裡說明，不放 matched。寧可少列精準的 3 個，
   不要多列勉強的 5 個。
```

**預期效果**：群核影片 matched 應收斂到 `ai-embodiment` 和 `human-ai-collaboration` 兩個核心。

---

### Q3：Slug 規則細化 → **技術術語英文、在地議題中文**

Paul 決策：**分類寫規則，不是一刀切**。

原本方案 A 說「新 concept 中文 slug」過於簡化。Code 這次主動用英文 slug（`spatial-intelligence-technology` 等）其實是對的——技術術語走英文，符合現有 22 個 concept 慣例。

**需修改**：system prompt 加一條新規則（第 9 條）：
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

**對現有三個 candidates 的回饋**（給 Paul 參考，Code 不必改資料）：
- `spatial-intelligence-technology` — ✅ 值得立，未來類似影片會累積
- `world-model-embodiment-stack` — ⚠️ 像是 `ai-embodiment` 的 sub-topic，先觀察 3 支以上影片再決定
- `geopolitical-ai-divergence` — ⚠️ 地緣題材重要但需累積，暫列候選

這些是 concept 策展判斷，E3（candidates 佇列）時再細談。E2 不用處理。

---

### Q4：放行 E2 條件 → **Paul 手動驗收正式寫檔 + npm build 通過**

Paul 決策：**先手動跑一支正式寫檔，確認無誤才放行 E2**。

理由：E1 只測了 dry-run，YAML 寫入、body 不動、Astro schema 驗證——這三件事沒實測過。萬一有 bug，批次跑 25 支會全部髒掉，難回頭。

**Paul 驗收步驟**（請 Code 等候，不要先自己跑）：

```bash
# 1. 正式寫檔
node scripts/wiki-enrich.cjs youtube-8pncy425QqQ-ai

# 2. 確認 diff 只動 frontmatter、body 完全沒動
git diff src/content/wiki/sources/youtube-8pncy425QqQ-ai.md

# 3. Astro schema 驗證
npm run build
```

三個都通過 → Paul 或 Cowork 在本 handoff 追加「✅ 放行 E2」段落 → Code 再開 E2。

---

## E2 Scope（驗收通過後放行）

### 必做

- [ ] `--batch` 模式：掃描 `src/content/wiki/sources/` 下所有 frontmatter 無 `enriched_at` 的 YouTube source
- [ ] 逐一呼叫 Haiku 4.5，每支之間 `sleep 1000ms`（避免 rate limit）
- [ ] 進度顯示：`[3/25] youtube-xxx-ai` + 成功 / 失敗計數
- [ ] 跳過已 enriched（除非 `--force`）
- [ ] 失敗不中斷：單支失敗寫入錯誤 log，繼續下一支
- [ ] 結束時印統計：`✓ 22 成功 / ✗ 3 失敗（見 logs/wiki-enrich-YYYY-MM-DD.log）`
- [ ] **同時套用上面 Q1 + Q2 + Q3 三條 prompt 修正**

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

## 完成後請做

1. commit + push
2. 更新本 handoff 加「Code 回報」區塊，貼：
   - 批次完成統計（成功 / 失敗 / 總 token / 總成本）
   - 3 支隨機抽樣的摘要品質確認
   - 失敗案例（若有）的錯誤訊息
3. Cowork 抽查品質後，再決定是否進 E3

---

## 跨專案影響檢查

| 檔案 | E2 影響 |
|------|--------|
| `scripts/wiki-enrich.cjs` | 擴充批次邏輯 |
| 所有 `src/content/wiki/sources/youtube-*.md` | frontmatter 追加 enrichment 欄位 |
| `src/content.config.ts` | 不動（E1 已完成） |
| `.env` | 不動 |
| `package.json` | 不動 |
| Worker / KV seed | 零影響（search 仍索引 concept，enriched source 不影響 KV） |

---

## 決策備忘

- **為何要 280-320 硬性字數**：YouTube 30 分鐘影片內容密度高，230 字會丟失重要脈絡；從 Paul 角度看 frontmatter 就能抓到影片精華，字數太少就失去 enrichment 的意義。
- **為何 matched 要收緊**：concept 網絡的價值在於「有意義的連接」，Haiku 放任列 5 個勉強命中 = 製造噪音。少而精準比多而雜亂好。
- **為何 slug 不一刀切**：技術術語有國際通用性用英文天經地義；但「循環經濟」這類在台灣語境的主題硬翻 `circular-economy-taiwan` 就失真了。按主題本質判斷。
- **為何堅持手動驗收**：25 支批次跑一次就污染整個 sources/ 目錄，沒實測過的正式寫檔風險不能省。
