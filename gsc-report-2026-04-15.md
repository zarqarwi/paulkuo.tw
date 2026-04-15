# GSC 深度檢查報告 — 2026-04-15

> 執行方式：Cowork 排程任務（gsc-api-deep-check）
> 檢查時間：2026-04-15
> 上次報告：2026-04-05（10 天前）

---

## 結構化資料

### 導覽標記（BreadcrumbList）
- **重大問題：1 項**（同上次）
- **無效項目：14 個頁面**（上次 13，+1）
- **有效項目：13 個**（上次 1，+12 ✅）
- 問題：「item」欄位未填 (位於「itemListElement」)
- GSC 最近更新：2026/4/13

#### 趨勢觀察
- **好消息**：有效項目從 1 增加到 13，代表 Google 已重新爬取部分文章，確認程式碼中的修復生效。
- **壞消息**：無效項目增加 1 個，仍有未重新爬取的舊頁面殘留錯誤。

#### 受影響頁面示例（前 6 筆）
1. `/articles/ai-surpass-human-intelligence-six-years/` (2026/4/5)
2. `/ja/articles/knowledge-pipeline-not-discipline/` (4/4)
3. `/zh-cn/articles/computation-as-currency/` (4/4)
4. `/en/articles/knowledge-pipeline-not-discipline/` (4/3)
5. `/zh-cn/articles/elite-arrogance-youth/` (4/2)
6. `/articles/ai-agents-vs-agentic-ai/` (4/2)

#### 程式碼現況
檢查 `src/components/ArticlePage.astro` 的 BreadcrumbList schema（第 108-135 行），4 個 ListItem 的 `item` 欄位都已填入正確 URL。GSC 殘留錯誤為上次修復前的舊爬取結果，等 Google 重新爬取即可自動清除。

### 活動（Event）
- 無效：0
- 有效：2（上次 1，+1）
- 狀態：✅ 乾淨通過

### 常見問題（FAQ）
- 無效：0
- 有效：1
- 狀態：✅ 乾淨通過

---

## 索引狀態

- **已索引：539 頁**（上次 434，+105 ✅）
- **未索引：662 頁**（上次 458，+204）
- 上次更新：2026/4/10

### 未索引原因分析

| 原因 | 本次 | 上次 | 差異 | 說明 |
|------|------|------|------|------|
| 頁面會重新導向 | 445 | 306 | +139 | 多語系路由重導，正常 |
| 替代頁面（有適當標準標記） | 172 | 104 | +68 | 多語系 canonical，正常 |
| 遭到「noindex」標記排除 | 16 | 14 | +2 | 確認是否為刻意行為 |
| 已檢索 - 目前尚未建立索引 | 14 | 19 | -5 ✅ | 品質改善 |
| 遭到 robots.txt 封鎖 | 13 | 13 | — | api 子網域端點，正常 |
| 找不到網頁 (404) | 2 | 2 | — | API + CF email protection |
| 重新導向錯誤 | 0 | 0 | — | — |
| 已找到 - 目前尚未建立索引 | 0 | 0 | — | — |

> 445 重導 + 172 canonical = 617 頁，佔未索引的 93.2%，全為多語系預期行為。
> 實際需關注的未索引僅 45 頁（14 已檢索未索引 + 16 noindex + 13 robots + 2 404）。

### 已檢索但尚未索引的頁面（14 筆）
- `/tools/builders-scorecard/methodology/` (4/11) — 新上線頁面，等 Google 評估
- `/articles/digital-colonialism-platforms/` (3/31)
- `/articles/ai-agent-planning-guide/` (3/19)
- `/api/search-index.json` (3/18) — JSON 資料檔，未索引合理
- `/data/i18n-home.json` (3/1) — 資料檔，未索引合理
- `/rss.xml` (2/27) — Feed 檔，未索引合理
- `/ja/health/dual/`、`/zh-cn/health/dual/`、`/en/health/dual/` (2/27) — 多語版本健康頁
- `/articles/incarnation-ai-embodiment` (2/27)
- 其他 4 筆

### 404 頁面（2 筆，未變動）
- `https://api.paulkuo.tw/analytics/visit` — API 端點不應被索引
- `https://paulkuo.tw/cdn-cgi/l/email-protection` — Cloudflare 標準 URL

---

## 搜尋成效（過去 28 天）

| 指標 | 本次 | 上次 | 差異 |
|------|------|------|------|
| 總點擊數 | 103 | 93 | +10 (+10.8%) ✅ |
| 總曝光次數 | 3,906 | 3,505 | +401 (+11.4%) ✅ |
| 平均點閱率 | 2.6% | 2.7% | -0.1pp |
| 平均排名 | 7.1 | 7.7 | -0.6 ✅（數值降=排名進步） |

### Top 5 查詢詞（按點擊排序）

| 查詢詞 | 點擊 | 曝光 |
|--------|------|------|
| paul kuo | 2 | 22 |
| claude usage chrome extension | 1 | 12 |
| openclaw filetype:pptx | 1 | 9 |
| claude 使用制限 確認 | 1 | 1 |
| 2028 ai屠宰场 | 1 | 1 |

> 亮點：`claude usage chrome extension` 從 0 點擊升到 1 點擊（之前 11 曝光 / 0 點擊，現在 12 曝光 / 1 點擊）。
> `transync ai` 39 曝光 / 0 點擊、`白沙屯媽祖 2026 trending reason` 15 曝光 / 0 點擊——仍為高曝光低 CTR 的待優化目標。

### Top 5 頁面（按點擊排序）

| 頁面 | 點擊 | 曝光 |
|------|------|------|
| `/articles/claude-usage-nyan-chrome-extension` (無斜線) | 14 | 175 |
| `/ja/articles/google-chirp3-japanese-stt-benchmark/` | 10 | 162 |
| `/articles/claude-usage-nyan-chrome-extension/` (有斜線) | 9 | 108 |
| `/articles/google-chirp3-japanese-stt-benchmark/` | 9 | 76 |
| `/articles/ai-collab-realtime-translator/` | 6 | 55 |

> ⚠️ **發現新問題：canonical URL 分裂**
> `claude-usage-nyan-chrome-extension` 被當成兩個頁面（有/無 trailing slash），拆分流量。
> 累計其實是 23 點擊 / 283 曝光，但被拆成兩筆。
> 需檢查 Astro 的 trailing slash 設定或 canonical 標籤是否一致。

---

## 網站體驗

### Core Web Vitals
- 行動裝置：**無資料**（90 天內流量不足）
- 桌面：**無資料**（90 天內流量不足）

### HTTPS
- HTTPS 頁面：59（上次 57，+2）
- 非 HTTPS：0
- 狀態：✅ 全站 HTTPS

---

## 本次修復

### 已確認修復（程式碼已存在）
- **Breadcrumb 修復已持續生效**：有效 BreadcrumbList 從 1 增加到 13，證實 ArticlePage.astro 的 fix 有效。剩餘 14 個無效項目等 Google 重新爬取。

### 未修改程式碼
本次檢查未進行新的程式碼修改。發現的問題多為：
1. 等待 Google 重新爬取（breadcrumb）
2. 預期的正常行為（404 API endpoint、JSON 資料檔未索引）
3. 需要 Paul 確認意圖的決策（/ja/ noindex、trailing slash 設定）

---

## 待 Paul 處理

1. **到 GSC 點「驗證修正後的項目」**（重申上次）
   - 路徑：導覽標記 → 「item」欄位未填 → 點右上角「驗證修正」按鈕
   - 這會加速 Google 重新爬取受影響頁面，加速清除 14 個殘留錯誤

2. **🔥 Canonical URL 分裂（新發現）**
   - `/articles/claude-usage-nyan-chrome-extension`（無斜線）和 `/articles/claude-usage-nyan-chrome-extension/`（有斜線）被 Google 視為兩個頁面
   - 建議檢查 `astro.config.mjs` 的 `trailingSlash` 設定是否為 `'always'`，並確認 canonical 標籤一致
   - 這會影響 SEO 信號集中度，修好後累計 23 點擊 / 283 曝光會合一

3. **Event JSON-LD 3 項改善**（非重大，從上次沿用）
   - organizer 加 `url`
   - offers 加 `url`
   - 新增 `performer`
   - 詳見 handoff 文件 `code--gsc-structured-data-fixes-2026-04-05.md`

4. **高曝光低 CTR 頁面優化**
   - `transync ai` 查詢：39 曝光 / 0 點擊
   - `白沙屯媽祖 2026 trending reason`：15 曝光 / 0 點擊
   - 建議改善對應文章的 meta description 和 title

5. **確認 /ja/articles/ noindex 是否刻意**（重申上次）
   - 若非刻意，需要修復

6. **/tools/builders-scorecard/methodology/ 新頁面未索引**
   - 4/11 已被爬取但尚未索引，再觀察 1-2 週
   - 若持續未索引，可考慮加強內部連結或提交 URL 檢查

---

## 總結

這 10 天內整體趨勢向上：
- ✅ 已索引頁面 +105（434 → 539）
- ✅ 搜尋點擊 +10.8%、曝光 +11.4%
- ✅ 平均排名進步 0.6
- ✅ Breadcrumb 有效項目從 1 暴增到 13（修復生效）
- ⚠️ 發現 canonical URL 分裂新問題，需優先處理
