# SEO Index 去重邏輯審計調查

**日期**：2026-04-17（Phase A read-only 審計）
**調查範圍**：`scripts/seo-index-submit.py` URL 去重邏輯
**前置**：race condition 修復已生效（commit `70173b2`）
**回報對象**：Chat session
**本回報只做診斷，不改 code。**

---

## 結論先講

**歸類：可能 A（邏輯健全）** ✅

去重邏輯設計正確，靠 `.seo/indexed-urls.txt` 作為持久化記錄檔，每次 run 都從 sitemap 撈全量 URL 後用 set 減法 filter 掉已送的。race condition 修好後系統可自癒，**不需進一步優化**。

那 6 個 4/16 失敗的 URL 會在下次自然 run 時被重送（因為當時 save_indexed 寫入的變更沒 push 成功，main 上的 indexed-urls.txt 沒記錄它們）—— Paul 已選擇選項 B 接受此重送成本。

---

## Phase A 詳細回答

### A-1：seo-index.yml 實際呼叫的 script

**檔案**：`scripts/seo-index-submit.py`（200+ 行 Python，本次唯一核心邏輯）

**workflow 呼叫點**：`.github/workflows/seo-index.yml:40`
```yaml
- name: Submit new URLs to Google Indexing API
  run: python scripts/seo-index-submit.py
```

**其他送 Google Indexing API 的 script**：無（grep 全 repo 只有這一個）

### A-2：三個核心問題

#### Q1：怎麼決定要送哪些 URL？

**答：從線上 sitemap-index.xml 動態撈全量 URL，不看 git history 也不看本地資料檔。**

關鍵 code（`seo-index-submit.py:75-88`）：
```python
def get_all_urls() -> set[str]:
    """Fetch sitemap index, then each child sitemap, return all URLs."""
    child_sitemaps = fetch_sitemap_index(SITEMAP_INDEX_URL)
    all_urls: set[str] = set()
    for sm_url in child_sitemaps:
        urls = fetch_sitemap_urls(sm_url)
        all_urls.update(urls)
    return all_urls
```

來源 URL 寫死：`https://paulkuo.tw/sitemap-index.xml`（由 Astro 靜態產出，部署後才有最新內容）。

#### Q2：有沒有去重邏輯？

**答：有。用 set 減法 filter。**

關鍵 code（`seo-index-submit.py:141-146`）：
```python
all_urls = get_all_urls()           # 從 sitemap 撈全量
indexed = load_indexed()            # 從 .seo/indexed-urls.txt 載入已送記錄
new_urls = sorted(all_urls - indexed)  # set 減法：只保留沒送過的
```

每次 run 都會重新載入記錄檔，不依賴任何 cache 或 state。送成功後 `indexed.add(url)`（line 176），最後 `save_indexed(indexed)` 寫回檔案（line 187）。

**關鍵設計**：即使遇到 429 quota exhausted 或其他 fail，也會 **always save progress**（line 186-187 註解明確寫 "Always save progress (even on failures)"）。這是對的 — 避免部分送成功但記錄丟失導致重送。

#### Q3：已送記錄檔是什麼？在哪裡？

**答：`.seo/indexed-urls.txt`**

| 項目 | 值 |
|---|---|
| 路徑 | `{REPO_ROOT}/.seo/indexed-urls.txt` |
| 格式 | 純文字，每行一個 URL，排序存 |
| 目前大小 | 548 行（2026-04-17 09:55 CST 觀測） |
| 無 metadata | 純 URL 清單，沒有 timestamp、status、retry count |

**checked in git**：commit 頻率顯示它是常態被 seo-index workflow 提交的（最近 10 個 commit 都是 `chore(seo): update indexed URLs list`）。

**最近 5 次成功更新時間**（UTC）：
```
a969a4f  2026-04-16 14:34:37  ← 4/16 最後成功（比先前調查寫的 08:47 晚 6 小時）
a5812d4  2026-04-16 08:47:07
15aff8a  2026-04-16 00:29:14
0585a51  2026-04-10 11:32:29
36d119b  2026-04-09 16:37:28
```

⚠️ **修正先前調查的小錯**：前份 race condition 調查報告寫「從 16:47 CST (08:47 UTC) 以來 16+ 小時無成功 commit」— 實際上 22:34 CST (14:34 UTC) 還有成功過一次 `a969a4f`。race condition 發生在那之後、Paul 截圖的「failed 16 hours ago」應該對應的是 4/16 晚間的某次觸發。不影響主論點。

### A-3：歸類理由

| 歸類選項 | 符合程度 | 理由 |
|---|---|---|
| **可能 A**：看記錄檔判斷，送前 filter | ✅ 完全符合 | line 143 `all_urls - indexed` 是教科書級 filter |
| 可能 B：每次送最近 N 天 | ❌ 不符 | 沒有 N 天窗口概念，也沒讀 git log |
| 可能 C：混合型有 bug | ❌ 不符 | 邏輯乾淨，沒發現 bug |

**→ 結論：邏輯健全，不需重構。**

---

## 意外觀察（不影響結論但值得記錄）

### 1. Daily limit 是 per-run 不是 per-day

`DAILY_LIMIT = 200`（line 25）cap 的是「**當次 run 批次大小**」，不是「當日總送量」。

如果一天 Build & Deploy 跑兩次 → seo-index 跑兩次 → 理論上可送 400 個 URL。但 Google Indexing API 本身有每天 200 的硬限，超過會回 429，script 會 break out of loop（line 181-184）並 save progress。

**實務上不會爆配額**，但變數名稱 `DAILY_LIMIT` 有點誤導，應該叫 `PER_RUN_LIMIT`。這是命名問題，不是 bug。

### 2. URL 是從線上 sitemap 拉的，不是本地檔案

這個設計的隱含假設是「Build & Deploy 已把新 sitemap 部署上 Cloudflare Pages」。workflow_run trigger 正好滿足這個前提（Build & Deploy 完成才跑 seo-index），所以沒問題。

但 CDN cache（`max-age=3600`）可能讓 sitemap 延遲到一小時才更新。script fetch sitemap 時可能拿到舊版，新文章要等下一輪才被送 Google。這不是 bug 只是延遲特性，符合 Google 本身的 indexing 心態。

### 3. URL 從記錄檔移除沒有機制

如果某個 URL 從 sitemap 中消失（文章撤掉），它還是會留在 `.seo/indexed-urls.txt`。這理論上不會造成重送（因為 sitemap 沒了 `all_urls - indexed` 的差集仍是空），但記錄檔會不斷膨脹。

長期來看 548 行還可控，未來破千時可考慮加 `indexed ∩ all_urls` 清理。**現在不是問題，記下來給未來的自己**。

---

## Phase B：自然觸發驗證計畫

**不手動觸發**（省 Google API 配額）。等下次 Paul push 任何東西進 main → Build & Deploy → seo-index 觸發。

**驗證方式（不依賴 gh CLI）**：

1. 下次 main 有 commit 後，開 https://github.com/zarqarwi/paulkuo.tw/actions/workflows/seo-index.yml
2. 點最新 run → Job `index-submit` → `Submit new URLs to Google Indexing API` step
3. 讀 log：
   - 如果看到「Already indexed: 548 ... New URLs to submit: N」且 N ≥ 6 → 符合選項 B 預期（那 6 個 URL 被重送）
   - 如果 `chore(seo): update indexed URLs list` commit 順利 push 進 main → race condition 修復生效

**Baseline 記錄**（2026-04-17 09:55 CST）：
- `.seo/indexed-urls.txt`：548 行
- 最後成功 commit：`a969a4f`（2026-04-16 14:34:37 UTC = 22:34 CST）
- commit 8203e50 → rebase 後 70173b2（race condition 修復已上 main）

---

## 建議後續動作

1. **不重構**：去重邏輯健全，race condition 已修，這個問題可以結案。
2. **Phase B 被動驗證**：下次 main 有 commit 時 Paul 或 Cowork 掃一下 Actions 頁確認修復持續生效。不用特別安排。
3. **未來優化（低優先）**：記錄檔膨脹到 1000+ 行時，考慮加清理邏輯（移除 sitemap 不存在的 URL）。現在 548 行完全可控。
4. **可選小改**：把 `DAILY_LIMIT` 常數改名 `PER_RUN_LIMIT` 避免誤解，但這純粹是可讀性問題。

---

## 完成標準 checklist

- [x] A-1 定位 script：`scripts/seo-index-submit.py`
- [x] A-2 Q1 答：從線上 sitemap 撈全量
- [x] A-2 Q2 答：有去重（set 減法 filter）
- [x] A-2 Q3 答：`.seo/indexed-urls.txt`（純 URL 清單）
- [x] A-3 歸類：可能 A（邏輯健全）
- [x] 調查回報 .md 寫好（此檔）
- [x] Baseline 記錄（548 行，最後成功 commit `a969a4f`）
- [ ] Phase B 等自然觸發後補觀察結果
- [ ] 同步到 GitHub Issue #155（SSoT）
