import { PRICING, TNAMES, STT_RATE_LIMIT, TRANSLATE_RATE_LIMIT, GROQ_STT_RATE_LIMIT, GOOGLE_STT_RATE_LIMIT, GOOGLE_STT_PROJECT, GOOGLE_STT_LOCATION } from './config.js';
import { corsHeaders, jsonResponse, checkRateLimit } from './utils.js';
import { authenticateRequest, checkBudget } from './auth.js';
import { logCost } from './costs.js';

let googleAccessTokenCache = { token: null, expiresAt: 0 };
async function getGoogleAccessToken(env) {
  if (googleAccessTokenCache.token && Date.now() < googleAccessTokenCache.expiresAt - 300000) return googleAccessTokenCache.token;
  const saKeyJson = env.GOOGLE_SA_KEY; if (!saKeyJson) throw new Error('GOOGLE_SA_KEY not configured');
  let saKey; try { saKey = JSON.parse(saKeyJson); } catch (e) { throw new Error('GOOGLE_SA_KEY is not valid JSON'); }
  const now = Math.floor(Date.now() / 1000);
  const b64url = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = b64url({ alg: 'RS256', typ: 'JWT' }) + '.' + b64url({ iss: saKey.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const pemContent = saKey.private_key.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '');
  const cryptoKey = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pemContent), c => c.charCodeAt(0)).buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsignedToken));
  const jwt = unsignedToken + '.' + btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) });
  if (!tokenRes.ok) throw new Error('Google token exchange failed: ' + tokenRes.status);
  const tokenData = await tokenRes.json(); if (!tokenData.access_token) throw new Error('Missing access_token');
  googleAccessTokenCache = { token: tokenData.access_token, expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000 };
  return tokenData.access_token;
}

async function claudeWithRetry(env, body, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
    const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
    if (res.status === 529 && attempt < maxRetries - 1) { console.log(`Claude overloaded, retry ${attempt + 1}`); continue; }
    return res;
  }
}
function haikuCost(usage) { const hp = PRICING['claude-haiku-4-5-20251001']; return ((usage.input_tokens || 0) / 1e6) * hp.inputPerMTok + ((usage.output_tokens || 0) / 1e6) * hp.outputPerMTok; }
const WHISPER_TO_LANG = { 'japanese':'ja','english':'en','chinese':'zh-TW','korean':'ko','mandarin':'zh-TW','vietnamese':'vi','thai':'th','indonesian':'id','german':'de','spanish':'es','french':'fr','nynorsk':'ko','nn':'ko' };

export async function handleSTT(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  if (!env.OPENAI_API_KEY || !env.ANTHROPIC_API_KEY) return jsonResponse({ error: 'API keys not configured' }, 500, request);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip, STT_RATE_LIMIT)) return jsonResponse({ error: 'Rate limited' }, 429, request);
  let formData; try { formData = await request.formData(); } catch (e) { return jsonResponse({ error: 'Expected multipart form data' }, 400, request); }
  const audioFile = formData.get('audio'), targetLang = formData.get('targetLang') || 'zh-TW', userCode = formData.get('code') || '';
  const auth = await authenticateRequest(request, env, userCode); if (!auth) return jsonResponse({ error: 'Authentication required' }, 401, request);
  const budget = await checkBudget(auth, env); if (!budget.ok) return jsonResponse({ error: 'Budget exceeded', code: 'budget_exceeded', usedSec: budget.usedSec, budgetSec: budget.budgetSec, remainingSec: budget.remainingSec }, 402, request);
  if (!audioFile) return jsonResponse({ error: 'Missing audio file' }, 400, request);
  if (audioFile.size > 10 * 1024 * 1024) return jsonResponse({ error: 'Audio file too large' }, 400, request);
  const whisperForm = new FormData(); whisperForm.append('file', audioFile, 'audio.webm'); whisperForm.append('model', 'whisper-1'); whisperForm.append('response_format', 'verbose_json');
  let transcript, detectedLang;
  try {
    const wr = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` }, body: whisperForm });
    if (!wr.ok) { const err = await wr.json().catch(() => ({})); throw new Error(err.error?.message || `Whisper ${wr.status}`); }
    const wd = await wr.json(); transcript = (wd.text || '').trim(); detectedLang = wd.language || 'unknown';
    await logCost(env.TICKER_KV, { service: 'openai', model: 'whisper-1', action: 'stt', source: 'translator', code: auth.code, _userId: auth.userId || '', costUSD: +((wd.duration || 5) / 60 * PRICING['whisper-1'].perMinute).toFixed(6), durationSec: wd.duration || 5, note: `${detectedLang} ${(wd.duration||5).toFixed(1)}s` });
  } catch (e) { return jsonResponse({ error: 'Whisper: ' + e.message }, 502, request); }
  if (!transcript) return jsonResponse({ original: '', detectedLang: 'unknown', translated: '' }, 200, request);
  const langCode = WHISPER_TO_LANG[detectedLang] || detectedLang;
  if (langCode === targetLang && targetLang !== 'zh-TW') return jsonResponse({ original: transcript, detectedLang: langCode, translated: transcript }, 200, request);
  const targetName = TNAMES[targetLang] || targetLang; const twHint = targetLang === 'zh-TW' ? ' Use Traditional Chinese with Taiwanese vocabulary.' : '';
  const res = await claudeWithRetry(env, { model: 'claude-haiku-4-5-20251001', max_tokens: 1024, messages: [{ role: 'user', content: `You are a professional real-time interpreter. Translate the following speech into ${targetName}. Fix any obvious speech recognition errors. Output ONLY the translated text.${twHint}\n\n${transcript.slice(0, 2000)}` }] });
  if (!res || !res.ok) { const err = res ? await res.json().catch(() => ({})) : {}; return jsonResponse({ original: transcript, detectedLang: langCode, translated: '⚠ ' + (err.error?.message || 'Claude failed') }, 200, request); }
  const cd = await res.json(); const usage = cd.usage || {};
  await logCost(env.TICKER_KV, { service: 'anthropic', model: 'claude-haiku-4.5', action: 'translate', source: 'translator', code: auth.code, _userId: auth.userId || '', inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0, costUSD: +haikuCost(usage).toFixed(6), note: `${langCode}→${targetLang}` });
  return jsonResponse({ original: transcript, detectedLang: langCode, translated: cd.content?.[0]?.text?.trim() || '' }, 200, request);
}

export async function handleTranslate(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  if (!env.ANTHROPIC_API_KEY) return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500, request);
  let body; try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }
  const { text, sourceLang, targetLang, code: userCode } = body; if (!text || !targetLang) return jsonResponse({ error: 'Missing text or targetLang' }, 400, request);
  const auth = await authenticateRequest(request, env, userCode || ''); if (!auth) return jsonResponse({ error: 'Authentication required' }, 401, request);
  if (!checkRateLimit(request.headers.get('CF-Connecting-IP') || 'unknown', TRANSLATE_RATE_LIMIT)) return jsonResponse({ error: 'Rate limited' }, 429, request);
  const budget = await checkBudget(auth, env); if (!budget.ok) return jsonResponse({ error: 'Budget exceeded', code: 'budget_exceeded', usedSec: budget.usedSec, budgetSec: budget.budgetSec, remainingSec: budget.remainingSec }, 402, request);
  const targetName = TNAMES[targetLang] || targetLang;
  const res = await claudeWithRetry(env, { model: 'claude-haiku-4-5-20251001', max_tokens: 1024, messages: [{ role: 'user', content: `You are a professional real-time interpreter. Translate the following into ${targetName}. Output ONLY the translated text.${targetLang === 'zh-TW' ? ' Use Traditional Chinese with Taiwanese vocabulary.' : ''}\n\n${text.slice(0, 2000)}` }] });
  if (!res || !res.ok) { const err = res ? await res.json().catch(() => ({})) : {}; return jsonResponse({ error: err.error?.message || 'Claude failed' }, 502, request); }
  const data = await res.json(); const usage = data.usage || {};
  await logCost(env.TICKER_KV, { service: 'anthropic', model: 'claude-haiku-4.5', action: 'translate', source: 'translator', code: auth.code, _userId: auth.userId || '', inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0, costUSD: +haikuCost(usage).toFixed(6), note: (sourceLang || 'auto') + '>' + targetLang });
  return jsonResponse({ translated: data.content?.[0]?.text?.trim() || '', model: 'claude-haiku-4-5' }, 200, request);
}

export async function handleTranslateStream(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  if (!env.ANTHROPIC_API_KEY) return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500, request);
  let body; try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }
  const { text, sourceLang, targetLang, code: userCode, glossary } = body; if (!text || !targetLang) return jsonResponse({ error: 'Missing text or targetLang' }, 400, request);
  const auth = await authenticateRequest(request, env, userCode || ''); if (!auth) return jsonResponse({ error: 'Authentication required' }, 401, request);
  if (!checkRateLimit(request.headers.get('CF-Connecting-IP') || 'unknown', TRANSLATE_RATE_LIMIT)) return jsonResponse({ error: 'Rate limited' }, 429, request);
  const budgetS = await checkBudget(auth, env); if (!budgetS.ok) return jsonResponse({ error: 'Budget exceeded', code: 'budget_exceeded', usedSec: budgetS.usedSec, budgetSec: budgetS.budgetSec, remainingSec: budgetS.remainingSec }, 402, request);
  const trimmedText = text.slice(0, 2000);
  if (trimmedText.length <= 2) { const enc = new TextEncoder(); const { readable, writable } = new TransformStream(); const w = writable.getWriter(); (async () => { await w.write(enc.encode('data: ' + JSON.stringify({ t: trimmedText }) + '\n\n')); await w.write(enc.encode('data: ' + JSON.stringify({ done: true, costUSD: 0 }) + '\n\n')); await w.close(); })(); return new Response(readable, { status: 200, headers: { 'Content-Type': 'text/event-stream', ...corsHeaders(request) } }); }
  const targetName = TNAMES[targetLang] || targetLang; const twHint = targetLang === 'zh-TW' ? ' Use Traditional Chinese with Taiwanese vocabulary.' : '';
  const glossaryHint = (glossary && glossary.length > 0) ? '\nUse these terminology translations: ' + glossary.map(g => g.term + ' → ' + g.translation).join(', ') + '.' : '';
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, stream: true, messages: [{ role: 'user', content: 'You are a professional real-time interpreter. Translate the following into ' + targetName + '. Output ONLY the translated text.' + twHint + glossaryHint + '\n\n' + trimmedText }] }) });
  if (!claudeRes.ok) { const err = await claudeRes.json().catch(() => ({})); return jsonResponse({ error: err.error?.message || 'Claude API ' + claudeRes.status }, 502, request); }
  const { readable, writable } = new TransformStream(); const writer = writable.getWriter(); const encoder = new TextEncoder();
  let inputTokens = 0, outputTokens = 0;
  (async () => {
    const reader = claudeRes.body.getReader(); const decoder = new TextDecoder(); let buffer = '';
    try { while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split('\n'); buffer = lines.pop(); for (const line of lines) { if (!line.startsWith('data: ')) continue; const d = line.slice(6); if (d === '[DONE]') continue; try { const evt = JSON.parse(d); if (evt.type === 'content_block_delta' && evt.delta?.text) await writer.write(encoder.encode('data: ' + JSON.stringify({ t: evt.delta.text }) + '\n\n')); if (evt.type === 'message_delta' && evt.usage) outputTokens = evt.usage.output_tokens || 0; if (evt.type === 'message_start' && evt.message?.usage) inputTokens = evt.message.usage.input_tokens || 0; } catch (e) {} } }
      const cost = haikuCost({ input_tokens: inputTokens, output_tokens: outputTokens }); await writer.write(encoder.encode('data: ' + JSON.stringify({ done: true, costUSD: +cost.toFixed(6) }) + '\n\n'));
      await logCost(env.TICKER_KV, { service: 'anthropic', model: 'claude-haiku-4.5', action: 'translate-stream', source: 'translator', code: auth.code, _userId: auth.userId || '', inputTokens, outputTokens, costUSD: +cost.toFixed(6), note: (sourceLang || 'auto') + '>' + targetLang });
    } catch (e) { await writer.write(encoder.encode('data: ' + JSON.stringify({ error: e.message }) + '\n\n')); } finally { await writer.close(); }
  })();
  return new Response(readable, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', ...corsHeaders(request) } });
}

export async function handleSummarize(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  if (!env.ANTHROPIC_API_KEY) return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500, request);
  let body; try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }
  const { text, lang, glossary, code: sumCode } = body;
  const auth = await authenticateRequest(request, env, sumCode || ''); if (!auth) return jsonResponse({ error: 'Authentication required' }, 401, request);
  const budgetSum = await checkBudget(auth, env); if (!budgetSum.ok) return jsonResponse({ error: 'Budget exceeded', code: 'budget_exceeded', usedSec: budgetSum.usedSec, budgetSec: budgetSum.budgetSec, remainingSec: budgetSum.remainingSec }, 402, request);
  if (!text || text.trim().length < 20) return jsonResponse({ error: 'Text too short' }, 400, request);
  const langName = TNAMES[lang] || lang || '繁體中文';
  const glossaryHint = glossary?.length > 0 ? '\nGlossary:\n' + glossary.map(g => '- ' + g.term + ' = ' + g.translation).join('\n') + '\n' : '';
  const localeHint = lang === 'zh-TW' ? '\nIMPORTANT: Use Taiwan Traditional Chinese.\n' : '';
  const res = await claudeWithRetry(env, { model: 'claude-haiku-4-5-20251001', max_tokens: 4096, messages: [{ role: 'user', content: `You are a professional meeting assistant. Produce a structured summary in ${langName}.${localeHint}${glossaryHint}\nOutput ONLY valid JSON: {"title":"...","summary":"...","keyPoints":[...],"actionItems":[...],"decisions":[...]}\n\n--- TRANSCRIPT ---\n${text.slice(0, 100000)}` }] });
  if (!res || !res.ok) { const err = res ? await res.json().catch(() => ({})) : {}; return jsonResponse({ error: 'Summarize failed: ' + (err.error?.message || 'Unknown') }, 502, request); }
  const data = await res.json(); const raw = data.content?.[0]?.text?.trim() || ''; const usage = data.usage || {}; const cost = haikuCost(usage);
  await logCost(env.TICKER_KV, { service: 'anthropic', model: 'claude-haiku-4.5', action: 'summarize', source: 'translator', code: auth.code, _userId: auth.userId || '', inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0, costUSD: +cost.toFixed(6), note: langName });
  let parsed; try { parsed = JSON.parse((raw.match(/\{[\s\S]*\}/) || [raw])[0]); } catch (e) { parsed = { title: 'Meeting Summary', summary: raw, keyPoints: [], actionItems: [], decisions: [] }; }
  return jsonResponse({ ...parsed, costUSD: +cost.toFixed(6) }, 200, request);
}

export async function handlePolishTranscript(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  if (!env.ANTHROPIC_API_KEY) return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500, request);
  let body; try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }
  const { entries, glossary, code: polishCode } = body;
  const auth = await authenticateRequest(request, env, polishCode || ''); if (!auth) return jsonResponse({ error: 'Authentication required' }, 401, request);
  const budgetP = await checkBudget(auth, env); if (!budgetP.ok) return jsonResponse({ error: 'Budget exceeded', code: 'budget_exceeded', usedSec: budgetP.usedSec, budgetSec: budgetP.budgetSec, remainingSec: budgetP.remainingSec }, 402, request);
  if (!entries || !Array.isArray(entries) || entries.length === 0) return jsonResponse({ error: 'No entries' }, 400, request);
  const glossarySection = glossary?.length > 0 ? '\n## 術語庫\n' + glossary.map(g => '- ' + g.term + (g.translation ? ' (' + g.translation + ')' : '')).join('\n') + '\n' : '';
  let transcriptLines = entries.map((e, i) => '[' + i + '] ' + (e.original || '')).join('\n'); if (transcriptLines.length > 80000) transcriptLines = transcriptLines.slice(0, 80000);
  const res = await claudeWithRetry(env, { model: 'claude-haiku-4-5-20251001', max_tokens: 8192, messages: [{ role: 'user', content: 'あなたは日本語商務会議の逐字稿校正アシスタントです。\n\n## 校正ルール\n1. 音声認識の同音異字を術語庫の語彙に優先的に修正\n2. ビジネス用語を優先\n3. 話し言葉のニュアンスを保持\n4. 明らかな誤認識のみ修正' + glossarySection + '\n## 出力形式\nJSON配列: [{"i": 行番号, "t": "修正後テキスト"}]\n修正があった行だけ。JSON配列のみ。\n\n## 逐字稿\n' + transcriptLines }] });
  if (!res || !res.ok) { const err = res ? await res.json().catch(() => ({})) : {}; return jsonResponse({ error: 'Polish failed: ' + (err.error?.message || 'Unknown') }, 500, request); }
  const data = await res.json(); const raw = (data.content?.[0]?.text || '').trim(); const usage = data.usage || {}; const cost = haikuCost(usage);
  await logCost(env.TICKER_KV, { service: 'anthropic', model: 'claude-haiku-4.5', action: 'polish-transcript', source: 'translator', code: auth.code, _userId: auth.userId || '', inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0, costUSD: +cost.toFixed(6), note: entries.length + ' entries' });
  let corrections; try { corrections = JSON.parse((raw.match(/\[\s*\{[\s\S]*\}\s*\]/) || [raw])[0]); } catch (e) { corrections = []; }
  const polished = entries.map(e => ({ original: e.original, ts: e.ts }));
  if (Array.isArray(corrections)) corrections.forEach(c => { if (typeof c.i === 'number' && c.t && polished[c.i]) polished[c.i].corrected = c.t; });
  return jsonResponse({ polished, corrections: corrections.length, cost: +cost.toFixed(6) }, 200, request);
}

export async function handleGroqSTT(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  if (!env.GROQ_API_KEY) return jsonResponse({ error: 'GROQ_API_KEY not configured' }, 500, request);
  if (!checkRateLimit(request.headers.get('CF-Connecting-IP') || 'unknown', GROQ_STT_RATE_LIMIT)) return jsonResponse({ error: 'Rate limited' }, 429, request);
  let formData; try { formData = await request.formData(); } catch (e) { return jsonResponse({ error: 'Expected multipart form data' }, 400, request); }
  const audioFile = formData.get('audio'), userCode = formData.get('code') || '', lang = formData.get('lang') || 'en', mode = formData.get('mode') || 'normal';
  const auth = await authenticateRequest(request, env, userCode); if (!auth) return jsonResponse({ error: 'Authentication required' }, 401, request);
  const budgetG = await checkBudget(auth, env); if (!budgetG.ok) return jsonResponse({ error: 'Budget exceeded', code: 'budget_exceeded', usedSec: budgetG.usedSec, budgetSec: budgetG.budgetSec, remainingSec: budgetG.remainingSec }, 402, request);
  if (!audioFile) return jsonResponse({ error: 'Missing audio file' }, 400, request);
  if (audioFile.size > 25 * 1024 * 1024) return jsonResponse({ error: 'Audio file too large' }, 400, request);
  if (audioFile.size < 1024) return jsonResponse({ original: '', detectedLang: lang, duration: 0 }, 200, request);
  const isBusiness = (mode === 'business'); const groqModel = isBusiness ? 'whisper-large-v3' : 'whisper-large-v3-turbo';
  const groqForm = new FormData(); groqForm.append('file', audioFile, audioFile.name || 'audio.webm'); groqForm.append('model', groqModel); groqForm.append('response_format', 'verbose_json'); groqForm.append('language', lang);
  if (isBusiness) { groqForm.append('temperature', '0'); if (lang === 'ja') groqForm.append('prompt', 'ビジネス会議の議事録です。報告、クレーム対応、取引先、発注書、見積書、納期、請求書、部長、課長、担当者、御社、弊社、ご確認、ご検討、ご立腹、お見積り、打ち合わせ、議事録、決裁、稟議、前年比、売上高、営業利益、経常利益、予算、実績、計画、戦略、提案、交渉、契約、締結、解約、更新、イラク、イスラエル、当事者、作戦計画'); }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 500));
      const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { 'Authorization': 'Bearer ' + env.GROQ_API_KEY }, body: groqForm });
      if (groqRes.status === 429 && attempt < 1) { console.log('Groq rate limited, retry'); continue; }
      if (!groqRes.ok) { const errText = await groqRes.text().catch(() => ''); let errMsg = 'Groq API ' + groqRes.status; try { errMsg = JSON.parse(errText).error?.message || errMsg; } catch(e) {} throw new Error(errMsg); }
      const data = await groqRes.json(); const duration = data.duration || 0;
      let transcript = '';
      if (data.segments?.length > 0) transcript = data.segments.filter(seg => (seg.no_speech_prob || 0) <= 0.7).map(s => s.text || '').join('').trim();
      else transcript = (data.text || '').trim();
      const HALLUCINATION_PATTERNS = [/^(ご視聴ありがとうございました|チャンネル登録お願いします|字幕|最後まで|お疲れ様でした)[。．！]*$/,/^(Thank you( for watching)?|Please subscribe|Subtitles by)[.!]*$/i,/^(감사합니다|구독|좋아요)[.!]*$/,/^\.+$/,/^[\s　]+$/];
      if (HALLUCINATION_PATTERNS.some(p => p.test(transcript))) transcript = '';
      if (transcript && isBusiness) { if (transcript.match(/([一-鿿぀-ゟ゠-ヿ]{2,})[、,].*(\1[、,].*){2,}/)) transcript = ''; const promptKW = ['報告','クレーム','取引先','発注書','見積書','課長','部長','担当者','納期','稟議','前年比']; if (promptKW.filter(k => transcript.includes(k)).length >= 4 && transcript.length < 100) transcript = ''; }
      const perHour = isBusiness ? 0.111 : (PRICING['whisper-large-v3-turbo']?.perHour || 0.04); const costUSD = (duration / 3600) * perHour;
      await logCost(env.TICKER_KV, { service: 'groq', model: groqModel, action: 'stt', source: 'translator', code: auth.code, _userId: auth.userId || '', costUSD: +costUSD.toFixed(8), durationSec: duration, note: lang + ' ' + duration.toFixed(1) + 's', sourceLang: lang });
      return jsonResponse({ original: transcript, detectedLang: lang, duration, costUSD: +costUSD.toFixed(8) }, 200, request);
    } catch (e) { if (attempt === 1) return jsonResponse({ error: 'Groq STT: ' + e.message }, 502, request); }
  }
}

export async function handleGoogleSTT(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  if (!checkRateLimit(request.headers.get('CF-Connecting-IP') || 'unknown', GOOGLE_STT_RATE_LIMIT)) return jsonResponse({ error: 'Rate limited' }, 429, request);
  let formData; try { formData = await request.formData(); } catch (e) { return jsonResponse({ error: 'Expected multipart form data' }, 400, request); }
  const audioFile = formData.get('audio'), userCode = formData.get('code') || '', lang = formData.get('lang') || 'ja', phrases = formData.get('phrases') || '';
  const auth = await authenticateRequest(request, env, userCode); if (!auth) return jsonResponse({ error: 'Authentication required' }, 401, request);
  if (!auth.isAdmin) return jsonResponse({ error: 'Business mode requires admin access', code: 'admin_only' }, 403, request);
  if (!audioFile) return jsonResponse({ error: 'Missing audio file' }, 400, request);
  if (audioFile.size > 25 * 1024 * 1024) return jsonResponse({ error: 'Audio file too large' }, 400, request);
  if (audioFile.size < 1024) return jsonResponse({ original: '', detectedLang: lang, duration: 0 }, 200, request);
  let accessToken; try { accessToken = await getGoogleAccessToken(env); } catch (e) { return jsonResponse({ error: 'Google auth: ' + e.message }, 500, request); }
  const audioBytes = await audioFile.arrayBuffer(); const audioUint8 = new Uint8Array(audioBytes); let audioBinary = ''; const CHUNK = 0x8000;
  for (let i = 0; i < audioUint8.length; i += CHUNK) audioBinary += String.fromCharCode.apply(null, audioUint8.subarray(i, i + CHUNK));
  const defaultPhrases = ['報告','クレーム対応','取引先','発注書','見積書','納期','請求書','部長','課長','担当者','御社','弊社','ご確認','ご検討','打ち合わせ','議事録','決裁','稟議','前年比','売上高','営業利益','経常利益','予算','実績','戦略','提案','交渉','契約','締結','解約','更新','お世話になっております','ご連絡いただき','お手数ですが','ご査収ください','ご承知おきください','決算','四半期','株主総会','取締役会','監査','内部統制','コンプライアンス','ガバナンス','サステナビリティ','DX推進','KPI','ROI','PDCA','OKR','アジェンダ','マイルストーン','ご立腹','先方','異物','納品','検品','不良品','差し替え','早急に'];
  let allPhrases = [...defaultPhrases]; if (phrases) { try { const c = JSON.parse(phrases); if (Array.isArray(c)) allPhrases.push(...c); } catch (e) { allPhrases.push(...phrases.split(',').map(s => s.trim()).filter(Boolean)); } }
  allPhrases = [...new Set(allPhrases)].slice(0, 1000);
  const langMap = { 'ja':'ja-JP','en':'en-US','zh-TW':'cmn-Hant-TW','zh-CN':'cmn-Hans-CN','ko':'ko-KR' }; const bcp47 = langMap[lang] || lang;
  const recognizeUrl = `https://${GOOGLE_STT_LOCATION}-speech.googleapis.com/v2/projects/${GOOGLE_STT_PROJECT}/locations/${GOOGLE_STT_LOCATION}/recognizers/_:recognize`;
  const startTime = Date.now();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000));
      const sttRes = await fetch(recognizeUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken }, body: JSON.stringify({ config: { auto_decoding_config: {}, language_codes: [bcp47], model: 'chirp_3', features: { enable_automatic_punctuation: true }, adaptation: { phrase_sets: [{ inline_phrase_set: { phrases: allPhrases.map(p => ({ value: p, boost: 10 })) } }] } }, content: btoa(audioBinary) }) });
      if (sttRes.status === 401 && attempt < 1) { googleAccessTokenCache = { token: null, expiresAt: 0 }; accessToken = await getGoogleAccessToken(env); continue; }
      if (!sttRes.ok) throw new Error('Google STT API ' + sttRes.status + ': ' + (await sttRes.text().catch(() => '')).slice(0, 200));
      const data = await sttRes.json(); const elapsed = (Date.now() - startTime) / 1000;
      let transcript = '', totalDuration = 0;
      if (data.results?.length > 0) { transcript = data.results.map(r => r.alternatives?.[0]?.transcript || '').join('').trim(); const eo = data.results[data.results.length - 1]?.resultEndOffset; if (eo) totalDuration = parseFloat(eo.replace('s', '')) || 0; }
      if (!totalDuration && audioFile.size > 0) totalDuration = audioFile.size / 4000;
      const costUSD = (Math.ceil(totalDuration / 15) * 15 / 60) * 0.016;
      await logCost(env.TICKER_KV, { service: 'google', model: 'chirp_3', action: 'stt', source: 'translator', code: auth.code, _userId: auth.userId || '', costUSD: +costUSD.toFixed(6), durationSec: +totalDuration.toFixed(1), note: `${bcp47} ${totalDuration.toFixed(1)}s elapsed:${elapsed.toFixed(1)}s`, sourceLang: lang });
      return jsonResponse({ original: transcript, detectedLang: lang, duration: +totalDuration.toFixed(1) }, 200, request);
    } catch (e) { if (attempt === 1) return jsonResponse({ error: 'Google STT: ' + e.message }, 502, request); }
  }
}
