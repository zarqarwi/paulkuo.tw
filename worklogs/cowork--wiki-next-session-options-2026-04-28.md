# Cowork→Cowork Handoff — Wiki Phase 4 後續候選工作面（2026-04-28）

> 建立：2026-04-28 由 Cowork [WIKI] session（Phase 4 結案 session）寫
> 接手 session：下一個 Cowork [WIKI] session（依 `feedback_session_single_project`，Paul 拍板優先序後開乾淨 session 開工）
> 目的：列候選工作面 + 每個的入手資訊，讓 Paul 挑下一個推進方向

---

## Phase 4 後現狀快照

**Phase 4 全部完成（A→G 七步全綠）**：
- 9 articles / 25 entries / 10 unique sources
- 雙向 UI（衍生自 + 被引用）+ 4 語系 i18n + validator strict + prebuild 自動化
- 北極星地基鋪好：article ↔ source 雙向溯源閉環

**驗收基準**：pytest 180 / consistency-check 12 refs / pnpm build 835 pages / 0 errors

**詳細 commits + 累計成果**：見 memory `project_llm_wiki_phase4_done.md` / [Issue #157 結案 comment](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4332976879) / `worklogs/wiki-phase4-derived-reverse-index-2026-04-28.md`

---

## 候選工作面（4 選 1，按推薦序）

### 選項 A — Phase 5 規劃 session（推薦）

**做什麼**：拍板 Phase 5「KV index + Worker API endpoint」的工程切法。

**為什麼推薦**：
- 接續 Phase 4 自然延伸——已建好的 `data/wiki-derived-index.json` 推進 KV，再開 Worker API endpoint 給未來 Phase 6 visualization 或對外查詢用
- 北極星「碰撞引擎」要從「人讀 UI」進化到「程式可調用」，KV + API 是必經之路
- Phase 4 規劃文件 (`cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md`) 是現成範本，可照樣寫出 Phase 5 規劃

**入手注意**：
- Cowork 直接動 KV key 受限（按 `feedback_cowork_no_kv_key_ops`，只能到 namespace 層級，KV key get/put/delete 必須走本機 wrangler 或自建 Worker endpoint）→ 規劃 KV seed 流程時要設計成「本機跑 wrangler 寫 KV」或「Worker endpoint 自我 seed」
- 既有 KV namespace `TICKER_KV` 跟主站共用，要不要拆獨立 namespace 是 Phase 5 拍板點之一
- 既有 `scripts/wiki-kv-seed.cjs` 是 wiki sources 的 KV seed，新增 derived_from index 可以共用框架或拆新 script

**建議模型**：Sonnet 4.6（規劃 session 需判斷力）
**Effort**：1-2 hr 規劃 + 拍板（不含實作；實作交 Code 後續 session）

**開場 prompt 範本**：
```
[WIKI] Phase 5 規劃 — derived_from KV index + Worker API endpoint

接續 Phase 4 全閉環（commit 1f8173f）。Phase 5 要把 data/wiki-derived-index.json
推進 KV，再開 Worker API endpoint 讓 derived_from 反向索引可被程式調用。

讀 cowork--wiki-phase4-derived-reverse-index-plan-2026-04-28.md 當範本，
按 Phase 5 拍板 4-5 個關鍵點（KV namespace 拆/共用 / API path / 認證 / cache TTL / seed 流程）後產出規劃文件。
```

---

### 選項 B — 多語系翻譯文 derived_from 同步

**做什麼**：把 batch 1+2 的 9 篇 zh article 已寫的 derived_from，同步到對應的 en/ja/zh-cn 翻譯文 frontmatter。

**為什麼推薦**：
- Phase 4 期間 Step F batch 1+2 都跳過翻譯文（先讓 zh 跑通驗收）
- 翻譯文 derived_from 沿用原文（不需另作 sample 比對），是純機械化任務
- 補上後 i18n 雙向 UI 的非 zh 語系版本才完整顯示

**入手注意**：
- 9 篇 zh article 中有些有 en/ja/zh-cn 翻譯（不是每篇都有），要先 grep `src/content/articles/{en,ja,zh-cn}/` 確認對應檔
- 翻譯文 frontmatter 結構可能跟 zh 略有差異（沒 thesis / domain_bridge 等 AI 欄位），derived_from 統一加在 `tags:` 之後即可
- validator E1 對翻譯文也會 strict 檢查，slug 都對應 wiki/sources 即可
- 估計總翻譯文數量：~15-25 篇（每篇 zh article 平均有 2-3 個語系翻譯）

**建議模型**：Haiku 4.5（純機械同步，不需判斷力）
**Effort**：low（Cowork 列同步清單 → Code 寫 frontmatter，~1 hr 一輪）

**開場 prompt 範本**：
```
[WIKI] 多語系 derived_from 同步

把 batch 1+2 的 9 篇 zh article 已寫的 derived_from 同步到 en/ja/zh-cn 翻譯文。
讀 project_llm_wiki_phase4_done.md 確認 9 篇清單。
grep src/content/articles/{en,ja,zh-cn}/ 找對應翻譯文，列同步清單後寫 Code handoff。
```

---

### 選項 C — paulkuo-writing skill 升級「寫作時就填 derived_from」

**做什麼**：把 backfill 流程整合進寫新文章的常規流程，讓寫文章六幕結構時就自然填 derived_from 欄位。

**為什麼推薦**：
- 避免未來文章再做 backfill batch 的工（「寫的時候就填好」永遠比「事後補」省力）
- 北極星「碰撞引擎」最好的觸發時機就是寫作當下——記錄文章從哪些素材撞出來，最準確的時機是寫作者自己還記得的時候
- 升級 skill 是 once-off 投資，後續所有文章自動受益

**入手注意**：
- skill 檔案在 `paulkuo-writing.skill` 或 `~/.claude/skills/paulkuo-writing/SKILL.md`（具體路徑要查）
- 升級點：寫作 Pipeline Phase 中加入「derived_from 候選提示」步驟，讓寫作者輸入素材引用時就同步建議 wiki source slug
- 跟 Cowork 提議流程不衝突：寫作時的 derived_from 是「即時提議」，Cowork 的是「事後審查」，可並行

**建議模型**：Sonnet 4.6（skill 設計需要對寫作流程的全貌判斷）
**Effort**：medium（skill 改動 + 試跑一篇新文章驗證流程）

**開場 prompt 範本**：
```
[WIKI] paulkuo-writing skill 升級 — derived_from 寫作時即填

把 derived_from backfill 流程整合進寫新文章流程。
讀 paulkuo-writing.skill 找對的注入點（建議在六幕結構的素材引用段），
讓寫作者輸入素材引用時就同步建議 wiki source slug。
試跑一篇新文章驗證流程能跑通。
```

---

### 選項 D — Phase 4 北極星驗證 session

**做什麼**：實戰跑一輪「碰撞引擎」流程，驗證 Phase 4 雙向 UI 對 Paul 的真實工作流是否有用，不夠的地方提出 Phase 4.5 調整。

**為什麼推薦**：
- Phase 4 雖閉環，但「驗收綠」不等於「使用上順手」——北極星驗證 session 是把工程驗收升級成體感驗收
- 如果發現 UI 缺什麼（例如 source 端排序、article 端 hover 預覽、graph view），可以提早抓出來進 Phase 4.5
- 對 Paul 個人寫作流程有直接 ROI（找到下一篇要寫的心得文題材）

**入手注意**：
- 不是工程任務，是工作流驗證任務
- 建議流程：開 paulkuo.tw/wiki/sources/getnote-072896-yang-tianrun-non-tech-claw-native（最高密度 source）→ 看「被以下 4 篇文章引用」清單 → 點進 article → 反查「衍生自 N 篇素材」→ 評估是否能誘發新文章想法
- 結束後寫個短回饋 worklog，列出 UI/UX 觀察 + Phase 4.5 candidate

**建議模型**：Sonnet 4.6（驗證需要對 Paul 工作流的同理心）
**Effort**：30 min - 1 hr（實戰測試 + 觀察筆記）

**開場 prompt 範本**：
```
[WIKI] Phase 4 北極星驗證 — 碰撞引擎實戰

跑一輪實戰：開 paulkuo.tw/wiki/sources/getnote-072896-yang-tianrun-non-tech-claw-native
（被引用最高密度 source）→ 看「被引用 4 篇」清單 → 點進 article 反查「衍生自」section
→ 評估這個雙向溯源是否能誘發新文章想法。
觀察 UI/UX 缺什麼，列 Phase 4.5 candidate。
```

---

## 推薦優先序

我建議的優先序：**A > B > D > C**

理由：
- **A（Phase 5 規劃）** — 工作脈絡最連貫，有 Phase 4 規劃文件當範本省力
- **B（翻譯文同步）** — 純機械化、ROI 確定，跟 A 並行不衝突，但 Phase 4 實質完整度較低（i18n UI 還缺翻譯文資料）
- **D（北極星驗證）** — 短時長、體感型，可當 A 之間的休息站
- **C（skill 升級）** — 設計開放度高，建議等寫過 1-2 篇新文章發現痛點後再做

---

## 不限定範圍

如果 Paul 想做別的（例如先寫新文章、處理其他專案），上述 4 選項都可暫緩，留給更下一個 [WIKI] session。Phase 4 已關門乾淨，沒有 dangling state 要清。

---

## Cowork 紀律提醒

- 上一個 session 寫過很多 handoff 跟 push 多個 commit，**新 session 開乾淨上下文**比硬接這個 session 更順（按 `feedback_session_single_project`）
- 開新 session 時貼上面選好的開場 prompt 即可，不必重述 Phase 4 細節（memory 自會載入）

---

*產出：Cowork [WIKI] session 2026-04-28（Phase 4 結案 session）*

*下一手：Paul 拍板優先序 → 開新 [WIKI] session 貼開場 prompt 開工*
