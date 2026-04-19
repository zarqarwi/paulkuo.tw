# 🎛️ 專案狀態儀表板
最後更新：2026-04-20（Cowork — 協作憲法 v0.2 結案收尾：Issue #155 里程碑 + worklog 三維度 + DONE marker）

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
- 04-20 協作憲法 v0.2 結案三件事 ✅：Issue #155 governance 里程碑條目寫入 + worklog 4/19 三維度補完 + briefing v2 DONE marker。commit a6550f9（憲法 ADR + 四層盤點報告）+ 收尾 commit（worklog + DONE marker）Cowork
- 04-19 17:10 v5.1 護欄 Retro 結案 ✅：Code 產出 retro 報告（`worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md`），窗口內 🔴 0 / 🟡 4（皆低嚴重度，結論未擴散）。Cowork（被告）交叉重驗 4 案採信全數 🟡；Step 3「空中樓閣第 3 次」書面痕跡不存在，屬對話瞬時判斷。落地：SKILL.md v5.3 固化 C4 邊界（來源 vs 方式 🟢/🟡/🔴）+ CHANGELOG.md v5.3 條目 + PENDING.md 加使用者級 skill 同步待辦（🔴 Code/Paul 執行，方案 B 短期 / C 長期）。Cowork 新增 2 洞：N=3 樣本偏小應改語措、「對話瞬時判斷無書面痕跡」屬結構盲區記入 .auto-memory 備未來 C6/E1 候選。不升 E1、不觸發 v5.3 視窗 Code+Cowork
- 04-19 14:37 Workspace 容量警示清理驗證 ✅：governance-metrics-collector + wiki-youtube-pull 產出已 commit (c905f2a, 7b81235, be49a9a)，Clean up 未掉資料；CET ad-hoc session Paul 確認結案。事後分析揭露 Chat handoff 偵察路徑未考慮 Cowork `scheduled-tasks` MCP 能力（~10× token 無效支出）。落地：L1 SKILL.md v5.2（Step 0 偵察項目加 MCP 工具為合法路徑，CHANGELOG.md 新增 v5.2 條目）+ L2 CLAUDE.md Rollback Protocol 加 `list_scheduled_tasks` 交叉引用 + L3 PENDING.md 新增 `wiki-youtube-ingest.cjs` tmpDir 清理待辦（待當前轉檔批次結束後由 Code 執行）Cowork+Chat
- 04-18 session-handoff skill v5.1 三項 scope 全部落地 ✅：D 跨 Cowork 撞車 retro 歸檔（fdb4564）+ B 護欄編號系統首建 13 條 A/B/C/D 分組（f0154e4，SKILL.md 86-108 改寫 + 命名規則子節）+ E changelog 抽離獨立 CHANGELOG.md（e17d6f4，SKILL.md 頂部 10 段 → 一行指引）。skill-schema-lint 5/5 PASS，SKILL.md 最終 543 行（<§0 治理上界 900）。retrospective-2026-04-18-v5-1-closure.md 建立。**源頭事實規範 ROI 驗證 100 倍**：v5.0 事後抓 1.2 天 vs v5.1 事前抓 15 分鐘（rev3 §7 「17 條編號」空中樓閣）Cowork+Code
- 04-18 工作環境定義 rev2 落地 ✅（1100ccb + 0e3c43f）：Q-WE-1~9 全 9 題 Paul 拍板。docs/governance/working-environment.md Accepted，CLAUDE.md 加連結段落（245 行），session memory 建 project_working_environment.md。Exit Gate 5/5 PASS Cowork+Code
- 04-18 session-handoff skill v5.0 主線 A+B 完工 ✅：路線 C''（不拆只整理），skill-schema-lint 5/5 PASS（ec71e17），retrospective-2026-04-18-v5-split-reversal.md 建立（78d3ec8）— 止「1085 vs 522」跨視窗錯誤數字傳遞踩坑 Code+Cowork
- 04-11 R4 audit 完成 ✅：P0=0，P1=4（全修+deploy 876dddbd），P2=10（活動期間處理）。Fix-A stats rollback guard + Fix-B KV TTL 3→7天 + Fix-D multicast retry + Fix-C LINE 費用確認（$800→$1200 動態切換）Cowork+Code
- 04-10 R3-fix 全部完成驗證通過 ✅：FIX-1 computeFilteredKm (58a9e09) + FIX-2 VALID_SOURCES (同 commit)，Worker deploy 174bace0，UserSync 驗證吳心恬 km=94.3 合理，endpoint 確認 POST /api/formosa/user/sync (body: line_user_id) Cowork+Code
- 04-10 R3 audit 完成（資料品質&防禦韌性）：FIX-1 UserSync 噪音過濾缺失 [P0] + FIX-2 source 無白名單 [P1]，handoff 交 Code（021c291）Cowork
- 04-10 Issue #162 今日善足跡 API 驗通過：daily-report → ok:true，admin/carbon water_bottles 有值（Cowork 驗，不需重跑 deploy）Cowork
- 04-10 02:xx governance-kv-seed.cjs `--remote` 修復 (be42206) + session-handoff v4.7 (6f0927e) + CLAUDE.md worklog 三維度必填 (8198a7c) Code+Cowork
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
> 起駕：4/12（倒數 **1 天**）⚠️ 凍結期 4/11 開始

**Phase 3 ✅** 上線準備完成
**Phase 4 ✅** 功能完善（Issue #104–#162 全結案）

**📋 Pre-Launch Audit 四輪全部完成 ✅**
- R1 ✅ 數據一致性（等級門檻、碳排係數）
- R2 ✅ 修復驗證（成就卡、LINE Bot、Dashboard）
- R3 ✅ 資料品質＋防禦韌性（computeFilteredKm + VALID_SOURCES）
- R4 ✅ 使用者旅程＋邊界人物＋營運韌性（P0=0, P1=4 全修, P2=10 延後）

**R4 P1 修復明細（已 deploy 876dddbd）：**
- Fix-A：stats rollback guard — D1 flush 延遲時不覆寫較高的本地數值
- Fix-B：KV buffer TTL 3天→7天 — D1 長時間異常時的安全邊際
- Fix-C：LINE 費用確認 — NT$800（≤300人）/ NT$1,200（>300人）動態切換
- Fix-D：multicast retry — LINE 推播 429/5xx 加 2 次 exponential backoff

**R4 P2（10 項，活動期間處理）：**
鎖屏 GPS 說明、GPS 拒絕引導按鈕、Worker 錯誤 i18n、OG 圖片 loading、Health alert 擴展、費用 alert、Cron 升級告警等

**⏰ 4/12 前剩餘待辦**
- [x] 重設 FORMOSA_ADMIN_TOKEN — ✅ 4/10 已完成
- [x] R3-FIX Worker deploy — ✅ 4/10 版本 174bace0
- [x] R4-FIX Worker deploy — ✅ 4/11 版本 876dddbd
- [ ] 活動前全清測試資料 — **Paul 操作**（已發通知）
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
| Phase 2.5 | 資料自動化（KV seed CI + 排程 metrics） | ✅ 完成 (be42206) |
| Phase 3 | 排程監測 + 異常偵測 | 🟡 未開始 |

**⚠️ 已知問題：**
- [x] `governance-kv-seed.cjs` 第 20 行 `--remote` 參數在 CI 環境報錯 → ✅ 已修復 (be42206)
- [ ] `governance-metrics-collector` 排程任務尚未首次執行（今天 10:33 首跑）

### 2026-04-19 協作憲法 v0.2 落地

commit [`a6550f9`](https://github.com/zarqarwi/paulkuo.tw/commit/a6550f9) — docs(governance)

- 新增 `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`（5 條骨架 + v0.2 修正）
- 新增 `docs/skill-storage-inventory-2026-04-19.md`（四層分裂盤點）
- 憲法骨架：SSoT 原則 / 載體對等原則 / 權責分工原則（含剛性核查） / 記憶層次原則（含同層原子化補款）/ 記憶擴充原則
- 背景：收斂 skill 四層分裂、空中樓閣、worklog 內部矛盾三個結構性痛點
- 延伸排程：v0.3 會處理 session-handoff 雙樹合併、C 層 4 個 skill export schema、commit-msg hook for worklog 內部一致性

---

## 工作環境治理（Chat/Cowork/Code 三視窗）

**SSOT 文件**：`docs/governance/working-environment.md`（rev2 Accepted 2026-04-18）

| 主題 | 狀態 |
|------|------|
| §1 三視窗職責邊界 + 禁止事項 + Cowork commit 白名單 | ✅ rev2 |
| §1.3.1 兩層記憶系統路徑區分（repo `.auto-memory/` vs session memory）| ✅ 2026-04-18 補註 |
| §2 源頭事實清單 + F-ID 機制 + 兩層驗證防線 | ✅ rev2 |
| §3 Handoff ADR 欄位升級（Status + Consequences）| ✅ rev2 |
| §4 Skill/CLAUDE.md 三層長度規則（200 預警 / 800 觸發 / 900 硬）| ✅ rev2 |
| §5 外部共識對照表（Anthropic + 業界 + 傳統工程）| ✅ rev2 |
| §6.3 中期動作驗證（收斂日 2026-05-02）| ⏳ 進行中 |

**收斂驗證（2026-05-02 前）：**
- [x] 下一份 handoff 自然套用 §3 Status + Consequences（v5.1 規劃 rev1/rev2 + D/B/E 三份 Code handoff 全有）
- [x] v5.1 規劃 rev1 自然附源頭事實清單（F-ID）（rev1 §1 Source of Truth Manifest + Code 驗證 commit 734c476，**ROI 驗證 100 倍**）
- [ ] CLAUDE.md 行數未再膨脹（目前 245 行，官方軟上限 200）

**⚠️ 已知越界：**
- [ ] CLAUDE.md 245 行已超官方 200 行軟上限 22%（F4）→ 延 v5.2 視窗檢視是否抽部分內容獨立

---

## session-handoff skill v5.1（已結案 2026-04-18）

**三項 scope 全部落地，源頭事實規範首次成功救援**

| scope | 交付物 | commit |
|-------|-------|--------|
| D | worklogs/investigations/2026-04-18-cross-cowork-session-collision.md | fdb4564 |
| B | SKILL.md 「鐵律」節改寫為 13 條 A/B/C/D 編號系統 + 命名規則 | f0154e4 |
| E | CHANGELOG.md（12 段 v3→v5.1）+ SKILL.md 頂部一行指引 | e17d6f4 |

**關鍵指標：**
- SKILL.md 行數：553 → 578 → 543（仍低於 §0 治理上界 900）
- skill-schema-lint：5/5 PASS（全程）
- 源頭事實規範 ROI：v5.0 事後抓 1.2 天 → v5.1 事前抓 15 分鐘，**降低 100 倍**

**空中樓閣 meta（第 2 次實例，繼 v5.0「1086 行」後）：**
- rev3 §7 主張「既有 15 條 #1-#15 編號系統」，實際 SKILL.md 只有 11 條無編號規則
- 在 Cowork rev1 Proposed 階段由 Code 驗證報告（734c476）抓到
- rev2 §3.2 依實際 11 條重新歸納為 A2/B4/C5/D2 = 13 條
- 若 v5.2 再發生第三次 → 升格為 skill 護欄 E1「治理文件引用之源驗證」

**v5.2 候選 scope（延）：**
- A 四層檔案架構（L1+L2+L3+L5）
- C Metrics 三階段
- CLAUDE.md 245 行越界處置（抽部分成 runbook）
- E1 護欄升格（若第三次空中樓閣發生）
- 跨 session worklog 並發寫摩擦處置（每次 commit 吃 rebase 衝突成本）

**Retro**：docs/governance/retrospective-2026-04-18-v5-1-closure.md

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
