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

// ── POST /api/tqef/meeting-export (logged-in user) ──
export async function handleTqefMeetingExport(request, env) {
  // Optional auth — capture user_id if logged in
  let userId = null;
  try {
    const auth = await authenticateRequest(request, env, '');
    if (auth) userId = auth.userId || null;
  } catch (e) {}

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
    return jsonResponse({ error: 'entries array is required and must not be empty' }, 400, request);
  }
  if (body.entries.length > 90) {
    return jsonResponse({ error: 'Too many entries, max 90 per export' }, 400, request);
  }

  const exportId = crypto.randomUUID();
  const now = new Date().toISOString();
  const statements = [];

  // Main table
  statements.push(
    env.AUTH_DB.prepare(`
      INSERT INTO tqef_meeting_exports (
        id, session_id, meeting_date, stt_provider,
        source_lang, target_lang, default_domain,
        total_entries, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      exportId,
      body.session_id || null,
      now.slice(0, 10),
      body.stt_provider || null,
      body.source_lang || null,
      body.target_lang || null,
      body.default_domain || null,
      body.entries.length,
      now
    )
  );

  // Per-entry inserts (id is INTEGER autoincrement, omit it)
  for (let i = 0; i < body.entries.length; i++) {
    const entry = body.entries[i];
    statements.push(
      env.AUTH_DB.prepare(`
        INSERT INTO tqef_meeting_entries (
          export_id, entry_index, timestamp, source_lang,
          stt_output, translation, stt_engine, stt_model
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        exportId,
        entry.entry_index ?? i,
        entry.timestamp || null,
        entry.source_lang || null,
        entry.stt_output || '',
        entry.translation || '',
        entry.stt_engine || null,
        entry.stt_model || null
      )
    );
  }

  try {
    await env.AUTH_DB.batch(statements);
    return jsonResponse({ ok: true, export_id: exportId, entry_count: body.entries.length }, 201, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ── GET /api/tqef/meeting-exports?status=pending (admin only) ──
export async function handleTqefMeetingExportsList(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  let sql = 'SELECT * FROM tqef_meeting_exports';
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';

  const stmt = params.length > 0 ? env.AUTH_DB.prepare(sql).bind(...params) : env.AUTH_DB.prepare(sql);
  const { results } = await stmt.all();
  return jsonResponse({ exports: results, total: results.length }, 200, request);
}

// ── GET /api/tqef/meeting-exports/:id/entries (admin only) ──
export async function handleTqefMeetingExportEntries(request, env, exportId) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const exp = await env.AUTH_DB.prepare('SELECT * FROM tqef_meeting_exports WHERE id = ?').bind(exportId).first();
  if (!exp) return jsonResponse({ error: 'Export not found' }, 404, request);

  const { results } = await env.AUTH_DB.prepare(
    'SELECT * FROM tqef_meeting_entries WHERE export_id = ? ORDER BY entry_index'
  ).bind(exportId).all();

  return jsonResponse({ export: exp, entries: results, total: results.length }, 200, request);
}

// ── POST /api/tqef/meeting-exports/:id/adopt-entry (admin only) ──
export async function handleTqefMeetingAdoptEntry(request, env, exportId) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { entry_id, industry } = body;
  if (!entry_id) return jsonResponse({ error: 'entry_id is required' }, 400, request);

  const entry = await env.AUTH_DB.prepare(
    'SELECT * FROM tqef_meeting_entries WHERE id = ? AND export_id = ?'
  ).bind(entry_id, exportId).first();
  if (!entry) return jsonResponse({ error: 'Entry not found' }, 404, request);

  const corpusId = crypto.randomUUID();
  const now = new Date().toISOString();

  const batch = [
    env.AUTH_DB.prepare(
      'UPDATE tqef_meeting_entries SET is_selected = 1, domain = ?, corpus_id = ? WHERE id = ?'
    ).bind(industry || 'general', corpusId, entry_id),

    env.AUTH_DB.prepare(`
      INSERT INTO tqef_corpus (
        id, source_text, reference_translation, source_origin,
        source_ref, domain, source_lang, target_lang, created_at
      ) VALUES (?, ?, ?, 'meeting_export', ?, ?, ?, ?, ?)
    `).bind(
      corpusId,
      entry.stt_output,
      entry.translation,
      exportId,
      industry || 'general',
      entry.source_lang || 'ja',
      'zh-TW',
      now
    )
  ];

  try {
    await env.AUTH_DB.batch(batch);
    // Update selected_entries count
    const count = await env.AUTH_DB.prepare(
      'SELECT count(*) as cnt FROM tqef_meeting_entries WHERE export_id = ? AND is_selected = 1'
    ).bind(exportId).first();
    await env.AUTH_DB.prepare(
      'UPDATE tqef_meeting_exports SET selected_entries = ? WHERE id = ?'
    ).bind(count?.cnt || 0, exportId).run();

    return jsonResponse({ ok: true, corpus_id: corpusId }, 200, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ── POST /api/tqef/meeting-exports/:id/archive (admin only) ──
export async function handleTqefMeetingArchive(request, env, exportId) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const now = new Date().toISOString();
  await env.AUTH_DB.prepare(
    'UPDATE tqef_meeting_exports SET status = ?, reviewed_at = ? WHERE id = ?'
  ).bind('archived', now, exportId).run();

  return jsonResponse({ ok: true }, 200, request);
}

// ── POST /api/tqef/feedback (public, no admin auth required) ──
export async function handleTqefFeedbackCreate(request, env) {
  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { original, machineTranslation, suggestedTranslation } = body;
  if (!original || !machineTranslation || !suggestedTranslation) {
    return jsonResponse({ error: 'Missing required fields: original, machineTranslation, suggestedTranslation' }, 400, request);
  }

  // Optional auth — capture user_id if logged in
  let userId = null;
  try {
    const auth = await authenticateRequest(request, env, '');
    if (auth) userId = auth.userId || null;
  } catch (e) {}

  const feedbackId = crypto.randomUUID();
  const now = new Date(Date.now() + 8 * 3600000).toISOString().replace('Z', '+08:00');

  try {
    await env.AUTH_DB.prepare(`
      INSERT INTO tqef_feedback (
        id, session_id, timestamp, source_text, original_translation,
        suggested_correction, error_type, stt_provider,
        domain_detected, user_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      feedbackId,
      body.session_id || null,
      now,
      (original || '').slice(0, 500),
      (machineTranslation || '').slice(0, 500),
      (suggestedTranslation || '').slice(0, 500),
      body.error_type || null,
      body.stt_provider || null,
      body.domain || null,
      userId,
      now
    ).run();

    return jsonResponse({ ok: true, feedback_id: feedbackId }, 201, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ── POST /api/tqef/feedback/:id/adopt (admin only) ──
export async function handleTqefFeedbackAdopt(request, env, feedbackId) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  try {
    const feedback = await env.AUTH_DB.prepare(
      'SELECT * FROM tqef_feedback WHERE id = ?'
    ).bind(feedbackId).first();

    if (!feedback) return jsonResponse({ error: 'Feedback not found' }, 404, request);

    const corpusId = crypto.randomUUID();
    const now = new Date().toISOString();

    const batch = [
      env.AUTH_DB.prepare(
        'UPDATE tqef_feedback SET status = ?, reviewed_at = ?, corpus_id = ? WHERE id = ?'
      ).bind('adopted', now, corpusId, feedbackId),

      env.AUTH_DB.prepare(`
        INSERT INTO tqef_corpus (
          id, source_text, reference_translation, source_origin,
          source_ref, domain, created_at
        ) VALUES (?, ?, ?, 'user_feedback', ?, ?, ?)
      `).bind(
        corpusId,
        feedback.source_text,
        feedback.suggested_correction,
        feedbackId,
        feedback.domain_detected || 'general',
        now
      )
    ];

    await env.AUTH_DB.batch(batch);

    return jsonResponse({ ok: true, corpus_id: corpusId }, 200, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ── GET /api/tqef/feedback?status=pending (admin only) ──
export async function handleTqefFeedbackList(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  let sql = 'SELECT * FROM tqef_feedback';
  const params = [];

  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';

  const stmt = params.length > 0 ? env.AUTH_DB.prepare(sql).bind(...params) : env.AUTH_DB.prepare(sql);
  const { results } = await stmt.all();
  return jsonResponse({ feedback: results, total: results.length }, 200, request);
}

// ── POST /api/tqef/feedback/:id/reject (admin only) ──
export async function handleTqefFeedbackReject(request, env, feedbackId) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let note = null;
  try { const body = await request.json(); note = body.note || null; } catch (e) {}

  const now = new Date().toISOString();
  await env.AUTH_DB.prepare(
    'UPDATE tqef_feedback SET status = ?, review_note = ?, reviewed_at = ? WHERE id = ?'
  ).bind('rejected', note, now, feedbackId).run();

  return jsonResponse({ ok: true }, 200, request);
}

// ── POST /api/tqef/feedback/:id/defer (admin only) ──
export async function handleTqefFeedbackDefer(request, env, feedbackId) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let note = null;
  try { const body = await request.json(); note = body.note || null; } catch (e) {}

  const now = new Date().toISOString();
  await env.AUTH_DB.prepare(
    'UPDATE tqef_feedback SET status = ?, review_note = ?, reviewed_at = ? WHERE id = ?'
  ).bind('deferred', note, now, feedbackId).run();

  return jsonResponse({ ok: true }, 200, request);
}
