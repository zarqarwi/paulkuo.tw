# CLAUDE.md — paulkuo.tw Wiki Schema

> Wiki 位置：`src/content/wiki/`
> 這份文件定義 LLM 維護 wiki 的所有規則。
> Code session 在 wiki 相關路徑工作時自動讀取。

---

## Wiki 定位

paulkuo.tw Wiki 是 Paul Kuo 的公開個人知識圖譜。
- Paul 是策展人（決定什麼進、什麼不進、什麼公開）
- LLM 是知識工程師（讀取 raw sources → 編譯成結構化 wiki 頁面）
- paulkuo.tw 是展場（wiki 內容在 /wiki/ 路由呈現）

---

## 目錄結構

```
src/content/wiki/
├── index.md                 ← 總索引（每次 ingest 後更新）
├── log.md                   ← 操作日誌（append-only）
├── overview.md              ← 全局概覽
├── concepts/                ← 概念頁
├── entities/                ← 人物/組織頁
├── topics/                  ← 主題摘要（跨多篇 source 的綜合）
├── sources/                 ← 每篇 raw source 的摘要頁
├── comparisons/             ← 比較分析
└── meta/
    ├── graph.json           ← 節點與連結（供前端 Graph View）
    ├── stats.json           ← wiki 統計
    └── pillar-mapping.json  ← wiki 頁面 → 五大支柱映射
```

---

## 頁面命名慣例

### Slug 格式

- 全小寫英文，單詞用 `-` 連接
- 概念頁：描述概念本身，如 `ai-agent-economy.md`
- 人物頁：`{姓}-{名}.md`，如 `karpathy-andrej.md`、`wan-weigang.md`
- 主題頁：描述主題，如 `llm-as-knowledge-worker.md`
- 來源頁：`{來源代號}-{note_id 後六碼或 slug}-{關鍵詞}.md`
  - get_筆記：`getnote-{id後六碼}-{關鍵詞}.md`，如 `getnote-519528-ai-lobster-intro.md`
  - PK 文章：`article-{slug}.md`，如 `article-formosa-esg-2026.md`
  - Apple Notes：`applenote-{關鍵詞}.md`
  - Web Clip：`clip-{關鍵詞}.md`
- 比較頁：`{A}-vs-{B}.md`，如 `rag-vs-llm-wiki.md`

### 檔名禁止

- 不用中文檔名
- 不用底線 `_`（統一用 `-`）
- 不用日期前綴（日期放 frontmatter）

---

## Frontmatter 規格

每個 wiki 頁面都必須有以下 frontmatter：

```yaml
---
title: "頁面標題（繁體中文）"
type: concept                    # concept | entity | topic | source | comparison
pillar: ai                       # ai | circular | faith | startup | life
visibility: public               # public | internal
created: 2026-04-05
updated: 2026-04-05
source_count: 0                  # 引用的 raw source 數量
confidence: low                  # low | medium | high
tags: []
links_to: []                     # 本頁主動連結的其他 wiki 頁 slug
linked_from: []                  # 連結到本頁的其他 wiki 頁 slug（反向連結）
---
```

### type 定義

| type | 用途 | 建立時機 |
|------|------|---------|
| concept | 一個可獨立解釋的概念 | 被 2+ 篇 source 提及的概念 |
| entity | 人物或組織 | 被 3+ 篇 source 提及的人物/組織 |
| topic | 跨多個概念的主題綜合 | Paul 指定，或 lint 發現概念群聚 |
| source | 單篇 raw source 的摘要 | 每次 ingest 自動建立 |
| comparison | 比較分析 | query 產出回存，或 Paul 指定 |

### confidence 判定

| 等級 | 條件 |
|------|------|
| low | source_count ≤ 1，或內容主要來自單一觀點 |
| medium | source_count 2-4，有交叉引用 |
| high | source_count ≥ 5，多角度驗證，Paul 審閱過 |

### pillar 判定

參考 `meta/pillar-mapping.json` 的 keywords。
一個頁面只標一個主要 pillar（選最相關的）。
如果跨多個支柱，在 tags 裡補充。

---

## 頁面內容格式

### 概念頁（concept）模板

```markdown
---
（frontmatter）
---

## 摘要
一到兩句話定義這個概念。用 Paul 的視角和語氣。

## 核心觀點
從 raw sources 編譯出的主要論點。
每個論點標明來源：「根據 [[source-slug]]，…」

## 來源引用
- [[getnote-519528-ai-lobster-intro]] — 摘要這篇怎麼提到這個概念
- [[article-formosa-esg-2026]] — 摘要引用

## 矛盾與爭議
不同來源之間的觀點衝突（如果有的話）。
不選邊站，並列呈現。沒有矛盾就寫「目前來源觀點一致」。

## 延伸連結
- → [[相關概念-slug]] 一句話說明關聯
- → [[相關人物-slug]] 一句話說明關聯
```

### 人物頁（entity）模板

```markdown
---
（frontmatter）
---

## 簡介
這個人是誰、為什麼出現在 Paul 的知識圖譜中。

## 核心觀點 / 代表作
這個人最常被引用的觀點或作品。

## 在 Paul 知識脈絡中的位置
Paul 的哪些思考受這個人影響、怎麼影響。

## 來源引用
- [[source-slug]] — 在哪裡提到這個人

## 延伸連結
- → [[concept-slug]] 相關概念
```

### 來源摘要頁（source）模板

```markdown
---
（frontmatter，type: source）
raw_source_path: "notes/04_AI與科技/xxx.md"  # 額外欄位：原始檔案路徑
raw_source_type: getnote                       # getnote | article | applenote | clip
raw_note_id: "1903329278507519528"             # get_筆記的 note_id（如適用）
---

## 原文摘要
3-5 句話概括這篇 raw source 的核心內容。

## 關鍵概念
- **概念名稱**：一句話解釋，→ [[concept-slug]]（如已有頁面）
- **概念名稱**：一句話解釋（如尚無頁面，標記待建）

## 關鍵人物
- **人名**：在本文的角色 → [[entity-slug]]

## 引用金句
挑出 1-3 句最有價值的原文（附繁體中文轉換）。

## Ingest 備註
- ingest 日期、操作者（session 類型）
- 如有去識別化處理，記錄在此
```

---

## 語言規範

### 總則

- Wiki 所有頁面的 base 語言是**繁體中文**（zh-Hant），使用台灣用語
- Raw source 不論原文語言，ingest 後一律轉為繁體中文
- 英文術語首次出現時附中文翻譯，之後可直接用英文
- 保留專有名詞不轉換（人名、產品名、技術術語原文）

### 簡體 → 繁體用語對照

| 簡體 | 繁體（台灣用語） |
|------|-----------------|
| 视频 | 影片 |
| 软件 | 軟體 |
| 服务器 | 伺服器 |
| 网络 | 網路 |
| 质量 | 品質 |
| 信息 | 資訊 |
| 数据 | 資料（一般）/ 數據（統計） |
| 人工智能 | 人工智慧 |
| 机器学习 | 機器學習 |
| 优化 | 最佳化 / 優化（視語境） |
| 项目 | 專案 |
| 内存 | 記憶體 |
| 程序 | 程式 |
| 文件 | 檔案（電腦）/ 文件（紙本） |
| 激活 | 啟用 |
| 默认 | 預設 |
| 交互 | 互動 |
| 用户 | 使用者 |
| 上传/下载 | 上傳/下載 |
| 链接 | 連結 |
| 博客 | 部落格 |
| 云 | 雲端 |

這不是窮舉清單。遇到對照表沒列的，用台灣人日常慣用的說法。

### 語氣

- 不要過度口語，也不要太學術
- 用 Paul 寫 paulkuo.tw 文章的風格：有觀點、有條理、帶一點個人色彩
- 避免「值得注意的是」「鑑於此」等生硬書面語
- 避免制式化的「首先、其次、最後」

---

## 隱私規範

### 三級 Visibility

| 等級 | 意義 | Ingest？ | 網站發布？ |
|------|------|---------|-----------|
| `public` | 可完全公開 | ✅ 完整 ingest | ✅ |
| `internal` | 知識可用，細節不公開 | ✅ 去識別化 | ❌ |
| `private` | 完全不進 wiki | ❌ | ❌ |

### Raw Source 的 visibility 判定

由 raw source 的 frontmatter `visibility` 欄位決定。如果沒有標記，預設規則：

| 來源資料夾 | 預設 visibility |
|-----------|----------------|
| 01_專欄文章/ | public |
| 03_環保循環經濟/（無錄音卡） | public |
| 04_AI與科技/（無錄音卡） | public |
| 02_醫療健康/ | internal |
| 04_AI與科技/（錄音卡筆記） | internal |
| 05_商務會議/（無錄音卡） | internal |
| 06_個人成長與學習/ | internal |
| 08_其他/ | internal |
| 05_商務會議/（錄音卡筆記） | private |
| 07_生活雜記/ | private |
| 09_會議錄音/ | private |

**保守原則：不確定的一律 internal。**

### 操作規範

#### private 素材
- 完全跳過。不讀取、不摘要、不引用
- 在 log.md 記錄「跳過 [{標題}]（private）」，不記錄內容

#### internal 素材
- 可以 ingest，但產出必須去識別化：
  - ❌ 不得出現：具體公司名、人名、職稱、金額、合約細節
  - ❌ 不得出現：會議日期+地點+參與者的組合（可被反推身份）
  - ✅ 可以提取：概念、方法論、產業洞見、技術觀點、通用經驗
- 範例：
  - 原文：「SDTI 佳龍科技的王總提到他們願意投入 500 萬做碳盤查」
  - wiki：「某傳統製造業者考慮投入資源進行碳盤查，顯示中小企業對 ESG 合規的意識提升」
- 產出的 wiki 頁面標記 `visibility: internal`

#### public 素材
- 正常 ingest，可引用原文、標明來源、建立連結
- 產出的 wiki 頁面標記 `visibility: public`

#### 混合情境
- 概念頁同時引用 public + internal 素材時：
  - 頁面本身可標 `visibility: public`（概念是公開的）
  - 來自 internal 素材的部分不標來源，只留概念
  - 來源引用列表只列 public 來源

---

## Ingest SOP（攝入新知）

### 觸發時機

- get_筆記同步新文章後
- Paul 指定特定 raw source 要 ingest
- paulkuo.tw 發新文章後
- 新增 web clip 後

### 操作流程

```
1. 讀取 raw source
   ├── 檢查 visibility → private? 跳過，記 log
   ├── 讀取全文
   └── 轉繁體中文 + 台灣用語

2. 產出 source 摘要頁
   ├── 存入 wiki/sources/{slug}.md
   ├── 填寫完整 frontmatter
   └── 提取關鍵概念、人物、金句

3. 掃描現有 wiki
   ├── 讀取 index.md 了解現有頁面
   ├── 找出需要更新的概念/人物/主題頁
   └── 找出需要新建的概念/人物頁

4. 更新 / 新建相關頁面
   ├── 既有頁面：新增引用、更新摘要、標記矛盾
   ├── 新頁面：用模板建立，至少 low confidence
   └── 更新雙向連結（links_to + linked_from）

5. 更新 meta 檔案
   ├── index.md — 加入新頁面條目
   ├── meta/graph.json — 新增節點和邊
   ├── meta/stats.json — 更新統計數字
   └── meta/pillar-mapping.json — 新頁面的支柱歸屬

6. 記錄 log
   └── log.md — append 本次 ingest 摘要
```

### 新建頁面的門檻

| 頁面類型 | 建立門檻 |
|---------|---------|
| source | 每篇 raw source 必建 |
| concept | 被 2+ 篇 source 提及（含當前 ingest） |
| entity | 被 3+ 篇 source 提及 |
| topic | Paul 指定，或 lint 發現概念群聚 |
| comparison | Paul 指定，或 query 產出回存 |

門檻未達時，在相關 source 頁面的「關鍵概念」區標記「待建頁面」，等累積到門檻再建。

### 批次 Ingest

處理多篇 raw source 時：
1. 先全部做 Step 1-2（產出所有 source 摘要頁）
2. 再統一做 Step 3-4（避免重複掃描 wiki）
3. 最後一次性做 Step 5-6（meta 更新 + log）

---

## 連結規則

### Wiki 內部連結

- 用 `[[slug]]` 語法：`[[ai-agent-economy]]`
- 連結指向同層或跨層都可以
- 每次建立連結，必須同時更新兩端的 frontmatter：
  - 來源頁的 `links_to` 加入目標 slug
  - 目標頁的 `linked_from` 加入來源 slug

### 與 paulkuo.tw 文章的連結

- Wiki 引用 PK 文章時用：`[文章標題](/articles/{slug}/)`
- 不用 wiki link 語法（因為文章不在 wiki 目錄內）

### 連結衛生

- 不建立沒有意義的連結（為連結而連結）
- 連結要有上下文：「根據 [[source]] 的觀點…」
- 每次 ingest 檢查有沒有斷裂連結（指向不存在的 slug）

---

## Graph View 資料格式

`meta/graph.json` 是前端 D3.js Graph View 的唯一資料源。

### 節點格式

```json
{
  "id": "ai-agent-economy",
  "type": "concept",
  "pillar": "ai",
  "visibility": "public",
  "weight": 5,
  "labels": {
    "zh-Hant": "AI Agent 經濟"
  }
}
```

- `weight` = source_count（被引用越多，節點越大）
- `labels` 目前只有 zh-Hant，Phase 4 加多語

### 邊格式

```json
{
  "source": "ai-agent-economy",
  "target": "karpathy-andrej",
  "type": "mentioned_by"
}
```

邊的 type：`related`（概念間）、`mentioned_by`（人物提出概念）、`derived_from`（source → concept）、`compared_with`（比較頁兩端）

---

## Lint SOP（知識健檢）

> Phase 0 不啟用。Phase 3 建立 wiki-lint skill 後使用。

### 檢查項目

1. **矛盾檢查**：不同頁面對同一件事的說法是否衝突
2. **時效檢查**：被新 source 推翻的舊說法
3. **孤兒頁面**：沒有任何 inbound link 的頁面
4. **缺失概念**：被多次提到但還沒有自己頁面的概念
5. **交叉引用**：應該連結但沒連的頁面
6. **隱私審計**：public 頁面是否不小心包含 internal 細節
7. **斷裂連結**：指向不存在 slug 的 wiki link

---

## Publish 規則

> Phase 0-1 不啟用。Phase 2 建前端時使用。

- 只有 `visibility: public` 的頁面才進 Astro build
- 只有 public 頁面才出現在 sitemap、llms-full.txt、graph.json 的公開版
- 翻譯觸發條件：visibility public + confidence high + source_count ≥ 3 + 7天內無重大修改 + type 為 concept 或 topic

---

## 自動化機制

### Scheduled Task: wiki-ingest-scanner

- 排程：每天早上 10:00
- 功能：掃描 get_筆記 notes/ 與 wiki/sources/ 的差集，產出待 ingest 清單
- 產出：`worklogs/wiki-ingest-pending.md`
- Paul 確認清單後，在 Cowork 說「ingest 清單上的 public 筆記」即可執行

### Web Clipper

- 原始檔案存放：`wiki/raw/clips/`
- 最快的方式：直接在 Cowork 貼網址說「把這篇 ingest 進 wiki」
- 也可以手動存 markdown 到 clips/ 再觸發 ingest
- 詳見 `wiki/raw/README.md`

### Web 自動蒐集（Phase 1）

> 目標：比照朋友的做法，排程自動搜尋特定關鍵字，將搜回的內容存入 `raw/clips/` 並觸發 ingest。

- 排程頻率：待定（建議每日或每週）
- 關鍵字來源：pillar-mapping.json 的 keywords + Paul 自訂的追蹤主題
- 流程：WebSearch → 篩選重複 → 存 markdown 至 `raw/clips/` → 自動觸發 ingest
- 注意：搜回的內容需過 relevance 門檻，避免灌入低品質雜訊
- Phase 1 先做半自動（搜完列清單讓 Paul 確認），穩定後轉全自動

### 知識摘要排程（Phase 1）

> 目標：每 2 天自動產出近期 wiki 新增內容的知識摘要，方便 Paul 掌握知識庫成長脈絡。

- 排程：每 2 天一次
- 產出位置：`worklogs/wiki-digest-{YYYY-MM-DD}.md`
- 摘要內容：
  - 新增的 source / concept / entity 頁面列表
  - 跨源交叉出現的熱門概念（本期新增 source 中被提及最多的 concept）
  - 新發現的矛盾或爭議觀點
  - 知識圖譜變化摘要（新增節點數 / 新增連結數）
  - 建議 Paul 關注的項目（低 confidence 但高引用的概念、孤兒頁面等）
- 格式：簡潔條列，控制在 1 頁以內，方便快速掃讀

---

## 跨 Session 協作

- 每次 wiki 操作都記錄在 `log.md`
- Ingest 結果寫入 `worklogs/` 的當日 worklog
- 大型 ingest（10+ 篇）建議拆成多個 session，每個 session 結束時更新 index.md
- session-handoff skill 適用於 wiki 操作
