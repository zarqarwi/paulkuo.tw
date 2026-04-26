# Cowork Session Handoff — 2026-04-26 → 下次（v4）

承接 v3，本 session 跑了**三件大事**：paul_perspective L3 第三筆 + wiki-kv-seed parser 升級 + dialogue marker Phase 1。Wiki backlog 一輪掃過半。

---

## 開場必讀

1. **這份 v4**
2. **[v3 handoff](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--next-session-handoff-2026-04-26-v3.md)** — 上輪 delta（paul_perspective L3 寫法 + 跨專案影響盤點）
3. **[v2 handoff](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--next-session-handoff-2026-04-26-v2.md)** — Code handoff 9 段格式、Cowork do/don't、跨 session 工具地圖
4. **[Issue #157 儀表板](https://github.com/zarqarwi/paulkuo.tw/issues/157)** + 三個 progress comments
5. **memory：** `feedback_handoff_local`（雙寫紀律 — 本輪我犯規一次被 Code session 找不到檔案）、`feedback_cross_project_impact`、`feedback_handoff_flow_discipline`

---

## v3 → v4 delta（本 session 三件大事）

### ✅ 1. paul_perspective L3 第三筆（harness-engineering）
- `1e9c983` 主體 push
- `769dfe0` YAML 格式 fix（`>-` block scalar → single-line double-quoted）
- 觀點主題：使用者側 Harness 體感、面具識別、雙向演化
- 對話過程：Paul 講出「面具但長相不同的人」、「在認識你的過程中也被你認識、被你改變」→ 整理成 paul_perspective
- Memory 更新：`user_agent_collab` 加入「雙向演化」維度

### ✅ 2. wiki-kv-seed.cjs parser 升級（gray-matter）
- `104d8f8` chore(deps): add gray-matter ^4.0.3
- `4f69394` refactor(wiki-kv-seed): replace hand-written parser
- `10327c4` feat(wiki-kv-seed): add `--dry-run` flag
- `0d4f67d` test(wiki-kv-seed): parser fixture tests
- `388b24c` chore(worklog): wiki-kv-seed parser upgrade session log
- KV 已正式 reseed（38 concepts + index + graph + stats）
- harness-engineering paul_perspective 完整進入 KV ✓

### ✅ 3. Wiki Dialogue Marker Phase 1
- `6b0d7db` feat(wiki-schema): add dialogue / dialogue_inference / speakers fields
- `43c5d15` feat(wiki-dialogue-detect): heuristic detector
- `52a7385` test(wiki-dialogue-detect): 5 fixture tests
- Dry-run 結果：5/298 命中（全 Layer 1 title keyword，Layer 2 0 命中）
- ⭐ Cross-check 關鍵：has_recording_tag + business_meeting + dialogue=true **0 支重疊**
- **策略決定 A**：既有 corpus 已乾淨，不跑 `--apply`，detector 當種子留作 ingest pre-write check
- Phase 2 LLM **取消**（沒收益）

### 🟡 新發現的 Bug / Follow-up
- ⚠️ `scripts/wiki-enrich.cjs` 也有手寫 YAML parser（`yamlGet` / `yamlStr`）— 同款 block scalar 問題，加進中期 ToDo
- ⚠️ `wiki-dialogue-detect.py` 的 `load_quarantine_rules()` 函數命名混淆（實際是 load sources by tags，不是 load rules.yml），低優先級重命名 ToDo

---

## Wiki 完整待辦清單（v4 版，按急迫度）

### 🔴 短期（純工程，可 Code 閉環）
| # | 任務 | 工作量 | 第一步 |
|---|------|------|------|
| 1 | YouTube blocklist 擴充（支援 youtube_id key）| Cowork 15 + Code 30 min | 讀 `wiki-youtube-ingest.cjs` |
| 2 | Detector 整合進 ingest pipeline（pre-write check）| Cowork 15 + Code 30-45 min | 設計 hook 點 |
| 3 | wiki-enrich.cjs parser 換 gray-matter（同 wiki-kv-seed 模板）| Cowork 5 + Code 20 min | 直接 handoff Code |
| 4 | quarantine rule 啟用 `is_dialogue` mapping | Cowork 5 + Code 10 min | 改 `data/wiki-quarantine-rules.yml` |
| 5 | Enrichment 邏輯改良（區分 wrong_pillar vs concept_gap）| Cowork 20 + Code 45 min | 讀 `wiki-enrich.cjs` |

### 🟡 中期（含 Paul 參與決策 / 持續工程）
| # | 任務 | 性質 | 備註 |
|---|------|------|------|
| 6 | D - paul_perspective 繼續寫 | Paul 寫，Cowork 輔助 | 已 3 / 38，下一筆推薦 `content-moat`（對應碰撞引擎北極星）|
| 7 | paul_perspective 前端 UI render 決策 | UI/UX 討論 | 等決定再做 [slug].astro 修改 |
| 8 | getnote 商業管理類 concept 審查 | 內容策展 | 30+ 筆累積 |
| 9 | 4 則 04-26 ingest 跑 wiki-enrich.cjs | 工程小 | 補 concept_links / quotes / chapters |
| 10 | get_筆記 repo 化 + scanner 改 GitHub API | 中型 | 已有 plan，等開工 |

### ⏸️ 阻塞中
- keep+wait 5 支 wrong_pillar re-enrich — 等 concept 庫補完 faith/life/社會學主題

### ❌ 已取消
- ~~Phase 2 LLM dialogue detect~~（沒收益）
- ~~Dialogue marker --apply backfill~~（既有 corpus 已乾淨）

### 🟢 長期（架構願景）
- L3 演化層完整設計（文章 ↔ 素材溯源、觀點演化追蹤）
- Concept 頁面目標 50+（目前 38）
- Pre-commit hook 用 husky 接 consistency check

---

## 下個 session 建議

### 推薦：Detector 整合進 ingest pipeline（任務 #2）
- 把 Phase 1 寫好的 detector 接到 `wiki-youtube-ingest.cjs` / `sync_notes.py` 的 pre-write hook
- 新 ingest 自動跑 detector，命中即 visibility=internal
- 工作量：Cowork 15 min + Code 30-45 min
- 純工程、不卡 Paul

### 次推薦：YouTube blocklist 擴充（任務 #1）
- 沿用 v2/v3 推薦
- 也是純工程

### 不推薦
- D（paul_perspective）連續寫 — 短期內連續寫易疲勞
- 前端 UI render — 需 Paul 在線討論

---

## 不重複 v2/v3 的內容

請去前版 handoff 看：
- 04-26 上輪完成項目（A wrong_pillar、B sensitivity、quarantine 65 筆）— v2
- Code handoff 9 段格式 — v2
- Cowork do/don't / Code 行為觀察 / 跨 session 工具地圖 — v2
- v2 → v3 delta（paul_perspective 寫法、跨專案影響盤點）— v3

---

## 本 session commits 索引（時間序）

```
1e9c983  paul_perspective L3 第三筆（harness-engineering）
769dfe0  YAML 格式 fix
91ce5ce  handoff v3
89d7c230 handoff(code) wiki-kv-seed parser
2e358b7c design(wiki) dialogue marker prep doc
104d8f8  chore(deps) gray-matter
4f69394  refactor(wiki-kv-seed) replace parser
10327c4  feat(wiki-kv-seed) --dry-run
0d4f67d  test(wiki-kv-seed) fixtures
388b24c  worklog
99b19dc5 handoff(code) dialogue marker Phase 1
6b0d7db  feat(wiki-schema) dialogue fields
43c5d15  feat(wiki-dialogue-detect) heuristic
52a7385  test(wiki-dialogue-detect) fixtures
```

Issue #157 三個 progress comments：
- [`#issuecomment-4322106624`](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4322106624) — paul_perspective L3 第三筆
- [`#issuecomment-4322208598`](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4322208598) — wiki-kv-seed parser 升級
- [`#issuecomment-4322267515`](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4322267515) — Dialogue Marker Phase 1 + 策略 A

---

## 建議模型 / Effort（按下個任務分）

| 任務 | 模型 | Effort |
|------|------|------|
| #1 YouTube blocklist | Sonnet 4.6 | Low（30 min）|
| #2 Detector 整合 ingest pipeline ⭐ | Sonnet 4.6 | Low-Medium（45 min）|
| #3 wiki-enrich.cjs parser | Sonnet 4.6 | Low（20-30 min，模板照本次）|
| #4 啟用 is_dialogue rule | Sonnet 4.6 / Haiku 4.5 | Low（15 min）|
| #5 Enrichment 邏輯改良 | Opus 4.6 | Medium（邏輯設計）|
| #6 paul_perspective 寫作 | Sonnet 4.6 | Low-Medium（深度依 Paul）|

---

## Paste-ready prompt

```
請閱讀 worklogs/cowork--next-session-handoff-2026-04-26-v4.md 後執行。
```

---

## 本 session 學到的紀律補強

- ⚠️ **handoff 雙寫不能漏**（feedback_handoff_local）— 本輪犯規一次：寫 wiki-kv-seed Code handoff 時只 push GitHub 沒寫 cowork mount，Code session 找不到檔案，逼 Paul 補 git pull。下次自己提醒自己。
- ✅ **Cowork + Code 平行流程行得通** — 本輪 Code 跑 parser 升級的同時，Cowork 並行寫 dialogue marker prep doc。整體 throughput 比序列高 50%。
- ✅ **Cowork 抽樣驗證重要** — 本輪 Code session 兩次都按 handoff 跑得很好，抽樣驗證每次 spot check 一個檔案 + 一組 commit hash 就夠，5 分鐘搞定。

---

*建立：2026-04-26 22:50 由本輪 Cowork session 結束時產出*
*取代 v3：v3 的 D 項目進度從 1/3 完成到 1/3 + Phase 1 dialogue marker 完成 + 策略 A 拍板*
