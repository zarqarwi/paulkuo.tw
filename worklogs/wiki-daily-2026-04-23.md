# Wiki 每日管線報告 2026-04-23

> 執行時間：2026-04-23 10:02 UTC+8
> 管線版本：wiki-daily-pipeline v1

---

## Step 1 — Web clips: 新增 11 則

| 標題 | Pillar |
|------|--------|
| In 2026, AI will move from hype to pragmatism | AI與科技 |
| Luma launches creative AI agents powered by its new Unified Intelligence models | AI與科技 |
| Are AI agents ready for the workplace? A new benchmark raises doubts | AI與科技 |
| Microsoft takes on AI rivals with three new foundational models | AI與科技 |
| ESG & Sustainability in 2026: Twists, Turns, and Trends | 循環經濟 |
| Five global sustainability shifts redefining corporate risk in 2026 | 循環經濟 |
| 2026 Sustainability Trends | 循環經濟 |
| 7 ESG trends to watch in 2026 | 循環經濟 |
| AI for Personal Knowledge Management: The End of Manual PKM | 個人知識管理 |
| We need re-learn what AI agent development tools are in 2026 | AI與科技 |
| Agentic Workflows for 2026 | AI與科技 |

**狀態：** ✅ 完成 — 已 commit 到 `wiki/raw/clips/2026-04-23/`

> ⚠️ 備註：`data/wiki-pillar-keywords.json` 不存在，本次使用推算 pillar 分類（AI與科技 / 循環經濟 / 個人知識管理）。建議 Paul 在下次 [WIKI] session 中建立此檔案。

---

## Step 2 — YouTube: 新增 0 支

**狀態：** ⏭️ 跳過 — Cloudflare KV 工具未在此環境連接，youtube-pending key 無法讀取。

> 明日重試清單：請在 [WIKI] Code session 中執行 `scripts/wiki-youtube-ingest.cjs`

---

## Step 3 — 待 ingest 筆記: 13 則

- get-biji-notes repo 已成功讀取（branch: master）
- 已 ingest sources：300 個檔案，其中 152 個 getnote 筆記
- 本次掃描新發現：**13 則**（public 6 則 / internal 7 則）

| Short ID | 資料夾 | Visibility | 標題 |
|----------|--------|------------|------|
| 769872 | 04_AI與科技 | 🟡 internal | AI Agent外部化与记忆智能的学术趋势及工程范式分析 |
| 868896 | 04_AI與科技 | 🟡 internal | AI工具无法消除社会阶层差异 |
| 601488 | 04_AI與科技 | 🟡 internal | OpenAI引发AI变革：智能体社交网络与Agent技术的发展 |
| 449232 | 04_AI與科技 | 🟢 public | AI时代顶尖程序员的价值与工作模式 |
| 196368 | 04_AI與科技 | 🟢 public | 18 撒谎：别跟底层代码作对 |
| 149520 | 04_AI與科技 | 🟢 public | 无免费午餐定理：诸行无常，有偏置才有决策 |
| 366608 | 04_AI與科技 | 🟢 public | 概率分布：到底什么是决策 |
| 711952 | 04_AI與科技 | 🟢 public | 问答：如何判断该深耕还是该挪位置 |
| 877840 | 03_環保循環經濟 | 🟢 public | 共鸣：高级生活的秘密 |
| 618200 | 06_個人成長與學習 | 🟡 internal | 01_找定位：怎样像创业一样规划个人IP |
| 267024 | 06_個人成長與學習 | 🟡 internal | 06_厨艺：那些厨房没有说出口的话 |
| 775200 | 06_個人成長與學習 | 🟡 internal | 2.正念练习的四个观照对象 |
| 204368 | 06_個人成長與學習 | 🟡 internal | 37丨重生：如何重建全新的自己 |

**狀態：** ✅ 完成 — 詳細清單已 commit 到 `worklogs/wiki-ingest-pending.md`

---

## Step 4 — 建議行動

1. **建立 `data/wiki-pillar-keywords.json`**：管線目前使用推算 pillar，建議正式化此設定檔。
2. **開 [WIKI] Cowork session 批次 ingest**：6 則 public 筆記可直接 ingest，預計 ~42 分鐘。
3. **確認 internal 7 則**：含 3 則錄音卡筆記需去識別化（AI Agent外部化、AI工具階層差異、OpenAI引発AI变革）。
4. **YouTube pipeline**：需在 Code session 中補執行 `scripts/wiki-youtube-ingest.cjs`。

---

## 明日重試清單

- YouTube ingest（KV 讀取需 Cloudflare MCP 連接）
- Brave search 因 rate limit 未搜索 Claude/Anthropic 最新消息，明日補搜

---

## [追加] Pipeline 漏洞補修 — 2026-04-23 下午

> 執行時間：2026-04-23（Code session handoff）
> 執行者：Claude Code

### 補修項目 1：stats.json 刷新

- **問題**：stats.json 停在 2026-04-16，total_pages=250，無任何 pipeline 步驟自動更新
- **修法**：新增 `scripts/wiki-stats-refresh.cjs`，掃 concepts/sources/entities 目錄 + graph.json，重新計算並寫回 stats.json
- **結果**：total_pages 250→339，concepts 26→38，sources 237→300，generated_at = ISO timestamp
- **commit** `0beedd5`

### 補修項目 2：pillar keywords 檔

- **問題**：`data/wiki-pillar-keywords.json` 不存在，pipeline 使用推算分類
- **修法**：從 300 支 source 的 frontmatter tags 反推高頻詞，人工篩選 13-15 個/pillar
- **結果**：`data/wiki-pillar-keywords.json` 建立，5 個 pillar 各有關鍵字清單
- **commit** `99d03ab`

### 補修項目 3：Issue #157 口徑修正

- **問題**：Issue body 寫「19（13 原有 + 6 新建）」但實際 38 concept 頁（KV seed 也是 38）
- **修法**：更新 Issue #157 body — Concept 頁 19→38，總計 320→339，已完成欄位同步，長期待辦同步
- **結果**：Issue #157 已更新，https://github.com/zarqarwi/paulkuo.tw/issues/157

### 補修項目 4：Stats refresh 接進 daily pipeline 設計

- **問題**：daily pipeline 沒有 stats refresh 步驟
- **修法**：在 `worklogs/2026-04-22-routine-runs-migration/wiki-schedule-merge-design-2026-04-22.md` 的 Prompt 草稿加入 Step 5（stats refresh）
- **決策原因**：pipeline 是 scheduled task prompt，不是 script，Step 5 定義本機與雲端兩種執行方式

### 踩坑

- `node` 環境沒有 `gray-matter`，改用 wiki-kv-seed.cjs 既有的 parseFrontmatter 邏輯
- `entities` → `type.replace(/s$/, '')` = `entitie`（BUG），改用 typeKey map 修復
