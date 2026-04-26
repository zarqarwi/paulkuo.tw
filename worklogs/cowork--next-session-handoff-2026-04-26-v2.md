# Cowork Session Handoff — 2026-04-26 → 下次

承接 2026-04-26 上輪 + 本輪 Cowork 全部工作。本輪閉環 A（wrong_pillar 9 支）+ B（Sensitivity Detector 兩輪修補），下輪可以接 C / D / 衍生 ToDo。

---

## 開場必讀

1. **這份 handoff**
2. **[Issue #157 儀表板](https://github.com/zarqarwi/paulkuo.tw/issues/157)** — 看最新 corpus + 待辦狀態
3. **memory：** `feedback_handoff_flow_discipline`（怎麼控制 handoff 流向，避免預先寫下個 handoff）+ `feedback_wrong_pillar_three_buckets`（enrichment 的三桶分類）

---

## Corpus 現況（2026-04-26 12:30 收尾）

| 指標 | 數量 |
|------|------|
| Sources | 298（280 public 全 safe / 18 internal） |
| Concepts | 38 |
| Entities | 1 |
| Blocklist | 13 |
| Sensitivity 治理 | ✅ detector 兩輪修補 + 13 fixtures |

---

## 04-26 全部已完成（請勿重做）

### A. wrong_pillar 9 支
- Cowork 裁決 9 支（5 支動作 + 5 keep+wait）→ handoff `7bfe59c`
- Code 執行 → commit `9659e80`
- 重要 finding：enrichment 邏輯洞 — `matched=[]` 一律自動加 `wrong_pillar_suspected`，沒區分 wrong_pillar vs concept_gap（已加進中期 ToDo）

### B. Sensitivity Detector（兩輪修補）
- B 第一步 dry-run 發現 280 public 命中 18 支 FP
- 兩輪 Code 修補：`40a9a10` / `1d1ac14` / `fd3c108` / `ea9f463`
- 結果：280 public **全 safe / 0 FP**，不必執行 backfill
- detector 留作 ingest pipeline pre-write check

---

## 還沒做的（依優先順序）

| 任務 | 性質 | 工作量 | 第一步建議 |
|------|------|------|----------|
| **C - Dialogue marker 機制** | 純工程設計（卡 Phase 2 Rule auto-match）| Cowork design 30 min + Code 60-90 min | Cowork 寫 design doc 給 Paul 選方案 A/B/C |
| **YouTube blocklist 擴充** | 純工程（避免 #8 被 ingest 撈回）| Cowork design 15 min + Code 30 min | Cowork 讀 `wiki-youtube-ingest.cjs` |
| **Enrichment 邏輯改良** | 純工程（修 wrong_pillar vs concept_gap 混淆）| Cowork design 20 min + Code 45 min | Cowork 讀 `wiki-enrich.cjs` |
| **D - paul_perspective 38 concepts** | Paul 寫，Cowork 輔助 | 不確定（依深度）| Cowork 列清單給 Paul 挑 5-10 個 |
| keep+wait 5 支 re-enrich | 阻塞中（等 concept 庫補完 faith/life/社會學）| — | 不做，等 |

---

## 第一步建議（不要一次抓太大）

開場暖機**只挑一件事**：
- 推薦 **C（Dialogue marker design）** — 純工程，不卡 Paul，可閉環
- 次推薦 **YouTube blocklist 擴充** — 工作量最小，30min 內可寫完 Code handoff
- 不推薦：D（paul_perspective）— 依賴 Paul 寫作心情，不是純工程

---

## 怎麼寫 handoff 給 Code（從本輪實戰學到的）

### handoff 必備 9 段
```
1. 上下文（為什麼做、root cause）
2. 修改範圍（Task 1/2/3 + 程式碼片段）
3. Tests fixtures 設計
4. Dry-run 驗收腳本
5. 拆 commits 建議
6. ★ 完成後回報（明列要回報哪些指標：commit hash、變動數字、tests 通過數、命中分布等）
7. 跨專案影響檢查
8. 護欄（常踩的雷）
9. 建議模型 + Effort（如 Sonnet 4.6 / Effort Low (30-40 min)）
```

第 6 段「完成後回報」是 Paul 04-26 確認過的格式，**必須**有。讓 Code 回報能直接餵回 Cowork。

### 寫完 handoff 的紀律（重要）

- **Cowork → Code handoff push 完就停**，不要預先寫「下個 Cowork session handoff」
- 等 Code 跑完回報才進下一步
- 三種 handoff 流向要分清楚（見 memory `feedback_handoff_flow_discipline`）：
  1. Cowork → Code：寫完停下來等回報
  2. Code → Cowork：等回報後接手整理
  3. Cowork → 下個 Cowork：**只在 session 真的結束時才寫**（這份就是）

### Code 行為觀察（兩輪實測）

| 觀察 | 怎麼處理 |
|------|---------|
| Code 對白名單類擴充很積極（兩輪都自行加大）| 結果通常更乾淨，handoff 不必為了「擋擴張」加細節護欄 |
| Code 偶爾會跳過 tests（上輪 round 1）| handoff 把 tests 標為 must-have，第二輪有補上 |
| Code 看不到 round 2 handoff 時自己 rebuild context | 是 sandbox 沒 sync 問題，Code 自我修正完成度 OK |
| Code 主動加 Cursor 進白名單 | 過程中發現 + 解決 FP，這類 in-flight 決策值得鼓勵 |

要點：handoff 把 **目標 + 驗收條件**講清楚比細節護欄更有效。

---

## 給下個 Cowork 的具體 do/don't

### Do
- 開場讀 Issue #157 確認最新狀態（防止跟別 session 衝突）
- 抽樣驗證 Code 回報（按 memory `feedback_verify_assumption_before_incident_handoff`）
- handoff push 完才停，並更新 Issue body / 留 comment
- 每個 task 拆獨立 commit，方便回溯

### Don't
- 不要連續貼舊 Code 回報誤導時間軸（本輪 Paul 貼錯兩次，要區分 round 1 vs round 2）
- 不要預先寫下個 Cowork handoff（除非 session 真的結束）
- 不要假設 detector / scanner 改動沒副作用 — 至少跑一次 spot-check + 看 commit message

---

## 跨 session 工具地圖

| 用途 | 工具 |
|------|------|
| 看 GitHub repo / Issue / commits | `mcp__github__*`（已 deferred 載入過 list_commits / get_issue / update_issue / add_issue_comment / create_or_update_file / search_code）|
| sandbox bash + git pull paulkuo.tw repo | clone 到 `/tmp/wiki-clone/` 跑 dry-run / spot-check |
| 寫本機 workspace 摘要 | `Write` 到 `/Users/apple/Desktop/01_專案進行中/paulkuo.tw/Paukuo網站/` |
| handoff 雙寫 | filesystem 寫本機 + GitHub MCP push 到 `worklogs/` |

---

## 本輪 commits 索引（時間序）

```
2fdd571  04-26 早 4 則 ingest
b0931a4  scanner bug fix
4534ace  65 筆 quarantine audit
2a65a22~af4b858  4 Tier 治理 + Handoff A/B
083ad1b  Phase 2 final overrides yml
6fb9d16  cowork-to-cowork handoff（這份的前一版）
7bfe59c  wrong_pillar handoff
97892641  B sensitivity handoff（被 round 2 取代）
9659e80  ✅ Code 跑 wrong_pillar 9 支
cccbb660  B detector handoff round 1 初版
94a15cbd  B detector handoff round 1 update（含白名單）
40a9a10  ✅ Code 跑 round 1 detector 修補
6dde3eb  B detector handoff round 2
1d1ac14  ✅ Code 跑 round 2 主修補
fd3c108  ✅ Code 跑 round 2 tests
ea9f463  ✅ Code 跑 round 2 補完（regex {3,} + 移除合作對象）
```

---

*建立：2026-04-26 由本輪 Cowork session 結束時產出*
*取代：worklogs/cowork--next-session-B-sensitivity-2026-04-26.md（B 已完成，那份過期）*
