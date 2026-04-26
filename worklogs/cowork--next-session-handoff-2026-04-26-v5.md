# Cowork Session Handoff — 2026-04-26 → 下次（v5）

> 完整 handoff 已 push 到 GitHub repo：
> https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--next-session-handoff-2026-04-26-v5.md

承接 v4，本 session 跑了**一件大事**：dialogue detector 正式整合進 ingest pipeline（v4 任務 #2 + #4 連動完成）。Wiki backlog 又掃過一輪。

---

## 開場必讀

1. **這份 v5**
2. **[v4 handoff](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--next-session-handoff-2026-04-26-v4.md)** — 上輪 delta（paul_perspective L3 + wiki-kv-seed parser + dialogue marker Phase 1 + 策略 A 拍板）
3. **[v3 handoff](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--next-session-handoff-2026-04-26-v3.md)** — paul_perspective L3 寫法 + 跨專案影響盤點
4. **[v2 handoff](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--next-session-handoff-2026-04-26-v2.md)** — Code handoff 9 段格式、Cowork do/don't、跨 session 工具地圖
5. **[Issue #157 儀表板](https://github.com/zarqarwi/paulkuo.tw/issues/157)** + 四個 progress comments
6. **memory：** `feedback_handoff_local`（雙寫紀律）、`feedback_cross_project_impact`、`feedback_handoff_flow_discipline`

---

## v4 → v5 delta（本 session 一件大事 + 一個 bug fix）

### ✅ 1. Dialogue Detector 整合 ingest pipeline（v4 任務 #2 + #4 完成）

**Cowork 端**：寫完整 9 段 Code handoff、雙寫（本機 + GitHub push）、commit `175a692`

**Code 端**：執行 8 commits（`7d42a69` → `ca04c6f`）
- `7d42a69` refactor(wiki-dialogue): 抽 `wiki_dialogue_lib.py`（純函數模組，仿 `wiki_visibility.py` 風格）
- `62393ca` feat(wiki-pending-promote): 加 `inject_dialogue_fields` hook（idempotent）
- `b6281d7` feat(wiki-quarantine-classify): 啟用 `requires_all` 規則 1（從 stub 升級）
- `c55185b` test(wiki-dialogue): 三個測試檔，44 tests pass
- `c9b4d1a` docs(shared-file-impact-map): 登記 `wiki_dialogue_lib.py` 共用
- `94cc4d7` chore(classify-output): rule 1 啟用後重跑 classify

**架構決定**：hook 點選 `wiki-pending-promote.py`（不動 `youtube-ingest.cjs`、不跨 repo 動 `sync_notes.py`）。所有 ingest 來源在 sources_pending → sources/ 的 promote 階段補 dialogue 欄位，Quarantine rule 1 在 sources/ 階段判斷三條件命中，最少破壞面。

### ✅ 2. Bug fix（副作用發現）

`fb3b10c` fix(wiki-visibility): `has_recording_tag()` 收到字串 tag 會崩潰

- 起因：實際 source frontmatter 的 `tags` 是 string list（不是 v4 設計的 dict list），啟用 rule 1 後才暴露
- 之前一直被 stub `return False` 屏蔽
- 修法：加 `isinstance(tag, dict)` 防禦，字串 tag 自動回 False（是正確行為）
- 教訓：**stub 啟用前要先驗證實際資料形狀** — 寫進本輪紀律補強

### 📊 驗證結果（acceptance criteria 全通過）

| 檢查項 | 期望 | 實測 |
|------|------|------|
| `wiki-dialogue-detect.py --dry-run` | 5/298 分布不變 | ✅ |
| `wiki-pending-promote.py` idempotent | fm 已有 dialogue 跳過 | ✅ |
| `wiki-quarantine-classify.py` rule 1 命中 | 0 支（v3 預測） | ✅ delete bucket = 0 |
| `pytest tests/` | 44 tests pass | ✅ |
| `wiki-consistency-check.py` | pass | ✅ |

### 🟡 新發現 — 球回 Paul 邊

Classify 重跑後 `worklogs/incidents/quarantine-classification-2026-04-26.md` 的 `needs_human_review` bucket 有 **13 支** 等 Paul 過目，每筆要決定 outcome（restore_public / keep_internal / delete / redact_and_restore），更新 `quarantine-overrides-2026-04-26.yml`，再跑 `wiki-quarantine-apply.py`。

---

## Wiki 完整待辦清單（v5 版，按急迫度）

### 🔴 短期

| # | 任務 | 性質 | 第一步 |
|---|------|------|------|
| 1 | YouTube blocklist 擴充（支援 youtube_id key） | 純工程 Cowork 15 + Code 30 min | 讀 `wiki-youtube-ingest.cjs` |
| 2 | wiki-enrich.cjs parser 換 gray-matter（同 wiki-kv-seed 模板） | 純工程 Cowork 5 + Code 20 min | 直接 handoff Code |
| 3 | Enrichment 邏輯改良（區分 wrong_pillar vs concept_gap） | 邏輯設計 Cowork 20 + Code 45 min | 讀 `wiki-enrich.cjs` |
| 4 | **Paul review `needs_human_review` 13 支** | Paul 行動 | 讀 `worklogs/incidents/quarantine-classification-2026-04-26.md` |

### 🟡 中期（含 Paul 參與決策）

| # | 任務 | 性質 | 備註 |
|---|------|------|------|
| 5 | D - paul_perspective 繼續寫 | Paul 寫，Cowork 輔助 | 已 3 / 38，下一筆推薦 `content-moat` |
| 6 | paul_perspective 前端 UI render 決策 | UI/UX 討論 | 等決定再做 [slug].astro 修改 |
| 7 | getnote 商業管理類 concept 審查 | 內容策展 | 30+ 筆累積 |
| 8 | 4 則 04-26 ingest 跑 wiki-enrich.cjs | 工程小 | 補 concept_links / quotes / chapters |
| 9 | get_筆記 repo 化 + scanner 改 GitHub API | 中型 | 已有 plan，等開工 |

### ⏸️ 阻塞中
- keep+wait 5 支 wrong_pillar re-enrich — 等 concept 庫補完 faith/life/社會學主題

### ❌ 已完成（從 v4 移除）
- ~~v4 任務 #2 Detector 整合 ingest pipeline~~（本輪完成）
- ~~v4 任務 #4 啟用 is_dialogue rule~~（rule 1 啟用 + 0 支命中驗證）

### ❌ 已取消（v4 既有）
- ~~Phase 2 LLM dialogue detect~~（沒收益）
- ~~Dialogue marker --apply backfill~~（既有 corpus 已乾淨）

### 🟢 長期（架構願景）
- L3 演化層完整設計（文章 ↔ 素材溯源、觀點演化追蹤）
- Concept 頁面目標 50+（目前 38）
- Pre-commit hook 用 husky 接 consistency check

---

## 下個 session 建議

### 優先：Paul review 13 支 needs_human_review
- 不是 Cowork session 任務，是 Paul 自己過目決策
- Cowork 可協助：把 13 支 classify report 整理成易讀清單，附 title + 我的初判建議貼給 Paul

### 次推薦：#1 YouTube blocklist 擴充
- 純工程，沿用 v2/v3/v4 推薦
- Cowork 15 + Code 30 min，可平行 Paul review 13 支進行

### 也可考慮：#2 wiki-enrich.cjs parser 換 gray-matter
- v4 已點名「同 wiki-kv-seed 模板照抄」最省事
- 連帶解決 wiki-enrich 手寫 YAML parser 的 block scalar 風險

### 不推薦
- D（paul_perspective）連續寫 — 短期內連續寫易疲勞
- 前端 UI render — 需 Paul 在線討論

---

## 不重複 v2/v3/v4 的內容

請去前版 handoff 看：
- 04-26 上輪完成項目（A wrong_pillar、B sensitivity、quarantine 65 筆）— v2
- Code handoff 9 段格式 — v2
- Cowork do/don't / Code 行為觀察 / 跨 session 工具地圖 — v2
- v2 → v3 delta（paul_perspective 寫法、跨專案影響盤點）— v3
- v3 → v4 delta（paul_perspective L3 第三筆 + wiki-kv-seed parser 升級 + dialogue marker Phase 1 + 策略 A 拍板）— v4

---

## 本 session commits 索引（時間序）

```
175a692  handoff(code) wiki dialogue detector → ingest pipeline integration（Cowork 寫）
7d42a69  refactor(wiki-dialogue) extract detect logic to wiki_dialogue_lib.py
62393ca  feat(wiki-pending-promote) inject dialogue fields before promote
b6281d7  feat(wiki-quarantine-classify) enable requires_all rule (rule 1)
fb3b10c  fix(wiki-visibility) isinstance guard in has_recording_tag for string tags
c55185b  test(wiki-dialogue) unit tests for lib, promote injection, classify rule 1
c9b4d1a  docs(shared-file-impact-map) register wiki_dialogue_lib and wiki_visibility
94cc4d7  chore(classify-output) re-classify after enabling rule 1
ca04c6f  chore(worklog) detector-ingest integration session log
```

Issue #157 progress comment：
- [`#issuecomment-4322328677`](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4322328677) — Detector ingest 整合完成 + rule 1 啟用 + bug fix

---

## 建議模型 / Effort（按下個任務分）

| 任務 | 模型 | Effort |
|------|------|------|
| #1 YouTube blocklist | Sonnet 4.6 | Low（30 min） |
| #2 wiki-enrich.cjs parser | Sonnet 4.6 | Low（20-30 min，模板照 wiki-kv-seed） |
| #3 Enrichment 邏輯改良 | Opus 4.6 | Medium（邏輯設計） |
| #4 Paul review 13 支 | （Paul 行動）Cowork 輔助用 Sonnet/Haiku | Low（清單整理 10 min） |
| #5 paul_perspective 寫作 | Sonnet 4.6 | Low-Medium（深度依 Paul） |

---

## Paste-ready prompt

```
請閱讀 worklogs/cowork--next-session-handoff-2026-04-26-v5.md 後執行。
```

---

## 本 session 學到的紀律補強

- ✅ **stub 啟用前驗證輸入資料形狀** — Code session 啟用 quarantine rule 1（`requires_all`）前沒先 spot-check 實際 source frontmatter 的 `tags` 形狀，導致 string tag 觸發 `has_recording_tag` 崩潰。stub `return False` 屏蔽了既有 bug 至今。下次任何「stub → 實作」轉換，先 sample 1-2 筆生產資料確認輸入形狀。準備寫進 memory `feedback_stub_to_impl_check`
- ✅ **Cowork → Code → Cowork 閉環順** — Cowork 寫 handoff push、Code 執行 + push 回報、Cowork 收尾寫 v5 handoff。三段都守住雙寫紀律 + 跨專案影響盤點，沒有犯規。
- ✅ **9 段 handoff 格式經得起一輪實戰驗證** — Code session 全程沒問澄清問題就跑完，acceptance criteria + 跨專案影響表起到了作用。可以複製到 v4 任務 #1 / #2 用同樣模板。

---

*建立：2026-04-26 由本輪 Cowork session 結束時產出*
*取代 v4：v4 任務 #2 + #4 完成歸檔，新增 13 支 needs_human_review 等 Paul 行動，紀律補強加「stub 啟用前驗證輸入形狀」*
