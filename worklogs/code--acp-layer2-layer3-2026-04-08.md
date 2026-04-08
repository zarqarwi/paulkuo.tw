# Code Handoff: AI Collaboration Portfolio — Layer 2 + Layer 3

**來源**: Cowork Session 2026-04-08
**風險等級**: L2（新增 Worker 模組 + 前端大改，但不動現有功能）
**建議模型**: Opus（架構設計多、API 整合複雜）
**Effort**: High（Worker 新模組 + 前端重構 + OAuth flow）
**截止日**: 無急迫，但建議分兩個 PR

---

## 背景

AI Collaboration Portfolio 工具 MVP 已上線（commit 1815509），目前是純前端 20 題自評問卷。
文章 beyond-man-days 提出了三層證據結構：

- **Layer 1（自評）**：✅ 已完成，`AICollabPortfolio.tsx` 509 行
- **Layer 2（自動抓取第三方數據）**：本次實作 — GitHub + Cloudflare Analytics
- **Layer 3（AI 獨立校驗）**：本次實作 — 規則引擎即時算 + Worker API 深度校驗

核心目標：讓工具從「自己說了算」升級為「可驗證」，對應文章的防灌水機制。

---

## Step 0 — 偵察（先查再改）

```bash
# 現有工具頁面結構
ls src/components/ai-collab-portfolio/
ls src/pages/tools/ai-collab-portfolio/

# 現有 Worker 路由格式
grep -n 'pathname' worker/src/index.js | head -30

# CF Analytics 現有用法（visitors.js 已有）
grep -n 'CF_ANALYTICS_TOKEN\|graphql\|analytics' worker/src/visitors.js | head -20

# Workers AI binding 確認
grep -n 'AI\|ai' worker/wrangler.toml

# 現有 secrets
wrangler secret list --config worker/wrangler.toml 2>/dev/null || echo "需要本機跑"

# 確認前端 Astro 頁面怎麼引入 React 元件
cat src/pages/tools/ai-collab-portfolio/index.astro
```

---

## Part A — Layer 2: GitHub 數據自動抓取

### A1. 新增 Worker 模組 `worker/src/acp.js`

這個模組處理所有 ACP（AI Collaboration Portfolio）相關的 API。

**路由設計**（在 `index.js` 註冊）：

| 方法 | 路徑 | 用途 |
|------|------|------|
| GET | `/api/acp/github?username=xxx` | 抓 GitHub 公開數據 |
| GET | `/api/acp/cf-analytics` | 抓 CF Web Analytics（需驗證） |
| POST | `/api/acp/ai-verify` | Layer 3 AI 深度校驗 |

### A2. GitHub 數據抓取邏輯

GitHub REST API v3 公開資料，不需要 token（rate limit 60/hr/IP，夠用）。
如果未來需要更高 rate limit，可加 `GITHUB_TOKEN` secret。

```javascript
// GET /api/acp/github?username=zarqarwi
async function fetchGitHubStats(username) {
  // 1. 用戶基本資料
  const user = await fetch(`https://api.github.com/users/${username}`, {
    headers: { 'User-Agent': 'paulkuo-acp' }
  }).then(r => r.json());

  // 2. 所有公開 repos
  const repos = await fetchAllPages(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`);

  // 3. 計算統計
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0);
  const languages = [...new Set(repos.map(r => r.language).filter(Boolean))];
  const activeRepos = repos.filter(r => {
    const pushed = new Date(r.pushed_at);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return pushed > sixMonthsAgo;
  });

  // 4. 最近 6 個月 commits（用 Search API）
  //    注意：Search API 有自己的 rate limit (10/min unauthenticated)
  //    建議用 KV 快取結果 24 小時
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const since = sixMonthsAgo.toISOString().split('T')[0];
  const commitSearch = await fetch(
    `https://api.github.com/search/commits?q=author:${username}+committer-date:>${since}&per_page=1`,
    { headers: { 'User-Agent': 'paulkuo-acp', 'Accept': 'application/vnd.github.cloak-preview+json' } }
  ).then(r => r.json());

  return {
    source: 'github',
    fetched_at: new Date().toISOString(),
    username,
    // 映射到 ACP 題目
    mapping: {
      d1_commits_6mo: commitSearch.total_count || 0,     // → Delivery Q1
      d2_active_repos: activeRepos.length,                // → Delivery Q2（proxy for services）
      d4_total_repos: repos.filter(r => !r.fork).length,  // → Delivery Q4（shipped projects）
      i1_total_stars: totalStars,                         // → Influence Q1
      i3_forks: totalForks,                               // → Influence Q3（proxy for adoption）
    },
    raw: {
      public_repos: user.public_repos,
      followers: user.followers,
      languages,
      total_stars: totalStars,
      total_forks: totalForks,
      active_repos_6mo: activeRepos.length,
      commits_6mo: commitSearch.total_count || 0,
    }
  };
}
```

**KV 快取策略**：
- key: `acp:github:{username}`
- TTL: 24 小時（GitHub 數據不需要即時）
- 前端顯示 `fetched_at` 讓使用者知道數據新鮮度

### A3. Cloudflare Analytics 數據

`visitors.js` 已有 CF Analytics GraphQL 查詢的 pattern，參考那個寫法。

```javascript
// GET /api/acp/cf-analytics
// ⚠️ 這個 endpoint 需要驗證（只有 Paul 本人能看自己的 analytics）
// 方案：用現有 OAuth session token 驗證，或用 ADMIN_SECRET header
async function fetchCFAnalytics(env) {
  const query = `
    query {
      viewer {
        zones(filter: { zoneTag: "${env.CF_ZONE_TAG}" }) {
          httpRequests1dGroups(
            limit: 30
            filter: { date_geq: "${thirtyDaysAgo()}", date_leq: "${today()}" }
          ) {
            dimensions { date }
            sum { requests pageViews }
            uniq { uniques }
          }
        }
      }
    }
  `;
  // 用 CF_ANALYTICS_TOKEN（已存在 secrets）
  const resp = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CF_ANALYTICS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const data = await resp.json();
  const groups = data.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];

  const totalPageViews = groups.reduce((s, g) => s + g.sum.pageViews, 0);
  const totalUniques = groups.reduce((s, g) => s + g.uniq.uniques, 0);

  return {
    source: 'cloudflare-analytics',
    fetched_at: new Date().toISOString(),
    period: '30d',
    mapping: {
      q1_active_users_30d: totalUniques,    // → Quality Q1
    },
    raw: {
      page_views_30d: totalPageViews,
      unique_visitors_30d: totalUniques,
      daily_breakdown: groups.map(g => ({
        date: g.dimensions.date,
        views: g.sum.pageViews,
        uniques: g.uniq.uniques,
      })),
    }
  };
}
```

**⚠️ 驗證設計決策**：
- CF Analytics 是 Paul 自己的數據，不是公開的
- 最簡方案：`X-Admin-Secret` header（對應已有的 `ADMIN_SECRET`）
- 這樣工具頁面上只有 Paul 登入後才會看到 CF Analytics 區塊
- 其他使用者只能用 GitHub + 自評

### A4. 前端改動（AICollabPortfolio.tsx）

**新增 UI 區塊**：

1. **GitHub 連接面板**（放在問卷上方）
   ```
   ┌─────────────────────────────────────────┐
   │ 🔗 Connect Data Sources                 │
   │                                         │
   │ GitHub: [username input] [Fetch]        │
   │ Status: ✅ 523 commits · 12 repos · 3⭐  │
   │                                         │
   │ CF Analytics: 🔒 Admin only             │
   └─────────────────────────────────────────┘
   ```

2. **每題加上 evidence badge**
   - 原本的手動輸入旁邊顯示：
     - `📊 GitHub: 523` — 自動抓到的值（綠色）
     - `✍️ Self-reported` — 使用者手填的值（灰色）
   - 如果兩者都有且差異大（>50%），顯示 `⚠️ Discrepancy` 黃色警示

3. **結果頁加 Layer 2 信號**
   - 每個維度的分數條旁邊加 evidence 來源標記
   - 結果摘要區新增 `Evidence Coverage: 8/20 questions auto-verified`

**State 新增**：
```typescript
const [githubData, setGithubData] = useState<GitHubStats | null>(null);
const [cfData, setCfData] = useState<CFAnalytics | null>(null);
const [githubUsername, setGithubUsername] = useState('');
const [fetchingGithub, setFetchingGithub] = useState(false);
```

**Auto-fill 邏輯**：
- GitHub 數據抓到後，自動填入對應題目，但使用者可以覆蓋
- 使用 `autoFilled` state 追蹤哪些欄位是自動的
- Copy Results 時區分 evidenced vs self-reported

---

## Part B — Layer 3: 兩階段驗證

### B1. Stage 1: 規則引擎（純前端）

在使用者按 Calculate 之後立刻執行，零成本。

```typescript
interface VerificationResult {
  dimension: string;
  type: 'consistency' | 'outlier' | 'evidence_gap';
  severity: 'info' | 'warning' | 'flag';
  message: string;
}

function runRuleEngine(
  answers: Record<string, any>,
  dimScores: Record<string, number>,
  githubData: GitHubStats | null
): VerificationResult[] {
  const results: VerificationResult[] = [];

  // Rule 1: 自評 vs GitHub 數據落差
  if (githubData) {
    const selfCommits = Number(answers['d1']) || 0;
    const ghCommits = githubData.mapping.d1_commits_6mo;
    if (selfCommits > ghCommits * 1.5 && ghCommits > 0) {
      results.push({
        dimension: 'delivery',
        type: 'consistency',
        severity: 'warning',
        message: `Self-reported commits (${selfCommits}) significantly exceed GitHub data (${ghCommits}). Private repos?`,
      });
    }
  }

  // Rule 2: Leverage 自評偏高但 Delivery 偏低
  if (dimScores.leverage > 70 && dimScores.delivery < 40) {
    results.push({
      dimension: 'leverage',
      type: 'consistency',
      severity: 'warning',
      message: 'High leverage claim but low delivery evidence. Consider adding more shipping proof.',
    });
  }

  // Rule 3: Influence 高但 Quality 低
  if (dimScores.influence > 60 && dimScores.quality < 30) {
    results.push({
      dimension: 'influence',
      type: 'outlier',
      severity: 'flag',
      message: 'High influence without quality evidence is unusual. External citations need production-grade output.',
    });
  }

  // Rule 4: 全部維度都 >80 但沒有 GitHub 連接
  const allHigh = Object.values(dimScores).every(s => s > 80);
  if (allHigh && !githubData) {
    results.push({
      dimension: 'overall',
      type: 'evidence_gap',
      severity: 'info',
      message: 'Excellent scores! Connect GitHub to add third-party evidence and increase credibility.',
    });
  }

  // Rule 5: Command 高但 Delivery 沒有 commits
  if (dimScores.command > 60 && (Number(answers['d1']) || 0) === 0) {
    results.push({
      dimension: 'command',
      type: 'consistency',
      severity: 'warning',
      message: 'Strong command skills claimed but no code commits. Where does the output go?',
    });
  }

  // Rule 6: Evidence coverage 統計
  const totalQs = 20;
  const autoFilledCount = githubData ? Object.keys(githubData.mapping).length : 0;
  if (autoFilledCount < totalQs * 0.3) {
    results.push({
      dimension: 'overall',
      type: 'evidence_gap',
      severity: 'info',
      message: `Only ${autoFilledCount}/${totalQs} questions have third-party evidence. More data sources = higher credibility.`,
    });
  }

  return results;
}
```

**前端呈現**：
- 結果頁新增「🔍 Verification Notes」區塊
- 每條 result 顯示 severity icon + message
- 有 warning/flag 時結果卡片加邊框提示

### B2. Stage 2: AI 深度校驗（Worker API）

使用者看到規則引擎結果後，可點「🤖 Deep Verify with AI」按鈕。

**Worker endpoint**: `POST /api/acp/ai-verify`

```javascript
// worker/src/acp.js
async function aiVerify(request, env) {
  const body = await request.json();
  // body = { answers, dimScores, weights, githubData, cfData, ruleResults }

  // 使用 Workers AI binding（已在 wrangler.toml 設定 [ai] binding）
  const prompt = buildVerificationPrompt(body);

  const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      {
        role: 'system',
        content: `You are an independent auditor for the AI Collaboration Portfolio framework.
Your job is to assess the credibility of a user's self-assessment based on:
1. Internal consistency between dimensions
2. Third-party evidence (GitHub data, analytics) vs self-reports
3. Statistical plausibility

Output a JSON object with:
- overall_credibility: "high" | "medium" | "low"
- adjusted_scores: { command, delivery, leverage, quality, influence } (your independent estimates, 0-100)
- findings: array of { dimension, observation, suggestion }
- summary: one paragraph assessment

Be fair but rigorous. Private repos and non-GitHub work are legitimate — flag gaps, don't penalize.`
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1024,
  });

  return {
    ai_model: 'llama-3.3-70b',
    verified_at: new Date().toISOString(),
    result: JSON.parse(response.response),
  };
}

function buildVerificationPrompt(data) {
  return `## User Self-Assessment
${JSON.stringify(data.dimScores, null, 2)}

## Answers Detail
${JSON.stringify(data.answers, null, 2)}

## Third-Party Evidence
### GitHub${data.githubData ? `\n${JSON.stringify(data.githubData.raw, null, 2)}` : '\nNot connected'}
### Cloudflare Analytics${data.cfData ? `\n${JSON.stringify(data.cfData.raw, null, 2)}` : '\nNot available'}

## Rule Engine Flags
${data.ruleResults.map(r => `- [${r.severity}] ${r.dimension}: ${r.message}`).join('\n')}

Please provide your independent assessment.`;
}
```

**⚠️ Workers AI 選擇理由**：
- 已有 `[ai] binding = "AI"` 在 wrangler.toml
- 零額外 secret 設定
- Llama 3.3 70B 品質夠做結構化評估
- 免費額度內（Workers AI free tier）
- 如果要更好的品質，之後可改用 `ANTHROPIC_API_KEY` 打 Claude API

**前端呈現**：
- 點按鈕後 loading 動畫（「AI is reviewing your portfolio...」）
- 結果區塊：
  ```
  ┌─────────────────────────────────────────┐
  │ 🤖 AI Independent Assessment            │
  │                                         │
  │ Credibility: ●●●○ Medium                │
  │                                         │
  │ AI Estimated Scores:                    │
  │ ⚡ Command:  72 (you: 85) ⚠️ -13        │
  │ 📦 Delivery: 68 (you: 65) ✅ close      │
  │ 🔭 Leverage: 55 (you: 80) ⚠️ -25       │
  │ 🛡️ Quality:  71 (you: 70) ✅ close      │
  │ 🌐 Influence: 30 (you: 35) ✅ close     │
  │                                         │
  │ Key findings:                           │
  │ • Leverage score lacks automation proof │
  │ • GitHub activity supports delivery     │
  │ • Consider adding monitoring evidence   │
  └─────────────────────────────────────────┘
  ```
- Copy Results 也要包含 AI assessment 摘要

---

## 建議執行順序

### PR 1: Layer 2（GitHub + CF Analytics）
1. 建立 `worker/src/acp.js`（GitHub + CF Analytics endpoints）
2. 在 `worker/src/index.js` 註冊路由
3. 修改 `AICollabPortfolio.tsx`：GitHub 連接面板 + evidence badges + auto-fill
4. 測試：`curl https://paulkuo.tw/api/acp/github?username=zarqarwi`
5. Build + Push

### PR 2: Layer 3（規則引擎 + AI 校驗）
1. 前端新增 `runRuleEngine()` + Verification Notes UI
2. Worker `acp.js` 新增 `POST /api/acp/ai-verify`
3. 前端新增 Deep Verify 按鈕 + AI 結果顯示
4. Build + Push

---

## 需要新增的 Secrets / Bindings

| Secret | 用途 | 狀態 |
|--------|------|------|
| `CF_ANALYTICS_TOKEN` | CF GraphQL Analytics | ✅ 已存在 |
| `ADMIN_SECRET` | CF Analytics endpoint 驗證 | ✅ 已存在 |
| `AI` binding | Workers AI | ✅ 已在 wrangler.toml |
| `GITHUB_TOKEN`（optional） | 提高 rate limit 到 5000/hr | 🟡 如果 60/hr 不夠再加 |

---

## 驗證 Checklist

### Layer 2
- [ ] `GET /api/acp/github?username=zarqarwi` 回 200 + 正確 JSON
- [ ] GitHub 數據自動填入問卷對應欄位
- [ ] Evidence badge 正確顯示（📊 vs ✍️）
- [ ] KV 快取生效（第二次請求 <50ms）
- [ ] 不存在的 GitHub 帳號回 404 + 友善錯誤訊息
- [ ] CF Analytics endpoint 需要 admin 驗證
- [ ] 手機 RWD 正常

### Layer 3
- [ ] 規則引擎：填極端值（全 0 或全 max）觸發正確 flags
- [ ] 規則引擎：自評 >> GitHub 數據時顯示 warning
- [ ] AI verify：回傳合法 JSON 結構
- [ ] AI verify：adjusted_scores 在 0-100 範圍
- [ ] 雙軌分數比較 UI 正確顯示差值
- [ ] Copy Results 包含 evidence + AI assessment

---

## 注意事項

1. **不要動現有問卷邏輯**：Layer 1 自評功能必須維持獨立可用，Layer 2/3 是「加值」
2. **GitHub API rate limit**：未驗證 60/hr，用 KV 快取 24hr 緩解。如果 Code 覺得不夠，加 GITHUB_TOKEN
3. **Workers AI JSON 輸出**：Llama 可能輸出不嚴格的 JSON，需要 `try/catch` + fallback 處理
4. **隱私**：GitHub 公開資料而已，不需使用者授權。CF Analytics 只有 admin 能看
5. **漸進式體驗**：沒連 GitHub 的使用者仍然可以完整使用 Layer 1，Layer 3 規則引擎也能跑（只是 evidence_gap 多一點）
6. **index.js 路由慣例**：參考現有模式（如 `/api/feed/*` → `feed.js`），ACP 用 `/api/acp/*` → `acp.js`

---

## 回報格式

完成後寫 worklog，內容包含：
- 建立/修改的檔案清單
- commit hash
- `curl` 測試結果截圖
- 有無 regression（現有 MVP 問卷仍正常）
- 待 Paul 執行的 deploy 指令
