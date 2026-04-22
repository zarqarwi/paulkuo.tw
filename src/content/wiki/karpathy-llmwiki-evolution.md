# Karpathy LLM Wiki：世界的演化方向 vs 你的位置

> 建立：2026-04-22
> 用途：定期回顧，對照外部演化方向與 paulkuo.tw wiki 的定位
> 更新：每次外部有重大演化時補充

---

## 原版 Karpathy Pattern 核心概念

Karpathy 提出的 LLM Wiki 本質是「知識編譯器」，不是 RAG：

- 知識在 **ingest 時編譯**，不在 query 時重新推導
- 每篇 source 進來，系統整合進現有圖譜，標記交叉引用、矛盾點、溯源
- 產出是人類可讀的 markdown，透過 git 有版本歷史
- 三層架構：`raw/`（原始素材）→ `wiki/`（編譯知識）→ `schema`（規則）

---

## 世界對 v1 的三個核心批評

### 1. 知識會腐敗，但沒有生命週期

原版把所有內容當作「永遠有效」。生產環境上跑起來後發現：舊 fact 跟新 fact 並列，沒有信心分數、沒有時效機制，wiki 慢慢變成「可信度未知的雜訊倉庫」。

### 2. Index 撐不住規模

100-200 頁以內靠 `index.md` 還行，超過就爆了——index 本身太長，LLM 沒辦法一次讀完，搜尋能力斷掉。

### 3. 知識只有累積，沒有取代

舊說法 A、新說法 B 並排放，不知道誰對誰錯、誰取代誰。需要顯式的 **supersession 機制**。

---

## 世界目前的演化方向（2025-2026）

### 方向一：Hybrid 搜尋架構

BM25（關鍵字）+ vector（語意）+ graph traversal（關係），三層融合，用 Reciprocal Rank Fusion 合併結果。這是 2025-2026 生產系統主流。paulkuo.tw 的 KV + Worker API 架構已在這條路上。

### 方向二：記憶分層

```
raw observations（原始觀察）
    → episodic summaries（事件摘要）
        → semantic facts（語意事實）
            → procedural patterns（操作模式）
```

越往上層移動，evidence 要越充分。LLM Wiki v2 稱為 Memory Consolidation Tiers。

### 方向三：系統積累「判斷」，不只積累「知識」

Aaron Fulkerson 的生產版發現：在真正跑起來的系統裡，「知識」跟「判斷」的界線會消失。他的系統刻意捕捉 *operational patterns, relationship context, decision-making tendencies*，不只是事實。

**關鍵洞察**：*"The wiki layer accumulates judgment, not just knowledge."*

### 方向四：人機分工重新定義（已成共識）

> **Humans**: Curation, direction, schema evolution, final override on contradictions
> **LLMs**: Bookkeeping, entity extraction, ingest automation, quality scoring, crystallization

「人類定義結構，LLM 豐富連結」——這是 2025-2026 業界共識，也是 paulkuo.tw 的設計原則。

---

## 你的位置：世界還沒走到的那一步

世界做到了 L1（素材 + enrichment）和 L2（concept 關係圖）。**但你要做的是 L3——記錄 Paul 這個人怎麼被這些素材改變。**

> 「世界永遠只有一個 Paulkuo，我是獨一無二的存在。我要展現的不是我搬運知識的能力，而是我怎麼與世界共同演化的模樣。」— Paul, 2026-04-22

| 世界做到 | paulkuo.tw 需要但世界沒做 |
|---------|--------------------------|
| 素材 ingest + enrichment（L1）| **L3 演化層**：Paul 讀完之後想到什麼、連結了什麼 |
| Concept 關係圖（L2）| **文章←→素材溯源**：這篇心得文的脈絡來自哪幾個素材的碰撞 |
| 知識取代機制（supersession）| **觀點演化追蹤**：Paul 對某個主題的看法如何隨時間改變 |
| 系統積累「判斷」（Fulkerson）| **`paul_perspective` 欄位**：Paul 自己的視角，不是 LLM 整理的摘要 |

---

## paulkuo.tw Wiki 的三層架構

```
L1 素材層  src/content/wiki/sources/
           每篇 source：summary / key_points / quotes / chapters / concept_links
           → 這是「碰撞原料」

L2 概念層  src/content/wiki/concepts/
           每個 concept：定義 / 相關 sources / 相關 concepts / paul_perspective（占位）
           → 這是「碰撞場域」

L3 演化層  （未建，未來）
           Paul 的心得文 ← 溯源至哪些 sources 的碰撞
           Paul 對某概念的觀點演化記錄（git log 作為思想史）
           → 這是「碰撞產物」
```

**L3 是 Karpathy 沒有的。這是讓 wiki 真正屬於 Paul 的那一層。**

---

## 核心比較：Karpathy v1 vs paulkuo.tw 目標

| 維度 | Karpathy v1 | paulkuo.tw 目標 |
|------|-------------|----------------|
| 維護者 | LLM 全自動 | 人類定義框架，LLM 豐富連結 |
| 目的 | 知識搜尋與再利用 | 記錄 Paul 與世界共同演化的模樣 |
| 核心產出 | 可搜尋的知識圖譜 | 有 Paul 視角的心得文 + 溯源脈絡 |
| 個人聲音 | 無 | `paul_perspective` field + L3 演化層 |
| 素材來源 | 單一（文件） | 多源（YouTube + 得到筆記 + 網路 clip） |
| 碰撞機制 | 無 | 多源素材在 Paul 腦中碰撞 → 心得文 |

---

## 參考資料

- [Karpathy LLM Wiki 原版 gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [LLM Wiki v2 — extending with agentmemory lessons](https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2)
- [Karpathy's LLM Wiki Pattern in Production (Fulkerson)](https://aaronfulkerson.com/2026/04/12/karpathys-pattern-for-an-llm-wiki-in-production/)
- [Beyond RAG: How LLM Wiki Builds Knowledge That Compounds](https://levelup.gitconnected.com/beyond-rag-how-andrej-karpathys-llm-wiki-pattern-builds-knowledge-that-actually-compounds-31a08528665e)
