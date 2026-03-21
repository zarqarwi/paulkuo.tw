// eval-worker/src/index.ts

interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  EVAL_AUTH_TOKEN: string;
  ALLOWED_ORIGIN: string;
}

interface LayerResult {
  score: number;
  max: number;
  details: Record<string, any>;
}

interface EvalResult {
  score_total: number;
  score_llms_txt: number;
  score_json_ld: number;
  score_mcp_a2a: number;
  score_ai_comprehension: number;
  layers: {
    llms_txt: LayerResult;
    json_ld: LayerResult;
    mcp_a2a: LayerResult;
    ai_comprehension: LayerResult;
  };
}

// ========== Layer 1: llms.txt Structure (25 points) ==========

async function scoreLlmsTxt(baseUrl: string): Promise<LayerResult> {
  const details: Record<string, any> = {};
  let score = 0;

  try {
    const res = await fetch(`${baseUrl}/llms.txt`);
    if (!res.ok) {
      details.error = `HTTP ${res.status}`;
      return { score: 0, max: 25, details };
    }

    const text = await res.text();
    details.length = text.length;

    // H1 brand name exists (# at start)
    const hasH1 = /^#\s+.+/m.test(text);
    details.has_h1 = hasH1;
    if (hasH1) score += 5;

    // Blockquote description exists (> at start of line)
    const hasBlockquote = /^>\s+.+/m.test(text);
    details.has_blockquote = hasBlockquote;
    if (hasBlockquote) score += 5;

    // H2 sections >= 3
    const h2Matches = text.match(/^##\s+.+/gm) || [];
    details.h2_count = h2Matches.length;
    if (h2Matches.length >= 3) score += 5;

    // Links exist in sections
    const linkMatches = text.match(/\[.*?\]\(.*?\)/g) || [];
    details.link_count = linkMatches.length;
    if (linkMatches.length > 0) score += 3;

    // Link reachability (sample up to 5 links)
    const urls = linkMatches
      .map(l => l.match(/\((https?:\/\/[^)]+)\)/)?.[1])
      .filter(Boolean)
      .slice(0, 5) as string[];

    let reachable = 0;
    for (const url of urls) {
      try {
        const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        if (r.ok) reachable++;
      } catch { /* skip */ }
    }
    details.links_checked = urls.length;
    details.links_reachable = reachable;
    if (urls.length > 0) {
      score += Math.round((reachable / urls.length) * 7);
    } else {
      // no links to check, give partial credit
      score += 3;
    }

  } catch (e: any) {
    details.error = e.message;
  }

  return { score, max: 25, details };
}

// ========== Layer 2: JSON-LD Coverage (25 points) ==========

async function scoreJsonLd(baseUrl: string): Promise<LayerResult> {
  const details: Record<string, any> = {};
  let score = 0;

  // Sample pages to check
  const pages = [
    '/',
    '/about',
    '/articles',
  ];

  // Also try to find article pages from llms.txt links
  try {
    const llmsRes = await fetch(`${baseUrl}/llms.txt`);
    if (llmsRes.ok) {
      const llmsText = await llmsRes.text();
      const articleLinks = (llmsText.match(/\((\/articles\/[^)]+)\)/g) || [])
        .map(l => l.slice(1, -1))
        .slice(0, 3);
      pages.push(...articleLinks);
    }
  } catch { /* skip */ }

  const uniquePages = [...new Set(pages)].slice(0, 10);
  let pagesWithSchema = 0;
  let totalProperties = 0;
  let expectedProperties = 0;
  let hasPersonId = false;
  let duplicateEntities = 0;
  const pageResults: Record<string, any> = {};

  for (const page of uniquePages) {
    try {
      const url = page.startsWith('http') ? page : `${baseUrl}${page}`;
      const res = await fetch(url);
      if (!res.ok) continue;

      const html = await res.text();
      const jsonLdMatches = html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
      ) || [];

      const schemas: any[] = [];
      for (const match of jsonLdMatches) {
        const json = match.replace(/<\/?script[^>]*>/g, '');
        try {
          const parsed = JSON.parse(json);
          // Handle @graph
          if (parsed['@graph']) {
            schemas.push(...parsed['@graph']);
          } else {
            schemas.push(parsed);
          }
        } catch { /* skip invalid */ }
      }

      if (schemas.length > 0) pagesWithSchema++;

      // Check for @id references (good) vs inline duplicates (bad)
      const personSchemas = schemas.filter(
        s => s['@type'] === 'Person' && !s['@id']?.startsWith('#')
      );
      if (personSchemas.length > 0) duplicateEntities++;

      // Check for Person with @id (good practice)
      if (schemas.some(s => s['@type'] === 'Person' && s['@id'])) {
        hasPersonId = true;
      }

      // Check required properties for Article schemas
      const articles = schemas.filter(s =>
        s['@type'] === 'Article' ||
        s['@type'] === 'BlogPosting' ||
        s['@type'] === 'TechArticle'
      );
      for (const article of articles) {
        const required = ['name', 'headline', 'description', 'author', 'datePublished'];
        const present = required.filter(p => article[p] != null);
        totalProperties += present.length;
        expectedProperties += required.length;
      }

      pageResults[page] = {
        schema_count: schemas.length,
        types: schemas.map(s => s['@type']).filter(Boolean),
      };

    } catch { /* skip */ }
  }

  // Coverage: how many sampled pages have schema (10 points)
  const coverage = uniquePages.length > 0
    ? pagesWithSchema / uniquePages.length
    : 0;
  score += Math.round(coverage * 10);
  details.coverage = `${pagesWithSchema}/${uniquePages.length}`;

  // Type correctness: has Person @id (5 points)
  details.has_person_id = hasPersonId;
  if (hasPersonId) score += 5;

  // Property completeness (5 points)
  const completeness = expectedProperties > 0
    ? totalProperties / expectedProperties
    : 0;
  score += Math.round(completeness * 5);
  details.property_completeness = `${totalProperties}/${expectedProperties}`;

  // No duplicate entities (5 points)
  details.duplicate_inline_persons = duplicateEntities;
  if (duplicateEntities === 0) score += 5;

  details.pages = pageResults;

  return { score, max: 25, details };
}

// ========== Layer 3: MCP + A2A Endpoints (25 points) ==========

async function scoreMcpA2a(baseUrl: string): Promise<LayerResult> {
  const details: Record<string, any> = {};
  let score = 0;

  // Check mcp.json (10 points)
  try {
    const res = await fetch(`${baseUrl}/.well-known/mcp.json`);
    details.mcp_status = res.status;
    if (res.ok) {
      const data: any = await res.json();
      score += 5; // reachable + valid JSON

      // Has tools array with items
      if (Array.isArray(data.tools) && data.tools.length > 0) {
        score += 3;
        details.mcp_tool_count = data.tools.length;

        // Each tool has name + description + inputSchema
        const complete = data.tools.every(
          (t: any) => t.name && t.description && t.inputSchema
        );
        if (complete) score += 2;
        details.mcp_tools_complete = complete;
      }
    }
  } catch (e: any) {
    details.mcp_error = e.message;
  }

  // Check agent-card.json (10 points)
  try {
    const res = await fetch(`${baseUrl}/.well-known/agent-card.json`);
    details.agent_card_status = res.status;
    if (res.ok) {
      const data: any = await res.json();
      score += 5; // reachable + valid JSON

      // Required A2A fields
      const hasRequired = data.name && data.description && data.url && data.version;
      if (hasRequired) score += 3;
      details.agent_card_fields = { name: !!data.name, description: !!data.description, url: !!data.url, version: !!data.version };

      // Has skills
      if (Array.isArray(data.skills) && data.skills.length > 0) {
        score += 2;
        details.agent_card_skill_count = data.skills.length;
      }
    }
  } catch (e: any) {
    details.agent_card_error = e.message;
  }

  // Cross-check: mcp.json tools match agent-card.json skills (5 points)
  try {
    const [mcpRes, acRes] = await Promise.all([
      fetch(`${baseUrl}/.well-known/mcp.json`),
      fetch(`${baseUrl}/.well-known/agent-card.json`),
    ]);
    if (mcpRes.ok && acRes.ok) {
      const mcp: any = await mcpRes.json();
      const ac: any = await acRes.json();
      const mcpNames = new Set((mcp.tools || []).map((t: any) => t.name));
      const acNames = new Set((ac.skills || []).map((s: any) => s.id));
      const match = mcpNames.size === acNames.size &&
        [...mcpNames].every(n => acNames.has(n));
      details.tools_skills_match = match;
      if (match) score += 5;
    }
  } catch { /* skip */ }

  return { score, max: 25, details };
}

// ========== Layer 4: AI Comprehension (25 points) ==========

async function scoreAiComprehension(
  baseUrl: string,
  apiKey: string
): Promise<LayerResult> {
  const details: Record<string, any> = {};
  let score = 0;

  // Fetch llms.txt as context
  let context = '';
  try {
    const res = await fetch(`${baseUrl}/llms.txt`);
    if (res.ok) context = await res.text();
  } catch { /* skip */ }

  if (!context) {
    details.error = 'Could not fetch llms.txt for context';
    return { score: 0, max: 25, details };
  }

  // Trim context to avoid token bloat (keep first 3000 chars)
  if (context.length > 3000) {
    context = context.slice(0, 3000) + '\n[...truncated]';
  }

  // 10 factual questions about paulkuo.tw
  const questions = [
    { q: 'What is Paul Kuo\'s Chinese name?', expected: '郭曜郎' },
    { q: 'What is Agora Plaza?', expected_keywords: ['meeting', 'transcription', 'translation', '會議', '翻譯', '逐字稿'] },
    { q: 'How many content pillars does paulkuo.tw have?', expected: '5' },
    { q: 'What is Paul\'s role at SDTI?', expected_keywords: ['BD', 'consultant', '顧問', 'circular economy', '循環經濟'] },
    { q: 'What does CircleFlow do?', expected_keywords: ['circular economy', 'AI', '循環經濟'] },
    { q: 'What is the brand anchor of paulkuo.tw?', expected_keywords: ['秩序測試', 'order'] },
    { q: 'Is paulkuo.tw a personal brand site or a news site?', expected_keywords: ['personal', 'brand', '個人'] },
    { q: 'What technologies does Paul work with?', expected_keywords: ['AI', 'Cloudflare', 'ESG'] },
    { q: 'Name one of Paul\'s content pillars.', expected_keywords: ['AI', '循環經濟', 'circular', '文明', 'civilization', '創造', 'creation', '反思', 'reflection'] },
    { q: 'Where is Paul based?', expected_keywords: ['Taiwan', '台灣'] },
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are evaluating how well a website communicates its identity to AI systems.

Here is the website's llms.txt content:

<llms_txt>
${context}
</llms_txt>

Based ONLY on the information in the llms.txt above, answer each question in 1-2 sentences. If the information is not available, say "NOT FOUND".

Questions:
${questions.map((q, i) => `${i + 1}. ${q.q}`).join('\n')}

Respond in this exact format:
1. [your answer]
2. [your answer]
...`
        }],
      }),
    });

    if (!response.ok) {
      details.api_error = `HTTP ${response.status}`;
      return { score: 0, max: 25, details };
    }

    const data: any = await response.json();
    const answerText = data.content?.[0]?.text || '';
    details.raw_answers = answerText;

    // Parse answers
    const answerLines = answerText.split('\n').filter((l: string) => /^\d+\./.test(l.trim()));
    let correct = 0;

    for (let i = 0; i < questions.length; i++) {
      const answer = (answerLines[i] || '').toLowerCase();
      const q = questions[i];
      let isCorrect = false;

      if (answer.includes('not found')) {
        isCorrect = false;
      } else if ('expected' in q) {
        isCorrect = answer.includes(q.expected.toLowerCase());
      } else if ('expected_keywords' in q) {
        isCorrect = q.expected_keywords.some(kw =>
          answer.includes(kw.toLowerCase())
        );
      }

      if (isCorrect) correct++;
      details[`q${i + 1}`] = { correct: isCorrect, answer: answerLines[i]?.trim() };
    }

    details.correct_count = correct;
    details.total_questions = questions.length;
    score = Math.round((correct / questions.length) * 25);

  } catch (e: any) {
    details.error = e.message;
  }

  return { score, max: 25, details };
}

// ========== Main Handler ==========

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Auth check for all endpoints
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    const expected = (env.EVAL_AUTH_TOKEN || '').trim();
    if (!token || !expected || token !== expected) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST /evaluate — run evaluation
    if (url.pathname === '/evaluate' && request.method === 'POST') {
      try {
        const body: any = await request.json().catch(() => ({}));
        const targetUrl = body.target_url || 'https://paulkuo.tw';
        const experimentId = body.experiment_id || `exp-${Date.now()}`;
        const changeDesc = body.change_description || '';

        // Run all 4 layers
        const [llmsTxt, jsonLd, mcpA2a, aiComp] = await Promise.all([
          scoreLlmsTxt(targetUrl),
          scoreJsonLd(targetUrl),
          scoreMcpA2a(targetUrl),
          scoreAiComprehension(targetUrl, env.ANTHROPIC_API_KEY),
        ]);

        const result: EvalResult = {
          score_total: llmsTxt.score + jsonLd.score + mcpA2a.score + aiComp.score,
          score_llms_txt: llmsTxt.score,
          score_json_ld: jsonLd.score,
          score_mcp_a2a: mcpA2a.score,
          score_ai_comprehension: aiComp.score,
          layers: {
            llms_txt: llmsTxt,
            json_ld: jsonLd,
            mcp_a2a: mcpA2a,
            ai_comprehension: aiComp,
          },
        };

        // Store in D1
        await env.DB.prepare(`
          INSERT INTO ai_ready_results
            (experiment_id, target_url, score_total, score_llms_txt, score_json_ld, score_mcp_a2a, score_ai_comprehension, change_description, raw_details)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          experimentId,
          targetUrl,
          result.score_total,
          result.score_llms_txt,
          result.score_json_ld,
          result.score_mcp_a2a,
          result.score_ai_comprehension,
          changeDesc,
          JSON.stringify(result.layers),
        ).run();

        return new Response(JSON.stringify({
          experiment_id: experimentId,
          target_url: targetUrl,
          score_total: result.score_total,
          score_llms_txt: result.score_llms_txt,
          score_json_ld: result.score_json_ld,
          score_mcp_a2a: result.score_mcp_a2a,
          score_ai_comprehension: result.score_ai_comprehension,
          details: result.layers,
          timestamp: new Date().toISOString(),
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // GET /results — query results
    if (url.pathname === '/results' && request.method === 'GET') {
      const experimentId = url.searchParams.get('experiment_id');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      let stmt;
      if (experimentId) {
        stmt = env.DB.prepare(
          'SELECT * FROM ai_ready_results WHERE experiment_id = ? ORDER BY timestamp DESC'
        ).bind(experimentId);
      } else {
        stmt = env.DB.prepare(
          'SELECT id, experiment_id, target_url, timestamp, score_total, score_llms_txt, score_json_ld, score_mcp_a2a, score_ai_comprehension, change_description, kept FROM ai_ready_results ORDER BY timestamp DESC LIMIT ?'
        ).bind(limit);
      }

      const { results } = await stmt.all();
      return new Response(JSON.stringify(results, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // PATCH /results/:id — update kept status
    if (url.pathname.startsWith('/results/') && request.method === 'PATCH') {
      const id = url.pathname.split('/')[2];
      const body: any = await request.json();
      await env.DB.prepare(
        'UPDATE ai_ready_results SET kept = ? WHERE id = ?'
      ).bind(body.kept ? 1 : 0, id).run();

      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST /init — create table (one-time setup)
    if (url.pathname === '/init' && request.method === 'POST') {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS ai_ready_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          experiment_id TEXT NOT NULL,
          target_url TEXT NOT NULL,
          timestamp TEXT NOT NULL DEFAULT (datetime('now')),
          score_total REAL NOT NULL,
          score_llms_txt REAL NOT NULL,
          score_json_ld REAL NOT NULL,
          score_mcp_a2a REAL NOT NULL,
          score_ai_comprehension REAL NOT NULL,
          change_description TEXT,
          kept INTEGER DEFAULT 0,
          raw_details TEXT
        );
      `);
      return new Response(JSON.stringify({ ok: true, message: 'Table created' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      endpoints: [
        'POST /evaluate — run 4-layer AI-Ready evaluation',
        'GET /results — list recent results',
        'GET /results?experiment_id=xxx — get specific result',
        'PATCH /results/:id — update kept status',
        'POST /init — create D1 table (one-time)',
      ]
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
