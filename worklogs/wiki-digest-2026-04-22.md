# Wiki 知識摘要 — 2026-04-22

> 基線：上期摘要 2026-04-06（226 頁 / 17 concept / 436 連結）
> 本期範圍：2026-04-06 ~ 2026-04-22（16 天）
> 產出時間：2026-04-22（排程自動產出，wiki-knowledge-digest）
> 資料來源：`stats.json`（04-16 產出）+ `graph.json`（04-16 產出）+ `concepts/` 現況
> ⚠️ 注意：stats/graph 產出於 04-16，其後的 YouTube ingest + 概念尾巴未計入，文末會補說明

---

## 📊 本期總覽

- **頁面成長**：226 → 250（+24 頁，依 stats.json 04-16 版）
  - concept：17 → 26（**+9 個新概念**，主要 04-16 一次建立 6 個「第二波」）
  - source：208 → 237（+29，其中 article +0、getnote +32、clip +3）
  - entity：維持 1（快刀青衣）
- **知識圖譜**：226 → 254 節點 / 436 → 516 連結（+28 節點 / +80 連結）
- **支柱分布**：ai 21 / life 4 / circular 2 / startup 3 / faith 1（concept/entity）
- **Visibility**：public 169 / internal 69 / unknown 9（private 全跳過）
- **未計入 stats 的後續進度**：
  - YouTube 26 支 ingest 完成（04-16 ~ 04-19，含 14 支字幕已抓）
  - concepts/ 資料夾實際 32 個（stats 是 26，差的 6 個為 04-17 之後新增，下次 rescan 補）

### 本期里程碑
1. 🎉 第二波概念建立（04-16，一口氣 +6 個）：token-economics / software-disruption / gpu-economics / tacit-knowledge / harness-engineering / content-moat
2. 🎉 YouTube 管線上線：26 支 ingest、14 支字幕回填（commit 61e40e1 + be49a9a）
3. 🎉 Wiki Enrichment CLI E1 完成（commit 78973ad / 8ae0658），E2 放行條件開出
4. 🎉 ACP 三層證據 + v2 前端全部上線

---

## 🔥 熱門概念（圖譜 inbound 排名，Top 5）

| 概念 | inbound | pillar | 較上期變化 |
|------|--------|--------|-----------|
| human-judgment-in-ai-era | 72 | ai | +43（仍是跨 pillar 霸主） |
| skill-development | 65 | ai | +34 |
| human-ai-collaboration | 56 | ai | +30 |
| ai-agent-economy | 55 | ai | +15（+YouTube agentic 素材） |
| one-person-team | 47 | ai | +26（token-economics 放大） |

**觀察**：
- 「AI 時代的判斷力」持續拉大領先，成為跨 ai/life/startup 三柱的連結樞紐
- one-person-team 被新建的 token-economics / software-disruption 反覆 backlink，形成「成本結構 → 個體化」論述鏈
- enterprise-ai-adoption（41）開始追上 build-for-models（25），企業實務觀點加速進入圖譜

---

## ⚡ 矛盾與爭議

本期新發現的張力點：

- **AI 能力評測標準**：`ai-capabilities-benchmark` 新建後浮現——從「圖靈測試能被 AI 騙過嗎」到「愛因斯坦測試能做出原創突破嗎」，舊指標快速過期，評估安全閾值是否跟得上？與 `recursive-self-improvement` 形成緊張關係
- **Harness 工程 vs 隱性知識**：AI 編碼代理需要 harness 框架（前饋/反饋控制），但 `tacit-knowledge`（波蘭尼）提醒：人類最有價值的部分正是無法寫進 harness 的內穩態能力。兩者同時新建、互相 backlink，是本期最有張力的論述對
- **教宗文告 × AI 末日敘事**：`faith-technology-dialogue` 把教宗 Leo XIV「平衡觀點」和「2028 AI 大屠宰」劇本放進同一圖譜，宗教視角開始為 AI 治理提供非技術的評估維度

---

## 🔍 建議關注

**低 inbound 但剛建立的新概念（confidence 尚未穩固）：**
- `harness-engineering`（3）、`tacit-knowledge`（2）、`attention-time`（2）、`ai-capabilities-benchmark`（未進 graph）— 都是 04-16 一次建立，素材還沒反連進來，下批 ingest 要刻意補引用
- `ai-embodiment`（1）、`recursive-self-improvement`（1）、`degrowth-commons`（1）— 門檻剛達標，若下批沒補第 2 條引用會變孤點

**圖譜孤島風險：**
- `regenerative-medicine`（1 inbound）仍維持孤立，所有 source 都是 internal 醫療筆記，跨 pillar backlink 為零
- `content-moat`（startup）、`personal-knowledge-system`（ai）雖剛建立但還沒進 graph.json，下次 rescan 後要確認

**接近建頁門檻的潛在新概念：**
- **AI 治理（ai-governance）**：04-06 digest 已建議過，教宗文告 + SAFER 4 + Hinton 欺騙論 + 2028 劇本已累積 ≥5 篇，**強烈建議下批建頁**
- **認知解耦（cognitive-decoupling）**：`getnote-051360`、`-349784`、`-379272` 三篇同主題，可獨立建 concept
- **自我決定論（self-determination-theory）**：`getnote-008840`、`-027360`、`-113736` 三篇，life pillar 候補

**待審 Web Clips（04-06 ~ 04-22 累積）：**
- `wiki-web-pending-*` 每日排程累積 14 份清單未消化，建議一週一批掃
- `wiki-ingest-pending.md`（04-21 掃描）顯示還有 public 20 + internal 101 篇 getnote 待處理

---

## 📝 下一步建議

1. **先解 E2 批次 enrichment**（Code session 手上），批次跑 YouTube 24 支後 concept 引用會大幅增加，digest 指標會更準
2. **建立 `ai-governance` concept 頁**：素材熟透了，建完可把教宗／SAFER／Hinton 四條線收攏
3. **下次 rescan（`wiki_rescan.py` + KV seed）**：stats.json / graph.json 落後實際檔案系統 ~6 天，建議今天觸發一次完整 rescan 刷新指標
4. **Batch 3 ingest 排程**：`wiki-ingest-pending.md` 20 篇 public 可直接吃，這批吃完 Wiki 會跨 270 頁
5. **孤點補救**：找 1-2 篇 public source 同時 backlink 到 `regenerative-medicine` 和 `ai-medical-biotech`，把醫療 sub-cluster 接回主圖譜
6. **第三波 concept 策展**：04-16 建的 6 個新概念若到 05-01 仍無新引用，要考慮合併或降級（避免 confidence 虛胖）
