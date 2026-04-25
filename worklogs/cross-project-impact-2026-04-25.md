# 跨專案影響掃描 2026-04-25

> 掃描視窗：2026-04-24T00:00:00Z → 2026-04-25T02:40Z（近 24 小時）  
> 來源：`docs/shared-file-impact-map.md` + 三專案 commits  
> 產出者：scheduled task `cross-project-governance`

## 監測專案範圍

- `zarqarwi/paulkuo.tw` — 45 commits（詳見 `data/governance-metrics-2026-04-25.json`）
- `zarqarwi/formosa-esg-2026` — **repo 不存在**（subproject 路徑在 paulkuo.tw 內，非獨立 repo），跳過
- `zarqarwi/get-biji-notes` — 0 commits，跳過

## 共用檔案掃描（極高風險 + 跨專案共用模組）

對 `docs/shared-file-impact-map.md` 定義的共用檔案做 commit message 比對：

- `worker/src/index.js` · `config.js` · `utils.js` · `auth.js` — **無命中**
- `src/layouts/BaseLayout.astro` · `NavBar.astro` · `SiteHead.astro` · `SiteFooter.astro` · `I18nClient.astro` — **無命中**
- `src/data/siteSchema.ts` — **無命中**
- 跨專案模組 `worker/src/translator.js` · `scorecard.js` · `status.js` — **無命中**
- 子專案模組（`worker/src/formosa.js` · `wiki-api.js` · `acp.js` · `eval-worker/src/index.ts` · `ai-ready-opt/*.py` 等）— **無命中**
- `AUTH_DB` schema / KV / R2 變更 — **無命中**

## 本日 commits 的影響標註統計

- 有明確 `[影響: ...]` 標註：governance / hygiene / data / 治理文件 / 僅治理 等，合計約 12 筆
- bot commits（github-actions + ai-ready-bot）2 筆，屬 auto 系列，不在人工標註範圍
- wiki-daily 系列（clips / scanner / report）30 餘筆，觸及 `src/content/wiki/` 與 `worklogs/` — 屬 Wiki 子專案內部變更，不觸及 impact-map 共用模組；依慣例不需跨專案影響標註

## ⚠️ 漏標注警示

**無。**

24 小時內人工 commits 皆落在以下目錄，未觸及 impact-map 共用檔案：
- `docs/governance/` · `docs/refactor-plans/`
- `handoffs/` · `handoffs/done/`
- `worklogs/` · `PENDING.md`
- `.claude/skills/`
- `.gitignore`
- `data/`（ai-ready-bot auto 產出）
- `src/content/wiki/`（wiki-daily clips）

## ⚠️ 漏測試警示

**無法判定（工具限制）。**

治理 MCP 不含 `/actions/runs` 或 CI 狀態 endpoint，無法掃過去 24 小時 smoke test 實際執行記錄。由於 Step 1 共用檔案零命中，Step 2 無需交叉比對 smoke test 是否執行過。

## 結論

✅ 24 小時內無跨專案風險 — 所有變更集中在治理層（docs/governance、handoffs、worklogs、.claude/skills）與 Wiki 內部資料層（src/content/wiki、data），未觸及 `worker/src/*.js` / `src/layouts/*.astro` / `src/components/*.astro` / `src/data/siteSchema.ts` 等會影響多個子專案的檔案。

## 附：24h commits 摘要（paulkuo.tw）

| 時間（UTC） | SHA | 類別 | 摘要 |
|---|---|---|---|
| 04-25 01:45 | `0557904` | wiki | report: 2026-04-25 完成 |
| 04-25 01:44 | `054cfa0` | wiki | scanner: 雲端部分掃描 |
| 04-25 01:43 | `ca53dc6` | worklog | Code session handoff 收尾（H8 四維度） |
| 04-25 01:42 | `807fac2` | governance | archive code handoff for ADR-INDEX + branch protection |
| 04-25 01:41 | `da2dd9e` | wiki | clips: 新增 13 則 |
| 04-25 01:37 | `734bee6` | revert | revert 63a8b76 |
| 04-25 01:35 | `63a8b76` | governance | archive code handoff (reverted) |
| 04-25 01:22 | `279d62e` | worklog | Cowork session H1-H9 handoff 歸檔紀錄 |
| 04-24 17:51 | `d46ff7f` | governance | branch protection audit + park v2.0/v2.1 |
| 04-24 17:51 | `cbf81cb` | adr | ADR-INDEX |
| 04-24 16:36 | `e0063f3` | governance | archive H1-H9 legislative handoff |
| 04-24 16:23 | `75ff2e1` | governance | 落地 Chat 六項治理議題 ADR（H1/H2/H5/H7/H8/H9） |
| 04-24 15:24 | `ad158ed` | worklog | Code session H1-H9 裁決寫入（H8 四維度範本） |
| 04-24 15:22 | `d4f03ae` | governance | Chat 六項裁決寫入 PENDING.md |
| 04-24 15:12 | `58eb53b` | governance | Cowork 晚間收尾 — H3/H4 handoff |
| 04-24 14:27 | `116ea6c` | governance | repo hygiene 完成 — worklog + handoff 歸檔 |
| 04-24 14:26 | `ad75dbe` | data | auto: data update 2026-04-24 |
| 04-24 14:26 | `b188601` | governance | 補 commit 治理檔 + PDF gitignore |
| 04-24 14:26 | `50bdc0a` | hygiene | 清理 iCloud 衝突副本 57 個 |
| 04-24 13:56 | `ee53ea6` | governance | 新增 Code handoff repo hygiene |
| 04-24 13:49 | `694c2d4` | governance | H6 命名消歧 ADR + 當日 worklog |
| 04-24 13:48 | `d0d52fe` | governance | Chat 立法 handoff + PENDING.md 五符號 schema |
| 04-24 06:16 | `1c49759` | governance | WE rev2.3 + quick-ref rev2 |
| 04-24 04:49 | `f3e64b8` | bot | auto(scanner): daily audit 2026-04-24 |
| 04-24 04:20 | `340f60a` | bot | external eval temporal baseline 2026-04-24 |
| 04-24 02:42 | `36793bb` | governance | [governance] impact: 2026-04-24（昨日本 task 產出） |
| 04-24 02:41 | `7c5444b` | governance | [governance] metrics: 2026-04-24（昨日本 task 產出） |
| 04-24 01:51 | `62c6a6e` | wiki | report: 2026-04-24 完成 |
| 04-24 01:49 | `766da28` | wiki | scanner: 2026-04-24 cloud-side 掃描完成 |
| 04-24 01:44~40 | 16 commits | wiki | clips: 新增 16 則（faith/ai/circular/startup/life pillars） |

共 45 commits。
