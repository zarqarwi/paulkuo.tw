# cowork--paulkuo-ai-collab-portfolio-dashboard-20260407.md

## 背景

Chat session 今天（2026-04-07）完成了 AI Collaboration Portfolio 的完整企劃，包含：
- 框架設計文件 v0.1（ai-collaboration-portfolio-framework.md）
- 文章骨架 v0.2（article-skeleton-v02.md）
- 英文白皮書 v2 定稿（beyond-man-days-v2.md，4,317 字）
- 三輪多模型辯論壓測結果（2 adversarial + 1 dialogue）
- Code handoff（工具 MVP spec）

Cowork 需要做以下事項：

## 任務 1：更新 Apple Notes 儀表板

在「🎛️ 專案狀態儀表板」新增 AI Collaboration Portfolio 專案區塊：

```
══════════════════════════════
AI Collaboration Portfolio（新專案）
══════════════════════════════
- 工具 URL: paulkuo.tw/tools/ai-collab-portfolio/
- 文章 slug: beyond-man-days（英文主版）
- 定位: AI 時代個人生產力的可驗證履歷系統

Phase 1 ✅ 企劃與論述
  - [x] 市場調查（6 框架盤點，確認無競品）
  - [x] 五維框架設計（Command/Delivery/Leverage/Quality/Influence）
  - [x] 三層證據架構設計（自動抓取/結構化自評/AI校驗）
  - [x] 三輪辯論壓測（2 adversarial + 1 dialogue）
  - [x] 英文白皮書 v2 定稿（4,317 字）
  - [x] Code handoff 交付（工具 MVP spec）

Phase 2 ⏳ 工具 MVP + 文章上線
  - [ ] Code 建置工具 MVP（五維表單 + 雷達圖 + 等級判定）
  - [ ] 工具部署到 /tools/ai-collab-portfolio/
  - [ ] 英文文章上線（走 writing pipeline，但不受六幕結構限制）
  - [ ] 中文版重寫（非翻譯，獨立版本）
  - [ ] Paul 自己的完整 Portfolio 案例上線

Phase 3 🟡 迭代
  - [ ] GitHub API 串接（自動抓取指標）
  - [ ] AI 預填（Claude Sonnet 分析 repo 後建議分數）
  - [ ] D1 儲存 + 可分享 URL
  - [ ] 社群推廣（X / Threads / LinkedIn）
```

## 任務 2：完成日誌寫入

在儀表板的「完成日誌」區塊插入：

```
- 04-07 22:00~00:00 AI Collaboration Portfolio 完整企劃 (Chat)
  - 市場調查 + 6 框架盤點
  - 五維框架 + 三層證據架構設計
  - 三輪多模型辯論壓測（NT$27 token 費用）
  - 英文白皮書 v2 定稿 4,317 字
  - Code/Cowork handoff 交付
```

## 任務 3：確認 Chat 產出檔案位置

Chat 今天產出的檔案列表（Paul 需要從 Claude 下載並放到適當位置）：

| 檔案 | 說明 | 建議存放位置 |
|------|------|-------------|
| ai-collaboration-portfolio-framework.md | 框架設計文件 v0.1 | ~/Desktop/01_專案進行中/paulkuo.tw/docs/ |
| article-skeleton-v02.md | 文章骨架 v0.2 | ~/Desktop/01_專案進行中/paulkuo.tw/docs/ |
| beyond-man-days-v2.md | 英文白皮書 v2 定稿 | ~/Desktop/01_專案進行中/paulkuo.tw/docs/ |
| code--paulkuo-ai-collab-portfolio-mvp-20260407.md | Code handoff | ~/Desktop/01_專案進行中/paulkuo.tw/ |

辯論結果已存在：
- ~/Desktop/02_參考資料/debates/ 底下三個辯論檔案

## 驗證方式

1. Apple Notes 儀表板已更新 → 確認新區塊存在
2. 完成日誌已寫入 → 確認 04-07 條目存在
3. 告知 Paul 下載 Chat 產出檔案

## 注意事項

- 這是新專案，儀表板裡原本沒有這個區塊，需要新增
- Phase 1 全部已完成（今天 Chat 做的）
- Phase 2 是接下來的工作，Code 正在啟動
- 不需要建 worklogs/（等 Code 開始做時再建）
