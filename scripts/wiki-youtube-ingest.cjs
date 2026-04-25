#!/usr/bin/env node

/**
 * Wiki YouTube Ingest CLI (Issue #126)
 *
 * Modes:
 *   1) Pull pending videos from KV → write to src/content/wiki/sources/
 *      $ node scripts/wiki-youtube-ingest.cjs
 *
 *   2) Trigger single-video ingest via API, then pull
 *      $ node scripts/wiki-youtube-ingest.cjs https://www.youtube.com/watch?v=XXXX
 *      $ node scripts/wiki-youtube-ingest.cjs XXXX --pillar=circular --lang=zh-TW
 *
 *   3) Backfill: re-fetch transcripts for existing sources with empty transcript_lang
 *      $ node scripts/wiki-youtube-ingest.cjs --backfill
 *
 * Transcript fetching (local, two-tier):
 *   Tier 1: yt-dlp subtitle extraction (for videos with auto/manual captions)
 *   Tier 2: Groq Whisper STT (for videos without captions, requires GROQ_API_KEY)
 *
 * Requires: wrangler CLI (for KV access), yt-dlp (for transcript fetching)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ── .env loader (zero-dep) ─────────────────────────────────────────────
// 自動讀取專案根目錄的 .env，讓 GROQ_API_KEY 等 secret 不用每次手動 source。
// 只設定「尚未存在」的變數，避免覆蓋 shell 已匯出的值。
(function loadDotEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of raw.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      // 去掉成對的外層引號
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (err) {
    console.warn(`[dotenv] failed to load ${envPath}: ${err.message}`);
  }
})();

const SOURCES_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'wiki', 'sources');
const NAMESPACE_ID = 'c066a2fd7942494c8ead37cc518b191b';
const API_BASE = 'https://api.paulkuo.tw';

// ── KV helpers ─────────────────────────────────────────────────────────

function kvGet(key) {
  try {
    const result = execSync(
      `wrangler kv key get '${key}' --namespace-id ${NAMESPACE_ID} --remote`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', encoding: 'utf-8' }
    );
    return result.trim();
  } catch {
    return null;
  }
}

function kvList(prefix) {
  try {
    const result = execSync(
      `wrangler kv key list --namespace-id ${NAMESPACE_ID} --prefix '${prefix}' --remote`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', encoding: 'utf-8' }
    );
    return JSON.parse(result);
  } catch {
    return [];
  }
}

function kvDelete(key) {
  try {
    execSync(
      `wrangler kv key delete '${key}' --namespace-id ${NAMESPACE_ID} --remote`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', encoding: 'utf-8' }
    );
  } catch {
    // ignore
  }
}

function kvPut(key, value) {
  const tmpFile = path.join(require('os').tmpdir(), `yt-kv-${Date.now()}.json`);
  fs.writeFileSync(tmpFile, typeof value === 'string' ? value : JSON.stringify(value), 'utf-8');
  try {
    execSync(
      `wrangler kv key put '${key}' --namespace-id ${NAMESPACE_ID} --path '${tmpFile}' --remote`,
      { cwd: PROJECT_ROOT, stdio: 'pipe', encoding: 'utf-8' }
    );
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// ── Transcript helpers ────────────────────────────────────────────────

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
    segments.push({ start: parseFloat(match[1]), duration: parseFloat(match[2]), text });
  }
  return segments;
}

function parseJson3Transcript(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.events) return [];
    const segments = [];
    for (const ev of data.events) {
      if (!ev.segs) continue;
      const text = ev.segs.map(s => s.utf8 || '').join('').trim();
      if (!text || text === '\n') continue;
      segments.push({ start: (ev.tStartMs || 0) / 1000, duration: (ev.dDurationMs || 0) / 1000, text });
    }
    return segments;
  } catch { return []; }
}

function fmtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

function mergeToTranscript(segments) {
  if (segments.length === 0) return '';
  const lines = [];
  let buf = '';
  let bufStart = segments[0].start;
  for (const seg of segments) {
    if (buf === '') bufStart = seg.start;
    buf += (buf ? ' ' : '') + seg.text;
    if (buf.length >= 200 || /[。！？.!?]$/.test(buf)) {
      lines.push(`[${fmtTime(bufStart)}] ${buf}`);
      buf = '';
    }
  }
  if (buf) lines.push(`[${fmtTime(bufStart)}] ${buf}`);
  return lines.join('\n');
}

/**
 * Fetch transcript locally using yt-dlp (Tier 1: captions, Tier 2: Whisper STT)
 * @returns {{ transcript: string, lang: string, method: string }}
 */
function fetchTranscriptLocal(videoId, preferLang) {
  console.log(`  ⏳ Fetching transcript for ${videoId}...`);

  // Tier 1: Try yt-dlp for existing captions
  try {
    const jsonRaw = execSync(
      `yt-dlp --dump-json --skip-download "https://www.youtube.com/watch?v=${videoId}" 2>/dev/null`,
      { encoding: 'utf-8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
    );
    const data = JSON.parse(jsonRaw);

    // Check subtitles (manual first, then auto-generated)
    const subs = data.subtitles || {};
    const autoCaps = data.automatic_captions || {};

    // Language priority: prefer Chinese variants, then English, then any
    const langPriority = preferLang
      ? [preferLang, 'zh', 'zh-Hans', 'zh-Hant', 'zh-Hans-zh', 'zh-Hant-zh', 'en']
      : ['zh', 'zh-Hans', 'zh-Hant', 'zh-Hans-zh', 'zh-Hant-zh', 'en'];

    let selectedUrl = null;
    let selectedLang = '';
    let isAuto = false;

    // Try manual subtitles first
    for (const lang of langPriority) {
      if (subs[lang]) {
        const json3 = subs[lang].find(f => f.ext === 'json3') || subs[lang].find(f => f.ext === 'srv1');
        if (json3) { selectedUrl = json3.url; selectedLang = lang; break; }
      }
    }

    // Then auto-generated
    if (!selectedUrl) {
      for (const lang of langPriority) {
        if (autoCaps[lang]) {
          const json3 = autoCaps[lang].find(f => f.ext === 'json3') || autoCaps[lang].find(f => f.ext === 'srv1');
          if (json3) { selectedUrl = json3.url; selectedLang = lang; isAuto = true; break; }
        }
      }
    }

    // Fallback: any available subtitle
    if (!selectedUrl) {
      const allSubs = { ...subs, ...autoCaps };
      for (const [lang, formats] of Object.entries(allSubs)) {
        const json3 = formats.find(f => f.ext === 'json3') || formats.find(f => f.ext === 'srv1');
        if (json3) { selectedUrl = json3.url; selectedLang = lang; isAuto = !subs[lang]; break; }
      }
    }

    if (selectedUrl) {
      console.log(`  📝 Found ${isAuto ? 'auto' : 'manual'} captions: ${selectedLang}`);
      const body = execSync(
        `curl -s "${selectedUrl}"`,
        { encoding: 'utf-8', timeout: 30000 }
      );

      let segments = parseJson3Transcript(body);
      if (segments.length === 0) segments = parseTranscriptXml(body);

      if (segments.length > 0) {
        const transcript = mergeToTranscript(segments);
        console.log(`  ✓ Transcript: ${segments.length} segments, ${transcript.split('\n').length} lines`);
        return { transcript, lang: selectedLang, method: isAuto ? 'yt-dlp-auto' : 'yt-dlp-manual' };
      }
    }

    console.log(`  ⚠ No captions available via yt-dlp`);
  } catch (e) {
    console.warn(`  ⚠ yt-dlp failed: ${e.message}`);
  }

  // Tier 2: Whisper STT via Groq
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.log(`  ⚠ No GROQ_API_KEY set, skipping Whisper STT fallback`);
    return { transcript: '', lang: '', method: 'none' };
  }

  try {
    console.log(`  🎙 Downloading audio for Whisper STT...`);
    const audioPath = path.join(require('os').tmpdir(), `yt-whisper-${videoId}.m4a`);

    execSync(
      `yt-dlp -f "ba[ext=m4a]/ba" --no-playlist -o "${audioPath}" "https://www.youtube.com/watch?v=${videoId}" 2>/dev/null`,
      { timeout: 120000 }
    );

    if (!fs.existsSync(audioPath)) {
      console.warn(`  ✗ Audio download failed`);
      return { transcript: '', lang: '', method: 'none' };
    }

    let fileSizeMB = fs.statSync(audioPath).size / (1024 * 1024);
    console.log(`  🎙 Audio: ${fileSizeMB.toFixed(1)} MB`);

    // 超過 Groq 25 MB 上限時，用 ffmpeg 壓成 mono 16 kHz 32 kbps opus。
    // Whisper 模型本身就是 16 kHz mono，低 bitrate 幾乎無辨識率損失。
    // 30 min 影片壓完約 7 MB。
    let audioPathFinal = audioPath;
    if (fileSizeMB > 24) {
      try {
        console.log(`  🎙 Audio too large (${fileSizeMB.toFixed(1)} MB), compressing with ffmpeg...`);
        const compressedPath = path.join(require('os').tmpdir(), `yt-whisper-${videoId}.ogg`);
        execSync(
          `ffmpeg -y -i "${audioPath}" -ac 1 -ar 16000 -c:a libopus -b:a 32k "${compressedPath}" 2>/dev/null`,
          { timeout: 180000 }
        );
        if (!fs.existsSync(compressedPath)) throw new Error('compressed file missing');
        const newSizeMB = fs.statSync(compressedPath).size / (1024 * 1024);
        console.log(`  🎙 Compressed: ${newSizeMB.toFixed(1)} MB (opus mono 16 kHz 32k)`);
        // 原檔拿掉，換指向壓縮版
        fs.unlinkSync(audioPath);
        audioPathFinal = compressedPath;
        fileSizeMB = newSizeMB;
        if (fileSizeMB > 25) {
          console.warn(`  ⚠ Even after compression (${fileSizeMB.toFixed(1)} MB > 25 MB), skipping`);
          fs.unlinkSync(audioPathFinal);
          return { transcript: '', lang: '', method: 'none' };
        }
      } catch (ce) {
        console.warn(`  ✗ ffmpeg compression failed: ${ce.message}`);
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        return { transcript: '', lang: '', method: 'none' };
      }
    }

    // Call Groq Whisper API
    const audioData = fs.readFileSync(audioPathFinal);
    const isOgg = audioPathFinal.endsWith('.ogg');
    const uploadFilename = isOgg ? 'audio.ogg' : 'audio.m4a';
    const uploadContentType = isOgg ? 'audio/ogg' : 'audio/mp4';
    const boundary = '----FormBoundary' + Date.now();
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${uploadFilename}"\r\nContent-Type: ${uploadContentType}\r\n\r\n`),
      audioData,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3-turbo\r\n--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\nverbose_json\r\n--${boundary}--\r\n`),
    ]);

    const tmpPayload = path.join(require('os').tmpdir(), `yt-whisper-payload-${videoId}.bin`);
    fs.writeFileSync(tmpPayload, payload);

    const whisperResult = execSync(
      `curl -s -X POST "https://api.groq.com/openai/v1/audio/transcriptions" ` +
      `-H "Authorization: Bearer ${groqKey}" ` +
      `-H "Content-Type: multipart/form-data; boundary=${boundary}" ` +
      `--data-binary "@${tmpPayload}"`,
      { encoding: 'utf-8', timeout: 180000, maxBuffer: 20 * 1024 * 1024 }
    );

    fs.unlinkSync(audioPathFinal);
    fs.unlinkSync(tmpPayload);

    const whisperData = JSON.parse(whisperResult);
    if (whisperData.error) {
      console.warn(`  ✗ Whisper error: ${whisperData.error.message || whisperData.error}`);
      return { transcript: '', lang: '', method: 'none' };
    }

    // Build transcript from segments or text
    let transcript = '';
    const detectedLang = whisperData.language || 'zh';

    if (whisperData.segments && whisperData.segments.length > 0) {
      const segments = whisperData.segments.map(s => ({
        start: s.start,
        duration: s.end - s.start,
        text: s.text.trim(),
      })).filter(s => s.text);
      transcript = mergeToTranscript(segments);
      console.log(`  ✓ Whisper: ${segments.length} segments, lang=${detectedLang}`);
    } else if (whisperData.text) {
      transcript = whisperData.text;
      console.log(`  ✓ Whisper: plain text, lang=${detectedLang}`);
    }

    return { transcript, lang: detectedLang, method: 'whisper-groq' };
  } catch (e) {
    console.warn(`  ✗ Whisper STT failed: ${e.message}`);
    // Clean up temp files (可能是 .m4a 原檔或 .ogg 壓縮檔)
    try {
      for (const ext of ['.m4a', '.ogg']) {
        const p = path.join(require('os').tmpdir(), `yt-whisper-${videoId}${ext}`);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch {}
    return { transcript: '', lang: '', method: 'none' };
  }
}

// ── Pull pending videos from KV ────────────────────────────────────────

async function pullPending() {
  console.log('Scanning KV for youtube:pending:* keys...\n');
  const keys = kvList('youtube:pending:');

  if (keys.length === 0) {
    console.log('No pending YouTube videos in KV.');
    return { written: 0, failed: 0, remaining: 0 };
  }

  let written = 0;
  let failed = 0;

  for (const entry of keys) {
    const key = entry.name;
    const raw = kvGet(key);
    if (!raw) { failed++; continue; }

    let data;
    try { data = JSON.parse(raw); } catch {
      console.error(`  ✗ Bad JSON for ${key}`);
      failed++;
      continue;
    }

    const filename = `${data.slug}.md`;
    const filepath = path.join(SOURCES_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`  ⊘ Already exists: ${filename}`);
      kvDelete(key);
      continue;
    }

    // If transcript is missing, try to fetch locally
    if (!data.transcriptLang) {
      const result = fetchTranscriptLocal(data.videoId);
      if (result.transcript) {
        data.markdown = injectTranscript(data.markdown, result);
        data.transcriptLang = result.lang;
      }
    }

    try {
      fs.writeFileSync(filepath, data.markdown, 'utf-8');
      console.log(`  ✓ Written: ${filename} (${data.title})`);
      kvDelete(key);
      written++;
    } catch (e) {
      console.error(`  ✗ Write failed for ${filename}: ${e.message}`);
      failed++;
    }
  }

  const remaining = failed; // failed keys are not deleted from KV
  console.log(`\nWrote ${written} source file(s) to wiki/sources/`);
  return { written, failed, remaining };
}

/** Inject transcript data into markdown content */
function injectTranscript(markdown, transcriptResult) {
  const { transcript, lang, method } = transcriptResult;
  if (!transcript) return markdown;

  // Update frontmatter transcript_lang
  markdown = markdown.replace(/^transcript_lang: ".*"$/m, `transcript_lang: "${lang}"`);

  // Replace empty transcript section
  markdown = markdown.replace(
    /## 逐字稿\n\n（無字幕可用）/,
    `## 逐字稿\n\n${transcript}`
  );

  // Update ingest notes
  markdown = markdown.replace(/- 字幕語言：無/, `- 字幕語言：${lang}（${method}）`);
  markdown = markdown.replace(/- 可用字幕：無/, `- 可用字幕：${lang}`);

  return markdown;
}

// ── Trigger single video ingest via API ────────────────────────────────

async function triggerIngest(videoUrl, options = {}) {
  const adminToken = process.env.FORMOSA_ADMIN_TOKEN;
  if (!adminToken) {
    console.error('Error: FORMOSA_ADMIN_TOKEN env var required');
    console.error('Set it: export FORMOSA_ADMIN_TOKEN=your_token');
    process.exit(1);
  }

  console.log(`Triggering ingest for: ${videoUrl}\n`);

  const body = { videoUrl };
  if (options.lang) body.lang = options.lang;
  if (options.pillar) body.pillar = options.pillar;
  if (options.force) body.force = true;

  const resp = await fetch(`${API_BASE}/api/wiki/youtube-ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken,
    },
    body: JSON.stringify(body),
  });

  const result = await resp.json();

  if (!resp.ok) {
    console.error(`API error (${resp.status}):`, result.error);
    if (result.slug) console.log(`  Already ingested as: ${result.slug}`);
    process.exit(1);
  }

  console.log(`  Video: ${result.title}`);
  console.log(`  ID: ${result.videoId}`);
  console.log(`  Slug: ${result.slug}`);
  console.log(`  Duration: ${result.duration}s`);
  console.log(`  Transcript: ${result.transcriptLang} (${result.transcriptLines} lines)`);
  console.log('');

  // Now pull the pending file
  const stats = await pullPending();
  return stats.written;
}

// ── Seed channels JSON to KV ───────────────────────────────────────────

function seedChannels() {
  const channelsPath = path.join(PROJECT_ROOT, 'data', 'youtube-channels.json');
  if (!fs.existsSync(channelsPath)) {
    console.log('No data/youtube-channels.json found, skipping channel seed.');
    return;
  }
  const data = JSON.parse(fs.readFileSync(channelsPath, 'utf-8'));
  if (!data.channels || data.channels.length === 0) {
    console.log('youtube-channels.json has no channels configured.');
    return;
  }
  kvPut('youtube:channels', data);
  console.log(`Seeded ${data.channels.length} channel(s) to KV youtube:channels`);
}

// ── Backfill: re-fetch transcripts for existing sources ───────────────

async function backfill(options = {}) {
  console.log('Scanning existing YouTube sources for missing transcripts...\n');

  const files = fs.readdirSync(SOURCES_DIR).filter(f => f.startsWith('youtube-') && f.endsWith('.md'));
  const needsFix = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(SOURCES_DIR, file), 'utf-8');
    const langMatch = content.match(/^transcript_lang: "(.*)"/m);
    if (langMatch && langMatch[1] === '') {
      const idMatch = content.match(/^youtube_id: "(.*)"/m);
      if (idMatch) needsFix.push({ file, videoId: idMatch[1] });
    }
  }

  if (needsFix.length === 0) {
    console.log('All YouTube sources have transcripts. Nothing to backfill.');
    return 0;
  }

  console.log(`Found ${needsFix.length} source(s) with missing transcripts:\n`);

  let updated = 0;
  let failed = 0;

  for (const { file, videoId } of needsFix) {
    console.log(`─── ${file} (${videoId}) ───`);
    const filepath = path.join(SOURCES_DIR, file);
    let content = fs.readFileSync(filepath, 'utf-8');

    const result = fetchTranscriptLocal(videoId, options.lang);

    if (result.transcript) {
      content = injectTranscript(content, result);

      // Update the "updated" date in frontmatter
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
      content = content.replace(/^updated: .+$/m, `updated: ${today}`);

      fs.writeFileSync(filepath, content, 'utf-8');
      console.log(`  ✓ Updated: ${file}\n`);
      updated++;
    } else {
      console.error(`  ✗ No transcript available (method: ${result.method})\n`);
      failed++;
    }
  }

  console.log(`\nBackfill complete: ${updated} updated, ${failed} failed, ${needsFix.length} total`);
  return updated;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Parse options
  const options = {};
  const positional = [];
  for (const arg of args) {
    if (arg.startsWith('--lang=')) options.lang = arg.split('=')[1];
    else if (arg.startsWith('--pillar=')) options.pillar = arg.split('=')[1];
    else if (arg === '--force') options.force = true;
    else if (arg === '--backfill') options.backfill = true;
    else if (arg === '--write-log') options.writeLog = true;
    else if (arg === '--seed-channels') { seedChannels(); return; }
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage:
  node scripts/wiki-youtube-ingest.cjs                    Pull pending from KV
  node scripts/wiki-youtube-ingest.cjs <url|videoId>      Ingest single video
  node scripts/wiki-youtube-ingest.cjs --backfill         Re-fetch missing transcripts
  node scripts/wiki-youtube-ingest.cjs --seed-channels    Upload channels.json to KV

Options:
  --lang=zh-TW       Preferred transcript language
  --pillar=ai        Wiki pillar (ai|circular|faith|startup|life)
  --force            Re-ingest even if already done
  --backfill         Scan existing sources, re-fetch empty transcripts
  --seed-channels    Seed data/youtube-channels.json to KV
  --write-log        Write daily log to worklogs/wiki-youtube-daily-YYYY-MM-DD.md

Environment:
  GROQ_API_KEY       Required for Whisper STT fallback (videos without captions)
  FORMOSA_ADMIN_TOKEN  Required for single-video ingest via API`);
      return;
    }
    else positional.push(arg);
  }

  let stats = { written: 0, failed: 0, remaining: 0 };

  if (options.backfill) {
    await backfill(options);
  } else if (positional.length > 0) {
    await triggerIngest(positional[0], options);
  } else {
    stats = await pullPending();
  }

  if (options.writeLog) {
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
    const logPath = path.join(PROJECT_ROOT, 'worklogs', `wiki-youtube-daily-${today}.md`);
    const summary = `# Wiki YouTube Ingest — ${today}\n\n- 新增: ${stats.written} 支\n- 失敗: ${stats.failed} 支\n- KV pending 剩餘: ${stats.remaining} 筆\n- 觸發來源: 本機 cron / launchd\n`;
    fs.writeFileSync(logPath, summary, 'utf-8');
    console.log(`\nLog written: ${logPath}`);
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
