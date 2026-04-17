---
name: wiki-ingest
description: >
  paulkuo.tw LLM Wiki 知識管線的 ingest 工作流程。當 Paul 要求處理 get_筆記、ingest 新內容到 wiki/sources/、提取 concepts / entities、更新 graph.json 與 stats.json、或掃描 wiki-ingest-pending.md 時觸發。執行單篇或批次 ingest，並依 visibility 規則判定是否去識別化。關鍵觸發詞：ingest、wiki 批次、concept 提取、wiki 來源、visibility 分類、wiki 新增。
---

# Wiki Ingest Skill

> 觸發詞：wiki ingest、ingest 筆記、匯入 wiki、wiki 攝入、消化筆記、wiki 新增
> 相依：`src/content/wiki/CLAUDE.md`（Schema 完整規則在那裡）

---

## 這個 skill 做什麼

讀取一或多篇 raw source（get_筆記、PK 文章、Apple Notes、Web Clip），
將知識提取並編譯進 `src/content/wiki/`。

**核心原則：不動原檔，只讀取。所有產出寫入 wiki/ 目錄。**

---

## 操作前 Checklist

1. 確認 `src/content/wiki/CLAUDE.md` 存在且已讀取（Schema 規則）
2. 確認 `src/content/wiki/index.md` 存在（知道現有 wiki 有哪些頁面）
3. 確認 raw source 路徑可達
4. 確認 raw source 的 visibility（private → 跳過）

---

## 單篇 Ingest 流程

### Step 1：讀取與判斷

```
讀取 raw source markdown
  │
  ├─ visibility: private → 跳過，log.md 記錄，結束
  ├─ visibility: internal → 繼續，標記需去識別化
  └─ visibility: public / 無標記 → 繼續，按預設規則判定
```

如果 raw source 沒有 `visibility` frontmatter，依照 CLAUDE.md 的「Raw Source visibility 判定」表格決定。

### Step 2：產出 Source 摘要頁

在 `wiki/sources/` 建立摘要頁：

1. 產出 slug（見 CLAUDE.md 命名慣例）
2. 簡轉繁 + 台灣用語轉換
3. 撰寫 frontmatter（所有必填欄位 + raw_source_path + raw_source_type + raw_note_id）
4. 撰寫內容：
   - 原文摘要（3-5 句）
   - 關鍵概念（列出，標注哪些已有 wiki 頁、哪些待建）
   - 關鍵人物
   - 引用金句（1-3 句，繁體中文）
   - Ingest 備註

### Step 3：更新現有 Wiki 頁面

讀取 `index.md`，掃描哪些現有頁面跟這篇 source 有關：

- **概念頁命中**：在「來源引用」區加入這篇 source 的引用，更新 source_count，必要時修改摘要
- **人物頁命中**：在「來源引用」區加入引用
- **主題頁命中**：評估是否需要更新綜合觀點

每個更新都要同步更新 `updated` 日期和雙向連結。

### Step 4：評估是否新建頁面

對照 CLAUDE.md 的門檻：
- 概念被 2+ 篇 source 提及 → 建概念頁
- 人物被 3+ 篇 source 提及 → 建人物頁

未達門檻的概念/人物，在 source 摘要頁標記「待建」即可。

### Step 5：更新 Meta

- `index.md`：加入新頁面條目，更新統計
- `meta/graph.json`：新增節點（source + 新建的 concept/entity），新增邊
- `meta/stats.json`：更新數字
- `log.md`：append 本次操作紀錄

---

## 批次 Ingest 流程

處理多篇 raw source 時，調整順序以提高效率：

```
Phase A：全部 source 先做 Step 1-2
  → 產出所有 source 摘要頁
  → 建立「待更新清單」：哪些現有頁面被哪些新 source 引用

Phase B：統一做 Step 3-4
  → 一次性更新現有頁面（避免同一頁被改多次）
  → 統一評估新建頁面門檻（多篇 source 可能讓同一概念跨過門檻）

Phase C：一次性做 Step 5
  → meta 檔案只更新一次
  → log.md 記錄整批 ingest 摘要
```

每批建議 5-10 篇，太多容易出錯。

---

## 去識別化 Checklist（internal 素材）

ingest internal 素材時，逐條檢查產出內容：

- [ ] 無具體公司名稱
- [ ] 無具體人名
- [ ] 無職稱（可用「某企業主管」替代）
- [ ] 無金額數字（可用「投入可觀資源」替代）
- [ ] 無合約/商業條件細節
- [ ] 無可反推身份的日期+地點+人物組合
- [ ] 保留的是：概念、方法論、產業洞見、通用經驗

---

## Ingest 完成後

1. 向 Paul 報告摘要：
   - 處理了幾篇 source
   - 跳過了幾篇（private）
   - 新建了哪些 wiki 頁面
   - 更新了哪些現有頁面
   - 目前 wiki 總統計
2. 更新 worklog
3. 如果是跨 session 工作，觸發 session-handoff

---

## 常見情境

### 「ingest 龍蝦十日談」
1. 找到 get_筆記/notes/ 下所有標題含「龍蝦」或「十日談」的 markdown
2. 檢查 visibility（01_專欄文章 → public）
3. 批次 ingest
4. 預期產出：10 篇 source 摘要頁 + 若干概念頁 + 若干人物頁

### 「ingest 這篇 Apple Note」
1. 透過 Apple Notes MCP 讀取指定筆記
2. HTML → markdown 轉換
3. Paul 指定 visibility（Apple Notes 沒有自動規則）
4. 單篇 ingest

### 「把這篇 paulkuo.tw 文章也 ingest 進 wiki」
1. 讀取 src/content/articles/{slug}.md
2. visibility: public（文章本身就是公開的）
3. 單篇 ingest
4. 特別注意：文章是精修產物，source 摘要頁要標明「這是已發布的文章，不是原始素材」
