# 🎛️ 專案狀態儀表板
最後更新：2026-04-10 00:xx（Cowork — CI/CD 盤查 + governance-kv-seed bug 發現）

> **本 Issue 是 paulkuo.tw 專案的單一事實來源。**
> Code / Cowork session 完成工作後在此更新狀態。
> 請勿關閉此 Issue。
>
> 💡 **自動同步機制**：編輯 `worklogs/issue-155-body.md` 並 push 到 main，
> GitHub Action `sync-dashboard` 會自動 PATCH 到此 Issue。

---

## Cowork 專案架構

| # | Cowork 專案 | 綁定資料夾 | 儀表板 | Instructions |
|---|---|---|---|---|
| 1 | Paukuo網站 | paulkuo.tw | #155 總覽 | ✅ v2 |
| 2 | 白沙屯ESG繞境 | 白沙屯ESG繞境 | #155 Formosa | ✅ |
| 3 | LLM Wiki | paulkuo.tw | #157 專屬 | ✅ |
| 4 | AI 協作力評量 | paulkuo.tw | #155 ACP | ✅ |
| 5 | 讓 AI 懂我 | paulkuo.tw | #155 | ✅ 待貼入 Cowork Settings |
| 6 | 阿哥拉廣場｜即時會議記錄 | — (獨立) | #155 阿哥拉廣場 | ✅ |

> 跨專案影響地圖：`docs/shared-file-impact-map.md` ✅ (9d5ebc4)
> 跨 session 佇列：`worklogs/PENDING.md` ✅ (00970cd)
> 儀表板自動同步：`.github/workflows/sync-dashboard.yml`
> 專案治理框架：`worklogs/governance/` ✅ (5fd4ab3) | metrics 收集：`scripts/collect-session-metrics.sh` ✅ (ab39d2c)
> 治理 Dashboard：`https://paulkuo.tw/governance/` ✅ (e2fcd8f, b09d00c) | API：`/api/governance/*` | KV seed：`scripts/governance-kv-seed.cjs`

---

## 完成日誌（最新在上）
- 04-10 00:xx CI/CD 盤查：Build & Deploy #3494~#3498 連續失敗，根因 governance-kv-seed.cjs `--remote` 參數。Worker 部署成功，KV seed 失敗。已寫 PENDING.md handoff 給 Code Cowork
- 04-10 01:xx 治理框架 Phase 2 完成：governance API 4 endpoints + KV seed + Dashboard 頁面 /governance/ (ceb67d2, e2fcd8f, b09d00c) Cowork+Code
- 04-10 01:xx Phase 2.5 governance 自動化 + session-handoff v4.6 (7f65dd7, 42337d1, cd2422a) Code
- 04-10 00:xx 專案治理框架 Phase 1 完成：projects.json + automation-registry.json + metrics 收集腳本 + session-handoff v4.5 (5fd4ab3, ab39d2c) Cowork+Code
- 04-09 23:xx session-handoff v4.4 最終版 commit (4b44bf5, 996d205) Code
- 04-09 22:xx sync-dashboard GitHub Action 建立 + issue-155-body.md 初始化 Cowork
- 04-09 14:51 CLAUDE.md 新增跨子專案影響守則 + 狀態來源改為 Issue #155 (1ee2f88) Code
- 04-09 14:51 docs/shared-file-impact-map.md 新增最低驗證指令 (b21cf02) Code
- 04-09 14:51 worklogs/PENDING.md 建立跨 session 佇列 (00970cd) Code
- 04-09 19:xx 影響地圖 TQEF 歸屬修正 + 阿哥拉廣場補入 (9d5ebc4) Code
- 04-09 19:xx 阿哥拉廣場 Instructions 撰寫完成（含 Cowork 職責、影響地圖引用）Cowork
- 04-09 19:xx docs/shared-file-impact-map.md commit (95dfc6a) Code
- 04-09 19:xx scripts/build_wiki_ingest_report.py commit (10e8182) Code
- 04-09 18:30 跨專案影響地圖 `docs/shared-file-impact-map.md` 建立 Cowork
- 04-09 17:00 五專案架構全到位 + 命名整理 + AI Ready Instructions 撰寫 Cowork
- 04-09 12:30 Wiki 獨立儀表板 Issue #157 建立 + Wiki Project Instructions 撰寫 Cowork
- 04-09 11:18 儀表板遷移至 GitHub Issue #155 + session-handoff v4.3 + Project Instructions v2 Cowork
- 04-09 12:21 Issue #153 health check 誤報修復 (7d7e85d) Code
- 04-09 00:45 ACP UX/A11y 修復全部完成部署 (dbc0666) Code
- 04-08 23:55 ACP v2 Phase 3 全功能上線 (0c3122b) Code
- 04-08 22:05 ACP Layer 2+3 全功能上線 (8be165c) Code
- 04-08 19:xx beyond-man-days 大改版 zh-TW/ja/zh-cn Cowork
- 04-07 21:57 fix #143 #144 #145 三個 L2 bug (6bb4eaf) Code
- 04-07 20:00 Issue #141 行為分眾推播 (816ef3f) Code
- 04-07 18:31 LIFF OA 好友引導 (3559526) Code
- 04-07 17:xx Secrets 全盤點 + YouTube API 啟用 Cowork
- 04-06 23:30 Issue #120 R2 push image upload (7d5240f) Code
- 04-06 10:35 Wiki Phase 4A API 驗證通過 + KV seed Code
- 04-06 02:00 Wiki Phase 3 全完成 (bd4d6d0) Code
- 04-05 22:00 Issue #105 推播 image+text (35945cd) Code+Paul
- 04-05 03:38 Issue #102 推播通知修復 Code
- 04-04 12:54 Issue #99 韌性補強 8 項 (4275cc6) Code
- 04-04 01:50 FAQ 頁面 + JSON-LD 上線 (38a19a9) Code+Paul

---

## Formosa ESG 2026
> 起駕：4/12（倒數 3 天）⚠️ 凍結期 4/11-4/13

**Phase 3 ✅** 上線準備完成
**Phase 4 ✅** 功能完善（Issue #104–#153 全結案）

**⏰ 4/12 前剩餘待辦**
- [ ] 重設 FORMOSA_ADMIN_TOKEN — **Paul 本機執行**
- [ ] 填 data/youtube-channels.json — **需 Paul 提供**

---

## paulkuo.tw Dashboard 優化
**Phase A ✅** GSC API 接入
**Phase B ✅** 三項升級 (14b8f8f)

---

## AI 協作力評量 (ACP)
**Phase 1–3 ✅** 表單 + 結果頁 + D1 + 分享 URL + OG
**Layer 2+3 ✅** GitHub Auto-Fetch + AI Verification
**UX/A11y ✅** (dbc0666) | **D1 備份 ✅** (#154)

**待辦：**
- [ ] beyond-man-days en 版本 — Paul 另外討論
- [ ] ACP 視覺審查（手機 RWD、雙層雷達圖）
- [ ] ACP 社群推廣

---

## paulkuo.tw LLM Wiki（Karpathy Pattern）
> 📚 **細部狀態見 Issue #157**

Corpus：219 頁 | Phase 0–4B ✅ 全完成 | 3 條自動化管線運行中

---

## 讓 AI 懂我（AI Ready）
**基線分數：85/100** | GitHub Actions：每週一 1AM UTC

**待辦：**
- [ ] Project Instructions 貼入 Cowork Settings — **Paul 手動**
- [ ] JSON-LD 缺口修復（+13 分）
- [ ] AI Comprehension Q10 精度修正（+2）

---

## 阿哥拉廣場｜即時會議記錄
**線上 URL：** https://paulkuo.tw/tools/translator/
**翻譯引擎：** R11 ✅（Overall 4.81，Semi/Circular/Biz Term 全部 5.00）

**TQEF Phase 1 ✅** 已結案（7輪評測 R6→R11，語料庫 29 句）
**TQEF Phase 2 Stage A ✅** 語料庫 2,369 句，五源匯流管道完成

**TQEF Phase 2 Stage B ⏳ 進行中**
- [ ] 軸線 1：COMET 交叉驗證（目標 Pearson r ≥ 0.6）
- [ ] 軸線 2：人類專家基線（目標 Cohen's Kappa ≥ 0.5）— 指南 + 模板已產出
- [ ] 軸線 3：評分穩定性（目標 SD < 0.2）
- 結案條件：三軸線全達標

**功能待辦：**
- [ ] iOS Safari 實機驗證
- [ ] BRONCI 台語整合
- [ ] regenerative_medicine 醫療 OpenCC 詞典

---

## 專案治理框架（Governance Dashboard）
**Dashboard URL：** https://paulkuo.tw/governance/
**API：** `/api/governance/{summary,projects,metrics/:id,automation}`

| Phase | 內容 | 狀態 |
|-------|------|------|
| Phase 1 | Schema + 資料收集 | ✅ 完成 (5fd4ab3) |
| Phase 2 | Worker API + Dashboard | ✅ 完成 (e2fcd8f, cd2422a) |
| Phase 2.5 | 資料自動化（KV seed CI + 排程 metrics） | ⚠️ KV seed CI 失敗 |
| Phase 3 | 排程監測 + 異常偵測 | 🟡 未開始 |

**⚠️ 已知問題：**
- [ ] `governance-kv-seed.cjs` 第 20 行 `--remote` 參數在 CI 環境報錯 → 待 Code 修復（已寫 PENDING.md）
- [ ] `governance-metrics-collector` 排程任務尚未首次執行（今天 10:33 首跑）

---

## beyond-man-days 文章
- [x] zh-TW / ja / zh-cn 完成
- [ ] en 版本 — Paul 另外討論

---

## 其他待辦
- [ ] 辯論引擎 JSON 解析 bug 修復
- [ ] .env.example + secrets 管理機制
- [ ] deploy alias 確認（~/.zshrc）
- [ ] GSC 結構化資料等 Google 重新爬取驗證
