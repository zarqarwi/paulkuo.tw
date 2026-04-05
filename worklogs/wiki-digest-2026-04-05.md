# Wiki 知識摘要 — 2026-04-05（首期）

> 本期範圍：Wiki 建立至今全部內容（Phase 0 初始化）
> 產出時間：2026-04-05

---

## 📊 本期總覽

- **新增頁面**：18 頁（source ×10 / concept ×7 / entity ×1 / topic ×0 / comparison ×0）
- **知識圖譜**：8 個節點、15 條連結（首期，無前期比較基線）
- **支柱分布**：ai ×12 / startup ×5 / life ×1 / circular ×0 / faith ×0
- **Visibility**：全部 public（18/18）
- **資料來源**：快刀青衣《AI 龍蝦十日談》10 篇（get_筆記 / 01_專欄文章）

---

## 🔥 熱門概念

| 概念 | source_count | confidence | 備註 |
|------|-------------|------------|------|
| AI Agent 經濟 | 10 | medium | 全系列核心主題，10/10 篇都提及 |
| AI 時代的能力發展 | 9 | medium | 幾乎每位嘉賓都從不同角度談到 |
| 人機協作 | 7 | medium | 跨產業共識度高 |
| 一人小隊 / 一人公司 | 5 | medium | startup 支柱的代表概念 |
| 企業 AI 導入 | 4 | medium | 偏實務面，與風險管理相關 |

---

## ⚡ 矛盾與爭議

- 目前所有來源皆出自同一系列（龍蝦十日談），觀點基調一致，**尚未發現明顯矛盾**
- 潛在張力：「一人小隊」的樂觀敘事 vs 尹會生提到的企業風險顧慮，但尚未構成正式矛盾

---

## 🔍 建議關注

**低 confidence 但有潛力的概念：**
- `ai-education`（AI 與教育）— source_count 僅 2，confidence: low，但與 skill-development、human-judgment 都有連結，若再加 1-2 篇來源就能升 medium

**孤兒頁面：**
- 目前 0 個孤兒頁面（stats.json 確認）

**接近建頁門檻的潛在新概念/人物：**
- 10 位嘉賓（張鵬、寧遼原、凱叔等）各只被 1 篇 source 提及，距離 entity 門檻（3 篇）還差 2 篇。若未來 ingest 其他系列有提到同一人，即可建獨立人物頁

---

## 📝 下一步建議

1. **擴充資料來源多樣性** — 目前 wiki 只有一個系列，概念的 confidence 天花板受限。建議優先 ingest 不同來源（例如 04_AI與科技/ 的其他筆記、Paul 自己的文章），讓交叉引用啟動
2. **Paul 的文章 ingest** — paulkuo.tw 已有的文章（如 formosa-esg-2026）可以 ingest 為 source，讓 circular / faith 支柱開始有內容
3. **觀察 ai-education** — 這是目前最弱但有連結基礎的概念，適合找 1-2 篇相關來源補強
4. **考慮建第一個 topic 頁** — 「AI Agent 經濟」相關的概念已形成群聚（agent-economy + one-person-team + human-ai-collaboration），可考慮建一個 topic 頁做綜合整理
5. **啟動 wiki-ingest-scanner 排程** — 讓系統自動偵測待 ingest 的筆記，減少手動盤點
