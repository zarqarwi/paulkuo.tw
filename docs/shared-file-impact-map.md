# paulkuo.tw 共用檔案影響地圖

> 更新：2026-04-11（新增 JSON 單一事實來源）
> 用途：跨子專案改動時的影響範圍參考（人類可讀版）
> 機器可讀來源：`docs/shared-files.json`（commit-msg hook、skill、scheduled task 都讀這份）

本 repo 有六個子專案共用同一個 codebase，改 A 可能壞 B。
修改以下檔案前，**必須確認影響範圍**。

> ⚠️ 新增或修改共用檔案時，請更新 `docs/shared-files.json`（單一事實來源），
> 而非只改這份 markdown。hook 和自動掃描都讀 JSON。

## 子專案一覽

| 子專案 | 路徑前綴 | API 前綴 | Cowork Project | 儀表板 |
|--------|---------|---------|----------------|--------|
| 主站 | `/` `/articles/` | 多個 | Paukuo網站 | #155 |
| Formosa ESG | `/projects/formosa-esg-2026/` | `/api/formosa/*` | 白沙屯ESG繞境 | #155 |
| LLM Wiki | `/wiki/` | `/api/wiki/*` | LLM Wiki | #157 |
| ACP | `/tools/ai-collab-portfolio/` | `/api/acp/*` | AI Collaboration Portfolio | #155 |
| AI Ready | `/tools/ai-ready-dashboard` | eval-worker 獨立 | AI Ready Continuous evolution | #155 |
| TQEF | `/tools/tqef/` | `/api/tqef/*` | 阿哥拉廣場｜即時會議記錄 | — (獨立專案) |

> ⚠️ 阿哥拉廣場是獨立 Cowork 專案（不在 paulkuo.tw 資料夾），但 TQEF 功能跑在 paulkuo.tw 的 Worker 上，`/api/tqef/*` 的任何破壞性變更會直接影響阿哥拉廣場。

---

## ⚠️ 極高風險（全部子專案共用）

| 檔案 | 功能 | 改動影響 |
|------|------|---------|
| `worker/src/index.js` | Worker 路由分派 | 所有 API 端點 |
| `worker/src/config.js` | 全域設定常數 | 所有 API 回應 |
| `worker/src/utils.js` | corsHeaders / jsonResponse | 所有 API CORS + JSON |
| `worker/src/auth.js` | OAuth + token + 預算檢查 | 所有受保護端點 |
| `src/layouts/BaseLayout.astro` | 基礎版面 | 全站 144+ 頁面 |
| `src/components/NavBar.astro` | 導航列 | 全站 |
| `src/components/SiteHead.astro` | SEO meta tags | 全站 OG / head |
| `src/components/SiteFooter.astro` | 頁尾 | 全站 |
| `src/components/I18nClient.astro` | 多語切換 | 全站 i18n |
| `src/data/siteSchema.ts` | JSON-LD 結構化資料 | 全站 SEO + AI Ready 自動優化 ⚠️ |

---

## 子專案專屬模組

| 模組 | 子專案 | 改動只影響 |
|------|--------|-----------|
| `worker/src/formosa.js` | Formosa ESG | Formosa API |
| `worker/src/formosa-i18n.js` | Formosa ESG | Formosa 多語 |
| `worker/src/wiki-api.js` | LLM Wiki | Wiki API |
| `worker/src/acp.js` | ACP | ACP API |
| `eval-worker/src/index.ts` | AI Ready | 四層評分 API |
| `ai-ready-opt/optimize.py` | AI Ready | 優化引擎 |
| `ai-ready-opt/program.md` | AI Ready | 評分策略 |
| `ai-ready-opt/multi_model_query.py` | AI Ready | 多模型查詢 |
| `worker/src/feed.js` | 主站 | 社群動態牆 |
| `worker/src/visitors.js` | 主站 | 流量分析 |
| `worker/src/costs.js` | 主站 | API 成本 |
| `worker/src/comments.js` | 主站 | 文章留言 |
| `worker/src/social.js` | 主站 | 社群串接 |
| `worker/src/fitbit.js` | 主站 | Fitbit 數據 |
| `worker/src/stock.js` | 主站 | 股價 |
| `worker/src/gsc.js` | 主站 | GSC API |
| `worker/src/youtube-ingest.js` | 主站 + Wiki | YouTube 資料 |
| `worker/src/tqef-api.js` | TQEF | 語料庫 / 評測輪次 / 會議匯出 / STT |

---

## 跨專案共用模組

| 模組 | 服務的子專案 | 注意事項 |
|------|-------------|---------|
| `worker/src/translator.js` | Wiki + 主站 + TQEF | 翻譯 / STT 後處理 / 摘要 |
| `worker/src/scorecard.js` | Formosa + 主站 | 評分卡 |
| `worker/src/status.js` | 全部 | 健康檢查 |
| `scripts/wiki_dialogue_lib.py` | LLM Wiki ingest pipeline | 上游：`wiki-dialogue-detect.py`（CLI）；下游：`wiki-pending-promote.py`、`wiki-quarantine-classify.py`、`tests/test_wiki_dialogue_lib.py`。純函數，無 I/O。 |
| `scripts/wiki_visibility.py` | LLM Wiki ingest + quarantine | `has_recording_tag` 共用於 `wiki-quarantine-classify.py`；修改需同時驗證 quarantine rules 行為 |

---

## 共用資源

| 資源 | 類型 | 共用範圍 |
|------|------|---------|
| `AUTH_DB` (paulkuo-auth) | D1 | 主站 + Formosa + ACP + TQEF |
| `TICKER_KV` | KV | 全部（快取 + 訪客 + Fitbit + 成本） |
| `TQEF_AUDIO` | R2 | TQEF（語音評測音檔） |
| `FORMOSA_OG` | R2 | Formosa |

⚠️ D1 Schema 變更影響所有需要驗證的 API。

---

## 最低驗證指令（改動共用模組後必跑）

改動任何共用模組後，**依受影響子專案逐項執行**，全部回傳 200 才算通過。

### 改動 `worker/src/index.js` / `utils.js` / `auth.js`（全部子專案受影響）

```bash
# 主站
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/
# Wiki
curl -s -o /dev/null -w "%{http_code}" "https://api.paulkuo.tw/api/wiki/search?q=AI"
# Formosa
curl -s -o /dev/null -w "%{http_code}" https://api.paulkuo.tw/api/formosa/checkin/health
# ACP
curl -s -o /dev/null -w "%{http_code}" "https://api.paulkuo.tw/api/scorecard/feed"
# TQEF
curl -s -o /dev/null -w "%{http_code}" "https://api.paulkuo.tw/api/tqef/rounds"
# AI Ready（eval-worker 獨立，不受 index.js 影響，跳過）
```

### 改動 `worker/src/translator.js`（Wiki + 主站 + TQEF）

```bash
curl -s -o /dev/null -w "%{http_code}" "https://api.paulkuo.tw/api/wiki/search?q=LLM"
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/
curl -s -o /dev/null -w "%{http_code}" "https://api.paulkuo.tw/api/tqef/rounds"
```

### 改動 `src/layouts/BaseLayout.astro` / `NavBar.astro` / `SiteHead.astro`（全站）

```bash
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/wiki/
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/tools/ai-collab-portfolio/
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/tools/tqef/
```

### 改動 `src/data/siteSchema.ts`（全站 SEO + AI Ready）

```bash
curl -s https://paulkuo.tw/ | grep -c "application/ld+json"
# 確認回傳數字 > 0（JSON-LD 存在）
curl -s -o /dev/null -w "%{http_code}" https://paulkuo-eval.paul-4bf.workers.dev/api/eval/score
```

### 改動 `AUTH_DB` Schema

```bash
# 確認 Formosa checkin 正常
curl -s -o /dev/null -w "%{http_code}" https://api.paulkuo.tw/api/formosa/checkin/health
# 確認 ACP 資料讀取正常
curl -s -o /dev/null -w "%{http_code}" "https://api.paulkuo.tw/api/scorecard/feed"
# 確認 TQEF corpus 正常
curl -s -o /dev/null -w "%{http_code}" "https://api.paulkuo.tw/api/tqef/rounds"
```

---

## AI Ready 自動修改檔案

AI Ready 的優化引擎（`ai-ready-opt/optimize.py`）和 GitHub Actions（`.github/workflows/ai-ready-opt.yml`）會自動修改以下共用檔案：

| 檔案 | 被修改方式 | 影響 |
|------|-----------|------|
| `public/llms.txt` | AI Agent 自動優化 | 全站 AI 可讀性 |
| `src/data/siteSchema.ts` | JSON-LD 調整 | 全站結構化資料 ⚠️ |
| `public/mcp.json` | MCP 工具定義 | Agent 互動 |
| `public/.well-known/agent-card.json` | A2A 卡片 | Agent 發現 |
| `public/robots.txt` | 爬蟲規則 | 全站 SEO |
| `src/content/articles/**/*.md` | FAQ frontmatter | 文章 FAQ JSON-LD |

⚠️ `siteSchema.ts` 特別危險——AI Ready 自動優化可能改動 JSON-LD，影響全站結構化資料。

排程：每週一 01:00 + 手動觸發 + articles 變更時

---

## 改動檢查流程

修改高風險檔案時：

1. **改之前** — 確認影響的子專案列表
2. **改之後** — worklog 標注 `[影響: 主站 + Formosa + Wiki + ACP + AI Ready + TQEF]`
3. **部署前** — 對每個受影響的子專案做基本 smoke test
4. **handoff 時** — 在「跨專案影響」段落說明改了什麼、可能壞什麼
5. **AI Ready 自動改動後** — 檢查 siteSchema.ts 和 llms.txt 有沒有影響其他子專案的結構化資料
