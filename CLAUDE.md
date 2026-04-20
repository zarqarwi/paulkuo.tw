# CLAUDE.md — paulkuo.tw 專案指令集

Claude Code 開啟此 repo 時自動讀取。這是 Paul 與 Claude 協作的核心規則。

各子專案有自己的 `CLAUDE.md`（如 `src/pages/projects/formosa-esg-2026/CLAUDE.md`），
Code session 工作時會自動讀取路徑上所有層級的 CLAUDE.md，不需手動指定。

---

## 專案概覽

- 網站：https://paulkuo.tw（Astro + Cloudflare Pages）
- Worker API：`worker/` 目錄（Cloudflare Workers + D1）
- Repo 路徑：`~/Desktop/01_專案進行中/paulkuo.tw`

---

## Worklog 自動記錄（必遵守）

### 規則

每完成一項有意義的工作（commit、bug 修復、功能完成、部署），**自動追加一行到 `worklogs/worklog-{YYYY-MM-DD}.md`**。

不需要 Paul 提醒。做完就記，就像寫 git log 一樣自然。

⚠️ 即使只改一行，commit 後也必須立倸追加 worklog。不要等 session 結束。

### 格式（三維度必填）

做完就記，commit 後立刻追加。三維度必填：做了什麼 / 決策原因 / 阻礙踩坑。沒有就寫「無」，但不能省略區塊。Session 結束時補狀態變更、決策紀錄、待辦快照。

詳細格式與範例見 `docs/governance/worklog-format.md`。

---

## 工程慣例

### 新 Clone 後必做

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
bash scripts/install-hooks.sh
```

這會安裝 `commit-msg` hook（跨子專案影響偵測）。Hook 不進 git 版本控制，每次 clone 後要重新裝。

### Rollback Protocol

出事時見 `docs/governance/rollback-protocol.md`。

### 部署

```bash
# 前端（Astro 靜態站 → Cloudflare Pages）
npm run build && wrangler deploy

# Worker API（必須帶 --config）
cd worker && wrangler deploy --config wrangler.toml

# 一次全部
npm run build && wrangler deploy && cd worker && wrangler deploy --config wrangler.toml
```

### 部署後驗證（每次 deploy 必做）

每次跑完 `wrangler deploy` 後，**立刻跑 Smoke Test**，結果寫進 worklog。

具體驗什麼由各專案目錄下的 `CLAUDE.md` 定義。

**如果該專案目錄下沒有 CLAUDE.md，第一次 deploy 前必須先建一份。** 內容包含：
1. 專案資訊（URL、技術棧、關鍵日期）
2. Smoke Test checklist（根據該專案的功能模組列出驗證項目）
3. 已知陷阱（開發過程中踩過的坑）
4. 檔案結構速查

建完後再進行部署和驗證。

**Worklog 記錄格式：**
```markdown
## Smoke Test
- ✅ {驗證項目}：{結果}
- ❌ {驗證項目}：{問題描述} → {處理方式}
```

任何 fail 項目 → 當場修 → 重新 deploy → 再驗一次。不要留著等下次。

### Skill 同步（v0.3 新增）

每次 `.claude/skills/` 下任何 SKILL.md 有 commit，立即同步到使用者級：

```bash
cp -r .claude/skills/session-handoff/ ~/.claude/skills/session-handoff/
```

這是憲法第二條的實施配套——A 層（repo）是正本，B 層（使用者級）是下游 mirror。
忘記 3 次以上 → 升級為 post-commit hook。

### Git

- commit + push 要原子操作（避免與 cron 或其他 session 的 git 操作衝突）
- 部署前必查：`grep -rn "<<<<<<" worker/src/`
- 一個 commit 只做一件事，不要混改 CSS + JS 邏輯 + HTML 結構

### D1 / KV

- D1 查詢：`wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml --command "..."`
- KV 操作必帶 `--remote`
- Migration 用 `CREATE TABLE IF NOT EXISTS`，避免重複執行問題

### Wrangler 陷阱

- 根目錄 `wrangler.jsonc`（paulkuo-tw 靜態站）會覆蓋 `worker/wrangler.toml`（paulkuo-ticker API）
- 部署 Worker 時**必須**帶 `--config wrangler.toml`

### Astro 陷阱

- `<style>` 預設是 scoped，動態產生的 DOM 元素匹配不到 → 被 JS innerHTML 建立的元素要用 `:global()` 或 `is:inline`
- AuthGate 頁面的 DOM 操作必須延遲到 `formosa-unlocked` 事件

### CDN

- `max-age=3600`，新部署最多等 1 小時生效
- 驗證時務必 hard refresh（Ctrl+Shift+R / Cmd+Shift+R）

---

## 跨子專案影響守則

### 改動共用檔案前必做

本 repo 有六個子專案共用同一個 codebase。改動共用模組前，先查：

```
docs/shared-file-impact-map.md
```

確認這次改動會波及哪些子專案。

### Commit Message 強制標注

凡是改動影響地圖 ⚠️ 欄位裡的任何檔案（`worker/src/index.js`、`translator.js`、`auth.js`、`utils.js`、`BaseLayout.astro` 等），commit message **必須**附上影響範圍標注：

```
fix: 修正 translator.js 半導體詞典 [影響: Wiki + 主站 + TQEF]
```

沒有標注 = 下次無法從 git log 追蹤影響範圍。

### 部署後跨子專案驗證

改動共用模組後，除了測自己的功能，**必須對每個受影響的子專案各打一支 API 確認沒有 500**。驗證指令見 `docs/shared-file-impact-map.md` 各模組底下的「最低驗證」欄位。

---

## 跨 Session 協作

### 狀態管理

**GitHub Issue #155** 是所有專案狀態的單一事實來源（2026-04-09 起從 Apple Notes 遷移）。
Code 用 `worklogs/` 作為中繼，Cowork 消化後同步到 Issue #155：

```
Code 做事 → 自動寫 worklogs/ → Paul 開 Cowork → Cowork 讀 worklogs/ → 同步到 Issue #155
```

**跨 session 待辦佇列**：`worklogs/PENDING.md`（Code 寫待交辦事項，Cowork 開場時掃這個檔案）。

### 黃金法則

如果不確定某件事有沒有做過，**先查（grep / curl / git log / PRAGMA），不要直接重做**。

### Session 開場

1. 讀 `worklogs/PENDING.md`，確認有沒有跨 session 待辦
2. 讀 `worklogs/` 最新 worklog，確認上次做到哪裡
3. 不確定就問 Paul

---

## 工作環境定義（2026-04-18 rev2）

三視窗職責邊界、源頭事實清單規範、Handoff ADR 欄位升級，全部收斂在：

`docs/governance/working-environment.md`

任何 major version 規劃 / 跨 session 踩坑處理 / handoff 模板升級，以那份文件為準。

⚠️ 本檔（CLAUDE.md）目前 ~220 行，超官方 200 行軟上限（見 working-environment.md §4.2 F4）。v5.2 視窗持續監控。

---

## 協作憲法（v0.2，2026-04-19）

憲法全文：`docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`
實施細則：`docs/governance/working-environment.md`
v0.3 實施 ADR：`docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md`
跨視窗速記：`docs/governance/constitution-v0.2-quick-reference.md`（含情境舉例，適合跨 session 快速載入）

憲法五條：SSoT 原則 / 載體對等原則 / 權責分工原則（含剛性核查）/ 記憶層次原則（含同層原子化）/ 記憶擴充原則。
治理 ADR 有疑義時，以憲法為上位法。
