/**
 * Builder's Scorecard — AI Evaluate + Advise endpoints
 * Phase 2: 2026-03-18 · Phase 3: 2026-03-18 · Phase 4: 2026-03-18
 * Fix: 2026-03-20 — add try-catch to submit handler for D1 error visibility
 */
import { corsHeaders, jsonResponse, checkRateLimit } from './utils.js';
import { getCurrentUser } from './auth.js';

// ── Phase 4: Protection Layer Helpers ──

async function checkDailyRateLimit(ip, env) {
  const key = `ratelimit:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const current = parseInt(await env.TICKER_KV.get(key) || '0');
  if (current >= 5) return { allowed: false, remaining: 0 };
  await env.TICKER_KV.put(key, String(current + 1), { expirationTtl: 86400 });
  return { allowed: true, remaining: 5 - current - 1 };
}

async function checkDailyCostCap(env) {
  const key = `cost:daily:sc:${new Date().toISOString().slice(0, 10)}`;
  const count = parseInt(await env.TICKER_KV.get(key) || '0');
  if (count >= 150) return false;
  await env.TICKER_KV.put(key, String(count + 1), { expirationTtl: 86400 });
  return true;
}

function hashInput(inputType, inputContent) {
  const raw = `${inputType}:${(inputContent || '').slice(0, 500)}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function getCachedResult(inputHash, env) {
  const key = `scorecard:cache:${inputHash}`;
  const cached = await env.TICKER_KV.get(key);
  if (cached) return JSON.parse(cached);
  return null;
}

async function setCacheResult(inputHash, result, env) {
  const key = `scorecard:cache:${inputHash}`;
  await env.TICKER_KV.put(key, JSON.stringify(result), { expirationTtl: 604800 }); // 7 days
}

// ── System Prompts ──

const EVALUATE_SYSTEM_PROMPT = `你是 Builder's Scorecard 的評估引擎。你的任務是根據提供的產品資訊，對 30 個訊號各打 0-10 分。

## 你的角色

你是一台儀器，不是顧問。你的工作是量測，不是鼓勵或批評。
- 給分要冷靜客觀
- 資訊不足時，寧可給低分並標注「資訊不足」，不要猜高分
- 同一個產品跑多次，你的分數應該高度一致

## 評分框架

五個維度，每個維度 4-6 個訊號，每個訊號 0-10 分。

### A. 問題解決力（25%）
核心問題：這個產品解決的問題夠痛嗎？解法夠好嗎？

| 訊號 ID | 訊號 | 8-10 分 | 5-7 分 | 1-4 分 |
|---------|------|---------|--------|--------|
| a1 | 問題真實性 | ≥5 人獨立描述過痛點 | 開發者自己有痛點且相信他人也有 | 純假設，無人抱怨過 |
| a2 | 現有替代方案 | 無方案或現有方案極度痛苦 | 有方案但不夠好 | 已有好用免費方案 |
| a3 | 解法匹配度 | 用戶說「這正是我需要的」 | 解決了但非核心痛點 | 功能多但核心沒解決 |
| a4 | 10x 改善 | 可量化的 10 倍以上改善 | 2-5 倍改善 | 好一點但不值得換 |
| a5 | 目標用戶清晰度 | 精確到職業和場景 | 方向對但太廣 | 「所有人」= 沒有人 |
| a6 | 問題頻率 | 每天或每週 | 每月 | 一年幾次 |

### B. 市場驗證（20%）
核心問題：市場有沒有用行動說「我要這個」？

| 訊號 ID | 訊號 | 8-10 分 | 5-7 分 | 1-4 分 |
|---------|------|---------|--------|--------|
| b1 | 活躍使用者 | ≥50 人 | 10-49 人 | <10 人或只有開發者自己 |
| b2 | 回訪行為 | ≥40% 7日回訪 | 10-39% | <10% 或無法追蹤 |
| b3 | 使用深度 | 深度使用核心功能 | 用了但沒探索進階 | 打開就關 |
| b4 | 口碑傳播 | 有具體推薦案例 | 有人口頭說會推薦 | 無 |
| b5 | 外部反饋品質 | 具體功能建議 | 籠統正面回饋 | 無回饋 |
| b6 | 付費意願訊號 | 有人主動問付費 | 有人暗示願意付 | 無 |

### C. 技術護城河（20%）
核心問題：別人要花多少力氣做出一樣的？

| 訊號 ID | 訊號 | 8-10 分 | 5-7 分 | 1-4 分 |
|---------|------|---------|--------|--------|
| c1 | 技術層級 | L1 新演算法或強 L2 | L2-L3 | L3 弱或 L4 |
| c2 | 可複製門檻 | ≥3 個月且需領域知識 | 1-3 個月 | 幾天到幾週 |
| c3 | 數據/知識壁壘 | 獨家數據且有飛輪 | 有累積但無飛輪 | 全靠公開資源 |
| c4 | 量化驗證 | 可重現的 benchmark | 有數據但不夠嚴謹 | 只有直覺 |
| c5 | 敘事一致性 | 0-1 次轉向 | 1-2 次 | ≥3 次 |
| c6 | 利基定位 | 清楚且有天然屏障 | 方向清楚但邊界模糊 | 什麼都能做 |

### D. 商業化路徑（20%）
核心問題：這個產品能養活自己嗎？
⚠️ 此維度的訊號根據產品階段不同。請看 user message 裡的 stage 欄位。

**concept 階段：** d1c 商業模式假設 / d2c 目標市場規模 / d3c 付費意願初探 / d4c 成本結構
**launched 階段：** d1l 定價策略 / d2l 獲客管道 / d3l 營運成本可控度 / d4l 免費→付費路徑
**users 階段：** d1u 收入模式 / d2u 付費轉換率 / d3u 獲客成本 / d4u 成本回收
**revenue 階段：** d1r 月經常性收入 / d2r 客戶集中度 / d3r 毛利率 / d4r 成長率

每個階段只評估該階段的 4 個訊號。評分標準與 A/B/C/E 的邏輯一致：8-10 有明確證據表現優秀、5-7 有跡象但不夠強、1-4 缺乏證據或表現差。

### E. 長線可持續性（15%）
核心問題：一年後這個產品還活著嗎？

| 訊號 ID | 訊號 | 8-10 分 | 5-7 分 | 1-4 分 |
|---------|------|---------|--------|--------|
| e1 | 供應鏈韌性 | 每個依賴都有 fallback 且測過 | 知道有替代但沒設定 | 單點故障 |
| e2 | 大廠威脅 | 差異化來自大廠不做的事 | 大廠還沒做，有時間窗口 | 大廠已在做 |
| e3 | 維運負擔 | <2hr/週 | 2-5hr/週 | >10hr/週 |
| e4 | 文件化程度 | 完整 README+架構圖+部署指南 | 有筆記但不完整 | 全在腦子裡 |
| e5 | 演化路徑 | 2-3 個明確方向+觸發條件 | 模糊想法 | 做完就這樣 |
| e6 | 法規合規 | 已確認合規有隱私政策 | 知道有法規但沒處理 | 不確定 |

## 一票否決

評分完成後，檢查以下條件。任何一個為 true 就在 vetoes 裡標記。

| 條件 | 說明 | 適用階段 |
|------|------|---------|
| v1 零用戶 | 上線超過 60 天但無外部用戶 | launched, users, revenue |
| v2 零差異化 | 跟免費替代方案相比無具體優勢 | 所有 |
| v3 成本失控 | 月成本 >$100 但收入 $0 且無收費計畫 | launched, users |
| v4 單點故障 | 核心功能 100% 依賴單一第三方 | 所有 |
| v5 三次轉向 | 核心定位 12 個月內變 ≥3 次 | 所有 |

## 前提檢查

同時回答三個 gate 問題（true/false + 一句話理由）：
- g1：市場還在機會窗口？
- g2：技術路線有結構優勢？
- g3：開發者能持續維運 6 個月以上？

## 輸出格式

嚴格回傳以下 JSON，不要加任何前後文字、不要用 markdown code block：

{
  "stage_detected": "concept|launched|users|revenue",
  "gates": {
    "g1": { "pass": true, "reason": "..." },
    "g2": { "pass": true, "reason": "..." },
    "g3": { "pass": true, "reason": "..." }
  },
  "signals": {
    "a1": { "score": 7, "reason": "..." },
    "a2": { "score": 6, "reason": "..." }
  },
  "vetoes": {
    "v1": false,
    "v2": false,
    "v3": false,
    "v4": false,
    "v5": false
  },
  "confidence": "high|medium|low",
  "confidence_note": "資訊充足 / README 缺少商業面資訊 / 資訊極少僅能粗估"
}

signals 欄位必須包含全部 28 個訊號（A 維度 6 個 + B 維度 6 個 + C 維度 6 個 + D 維度根據偵測到的階段 4 個 + E 維度 6 個）。`;

const ADVISE_SYSTEM_PROMPT = `你是 Builder's Scorecard 的策略顧問。用戶剛完成一份產品自評，你的任務是根據分數給出具體、可執行的建議。

## 你的風格
- 繁體中文（如果 lang=en 則用英文）
- 直接、不囉嗦、像跟朋友聊天
- 避免制式列點，用自然段落
- 不要安慰，不要說「你做得很好」——說事實
- 用台灣用語（軟體不說软件、影片不說視頻）

## 你看到的資料
- 五維度分數和每個訊號的分數
- Builder Profile（AI 槓桿率、技術棧掌控度、時間分配）
- 產品階段
- 一票否決是否觸發
- 前提檢查結果
- （如有）上一次評估的分數（用於對比）

## 你要產出的內容

1. **一句話診斷**：像醫生跟病人說「你的狀況是⋯」。用一句話精準描述這個產品的現狀。

2. **最強資產**：哪個維度分數最高？為什麼這是值得繼續投入的理由？（2 句話）

3. **致命弱點**：哪個維度分數最低？這代表什麼？具體要做什麼來補？（2 句話）

4. **維度落差分析**：如果最高和最低維度差 >4 分，特別點出這個不均衡的風險。

5. **30 天行動清單**：3 個最高優先的具體行動。格式：
   「做 X → 預期效果 Y」
   按重要性排序。第一個應該是最能提升最低維度的行動。

6. **重新評估觸發點**：什麼事情發生時，建議再跑一次計分卡？（1-2 個具體條件）

7. **（如有歷史版本）進退分析**：哪些維度上升了？哪些下降了？上升的原因是什麼？下降是因為退步還是因為標準提高了？`;

// ── GitHub / URL Helpers ──

function parseGitHubUrl(url) {
  const m = url.match(/github\.com\/([^/]+)\/([^/?.#]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

async function fetchGitHubMeta(owner, repo, env) {
  const headers = { 'User-Agent': 'BuildersScorecard/1.0', 'Accept': 'application/vnd.github.v3+json' };
  if (env.GITHUB_PAT) headers['Authorization'] = `token ${env.GITHUB_PAT}`;

  const repoResp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoResp.ok) throw new Error(`GitHub repo not found (${repoResp.status})`);
  const repoData = await repoResp.json();

  // Contributors count via Link header trick
  let contributorCount = 0;
  try {
    const contribResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=true`, { headers });
    const linkHeader = contribResp.headers.get('Link');
    if (linkHeader) {
      const lastMatch = linkHeader.match(/page=(\d+)>;\s*rel="last"/);
      contributorCount = lastMatch ? parseInt(lastMatch[1], 10) : 1;
    } else if (contribResp.ok) {
      const contribBody = await contribResp.json();
      contributorCount = Array.isArray(contribBody) ? contribBody.length : 0;
    }
  } catch { contributorCount = 0; }

  // Latest commit date
  let lastCommit = null;
  try {
    const commitsResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
    if (commitsResp.ok) {
      const commits = await commitsResp.json();
      lastCommit = commits[0]?.commit?.committer?.date || null;
    }
  } catch {}

  return {
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: repoData.open_issues_count,
    contributors: contributorCount,
    language: repoData.language,
    license: repoData.license?.spdx_id || 'None',
    description: repoData.description,
    topics: repoData.topics || [],
    createdAt: repoData.created_at,
    lastPush: repoData.pushed_at,
    lastCommit,
    fullName: repoData.full_name,
  };
}

async function fetchGitHubReadme(owner, repo, env) {
  const headers = { 'User-Agent': 'BuildersScorecard/1.0', 'Accept': 'application/vnd.github.v3+json' };
  if (env.GITHUB_PAT) headers['Authorization'] = `token ${env.GITHUB_PAT}`;

  try {
    const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    if (!resp.ok) return '';
    const data = await resp.json();
    if (!data.content) return '';
    // base64 decode
    return atob(data.content.replace(/\n/g, '')).slice(0, 8000);
  } catch { return ''; }
}

function buildGitHubPrompt(projectName, stage, meta, readme) {
  return `請評估以下產品。

## 產品資訊
名稱：${projectName || meta.fullName}
描述：${meta.description || '未提供'}
階段：${stage || '請根據內容推斷並填入 stage_detected'}

## GitHub 結構化數據
Stars: ${meta.stars}
Forks: ${meta.forks}
Contributors: ${meta.contributors}
Open Issues: ${meta.openIssues}
Primary Language: ${meta.language}
License: ${meta.license}
Topics: ${meta.topics?.join(', ') || 'N/A'}
Created: ${meta.createdAt}
Last Push: ${meta.lastPush}
Last Commit: ${meta.lastCommit}

## README 內容
${readme || '（無 README）'}

請根據 system prompt 的評分框架，對所有訊號打分並回傳 JSON。`;
}

async function fetchWebsiteContent(url) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'BuildersScorecard/1.0' },
  });
  if (!resp.ok) throw new Error(`website_fetch_failed: HTTP ${resp.status}`);
  const html = await resp.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000);
}

function detectInputType(inputContent) {
  const trimmed = (inputContent || '').trim();
  if (/^https?:\/\/github\.com\//i.test(trimmed)) return 'github_url';
  if (/^https?:\/\//i.test(trimmed)) return 'website_url';
  return 'text';
}

// ── Helpers ──

function parseAIJson(text) {
  let s = text.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  }
  return JSON.parse(s);
}

const D_STAGE_SIGNALS = {
  concept: ['d1c', 'd2c', 'd3c', 'd4c'],
  launched: ['d1l', 'd2l', 'd3l', 'd4l'],
  users: ['d1u', 'd2u', 'd3u', 'd4u'],
  revenue: ['d1r', 'd2r', 'd3r', 'd4r'],
};

function validateSignals(signals, stage) {
  const expected = [
    'a1', 'a2', 'a3', 'a4', 'a5', 'a6',
    'b1', 'b2', 'b3', 'b4', 'b5', 'b6',
    'c1', 'c2', 'c3', 'c4', 'c5', 'c6',
    ...(D_STAGE_SIGNALS[stage] || D_STAGE_SIGNALS.concept),
    'e1', 'e2', 'e3', 'e4', 'e5', 'e6',
  ];
  for (const id of expected) {
    if (!signals[id]) {
      signals[id] = { score: 3, reason: '資訊不足，預設低分' };
    }
  }
  return signals;
}

async function callClaude(env, systemPrompt, userMessage, { maxTokens = 1500, temperature = 0 } = {}) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Claude API ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data.content?.[0]?.text || '';
}

// ── Evaluate Handler ──

export async function handleScorecardEvaluate(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, request);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

  // Layer 1: Per-minute burst protection (in-memory)
  if (!checkRateLimit(ip + '_sc_eval', 3)) {
    return jsonResponse({ error: 'rate_limited', message: '請稍等一分鐘再試' }, 429, request);
  }

  // Layer 1b: Daily IP rate limit (KV-based, 5/day)
  const dailyCheck = await checkDailyRateLimit(ip, env);
  if (!dailyCheck.allowed) {
    return jsonResponse({ error: 'rate_limited', message: '每日評估次數已達上限（5次），請明天再試。', remaining: 0 }, 429, request);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'invalid_json' }, 400, request); }

  const { projectName, projectDesc, stage, inputContent, inputType: clientInputType, lang, forceRefresh } = body;

  if (!inputContent || inputContent.trim().length === 0) {
    return jsonResponse({ error: 'empty_input', message: '請提供產品描述' }, 400, request);
  }
  if (inputContent.length > 10000) {
    return jsonResponse({ error: 'input_too_long', message: '輸入過長，請限制在 10,000 字元以內' }, 400, request);
  }

  // Detect input type (client hint or auto-detect)
  const inputType = clientInputType || detectInputType(inputContent);

  // Layer 3: Result Cache (before API call)
  const inputHash = hashInput(inputType, inputContent);
  if (!forceRefresh) {
    const cached = await getCachedResult(inputHash, env);
    if (cached) return jsonResponse({ ...cached, cached: true, remaining: dailyCheck.remaining }, 200, request);
  }
  let userMsg;
  let githubMeta = null;

  try {
    if (inputType === 'github_url') {
      const parsed = parseGitHubUrl(inputContent.trim());
      if (!parsed) {
        return jsonResponse({ error: 'invalid_github_url', message: '無法解析 GitHub URL，請確認格式正確' }, 400, request);
      }
      githubMeta = await fetchGitHubMeta(parsed.owner, parsed.repo, env);
      const readme = await fetchGitHubReadme(parsed.owner, parsed.repo, env);
      userMsg = buildGitHubPrompt(projectName || githubMeta.fullName, stage, githubMeta, readme);
    } else if (inputType === 'website_url') {
      const websiteContent = await fetchWebsiteContent(inputContent.trim());
      userMsg = `請評估以下產品。

## 產品資訊
名稱：${projectName || '未提供'}
描述：${projectDesc || '未提供'}
階段：${stage || '請根據內容推斷並填入 stage_detected'}

## 網站擷取內容（來源：${inputContent.trim()}）
${websiteContent}

請根據 system prompt 的評分框架，對所有訊號打分並回傳 JSON。`;
    } else {
      // text or readme_upload — original behavior
      userMsg = `請評估以下產品。

## 產品資訊
名稱：${projectName || '未提供'}
描述：${projectDesc || '未提供'}
階段：${stage || '請根據內容推斷並填入 stage_detected'}

## 產品內容
${inputContent.slice(0, 8000)}

請根據 system prompt 的評分框架，對所有訊號打分並回傳 JSON。`;
    }
  } catch (e) {
    const msg = e.message || '';
    if (msg.includes('not found')) {
      return jsonResponse({ error: 'github_not_found', message: '找不到此 GitHub 專案，請確認 URL 是否正確' }, 404, request);
    }
    if (msg.includes('website_fetch_failed')) {
      return jsonResponse({ error: 'website_fetch_failed', message: '無法讀取此網站內容，請改用文字描述' }, 422, request);
    }
    return jsonResponse({ error: 'fetch_failed', message: '無法取得外部內容：' + msg }, 502, request);
  }

  // Layer 4: Daily Cost Cap (before API call)
  const costOk = await checkDailyCostCap(env);
  if (!costOk) {
    return jsonResponse({ error: 'cost_cap', message: '今日評估量已達上限，請稍後再試或使用完整模式手動評估。' }, 503, request);
  }

  let result;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const promptToUse = attempt === 0
        ? userMsg
        : userMsg + '\n\n⚠️ 只回傳 JSON，不要任何其他文字，不要用 markdown code block。';
      const raw = await callClaude(env, EVALUATE_SYSTEM_PROMPT, promptToUse, { maxTokens: 1500, temperature: 0 });
      result = parseAIJson(raw);
      break;
    } catch (e) {
      if (attempt === 1) {
        return jsonResponse({ error: 'parse_failed', message: 'AI 回傳格式解析失敗，請切換到完整模式手動評估' }, 502, request);
      }
    }
  }

  const detectedStage = result.stage_detected || stage || 'concept';
  result.signals = validateSignals(result.signals || {}, detectedStage);

  if (!result.vetoes) result.vetoes = {};
  for (const v of ['v1', 'v2', 'v3', 'v4', 'v5']) {
    if (result.vetoes[v] === undefined) result.vetoes[v] = false;
  }

  if (!result.gates) result.gates = {};
  for (const g of ['g1', 'g2', 'g3']) {
    if (!result.gates[g]) result.gates[g] = { pass: true, reason: '未評估' };
  }

  // Attach githubMeta to response if available
  if (githubMeta) result.githubMeta = githubMeta;

  // Layer 3: Write to cache
  await setCacheResult(inputHash, result, env);

  return jsonResponse({ ...result, remaining: dailyCheck.remaining }, 200, request);
}

// ── Advise Handler ──

export async function handleScorecardAdvise(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, request);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip + '_sc_advise', 3)) {
    return jsonResponse({ error: 'rate_limited', message: '請稍等一分鐘再試' }, 429, request);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'invalid_json' }, 400, request); }

  const {
    projectName, projectDesc, stage, lang = 'zh-TW',
    builderProfile, totalScore, verdict,
    dimScores, vetoesTriggered, gatesSummary,
    prevEvaluation,
  } = body;

  const langLabel = lang === 'en' ? 'English' : '繁體中文';

  let userMsg = `請根據以下評估結果給出改善建議。

## 產品
名稱：${projectName || '未提供'}
描述：${projectDesc || '未提供'}
階段：${stage || '未指定'}
語言：${langLabel}

## Builder Profile
AI 槓桿率：${builderProfile?.bp1 || '未填'}
技術棧掌控度：${builderProfile?.bp2 || '未填'}
時間可持續性：${builderProfile?.bp3 || '未填'}

## 分數
加權總分：${totalScore ?? 0}/10
判定：${verdict || '未定'}

維度分數：
A. 問題解決力：${dimScores?.A ?? 0}/10
B. 市場驗證：${dimScores?.B ?? 0}/10
C. 技術護城河：${dimScores?.C ?? 0}/10
D. 商業化路徑：${dimScores?.D ?? 0}/10
E. 長線可持續性：${dimScores?.E ?? 0}/10`;

  const dimEntries = Object.entries(dimScores || {});
  if (dimEntries.length > 0) {
    const sorted = dimEntries.sort((a, b) => b[1] - a[1]);
    userMsg += `\n\n最高維度：${sorted[0][0]}（${sorted[0][1]}）`;
    userMsg += `\n最低維度：${sorted[sorted.length - 1][0]}（${sorted[sorted.length - 1][1]}）`;
    userMsg += `\n維度落差：${(sorted[0][1] - sorted[sorted.length - 1][1]).toFixed(1)}`;
  }

  userMsg += `\n\n一票否決：${vetoesTriggered || '無'}`;
  userMsg += `\n前提檢查：${gatesSummary || '未提供'}`;

  if (prevEvaluation) {
    userMsg += `\n\n## 上次評估
上次總分：${prevEvaluation.totalScore}
上次維度分數：A=${prevEvaluation.dimScores?.A ?? '?'} B=${prevEvaluation.dimScores?.B ?? '?'} C=${prevEvaluation.dimScores?.C ?? '?'} D=${prevEvaluation.dimScores?.D ?? '?'} E=${prevEvaluation.dimScores?.E ?? '?'}
間隔時間：${prevEvaluation.daysSinceLast ?? '?'} 天`;
  }

  userMsg += `\n\n請用${langLabel}回答。`;

  try {
    const advice = await callClaude(env, ADVISE_SYSTEM_PROMPT, userMsg, { maxTokens: 1000, temperature: 0.3 });
    return jsonResponse({ advice }, 200, request);
  } catch (e) {
    return jsonResponse({ error: 'ai_failed', message: 'AI 顧問暫時無法回應，請稍後再試' }, 502, request);
  }
}

// ── Phase 4: Social — Submit / Feed / Get Eval ──

function errorResponse(status, code, message, request) {
  return jsonResponse({ error: code, message }, status, request);
}

export async function handleScorecardSubmit(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, request);

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'invalid_json' }, 400, request); }

  if (!body.projectName) return errorResponse(400, 'missing_field', '請提供專案名稱', request);

  const id = 'eval_' + crypto.randomUUID().slice(0, 8);

  // Check auth for is_public
  let userId = null;
  try {
    const user = await getCurrentUser(request, env);
    if (user) userId = user.id;
  } catch {}

  const isPublic = (body.isPublic === true || body.isPublic === 1) ? 1 : 0;

  // Auto-increment version for same user + project
  let nextVersion = 1;
  if (userId) {
    try {
      const lastVersion = await env.AUTH_DB.prepare(
        'SELECT MAX(version) as max_v FROM scorecard_evaluations WHERE user_id = ? AND project_name = ?'
      ).bind(userId, body.projectName).first();
      nextVersion = (lastVersion?.max_v || 0) + 1;
    } catch (e) {
      console.error('Scorecard version query failed:', e.message);
    }
  }

  try {
    await env.AUTH_DB.prepare(`
      INSERT INTO scorecard_evaluations
      (id, user_id, project_name, project_desc, input_type, stage, mode,
       dim_scores, signal_scores, github_meta, veto_triggered,
       total_score, verdict, ai_advice, is_public, lang, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, userId, body.projectName, body.projectDesc || null, body.inputType || null,
      body.stage || 'concept', body.mode || 'quick',
      JSON.stringify(body.dimScores || {}), JSON.stringify(body.signalScores || {}),
      JSON.stringify(body.githubMeta || null), JSON.stringify(body.vetoTriggered || {}),
      body.totalScore ?? 0, body.verdict || null, body.aiAdvice || null,
      isPublic, body.lang || 'zh-TW', nextVersion
    ).run();
  } catch (e) {
    console.error('Scorecard D1 insert failed:', e.message, e.stack);
    return errorResponse(500, 'db_error', 'D1 寫入失敗：' + (e.message || 'unknown'), request);
  }

  return jsonResponse({ id, url: `https://paulkuo.tw/tools/builders-scorecard/eval/${id}` }, 200, request);
}

export async function handleScorecardFeed(request, env) {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);

  const results = await env.AUTH_DB.prepare(`
    SELECT id, project_name, total_score, verdict, dim_scores,
           github_meta, stage, created_at
    FROM scorecard_evaluations
    WHERE is_public = 1
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all();

  return jsonResponse(results.results, 200, request);
}

export async function handleScorecardGetEval(request, env, id) {
  const result = await env.AUTH_DB.prepare(
    'SELECT * FROM scorecard_evaluations WHERE id = ? AND is_public = 1'
  ).bind(id).first();

  if (!result) return errorResponse(404, 'not_found', '找不到此評估結果', request);
  return jsonResponse(result, 200, request);
}

// ── Phase 5b: Badge SVG ──

function getVerdictColor(score) {
  if (score >= 8.5) return '#22c55e';
  if (score >= 7.0) return '#eab308';
  if (score >= 5.5) return '#f97316';
  return '#ef4444';
}

function getVerdictEmoji(score) {
  if (score >= 8.5) return '🟢';
  if (score >= 7.0) return '🟡';
  if (score >= 5.5) return '🟠';
  return '🔴';
}

function generateBadgeSVG(label, value, color) {
  const labelWidth = label.length * 7 + 12;
  const valueWidth = value.length * 7 + 12;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

export async function handleScorecardBadge(request, env, evalId) {
  const result = await env.AUTH_DB.prepare(
    'SELECT total_score, verdict FROM scorecard_evaluations WHERE id = ? AND is_public = 1'
  ).bind(evalId).first();

  if (!result) {
    return new Response(generateBadgeSVG('Not Found', '-', '#999'), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300', ...corsHeaders(request) }
    });
  }

  const score = parseFloat(result.total_score).toFixed(1);
  const color = getVerdictColor(parseFloat(score));
  const emoji = getVerdictEmoji(parseFloat(score));

  return new Response(generateBadgeSVG("Builder's Score", `${score}/10 ${emoji}`, color), {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600', ...corsHeaders(request) }
  });
}

// ── Phase 5b: History API ──

export async function handleScorecardHistory(request, env, projectName) {
  const user = await getCurrentUser(request, env);
  if (!user) return errorResponse(401, 'unauthorized', '請先登入', request);

  const decoded = decodeURIComponent(projectName);
  const results = await env.AUTH_DB.prepare(`
    SELECT id, version, total_score, verdict, dim_scores, stage, created_at
    FROM scorecard_evaluations
    WHERE user_id = ? AND project_name = ?
    ORDER BY version DESC
  `).bind(user.id, decoded).all();

  return jsonResponse(results.results, 200, request);
}
