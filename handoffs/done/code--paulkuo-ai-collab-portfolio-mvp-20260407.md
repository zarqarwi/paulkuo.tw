# code--paulkuo-ai-collab-portfolio-mvp-20260407.md

## 背景

Chat session 今天（2026-04-07）完成了 AI Collaboration Portfolio 的完整企劃：
- 市場調查（6 個現有框架盤點，確認無直接競品）
- 五維框架設計（Command/Delivery/Leverage/Quality/Influence）
- 三層證據架構（自動抓取/結構化自評/AI 校驗）
- 三輪多模型辯論壓測（2 輪 adversarial + 1 輪 dialogue）
- 英文白皮書 v2 定稿（4,317 字）

現在需要 Code 建置工具 MVP，部署到 paulkuo.tw/tools/ai-collab-portfolio/。
文章和工具要同步上線，文章結尾有工具連結。

## 第一版範圍（MVP）

**做：**
- 五維評估表單（使用者輸入）
- 雷達圖視覺化（五維 + 總分 + 等級判定）
- 可分享的結果頁面
- 權重滑桿（default 25/25/20/15/15，使用者可調）
- 英文介面優先

**不做（Phase 2+）：**
- GitHub API 串接（自動抓取）
- AI 預填（Claude Sonnet 分析）
- D1 儲存
- 可分享 URL（靜態連結）

## 技術選型

- **前端：** Astro page + React component（與 Builder's Scorecard 同架構）
- **路徑：** `src/pages/tools/ai-collab-portfolio/index.astro`
- **元件：** `src/components/tools/AICollabPortfolio.jsx`（或 .tsx）
- **風格：** 參考 Builder's Scorecard 的設計語言，但配色用深藍/電光藍（AI pillar 色系）

## 五維定義與評分邏輯

### 維度

| 維度 | Default 權重 | 說明 |
|------|-------------|------|
| Command | 25% | 指揮 AI 做對的事的能力 |
| Delivery | 25% | AI 協作後的實際產出 |
| Leverage | 20% | 認知投入的放大倍率 |
| Quality | 15% | 產出品質的可驗證程度 |
| Influence | 15% | 方法被他人學習/採用的程度 |

### 各維度子指標（表單欄位）

**Command（4 題）：**
1. 你建立了多少可複用的 AI workflow / skill / system prompt？ → 數字輸入
2. 你維護幾條自動化管線（CI/CD, cron, GitHub Actions）？ → 數字輸入
3. 你同時使用幾種 AI 模型/工具？ → 數字輸入
4. 你的任務拆解複雜度？ → 單選（Simple prompts / Multi-step chains / Multi-session orchestration / Full architecture with SOPs）

**Delivery（4 題）：**
1. 過去 6 個月的 code commits 數量？ → 數字輸入
2. 你目前部署並運營中的服務/工具數量？ → 數字輸入
3. 你發布了多少篇內容（文章/影片/文件）？ → 數字輸入
4. 你從零到上線完成了幾個完整專案？ → 數字輸入

**Leverage（4 題）：**
1. 你目前同時維護幾個活躍專案？ → 數字輸入
2. 你的工作量相當於傳統幾人團隊？ → 單選（1-2 / 3-5 / 5-8 / 8+）
3. 你的自動化覆蓋率？ → 單選（Manual mostly / Some automation / Heavily automated / Fully pipelined）
4. 估算依據？ → 單選（Industry benchmark / Past experience / Third-party quote / Self-estimate）

**Quality（4 題）：**
1. 你的服務/工具有多少活躍使用者？ → 數字輸入
2. 你有幾套品質控制機制（自動測試/CI/CD/查核 SOP）？ → 數字輸入
3. 你的系統 uptime 等級？ → 單選（No monitoring / Basic / 99%+ / 99.9%+）
4. 你的產出是否有外部引用/分享？ → 單選（None / Occasional / Regular / Widely cited）

**Influence（4 題）：**
1. 你的開源專案總共有多少 GitHub stars？ → 數字輸入
2. 你的教學/分享內容觸及多少人？ → 數字輸入
3. 你的 skill / 模板 / workflow 被多少人採用？ → 數字輸入
4. 你的方法論被外部引用的頻率？ → 單選（Never / Rarely / Sometimes / Frequently）

### 評分公式

每個維度 0-100 分。數字輸入用分段映射（例：commits 0-10 → 20分, 11-50 → 40分, 51-200 → 60分, 201-500 → 80分, 500+ → 100分）。單選用固定分值映射。

四題取平均 = 維度分數。

總分 = Σ（維度分數 × 權重）

### 等級判定

| 總分 | 等級 | 英文 | Emoji |
|------|------|------|-------|
| 0-20 | Explorer | Just getting started | 🌱 |
| 21-40 | Practitioner | Building with AI consistently | 🔧 |
| 41-60 | Builder | Shipping AI-powered projects | ⚡ |
| 61-80 | Architect | Operating at team-scale solo | 🏗️ |
| 81-100 | Orchestrator | Full AI-native production | 🚀 |

## UI 結構

```
┌─────────────────────────────────────┐
│ AI Collaboration Portfolio          │
│ Measure what you build, not what    │
│ you know.                           │
├─────────────────────────────────────┤
│                                     │
│ [五維表單，每維度一個 accordion]      │
│  ├─ Command (4 questions)           │
│  ├─ Delivery (4 questions)          │
│  ├─ Leverage (4 questions)          │
│  ├─ Quality (4 questions)           │
│  └─ Influence (4 questions)         │
│                                     │
│ [Weight Adjustment] ← 滑桿 UI      │
│                                     │
│ [Calculate] ← 主按鈕               │
│                                     │
├─────────────────────────────────────┤
│ RESULTS                             │
│                                     │
│ [五維雷達圖]     [總分 + 等級 badge] │
│                                     │
│ [各維度分數條]                       │
│  Command:   ████████░░ 78           │
│  Delivery:  ██████████ 92           │
│  Leverage:  ███████░░░ 65           │
│  Quality:   ██████░░░░ 58           │
│  Influence: ███░░░░░░░ 32           │
│                                     │
│ [Share] [Try Again]                 │
└─────────────────────────────────────┘
```

## Step 0 偵察

Code 開始前先做：
1. `ls src/pages/tools/` — 確認現有工具頁面結構
2. `ls src/components/tools/` — 確認現有元件結構
3. 看 Builder's Scorecard 的實作方式（頁面 + 元件 + 樣式）
4. 確認 Astro + React 的整合方式（client:load directive）

## 驗證方式

1. 本機 `npm run dev` → 訪問 `/tools/ai-collab-portfolio/` 確認頁面載入
2. 填完 20 題表單 → 點 Calculate → 確認雷達圖 + 分數 + 等級正確顯示
3. 調整權重滑桿 → 確認總分即時更新
4. 手機響應式確認

## 注意事項

- paulkuo.tw repo 路徑：`~/Desktop/01_專案進行中/paulkuo.tw`
- cron 每 10 分鐘 stash/pop，commit+push 必須用 `&&` 串聯
- 不要動 BaseLayout.astro 或其他共用元件
- 配色用 AI pillar 色系：深藍 #1a1a3e + 電光藍 #4A90D9 + 霓虹紫 #8B5CF6
- 英文介面，不需要多語言

## 回報格式

完成後寫入 `worklogs/worklog-{date}.md`：
```
## 完成日誌
- {HH:MM} AI Collab Portfolio MVP 頁面建置完成 ({commit hash}) Code

## 待 Paul 執行
- [ ] 確認 /tools/ai-collab-portfolio/ 頁面正常 → 驗證: curl https://paulkuo.tw/tools/ai-collab-portfolio/ 確認 200
- [ ] 視覺審查（雷達圖、配色、RWD）→ 驗證: 問 Paul

## 技術備忘
- {任何踩坑紀錄}
```
