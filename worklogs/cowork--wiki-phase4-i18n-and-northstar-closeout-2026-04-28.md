# Cowork Closeout — Phase 4 i18n 同步 + 北極星驗證合併收尾（2026-04-28）

> 建立：2026-04-28（Cowork 同 session 收尾）
> Session 類型：Cowork [WIKI]
> Session 主題：B（i18n derived_from 同步） + D（北極星驗證結構檢查）合併處理
> 上游：`worklogs/cowork--wiki-session-end-2026-04-28.md`（Phase 4 全閉環 session）
> 對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）

---

## §1 三維度紀錄

### 做了什麼（完成日誌）

按時間軸：

- **承接 Phase 4 結案 session**：讀 phase4_done memory + 上 session 結尾的 4 選 1 候選
- **工程角度排序拍板**：B + D 合併（同 session）→ A 獨立 session → C 最後做
- **寫 i18n 同步 Code handoff**（commit `2cce233`），含 §3 Step 2 工程預警
- **Paul 同意 + 開新 [CODE] session 跑 handoff**
- **Cowork 端唯讀偵察**（用 GitHub MCP grep，幫 Code 預檢）：
  - ArticlePage / DerivedFromSection lang prop chain ✅ 完整
  - build-derived-index.py 早就跨語系設計 ✅ 不會破壞 unique keys
  - ReferencedByArticlesSection 早就預期多語系 lang badge ✅
- **Code 推完 i18n 同步**（commit `2425965` articles + `5951af3` done report）
- **GitHub MCP `list_commits` 驗證 commit hash**（按踩坑紀律）✅ 對得上
- **D 北極星驗證結構檢查**（Cowork 用 WebFetch）：
  - source 端：`getnote-072896-yang-tianrun-non-tech-claw-native` 顯示「被 16 篇引用」（4×4 符合預期）
  - article 端 ja：`ai-collab-realtime-translator` 顯示「3 件の素材から派生」+ 3 source 連結
  - 抓到 ja article body 空白 → 確認是 pre-existing stub，不是 i18n 同步造成
- **彙整 Phase 4.5 candidate 觀察清單**

### 狀態變更

- **Issue #157 Phase 4 區塊**：原本「全部完成 A→G」→ 加上 i18n 同步補完
- **derived-from 累計**：9 篇 zh / 25 entries / 10 unique keys → **27 篇翻譯文（en×9 / ja×9 / zh-cn×9）/ 100 entries / 10 unique keys**
- **memory `project_llm_wiki_phase4_done.md`**：待補 i18n 同步段落（Step F+ "Step F.5 backfill"）
- **Phase 4.5 candidate**：新增 3 點觀察（待 Paul 拍板進不進 Phase 4.5）

### 為什麼這樣決定

- **B + D 合併處理（不分兩 session）**：B 是 i18n 雙向 UI 完整度的最後一塊磚，D 需要在「完整 UI」上跑才有意義。倒過來會驗到半殘。
- **Cowork 預先唯讀偵察**：handoff §3 Step 2 預警要 Code grep 驗證，但 Cowork 用 GitHub MCP 也能做唯讀檢查。這樣 Code session 跑得更順（已知不會觸發停下回報的條件）
- **D 不開 Code handoff**：D 是工作流驗證（不動 code），Cowork 自己用 WebFetch 做結構 sanity check 就好
- **「結構 sanity check」≠「體感驗收」**：Cowork 抓 HTML 只能驗技術正確，UX 體感要 Paul 自己用瀏覽器跑。本 session 結案後邀請 Paul 體感驗收

### 遇到什麼阻礙

- **Paul 一度貼錯指令到 Cowork 視窗**（「Phase 4 Step E2 handoff」名稱誤植 + 偵察點不一致）：把 Code 端指令貼到 Cowork。我把它當「Cowork sanity check」處理代做唯讀偵察。**未來教訓**：跨視窗指令貼錯時 Cowork 應立刻指出名稱不符合 + 釐清意圖，不要硬跑
- **Code 報的 commit `cc42a2c`（之前 batch 2 教訓）這次沒重演**：Code 直接給對的 hash `2425965`，list_commits 驗證一致 ✅
- **GitHub MCP `get_file_contents` 對 articles/en/ 整個目錄回傳 74K 字元 token 爆掉**：改用 `search_code` filename filter 一篇一篇查。後續發現「不必查」——直接給 spec 讓 Code 本機 ls 即可

---

## §2 全部產出清單

### Commits 推上 main（按時間軸）

| Commit | 描述 | 推手 |
|--------|------|------|
| `2cce233` | handoff(code): Phase 4 i18n derived_from 同步 | Cowork（我）|
| `2425965` | wiki(phase4): sync derived_from to i18n translations（27 翻譯文 +104 lines）| Code |
| `5951af3` | chore(worklog): Phase 4 i18n sync done report | Code |
| （本 commit）| chore(worklog): Cowork B+D 合併收尾 | Cowork（我）|

### Issue #157

待新增 status comment（指向本 worklog + 累計成果更新）。

### Memory

待更新 `project_llm_wiki_phase4_done.md` 補 i18n 同步段（待本 worklog push 後同步）。

### 寫的 worklogs

| Path | 用途 |
|------|------|
| `worklogs/code--wiki-phase4-i18n-derived-from-sync-handoff-2026-04-28.md` | Cowork→Code handoff |
| `worklogs/code--wiki-phase4-i18n-derived-from-sync-done-2026-04-28.md` | Code→Cowork done report（Code 寫的）|
| `worklogs/cowork--wiki-phase4-i18n-and-northstar-closeout-2026-04-28.md` | **本收尾 worklog** |

---

## §3 i18n 同步成果結算

從 Phase 4 結案時的「9 篇 zh article / 25 entries / 10 unique sources」推進到：

**累計（zh + en + ja + zh-cn）**：
- 36 篇 article 寫了 derived_from（9 zh + 9 en + 9 ja + 9 zh-cn）
- 100 derived_from entries（4 語系各 25）
- 10 unique source keys（保持不變，跨語系共用 source slug，按設計）

**驗收基準**：
- validator strict：36 articles / 0 missing / 0 non-public ✅
- build-derived-index：10 unique / 100 entries 完美對稱 ✅
- pnpm build：835 pages 0 errors ✅
- pytest：180 passed ✅
- 視覺驗證：en `Derived from 3 sources` / ja `3 件の素材から派生` / zh-cn `衍生自 N 篇素材` ✅

**北極星狀態**：article ↔ source 雙向溯源閉環在「全 4 語系」完整。「碰撞引擎」第一塊地基鋪實——不只繁中讀者，英/日/簡讀者都能走「衍生自 → 反查 article」流程。

---

## §4 Phase 4.5 Candidate 觀察清單（D 北極星驗證實戰浮現）

從兩個 fetch 頁面實際看到的 UI/UX 改進機會：

### Candidate 1（高 ROI）— Source 端「N 篇引用」標題誤導

**現況**：高密度 source 顯示「被以下 16 篇文章引用」，但實際只有 4 篇主文章 × 4 語系。

**問題**：使用者看到「16 篇」會以為是 16 篇不同的文章，實際上有 12 篇是翻譯版本。

**改進選項**：
- (A) 改 heading 文案：「被 4 篇文章引用（含 12 個翻譯版本）」
- (B) 按 article_slug group：主行 + lang badges 並排
- (C) 預設只顯示原文（zh），提供「展開所有語系版本」toggle

**建議**：(B) 體感最好但工程量最大；(A) 最簡單；(C) 中等。

### Candidate 2（中 ROI）— lang-badge 標籤不一致

**現況**：source 端 ReferencedByArticlesSection 顯示「中」，article 端 lang switcher 顯示「繁」。

**問題**：同站兩處用不同標籤指向同一語系。

**改進**：全站統一改「繁」（短平快）。檔案：`src/components/ReferencedByArticlesSection.astro` line 35 `langDisplay()` function。

### Candidate 3（低 ROI / 設計取捨）— 跨語系跳轉斷層

**現況**：ja article 點 source 連結會跳到繁中 source 頁（因為 source 沒翻譯版）。

**問題**：日語讀者進入流程後 source 內容變繁中，體感小斷。

**改進**：屬 i18n 本質限制（source 沒翻譯版）。短期不處理，等 source 端要做翻譯時一起規劃。

---

## §5 旁路發現（不在 Phase 4.5 範圍）

**ja/zh-cn ai-collab-realtime-translator 是 stub 翻譯文**：
- Code 同步 derived_from 時順手補了 trailing newline 解 wiki_corpus_lib regex 問題
- 但 article body 仍空白（fetch 確認）
- 屬 paulkuo-writing 翻譯系列任務，不是 Phase 4 的工作
- 建議另開 issue 追蹤「ja + zh-cn ai-collab-realtime-translator 翻譯文補正體」

---

## §6 護欄遵守驗證

| 護欄 | 遵守狀態 |
|------|---------|
| A1 程式碼修改一律交 Code | ✅ frontmatter 寫入交 Code，Cowork 只做唯讀偵察 |
| B1 GitHub MCP 截斷意識 | ✅ `articles/en/` 整個目錄回傳爆 token → 改 search_code filename filter |
| B3 Sandbox ≠ Repo | ✅ 偵察用 GitHub MCP，不依賴 sandbox mount |
| C1 完成狀態現場查 | ✅ list_commits 驗證 `2425965` + `5951af3` |
| C3 偵察先行 | ✅ Cowork 預先 grep ArticlePage/DerivedFromSection/build-index 4 個檔 |
| C5 SSoT 變更下游重驗 | ✅ unique source keys 維持 10（無重複計數） |
| D2 視窗切換持久化 | ✅ handoff + done report + 本收尾全 push |
| 14 跨 repo 真相驗證 | ✅ Code 報 hash 用 list_commits 驗證一致，沒踩 batch 2 cc42a2c 那種坑 |
| feedback_handoff_flow_discipline | ✅ Cowork push handoff 後停下等回報，不預寫下一手 |
| feedback_propose_then_complete | ✅ Paul 拍 B+D 後 Cowork 直接補完所有細節 |

---

## §7 邀請 Paul 體感驗收（D 的真正完成式）

Cowork 做的是**結構 sanity check**——抓 HTML 看資料正確。**體感驗收要 Paul 自己跑**。

建議流程（10-15 分鐘）：

1. 開 https://paulkuo.tw/wiki/sources/getnote-072896-yang-tianrun-non-tech-claw-native/
2. 看「被以下 16 篇文章引用」清單，感受 Candidate 1 的問題嚴重度
3. 點任一篇 ja 翻譯文連結，看「衍生自 N 篇素材」section
4. 點裡面任一個 source 連結（會跳回繁中 source 頁，感受 Candidate 3）
5. 走完一輪，回報：
   - 哪些 Candidate 真的痛、要進 Phase 4.5？
   - 有沒有冒出新文章想法？（北極星的真正測試）
   - 有沒有觀察到我沒抓到的 UI/UX 缺口？

---

## §8 不在本 session 範圍（留下一階段）

- Phase 5 規劃（KV index + Worker API endpoint）— 獨立 session 處理
- paulkuo-writing skill 升級（Phase 5 上線後再做，避免返工）
- ja/zh-cn ai-collab-realtime-translator 翻譯補正體 — 另開 issue
- Phase 4.5（前面 3 個 candidate）— 等 Paul 體感驗收後拍板

---

## §9 模型 / Effort 紀錄

本 session：
- 模型：Claude Opus（Cowork 預設）
- Effort：medium-high（Phase 4 結案後第一個收尾 session，含工程偵察 + handoff + 結構驗證 + 收尾）
- Token 用量：未量化
- Session 時長：~3 hr

---

## §10 防重複執行 checklist

下個 [WIKI] session 開場時別重做：

- ❌ 不要重跑 i18n 同步（27 篇翻譯文已寫，Phase 4 i18n 完整）
- ❌ 不要重 push 已有 commits（`2425965` / `5951af3` / 本 commit）
- ❌ 不要重新做結構 sanity check（已驗證）
- ❌ Phase 4.5 candidate 別重發現（前 3 點已紀錄，第 4 點是 stub 另開 issue）
- ✅ 要做：依 Paul 體感驗收結果拍板 Phase 4.5 / 進 Phase 5 規劃 / 進 paulkuo-writing 升級

---

*產出：Cowork [WIKI] session 2026-04-28（Phase 4 i18n + 北極星驗證合併收尾）*

*下一手：Paul 體感驗收 → 拍板 Phase 4.5 vs Phase 5 vs C(skill 升級) 優先序*

*對齊 SKILL：session-handoff C 層 v1.0（A 層 v5.7）*
