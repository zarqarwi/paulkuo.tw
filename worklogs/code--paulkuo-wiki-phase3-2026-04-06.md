# Wiki Phase 3 — 進階功能 Handoff

> 來源：Cowork session 2026-04-06
> 目標：Code session
> 前置：Phase 2 已上線（45d3d47），/wiki/ + /wiki/[slug]/ 正常運作

---

## 背景

Wiki Phase 2 完成了前端骨架（/wiki/ 首頁 + Graph View + 概念頁），現在需要加上進階功能讓它從「能看」變成「好用」。Phase 3 有五個獨立子任務，可以各自 commit，不需要一次做完。

---

## 當前架構速查

```
src/content/wiki/
├── CLAUDE.md          # wiki schema 與 ingest 規則
├── concepts/          # ~17 個概念頁（public concept pages）
├── entities/          # 1 個 entity（kuaidao-qingyi.md）
├── sources/           # ~208 個來源頁（article/getnote/web 等）
├── meta/              # graph.json 的備份等
├── graph.json         # 全量 graph（226 nodes / 436 edges）
├── stats.json         # 統計數據
└── raw/               # web clips 原始檔

src/pages/wiki/
├── index.astro        # /wiki/ 首頁（Graph View + 概念索引）
└── [slug].astro       # /wiki/{concept-slug}/ 概念頁

src/content.config.ts  # wiki_concepts + wiki_sources collections
```

---

## Step 0 偵察（每個子任務開始前先跑）

```bash
# 確認目前 build 是綠的
npm run build

# 看 wiki 頁面結構
ls src/pages/wiki/
cat src/content.config.ts | grep -A5 wiki

# 看 entity 的 frontmatter schema
cat src/content/wiki/entities/kuaidao-qingyi.md

# 看概念頁 body 裡有沒有 [[wikilink]]
grep -rn '\[\[' src/content/wiki/concepts/*.md | head -20

# 看 [slug].astro 的 getStaticPaths 怎麼篩選
head -60 src/pages/wiki/\[slug\].astro
```

---

## 3A: [[wikilink]] 解析（remark plugin）

### 目標
Markdown body 裡的 `[[概念名稱]]` 或 `[[slug|顯示文字]]` 自動轉成 `/wiki/{slug}/` 的超連結。

### 方案
1. 寫一個 remark plugin（`src/plugins/remark-wikilinks.mjs`）
2. 在 `astro.config.mjs` 的 `markdown.remarkPlugins` 掛上
3. Plugin 邏輯：parse `[[...]]` → 查 slug mapping → 產出 `<a href="/wiki/{slug}/">`

### 注意事項
- slug mapping 需要從 graph.json 或 content collection 動態建立，不能 hardcode
- 如果 `[[不存在的概念]]` 要 graceful degrade（顯示為純文字 + CSS 標記，不要 broken link）
- remark plugin 跑在 build time，所有概念頁的 body 都會經過，確保效能
- 要同時處理繁體中文名稱和英文 slug 兩種格式
- 驗證：找一個概念頁手動加幾個 `[[]]`，build 後確認連結正確

### 踩坑風險
- Astro Content Collections 的 markdown 處理跟一般 remark 稍有不同，要確認 plugin 掛在正確位置
- `[[` 和 `]]` 在 markdown 裡可能被其他 parser 先吃掉（如 footnote syntax），注意 plugin 順序

---

## 3B: Entity 頁面路由

### 目標
目前只有 `type: concept` 有頁面（`/wiki/[slug]/`），`type: entity`（目前 1 個：kuaidao-qingyi）沒有對應路由。

### 方案
兩個選擇：

**選項 A（推薦）：擴展現有 [slug].astro**
- 在 getStaticPaths 裡同時 include wiki_concepts 和 entity 類型的頁面
- 需要在 content.config.ts 加 wiki_entities collection（目前 entities/ 沒有獨立 collection）
- 概念頁和 Entity 頁共用 layout，但 Entity 頁多顯示一些欄位（如人物簡介）

**選項 B：獨立路由**
- 新增 src/pages/wiki/entity/[slug].astro
- Entity 有自己的 template

### 注意事項
- content.config.ts 目前只有 wiki_concepts（concepts/）和 wiki_sources（sources/），沒有 wiki_entities
- entities/ 裡目前只有 1 個檔案，要確認 schema 跟 concepts 是否相容（都用 wikiSchema）
- entity 加入後，Graph View 的 node type 篩選也要更新
- 驗證：build 成功 + `/wiki/kuaidao-qingyi/` 回 200

---

## 3C: OG Image 動態生成

### 目標
每個 wiki 概念頁有專屬的 OG image（社群分享時顯示），不是用全站預設圖。

### 方案
用 satori + sharp 在 build time 產圖。

```
/wiki/{slug}/og.png
包含：概念名稱 + pillar 色彩標籤 + 來源數量 + paulkuo.tw branding
```

### 注意事項
- 中文字體：satori 需要載入中文字體檔（Noto Sans TC 等），會增加 build time
- 字體檔大小：Noto Sans TC full 約 8MB，建議用 subset 版
- Cloudflare Pages build 有 20 分鐘 timeout + 25000 files limit，大量圖片要注意
- 目前 14 個 public wiki 頁面沒問題，但未來頁面增多要考慮是否改成 on-demand（Worker）
- 現有方案參考：看 paulkuo.tw 文章的 OG image 是怎麼做的（可能已有基礎設施）
- 驗證：build 後確認 dist/wiki/{slug}/og.png 存在

---

## 3D: Graph View hover 體驗優化

### 目標
目前 Graph View 是 2D canvas force-directed（157 nodes），hover 和互動可以更好。

### 可能的改進
1. Hover tooltip：顯示概念名稱 + 來源數 + pillar + 一行摘要
2. Connected highlight：hover 一個 node 時，highlight 它的 1-hop 鄰居，dim 其他
3. Click 行為優化：單擊展開 tooltip、雙擊導航到概念頁
4. Touch 支援：手機上 long press = hover
5. 效能：157 nodes 應該 OK，但如果未來到 500+ 要考慮 WebGL 或 clustering

### 注意事項
- 這是 canvas 渲染，不是 DOM，所以 hover detection 要自己算碰撞
- 改動在 wiki/index.astro 裡的 script 區塊，代碼量可能不小
- 行動版要特別測試（touch event vs mouse event）
- 驗證：開 dev server，在 /wiki/ 上 hover 幾個 node 確認體驗

---

## 3E: 對話查詢介面（未來，低優先）

### 目標
讓使用者用自然語言問問題，從 wiki 知識庫裡找答案。

### 這是最複雜的一項，建議等 3A~3D 穩定後再做。初步方向：
- Option 1：Client-side search（lunr.js / fuse.js）— 簡單但只能做關鍵字搜尋
- Option 2：Worker endpoint + Vectorize — 語意搜尋，需要 embedding
- Option 3：Worker + AI Gateway — 完整 RAG，成本最高

### Paul 可以先想的
- 使用者會怎麼用？搜尋框 vs 對話框？
- 需不需要記住上下文（多輪對話）？
- 成本考量：每次 query 打 AI 要花多少？

---

## 建議執行順序

```
3A（wikilink）→ 3B（entity 路由）→ 3D（Graph hover）→ 3C（OG image）→ 3E（對話，未來）
```

理由：
- 3A 影響所有概念頁的內容品質，優先
- 3B 補齊缺失的路由，Entity 數量會隨 ingest 成長
- 3D 是 UX polish，做完體驗會好很多
- 3C 是 SEO/社群分享用，不緊急
- 3E 需要更多設計討論，放最後

---

## 已知陷阱（從 Phase 2 踩坑學到的）

1. **git add 新檔案！** Phase 2 的 CI 紅燈就是因為 src/content/wiki/ 沒 commit。任何新增的檔案（plugin、字體、生成的 OG image 等）都要確認有 git add
2. **CI 環境 = 乾淨 checkout**：本機有的東西 CI 不一定有。每次加新 dependency 或檔案，想一下 CI 能不能拿到
3. **build 完再 push**：本機 npm run build 成功再 push，不要盲推
4. **fix-frontmatter.py**：CI 會跑這個 script，只處理 articles/，不碰 wiki/，但如果你動了 script 路徑要注意

---

## 完成後回報格式

每完成一個子任務：
```
3X 完成
- commit: {hash}
- 變更：{新增/修改了什麼檔案}
- 驗證：npm run build 成功 / 頁面截圖
- 待 Paul 執行：git push origin main（如果還沒推）
```
