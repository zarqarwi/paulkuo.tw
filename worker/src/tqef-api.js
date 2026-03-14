/**
 * TQEF Admin API — Phase 1
 * Endpoints: dashboard, corpus CRUD, rounds list/detail/compare, eval upload
 */
import { corsHeaders, jsonResponse } from './utils.js';
import { authenticateRequest } from './auth.js';

// ── Admin guard (session or invite code) ──
async function requireAdmin(request, env) {
  const url = new URL(request.url);
  const auth = await authenticateRequest(request, env, url.searchParams.get('code') || '');
  if (!auth || !auth.isAdmin) return null;
  return auth;
}

// ── GET /api/tqef/dashboard ──
export async function handleTqefDashboard(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const latest = await env.AUTH_DB.prepare(
    'SELECT * FROM tqef_rounds ORDER BY completed_at DESC, round_id DESC LIMIT 1'
  ).first();

  const { results: rounds } = await env.AUTH_DB.prepare(
    'SELECT round_id, completed_at, l2_overall, l2_term, l2_fluency, l2_context, l2_format, l2_critical_errors, metadata FROM tqef_rounds ORDER BY completed_at ASC, round_id ASC'
  ).all();

  const corpusCount = await env.AUTH_DB.prepare('SELECT count(*) as cnt FROM tqef_corpus WHERE is_active = 1').first();

  return jsonResponse({ latest, rounds, corpus_count: corpusCount?.cnt || 0 }, 200, request);
}

// ── GET /api/tqef/corpus?domain=&source_origin=&has_audio= ──
export async function handleTqefCorpus(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const url = new URL(request.url);
  let sql = 'SELECT * FROM tqef_corpus WHERE is_active = 1';
  const params = [];

  const domain = url.searchParams.get('domain');
  if (domain) { sql += ' AND domain = ?'; params.push(domain); }

  const origin = url.searchParams.get('source_origin');
  if (origin) { sql += ' AND source_origin = ?'; params.push(origin); }

  const hasAudio = url.searchParams.get('has_audio');
  if (hasAudio !== null && hasAudio !== '') { sql += ' AND has_audio = ?'; params.push(parseInt(hasAudio)); }

  sql += ' ORDER BY id';

  const stmt = params.length > 0 ? env.AUTH_DB.prepare(sql).bind(...params) : env.AUTH_DB.prepare(sql);
  const { results } = await stmt.all();
  return jsonResponse({ corpus: results, total: results.length }, 200, request);
}

// ── POST /api/tqef/corpus ──
export async function handleTqefCorpusCreate(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { id, domain, source_text } = body;
  if (!id || !domain || !source_text) return jsonResponse({ error: 'id, domain, source_text required' }, 400, request);

  await env.AUTH_DB.prepare(
    `INSERT INTO tqef_corpus (id, domain, source_lang, target_lang, source_text, reference_translation, difficulty, tags, source_origin, context)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, domain,
    body.source_lang || 'ja', body.target_lang || 'zh-TW',
    source_text, body.reference_translation || null,
    body.difficulty || 'medium', body.tags ? JSON.stringify(body.tags) : null,
    body.source_origin || 'manual', body.context || null
  ).run();

  return jsonResponse({ success: true, id }, 201, request);
}

// ── POST /api/tqef/corpus/import ── (bulk import from corpus.json)
export async function handleTqefCorpusImport(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const items = body.corpus || [];
  let imported = 0;

  for (const item of items) {
    if (!item.id || !item.domain || !item.source_text) continue;
    await env.AUTH_DB.prepare(
      `INSERT OR IGNORE INTO tqef_corpus (id, domain, source_lang, target_lang, source_text, reference_translation, difficulty, tags, source_origin, context)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      item.id, item.domain,
      item.source_lang || 'ja', item.target_lang || 'zh-TW',
      item.source_text, item.reference_translation || null,
      item.difficulty || 'medium', item.tags ? JSON.stringify(item.tags) : null,
      item.source_origin || 'manual', item.context || null
    ).run();
    imported++;
  }

  return jsonResponse({ success: true, imported }, 200, request);
}

// ── PUT /api/tqef/corpus/:id ──
export async function handleTqefCorpusUpdate(request, env, id) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const fields = [];
  const values = [];
  for (const key of ['domain', 'source_lang', 'target_lang', 'source_text', 'reference_translation', 'difficulty', 'context', 'source_origin']) {
    if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
  }
  if (body.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(body.tags)); }

  if (fields.length === 0) return jsonResponse({ error: 'No fields to update' }, 400, request);

  values.push(id);
  await env.AUTH_DB.prepare(`UPDATE tqef_corpus SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  return jsonResponse({ success: true, id }, 200, request);
}

// ── DELETE /api/tqef/corpus/:id (soft delete) ──
export async function handleTqefCorpusDelete(request, env, id) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  await env.AUTH_DB.prepare('UPDATE tqef_corpus SET is_active = 0 WHERE id = ?').bind(id).run();
  return jsonResponse({ success: true, id }, 200, request);
}

// ── GET /api/tqef/rounds ──
export async function handleTqefRounds(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const { results } = await env.AUTH_DB.prepare(
    'SELECT * FROM tqef_rounds ORDER BY completed_at DESC, round_id DESC'
  ).all();
  return jsonResponse({ rounds: results, total: results.length }, 200, request);
}

// ── GET /api/tqef/rounds/:id ──
export async function handleTqefRoundDetail(request, env, roundId) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const round = await env.AUTH_DB.prepare('SELECT * FROM tqef_rounds WHERE round_id = ?').bind(roundId).first();
  if (!round) return jsonResponse({ error: 'Round not found' }, 404, request);

  const { results } = await env.AUTH_DB.prepare(
    'SELECT r.*, c.domain, c.source_text, c.reference_translation FROM tqef_results r LEFT JOIN tqef_corpus c ON r.sentence_id = c.id WHERE r.round_id = ? ORDER BY r.sentence_id'
  ).bind(roundId).all();

  return jsonResponse({ round, results, total: results.length }, 200, request);
}

// ── GET /api/tqef/rounds/:id/compare/:id2 ──
export async function handleTqefRoundCompare(request, env, id1, id2) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const round1 = await env.AUTH_DB.prepare('SELECT * FROM tqef_rounds WHERE round_id = ?').bind(id1).first();
  const round2 = await env.AUTH_DB.prepare('SELECT * FROM tqef_rounds WHERE round_id = ?').bind(id2).first();
  if (!round1 || !round2) return jsonResponse({ error: 'Round not found' }, 404, request);

  const { results: r1 } = await env.AUTH_DB.prepare('SELECT * FROM tqef_results WHERE round_id = ? ORDER BY sentence_id').bind(id1).all();
  const { results: r2 } = await env.AUTH_DB.prepare('SELECT * FROM tqef_results WHERE round_id = ? ORDER BY sentence_id').bind(id2).all();

  return jsonResponse({ round1, round2, results1: r1, results2: r2 }, 200, request);
}

// ── POST /api/tqef/eval/upload ──
// Handles 3 JSON formats: legacy, R7, R8+
export async function handleTqefEvalUpload(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { round_id, data } = body;
  if (!round_id || !data) return jsonResponse({ error: 'round_id and data required' }, 400, request);

  // Format detection
  const hasOverallNoSummary = 'overall' in data && !('summary' in data);
  const hasRun = 'run' in data;
  let fmt = 'r8plus';
  if (hasOverallNoSummary) fmt = 'legacy';
  else if (hasRun) fmt = 'r7';

  // Extract summary
  const summary = fmt === 'legacy' ? data.overall : data.summary;
  const l2Overall = summary.overall || summary.weighted_total;
  const perIndustry = data.per_industry || data.industry_breakdown || null;

  const metadata = JSON.stringify({
    cn_terms: summary.cn_terms || 0,
    per_industry: perIndustry,
    status: summary.status || '',
    format: fmt,
  });

  // Upsert round
  await env.AUTH_DB.prepare(
    `INSERT OR REPLACE INTO tqef_rounds (round_id, eval_mode, corpus_version_id, translation_model, completed_at, l2_overall, l2_term, l2_fluency, l2_context, l2_format, l2_critical_errors, metadata)
     VALUES (?, 'translation_only', 1, 'claude-haiku-4-5', ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    round_id, data.timestamp || new Date().toISOString(),
    l2Overall, summary.terminology, summary.naturalness, summary.fidelity, summary.critical_data,
    summary.critical_errors || 0, metadata
  ).run();

  // Clear old results for re-upload
  await env.AUTH_DB.prepare('DELETE FROM tqef_results WHERE round_id = ?').bind(round_id).run();

  // Insert results with format-aware scores extraction
  let inserted = 0;
  for (const r of (data.results || [])) {
    // Extract scores based on format
    let scores = null;
    const hasError = ('error' in r && !('scores' in r) && !('judgment' in r));
    if (!hasError) {
      if (r.judgment && r.judgment.scores) scores = r.judgment.scores;   // legacy & R8+
      else if (r.scores) scores = r.scores;                              // R7
    }

    const translation = r.haiku_output || r.translated || '';
    const errors = r.judgment?.errors || r.errors || [];
    const weighted = r.judgment?.weighted_total || r.weighted_total || null;
    const isCritical = errors.some(e => e.severity === 'critical') ? 1 : 0;

    const notes = JSON.stringify({
      errors, weighted_total: weighted,
      ...(hasError ? { parse_error: r.error || 'scores missing' } : {}),
    });

    await env.AUTH_DB.prepare(
      `INSERT INTO tqef_results (round_id, sentence_id, translation, l2_term, l2_fluency, l2_context, l2_format, is_critical_error, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      round_id, r.id, translation,
      scores?.terminology ?? null, scores?.naturalness ?? null,
      scores?.fidelity ?? null, scores?.critical_data ?? null,
      isCritical, notes
    ).run();
    inserted++;
  }

  return jsonResponse({ success: true, round_id, inserted }, 201, request);
}
