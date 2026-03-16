/**
 * TQEF Admin API — Phase 1
 * Endpoints: dashboard, corpus CRUD, rounds list/detail/compare, eval upload
 */
import { corsHeaders, jsonResponse } from './utils.js';
import { authenticateRequest } from './auth.js';
import * as OpenCC from 'opencc-js/cn2t';
import { semiPostProcess, circularPostProcess } from './translator.js';

// CN→TW conversion: opencc-js (TWP = Taiwan with Phrases) + domain-specific dictionaries
const ocConverter = OpenCC.ConverterFactory(OpenCC.Locale.from.cn, OpenCC.Locale.to.twp);

function cnToTw(text, domain) {
  if (!text) return text;
  // Step 1: opencc-js 做字級 + 通用詞彙的簡繁轉換
  text = ocConverter(text);
  // Step 2: domain-specific 術語字典（在 opencc 之後套用，覆蓋更精確的翻譯）
  if (domain === 'semiconductor') text = semiPostProcess(text);
  if (domain === 'circular') text = circularPostProcess(text);
  return text;
}

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

  sql += ' ORDER BY created_at DESC';

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

// ═══════════════════════════════════════════════════════════
// Channel C: Corpus Intake (audio + text)
// ═══════════════════════════════════════════════════════════

const AUDIO_MIME_TYPES = new Set([
  'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav',
  'audio/webm', 'audio/ogg', 'video/mp4',
]);

// STT engine routing by language
function getSttEngine(language) {
  if (language === 'zh') return { engine: 'qwen', mode: 'async' };
  if (language === 'en') return { engine: 'groq', mode: 'sync' };
  return { engine: 'deepgram', mode: 'sync' };
}

// ── POST /api/tqef/upload-text ── (parse txt → split sentences)
export async function handleTqefUploadText(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const contentType = request.headers.get('Content-Type') || '';
  let text = '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return jsonResponse({ error: 'No file uploaded' }, 400, request);
    text = await file.text();
  } else {
    try {
      const body = await request.json();
      text = body.text || '';
    } catch (e) {
      return jsonResponse({ error: 'Invalid request' }, 400, request);
    }
  }

  if (!text.trim()) return jsonResponse({ error: 'Empty text' }, 400, request);

  // Split by newlines, trim, filter empty
  const sentences = text.split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return jsonResponse({ sentences, total: sentences.length }, 200, request);
}

// ── POST /api/tqef/corpus/batch ── (batch write confirmed sentences)
export async function handleTqefCorpusBatch(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { sentences, domain, language } = body;
  if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
    return jsonResponse({ error: 'sentences array required' }, 400, request);
  }
  if (!domain) return jsonResponse({ error: 'domain required' }, 400, request);

  const lang = language || 'zh';
  const statements = [];
  const ids = [];

  for (const text of sentences) {
    if (!text || typeof text !== 'string' || !text.trim()) continue;
    const id = crypto.randomUUID();
    ids.push(id);
    statements.push(
      env.AUTH_DB.prepare(`
        INSERT INTO tqef_corpus (id, domain, source_lang, source_text, source_origin, created_at)
        VALUES (?, ?, ?, ?, 'intake_text', datetime('now'))
      `).bind(id, domain, lang, text.trim())
    );
  }

  if (statements.length === 0) return jsonResponse({ error: 'No valid sentences' }, 400, request);

  try {
    await env.AUTH_DB.batch(statements);
    return jsonResponse({ ok: true, inserted: statements.length, ids }, 201, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ── POST /api/tqef/upload-audio ── (multipart: file + language + domain)
export async function handleTqefUploadAudio(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const formData = await request.formData();
  const file = formData.get('file');
  const language = formData.get('language') || 'zh';
  const domain = formData.get('domain') || 'general';

  if (!file) return jsonResponse({ error: 'No file uploaded' }, 400, request);

  const mime = file.type || '';
  if (!AUDIO_MIME_TYPES.has(mime)) {
    return jsonResponse({ error: `Unsupported audio type: ${mime}` }, 400, request);
  }

  const id = crypto.randomUUID();
  const ext = file.name?.split('.').pop() || 'bin';
  const dateStr = new Date().toISOString().slice(0, 10);
  const r2Key = `uploads/${dateStr}/${id}.${ext}`;

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await env.TQEF_AUDIO.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: mime },
    customMetadata: { originalName: file.name || 'unknown', language, domain },
  });

  // Determine STT engine
  const { engine, mode } = getSttEngine(language);

  // Create DB record
  await env.AUTH_DB.prepare(`
    INSERT INTO tqef_intake_audio (id, filename, r2_key, file_size, mime_type, language, domain, stt_engine, stt_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, file.name || 'unknown', r2Key, arrayBuffer.byteLength, mime, language, domain, engine, 'processing').run();

  // For sync engines, run STT immediately
  if (mode === 'sync') {
    try {
      let transcript = '';
      if (engine === 'groq') {
        transcript = await callGroqWhisper(env, arrayBuffer, file.name || 'audio.mp3');
      } else {
        transcript = await callDeepgram(env, arrayBuffer, language);
      }
      await env.AUTH_DB.prepare(
        'UPDATE tqef_intake_audio SET stt_status = ?, stt_raw = ? WHERE id = ?'
      ).bind('done', transcript, id).run();

      return jsonResponse({ ok: true, upload_id: id, stt_status: 'done', transcript: cnToTw(transcript, domain), engine }, 201, request);
    } catch (e) {
      await env.AUTH_DB.prepare(
        'UPDATE tqef_intake_audio SET stt_status = ? WHERE id = ?'
      ).bind('failed', id).run();
      return jsonResponse({ ok: true, upload_id: id, stt_status: 'failed', error: e.message, engine }, 201, request);
    }
  }

  // For async engine (Qwen filetrans), generate presigned-like URL and submit
  if (engine === 'qwen') {
    try {
      // Generate a presigned URL for Qwen to fetch
      // Cloudflare Worker R2 binding doesn't natively support presigned URLs,
      // so we use a signed custom header approach via a temp public URL
      const presignedUrl = await generateR2PresignedUrl(env, r2Key);
      const taskId = await submitQwenFiletrans(env, presignedUrl);

      await env.AUTH_DB.prepare(
        'UPDATE tqef_intake_audio SET stt_task_id = ? WHERE id = ?'
      ).bind(taskId, id).run();

      return jsonResponse({ ok: true, upload_id: id, stt_status: 'processing', task_id: taskId, engine }, 201, request);
    } catch (e) {
      await env.AUTH_DB.prepare(
        'UPDATE tqef_intake_audio SET stt_status = ? WHERE id = ?'
      ).bind('failed', id).run();
      return jsonResponse({ ok: true, upload_id: id, stt_status: 'failed', error: e.message, engine }, 201, request);
    }
  }

  return jsonResponse({ ok: true, upload_id: id, stt_status: 'processing', engine }, 201, request);
}

// ── GET /api/tqef/stt-status/:id ── (poll STT progress)
export async function handleTqefSttStatus(request, env, uploadId) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const record = await env.AUTH_DB.prepare('SELECT * FROM tqef_intake_audio WHERE id = ?').bind(uploadId).first();
  if (!record) return jsonResponse({ error: 'Upload not found' }, 404, request);

  // If already done or failed, return immediately
  if (record.stt_status === 'done' || record.stt_status === 'failed') {
    const resp = {
      upload_id: uploadId,
      stt_status: record.stt_status,
      transcript: record.stt_status === 'done' ? cnToTw(record.stt_raw, record.domain) : record.stt_raw,
      engine: record.stt_engine,
    };
    if (record.stt_status === 'failed' && record.stt_raw) {
      try { resp.error_detail = JSON.parse(record.stt_raw); } catch (e) { resp.error_detail = record.stt_raw; }
    }
    return jsonResponse(resp, 200, request);
  }

  // For Qwen async: poll the task
  if (record.stt_engine === 'qwen' && record.stt_task_id) {
    try {
      const result = await pollQwenTask(env, record.stt_task_id);
      if (result.task_status === 'SUCCEEDED') {
        const transcript = await fetchQwenTranscript(result);
        await env.AUTH_DB.prepare(
          'UPDATE tqef_intake_audio SET stt_status = ?, stt_raw = ? WHERE id = ?'
        ).bind('done', transcript, uploadId).run();
        return jsonResponse({ upload_id: uploadId, stt_status: 'done', transcript: cnToTw(transcript, record.domain), engine: 'qwen' }, 200, request);
      }
      if (result.task_status === 'FAILED') {
        const rawJson = JSON.stringify(result._raw || result);
        await env.AUTH_DB.prepare(
          'UPDATE tqef_intake_audio SET stt_status = ?, stt_raw = ? WHERE id = ?'
        ).bind('failed', rawJson, uploadId).run();
        return jsonResponse({ upload_id: uploadId, stt_status: 'failed', engine: 'qwen', error_detail: result._raw || result }, 200, request);
      }
      // Still running (PENDING / RUNNING / UNKNOWN)
      return jsonResponse({ upload_id: uploadId, stt_status: 'processing', engine: 'qwen' }, 200, request);
    } catch (e) {
      return jsonResponse({ upload_id: uploadId, stt_status: 'processing', error: e.message, engine: 'qwen' }, 200, request);
    }
  }

  return jsonResponse({ upload_id: uploadId, stt_status: record.stt_status, engine: record.stt_engine }, 200, request);
}

// ── POST /api/tqef/audio/:id/correct ── (submit corrected transcript → write corpus)
export async function handleTqefAudioCorrect(request, env, uploadId) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { corrected_text } = body;
  if (!corrected_text || !corrected_text.trim()) {
    return jsonResponse({ error: 'corrected_text required' }, 400, request);
  }

  const record = await env.AUTH_DB.prepare('SELECT * FROM tqef_intake_audio WHERE id = ?').bind(uploadId).first();
  if (!record) return jsonResponse({ error: 'Upload not found' }, 404, request);

  const corpusId = crypto.randomUUID();

  const batch = [
    env.AUTH_DB.prepare(`
      INSERT INTO tqef_corpus (
        id, domain, source_lang, source_text,
        has_audio, source_origin, source_ref, created_at
      ) VALUES (?, ?, ?, ?, 1, 'intake_audio', ?, datetime('now'))
    `).bind(
      corpusId, record.domain, record.language,
      corrected_text.trim(), record.r2_key
    ),
  ];

  try {
    await env.AUTH_DB.batch(batch);
    return jsonResponse({ ok: true, corpus_id: corpusId, upload_id: uploadId }, 201, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ═══════════════════════════════════════════════════════════
// STT Engine Helpers
// ═══════════════════════════════════════════════════════════

// Groq Whisper — sync file upload
async function callGroqWhisper(env, audioBuffer, filename) {
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer]), filename);
  formData.append('model', 'whisper-large-v3-turbo');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq STT failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.text || '';
}

// Deepgram Nova-3 — sync file upload
async function callDeepgram(env, audioBuffer, language) {
  const params = new URLSearchParams({
    model: 'nova-3',
    language: language || 'ja',
    punctuate: 'true',
  });

  const res = await fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${env.DEEPGRAM_API_KEY}`,
      'Content-Type': 'audio/mpeg',
    },
    body: audioBuffer,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Deepgram STT failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
}

// Qwen filetrans — async submission
async function submitQwenFiletrans(env, fileUrl) {
  console.log('[Qwen filetrans] submitting file_url:', fileUrl);
  const res = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/audio/asr/transcription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'qwen3-asr-flash-filetrans',
      input: { file_url: fileUrl },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Qwen filetrans submit failed (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.output?.task_id || '';
}

// Qwen filetrans — poll task status
async function pollQwenTask(env, taskId) {
  const res = await fetch(`https://dashscope-intl.aliyuncs.com/api/v1/tasks/${taskId}`, {
    headers: { 'Authorization': `Bearer ${env.DASHSCOPE_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Qwen poll failed (${res.status})`);
  const data = await res.json();
  // Attach full raw response for debug — stored to stt_raw on both success and failure
  return { ...(data.output || {}), _raw: JSON.stringify(data) };
}

// Fetch transcript from Qwen filetrans transcription_url
async function fetchQwenTranscript(output) {
  // Qwen filetrans returns a transcription_url that must be fetched separately
  const url = output.result?.transcription_url || output.results?.[0]?.transcription_url;
  if (!url) return JSON.stringify(output);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch transcription_url (${res.status})`);
  const data = await res.json();

  // transcription_url JSON contains transcripts array with sentences
  try {
    const transcripts = data.transcripts || [];
    return transcripts
      .map(t => (t.sentences || []).map(s => s.text || '').join(''))
      .join('')
      .trim() || JSON.stringify(data);
  } catch (e) {
    return JSON.stringify(data);
  }
}

// Generate a temporary accessible URL for R2 object (for Qwen server-to-server fetch)
// Cloudflare Worker R2 binding doesn't support native presigned URLs,
// so we create a short-lived signed URL using the Worker itself as proxy,
// or use R2's createSignedUrl if available on the binding
async function generateR2PresignedUrl(env, r2Key) {
  // Try the newer R2 binding method first
  if (env.TQEF_AUDIO.createSignedUrl) {
    return await env.TQEF_AUDIO.createSignedUrl(r2Key, { expiresIn: 900 });
  }
  // Fallback: serve through worker with a time-limited token
  // This requires the worker to have a /api/tqef/audio-proxy/:token route
  const token = crypto.randomUUID();
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hour — Qwen filetrans is async and may queue
  await env.AUTH_DB.prepare(
    `INSERT OR REPLACE INTO tqef_intake_audio_tokens (token, r2_key, expires_at) VALUES (?, ?, ?)`
  ).bind(token, r2Key, expiry).run();
  // Return a URL that Qwen can fetch
  return `https://api.paulkuo.tw/api/tqef/audio-proxy/${token}`;
}

// ── GET /api/tqef/audio-proxy/:token ── (serve R2 audio for Qwen)
export async function handleTqefAudioProxy(request, env, token) {
  // Look up token
  const record = await env.AUTH_DB.prepare(
    'SELECT * FROM tqef_intake_audio_tokens WHERE token = ?'
  ).bind(token).first();

  if (!record || record.expires_at < Date.now()) {
    return new Response('Not found or expired', { status: 404 });
  }

  // Fetch from R2 and stream
  const object = await env.TQEF_AUDIO.get(record.r2_key);
  if (!object) return new Response('Object not found', { status: 404 });

  // Do NOT delete the token here — Qwen filetrans may retry the fetch.
  // Tokens expire naturally via expires_at check above.

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'audio/mpeg',
      'Content-Length': object.size?.toString() || '',
      'Cache-Control': 'no-store',
    },
  });
}

// ══════════════════════════════════════════════════════════════
// Channel D: YouTube 字幕進件
// ══════════════════════════════════════════════════════════════

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&#]+)/,
    /(?:youtu\.be\/)([^?&#]+)/,
    /(?:youtube\.com\/embed\/)([^?&#]+)/,
    /(?:youtube\.com\/shorts\/)([^?&#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

function parseTranscriptXml(xml) {
  const segments = [];
  const regex = /<text start="([^"]+)" dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const text = decodeXmlEntities(match[3]);
    if (!text) continue;
    segments.push({
      start: parseFloat(match[1]),
      duration: parseFloat(match[2]),
      text,
    });
  }
  return segments;
}

/**
 * Parse YouTube JSON3 transcript format (newer format YouTube may return)
 * Format: {"events":[{"tStartMs":0,"dDurationMs":5000,"segs":[{"utf8":"text"}]},...],...}
 */
function parseTranscriptJson(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.events) return [];
    const segments = [];
    for (const ev of data.events) {
      if (!ev.segs) continue;
      const text = ev.segs.map(s => s.utf8 || '').join('').trim();
      if (!text || text === '\n') continue;
      segments.push({
        start: (ev.tStartMs || 0) / 1000,
        duration: (ev.dDurationMs || 0) / 1000,
        text,
      });
    }
    return segments;
  } catch (e) {
    return [];
  }
}

/**
 * 合併過短 segment，以標點斷句
 * - 太短 segment（< 5 字）向下合併
 * - 以標點符號（。！？.!?）為優先斷點
 * - 合併後超過 100 字則在最近標點處切分
 */
function mergeSegments(segments) {
  if (segments.length === 0) return [];

  const merged = [];
  let buffer = '';
  let bufStart = segments[0]?.start || 0;

  for (const seg of segments) {
    if (buffer === '') bufStart = seg.start;
    buffer += (buffer ? ' ' : '') + seg.text;

    // Check if buffer ends with sentence-ending punctuation and is long enough
    const endsWithPunct = /[。！？.!?]$/.test(buffer.trim());
    if (endsWithPunct && buffer.length >= 5) {
      merged.push({ start: bufStart, text: buffer.trim() });
      buffer = '';
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    merged.push({ start: bufStart, text: buffer.trim() });
  }

  // Post-pass: split any segment > 100 chars at nearest punctuation
  const result = [];
  for (const seg of merged) {
    if (seg.text.length <= 100) {
      result.push(seg);
      continue;
    }
    let remaining = seg.text;
    let start = seg.start;
    while (remaining.length > 100) {
      // Find nearest punctuation within first 100 chars
      let splitIdx = -1;
      for (let i = Math.min(99, remaining.length - 1); i >= 20; i--) {
        if (/[。！？.!?，,；;]/.test(remaining[i])) {
          splitIdx = i;
          break;
        }
      }
      if (splitIdx === -1) splitIdx = 99; // hard split at 100
      result.push({ start, text: remaining.slice(0, splitIdx + 1).trim() });
      remaining = remaining.slice(splitIdx + 1).trim();
      start = seg.start; // approximate
    }
    if (remaining) result.push({ start, text: remaining });
  }

  // Post-pass: merge short segments (< 5 chars) with next
  const final = [];
  for (let i = 0; i < result.length; i++) {
    if (result[i].text.length < 5 && i + 1 < result.length) {
      result[i + 1] = {
        start: result[i].start,
        text: result[i].text + ' ' + result[i + 1].text,
      };
    } else {
      final.push(result[i]);
    }
  }

  return final;
}

// ── POST /api/tqef/youtube-transcript ──
// Request: { videoUrl: string, lang?: string }
// Response: { videoId, tracks[], segments[] }
export async function handleTqefYoutubeTranscript(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { videoUrl, lang } = body;
  if (!videoUrl) return jsonResponse({ error: 'videoUrl required' }, 400, request);

  const videoId = extractVideoId(videoUrl);
  if (!videoId) return jsonResponse({ error: 'Cannot parse video ID from URL' }, 400, request);

  try {
    // 1. Fetch YouTube watch page to extract INNERTUBE_API_KEY and title
    const watchResp = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!watchResp.ok) {
      return jsonResponse({ error: `YouTube page fetch error: ${watchResp.status}` }, 502, request);
    }

    const html = await watchResp.text();

    // Extract title
    const titleMatch = html.match(/"title":"(.*?)"/);
    const title = titleMatch ? titleMatch[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"') : '';

    // Extract INNERTUBE_API_KEY from page
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
    const apiKey = apiKeyMatch ? apiKeyMatch[1] : 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

    // 2. Call Innertube /player with ANDROID client to get captionTracks
    //    ANDROID client returns baseUrls without exp=xpe (no PoToken required)
    const innertubeResp = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
        videoId,
      }),
    });

    if (!innertubeResp.ok) {
      return jsonResponse({ error: `Innertube API error: ${innertubeResp.status}` }, 502, request);
    }

    const innertubeData = await innertubeResp.json();
    const captionsRenderer = innertubeData?.captions?.playerCaptionsTracklistRenderer;
    const captionTracks = captionsRenderer?.captionTracks || [];

    if (captionTracks.length === 0) {
      return jsonResponse({ error: 'No captions available for this video', videoId, title }, 404, request);
    }

    // 3. Build tracks list for frontend
    const tracks = captionTracks.map(t => ({
      lang: t.languageCode,
      name: t.name?.runs?.[0]?.text || t.name?.simpleText || t.languageCode,
      kind: t.kind || 'standard',
    }));

    // 4. Pick track: prefer requested lang, else first
    let selectedTrack = captionTracks[0];
    if (lang) {
      const match = captionTracks.find(t => t.languageCode === lang);
      if (match) selectedTrack = match;
    }

    // 5. Fetch transcript body from baseUrl (ANDROID URLs work without PoToken)
    const selectedLang = selectedTrack.languageCode || 'en';
    const trackUrl = selectedTrack.baseUrl.replace('&fmt=srv3', '');

    const transcriptResp = await fetch(trackUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    const transcriptBody = await transcriptResp.text();

    // 6. Parse XML (ANDROID endpoint returns XML by default), fallback to JSON3
    let rawSegments = parseTranscriptXml(transcriptBody);
    if (rawSegments.length === 0) {
      rawSegments = parseTranscriptJson(transcriptBody);
    }
    const segments = mergeSegments(rawSegments);

    return jsonResponse({
      videoId,
      title,
      selectedLang,
      tracks: tracks.map(t => ({ lang: t.lang, name: t.name, kind: t.kind })),
      rawCount: rawSegments.length,
      segments,
    }, 200, request);

  } catch (e) {
    return jsonResponse({ error: 'Failed to fetch transcript: ' + e.message }, 500, request);
  }
}

// ── POST /api/tqef/youtube-corpus ──
// Batch write YouTube segments to corpus
// Request: { videoUrl, videoId, sentences: string[], domain, language }
export async function handleTqefYoutubeCorpus(request, env) {
  if (!await requireAdmin(request, env)) return jsonResponse({ error: 'Unauthorized' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { videoUrl, videoId, sentences, domain, language } = body;
  if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
    return jsonResponse({ error: 'sentences array required' }, 400, request);
  }
  if (!domain) return jsonResponse({ error: 'domain required' }, 400, request);

  const lang = language || 'zh';
  const sourceUrl = videoUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : null);
  const statements = [];
  const ids = [];

  for (const text of sentences) {
    if (!text || typeof text !== 'string' || !text.trim()) continue;
    const id = crypto.randomUUID();
    ids.push(id);
    statements.push(
      env.AUTH_DB.prepare(`
        INSERT INTO tqef_corpus (id, domain, source_lang, source_text, source_origin, source_url, created_at)
        VALUES (?, ?, ?, ?, 'youtube', ?, datetime('now'))
      `).bind(id, domain, lang, text.trim(), sourceUrl)
    );
  }

  if (statements.length === 0) return jsonResponse({ error: 'No valid sentences' }, 400, request);

  try {
    await env.AUTH_DB.batch(statements);
    return jsonResponse({ ok: true, inserted: statements.length, ids }, 201, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}
