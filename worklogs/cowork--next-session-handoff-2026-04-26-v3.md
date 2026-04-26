# Cowork Session Handoff — 2026-04-26 → 下次（v3）

承接 v2，本 session 完成 D 項目其中一筆 + 跨專案影響盤點 + 抓到一個 parser bug。

---

## 開場必讀

1. **這份 v3**
2. **[v2 handoff](https://github.com/zarqarwi/paulkuo.tw/blob/main/worklogs/cowork--next-session-handoff-2026-04-26-v2.md)** — 上輪詳細紀錄、Code handoff 9 段格式、Cowork do/don't、跨 session 工具地圖
3. **[Issue #157 儀表板](https://github.com/zarqarwi/paulkuo.tw/issues/157)** + 最新 [progress comment](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4322106624)
4. **memory：** `feedback_handoff_flow_discipline`、`feedback_cross_project_impact`、`feedback_cowork_no_kv_key_ops`、`user_agent_collab`（已更新）

---

## v2 → v3 delta（本 session 做了什麼）

### ✅ paul_perspective L3 第三筆
- 透過對話寫進 `harness-engineering.md`
  - `1e9c983` 主體 push
  - `769dfe0` YAML 格式 fix（`>-` block scalar → single-line double-quoted）
- 觀點主題：使用者側 Harness 體感、面具識別、雙向演化
- ⚠️ 發現實情：先前已有 2 筆（`one-person-team` / `human-judgment-in-ai-era`），所以這是第三筆不是首筆

### ✅ 跨專案影響盤點完成
| 系統 | 是否引用 paul_perspective |
|------|---------------------------|
| 前端 `src/pages/wiki/[slug].astro` | ❌ 不 render |
| Worker API `wiki-api.js` | ❌ 不 expose |
| `scripts/wiki-kv-seed.cjs` | ✅ 整包 frontmatter 寫入 KV |

→ 結論：paul_perspective 目前是「素材庫」性質，無 user-facing 影響。

### ⚠️ 新發現的 bug
**`scripts/wiki-kv-seed.cjs` 手寫 YAML parser 不支援 block scalar**
- `>-` / `|-` 開頭多行字串會被解析成 `">-"`、內容全丟
- 已用 single-line double-quoted 規避
- 中期 ToDo 加入：parser 換成 `js-yaml` / `gray-matter`

### 📊 paul_perspective 現況（保守估計）
- 已有內容：3 筆
- 空白占位：約 35 筆（mount 限制只能驗證 13 個）

---

## Wiki 完整待辦清單（按急迫度排序）

### 🔴 短期（純工程，可 Code 閉環）
| # | 任務 | 工作量 | 第一步 |
|---|------|------|------|
| 1 | 🆕 `wiki-kv-seed.cjs` parser 換 js-yaml | Cowork 5 + Code 15 min | 直接 handoff Code |
| 2 | YouTube blocklist 擴充（支援 youtube_id key）| Cowork 15 + Code 30 min | 讀 `wiki-youtube-ingest.cjs` |
| 3 | C - Dialogue marker 機制 | Cowork 30 + Code 60-90 min | Cowork 寫 design doc 給 Paul 選方案 |
| 4 | Enrichment 邏輯改良（區分 wrong_pillar vs concept_gap）| Cowork 20 + Code 45 min | 讀 `wiki-enrich.cjs` |

### 🟡 中期（含 Paul 參與決策 / 持續工程）
| # | 任務 | 性質 | 備註 |
|---|------|------|------|
| 5 | D - paul_perspective 繼續寫 | Paul 寫，Cowork 輔助 | 已 3 / 38，下一筆推薦 `content-moat`（對應碰撞引擎北極星）|
| 6 | 🆕 paul_perspective 前端 UI render 決策 | UI/UX 討論 | 等決定再做 [slug].astro 修改 |
| 7 | getnote 商業管理類 concept 審查 | 內容策展 | 30+ 筆累積 |
| 8 | 4 則 04-26 ingest 跑 wiki-enrich.cjs | 工程小 | 補 concept_links / quotes / chapters |
| 9 | get_筆記 repo 化 + scanner 改 GitHub API | 中型 | 已有 plan，等開工 |

### ⏸️ 阻塞中（不能做）
- keep+wait 5 支 wrong_pillar re-enrich — 要等 concept 庫補完 faith/life/社會學主題

### 🟢 長期（架構願景）
- L3 演化層完整設計（文章 ↔ 素材溯源、觀點演化追蹤）
- Concept 頁面目標 50+（目前 38）
- Pre-commit hook 用 husky 接 consistency check

---

## 下個 session 建議（不要一次抓太大）

### 推薦：`wiki-kv-seed.cjs` parser 換 js-yaml（任務 #1）
- 工作量最小（30 min 內）
- 解決 paul_perspective 寫作後顧之憂
- 純工程，不卡 Paul

### 次推薦：YouTube blocklist 擴充（任務 #2）
- 沿用 v2 推薦
- 也是純工程

### 不推薦
- D（paul_perspective）連續寫 — 本輪剛寫一筆，連續寫易疲勞
- 前端 render UI — 需 Paul 在線討論，不是純工程

---

## 不重複 v2 的內容

下列內容 v2 已寫完整，請去 v2 看：
- 04-26 上輪完成項目（A wrong_pillar、B sensitivity）
- Code handoff 9 段格式
- Cowork do/don't
- Code 行為觀察
- 跨 session 工具地圖
- 04-26 上輪完整 commit 索引

---

## 本 session commits

```
1e9c983  feat(wiki): add paul_perspective to harness-engineering (L3 third entry)
769dfe0  fix(wiki): paul_perspective 改單行避開 wiki-kv-seed parser 限制
```

Issue #157 comment：[`#issuecomment-4322106624`](https://github.com/zarqarwi/paulkuo.tw/issues/157#issuecomment-4322106624)

---

## 建議模型 / Effort（按下個任務分）

| 任務 | 模型 | Effort |
|------|------|------|
| #1 parser 換 js-yaml | Sonnet 4.6 | Low（30 min）|
| #2 YouTube blocklist | Sonnet 4.6 | Low（30 min）|
| #3 Dialogue marker design | Opus 4.6 | Medium（schema + 演算法決策）|
| #4 Enrichment 改良 | Opus 4.6 | Medium（邏輯設計）|
| #5 paul_perspective 寫作 | Sonnet 4.6 | Low-Medium（深度依 Paul）|

---

## Paste-ready prompt

```
請閱讀 worklogs/cowork--next-session-handoff-2026-04-26-v3.md 後執行。
```

---

*建立：2026-04-26 由 Cowork paul_perspective 第三筆 session 結束時產出*
*取代 v2：v2 的 D 項目已完成 1 筆，整體 backlog 仍可參考*
