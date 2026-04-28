---
status: Draft
---

# Code Handoff · Codex 工程診斷三項修復（2026-04-28）

- **產出時間**：2026-04-28
- **產出者**：Cowork session（Opus 4.7，本視窗）
- **目標 session**：Code（建議 Sonnet 4.6）
- **任務類型**：執行 spec（Codex 評估後 Cowork 核實，三項修法批次落地）
- **上游**：
  - Codex 工程診斷四份報告（uploads/）
  - Cowork 對照 codebase 核實 file:line（remark-wikilinks.mjs:106 / index.js:276 / visitors.js:881 / BaseLayout.astro:63 全準確）
  - GitHub Issue：#187（P0 GET secret）/ #188（P0 Wiki XSS）/ #189（P1 hreflang）
- **預估時間**：60-90 分鐘（含 token rotation + smoke test）

---

## 0. 開頭警示（必讀）

**本 handoff 含 token rotation 步驟，請逐字驗收後再動手。**

- 三項修復按 P0 → P0 → P1 順序執行（task A / task B / task C）
- Task A 改完必須**立即 rotate `FORMOSA_ADMIN_TOKEN`**——舊 token 邏輯上已洩漏，缺這步等於沒修
- Task B 修法用 mdast `data.hName/hProperties` 結構，不是用字串 escape——讓下游 hast 自動處理才不會漏
- Task C 是一行改動，但要順便確認 `/projects`、`/governance` 是否也該進 `zhOnlyPrefixes`（Cowork 沒查，請 Code 判斷）
- **司法核查**：Cowork 對 Codex 報告做了核實，Code 收到本 handoff 後仍應對 file:line 重新驗（憲法第三條剛性核查）

**禁止**：
- 一次混合三個 task 的改動成同一個 commit
- 跳過 token rotation
- 把 Codex 報告 #4（search index 多語覆蓋）也順手做掉——已決定擱置（PENDING.md `[-]`）

---

## 1. 開場 SOP（必做，依序）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# Step 1: 確認 git 乾淨
git status --short
# 預期：本 handoff 自己（?? handoffs/cowork--codex-engineering-fixes-2026-04-28.md）+ 可能有 PENDING.md / worklog M

# Step 2: 看今天 commit chain（不重做已做事）
git log --oneline --since='2026-04-28' | head -20

# Step 3: 確認三個 Issue 存在
# https://github.com/zarqarwi/paulkuo.tw/issues/187
# https://github.com/zarqarwi/paulkuo.tw/issues/188
# https://github.com/zarqarwi/paulkuo.tw/issues/189

# Step 4: 司法核查 file:line 仍正確
sed -n '102,114p' src/plugins/remark-wikilinks.mjs
sed -n '276,277p' worker/src/index.js
sed -n '877,886p' worker/src/visitors.js
sed -n '62,77p' src/layouts/BaseLayout.astro
```

任何 file:line 對不上 Cowork 紀錄 → **停下回報 Paul**，不要動。

---

## 2. Task A · #187 Worker GET + query secret（P0，最緊急）

### 2.1 修法

**檔案 1：`worker/src/index.js`**

```diff
- if (path === '/analytics/backfill' && method === 'GET') return handleBotBackfill(request, env, corsHeaders);
- if (path === '/analytics/reclass' && method === 'GET') return handleReclassify(request, env, corsHeaders);
+ if (path === '/analytics/backfill' && method === 'POST') return handleBotBackfill(request, env, corsHeaders);
+ if (path === '/analytics/reclass' && method === 'POST') return handleReclassify(request, env, corsHeaders);
```

**檔案 2：`worker/src/visitors.js`**

`handleBotBackfill`（約 879-886）和 `handleReclassify`（約 963 起）兩處的授權邏輯都要改：

```diff
- const url = new URL(request.url);
- const key = url.searchParams.get('key');
+ const auth = request.headers.get('Authorization') || '';
+ const key = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (key !== env.FORMOSA_ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 403, headers: { 'Content-Type': 'application/json', ...corsHeadersFn(request) }
    });
  }
```

順手把函式上方註解 `GET /analytics/backfill?key=...` 改成 `POST /analytics/backfill (Authorization: Bearer ...)`。

### 2.2 Token rotation（必做，commit 後立刻）

```bash
# 1. 產新 token（32 chars 以上）
NEW_TOKEN=$(openssl rand -hex 32)
echo "new token: $NEW_TOKEN  ← 記下來，下一步要貼"

# 2. 設到 worker secret（會 prompt）
cd worker
wrangler secret put FORMOSA_ADMIN_TOKEN --config wrangler.toml
# 貼入 $NEW_TOKEN

# 3. 確認設成功
wrangler secret list --config wrangler.toml | grep FORMOSA_ADMIN_TOKEN
```

⚠️ rotate 後**舊 token 立即失效**——若有 cron 或手動腳本仍使用舊 token，要同步更新。Code 不知道這些消費端在哪 → **rotate 完通知 Paul 接手更新外部消費端**。

### 2.3 部署 + Smoke Test

```bash
cd worker && wrangler deploy --config wrangler.toml
cd ..

# Smoke test（用新 token）
curl -X POST -H "Authorization: Bearer $NEW_TOKEN" https://paulkuo-ticker.{subdomain}.workers.dev/analytics/backfill
# 預期：200（或合理的 200 with body）

# 反向驗證：舊方式應失敗
curl "https://.../analytics/backfill?key=$OLD_TOKEN"
# 預期：405（method not allowed）或 403

# CDN log 抽樣（rotate 後 1 小時內）：grep 確認新 token 不出現在 query string
```

### 2.4 Commit

```
fix(worker): admin endpoints 改用 POST + Authorization header [影響: Formosa]

- /analytics/backfill 與 /analytics/reclass 從 GET ?key= 改為 POST + Bearer
- 避免 secret 暴露在 access log / 瀏覽器歷史 / shell history
- FORMOSA_ADMIN_TOKEN 同步 rotate（舊 token 邏輯上已洩漏）

Closes #187
```

---

## 3. Task B · #188 Wiki remark XSS（P0）

### 3.1 修法

**檔案：`src/plugins/remark-wikilinks.mjs`**（102-114 行）

```diff
  } else if (meta) {
    // Known node but not routable (source, internal, etc.)
    parts.push({
-     type: 'html',
-     value: `<span class="wikilink-ref" title="${meta.title}">${label}</span>`,
+     type: 'text',
+     value: label,
+     data: {
+       hName: 'span',
+       hProperties: {
+         className: ['wikilink-ref'],
+         title: meta.title,
+       },
+     },
    });
  } else {
    // Unknown slug → missing marker
    parts.push({
-     type: 'html',
-     value: `<span class="wikilink-missing">${label}</span>`,
+     type: 'text',
+     value: label,
+     data: {
+       hName: 'span',
+       hProperties: {
+         className: ['wikilink-missing'],
+       },
+     },
    });
  }
```

**為什麼用這個方案而不用 escape 函式**：mdast → hast 轉換時，`hProperties` 的 attribute 會由 hast 自動 escape，不會漏；用字串拼接每次都得記得 escape，新增屬性時容易漏。

⚠️ Code 收到後請對照 remark/mdast 文件確認 `data.hName + hProperties` 是否會被 rehype 正確轉成 `<span class="..." title="...">label</span>`。Cowork 沒實機驗證——這點請 Code 自己判斷或先建 fixture 跑一次。

### 3.2 驗證

```bash
# 建一份 fixture（暫存，驗完刪）
cat > /tmp/xss-fixture.md << 'EOF'
# XSS Fixture
[[evil-source]]

(假設 wiki/sources/evil-source.md 的 frontmatter title 含: ">'<img src=x onerror=alert(1)>)
EOF

# 或直接改一個現有 source 的 title 暫測（測完 revert）
# 然後 pnpm build 看 dist/ 渲染後的 HTML

pnpm build 2>&1 | tail -20
# 預期：835 pages（與最近的 baseline 對齊），0 errors

# 抓渲染結果驗證
grep -r "wikilink-ref" dist/ | head -3
# title 屬性內的 `"` 應該變 `&quot;` 或被攔截
```

### 3.3 Commit

```
fix(wiki): remark-wikilinks 改用 mdast hast 結構避免 HTML injection [影響: Wiki]

- type: 'html' raw string interpolation 改為 type: 'text' + data.hName/hProperties
- meta.title 與 label 由下游 hast 統一 escape，避免 LLM-generated frontmatter
  含特殊字元時 HTML 結構被破壞或升級為 XSS

Closes #188
```

---

## 4. Task C · #189 hreflang 短期解（P1）

### 4.1 修法

**檔案：`src/layouts/BaseLayout.astro:63`**

```diff
- const zhOnlyPrefixes = ['/dashboard', '/health', '/search', '/tags'];
+ const zhOnlyPrefixes = ['/dashboard', '/health', '/search', '/tags', '/wiki'];
```

### 4.2 順手判斷（Code 自行決定）

確認以下路徑是否也應該進 `zhOnlyPrefixes`（標準：`src/pages/{en,ja,zh-cn}/{path}/` 不存在則應加入）：

```bash
ls src/pages/en/projects 2>/dev/null && echo "projects has en" || echo "projects NO en"
ls src/pages/en/governance 2>/dev/null && echo "governance has en" || echo "governance NO en"
```

無 en 翻譯就一併加入。Cowork 沒查，這個判斷交給 Code。

### 4.3 驗證

```bash
pnpm build 2>&1 | tail -5
# 預期：835 pages（或本次新增 wiki 後的最新數），0 errors

# Build 後抽 wiki 頁面 head 看 hreflang
grep -A5 "hreflang" dist/wiki/index.html | head -20
# 預期：只剩 zh-TW + x-default，沒有 en/ja/zh-CN
```

### 4.4 Commit

```
fix(seo): /wiki 加入 zhOnlyPrefixes 避免 hreflang 指向不存在路由 [影響: Wiki + 主站]

- BaseLayout 對 wiki 頁面停止輸出 en/ja/zh-CN alternates
- 等 Wiki 多語規劃實際排上 roadmap 再放開
- 順手 audit /projects /governance 是否同樣處置

Closes #189
```

---

## 5. 總體部署 + Issue 同步

```bash
# Worker (Task A 已 deploy 過)，重新確認沒漏
cd worker && wrangler deploy --config wrangler.toml
cd ..

# 前端（Task B + C）
npm run build && wrangler deploy

# Issue 留言（commit hash 替換）
gh issue comment 187 --body "✅ Fixed in <hash>. Token rotated. Deploy verified."
gh issue comment 188 --body "✅ Fixed in <hash>. Build pass, fixture XSS escape 驗證通過."
gh issue comment 189 --body "✅ Fixed in <hash>. /wiki 已加入 zhOnlyPrefixes."
gh issue close 187 188 189
```

---

## 6. Smoke Test 統一收尾

按 `CLAUDE.md` 規範，部署後 worklog 須附 Smoke Test 結果：

- [ ] ✅ Task A: `curl -X POST -H "Authorization: Bearer ..." /analytics/backfill` → 200
- [ ] ✅ Task A: `curl GET /analytics/backfill?key=...` → 405/403
- [ ] ✅ Task B: pnpm build 0 errors，wikilink 樣式不變
- [ ] ✅ Task B: title 含 XSS payload 的 fixture，rendered HTML 已 escape
- [ ] ✅ Task C: dist/wiki/index.html head hreflang 只有 zh-TW + x-default
- [ ] ✅ FORMOSA_ADMIN_TOKEN rotation 完成且通知 Paul

任何 fail → 當場修 → 重 deploy → 再驗一次。

---

## 7. Cowork 收尾要做的事（Code 完成後 ping Cowork）

- [ ] 更新 Issue #155 dashboard（編 `worklogs/issue-155-body.md`，sync-dashboard action 自動 PATCH）
- [ ] PENDING.md 把本批次三項標 `[x]`
- [ ] 觀察期項目 #11 新增：「Codex 引介為第三方診斷源的常態化」（兩個月內 N≥1 重複事件再評估是否立 ADR）

---

## Consequences

- **預期收益**
  - 即時：FORMOSA_ADMIN_TOKEN 不再持續暴露；Wiki 渲染對 LLM-generated content 增加防線；Wiki SEO 訊號乾淨
  - 中期：建立「Codex 第三方診斷 → Cowork 核實 → Code 落地」的協作 pattern，可重複使用
- **副作用 / 已知風險**
  - Task A 若漏改任何外部消費端（cron / 手動腳本），rotate 後該端會炸 → 緩解：Code 完工後 ping Paul，由 Paul 接手清查
  - Task B 用 mdast hast 結構不是 1:1 等價於原 HTML 字串——可能 className 序列化或屬性順序略有差異，視覺上應一致但需 Code 對 fixture 確認
  - Task C 是治標方案，等 Wiki 多語真的要做時必須回頭重新評估 hreflang 策略
- **不在本 handoff 範圍**
  - Codex 報告 #4（search index 多語覆蓋）：Cowork 已判定為產品決策非工程 bug，已寫進 PENDING.md `[-]`
  - 對 LLM-generated wiki content 的更上游驗證（如 ingest 時就 sanitize meta.title）：本次只做下游渲染防線
  - Worker `/analytics` 其他 endpoint 的安全 audit：本次只動 backfill + reclass

## 來源事實清單（F-ID）

- F-codex-xss-2026-04-28：Codex 報告指 `src/plugins/remark-wikilinks.mjs:106, 112` 有 raw HTML interpolation
  - Cowork 核實：✅ 一致（讀檔時為 105-106 區間，與報告 ±1 行誤差屬可接受）
- F-codex-getsecret-2026-04-28：Codex 報告指 `worker/src/index.js:276, 277` 兩條 GET route + `worker/src/visitors.js:877, 963` 授權邏輯
  - Cowork 核實：✅ 一致（index.js:276-277 GET 觸發、visitors.js:877 註解 + 881 解析 query 全準確）
- F-codex-hreflang-2026-04-28：Codex 報告指 `BaseLayout.astro:62-77` 自動產 4 語 alternates
  - Cowork 核實：✅ 一致（zhOnlyPrefixes 在第 63 行，hreflangs 邏輯第 66-77 行）

---

## 附錄 · Codex Cross-Validation Prompts

如果 Code 對任一修法有疑慮，可把 Codex 提供的 cross-validation prompt 貼到其他 LLM 互打驗證：

- XSS 修法：`engineering-diagnosis-wiki-xss.md` 文末「給其他 AI 的短版 Prompt」
- GET secret 修法：`engineering-diagnosis-admin-get-query-secret.md` 文末
- hreflang 修法：`engineering-diagnosis-hreflang-wiki-routes.md` 文末
