---
name: paulkuo-writing
description: "Writing standard and quality control for paulkuo.tw articles. Use this skill whenever Paul asks to write, rewrite, edit, improve, audit, or fact-check articles for paulkuo.tw. Also trigger when working with markdown files in the zarqarwi/paulkuo.tw repository under src/content/articles/, when discussing article frontmatter fields, when upgrading articles from draft/rough to finished quality, or when Paul mentions 寫作腳本, 六幕結構, 文章改寫, 半成品, 毛坯, FM補齊, or content pillar articles. Do NOT trigger for social media posts, Apple Notes drafts, or general conversation."
---

# paulkuo.tw 寫作規格

Paul Kuo 的個人網站文章寫作標準。從 19 篇已完成文章逆向萃取，對應 Cowork 端的 paulkuo-writing skill。

## Frontmatter 規格（17 欄位，全部必填）

### 人類讀者欄位（12 項）

```yaml
title: "文章標題"
subtitle: "一句話立場宣言（不是摘要）"
description: "SEO 用，2-3 句概述"
abstract: |
  3-5 句。包含核心論點 + Paul 為什麼寫這篇 + 讀者能得到什麼。
date: 2025-01-01          # 首發日期
updated: 2026-02-28       # 最近修改日期
pillar: ai                # ai / life / faith / startup / circular-economy
tags:
  - 關鍵詞1               # 3-5 個
  - 關鍵詞2
cover: "/images/covers/{slug}.jpg"
featured: false
draft: false
readingTime: 5            # 預估閱讀分鐘數（整數）
```

### AI/Machine 欄位（5 項，放在註解後）

```yaml
# === AI / Machine 專用欄位 ===
thesis: "一句話核心主張（可獨立引用的濃縮版）"
domain_bridge: "領域A × 領域B × 領域C"
confidence: high           # high / medium / low
content_type: essay        # essay / analysis / case-study / reflection
related_entities:
  - name: 某人或概念
    type: Person           # Person / Concept / Organization / Framework
reading_context: |
  描述適合什麼樣的讀者。
```

## 內容結構：六幕敘事

用 `##` 標題分段，通常 5-8 段。不用明寫幕次，但邏輯要依序：

1. **開場鉤子**（無標題，直接進）：具體場景、數字、對話、或個人經驗。絕對不寫「本文探討⋯」。
2. **張力建立**：揭露矛盾或反直覺的事實。
3. **展開分析**：2-3 段深入探討，帶入外部知識 + Paul 的跨域視角。
4. **Paul 經驗接入**：個人經歷、SDTI/CircleFlow、創業經驗、神學訓練——至少一處明確的 Paul 聲音。
5. **觀點收斂**：回到 thesis，但比開頭更深一層。
6. **結尾**：不是摘要。是一個餘韻——問題、畫面、或行動呼籲。短。

## Paul 的聲音特徵

### 語氣規則
- 口語化但不隨便。像跟聰明朋友在咖啡廳聊深度話題。
- 禁用：「首先、其次、最後」「值得注意的是」「鑑於此」。
- 台灣用語：影片、軟體、網路、品質、想法（不用大陸用詞）。
- 可以有情緒，但克制。不煽情。

### 思維特色
- 跨域連結是招牌：AI × 神學、半導體 × 循環經濟、創業 × 文明觀察。
- 不怕表態，但表態有根據。
- 偏好結構性分析（「不是個人問題，是系統問題」）。
- 常用概念：能量主權、秩序、超級個體、結構性的罪。

### 開頭手法（從完成文章歸納）
- **場景法**：「一位人資朋友跟我吃飯時講了一件事⋯」
- **數字衝擊法**：「我看到一個數字，停下來了。」
- **假設情境法**：「你被任命為科技部長⋯」
- **結論先行法**：「12 天。23,000 行程式碼。一個不會寫程式的人⋯」

### 結尾手法
- **問題餘韻**：「金絲雀已經在哀鳴。但我們做了什麼改變？」
- **行動召喚**：「你只需要把『我不會』改成『我來試看看』的決定。」
- **意象收束**：「有趣，往往就是通往偉大的唯一方向。」

## 站內互連規則

- 用 Markdown 連結：`[文章名](/articles/slug)`
- 自然嵌入段落中，不另起「延伸閱讀」段落。
- 每篇至少嘗試連結 1 篇站內文章（同柱子優先，跨柱子更好）。

## 事實查核 SOP

### 觸發規則

| 情境 | 觸發 | 層級 |
|------|------|------|
| 新文章完稿 / 升級到 ✅完成 | ✅ | L1 + L2 |
| 舊文改寫（半成品/毛坯 → 完成） | ✅ | L1 + L2 |
| 既有完成文章的內容修訂 | ✅ | L2 only |
| 純 FM 補齊（不動正文） | ❌ | — |
| 社群貼文（OneUp） | ⚠️ | 僅具體數據 |

### L1：素材查證（寫作前）

拿到素材/草稿/舊文要改寫時，先跑 L1。掃描所有事實宣稱，四欄格式輸出：

| 原文 | 問題 | 修正版 | 改了什麼 |
|------|------|--------|---------|

- 只列 `corrected` 和 `unverifiable`，正確的不列
- Paul 確認後才進改寫

### L2：成稿查證（推 GitHub 前）

文章完成後，推 GitHub 前跑 L2。產出查核報告：

| 宣稱 | 查核結果 | 信心度 | 建議 |
|------|---------|--------|------|

查核結果分類：
- `confirmed` — 通過，保留
- `corrected` — 有誤，已修正（附修正內容）
- `unverifiable` — 無可靠來源，建議移除或加模糊語
- `approximation` — 近似值，需標「約」或給範圍

Paul 確認後才推 GitHub。corrected/unverifiable 必須全部處理完。

### 查核範圍

**要查**：人名+頭銜、研究/論文引用、統計數字、因果宣稱、時間線、引述
**不查**：Paul 個人經驗和觀點、公認常識、比喻和修辭

### 查核方法

1. Claude 內建知識（常見事實）
2. Web Search（最新數據、論文、產品時間線）
3. 辯論引擎 + Perplexity（爭議性主題才動用）

### 批次查核策略

- featured 文章優先 > 高流量 > 其他
- 每次 session 3-5 篇
- confidence: high 快速過，medium/low 仔細查
- 同來源被多篇引用，查一次套用多篇

### 實戰教訓

- GitHub MCP 推 >8KB 檔案會截斷，改走本機 git CLI
- 修正要同步 4 語言版本（zh-tw/en/ja/zh-cn）
- abstract 和 description 也可能有錯誤數據，不只正文

### 發布前引用 Spot Check（L2 防線延伸）

L2 批次查核的經驗顯示，錯誤集中在「引用他人」的地方：
- 人名寫錯（薛丁格、沈旭暉）
- 歸因搞混（把 A 的觀點歸給 B）
- 數據不精確（比例、時間線）
- 術語誤用（hallucination 定義）

Paul 自己的觀點、經驗、分析框架從未出錯。

**規則：每篇文章推 GitHub 前，Claude 主動掃描所有引用外部來源的段落，逐條 spot check。** 不需要跑完整 L2 報告，但每個人名、數據、歸因、引述都要過一遍 web search。這比回頭掃舊文有效率得多。

## 品質檢查清單

推 GitHub 前逐項確認：

- [ ] FM 17 欄位齊全
- [ ] subtitle 是立場不是摘要
- [ ] abstract 有 Paul 為什麼寫的動機
- [ ] thesis 一句話可獨立引用
- [ ] domain_bridge 至少跨兩個領域
- [ ] 開頭前三行能抓住注意力（場景/數字/問題）
- [ ] 至少一處明確的 Paul 個人經驗
- [ ] 至少一處站內連結
- [ ] 結尾不是摘要重述，有餘韻
- [ ] 無大陸用語
- [ ] L1 素材查證已完成（Paul 已確認）
- [ ] L2 成稿查證已完成（corrected/unverifiable 全部處理）
- [ ] 引用外部來源 spot check（人名、數據、歸因、引述——逐條 web search 驗證）
- [ ] 4 語言版本同步（如有修正）

## 三級文章分類標準

| 級別 | 檔案大小 | FM 完整度 | 內容特徵 |
|------|---------|----------|---------|
| ✅完成 | >6KB | 17欄全有 | 六幕結構、Paul聲音、站內連結 |
| ⚠️半成品 | 3-6KB | 缺3+機器欄位 | 內容OK但缺結構或聲音 |
| ❌毛坯 | <3KB | 僅基本欄位 | 壓縮摘要，需從頭改寫 |

## 改寫工作流程

1. 讀取現有文章，對照本規格判斷缺什麼
2. **【L1 素材查證】** → 四欄格式 → Paul 確認
3. 補齊 FM 欄位（參照同柱子已完成文章的格式）
4. 改寫/補強內容，確保六幕結構 + Paul 聲音
5. **【L2 成稿查證】** → 查核報告 → Paul 確認
6. 跑品質檢查清單（含查核確認項 + 引用 spot check）
7. 給 Paul 確認後推 GitHub（一篇一推）
8. 多語言版本同步修正
