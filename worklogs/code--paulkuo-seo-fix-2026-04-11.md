# Handoff to Code — paulkuo.tw SEO 修復
**日期**：2026-04-11
**來源**：Cowork session（Paul + GSC 分析）
**目標**：commit + push 兩項已完成的 SEO 修復，並驗證上線

---

## 背景

Paul 發現 GSC 本週點擊下降 59%（12 vs 29）。Cowork 分析後定位出兩個問題：

1. `/sitemap.xml` 回應空白（Astro 產出的是 `sitemap-index.xml`）
2. `ai-collab-realtime-translator` 這篇文章 FM 未含「Transync AI」關鍵字，導致 40 次曝光 0 點擊

**兩項修改已由 Cowork 直接寫入檔案，Code 只需 commit + push + 驗證。**

---

## 已修改的檔案（直接 commit，不需再改）

```
public/_redirects
src/content/articles/ai-collab-realtime-translator.md
src/content/articles/en/ai-collab-realtime-translator.md
```

### 1. `public/_redirects`

新增一行：
```
/sitemap.xml  /sitemap-index.xml  301
```

### 2. `ai-collab-realtime-translator.md`（zh-TW）

- `subtitle`：改為含「Transync AI」和成本數字
- `description`：加入「評估過 Transync AI」和「台幣 16 元」
- `tags`：新增 `Transync AI`、`即時翻譯工具比較`、`Groq`

### 3. `en/ai-collab-realtime-translator.md`

同步對應英文版的 subtitle / description / tags

---

## Step 0 偵察（commit 前先確認）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 確認三個檔案都有變動
git diff --name-only

# 快速確認 _redirects 內容正確
grep sitemap public/_redirects

# 確認 FM 有 Transync AI
grep "Transync" src/content/articles/ai-collab-realtime-translator.md | head -5
```

---

## 執行步驟

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# Commit（一個 commit 包含全部三個檔案）
git add public/_redirects \
        src/content/articles/ai-collab-realtime-translator.md \
        src/content/articles/en/ai-collab-realtime-translator.md

git commit -m "fix(seo): redirect /sitemap.xml + add Transync AI to article FM

- public/_redirects: /sitemap.xml → /sitemap-index.xml 301
- ai-collab-realtime-translator: subtitle/description/tags 加入 Transync AI 關鍵字
- 同步 EN 版本

[影響: SEO/爬蟲, 文章 CTR]"

git push origin main
```

---

## 驗證方式

Deploy 完成後（CI/CD 約 2-3 分鐘）：

```bash
# 1. 確認 sitemap redirect 有效（應回 301）
curl -I "https://paulkuo.tw/sitemap.xml" | grep -E "HTTP|location"

# 2. 確認 sitemap-index.xml 有內容
curl -s "https://paulkuo.tw/sitemap-index.xml" | grep -c "<sitemap>"

# 3. 確認文章頁面正常
curl -s -o /dev/null -w "%{http_code}" "https://paulkuo.tw/articles/ai-collab-realtime-translator/"
```

預期結果：
- sitemap.xml → 301 redirect to sitemap-index.xml
- sitemap-index.xml → 至少 1 個 `<sitemap>` 節點
- 文章頁面 → 200

---

## 注意事項

- ja / zh-cn 版本的 tags 原本就沒翻譯（保持中文 tags），不需動
- `_redirects` 是 Cloudflare Pages 的 redirect 規則，不是 worker redirect，不需改 wrangler.jsonc
- 這次沒有動正文，不需要跑 L2 查核

---

## 回報格式

完成後請在 `worklogs/worklog-2026-04-11.md` 新增：

```markdown
- {HH:MM} fix(seo): /sitemap.xml redirect + Transync AI FM 修復 ({commit hash}) Code

## 待辦快照
### 高優先 🔴
（依現況填寫）

## Smoke Test
- ✅/❌ sitemap.xml 301 redirect：{結果}
- ✅/❌ sitemap-index.xml 有節點：{結果}
- ✅/❌ 文章頁面 200：{結果}
```
