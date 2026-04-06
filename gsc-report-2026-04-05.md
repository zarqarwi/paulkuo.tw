# GSC 深度檢查報告 — 2026-04-05

> 執行方式：Cowork 排程任務（gsc-api-deep-check）
> 檢查時間：2026-04-05
> 上次報告：首次執行

---

## 結構化資料

### 導覽標記（BreadcrumbList）
- **重大問題：1 項**
- **無效項目：13 個頁面**
- **有效項目：1 個**
- 問題：「item」欄位未填 (位於「itemListElement」)
- 首次偵測：2026/2/27
- 受影響頁面（全為文章頁的多語版本）：
  1. `/zh-cn/articles/code-is-cheap-vibe-coding-to-claws/` (4/3)
  2. `/zh-cn/articles/jensen-huang-ai-mirror/` (4/3)
  3. `/en/articles/formosa-esg-2026-low-carbon-pilgrimage/` (4/2)
  4. `/zh-cn/articles/formosa-esg-2026-low-carbon-pilgrimage/` (4/2)
  5. `/zh-cn/articles/ai-slaughterhouse-2028-crisis-scenario/` (4/2)
  6. `/en/articles/analytics-sampling-trap/` (4/2)
  7. `/articles/analytics-sampling-trap/` (4/1)
  8. `/ja/articles/analytics-sampling-trap/` (4/1)
  9. `/ja/articles/formosa-esg-2026-low-carbon-pilgrimage/` (4/1)
  10. `/articles/formosa-esg-2026-low-carbon-pilgrimage/` (4/1)
  11. `/zh-cn/articles/life-you-envy-is-miracle/` (3/31)
  12. `/ja/articles/builders-scorecard-story/` (3/31)
  13. `/en/articles/builders-scorecard-story/` (3/24)

### 活動（Event）
- 無效：0
- 有效：1
- 狀態：✅ 乾淨通過（非重大問題需另從 Rich Results Test 確認）

### 常見問題（FAQ）
- 無效：0
- 有效：1
- 狀態：✅ 乾淨通過

---

## 索引狀態

- **已索引：434 頁**
- **未索引：458 頁**（6 個原因）
- 上次更新：2026/3/31

### 未索引原因分析

| 原因 | 數量 | 說明 |
|------|------|------|
| 頁面會重新導向 | 306 | 多語系路由重導，正常行為 |
| 替代頁面（有適當標準標記） | 104 | 多語系 canonical 標記，正常 |
| 已檢索 - 目前尚未建立索引 | 19 | Google 自行判斷，非網站問題 |
| 遭到「noindex」標記排除 | 14 | OAuth 登入頁 + admin 頁面 + /ja/articles/ |
| 遭到 robots.txt 封鎖 | 13 | api.paulkuo.tw/auth/ 端點 |
| 找不到網頁 (404) | 2 | API endpoint + CF email protection |
| 重新導向錯誤 | 0 | — |
| 已找到 - 目前尚未建立索引 | 0 | — |

> 306 重導 + 104 canonical = 410 頁，佔未索引的 89.5%，全為多語系預期行為。
> 實際需關注的未索引僅 48 頁（19 已檢索未索引 + 14 noindex + 13 robots + 2 404）。

---

## 搜尋成效（過去 28 天）

| 指標 | 數值 |
|------|------|
| 總點擊數 | 93 |
| 總曝光次數 | 3,505 |
| 平均點閱率 | 2.7% |
| 平均排名 | 7.7 |

### Top 5 查詢詞（按點擊排序）

| 查詢詞 | 點擊 | 曝光 |
|--------|------|------|
| paul kuo | 1 | 20 |
| transync ai 費用 | 1 | 7 |
| ai capability gap | 1 | 2 |
| claude 使用制限 確認 | 1 | 1 |
| 2028 ai屠宰场 | 1 | 1 |

> 點擊分佈極度分散（97 個不同查詢詞），沒有單一查詢有超過 1 次點擊。
> 高曝光低點擊：transync ai（40 曝光 / 0 點擊）、claude usage chrome extension（11 / 0）。

### Top 5 頁面（按點擊排序）

| 頁面 | 點擊 | 曝光 |
|------|------|------|
| /articles/claude-usage-nyan-chrome-extension | 14 | 175 |
| /articles/google-chirp3-japanese-stt-benchmark/ | 10 | 62 |
| /ja/articles/google-chirp3-japanese-stt-benchmark/ | 8 | 135 |
| /articles/pope-leo-xiv-ai-homily/ | 8 | 22 |
| /ja/about/ | 5 | 25 |

> 亮點：/en/articles/google-chirp3-japanese-stt-benchmark/ 有 636 曝光但僅 2 點擊（CTR 0.3%），有改善 meta description 提升 CTR 的空間。

---

## 網站體驗

### Core Web Vitals
- 行動裝置：**無資料**（流量不足以分析）
- 桌面：**無資料**（流量不足以分析）

### HTTPS
- HTTPS 頁面：57
- 非 HTTPS：0
- 狀態：✅ 全站 HTTPS

### 行動裝置可用性
- 未在概覽中顯示獨立報告（可能流量不足）

---

## 本次修復

### 已確認修復（程式碼已更新）
- **Breadcrumb position 3 補 item URL**：檢查 `src/components/ArticlePage.astro`，程式碼中 position 3 已有 `"item": \`${SITE.url}${basePath}/blog\``。修復已存在於程式碼中，GSC 的 13 個錯誤來自修復前的舊爬取（最新爬取日期 4/3）。等 Google 重新爬取即可自動清除。

### 未修改程式碼
- 本次檢查未進行額外的程式碼修改。Handoff 文件 `code--gsc-structured-data-fixes-2026-04-05.md` 已記錄 Event JSON-LD 的 3 項非重大問題修復建議，待 Code session 處理。

---

## 待 Paul 處理

1. **到 GSC 點「驗證修正後的項目」**：導覽標記 → 「item」欄位未填 → 驗證修正。這會加速 Google 重新爬取受影響頁面。

2. **Event JSON-LD 3 項改善**（非重大，不影響索引）：
   - organizer 加 `url`
   - offers 加 `url`
   - 新增 `performer`
   - 詳見 handoff 文件 `code--gsc-structured-data-fixes-2026-04-05.md`

3. **高曝光低 CTR 頁面優化**：
   - `/en/articles/google-chirp3-japanese-stt-benchmark/`（636 曝光 / 2 點擊 = 0.3% CTR）
   - 建議改善 meta description 和 title，提升搜尋結果吸引力

4. **/ja/articles/ 被 noindex**：確認是否為刻意行為。如果不是，需要修復。

5. **git commit + push**：如果 Code session 有修改程式碼，記得部署。
