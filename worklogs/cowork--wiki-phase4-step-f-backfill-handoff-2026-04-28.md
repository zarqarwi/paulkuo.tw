# Cowork→Cowork Handoff — Phase 4 Step F：backfill 提議 batch（2026-04-28）

> 建立：2026-04-28 由 Cowork session（Phase 4 規劃 + 執行 session，已跑 7 commits）寫
> 接手 session：下一個 Cowork [WIKI] session（開新 session 為了 context 乾淨）
> 工作性質：Cowork batch（不是 Code handoff），跑分析、列候選清單、Paul 裁決
> **建議模型**：Claude Sonnet 4.6（這個 session 寫過程都用 Sonnet）
> **Effort**：1-2 hr 一輪（含 sample + batch 5-10 篇）

---

## 1. Phase 4 現況快照

**Code 端全部關門**（pytest 180 pass / consistency-check 12 refs / pnpm build 835 pages 0 errors）：

| Step | Commit | 內容 |
|------|--------|------|
| A | `fda5a7a` | scripts/wiki-build-derived-index.py + 8 tests |
| B | `6df22ab` | ArticlePage「衍生自」section + DerivedFromSection.astro |
| C-prime | `dd30e98` | wiki/sources/[slug].astro 獨立路由 + SourcePage + ReferencedByArticlesSection |
| D | `b5d896d` | package.json prebuild + predev + wiki:build-derived-index |
| E1 | `8c99d49` | wiki-derived-from-validate.py + build script visibility 檢查 |
| E2 | `fb80a10` | DerivedFromSection.astro lang prop + 4 語系翻譯 |

**真實 corpus 統計**（Step E1 跑出來的）：
- public source: **281**
- internal source: **31**（跟之前儀表板 41 略有出入，可能部分缺 visibility 欄位 — 留意但不阻擋本 step）
- 0 篇 article 真實填了 derived_from（本 step 才開始填）

**北極星地基**：article ↔ source 雙向 UI 完整，validator 強制 public-only，prebuild 自動化，i18n 4 語系。剩 Step F backfill 給它「真實內容」+ Step G 收尾。

---

## 2. Step F 工作流程（建議）

按 Phase 4 規劃文件定義，Step F 是「Cowork 提議清單 → Paul 裁決 → Code 寫進 frontmatter」。本份 handoff 寫給 Cowork 自己接手用。

### 階段 1：sample（建議 1-2 篇先試）

選 1-2 篇近期心得文當試水溫，確認候選清單格式 Paul 看得順、推薦理由能不能讓 Paul 快速 yes/no。

**動作**：
1. 列出 `src/content/articles/*.md`（zh 主語系優先，挑 2026 年發佈的近期文）
2. 挑 1-2 篇 sample，用 GitHub MCP `get_file_contents` 讀完整內容
3. 對每篇 sample：
   - 讀 article body 全文
   - 抓出文中明顯引用、提到的人名 / 概念 / 文章標題 / 視頻
   - 用 GitHub MCP `search_code` 在 `src/content/wiki/sources/` 搜尋相關 source（grep title / raw_source 對應字眼）
   - 對每個 hit 確認 `visibility === 'public'`（**E1 validator 會擋 internal，candidate 一定要 public**）
   - 給每個候選一個推薦理由（一句話，例如「文中明確引用得到專欄『XXX』」）
4. 輸出格式（建議 markdown 表）：

```markdown
## Article: <article-slug>

文章標題：「...」
發佈日期：2026-XX-XX
Pillar：ai

**建議 derived_from**：

| Source slug | Source title | 推薦理由 |
|-------------|--------------|---------|
| <slug-1> | 「素材標題」 | 文中第三段引用此素材的論點 |
| <slug-2> | 「素材標題」 | 文章主題核心觀念來自此素材 |
| ... |
```

5. Paul 逐筆 yes / no / swap，最終確認的清單交給 Code 寫進 frontmatter

### 階段 2：batch（5-10 篇）

Sample 格式對之後做 batch：
- 一次跑 5-10 篇，集中 Paul 一次裁決時段（避免散開節奏被打斷）
- 提議清單可以放 outputs/ 或推上 paulkuo.tw workspace
- Paul 裁決完，Cowork 把確認清單整理成 Code handoff，內容是「這 N 篇 article 的 frontmatter 加上對應 derived_from slug」
- Code session 接手 N 個 article frontmatter 改動 + commit

### 階段 3（後續 batch）

Step F 不必一次做完所有 article。第一輪 5-10 篇上線後就有實際資料給 Step G / 北極星驗證，後續 batch 可以慢慢來，跟著新文章寫作流程同步。

---

## 3. 約束與護欄

- **候選必須 visibility=public source**：E1 validator 會擋 internal，候選清單在生出來時就過濾
- **不亂猜**：候選必須是 article 真的引用、提到的素材，不是「主題相關」就推薦（會稀釋訊噪比）
- **推薦理由要具體**：一句話寫清楚為什麼這個 source 跟這篇 article 有關，避免「都跟 AI 有關」這種空泛
- **不直接寫 frontmatter**：Cowork 跑分析、列清單；Paul 裁決後**寫成 Code handoff** 交給 Code 改 frontmatter（按 `feedback_session_output_attribution`，frontmatter 改動屬於 Code 範圍）
- **多語系暫不處理**：先補 zh 主語系 article，en/ja/zh-cn 翻譯文之後再說（翻譯文沿用原文 derived_from 即可）
- **不破 0 篇現狀的紀律**：本 step 開始前 0 篇 derived_from，跑完應該是 ~5-10 篇，每筆都是 Paul 親自確認過的

---

## 4. 候選 article 建議（給下個 Cowork 入手用）

下個 Cowork 開場可以從這幾類 article 挑 sample：

1. **2026 年最近發佈的心得文**（路徑 `src/content/articles/*.md` 直接子層）
2. **AI / startup pillar 為主**（這兩個 pillar 的 source 最豐富，比對命中率高）
3. **明確引用素材的文章**（標題或副標含「讀」/「看」/「從...學到」/「XXX 教我」等模式）
4. **避開純觀察 / 純抒發類**（這類文章本來就很少引用具體素材）

具體可以先 `git log --oneline src/content/articles/ | head -20` 找最近改動的，挑代表性的 sample。

---

## 5. 候選工具

下個 Cowork session 可用：

- **GitHub MCP**：`get_file_contents` 讀 article 全文 / source frontmatter；`search_code` 搜尋 wiki sources
- **本機 grep / find**（透過 Bash workspace mount）：批次掃描快
- **Step A 的 build script**：`pnpm wiki:build-derived-index --strict` 跑出來的 stdout 統計可以驗證 candidate slug 真的是 public（runs 後 strict 模式會擋）
- **wiki_corpus_lib helper**（跑本機 Python 時可用）：load_source / iter_source_paths

不需要寫新 script——這個 step 是「分析 + 整理」工作，手動加機械化抽樣即可。

---

## 6. 完成 Step F 的判定

Step F 不是「全部 article 都填完」，而是「**第一批示範完成**」：

- 至少 5-10 篇 article 真實填了 derived_from
- `pnpm wiki:build-derived-index` 出來的 JSON 有實際 entries
- 隨機開一篇填過的 article 看「衍生自 N 篇素材」section 顯示正確
- 隨機開一個被引用的 source 頁看「被以下 N 篇文章引用」section 顯示正確

達到後就能進 Step G（SSOT + Issue #157 收尾），後續 batch 跟著寫作流程同步補。

---

## 7. 重要 memory 引用

下個 Cowork session 開場 / 進行中可以參考：

- `feedback_handoff_flow_discipline`（停手等回報，三種流向區分）
- `feedback_session_output_attribution`（Cowork 不直接動 frontmatter，交給 Code）
- `feedback_verify_route_exists_before_phase_planning`（規劃 / handoff 前 grep 驗證）
- `feedback_terminal_cd_explicit`（指令絕對路徑）
- `feedback_model_recommendation`（handoff 附建議模型 + Effort）
- `project_llmwiki_northstar`（碰撞引擎：「接住碰撞瞬間」是 Step F 的真正目的，不是「填欄位」）

---

## 8. 開場 prompt 範本（給 Paul 用）

下個 Cowork [WIKI] session 開場時，貼這段：

```
[WIKI] 接 worklogs/cowork--wiki-phase4-step-f-backfill-handoff-2026-04-28.md

Phase 4 Code 端全部關門（fb80a10），剩 Step F backfill。

讀這份 Cowork→Cowork 交接 handoff 後：
1. 先做 sample 1-2 篇（挑 2026 年近期心得文）
2. 跑 article body + wiki sources 比對，列 derived_from 候選清單
3. 候選必須 visibility=public（E1 validator 會擋 internal）
4. 每筆推薦理由要具體
5. 列完讓 Paul 裁決
```

---

## 9. 不在 Step F 範圍

- 不寫 frontmatter（Code 範圍）
- 不動 schema / build script / UI 元件（Phase 4 Code 端已關門）
- 不做翻譯文 derived_from（多語系暫不處理）
- 不一次跑全部 article（分批，第一輪 5-10 篇就好）

---

## 10. 為什麼開新 session

當前 Cowork session 已經跑：
- Phase 4 規劃（4 個 AskUserQuestion 拍板）
- cleanup chore
- Step A / B / C-prime（含規劃失誤返工）/ D / E1 / E2
- 7 個 handoff 文件 push
- 5+ 次 memory 更新

context 龐大，新 session 開乾淨上下文做 Step F 比較順——這也是 `feedback_session_single_project` 的精神：一個 session 主責一個工作面，工作面切換就換 session。

---

*產出：Cowork session 2026-04-28（Phase 4 主 session），Code 端關門後 Cowork→Cowork 交接 Step F*

*下一手：Paul 開新 Cowork [WIKI] session，貼第 8 段開場 prompt 開工*
