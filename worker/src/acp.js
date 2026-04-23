/**
 * AI Collaboration Portfolio — Layer 2 (GitHub Auto-Fetch) + Layer 3 (AI Verification) + Phase 3 (Persistence)
 * 2026-04-08
 */
import { corsHeaders, jsonResponse, checkRateLimit } from './utils.js';

// ── Rate limiting ──

async function checkDailyLimit(ip, env, prefix, max) {
  const key = `ratelimit:${prefix}:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const current = parseInt(await env.TICKER_KV.get(key) || '0');
  if (current >= max) return false;
  await env.TICKER_KV.put(key, String(current + 1), { expirationTtl: 86400 });
  return true;
}

// ── Layer 2: GitHub Auto-Fetch ──

const GH_HEADERS = (env) => {
  const h = { 'User-Agent': 'ACP/1.0', 'Accept': 'application/vnd.github.v3+json' };
  if (env.GITHUB_PAT) h['Authorization'] = `bearer ${env.GITHUB_PAT}`;
  return h;
};

async function fetchGitHubProfile(username, env) {
  const headers = GH_HEADERS(env);

  // 1. User profile
  const userResp = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  if (!userResp.ok) throw new Error(`GitHub user not found (${userResp.status})`);
  const user = await userResp.json();

  // 2. Repos (up to 100, sorted by updated)
  const reposResp = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&type=owner`, { headers });
  const repos = reposResp.ok ? await reposResp.json() : [];

  // 3. Commits in past 6 months — GraphQL ContributionsCollection (accurate),
  //    fallback to REST events (90-day window, undercounts monorepo pushes)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  let recentCommits = 0;
  let commits_6m_source = 'none';

  if (env.GITHUB_PAT) {
    try {
      const gqlQuery = `
        query ($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
              totalCommitContributions
            }
          }
        }
      `;
      const gqlResp = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${env.GITHUB_PAT}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ACP/1.0',
        },
        body: JSON.stringify({
          query: gqlQuery,
          variables: { login: username, from: sixMonthsAgo.toISOString(), to: new Date().toISOString() },
        }),
      });
      const gqlData = await gqlResp.json();
      if (gqlData?.errors) {
        console.error('ACP GraphQL errors:', gqlData.errors);
      }
      const total = gqlData?.data?.user?.contributionsCollection?.totalCommitContributions;
      if (typeof total === 'number') {
        recentCommits = total;
        commits_6m_source = 'graphql';
      }
    } catch (err) {
      console.error('ACP GraphQL commits fetch failed:', err);
      /* fall through to REST */
    }
  }

  // REST fallback (public push events, last ~90 days only)
  if (commits_6m_source === 'none') {
    const eventsResp = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events?per_page=100`, { headers });
    const events = eventsResp.ok ? await eventsResp.json() : [];
    const pushEvents = events.filter(e => e.type === 'PushEvent');
    recentCommits = pushEvents.reduce((sum, e) => sum + (e.payload?.commits?.length || 0), 0);
    commits_6m_source = 'events_fallback';
  }

  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);

  const activeRepos = repos.filter(r => new Date(r.pushed_at) > sixMonthsAgo);

  // CI/CD detection: repos with common CI markers
  const ciRepos = repos.filter(r => r.has_pages || r.has_wiki === false); // rough proxy
  // Better: check for Actions workflows via API (but expensive)
  const reposWithActions = [];
  const checkLimit = Math.min(activeRepos.length, 10); // check top 10 active repos
  for (let i = 0; i < checkLimit; i++) {
    try {
      const wfResp = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(activeRepos[i].name)}/actions/workflows?per_page=1`,
        { headers }
      );
      if (wfResp.ok) {
        const wf = await wfResp.json();
        if (wf.total_count > 0) reposWithActions.push(activeRepos[i].name);
      }
    } catch { /* skip */ }
  }

  // Content: repos with README, pages, or wiki
  const contentRepos = repos.filter(r => r.has_pages);

  return {
    username: user.login,
    name: user.name,
    avatar: user.avatar_url,
    bio: user.bio,
    public_repos: user.public_repos,
    followers: user.followers,
    // Mapped to ACP questions
    commits_6m: recentCommits,                    // → d1
    commits_6m_source,                            // 'graphql' | 'events_fallback'
    active_repos: activeRepos.length,             // → d2, l1
    total_repos: repos.length,                    // → d4
    stars_total: totalStars,                      // → i1
    ci_pipelines: reposWithActions.length,         // → c2
    has_pages_count: contentRepos.length,          // → d3
    followers_count: user.followers,               // → i2
    // Suggested auto-fill values
    suggested: {
      d1: recentCommits,
      d2: activeRepos.length,
      d3: contentRepos.length,
      d4: repos.filter(r => !r.fork).length,
      c2: reposWithActions.length,
      i1: totalStars,
      i2: user.followers,
      l1: activeRepos.length,
    },
  };
}

export async function handleAcpGithub(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST only' }, 405, request);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip, 10)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }
  if (!(await checkDailyLimit(ip, env, 'acp-gh', 20))) {
    return jsonResponse({ error: 'Daily limit exceeded (20/day)' }, 429, request);
  }

  try {
    const { username } = await request.json();
    if (!username || typeof username !== 'string' || username.length > 39) {
      return jsonResponse({ error: 'Invalid username' }, 400, request);
    }
    const data = await fetchGitHubProfile(username.trim(), env);
    return jsonResponse(data, 200, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, e.message.includes('not found') ? 404 : 500, request);
  }
}

// ── Layer 3: AI Verification ──

const VERIFY_SYSTEM_PROMPT = `You are the AI Verification Engine for the AI Collaboration Portfolio assessment tool.

Your job: cross-reference a user's self-reported scores with their GitHub data to produce an honest, data-driven verification.

## Input
You receive:
1. Self-reported answers for 20 questions across 5 dimensions (Command, Delivery, Leverage, Quality, Influence)
2. GitHub profile data (repos, stars, commits, CI pipelines, followers)
3. Evidence context: which fields were auto-filled from GitHub, which have evidence URLs, and which are purely self-reported
4. Computed dimension scores and total score

## Output Format
Return valid JSON only, no markdown fencing:
{
  "overall_confidence": "high" | "medium" | "low",
  "confidence_note": "1-sentence explanation",
  "verified_score": <number 0-100, your estimated fair score based on evidence>,
  "delta": <number, difference from self-reported total>,
  "dimension_notes": {
    "command": { "confidence": "high|medium|low", "note": "1 sentence", "adjusted_score": <number> },
    "delivery": { "confidence": "high|medium|low", "note": "1 sentence", "adjusted_score": <number> },
    "leverage": { "confidence": "high|medium|low", "note": "1 sentence", "adjusted_score": <number> },
    "quality": { "confidence": "high|medium|low", "note": "1 sentence", "adjusted_score": <number> },
    "influence": { "confidence": "high|medium|low", "note": "1 sentence", "adjusted_score": <number> }
  },
  "highlights": ["up to 3 positive observations"],
  "flags": ["up to 3 discrepancies or concerns"],
  "one_liner": "A single-sentence summary of this person's AI collaboration profile"
}

## Verification Rules
- GitHub data is ground truth for: commits, stars, repo count, CI pipelines, followers
- Fields with evidence URLs carry more weight than purely self-reported fields
- Auto-filled fields from GitHub have the highest confidence
- For dimensions without GitHub evidence (Quality uptime, Influence methodology citations), trust self-report but note lower confidence
- If self-reported numbers are significantly higher than GitHub evidence, flag it
- If GitHub evidence suggests the user is underselling, note that too
- Consider the overall evidence ratio: more auto-filled + evidenced fields = higher overall confidence
- Be direct and fair — not encouraging, not harsh`;

export async function handleAcpVerify(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST only' }, 405, request);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip, 5)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }
  if (!(await checkDailyLimit(ip, env, 'acp-verify', 10))) {
    return jsonResponse({ error: 'Daily limit exceeded (10/day)' }, 429, request);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'AI verification not configured' }, 500, request);
  }

  try {
    const { answers, github_data, evidence_urls, auto_filled, dim_scores, total_score, grade } = await request.json();

    if (!answers || !dim_scores || total_score === undefined) {
      return jsonResponse({ error: 'Missing required fields' }, 400, request);
    }

    const userMessage = JSON.stringify({
      self_reported_answers: answers,
      github_data: github_data || null,
      evidence_context: {
        auto_filled_fields: auto_filled || [],
        evidence_urls: evidence_urls || {},
        auto_count: (auto_filled || []).length,
        evidenced_count: Object.keys(evidence_urls || {}).filter(k => evidence_urls[k]).length,
      },
      computed_scores: { dim_scores, total_score, grade },
    });

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: VERIFY_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error('Claude API error:', resp.status, errBody);
      return jsonResponse({ error: 'AI verification failed' }, 502, request);
    }

    const result = await resp.json();
    const text = result.content?.[0]?.text || '';

    // Parse JSON from response
    let verification;
    try {
      const cleaned = text.replace(/^```json?\s*/, '').replace(/```\s*$/, '').trim();
      verification = JSON.parse(cleaned);
    } catch {
      verification = { parse_error: true, raw: text.slice(0, 500) };
    }

    return jsonResponse(verification, 200, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ── Phase 3: Persistence ──

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function generateToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// POST /api/acp/save — Save or create portfolio
export async function handleAcpSave(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405, request);

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip, 10)) return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  if (!(await checkDailyLimit(ip, env, 'acp-save', 30))) return jsonResponse({ error: 'Daily limit exceeded' }, 429, request);

  try {
    const { answers, dim_scores, weights, github_data, github_username, verification, evidence_urls, auto_filled, total_score, grade } = await request.json();
    if (!answers || !dim_scores || total_score === undefined || !grade) {
      return jsonResponse({ error: 'Missing required fields' }, 400, request);
    }

    const id = generateId();
    const owner_token = generateToken();

    await env.AUTH_DB.prepare(
      `INSERT INTO portfolios (id, owner_token, answers, dim_scores, weights, github_data, github_username, verification, evidence_urls, auto_filled, total_score, grade, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).bind(
      id, owner_token,
      JSON.stringify(answers), JSON.stringify(dim_scores),
      JSON.stringify(weights || {}), JSON.stringify(github_data || null),
      github_username || null, JSON.stringify(verification || null),
      JSON.stringify(evidence_urls || {}), JSON.stringify(auto_filled || []),
      total_score, grade
    ).run();

    return jsonResponse({ id, owner_token, url: `https://paulkuo.tw/portfolio/${id}` }, 201, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// GET /api/acp/:id — Get public portfolio
export async function handleAcpGet(request, env, id) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== 'GET') return jsonResponse({ error: 'GET only' }, 405, request);

  try {
    const row = await env.AUTH_DB.prepare(
      `SELECT id, answers, dim_scores, weights, github_data, github_username, verification, evidence_urls, auto_filled, total_score, grade, created_at, updated_at, is_public FROM portfolios WHERE id = ?`
    ).bind(id).first();

    if (!row) return jsonResponse({ error: 'Portfolio not found' }, 404, request);
    if (!row.is_public) return jsonResponse({ error: 'Portfolio is private' }, 403, request);

    return jsonResponse({
      id: row.id,
      answers: JSON.parse(row.answers),
      dim_scores: JSON.parse(row.dim_scores),
      weights: JSON.parse(row.weights || '{}'),
      github_data: JSON.parse(row.github_data || 'null'),
      github_username: row.github_username,
      verification: JSON.parse(row.verification || 'null'),
      evidence_urls: JSON.parse(row.evidence_urls || '{}'),
      auto_filled: JSON.parse(row.auto_filled || '[]'),
      total_score: row.total_score,
      grade: row.grade,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }, 200, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// PUT /api/acp/:id — Update portfolio (requires owner_token)
export async function handleAcpUpdate(request, env, id) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== 'PUT') return jsonResponse({ error: 'PUT only' }, 405, request);

  try {
    const { owner_token, answers, dim_scores, weights, github_data, github_username, verification, evidence_urls, auto_filled, total_score, grade } = await request.json();
    if (!owner_token) return jsonResponse({ error: 'owner_token required' }, 401, request);

    const existing = await env.AUTH_DB.prepare('SELECT id FROM portfolios WHERE id = ? AND owner_token = ?').bind(id, owner_token).first();
    if (!existing) return jsonResponse({ error: 'Not found or unauthorized' }, 404, request);

    await env.AUTH_DB.prepare(
      `UPDATE portfolios SET answers = ?, dim_scores = ?, weights = ?, github_data = ?, github_username = ?, verification = ?, evidence_urls = ?, auto_filled = ?, total_score = ?, grade = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(
      JSON.stringify(answers), JSON.stringify(dim_scores),
      JSON.stringify(weights || {}), JSON.stringify(github_data || null),
      github_username || null, JSON.stringify(verification || null),
      JSON.stringify(evidence_urls || {}), JSON.stringify(auto_filled || []),
      total_score, grade, id
    ).run();

    return jsonResponse({ id, updated: true }, 200, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// GET /api/acp/:id/og — Dynamic OG image (SVG → PNG via Workers)
export async function handleAcpOg(request, env, id) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });

  try {
    const row = await env.AUTH_DB.prepare(
      'SELECT total_score, grade, dim_scores, github_username FROM portfolios WHERE id = ? AND is_public = 1'
    ).bind(id).first();

    if (!row) return new Response('Not found', { status: 404 });

    const dimScores = JSON.parse(row.dim_scores);
    const dims = ['command', 'delivery', 'leverage', 'quality', 'influence'];
    const labels = ['Command', 'Delivery', 'Leverage', 'Quality', 'Influence'];
    const emojis = ['\u26A1', '\uD83D\uDCE6', '\uD83D\uDD2D', '\uD83D\uDEE1\uFE0F', '\uD83C\uDF10'];
    const colors = ['#4A90D9', '#8B5CF6', '#38bdf8', '#10b981', '#f59e0b'];

    const gradeColors = { Orchestrator: '#f59e0b', Architect: '#4A90D9', Builder: '#8B5CF6', Practitioner: '#10b981', Explorer: '#94a3b8' };
    const gradeEmojis = { Orchestrator: '\uD83D\uDE80', Architect: '\uD83C\uDFD7\uFE0F', Builder: '\u26A1', Practitioner: '\uD83D\uDD27', Explorer: '\uD83C\uDF31' };
    const gc = gradeColors[row.grade] || '#94a3b8';

    // Build radar polygon points
    const cx = 200, cy = 180, maxR = 120;
    const radarPts = dims.map((d, i) => {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const r = ((dimScores[d] || 0) / 100) * maxR;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');

    // Grid rings
    const gridRings = [20, 40, 60, 80, 100].map(lv => {
      const pts = Array.from({ length: 5 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const r = (lv / 100) * maxR;
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${pts}" fill="none" stroke="rgba(74,144,217,0.15)" stroke-width="0.5"/>`;
    }).join('');

    // Axis lines + labels
    const axes = dims.map((_, i) => {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const lx = cx + maxR * Math.cos(a), ly = cy + maxR * Math.sin(a);
      const tx = cx + (maxR + 30) * Math.cos(a), ty = cy + (maxR + 30) * Math.sin(a);
      return `<line x1="${cx}" y1="${cy}" x2="${lx.toFixed(1)}" y2="${ly.toFixed(1)}" stroke="rgba(74,144,217,0.15)" stroke-width="0.5"/>
        <text x="${tx.toFixed(1)}" y="${(ty + 4).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${colors[i]}">${labels[i]}</text>`;
    }).join('');

    // Dim score bars (right side)
    const bars = dims.map((d, i) => {
      const y = 60 + i * 50;
      const score = dimScores[d] || 0;
      return `<text x="440" y="${y}" font-size="13" fill="${colors[i]}" font-weight="600">${emojis[i]} ${labels[i]}</text>
        <text x="680" y="${y}" font-size="14" fill="${colors[i]}" font-weight="700" text-anchor="end" font-family="monospace">${score}</text>
        <rect x="440" y="${y + 6}" width="240" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
        <rect x="440" y="${y + 6}" width="${(score / 100) * 240}" height="6" rx="3" fill="${colors[i]}"/>`;
    }).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0d0d1a"/><stop offset="100%" stop-color="#13132a"/></linearGradient></defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <text x="440" y="35" font-size="11" fill="#4A90D9" font-weight="700" letter-spacing="0.1em">AI COLLABORATION PORTFOLIO</text>
      <!-- Radar -->
      ${gridRings}
      ${axes}
      <polygon points="${radarPts}" fill="rgba(74,144,217,0.15)" stroke="rgba(74,144,217,0.8)" stroke-width="2" stroke-linejoin="round"/>
      <!-- Grade badge -->
      <text x="200" y="350" text-anchor="middle" font-size="36" font-weight="800" fill="${gc}">${gradeEmojis[row.grade] || ''} ${row.grade}</text>
      <text x="200" y="380" text-anchor="middle" font-size="48" font-weight="900" fill="#ffffff" font-family="monospace">${row.total_score}</text>
      <text x="200" y="400" text-anchor="middle" font-size="14" fill="#94a3b8">/ 100</text>
      <!-- Bars -->
      ${bars}
      <!-- Footer -->
      <text x="40" y="600" font-size="13" fill="#475569">paulkuo.tw/portfolio/${id}</text>
      ${row.github_username ? `<text x="1160" y="600" text-anchor="end" font-size="13" fill="#475569">github.com/${row.github_username}</text>` : ''}
    </svg>`;

    return new Response(svg, {
      status: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600', ...corsHeaders(request) },
    });
  } catch (e) {
    return new Response('Error generating OG image', { status: 500 });
  }
}
