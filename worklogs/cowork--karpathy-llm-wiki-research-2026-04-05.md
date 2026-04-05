# Worklog 2026-04-05 — Karpathy LLM Wiki 研究與架構設計

## Session 類型
Cowork

## 完成日誌（最新在上）
- 21:xx 隱私分層設計（三級 visibility + 三道防線）寫入架構文件 Cowork
- 21:xx 多語系設計（四語路由 + 翻譯觸發條件 + Graph i18n）寫入架構文件 Cowork
- 20:xx 完成 LLM Wiki 完整架構設計文件（三層架構 + 五源匯流 + 四大操作 + 四 Phase 路線圖） Cowork
- 20:xx 探索 get_筆記 資料夾結構（272 篇 markdown、9 分類、6 課程系列） Cowork
- 20:xx 探索 paulkuo.tw 現有架構（五大支柱、TQEF、AI-Ready SEO、社群動態牆） Cowork
- 19:xx 透過 Chrome MCP 抓取 Karpathy LLM Wiki gist 完整內容 Cowork
- 19:xx 完成初步研究報告 Cowork

## 產出檔案
1. `research--karpathy-llm-wiki-integration-2026-04-05.md` — 初步研究報告
2. `architecture--paulkuo-llm-wiki-2026-04-05.md` — 完整架構設計文件，含：
   - 三層架構（Raw Sources → Wiki → Schema）
   - 五源匯流（get_筆記 + PK文章 + Apple Notes + 社群貼文 + Web Clipper）
   - 四大操作（Ingest / Query / Lint / Publish）
   - Wiki 頁面格式與目錄結構
   - 前端設計（/wiki/ 路由 + Graph View + 對話查詢）
   - 四 Phase 路線圖
   - 多語系設計（四語路由 + hreflang + 翻譯觸發門檻）
   - 隱私分層設計（public/internal/private 三級 + 三道防線）

## 關鍵決策（Paul 確認）
- Wiki 作為 paulkuo.tw 子區塊（/wiki/），不是獨立站
- 知識來源：全部都要（get_筆記 + PK文章 + Apple Notes + 社群 + Web Clipper）
- 互動模式：Graph View + 對話查詢都要
- 多語系：必須支援四語（zh-Hant / en / ja / zh-CN）
- 隱私：錄音會議等私密內容需三級 visibility 篩選

## 下一步（Phase 0）
- [ ] 在 get_筆記 專案下建立 wiki/ 目錄結構
- [ ] 撰寫 CLAUDE.md Schema（wiki 慣例 + ingest SOP + 語言規範 + 隱私規範）
- [ ] 建立 wiki-ingest skill
- [ ] 試跑：拿 AI龍蝦十日談 10 篇做第一批 ingest
- [ ] 驗證 wiki 品質，調整 Schema
- [ ] Phase 0 完成後回報

## 技術備忘
- get_筆記路徑：~/Desktop/01_專案進行中/get_筆記/（macOS user = apple）
- get_筆記 272 篇 markdown，原文簡體中文，wiki base 要轉繁體
- 建議 wiki 頁面用扁平結構加檔名前綴（跟現有文章系統一致）
- Graph View 用 D3.js force-directed，節點色彩對應五大支柱 accent color
- 翻譯觸發門檻：confidence high + source_count >= 3 + 7天沒改 + visibility public
