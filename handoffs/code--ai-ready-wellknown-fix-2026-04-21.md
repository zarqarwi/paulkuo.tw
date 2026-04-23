# code--ai-ready-wellknown-fix-2026-04-21.md

建議模型: Sonnet

---

## 背景

AI Ready eval 跑分發現 MCP+A2A 層得 0/25。
原因：`paulkuo.tw/.well-known/mcp.json` 和 `agent-card.json` 兩個 endpoint 都回傳首頁 HTML，而非 JSON。
`dist/.well-known/` 裡檔案存在，問題是 Cloudflare Pages 路由把這個路徑吃掉了。

修法：在 `_redirects` 加明確 200 rewrite，在 `_headers` 加 Content-Type。

---

## Step -1 環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull
```

---

## Step 0 偵察確認

```bash
# 確認目前兩個 endpoint 確實回傳 HTML（非 JSON）
curl -s https://paulkuo.tw/.well-known/mcp.json | head -1
curl -s https://paulkuo.tw/.well-known/agent-card.json | head -1
# 預期看到：<!DOCTYPE html（壞的）

# 確認 dist/.well-known/ 有檔案
ls dist/.well-known/
# 預期看到：agent-card.json  mcp.json
```

---

## 修改 1：`public/_redirects`

在檔案**最上方**加入兩行（放最上面優先權最高）：

```
/.well-known/mcp.json /.well-known/mcp.json 200
/.well-known/agent-card.json /.well-known/agent-card.json 200
```

完整檔案修改後應該長這樣（新增的在最上方）：

```
/.well-known/mcp.json /.well-known/mcp.json 200
/.well-known/agent-card.json /.well-known/agent-card.json 200

# Cloudflare Pages rewrites for dynamic client-side routes
/tools/builders-scorecard/eval/  /tools/builders-scorecard/eval/index/index.html  200

# Sitemap redirect — Astro generates sitemap-index.xml, not sitemap.xml
/sitemap.xml  /sitemap-index.xml  301
```

---

## 修改 2：`public/_headers`

在檔案**最上方**加入（放在現有 `# Cloudflare Pages custom headers` 之後、`/llms.txt` 之前）：

```
/.well-known/mcp.json
  Content-Type: application/json; charset=utf-8

/.well-known/agent-card.json
  Content-Type: application/json; charset=utf-8
```

---

## Build + Verify

```bash
npm run build
# 確認 dist/.well-known/ 還在
ls dist/.well-known/
```

---

## Commit + Push

```bash
git add public/_redirects public/_headers
git commit -m "fix: .well-known/ 路由修正，確保 mcp.json/agent-card.json 回傳 JSON [影響: AI Ready MCP+A2A 評分]"
git push origin main
```

---

## Smoke Test（等 Cloudflare 重建後約 2-3 分鐘）

```bash
# 確認兩個 endpoint 回傳 JSON（不是 HTML）
curl -s https://paulkuo.tw/.well-known/mcp.json | head -1
curl -s https://paulkuo.tw/.well-known/agent-card.json | head -1
# 預期看到：{ 開頭的 JSON
```

---

## 注意事項

- ⚠️ 只改 `public/_redirects` 和 `public/_headers`，不動其他檔案
- ⚠️ `_redirects` 的新增行必須放**最上方**，Cloudflare 按順序比對，先到先得
- 這兩個檔案不在 AI Ready 白名單，自動化不會覆蓋

---

## 回報格式

```
✅ _redirects 修改（.well-known 兩行加到最上方）
✅ _headers 修改（Content-Type 加入）
✅ npm run build 無 error
✅ git push 完成（commit: XXXXX）
✅ Smoke test：curl .well-known/mcp.json 回傳 { 開頭 JSON
⚠️ 等 Cloudflare 重建後再跑 eval，預期 MCP+A2A 0/25 → 25/25
```

---

## 本輪 metrics

目標：MCP+A2A 0/25 → 25/25（+25 分）
預期總分：65 → 90/100
