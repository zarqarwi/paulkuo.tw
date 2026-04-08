/**
 * AI Collaboration Portfolio — Layer 2 (GitHub Auto-Fetch) + Layer 3 (AI Verification)
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
  if (env.GITHUB_PAT) h['Authorization'] = `token ${env.GITHUB_PAT}`;
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

  // 3. Recent push events (proxy for commits in past 6 months)
  const eventsResp = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events?per_page=100`, { headers });
  const events = eventsResp.ok ? await eventsResp.json() : [];

  // Compute metrics
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const pushEvents = events.filter(e => e.type === 'PushEvent');
  const recentCommits = pushEvents.reduce((sum, e) => sum + (e.payload?.commits?.length || 0), 0);

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
3. Computed dimension scores and total score

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
- For dimensions without GitHub evidence (Quality uptime, Influence methodology citations), trust self-report but note lower confidence
- If self-reported numbers are significantly higher than GitHub evidence, flag it
- If GitHub evidence suggests the user is underselling, note that too
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
    const { answers, github_data, dim_scores, total_score, grade } = await request.json();

    if (!answers || !dim_scores || total_score === undefined) {
      return jsonResponse({ error: 'Missing required fields' }, 400, request);
    }

    const userMessage = JSON.stringify({
      self_reported_answers: answers,
      github_data: github_data || null,
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
