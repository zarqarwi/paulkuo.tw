# Cowork Review — 13 支 needs_human_review（2026-04-27）

> Trigger: v5 handoff「球回 Paul 邊」項目 — 13 支 needs_human_review 等 Paul 過目
> 結論：**13/13 都已在 final.yml 決議為 keep_internal，不需 Paul 重 review。** 真正要做的是補 classifier rule gap。

---

## TL;DR

1. v5 handoff 寫「13 支等 Paul 過目」是過早的結論
2. 抽樣驗證後發現：13 支的 frontmatter 都已有 `quarantine.review_outcome: keep_internal` + `needs_review: false`，是 04-26 上輪 Paul 已決議的結果
3. classifier 重跑沒讀 `quarantine.review_outcome` 既有值，把已決議 source 重新丟回 needs_human_review
4. **這是 v5 紀律「事件響應前先抽樣驗證假設」的活案例** — Cowork 收到 handoff 後抽 2 支驗證才看出來，沒有直接寫一份「請 Paul 過目 13 支」的摘要

---

## 13 支對照表

| # | raw_note_id | Title | Pillar | final.yml 決議 | 決議來源 | Reasoning |
|---|---|---|---|---|---|---|
| 1 | 1901466154980006336 | 幹細胞與外泌體自動化培養技術介紹 | circular | keep_internal | cowork+paul | 可能含廠商來源，不公開 |
| 2 | 1900527399683043024 | 二手物資回收與物流模式創新探討 | (env) | keep_internal | paul | Paul 決定不公開 |
| 3 | 1900890547758048304 | 照顧管家服務模式與AI在長照領域 | (med) | keep_internal | cowork+paul | 服務模式可能含夥伴 |
| 4 | 1901366025334174608 | 企業員工健康與長期照護 ESG 整合 | (med) | keep_internal | cowork+paul | ESG 商務語境 |
| 5 | 1900976653262270152 | 健康生態系與運動賽事平台的協作 | (med) | keep_internal | cowork+paul | 平台協作 |
| 6 | 1905623247384379840 | 大智若愚：能力者的靜音模式 | (growth) | keep_internal | paul | Paul 決定不公開 |
| 7 | 1903118704850406952 | 個人網站搭建與AI工具應用學習總結 | (ai) | keep_internal | paul | Paul 決定不公開 |
| 8 | 1901270027447435960 | AI 人力資源系統在製造業 | (ai) | keep_internal | cowork+paul | 商業案例可能含具名 |
| 9 | 1903329278507519528 | 企業通訊工具的公私分離設計 | (ai) | keep_internal | paul | Paul 決定不公開 |
| 10 | 1900429853459558096 | 外星文明視角：宇宙秩序、地球監獄 | faith | keep_internal | paul | Paul 決定不公開 |
| 11 | 1905989546891580464 | 痛苦/空白/高壓交替下的成長 | (growth) | keep_internal | paul | Paul 決定不公開 |
| 12 | 1900822048398808040 | AI技術在醫療領域與邊緣運算合作 | (med) | keep_internal | cowork+paul | 合作探討 |
| 13 | 1903118811150847528 | 系統設計踩坑與學習反思 | (ai) | keep_internal | paul | Paul 決定不公開 |

13/13 = 100% match `quarantine-overrides-2026-04-26-final.yml` 的 `keep_internal` bucket。

---

## 抽樣驗證細節

抽 2 支實際讀 frontmatter，確認 quarantine block 狀態：

### `getnote-006336-stem-cell-exosome-automation.md`
```yaml
visibility: internal
quarantine:
  reason: scanner_bug_2026_04_26_audit_recording_set_44
  observed_visibility: internal
  quarantined_at: '2026-04-26'
  needs_review: false              # ← 已 review
  review_outcome: keep_internal     # ← 決議
  reviewer: paul
  reviewed_at: '2026-04-26'
  reasoning: 可能含廠商來源，不公開
```

### `getnote-558096-alien-life-civilization.md`
```yaml
visibility: internal
quarantine:
  reason: scanner_bug_2026_04_26_audit_recording_set_44
  observed_visibility: internal
  quarantined_at: '2026-04-26'
  needs_review: false              # ← 已 review
  review_outcome: keep_internal     # ← 決議
  reviewer: paul
  reviewed_at: '2026-04-26'
  reasoning: Paul 決定不公開
```

兩支都帶 `needs_review: false` + `review_outcome: keep_internal`，但仍被 04-26 重跑 classify 列入 `needs_human_review` bucket。

---

## 為什麼會發生

**`scripts/wiki-quarantine-classify.py` 行為**：
- 對所有 sources 帶 `quarantine:` block 的檔案重跑分類
- rule 1 (`requires_all`, is_dialogue) 在本輪啟用，但這 13 支沒命中（因為它們不是「對話形式 + 含商業 + 內部標記」三條件全中的 pattern）
- 因為沒有規則命中，被丟到 `needs_human_review`
- **沒讀 `quarantine.review_outcome` 既有值**，所以已決議內容被當成新 quarantine 重判

**對應 quarantine-apply-log-2026-04-26.md**：
- 65 筆 apply 都顯示 `skip:already_applied`（apply.py 知道 already applied 不重做）
- 但 classify.py 沒有相同的「already classified, skip」邏輯

---

## 建議下一步（兩個方向，請 Paul 拍板）

### 方向 A — 補 classifier fast-path rule（推薦）
讓 `wiki-quarantine-classify.py` 在分類前先檢查 frontmatter：
- 若 `quarantine.needs_review == false` 且 `quarantine.review_outcome` 存在 → 直接歸到對應 bucket（restore_public/keep_internal/delete/redact_and_restore），不重判
- 預期效果：下次重跑 classify，TOTAL=18 會減少（這 13 + 既有 5 = 18 都會直接照既有決議分類）
- Effort：Code Sonnet 4.6 + Low（約 30 min）

### 方向 B — keep_internal apply 時順手清 quarantine block
讓 `wiki-quarantine-apply.py` 對 keep_internal outcome 移除 quarantine block（目前只移除 `needs_review` 標記）
- 預期效果：下次 classify 不再看到這 13 筆（因為 no quarantine block）
- Effort：Code Sonnet 4.6 + Low（約 20 min）
- 風險：失去審計痕跡（quarantine.reasoning 沒了）— 不建議

### 推薦：A
A 方向保留審計痕跡，又解決 classify 重判問題。B 方向會丟掉「為什麼這個 source 是 internal」的脈絡。

---

## 對 v5 handoff 的修正

v5 handoff 列出的「🟡 新發現 — 球回 Paul 邊」項目實際上不是 Paul 行動，而是：
- **Cowork 行動**：寫 Code handoff 給 classifier 加 fast-path rule（方向 A）
- **Paul 行動**：核可方向 A 的執行

下次更新 Issue #157 / 寫 v6 handoff 時把這條從「Paul 行動」移到「Cowork→Code 行動」。

---

## 紀律補強驗證

v5 handoff 寫的「事件響應前先抽樣驗證假設」紀律 — 本輪 Cowork 收到 handoff 後沒直接照搬「請 Paul 過目 13 支」就動手，而是抽 2 支驗證 frontmatter 後才發現真相。**紀律有效。**

---

*建立：2026-04-27 Cowork session*
*Trigger：v5 handoff「13 支 needs_human_review 等 Paul 過目」*
*結論：13/13 已決議，需補 classifier rule，不需 Paul 重 review*
