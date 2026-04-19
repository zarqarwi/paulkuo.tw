# PENDING.md 已完成歸檔 — 2026-04 月

從 PENDING.md 移過來的 `[x]` 已結案項目，保留供日後追溯。Archive 由 2026-04-20 Cowork（Sonnet）批次建立。

---

## 待 Code 執行（已完成）

- [x] 🟢 跑 `node scripts/governance-kv-seed.cjs` 補 Dashboard 數字 → ✅ 已完成 (2026-04-18)
  - 完整 handoff：`handoffs/cowork--governance-kv-reseed-2026-04-18.md`
  - seed 結果：Projects: 6, Automation coverage: 70%
  - KV 數字：paulkuo-main 461 / formosa-esg 78 / llm-wiki 53 / acp 3 / ai-ready 14 / agora 1
  - 次要 follow-up：classifier 對 `.github/workflows/` 路徑分類待整理（paulkuo-main 461 vs 549、acp/ai-ready 數字偏移）

- [x] 🟢 Commit design system 文件 + worklog 變更 → ✅ 已完成 (8363e60, 2026-04-14 18:11)

- [x] 🟢 分批 commit 累積變更（~100 檔案）→ ✅ 已完成 5 批 commits (453b20a→abb6390, 2026-04-14 18:20)

- [x] 🟢 Commit `scripts/mcp-register-global.sh` → ✅ 已完成 (b823890, 2026-04-14)
  - 完整 handoff：`handoffs/code--commit-mcp-register-script-2026-04-14.md`
  - 單一 commit，含 handoff 本身；不 push

- [x] 🟡 Commit + push + deploy `src/pages/governance/index.astro` quick fix → ✅ 已完成 (aa225cd, 2026-04-14)

- [x] 🟢 Governance Dashboard Phase A — ✅ 已完成 (6246e03, 2026-04-15)
  - commit + push + deploy 完成；build 534 pages pass；smoke test 200 OK
  - Task size：S (< 30 min，純 review + commit + deploy)，信心等級：高
  - Smoke test 必用**無痕視窗**（sessionStorage 干擾）
  - 視覺參考：Stitch projects/3520595413095137436 v1 screen 594fcba83743439d958f1dcd3b4bab60
  - Phase B (Worker API 擴充 weekly/delta/last_deploy 欄位) + Phase C (稽核 actionable table) 另案

- [x] 🔴 Scanner 自動化 workflow 建置 → ✅ 已完成（cd9ebd9, auto scanner daily 2026-04-16 正常運行中）

- [x] 🟡 Harness Engineering 文件庫上架 → ✅ 已完成 (70ad07a, 2026-04-14)
  - 完整 handoff：`worklogs/code--harness-docs-upload-2026-04-14.md`
  - 兩份 HTML 已在 `public/governance/` 就位；只需改 `src/pages/governance/index.astro` 加文件庫區塊
  - ⚠️ 關鍵：文件庫**必須放在 token gate 外部**（governance 是 token-protected dashboard，放錯地方訪客就看不到）
  - Push 前告知 Paul

- [x] 🟡 治理框架 Phase 3：Dashboard 整合 scanner 稽核結果 → ✅ 已完成 (851dd58)
  - 6 步全 pass，automation coverage 66.7% → 70%
  - ⚠️ 待 Paul 手動部署：`npm run build && wrangler deploy && cd worker && wrangler deploy --config wrangler.toml`

- [x] 治理框架 Phase 2：API + KV seed + Dashboard 頁面 → ✅ 已完成 (ceb67d2, e2fcd8f, b09d00c)
  - ✅ 2026-04-11 17:07 Paul 已部署前端 + Worker + 設定 GOVERNANCE_TOKEN secret

- [x] 🔴 修 governance-kv-seed.cjs `--remote` 參數 → ✅ 已完成 (be42206)

---

## 待 Cowork 執行（已完成）

- [x] 🔴 協作憲法 v0.2 結案三件事 → ✅ 已完成 (2026-04-20 Cowork)
  - 完整 handoff：`handoffs/cowork--constitution-v0.2-closeout-2026-04-20.md`
  - 依序做：Issue #155 governance 里程碑條目 → worklog 4/19 三維度補完 → briefing v2 標 DONE
  - 起點：本輪已 commit `a6550f9`（憲法 v0.2 ADR + 四層 skill 盤點報告）
  - Task Size：M（約 45-60 min）

- ~~用 Stitch「Homepage Redesign」比對 paulkuo.tw 線上首頁~~ → **已擱置** (2026-04-14 17:20)
  - Paul 決定過去測試的 Stitch 專案不再延續，Stitch 轉為「產新稿」而非「比對舊稿」
  - 取而代之的是 `docs/design-system.md`（單一事實來源）+ 未來 Stitch Web UI 手動貼 designMd 流程

- [x] 🔴 使用者級 `~/.claude/skills/session-handoff/` 同步（v5.3 落地配套）→ Code 或 Paul / Sonnet 4.6 (2026-04-19)
  - ✅ 2026-04-19 Code 執行完成（commit d5b0877），專案級與使用者級一致（diff -r 無輸出）
  - 背景：2026-04-19 「空中樓閣第 3 次」根因 = 使用者級 skill 為 stale v4.13，不含 C4/C5/v5.2/v5.3 新條款
  - 短期方案 B（Code retro §整體建議 1）：執行 `cp -r .claude/skills/session-handoff/ ~/.claude/skills/session-handoff/`，並在 `CLAUDE.md` §工程慣例新增「Skill 同步」條款，要求每次 SKILL.md 改動 commit 後立即 `cp`
  - 長期方案 C（待評估）：把 session-handoff skill 正本移到使用者級，paulkuo.tw 內留 symlink 或引用
  - 來源：`worklogs/code--v5-1-guardrail-retro-report-2026-04-19.md` §整體建議 1 + Cowork 審核結論分流
  - Cowork 沒有使用者級寫入權限，必須由 Code / Paul 執行

- [x] 🟡 v0.3 憲法實施方案落地（四軌）→ Code / Opus 4.6 (2026-04-20) ✅ 完成 2026-04-20
  - 完整 ADR：`docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md`
  - Migration Step 2: working-environment.md 加 `implements` frontmatter
  - Migration Step 3: CLAUDE.md 加「協作憲法」引用段 + 「Skill 同步」條款
  - Migration Step 4-5: 驗證+複製 4 個 C 層 skill 到 repo A 層
  - Migration Step 6-7: 擴充 commit-msg-hook.sh 加 worklog 原子化檢查
  - Task Size：M（約 60-90 min，Step 2-3 快速、Step 4-5 視情況、Step 6-7 需寫 python parser）

---

## Scanner 自動產出（已完成）

- [x] 🟡 跨專案 smoke test 缺漏：cd2422a, e2fcd8f, 7d7e85d, c0b86b7, 8be165c → ✅ 2026-04-16 Cowork 補驗全部 200 OK（主站/Wiki/Formosa/ACP/TQEF）
- [x] 🟡 跨專案影響待驗：73e3546 → ✅ 2026-04-16 Cowork 補驗，全部子專案 API 正常，近 3 天 scanner 無異常
- [x] 🟡 跨專案 smoke test 缺漏：851dd58 governance Phase 3 → ✅ 已部署，Dashboard 200 OK，scanner daily audit 正常運行
