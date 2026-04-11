# paulkuo.tw 專案治理架構審查 — Chat Briefing

> 日期：2026-04-11
> 背景：Cowork session 裡發現治理機制有結構性缺口，已做了一輪修補，現在需要 Chat 從更高的視角審查整體架構是否合理、有沒有技術死角。
> 目的：請 Chat 以架構顧問的角色，審查這套治理系統的設計，指出我們可能沒看到的問題。

---

## 一、我們要解決什麼問題

paulkuo.tw 是一個單人開發者（Paul）的個人網站，但底下跑了六個子專案，共用同一個 codebase：

| 子專案 | 性質 |
|--------|------|
| 主站 | 個人網站 + Worker API |
| Formosa ESG | 白沙屯媽祖繞境碳足跡追蹤 |
| LLM Wiki | 個人知識圖譜 |
| ACP | AI 協作力自評工具 |
| AI Ready | AI 可讀性分數監測 |
| TQEF（阿哥拉廣場） | 即時會議記錄翻譯引擎 |

Paul 不是全職工程師，他的角色是方向制定者和管理者。實作交給 Claude 的三種 session 分工：

- **Chat**：決策中樞，策略規劃，不碰程式碼
- **Cowork**：管家中樞，每日審查、狀態同步、handoff 交接
- **Code**：主力開發，寫程式碼、部署、修 bug

**核心需求**：Paul 需要一眼看出整個生態系的健康狀態——哪裡在動、哪裡卡住、自動化有沒有在成長。而且這套系統必須能安全地擴展，未來加第七個、第八個子專案不應該引入新風險。

---

## 二、目前有哪些治理機制

### 機制 A：Governance Dashboard（4/9 建立）

**解決的問題**：巨觀視角——每個專案的活躍度、產出指標、自動化覆蓋率。

**架構**：

```
worklogs/governance/projects.json     ← 專案註冊表（6 個專案）
worklogs/governance/automation-registry.json ← 自動化任務登記
worklogs/metrics/{project_id}/{date}.json   ← 每次 session 的結構化指標
        ↓
scripts/governance-kv-seed.cjs        ← 彙總 → 上傳 Cloudflare KV
        ↓
worker/src/governance-api.js          ← 4 個 API endpoint（Bearer token 認證）
        ↓
src/pages/governance/index.astro      ← Dashboard 前端（auth-gated）
```

**資料來源**：`worklogs/governance/projects.json` 是專案的事實來源。

**目前狀態**：Phase 2 已完成（API + Dashboard 上線），Phase 3（主動監測、異常偵測）尚未開始。

**設計原則**（governance-framework-spec.md）：
1. 量產出，不量成本
2. 零手動輸入——所有指標從 git log、worklogs 自動擷取
3. 專案自治——每個專案宣告自己關心的指標
4. 新專案即插即用——新增一個 JSON entry 就完成註冊

### 機制 B：跨子專案影響防線（4/11 建立，今天）

**解決的問題**：微觀防護——某一次 commit 改了共用檔案（如 `worker/src/utils.js`），有沒有標注影響範圍、有沒有跑 smoke test。

**觸發原因**：之前只有一份靜態的 `docs/shared-file-impact-map.md`，列出哪些檔案是共用的、改了會影響哪些子專案。但這份文件是被動的——等人去查、等人問對問題。實際發生過改了共用模組沒驗到的情況。

**架構**：

```
docs/shared-files.json                ← 共用檔案清單（單一事實來源）
        ↓
三層自動防線：
├── .git/hooks/commit-msg             ← 第一層：commit 時即時攔截
│   （動態讀 shared-files.json，缺 [影響:] 標注就擋）
├── .claude/skills/cross-project-impact/ ← 第二層：Cowork 主動分析
│   （開場掃描 / handoff 影響分析 / worklog 審查）
└── scheduled task: cross-project-impact-scanner ← 第三層：每日巡邏
    （掃近 3 天 commits，漏標注或漏 smoke test 寫入 PENDING.md）
```

**資料來源**：`docs/shared-files.json` 是共用檔案的事實來源。三層機制都在執行時動態讀這份 JSON。

**設計特性**：
- Hook 讀不到 JSON → 印警告、放行（不會擋住正常 commit）
- python3 掛了 → 同樣放行（graceful degradation）
- 新增共用檔案 → 只改 JSON，三層機制自動跟上
- Hook 備份在 `scripts/commit-msg-hook.sh`，重新 clone 跑 `scripts/install-hooks.sh` 就能恢復

### 機制 C：既有的靜態規範

- `CLAUDE.md`：Code session 的行為規範（commit 標注、部署驗證、worklog 格式）
- `docs/shared-file-impact-map.md`：人類可讀的影響地圖（已加上 JSON 來源說明）
- `session-handoff` skill：跨 session 狀態管理 SOP
- `auto-memory`：踩坑記錄（handoff 要帶路徑、帶 integration 細節等）

---

## 三、問題：兩套系統的專案清單沒有接上

機制 A 的專案清單在 `worklogs/governance/projects.json`（6 個專案，含 id、name、custom_metrics 等）。
機制 B 的專案清單在 `docs/shared-files.json` 的 `subprojects` 欄位（6 個專案，含 path、api）。

這兩份是各自維護的。今天加第七個子專案，要改三個檔案：
1. `worklogs/governance/projects.json`（專案註冊）
2. `worklogs/governance/automation-registry.json`（自動化登記）
3. `docs/shared-files.json`（共用檔案 + 子專案 + smoke test）

沒有任何機制會提醒「你改了 A 但忘了改 B」。

---

## 四、我們討論過的兩個解法

### 路線 A：輕耦合（加校驗，不合併）

保持兩份 JSON 各自存在，但在 `cross-project-impact-scanner` 的每日掃描裡加一步：比對兩份 JSON 的專案清單是否一致，不一致就報警。

**優點**：改動最小，不動現有架構。
**缺點**：還是兩份來源，只是用 scanner 當膠水。問題延遲到隔天才發現。

### 路線 B：收斂來源（專案清單只留一份）

`shared-files.json` 不再維護自己的 `subprojects`，改成讀 `worklogs/governance/projects.json`。

專案資訊的單一事實來源 → `projects.json`
共用檔案清單的單一事實來源 → `shared-files.json`（只管檔案，不管專案）

Hook 和 skill 需要子專案名稱時，從 `projects.json` 讀。

**優點**：真正的單一事實來源，新增專案只改 projects.json + automation-registry.json。
**缺點**：hook 要多讀一個檔案（多一次 python3 解析），skill 和 scanner 也要。但 Paul 認為這個方向更符合「上帝視角」的治理目標。

### 我們傾向路線 B，但想聽你的意見

---

## 五、請 Chat 審查的具體問題

### 架構層面

1. **兩套機制的邊界合理嗎？** Dashboard 管巨觀、防線管微觀——這個分工有沒有模糊地帶或遺漏？
2. **三層防線會不會過度設計？** commit-msg hook（預防）、skill（分析）、scheduled task（稽核）。每層的觸發時機和職責不同，但有沒有可以合併的？
3. **`projects.json` 作為專案的唯一事實來源夠不夠？** 它目前的 schema 能不能承載「這個專案有哪些共用檔案」的資訊？還是應該保持關注點分離？

### 延展性

4. **新增子專案的流程夠簡單嗎？** 目前路線 B 需要改 `projects.json` + `automation-registry.json` 兩個檔案。有沒有更好的方式？
5. **如果未來專案數量從 6 變成 15 或 20，這套架構撐得住嗎？** 特別是 hook 的 python3 解析、scheduled task 的 git log 掃描。
6. **跨 repo 的情況怎麼辦？** 目前所有子專案共用一個 repo，但 TQEF（阿哥拉廣場）其實是獨立 Cowork 專案。如果未來有子專案搬到獨立 repo，這套機制還能用嗎？

### 工程風險

7. **git hook 不進 git 版本控制（.git/hooks/ 不被 push）。** 我們用 `scripts/install-hooks.sh` 解決，但有沒有更穩的做法？（例如 husky、lefthook 等工具）
8. **scheduled task 依賴 Claude 的執行能力。** 如果某天 task 跑失敗（token 用完、API 掛了），有沒有 fallback？
9. **governance-kv-seed.cjs 目前由 GitHub Actions 觸發。** 如果 `shared-files.json` 更新了但 seed 腳本沒跑，Dashboard 的資料會不會過期？

### 你覺得我們漏了什麼？

10. **從你見過的其他治理框架（GitOps、Platform Engineering、Internal Developer Platform 等）來看，我們的設計有沒有明顯的反模式或缺失？**

---

## 六、相關檔案路徑（供參考）

| 檔案 | 用途 |
|------|------|
| `docs/shared-files.json` | 共用檔案清單（機制 B 的事實來源） |
| `docs/shared-file-impact-map.md` | 人類可讀的影響地圖 |
| `worklogs/governance/projects.json` | 專案註冊表（機制 A 的事實來源） |
| `worklogs/governance/automation-registry.json` | 自動化登記簿 |
| `worklogs/governance-framework-spec.md` | 治理框架規格書 v1.0 |
| `worker/src/governance-api.js` | Dashboard API（4 個 endpoint） |
| `src/pages/governance/index.astro` | Dashboard 前端 |
| `scripts/governance-kv-seed.cjs` | KV seed 腳本 |
| `.git/hooks/commit-msg` | 跨專案影響 hook |
| `scripts/commit-msg-hook.sh` | hook 備份 |
| `scripts/install-hooks.sh` | hook 安裝腳本 |
| `.claude/skills/cross-project-impact/` | 影響偵測 skill |
| `CLAUDE.md` | Code session 行為規範 |
