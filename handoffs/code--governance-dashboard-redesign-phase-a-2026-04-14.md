# Handoff: Governance Dashboard 資訊架構改版 — Phase A（視覺 + DOM 結構）

> **⚠️ 狀態更新（2026-04-15 10:xx）**：Paul 下令「直接啟動 Phase A」，
> **Cowork 已把完整程式碼寫進 `src/pages/governance/index.astro` 的 working directory**。
> Code session **不需要再照下方 spec 重寫一遍**，只要：
>
> 1. `git diff src/pages/governance/index.astro` 確認改動合理
> 2. commit + push + build + deploy + smoke test
> 3. 回報三態宣告（commit SHA）
>
> 下方章節（DOM 重構、render 函式、CSS）保留做為**事後 review / Phase B 對照用**，
> 不是要 Code 實作的 spec。

**建議模型**：Sonnet 4.6 + Medium（只需 diff review + 部署，不需重新設計）
**Task size**：S（< 30 min，純 review + commit + deploy）
**信心等級**：高（Cowork 已做 syntax check + DOM/JS id 交叉驗證 + CSS braces balance 全通過）
**視覺參考**：Stitch v1 [screenshot](https://lh3.googleusercontent.com/aida/ADBb0uhtCCr5Ab_iq7KThhoRxDOxMv266CzgioIYryUTH46m4AqjGQsVJXX_AS2HdY3oht6FGdDO0JmjCanTvuSsVNeuRQYF4gmPU3E39KBx_zRU3gVB-50XaB39ibawkBLgXtoXLr6Bo_cdtAvUxtAeW6HqbsDZekqTrbV8Q6eC14hrNJSZlAJ4mwiNx390Sv_iXyyA87Sphf2vSYT-l-qzUMb9T5vqgsHp7h6jRv7RpnS_Qcovpuwy43phuUc)
（登入 Stitch 看全版：https://stitch.withgoogle.com/projects/3520595413095137436）

---

## 🚀 Code 快速執行路徑（主流程）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. 確認 working dir 狀態
git status --short
# 預期：
#  M src/pages/governance/index.astro    (+427 -43)
# ?? handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14.md
# ?? worklogs/worklog-2026-04-15.md
#  M worklogs/PENDING.md

# 2. Review diff（核心是 index.astro）
git diff src/pages/governance/index.astro | less

# 3. 本機驗證（Cowork 沙盒 arm64 跟 macOS node_modules 不相容所以沒跑 build；
#    你這邊 macOS 可以直接跑）
npm run build

# 4. Commit + push（包含 Cowork 的文件交接檔）
git add src/pages/governance/index.astro \
        handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14.md \
        worklogs/worklog-2026-04-15.md \
        worklogs/PENDING.md

git commit -m "$(cat <<'EOF'
feat(governance): Phase A — KPI bar + 專案卡升級 + Paper & Ink design tokens

依 Stitch v1 方向（projects/3520595413095137436 / screen 594fcba8）落地：
- 頂部 KPI Bar 4 tiles：專案健康度分佈 / 待處理稽核 / 自動化覆蓋率 / 最近部署
- 專案卡升級：左邊彩色 border + 本週 commits + delta badge + 為何🟡? 按鈕
- Header 加 period toggle (今日/本週/本月) pill tabs — Phase A 只綁 UI state
- 導入 CSS variables --gov-* (Paper #fbf8ff + Ink #1a1b22 + Electric Blue accent)
- 新增 helpers: relativeTime / deltaBadge / escapeHtml / renderKPIBar / renderKPIAudit
- 卡片字體改 Newsreader serif（主站品牌字同源），繁中行高維持 1.5-1.8

Phase A 限定：缺值欄位（weekly_commits / weekly_delta / last_deploy /
health_reason）顯示 "—" placeholder，Phase B 擴充 Worker API 後自動帶值。

設計意圖：讓 dashboard 打開 3 秒內讀到「健康度 / 待稽核 / 覆蓋率 / 部署」
四條 headline，不再從 commits 累計反推當下狀態（舊版像 worklog 的根因）。

Cowork 驗證：
- JS syntax: node --check pass
- CSS braces: 105 open / 105 close balanced
- DOM / JS id cross-check: 9 新 id 全部雙端對應
- CSS tokens: 9 個 --gov-* 全部定義

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"

git push

# 5. 部署（純前端，Worker 不動）
npm run build && wrangler deploy

# 6. Smoke test（用無痕視窗！sessionStorage 會讓你誤以為沒變）
open -na "Google Chrome" --args --incognito https://paulkuo.tw/governance/
# 輸入 GOVERNANCE_TOKEN 後確認：
# ✅ KPI Bar 顯示 4 tiles（健康度分佈 / 稽核數 / 覆蓋率% / 部署時間）
# ✅ 專案卡有左邊 3px 彩色 border、本週 commits "—"、為何🟡? 按鈕
# ✅ Period toggle 點「今日/本週/本月」會切換 active 狀態（console 有 log）
# ✅ 其他區塊（donut / trend / audit / docs）行為不變
# ✅ Console 無 error
```

**三態宣告**（完成後回報用）：

- `✅ commit {SHA} pushed` + `✅ deployed to Cloudflare Pages`
- 然後到 `worklogs/PENDING.md` mark 本條目 `[x]`
- 並在 `worklogs/worklog-2026-04-15.md` 追加一條完成日誌（Code 類）

---

**以下為設計 spec（事後 review / Phase B 對照用）**

---

## 1. 背景

Paul 回報目前 `/governance/` dashboard「閱讀起來像 worklog 不像儀表板」。
quick win（文件庫隔離、trend 標題正名）已在另一份 handoff 處理。
**這份是 Phase A：把資訊架構整個改掉**，讓打開就能 3 秒內知道「有事/沒事」。

### 核心問題診斷

| 症狀 | 根因 |
|------|------|
| 沒有「當下狀態」頭條 | 缺 KPI bar，打開只看到 commits 累計數字，讀不到健康度 |
| 數字都是歷史累計 | 專案卡只有 total_commits / total_deploys / total_files，沒有「本週變化」|
| 健康度色塊無原因 | 卡片只顯示 🟢/🟡/🔴 emoji，沒說「為何」 |
| 稽核看完要去 grep worklog | panel 只顯示「缺 tag: 2, 缺 smoke test: 1」摘要數字，無具體 commit/指令 |
| 無時間維度 | 所有數字都是全時累計，缺「今日/本週/本月」切換 |

### Phase 拆分

- **Phase A（本 handoff）**：前端 only — DOM 重構 + CSS + render 邏輯改寫。API 回傳維持現狀，缺的欄位用 placeholder。先讓視覺上線。
- **Phase B**（另案）：Worker API 擴充（`weekly_commits`、`weekly_delta`、`audit.flagged` 細節清單、`last_deploy`）+ 對應 KV seed 腳本。
- **Phase C**（另案）：稽核 panel 改成 actionable table，含「一鍵複製修正指令」按鈕。

**本 handoff 只做 Phase A**。Phase B/C 上線後 Phase A 的 placeholder 會自動帶值，不需要重改。

### Stitch v1 設計方向

| 層面 | 規格 |
|------|------|
| 色系 | Paper & Ink：背景 `#fbf8ff`（米白），Accent Blue `#3b82f6` / deep `#0058be` |
| 字體 | 標題 Newsreader serif（跟主站「Paul」品牌字同源），內文 Inter，標籤 Manrope |
| 分隔 | **不用 1px solid border**，改用 `surface_container` 色階差異做 tonal layering |
| 圓角 | 8px（`--roundness: 0.5rem`）|
| 行高 | 繁中行高拉到 1.7–1.8 |
| 陰影 | 只用在 floating（modal），卡片不用陰影，hover 時改 surface 色階 |

---

## 2. Step 0 偵察

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 先確認 quick fix handoff（code--governance-quick-fix-2026-04-14.md）已完成，
# 那個是本 handoff 的前置。如果還沒 merge，先處理掉。
git log --oneline -5 src/pages/governance/index.astro

# 看當前 summary / audit API 實際回傳 shape，決定 Phase A 能用什麼欄位
curl -s -H "Authorization: Bearer $GOVERNANCE_TOKEN" https://api.paulkuo.tw/api/governance/summary | jq .
curl -s -H "Authorization: Bearer $GOVERNANCE_TOKEN" https://api.paulkuo.tw/api/governance/audit | jq .

# 對照 Worker 端實作
grep -rn "total_commits\|coverage_rate\|scanner_health" worker/src/

# 確認目前既有的 render 函式
grep -n "function render" src/pages/governance/index.astro
```

**偵察要產出的判斷**：
- `summary.projects[].last_activity` 有回傳嗎？（Phase A 的卡片要用）
- `summary.automation.coverage_rate` 跟 `.candidates` 存在嗎？（donut 用）
- `summary.last_updated` 格式是什麼？
- `audit.recent[0]` 的 shape，哪些欄位目前是 string vs number
- 有沒有 `weekly_*` 或 `delta_*` 欄位？（大概沒有 → Phase A 用 placeholder）

---

## 3. 具體步驟

### 3.1 DOM 重構（依照這個順序）

改 `src/pages/governance/index.astro` 的 `<BaseLayout>` 內、`#dashboard` 內部結構：

```astro
<div id="dashboard" hidden>
  <!-- Header：標題 + 時間 toggle + 時間戳 -->
  <header class="dash-header">
    <h1 class="dash-title">🎛️ 專案治理 Dashboard</h1>
    <div class="dash-header-right">
      <div class="period-toggle" role="tablist">
        <button data-period="today" class="period-pill">今日</button>
        <button data-period="week" class="period-pill active">本週</button>
        <button data-period="month" class="period-pill">本月</button>
      </div>
      <span id="last-updated" class="last-updated"></span>
    </div>
  </header>

  <!-- KPI Bar：4 tiles -->
  <section class="kpi-bar">
    <div class="kpi-tile" data-kpi="health">
      <span class="kpi-label">專案健康度</span>
      <div class="kpi-value kpi-health-split">
        <span class="chip chip-green">🟢 <em id="kpi-green">—</em></span>
        <span class="chip chip-yellow">🟡 <em id="kpi-yellow">—</em></span>
        <span class="chip chip-red">🔴 <em id="kpi-red">—</em></span>
      </div>
    </div>
    <div class="kpi-tile" data-kpi="audit">
      <span class="kpi-label">待處理稽核</span>
      <div class="kpi-value kpi-audit">
        <span id="kpi-audit-count" class="kpi-big">—</span>
        <span id="kpi-audit-detail" class="kpi-sub">—</span>
      </div>
    </div>
    <div class="kpi-tile" data-kpi="coverage">
      <span class="kpi-label">自動化覆蓋率</span>
      <div class="kpi-value kpi-coverage">
        <span id="kpi-coverage-pct" class="kpi-big">—</span>
        <span id="kpi-coverage-delta" class="kpi-delta">—</span>
      </div>
    </div>
    <div class="kpi-tile" data-kpi="deploy">
      <span class="kpi-label">最近部署</span>
      <div class="kpi-value kpi-deploy">
        <span id="kpi-deploy-ago" class="kpi-big">—</span>
        <span id="kpi-deploy-meta" class="kpi-sub">—</span>
      </div>
    </div>
  </section>

  <!-- 專案狀態：升級版卡片 -->
  <section class="section">
    <div class="section-header">
      <h2 class="section-title">專案狀態</h2>
      <a href="#" class="section-link" id="projects-view-all" hidden>查看全部 →</a>
    </div>
    <div id="project-cards" class="card-grid card-grid-rich"></div>
  </section>

  <!-- 現有的 donut + trend 雙欄保留，但 trend 改成「過去 8 週」時間序列
       （Phase A 因為 API 沒回週資料，先維持目前的橫向長條圖，標題已於 quick fix 正名） -->
  <section class="section two-col">
    <div>
      <h2 class="section-title">自動化覆蓋率</h2>
      <div class="donut-wrap">
        <canvas id="donut-chart" width="180" height="180"></canvas>
        <div class="donut-label"><span id="coverage-pct"></span></div>
      </div>
      <div id="candidates-list" class="candidates"></div>
    </div>
    <div>
      <h2 class="section-title">各專案累計 commits</h2>
      <canvas id="trend-chart" width="400" height="200"></canvas>
    </div>
  </section>

  <!-- 稽核：Phase A 保留現狀 panel，Phase C 再改 actionable table -->
  <section class="section">
    <h2 class="section-title">跨專案稽核</h2>
    <!-- ... 維持現有 audit-panel 結構 ... -->
  </section>

  <!-- 文件庫（quick fix 已搬進來，維持） -->
  <section class="docs-library"> ... </section>
</div>
```

### 3.2 render 邏輯改寫

在現有 `<script is:inline>` 區塊，新增 / 改寫函式：

```js
// ── 新增：KPI bar render ──
function renderKPIBar(summary) {
  // Health split：從 projects.health 陣列統計
  const projects = summary.projects || [];
  const green = projects.filter(p => p.health === 'green').length;
  const yellow = projects.filter(p => p.health === 'yellow').length;
  const red = projects.filter(p => p.health === 'red').length;
  document.getElementById('kpi-green').textContent = green;
  document.getElementById('kpi-yellow').textContent = yellow;
  document.getElementById('kpi-red').textContent = red;

  // Audit：Phase A 從 audit API 另外打；這裡先 placeholder，fetch 完再填
  // （renderAudit 裡會順便更新 KPI 的 audit tile，見下）

  // Coverage：從 summary.automation.coverage_rate
  const auto = summary.automation || {};
  const pct = auto.coverage_rate != null ? Math.round(auto.coverage_rate * 100) + '%' : '—';
  document.getElementById('kpi-coverage-pct').textContent = pct;
  // Delta：Phase A 沒資料，顯示佔位文字
  document.getElementById('kpi-coverage-delta').textContent = '—';

  // Deploy：summary 沒有 last_deploy 欄位（Phase B 再補），先用 last_updated 或 '—'
  document.getElementById('kpi-deploy-ago').textContent = summary.last_updated
    ? relativeTime(summary.last_updated) : '—';
  document.getElementById('kpi-deploy-meta').textContent = '最後更新時間';
}

// ── 新增：relative time helper ──
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return '不到 1 小時前';
  if (h < 24) return h + ' 小時前';
  return Math.floor(h / 24) + ' 天前';
}

// ── 改寫：renderCards 要升級 ──
function renderCards(projects) {
  const grid = document.getElementById('project-cards');
  grid.innerHTML = projects.map(p => {
    // Phase A：weekly_commits / delta / open_prs 尚未有 → placeholder
    const weekly = p.weekly_commits != null ? p.weekly_commits : '—';
    const delta = p.weekly_delta != null ? deltaBadge(p.weekly_delta) : '';
    const openPrs = p.open_prs != null ? `未合併 PR ${p.open_prs}` : '';
    const lastDeploy = p.last_deploy ? relativeTime(p.last_deploy) : '—';
    const healthReason = p.health_reason || '—';

    return `
      <div class="proj-card health-${p.health}" data-project-id="${p.id}">
        <div class="proj-card-top">
          <span class="health-dot">${healthEmoji(p.health)}</span>
          <span class="proj-name">${p.name}</span>
        </div>
        <div class="proj-stat">
          ${weekly}<small> 本週 commits</small> ${delta}
        </div>
        <div class="proj-meta">
          <span>上次部署 ${lastDeploy}</span>
          ${openPrs ? `<span>${openPrs}</span>` : ''}
        </div>
        <div class="proj-activity">
          最後活動：${formatDate(p.last_activity)}
          <button class="proj-health-why" data-reason="${escapeHtml(healthReason)}"
            title="${escapeHtml(healthReason)}">為何 ${healthEmoji(p.health)}？</button>
        </div>
      </div>
    `;
  }).join('');

  // 綁定 tooltip / 點擊顯示 health reason
  grid.querySelectorAll('.proj-health-why').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      alert(btn.getAttribute('data-reason'));
    });
  });
}

function deltaBadge(n) {
  if (n > 0) return `<span class="delta delta-up">↑${n}</span>`;
  if (n < 0) return `<span class="delta delta-down">↓${Math.abs(n)}</span>`;
  return `<span class="delta delta-flat">—</span>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

// ── 改寫：renderDashboard 流程接上 KPI ──
function renderDashboard(summary) {
  document.getElementById('auth-gate').hidden = true;
  document.getElementById('dashboard').removeAttribute('hidden');

  const updatedStr = summary.last_updated
    ? '最後更新：' + formatDate(summary.last_updated.slice(0, 10))
    : '';
  document.getElementById('last-updated').textContent = updatedStr;

  renderKPIBar(summary);      // ⬅ 新增
  renderCards(summary.projects || []);
  renderDonut(summary.automation || {});
  renderTrend(summary.projects || []);

  // fetch audit（非阻擋）
  const storedToken = sessionStorage.getItem(SESSION_KEY);
  govFetch('/api/governance/audit', storedToken).then(async res => {
    if (!res.ok) { /* ... 錯誤處理維持原本 ... */ return; }
    const audit = await res.json();
    renderAudit(audit);
    renderKPIAudit(audit);    // ⬅ 新增
  }).catch(/* ... */);
}

// ── 新增：audit KPI tile render（非阻擋，等 audit API 回來再跑） ──
function renderKPIAudit(audit) {
  const latest = audit.recent && audit.recent[0];
  if (!latest) {
    document.getElementById('kpi-audit-count').textContent = '0';
    document.getElementById('kpi-audit-detail').textContent = '無資料';
    return;
  }
  const tags = latest.missing_tags || 0;
  const smoke = latest.missing_smoke_tests || 0;
  const total = tags + smoke;
  document.getElementById('kpi-audit-count').textContent = total;
  document.getElementById('kpi-audit-count').classList.toggle('warn', total > 0);
  document.getElementById('kpi-audit-detail').textContent =
    total > 0 ? `缺 tag ${tags} · 缺 smoke test ${smoke}` : '無異常';
}

// ── 新增：period toggle（Phase A 只 bind UI，API 還不支援參數） ──
document.querySelectorAll('.period-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.period-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Phase A：不發新 fetch，只做 UI state；Phase B API 擴充後再綁 fetch
    console.log('[gov] period switched to', btn.dataset.period, '(Phase B pending)');
  });
});
```

### 3.3 CSS 加新 token + 樣式

在 `<style>` 區塊最上方加 CSS variables，後續樣式都引用：

```css
:root {
  --gov-bg: #fbf8ff;
  --gov-surface: #ffffff;
  --gov-surface-low: #f4f2fd;
  --gov-surface-high: #eeedf7;
  --gov-ink: #1a1b22;
  --gov-ink-soft: #424754;
  --gov-outline-ghost: rgba(194, 198, 214, 0.5);
  --gov-primary: #3b82f6;
  --gov-primary-deep: #0058be;
  --gov-accent-green: #22c55e;
  --gov-accent-yellow: #f59e0b;
  --gov-accent-red: #ef4444;
  --gov-radius: 8px;
  --gov-space: 1rem;
}

#dashboard { background: var(--gov-bg); }

/* Header */
.dash-header { display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; }
.dash-title { font-family: 'Newsreader', Georgia, serif; font-weight: 500;
  font-size: 1.6rem; color: var(--gov-ink); margin: 0; }
.dash-header-right { display: flex; align-items: center; gap: 1rem; }

.period-toggle { display: inline-flex; background: var(--gov-surface-low);
  border-radius: 999px; padding: 0.2rem; }
.period-pill { border: 0; background: transparent; padding: 0.35rem 0.9rem;
  border-radius: 999px; font-size: 0.8rem; color: var(--gov-ink-soft); cursor: pointer;
  transition: background 0.15s; }
.period-pill.active { background: var(--gov-surface); color: var(--gov-ink);
  box-shadow: 0 1px 2px rgba(26, 27, 34, 0.04); }

/* KPI Bar */
.kpi-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
  margin-bottom: 2.5rem; }
.kpi-tile { background: var(--gov-surface); border-radius: var(--gov-radius);
  padding: 1.1rem 1.2rem; display: flex; flex-direction: column; gap: 0.6rem;
  transition: background 0.15s; }
.kpi-tile:hover { background: var(--gov-surface-low); }
.kpi-label { font-size: 0.75rem; color: var(--gov-ink-soft); letter-spacing: 0.03em; }
.kpi-value { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.kpi-big { font-family: 'Newsreader', Georgia, serif; font-size: 2rem;
  font-weight: 500; color: var(--gov-ink); line-height: 1; }
.kpi-big.warn { color: var(--gov-accent-red); }
.kpi-sub { font-size: 0.72rem; color: var(--gov-ink-soft); }
.kpi-delta { font-size: 0.75rem; color: var(--gov-accent-green); }
.kpi-health-split { gap: 0.4rem; }
.kpi-health-split .chip { font-size: 0.8rem; padding: 0.15rem 0.5rem;
  border-radius: 6px; background: var(--gov-surface-low); }
.kpi-health-split .chip em { font-style: normal; font-weight: 600; margin-left: 0.2rem; }

/* 專案卡升級版 */
.card-grid-rich { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.proj-card { background: var(--gov-surface); border-radius: var(--gov-radius);
  padding: 1rem; border: 0; border-left: 3px solid transparent; }
.proj-card.health-green { border-left-color: var(--gov-accent-green); }
.proj-card.health-yellow { border-left-color: var(--gov-accent-yellow); }
.proj-card.health-red { border-left-color: var(--gov-accent-red); }
.proj-stat { font-family: 'Newsreader', Georgia, serif; font-size: 1.7rem; font-weight: 500;
  color: var(--gov-primary-deep); line-height: 1.2; display: flex; align-items: baseline;
  gap: 0.4rem; flex-wrap: wrap; }
.delta { font-size: 0.75rem; padding: 0.1rem 0.4rem; border-radius: 4px;
  font-family: 'Inter', sans-serif; }
.delta-up { color: var(--gov-accent-green); background: rgba(34, 197, 94, 0.1); }
.delta-down { color: var(--gov-accent-red); background: rgba(239, 68, 68, 0.1); }
.delta-flat { color: var(--gov-ink-soft); }

.proj-health-why { background: none; border: 0; color: var(--gov-primary);
  font-size: 0.68rem; cursor: pointer; padding: 0; margin-left: 0.5rem; }
.proj-health-why:hover { text-decoration: underline; }

/* RWD */
@media (max-width: 860px) {
  .kpi-bar { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .kpi-bar { grid-template-columns: 1fr; }
}
```

既有 CSS（`.section`、`.two-col`、`.donut-wrap`、`.audit-panel` 等）保留不動。只有 `.dash-header` 的 flex layout 要跟新版合併。

### 3.4 本機驗證

```bash
npm run dev
# 打開 http://localhost:4321/governance/
# 登入後確認：
# 1. 頂部有 KPI bar 4 tiles
# 2. 專案卡有左邊彩色 border、本週 commits 數（先顯示 —）、為何🟡? 按鈕
# 3. period toggle 可以切換 active 狀態（但不會 fetch）
# 4. 其他區塊維持現狀
```

### 3.5 Commit + push + deploy

```bash
git add src/pages/governance/index.astro worklogs/worklog-2026-04-14.md worklogs/PENDING.md

git commit -m "$(cat <<'EOF'
feat(governance): Phase A — KPI bar + 專案卡升級 + period toggle

改版要點（視覺方向見 Stitch projects/3520595413095137436 v1）：
- 新增頂部 KPI bar（4 tiles）：健康度分佈 / 待處理稽核 / 自動化覆蓋率 / 最近部署
- 專案卡重構：左邊彩色 border + 「本週 commits + delta」+ 「為何🟡?」說明按鈕
- header 加入 period toggle（今日/本週/本月）pill tabs — UI only，Phase B 再接 API
- 導入 CSS variables（--gov-*）為 Paper & Ink 設計系統打底
- 新增 relativeTime / deltaBadge / escapeHtml helpers

Phase A 限定：API 回傳 shape 不動，週資料 / delta / last_deploy 等新欄位先
顯示「—」placeholder，Phase B 擴充 Worker API 後會自動帶值。

設計意圖：讓 dashboard 打開 3 秒內讀到「健康度、待處理、覆蓋率、部署狀態」
四個 headline，不再從 commits 累計反推狀態（舊版像 worklog 的根因）。

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

git push
npm run build && wrangler deploy
```

---

## 4. 上游假設

本 handoff 基於下列假設，**接手時先驗證**：

1. `/api/governance/summary` 當前仍回傳 `projects[]` / `automation.coverage_rate` / `automation.candidates` / `last_updated` — 若已變更 payload，KPI render 邏輯要調整
2. `/api/governance/audit` 當前仍回傳 `recent[]` 含 `missing_tags` / `missing_smoke_tests` / `date` — 用於 audit KPI tile
3. `summary.projects[].health` 仍使用字串 `green|yellow|red` — 用於分佈統計
4. `GOVERNANCE_TOKEN` env var 在 worker 端仍有效
5. `src/pages/governance/index.astro` 處於 quick-fix 後的 clean state（文件庫已移進 #dashboard、trend 標題已正名）

驗證指令已寫在 Step 0。

---

## 5. 驗證方式

### 5.1 本機 dev

| 驗證項目 | 預期 |
|---------|------|
| KPI bar 顯示 | 4 tiles 橫向排列，健康度分佈 / 待稽核 / 覆蓋率 / 部署 |
| 健康度 chip 數字 | 綠/黃/紅數字加總 = projects 數量 |
| 專案卡左邊 border | 顏色與 health 對應 |
| 專案卡「本週 commits」| Phase A 顯示 `—`（因為 API 沒此欄位），這是預期 |
| 為何🟡? 按鈕 | 點擊跳 alert（或 tooltip），顯示 health_reason 或 `—` |
| period toggle | 點擊切換 active 狀態，console 有 log，不發 fetch |
| RWD @ 480px | KPI bar 變單欄 |
| 其他區塊（donut / trend / audit / docs） | 行為不變 |

### 5.2 線上 smoke test

```bash
# 部署後
curl -sI https://paulkuo.tw/governance/ | head -5
# → 200 OK

# 無痕視窗打開 /governance/，Ctrl+Shift+R hard refresh
# 輸入 GOVERNANCE_TOKEN → 驗證上述 UI
```

### 5.3 回歸測試

- auth-gate 流程沒破（輸入錯 token 有紅字、session 記憶正確）
- sessionStorage.gov_token 清掉後會回到登入畫面
- 文件庫仍在登入後顯示

---

## 6. 注意事項

- ⚠️ **保留 API fetch 邏輯**：`govFetch` / `tryLogin` / `renderDashboard` 主流程動越少越好，這些是 auth-gate + API 介接點，改壞會讓整頁登入不了
- ⚠️ **不要把 Stitch 的 HTML 整個替換進來**：Stitch 產出是視覺 mock，沒有 API 介接。正確做法是「看 screenshot + 依 spec 改」，保留既有 script
- ⚠️ **CDN 快取 3600s**：部署後驗證必無痕 + hard refresh
- ⚠️ **health_reason 欄位 API 沒給**：Phase A 就 fallback `—`，別讓 `undefined` 露出來到 UI
- Newsreader / Inter / Manrope 字體：paulkuo.tw 主站應已有 `@font-face` 設定（看 `BaseLayout.astro`），Phase A 直接引用即可，沒有就 fallback Georgia / system-ui
- **跨 session 原則**（v4.9 護欄 #14）：本 handoff 改的是當前工作 repo，Cowork 不需要額外 GitHub MCP 驗證；但完成後 Code 要**三態宣告** commit SHA

---

## 7. 信心等級

**中-高**。
視覺方向有 Stitch screenshot 明確、spec 分得夠細、API 回傳 shape 有明確偵察指令。
中等風險在 render 函式的 refactor（renderCards、renderDashboard 都要改），但都有 before/after 對照程式碼。

---

## 8. Integration Checklist

- ⬜ 不新增 API endpoint（不觸發護欄 #13 防護繼承檢查）
- ⬜ 不修改 Worker / D1 / KV（純前端）
- ⬜ `src/pages/governance/index.astro` 單檔改動，不動 `BaseLayout.astro` 或其他共用
- ⬜ CLAUDE.md 的 `shared-file-impact-map.md` 裡沒列到此檔案，commit message 不需 `[影響:]` 標注
- ⬜ Worker 側 `/api/governance/summary` 和 `/audit` 的 response shape 沒動，Phase B/C 擴充時往上加欄位向後相容
- ⬜ 登入狀態 sessionStorage key（`gov_token`）沒改，不影響現有使用者 session
- ⬜ 文件庫連結（`/governance/harness-process.html`、`/governance/skill-overview.html`）仍可達

---

## 9. 後續 Phase（不在本 handoff 範圍）

**Phase B：Worker API 擴充**
- `summary.projects[].weekly_commits` / `weekly_delta` / `last_deploy` / `open_prs` / `health_reason`
- `summary.automation.delta` / `coverage_trend[]`
- `summary.last_deploy_project` / `last_deploy_commit` / `last_deploy_at`
- period 參數：`/api/governance/summary?period=today|week|month`
- 對應 `scripts/governance-kv-seed.cjs` 補欄位

**Phase C：稽核 actionable table**
- 取代現有 audit-panel 的摘要數字，改成 table：日期 / Commit / 問題 / 建議動作
- 每 row 有「複製修正指令」按鈕（帶 `navigator.clipboard.writeText`）
- 資料來源：`/api/governance/audit` 需回傳 `flagged[]` 具體 commit 清單

---

## 10. Cowork 產出三態宣告

`⚠️ local edit uncommitted` — 本 handoff 本身是 Cowork 寫入 `handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14.md`，也需要 commit（可併入 Code 實作 Phase A 的同一個 commit，或另一個 docs commit 先行）。
