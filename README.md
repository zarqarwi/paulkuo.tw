# paulkuo.tw — Astro Version

> Rebuilding Order in an Age of Intelligence

Paul Kuo 的個人網站，用 Astro 框架重建，支援多語言文章管理與自動部署。

## 架構

```
src/
├── content/articles/     # 文章內容（Markdown）
│   ├── zh/              # 繁體中文原文
│   ├── en/              # English translations
│   ├── ja/              # 日本語翻訳
│   └── zh-cn/           # 简体中文翻译
├── pages/               # 頁面路由
│   ├── index.astro      # 首頁
│   ├── blog/            # 思想（文章列表 + 個別文章）
│   ├── about.astro      # 關於
│   ├── projects.astro   # 專案
│   └── feed.astro       # 動態
├── layouts/             # 版面配置
├── data/                # 文章 metadata
└── i18n/                # UI 翻譯檔
```

## 新增文章流程

1. 在 `src/content/articles/zh/` 新增 `.md` 檔案
2. 設定 frontmatter（title, description, pillar, date, lang, canonicalSlug）
3. 在 `src/data/articles.ts` 加入 metadata
4. Commit & push → GitHub Actions 自動翻譯 → 部署到 Cloudflare Pages

## 開發

```bash
npm install
npm run dev      # 本地開發
npm run build    # 產生靜態檔案
npm run deploy   # 建構 + 部署到 Cloudflare Pages
```

## 部署安全

使用 `deploy.sh` 腳本進行安全部署（自動備份、翻譯檔驗證、Git 同步）。
