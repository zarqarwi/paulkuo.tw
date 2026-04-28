# Code Handoff — Phase 4 Step F：derived_from frontmatter 寫入 batch 1（2026-04-28）

> 建立：2026-04-28 由 Cowork [WIKI] session 寫
> 接手 session：Code session
> 上游 brief：`worklogs/cowork--wiki-phase4-step-f-backfill-handoff-2026-04-28.md`
> 上游狀態：Phase 4 Code 端 A/B/C-prime/D/E1/E2 全綠（fb80a10）
> Cowork 已跑：sample 2 篇 → 提議清單 → Paul 裁決
> **建議模型**：Claude Haiku 4.5
> **Effort**：trivial（一個小 commit）

---

## 1. 任務

把以下 `derived_from` 寫進兩篇 article 的 frontmatter。
欄位型別 `string[]`（已在 `src/content.config.ts` articleSchema optional），加在 `tags:` 之後。

### Article 1：`src/content/articles/knowledge-pipeline-not-discipline.md`

```yaml
derived_from:
  - getnote-403816-lobster-talk-launch
  - getnote-498792-claude-skills-guide
  - getnote-077512-wanweigang-qa-constraints
```

### Article 2：`src/content/articles/ai-collab-realtime-translator.md`

```yaml
derived_from:
  - getnote-703240-ai-coding-harness-engineering
  - getnote-072896-yang-tianrun-non-tech-claw-native
  - getnote-439768-talk-cheap-code-cheap
```

---

## 2. 裁決理由（Cowork 提議內容，給 Code 留 reference）

### knowledge-pipeline-not-discipline（2026-03-29 心得文）

| Source slug | 推薦理由 |
|---|---|
| `getnote-403816-lobster-talk-launch` | article 結尾「管線產出範例」直接 link 到 `/lobster-decameron`；這篇 source 是十日談發刊篇，是 Paul 建這條知識管線的近因之一。 |
| `getnote-498792-claude-skills-guide` | article 第四階段「使用」直接點名 Cowork Skill 用自然語言查；source 解釋 Skill 是「給 AI 的操作手冊」、隱性知識顯性化，是分類管線的方法論底層。 |
| `getnote-077512-wanweigang-qa-constraints` | article 中段以「萬維鋼那門課我上到哪了」作為課程系列偵測的 demo；這篇 source 正是被管線消化的萬維鋼課程內容代表。 |

### ai-collab-realtime-translator（2026-03-12 心得文）

| Source slug | 推薦理由 |
|---|---|
| `getnote-703240-ai-coding-harness-engineering` | article 三段（Code Review 抓三 bug／拆 Phase A/B 獨立可驗證／AI 不會主動巡邏）幾乎逐項對應 source 的「自校正閉環、前饋 Guides + 反饋 Sensors、人類隱性 Harness」。同一套 Harness 哲學的個人化實踐。 |
| `getnote-072896-yang-tianrun-non-tech-claw-native` | article thesis「AI 協作的核心能力不是寫程式，是把問題說清楚」，跟 source 楊天潤「龍蝦原生：知識詛咒反轉，非技術背景者反而能發揮 AI」是雙生主張。 |
| `getnote-439768-talk-cheap-code-cheap` | article 用 €476 vs $0.50/場 做出個人版 cost relevation，正是 source「程式碼廉價化、判斷力變稀缺」的台灣個人實踐。 |

---

## 3. Cowork 已驗證

- 6 個 source slug 都讀過 frontmatter，**visibility=public** 全部通過（E1 validator 不會擋）
- 6 個 slug 都在 `src/content/wiki/sources/` 真實存在
- 兩篇 article 路徑都驗證存在

---

## 4. 驗收

| 步驟 | 通過標準 |
|------|---------|
| `python3 scripts/wiki-derived-from-validate.py --strict` | exit 0（6 個 slug 全在 wiki/sources/，無 dangling） |
| `pnpm wiki:build-derived-index` | stdout 印 `built 6 entries from 2 articles`（或 prebuild 自動跑） |
| `pnpm build` | 不變或 +0 page，0 errors |
| `pytest` | 180 不變 |
| 視覺檢查 | 兩篇 article 頁面看到「衍生自 3 篇素材」section；6 篇 source 頁面分別看到「被以下 1 篇文章引用」section |
| `data/wiki-derived-index.json` | prebuild 重生後含 6 個 source key，每個 key 1 個 article entry |

---

## 5. 約束

- **不動其他 article**：本批只動這 2 篇（首批示範），跑通驗收後下批再擴展
- **不動 source frontmatter**：雙向同步靠 build-time JSON，不污染 source 的 `linked_from`
- **多語系翻譯文（en/ja/zh-cn）本批不同步**：先讓 zh 主語系跑通驗收
- **不一次寫太多**：6 entry 是刻意保守，frontmatter 出錯能快速回滾

---

## 6. Commit message 建議

```
wiki(phase4): backfill derived_from for 2 articles (Step F batch 1)

- knowledge-pipeline-not-discipline: 3 sources (lobster-talk-launch / claude-skills-guide / wanweigang-qa-constraints)
- ai-collab-realtime-translator: 3 sources (ai-coding-harness-engineering / yang-tianrun-non-tech-claw-native / talk-cheap-code-cheap)

All 6 sources verified visibility=public (Cowork pre-checked).
Validator strict pass expected. Step E visual verification can run after this commit.

Refs: #157
```

---

## 7. 完成後

- 寫 commit log push 到 `main` branch（**注意**：paulkuo.tw 用 main，不是 master，跟 get-biji-notes 不一樣）
- 回 Issue #157 加一行：「Phase 4 Step F batch 1 done — 2 articles / 6 derived_from entries」
- 寫個短 Code→Cowork 回報（filesystem MCP 寫本機 + GitHub MCP push），讓下個 Cowork session 知道 batch 1 已綠，可以決定 batch 2 範圍

---

## 8. 風險與緩解

| 風險 | 緩解 |
|------|------|
| article frontmatter 已有其他 schema 欄位順序敏感 | derived_from 統一加在 `tags:` 之後；Schema optional，順序不影響 build |
| validator 對 slug 比對嚴格（含/不含 .md 副檔名）| 本 handoff 提供純 slug（無 .md），對齊 `wiki-derived-from-validate.py` 邏輯 |
| 視覺驗收時 source 端「被引用」section 沒出現 | 檢查 `data/wiki-derived-index.json` 是否被 prebuild 重生；若沒，手跑 `python3 scripts/wiki-build-derived-index.py` |
| 兩篇 article 之一 frontmatter 已有 `derived_from` 欄位 | 不應該（上游 brief 寫 0 篇真實填了）；如真有就 merge slug list，不覆蓋 |

---

## 9. 不在本 Code handoff 範圍

- 不動其他 article 的 derived_from（之後 batch 2 再做）
- 不動 source frontmatter
- 不動 schema / build script / UI 元件（Phase 4 Code 端已關門）
- 不做多語系翻譯文同步

---

*產出：Cowork [WIKI] session 2026-04-28（Step F batch 1 sample 完成 + Paul 裁決）*

*下一手：Code session 接 frontmatter 寫入 → push → 回報後 Cowork 決定 batch 2*
