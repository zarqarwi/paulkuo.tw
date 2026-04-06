# Wiki 知識摘要 — 2026-04-06

> 基線：上期摘要 2026-04-05（18 頁 / 8 節點 / 15 連結）
> 本期範圍：2026-04-05 ~ 2026-04-06 全部變動
> 產出時間：2026-04-06（排程自動產出）

---

## 📊 本期總覽

- **頁面成長**：18 → 226（+208 頁），Phase 1 全部完成
  - source：+198（article 93 / getnote 98 / clip 7）
  - concept：+10（共 17 個）
  - entity：不變（1 個）
- **知識圖譜**：226 節點 / 436 連結（較上期 +218 節點 / +421 連結）
- **支柱覆蓋**：ai 105 / life 52 / startup 33 / circular 18 / faith 18 — 五柱全亮
- **Visibility**：public 162 / internal 64（private 全跳過）
- **前端上線**：Phase 2 + Phase 3 完成，/wiki/ 路由已可瀏覽

### 本期里程碑
1. get_筆記 8 個資料夾 ingest 完畢（01~09，private 跳過）
2. paulkuo.tw 93 篇文章反向連結寫入
3. Web Collector 首批 7 clips 收錄 + 排程上線
4. /wiki/ 前端：Graph View + 概念頁 + Entity 路由 + OG Image + wikilink 解析

---

## 🔥 熱門概念（source_count 前 5）

| 概念 | source_count | confidence | 較上期變化 |
|------|-------------|------------|-----------|
| AI Agent 經濟 | 35 | high | +25（文章反連大幅提升） |
| 人類在 AI 時代的判斷力 | 29 | high | +24（跨 pillar 引用最廣） |
| AI 時代的能力發展 | 24 | high | +15 |
| 人機協作 | 22 | high | +15 |
| 企業 AI 導入 | 16 | high | +12 |

**觀察**：文章 ingest 讓所有概念的 source_count 都跳升一個量級。human-judgment-in-ai-era 被 23 篇文章引用，成為跨 pillar 連結最密的概念。

---

## ⚡ 矛盾與爭議

- **尚無正式矛盾**，但張力點逐漸浮現：
  - 「一人小隊」樂觀 vs 企業 AI 導入的風險顧慮（尹會生觀點）
  - 「穩態生存陷阱」鼓勵突破 vs 「約束：先尊重再行動」的審慎取向
- Web Collector 開始引入外部觀點（教宗 AI 文告、美國勞工部框架），未來有機會產生真正的跨文化矛盾

---

## 🔍 建議關注

**低 confidence 但有潛力：**
- `agentic-web`（4 sources, low）— 被 Claude Agent SDK clip 直接命中，再 1 篇好素材就能升 medium
- `regenerative-medicine`（3 sources, internal）— 唯一沒有 article backlink 的概念，較孤立

**孤兒風險：**
- `ai-medical-biotech`（source_count=1 from articles）— 雖有 7 internal sources，public 引用極少

**接近建頁門檻的潛在新概念：**
- **Token 經濟學**（黃仁勳）— 至少 2 篇 source 提及，但尚未獨立建頁
- **AI 安全與治理**（Hinton + SAFER 4 + 教宗文告）— 跨 3 篇以上，可考慮建 concept

**待審 Web Clips（04-06 新增 8 篇）：**
- Claude Agent SDK（⭐5, ai）、教宗 AI 文告（⭐5, faith）、美國 AI 素養框架（⭐5, life）
- Paul 確認後即可觸發 ingest

---

## 📝 下一步建議

1. **審核 04-06 Web Clips**（8 篇待審，其中 3 篇五星推薦），確認後說「ingest clips」
2. **ingest-pending 清單仍有 ~254 篇**，建議優先處理：
   - 01_專欄文章剩餘 31 篇 public（快刀青衣新專欄 + 萬維鋼思維工具）
   - 04_AI與科技 34 篇 public（需逐一確認是否有錄音卡 tag）
3. **考慮建立新概念頁**：`ai-governance`（AI 治理）素材已足夠
4. **git push origin main** 部署 Phase 2+3 前端，讓 /wiki/ 正式上線
5. **Phase 2+3 線上驗證**：Graph View hover、entity 頁、wikilink、OG image 分享測試
