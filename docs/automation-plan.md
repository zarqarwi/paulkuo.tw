# 三套工具統一管線架構

**版本：v1.1 ｜ 2026-02-21**
**維護者：Paul Kuo × Claude**

---

## 系統概覽

三套工具（paulkuo.tw 網站、OneUp 社群發佈、多模型辯論引擎）整合為一條自動化管線。設計原則：**自動化重複勞動，保留創意判斷的人工關卡**。

```
辯論引擎（本機）
    ↓ 手動選擇值得發佈的辯論
debate-to-article.py → 產生文章 .md
    ↓ git push
┌─────────────────────────────────────────┐
│ GitHub Actions 全自動                     │
│                                           │
│  deploy.yml → build + Cloudflare 部署     │
│       ↓ 成功後觸發                        │
│  translate.yml → en/ja/zh-cn 翻譯         │
│       ↓ 同時觸發                          │
│  publish-social.yml → 社群 6 平台排程      │
│       ↓                                   │
│  OneUp → X, LI, TH, BS, RD, YT          │
│  （FB, IG 需手動）                        │
└─────────────────────────────────────────┘
```

---

## Phase 1：多語路由基礎建設 ✅

**檔案：** `src/i18n.ts`, `src/components/BlogPage.astro`, `src/components/ArticlePage.astro`, 各語系 pages

**功能：**
- 四個 content collection（zh-Hant / en / ja / zh-cn）
- 共用元件 BlogPage + ArticlePage，接受 lang prop
- 語系切換器自動連結到對應翻譯頁
- Schema.org JSON-LD 含 inLanguage

**路由對照：**
| 語系 | 文章列表 | 文章頁 |
|------|----------|--------|
| zh-Hant | /blog | /articles/{slug} |
| English | /en/blog | /en/articles/{slug} |
| 日本語 | /ja/blog | /ja/articles/{slug} |
| 简体中文 | /zh-cn/blog | /zh-cn/articles/{slug} |

---

## Phase 2：辯論引擎 → 文章轉換 ✅

**檔案：** `scripts/debate-to-article.py`

**使用方式：**
```bash
cd ~/Desktop/01_專案進行中/paulkuo-astro

# 列出辯論紀錄
python3 scripts/debate-to-article.py --list

# 預覽第 N 篇
python3 scripts/debate-to-article.py -n 7 --dry-run

# 正式轉換
python3 scripts/debate-to-article.py -n 1

# push 觸發全自動
git add -A && git commit -m 'feat: 文章名稱' && git push
```

**轉換邏輯：**
- Claude API (Sonnet) 將多模型辯論紀錄重寫為第一人稱深度文章
- 自動偵測 pillar（ai/circular/faith/startup/life）
- 自動產生 frontmatter（title/subtitle/description/tags/slug）
- 輸出符合 Astro content collection schema 的 .md 檔

**前提：** 需設定 `ANTHROPIC_API_KEY` 環境變數

---

## Phase 3：社群自動發佈 ✅

**檔案：** `.github/workflows/publish-social.yml`, `scripts/publish-social.mjs`

**觸發條件：**
- 自動：Build & Deploy workflow 成功後
- 手動：GitHub Actions → Run workflow → 填入文章路徑

**流程：**
1. 偵測新增文章（`--diff-filter=A`，只看新增不看修改）
2. 檢查 `data/published-slugs.json` 防重複發佈
3. Claude API 為 8 平台產生客製化摘要
4. DALL-E 生成配圖 → freeimage.host 上傳
5. OneUp API 排程（1 小時後發佈）
6. 摘要存檔至 `data/social-logs/`（可追溯）
7. slug 記錄至 `data/published-slugs.json`（防 dedup）
8. Slack 通知（待設定 webhook）

**平台配置：**
| 平台 | 排程方式 | 字數限制 |
|------|----------|----------|
| X (Twitter) | 自動 | 280 |
| LinkedIn | 自動 | 3000 |
| Threads | 自動 | 500 |
| Bluesky | 自動 | 300 |
| Reddit | 自動 | 40000 |
| YouTube | 自動 | 5000 |
| Facebook | ⚠️ 手動 | 10000 |
| Instagram | ⚠️ 手動 | 2200 |

---

## Phase 4：本機整合（待做）

**規劃：** Makefile 封裝常用指令

```makefile
make debate-list        # 列出辯論
make debate-to-article  # 互動轉文章
make push               # git add + commit + push
make dev                # astro dev
```

---

## 安全機制（v1.1 新增）

### 🔴 已修復

**1. 修改舊文章不再觸發社群發佈**
- `publish-social.yml` 使用 `git diff --diff-filter=A`（只偵測新增檔案）
- 修錯字、更新內容的 push 不會重發社群

**2. 翻譯 fallback 加上限**
- `translate-article.mjs` fallback 最多翻 5 篇
- 只翻尚未有翻譯版本的文章
- 超過 5 篇會提示手動處理，避免 API 費用爆炸

**3. 防重複發佈**
- `data/published-slugs.json` 記錄已發佈的 slug
- 同一篇文章不會被排程兩次
- workflow re-run 或重複觸發不會重複發佈

**4. 摘要存檔可追溯**
- `data/social-logs/{slug}-{date}.json` 存每次產出的摘要
- 萬一品質有問題可回查

### 🟡 已知風險（可接受）

**5. 社群摘要品質依賴 Claude 產出**
- 無人工審核窗口（設計決策：全自動優先）
- 緩衝：OneUp 排程有 1 小時緩衝，看到 Slack 通知可手動取消
- 追蹤：social-logs 存檔可事後回查

**6. DALL-E / freeimage 失敗時降級為純文字**
- 可接受，但 IG/FB 純文字觸及率低
- 長期可考慮備用圖床

**7. GitHub Actions 用量**
- 免費方案 2000 分鐘/月
- 每次 push 約 5-8 分鐘（deploy + translate + social）
- 月 push 50 次 ≈ 250-400 分鐘，尚在安全範圍

**8. API 費用估算**
- 每篇文章全流程：Claude 翻譯 ×3 + Claude 摘要 ×1 + DALL-E ×1
- 約 NT$15-20 / 篇（翻譯 ~$12 + 摘要 ~$2 + 圖 ~$1.2）
- 辯論轉文章另計 ~$3-5

---

## GitHub Secrets 清單

| Secret | 用途 | 設定狀態 |
|--------|------|----------|
| `ANTHROPIC_API_KEY` | Claude 翻譯 + 摘要 | ✅ |
| `OPENAI_API_KEY` | DALL-E 配圖 | ✅ |
| `ONEUP_API_KEY` | 社群排程 | ✅ |
| `ONEUP_CATEGORY_ID` | OneUp 分類 | ✅ |
| `FREEIMAGE_API_KEY` | 圖床上傳 | ✅ |
| `CLOUDFLARE_API_TOKEN` | 網站部署 | ✅ |
| `CLOUDFLARE_ACCOUNT_ID` | 網站部署 | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_B64` | 社群 feed | ✅ |
| `SLACK_WEBHOOK_URL` | 通知 | ⏳ 待設定 |

---

## 檔案索引

```
paulkuo-astro/
├── .github/workflows/
│   ├── deploy.yml              # build + Cloudflare Pages 部署
│   ├── translate.yml           # 自動翻譯 en/ja/zh-cn
│   └── publish-social.yml      # 社群自動發佈
├── scripts/
│   ├── debate-to-article.py    # 辯論 → 文章轉換器（本機）
│   ├── publish-social.mjs      # 社群發佈邏輯（CI 用）
│   └── translate-article.mjs   # 翻譯邏輯（CI 用）
├── data/
│   ├── published-slugs.json    # 已發佈文章記錄（防 dedup）
│   └── social-logs/            # 社群摘要存檔（可追溯）
├── src/
│   ├── i18n.ts                 # 多語設定
│   ├── components/
│   │   ├── BlogPage.astro      # 共用文章列表
│   │   └── ArticlePage.astro   # 共用文章頁
│   └── content/articles/
│       ├── *.md                # 中文原文
│       ├── en/*.md             # 英文翻譯
│       ├── ja/*.md             # 日文翻譯
│       └── zh-cn/*.md          # 簡體翻譯
└── docs/
    └── automation-plan.md      # 本文件
```

---

## 變更紀錄

| 版本 | 日期 | 變更 |
|------|------|------|
| v1.0 | 2026-02-21 | Phase 1-3 完成，基礎管線建立 |
| v1.1 | 2026-02-21 | 安全機制：修復舊文觸發、翻譯上限、dedup、摘要存檔 |
