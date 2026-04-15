# Wiki Web Collector — 2026-04-15 待審清單

## 搜尋摘要
- 搜尋 query 數：10（每個 pillar 2 條，依日期輪轉）
- 搜尋結果總數：~100（每條約 10 筆）
- 通過篩選：9
- 已存 clips：9
- WebFetch 狀態：全數 egress blocked，clips 以搜尋摘要存檔（fetch_status: search_summary_only）

## 待審內容（按 relevance 排序）

### ⭐⭐⭐⭐⭐ 高度推薦

- [Claude Managed Agents: how Anthropic's AI agents work](https://anthemcreation.com/en/artificial-intelligence/claude-managed-agents-anthropic-ai/) — ai
  - clip: `2026-04-15-anthropic-claude-managed-agents-beta.md` | relevance: 5
  - Anthropic 4/8 推出 Claude Managed Agents public beta — 全托管的 agent 基礎設施，開發者只帶 skill/system prompt，orchestration 由 Anthropic 處理。
  - 建議連結到：[[ai-agent-economy]]、[[one-person-team]]、[[build-for-models]]

### ⭐⭐⭐⭐ 值得收錄

- [What's Next in AI: Five Trends to Watch in 2026](https://blog.bytebytego.com/p/whats-next-in-ai-five-trends-to-watch) — ai
  - clip: `2026-04-15-bytebytego-five-ai-trends-2026.md` | relevance: 4
  - ByteByteGo 2026 五大趨勢，核心是「工具 → agent」典範轉移。
  - 建議連結到：[[ai-agent-economy]]、[[build-for-models]]

- [Claude Agents SDK vs. OpenAI Agents SDK vs. Google ADK](https://composio.dev/content/claude-agents-sdk-vs-openai-agents-sdk-vs-google-adk) — ai
  - clip: `2026-04-15-composio-claude-openai-google-adk-comparison.md` | relevance: 4
  - 三大 agent SDK 的並排比較，顯示業界已收斂到共同 primitives（tools、context、sub-agents）。
  - 建議連結到：[[ai-skill-methodology]]、[[build-for-models]]

- [Corporate carbon footprint: what to expect in 2026](https://climateseed.com/blog/corporate-carbon-footprint-what-you-need-to-know) — circular
  - clip: `2026-04-15-climateseed-corporate-carbon-footprint-2026.md` | relevance: 4
  - 2026 碳盤查從選擇題變必答題，CBAM、CSRD、NY SB 9072A 三條法規時程。
  - 建議連結到：[[circular-economy-practice]]、[[enterprise-ai-adoption]]

- [Taiwan's Semiconductor Sustainability and Global Implications](https://newlinesinstitute.org/tech-econ-sov-sec/taiwans-semiconductor-sustainability-and-global-implications/) — circular
  - clip: `2026-04-15-newlines-taiwan-semiconductor-sustainability.md` | relevance: 4
  - 把台灣半導體永續框架成「供應鏈國安問題」而非 ESG 合規題，補強地緣政治視角。
  - 建議連結到：[[circular-economy-practice]]、[[enterprise-ai-adoption]]

- [Let communication be conducted by real human beings, not AI, pope says](https://www.usccb.org/news/2026/let-communication-be-conducted-real-human-beings-not-ai-pope-says) — faith
  - clip: `2026-04-15-usccb-pope-leo-real-humans-not-ai.md` | relevance: 4
  - 教宗：AI 生成內容必須清楚標示，區隔人類創作。媒體倫理層面的教義表態。
  - 建議連結到：[[narrative-power]]、[[human-judgment-in-ai-era]]

- [Pope Leo XIV tells priests not to use AI to write homilies or seek likes on TikTok](https://catholicreview.org/pope-leo-xiv-tells-priests-not-to-use-ai-to-write-homilies-or-seek-likes-on-tiktok/) — faith
  - clip: `2026-04-15-catholic-review-pope-leo-no-ai-homilies.md` | relevance: 4
  - 教宗直接對神父發話：講道不要用 AI，TikTok 不要追讚數。理由是「AI 無法分享信仰」。
  - 建議連結到：[[human-judgment-in-ai-era]]、[[narrative-power]]

- [How does a fat-tail distribution impact career choice](https://www.researchgate.net/post/How_does_a_fat-tail_distribution_impact_career_choice_in_a_way_different_from_a_bell-curve) — startup
  - clip: `2026-04-15-researchgate-fat-tail-career-choice.md` | relevance: 4
  - 把職涯選擇框架成 fat-tail 問題 — 不是拉平均，而是最大化探索以逼近 tail。
  - 建議連結到：[[heavy-tail-distribution]]、[[one-person-team]]

- [How Trauma Triggers Survival Mode Symptoms](https://pasadenavilla.com/resources/blog/how-trauma-triggers-survival-mode-symptoms-tips-to-get-unstuck/) — life
  - clip: `2026-04-15-pasadena-villa-trauma-survival-mode.md` | relevance: 4
  - 把「survival mode」從生活模式問題改寫成神經系統狀態，補齊 steady-state-survival-trap 的臨床視角。
  - 建議連結到：[[steady-state-survival-trap]]、[[emotional-self-awareness]]

## 本日搜尋 Query

依日期輪轉（day-of-year 105 mod query count）選取：

- ai：`build for AI models web 2026`、`Claude Anthropic agent SDK 2026`
- circular：`ESG carbon footprint tracking 2026`、`Taiwan semiconductor sustainability 2026`
- faith：`faith technology ethics 2026`、`Pope Leo XIV AI statement 2026`
- startup：`narrative power brand building 2026`、`heavy tail distribution career strategy`
- life：`emotional self-awareness learning 2026`、`steady state survival trap breaking out`

## 跳過的結果（主要類型）

- **duplicate**：已存在於 sources/ 或 clips/ 的內容，例如 Freshfields 7 ESG trends、Pulp Strategy narrative architecture、Monigle 2026 trends、Marketing Dive retailers、Baylor Symposium、Calvin University Wisdom conference、Deseret News Can AI understand faith、Vatican 60th Communications Day、ARC Pope Leo's AI Moment、Lisa D Foster emotional self-awareness at work、Jan Michelfeit heavy tails altruism（已有 EA Forum 版）等
- **low_relevance**：純新聞聚合或 listicle（top 10 AI models、Wikipedia 定義、Wolfram 文件、daytrading.com）
- **irrelevant**：關鍵字歧義造成的遊戲攻略結果（State of Survival 的 "Influencer Trap"）
- **product_promo**：AWS Sustainability console 產品宣傳、SEMICON Taiwan 活動頁

## 操作建議

Paul 確認後，在 Cowork 說「ingest clips/ 裡的 X 篇」即可觸發 wiki ingest。

本批建議優先 ingest：
1. `2026-04-15-anthropic-claude-managed-agents-beta.md`（★★★★★，4/8 新產品 beta）
2. `2026-04-15-newlines-taiwan-semiconductor-sustainability.md`（地緣政治新角度）
3. `2026-04-15-catholic-review-pope-leo-no-ai-homilies.md`（人類判斷 vs AI 的清楚案例）

其餘 6 篇可整批 ingest 或視 concept 頁更新需求挑選。
