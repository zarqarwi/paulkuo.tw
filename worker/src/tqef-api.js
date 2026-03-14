/**
 * TQEF Admin API — Phase 1
 * Endpoints: corpus, rounds, rounds/:id, eval/upload
 */
import { corsHeaders, jsonResponse } from './utils.js';
import { getCurrentUser } from './auth.js';

// ── Admin guard ──
async function requireAdmin(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== 'admin') return null;
  return user;
}

// ── GET /api/tqef/corpus ──
export async function handleTqefCorpus(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');
  const active = url.searchParams.get('active') !== '0'; // default: active only

  let sql = 'SELECT * FROM tqef_corpus';
  const conditions = [];
  const params = [];

  if (active) { conditions.push('is_active = 1'); }
  if (domain) { conditions.push('domain = ?'); params.push(domain); }

  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY id';

  const stmt = params.length ? env.AUTH_DB.prepare(sql).bind(...params) : env.AUTH_DB.prepare(sql);
  const { results } = await stmt.all();
  return jsonResponse({ corpus: results, count: results.length }, 200, request);
}

// ── POST /api/tqef/corpus/import ── (bulk import from corpus.json)
export async function handleTqefCorpusImport(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const items = Array.isArray(body) ? body : body.corpus;
  if (!items || !items.length) return jsonResponse({ error: 'No corpus items provided' }, 400, request);

  let inserted = 0, skipped = 0;
  for (const item of items) {
    try {
      await env.AUTH_DB.prepare(`
        INSERT OR IGNORE INTO tqef_corpus (id, domain, source_lang, target_lang, source_text, reference_translation, difficulty, focus, critical_terms, critical_numbers, glossary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        item.id,
        item.industry || item.domain || 'unknown',
        'ja',
        'zh-TW',
        item.source_ja || item.source_text || '',
        item.reference_zh_tw || item.reference_translation || '',
        item.difficulty || 'medium',
        JSON.stringify(item.focus || []),
        JSON.stringify(item.critical_terms || {}),
        JSON.stringify(item.critical_numbers || []),
        JSON.stringify(item.glossary || [])
      ).run();
      inserted++;
    } catch (e) {
      skipped++;
    }
  }

  // Auto-snapshot corpus version
  const { results: allCorpus } = await env.AUTH_DB.prepare('SELECT * FROM tqef_corpus WHERE is_active = 1 ORDER BY id').all();
  await env.AUTH_DB.prepare('INSERT INTO tqef_corpus_versions (snapshot, sentence_count, note) VALUES (?, ?, ?)').bind(
    JSON.stringify(allCorpus),
    allCorpus.length,
    `Bulk import: ${inserted} inserted, ${skipped} skipped`
  ).run();

  return jsonResponse({ success: true, inserted, skipped, total: allCorpus.length }, 200, request);
}

// ── GET /api/tqef/rounds ──
export async function handleTqefRounds(request, env) {
  const user = await requireAdmin(request, env);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  const { results } = await env.AUTH_DB.prepare(`
    SELECT round_id, eval_mode, corpus_size, evaluated_count,
           l2_overall, l2_term, l2_fluency, l2_context, l2_format,
           l2_critical_errors, completed_at, translation_model, industry_breakdown
    FROM tqef_rounds ORDER BY completed_at DESC
  `).all();

  // Parse industry_breakdown JSON
  const rounds = results.map(r => ({
    ...r,
    industry_breakdown: r.industry_breakdown ? JSON.parse(r.industry_breakdown) : null
  }));

  return jsonResponse({ rounds, count: rounds.length }, 200, request);
}

// ── GET /api/tqef/rounds/:id ──
export async function handleTqefRoundDetail(request, env, roundId) {
  const user = await requireAdmin(request, env);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  const round = await env.AUTH_DB.prepare('SELECT * FROM tqef_rounds WHERE round_id = ?').bind(roundId).first();
  if (!round) return jsonResponse({ error: 'Round not found' }, 404, request);

  const { results } = await env.AUTH_DB.prepare(`
    SELECT * FROM tqef_results WHERE round_id = ? ORDER BY sentence_id
  `).bind(roundId).all();

  // Parse JSON fields
  round.industry_breakdown = round.industry_breakdown ? JSON.parse(round.industry_breakdown) : null;
  round.metadata = round.metadata ? JSON.parse(round.metadata) : null;

  const detailResults = results.map(r => ({
    ...r,
    errors: r.errors ? JSON.parse(r.errors) : []
  }));

  return jsonResponse({ round, results: detailResults }, 200, request);
}

// ── POST /api/tqef/eval/upload ── (upload evaluation results from eval_runner)
export async function handleTqefEvalUpload(request, env) {
  // Support both admin session and API key (invite code) auth
  const user = await getCurrentUser(request, env);
  const url = new URL(request.url);
  const inviteCode = url.searchParams.get('code') || '';

  let isAuthorized = false;
  if (user && user.role === 'admin') {
    isAuthorized = true;
  } else if (inviteCode) {
    // Check invite code via KV
    try {
      const kvCodes = await env.TICKER_KV.get('invite_codes');
      if (kvCodes) {
        const parsed = JSON.parse(kvCodes);
        const codeKey = inviteCode.trim().toLowerCase();
        if (parsed[codeKey] && parsed[codeKey].role === 'admin') isAuthorized = true;
      }
    } catch (e) {}
  }

  if (!isAuthorized) return jsonResponse({ error: 'Unauthorized' }, 401, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  // Derive round_id: prefer explicit, fallback to body.run, or generate from timestamp
  const roundId = body.round_id || body.run || ('R' + new Date(body.timestamp || Date.now()).getTime());
  const summary = body.summary || {};
  const results = body.results || [];

  // Check for duplicate
  const existing = await env.AUTH_DB.prepare('SELECT round_id FROM tqef_rounds WHERE round_id = ?').bind(roundId).first();
  if (existing) return jsonResponse({ error: `Round ${roundId} already exists` }, 409, request);

  // Insert round
  await env.AUTH_DB.prepare(`
    INSERT INTO tqef_rounds (round_id, eval_mode, corpus_size, evaluated_count, completed_at,
      translation_model, l2_overall, l2_term, l2_fluency, l2_context, l2_format,
      l2_critical_errors, industry_breakdown, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    roundId,
    body.mode || body.eval_mode || 'translation_only',
    body.corpus_size || body.n || results.length,
    body.evaluated || results.length,
    body.timestamp || new Date().toISOString(),
    body.translation_model || 'claude-haiku-4-5',
    summary.overall || null,
    summary.terminology || null,
    summary.naturalness || null,        // naturalness → l2_fluency
    summary.fidelity || null,           // fidelity → l2_context
    summary.critical_data || null,      // critical_data → l2_format
    summary.critical_errors || 0,
    JSON.stringify(body.industry_breakdown || body.per_industry || null),
    JSON.stringify({ cn_terms: summary.cn_terms, status: summary.status })
  ).run();

  // Insert per-sentence results
  let insertedResults = 0, skippedResults = 0;
  for (const r of results) {
    // Skip items with errors (e.g., MIX-001 JSON parse error)
    if (r.error || !r.scores) {
      skippedResults++;
      continue;
    }

    try {
      await env.AUTH_DB.prepare(`
        INSERT INTO tqef_results (round_id, sentence_id, domain, difficulty,
          source_text, reference_translation, translation,
          l2_term, l2_fluency, l2_context, l2_format, weighted_total,
          is_critical_error, errors)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        roundId,
        r.id,
        r.industry || r.domain || null,
        r.difficulty || null,
        r.source || r.source_text || null,
        r.reference || r.reference_translation || null,
        r.haiku_output || r.translated || r.translation || null,
        r.scores?.terminology || null,
        r.scores?.naturalness || null,
        r.scores?.fidelity || null,
        r.scores?.critical_data || null,
        r.weighted_total || null,
        (r.errors && r.errors.some(e => e.severity === 'critical')) ? 1 : 0,
        JSON.stringify(r.errors || [])
      ).run();
      insertedResults++;
    } catch (e) {
      skippedResults++;
    }
  }

  return jsonResponse({
    success: true,
    round_id: roundId,
    summary: {
      overall: summary.overall,
      sentences_inserted: insertedResults,
      sentences_skipped: skippedResults
    }
  }, 200, request);
}
