/**
 * YouTube → Wiki Ingest Pipeline (Issue #126)
 *
 * Two modes:
 *   A) Channel subscription scan (cron) — uses YouTube Data API v3
 *   B) Single video ingest (manual)    — POST /api/wiki/youtube-ingest
 *
 * Secrets required: YOUTUBE_API_KEY (Data API v3)
 * KV dedup key:     youtube:ingested:{videoId}
 */
import { jsonResponse, twDateStr } from './utils.js';
import { authenticateRequest } from './auth.js';

// ── helpers (same proven approach as tqef-api.js) ──────────────────────

function extractVideoId(url) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url; // bare ID
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
    segments.push({ start: parseFloat(match[1]), duration: parseFloat(match[2]), text });
  }
  return segments;
}

function parseTranscriptJson(jsonStr) {
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

/** Format seconds → HH:MM:SS or MM:SS */
function fmtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/** Merge short segments into paragraph-like chunks (≤300 chars) */
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

/** Generate a URL-safe slug from a title */
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

/** ISO 8601 duration (PT1H2M3S) → total seconds */
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

/** fetch with retry on 429 (exponential backoff: 1s, 2s, 4s) */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
    const resp = await fetch(url, options);
    if (resp.status !== 429) return resp;
    lastError = new Error(`YouTube page fetch: 429 (attempt ${attempt + 1}/${maxRetries + 1})`);
  }
  throw lastError;
}

// ── core: fetch metadata via Data API v3 ───────────────────────────────

async function fetchVideoMeta(videoId, apiKey) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`YouTube Data API error: ${resp.status}`);
  const data = await resp.json();
  if (!data.items || data.items.length === 0) throw new Error('Video not found');
  const item = data.items[0];
  return {
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    publishedAt: item.snippet.publishedAt,
    description: item.snippet.description,
    duration: parseDuration(item.contentDetails.duration || 'PT0S'),
    tags: item.snippet.tags || [],
    defaultLanguage: item.snippet.defaultLanguage || item.snippet.defaultAudioLanguage || '',
  };
}

// ── core: fetch transcript via Innertube (no API key needed) ───────────
//
// YouTube has progressively locked down Innertube clients. We try multiple
// client types in order. If all fail, the caller falls back to metadata-only
// and the CLI backfill uses yt-dlp + Whisper STT instead.

const INNERTUBE_CLIENTS = [
  { clientName: 'WEB', clientVersion: '2.20240313' },
  { clientName: 'ANDROID', clientVersion: '20.10.38' },
  { clientName: 'IOS', clientVersion: '20.10.4' },
  { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0' },
];

async function fetchTranscript(videoId, preferLang) {
  // 1. Fetch watch page for INNERTUBE_API_KEY (retry on 429)
  const watchResp = await fetchWithRetry(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  if (!watchResp.ok) throw new Error(`YouTube page fetch: ${watchResp.status}`);
  const html = await watchResp.text();

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":\s*"([a-zA-Z0-9_-]+)"/);
  const apiKey = apiKeyMatch ? apiKeyMatch[1] : 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

  // 2. Try each Innertube client until one returns captionTracks
  let captionTracks = [];
  let clientUsed = '';

  for (const client of INNERTUBE_CLIENTS) {
    try {
      const innertubeResp = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: { client },
          videoId,
        }),
      });
      if (!innertubeResp.ok) {
        console.warn(`[fetchTranscript] ${client.clientName} returned ${innertubeResp.status} for ${videoId}`);
        continue;
      }
      const data = await innertubeResp.json();
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      if (tracks.length > 0) {
        captionTracks = tracks;
        clientUsed = client.clientName;
        break;
      }
    } catch (e) {
      console.warn(`[fetchTranscript] ${client.clientName} error for ${videoId}: ${e.message}`);
    }
  }

  if (captionTracks.length === 0) {
    console.log(`[fetchTranscript] No captionTracks from any Innertube client for ${videoId}. Video may lack captions — CLI backfill (yt-dlp + Whisper) recommended.`);
    return { transcript: '', lang: '', tracks: [] };
  }

  console.log(`[fetchTranscript] Got ${captionTracks.length} tracks via ${clientUsed} for ${videoId}`);

  // 3. Pick track
  let selected = captionTracks[0];
  if (preferLang) {
    const match = captionTracks.find(t => t.languageCode === preferLang);
    if (match) selected = match;
  }

  const trackUrl = selected.baseUrl.replace('&fmt=srv3', '');
  const transcriptResp = await fetch(trackUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    }
  });
  const body = await transcriptResp.text();

  let segments = parseTranscriptXml(body);
  if (segments.length === 0) segments = parseTranscriptJson(body);

  return {
    transcript: mergeToTranscript(segments),
    lang: selected.languageCode || 'unknown',
    tracks: captionTracks.map(t => ({
      lang: t.languageCode,
      name: t.name?.runs?.[0]?.text || t.name?.simpleText || t.languageCode,
      kind: t.kind || 'standard',
    })),
  };
}

// ── build wiki source markdown ─────────────────────────────────────────

function buildSourceMarkdown(videoId, meta, transcriptData, pillar) {
  const today = twDateStr();
  const durationMin = Math.round(meta.duration / 60);
  const slug = slugify(meta.title) || videoId;

  const frontmatter = [
    '---',
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
    'type: source',
    `pillar: ${pillar || 'ai'}`,
    'visibility: public',
    `created: ${today}`,
    `updated: ${today}`,
    'source_count: 0',
    'confidence: low',
    `tags: [YouTube, ${meta.channelTitle}]`,
    'links_to: []',
    'linked_from: []',
    `raw_source_type: youtube`,
    `raw_source_path: "https://www.youtube.com/watch?v=${videoId}"`,
    `youtube_id: "${videoId}"`,
    `youtube_channel: "${meta.channelTitle.replace(/"/g, '\\"')}"`,
    `youtube_channel_id: "${meta.channelId}"`,
    `youtube_published: "${meta.publishedAt}"`,
    `duration: ${meta.duration}`,
    `duration_display: "${durationMin} min"`,
    `transcript_lang: "${transcriptData.lang}"`,
    '---',
  ].join('\n');

  const body = [
    '',
    '## 原文摘要',
    '',
    `（待 Cowork session 補充摘要）`,
    '',
    '## 關鍵概念',
    '',
    '- （待整理）',
    '',
    '## 逐字稿',
    '',
    transcriptData.transcript || '（無字幕可用）',
    '',
    '## Ingest 備註',
    '',
    `- Ingest 日期：${today}`,
    '- 操作者：Code session（YouTube ingest pipeline）',
    `- 影片發布日：${meta.publishedAt.slice(0, 10)}`,
    `- 頻道：${meta.channelTitle}`,
    `- 影片長度：${durationMin} 分鐘`,
    `- 字幕語言：${transcriptData.lang || '無'}`,
    `- 可用字幕：${transcriptData.tracks.map(t => t.lang).join(', ') || '無'}`,
  ].join('\n');

  return { markdown: frontmatter + body, slug: `youtube-${videoId}-${slug}` };
}

// ── POST /api/wiki/youtube-ingest (Mode B: single video) ───────────────

export async function handleYoutubeIngest(request, env) {
  // Admin auth
  const adminToken = request.headers.get('X-Admin-Token');
  if (!adminToken || adminToken !== env.FORMOSA_ADMIN_TOKEN) {
    return jsonResponse({ error: 'Unauthorized' }, 403, request);
  }

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { videoUrl, lang, pillar, force } = body;
  if (!videoUrl) return jsonResponse({ error: 'videoUrl required' }, 400, request);

  const videoId = extractVideoId(videoUrl);
  if (!videoId) return jsonResponse({ error: 'Cannot parse video ID' }, 400, request);

  // Dedup check
  if (!force) {
    const existing = await env.TICKER_KV.get(`youtube:ingested:${videoId}`);
    if (existing) {
      return jsonResponse({ error: 'Already ingested', videoId, slug: existing }, 409, request);
    }
  }

  try {
    // Fetch metadata (needs YOUTUBE_API_KEY)
    if (!env.YOUTUBE_API_KEY) {
      return jsonResponse({ error: 'YOUTUBE_API_KEY not configured' }, 500, request);
    }
    const meta = await fetchVideoMeta(videoId, env.YOUTUBE_API_KEY);

    // Fetch transcript (no API key needed) — fallback to metadata-only on failure
    let transcriptData;
    let transcriptFailed = false;
    try {
      transcriptData = await fetchTranscript(videoId, lang);
    } catch (e) {
      console.warn(`[youtube-ingest] Transcript fetch failed for ${videoId}: ${e.message}. Continuing metadata-only.`);
      transcriptData = { transcript: '', lang: '', tracks: [] };
      transcriptFailed = true;
    }

    // Build markdown
    const result = buildSourceMarkdown(videoId, meta, transcriptData, pillar);

    // Store to KV for CLI pickup
    await env.TICKER_KV.put(`youtube:pending:${videoId}`, JSON.stringify({
      slug: result.slug,
      markdown: result.markdown,
      videoId,
      title: meta.title,
      channelTitle: meta.channelTitle,
      duration: meta.duration,
      transcriptLang: transcriptData.lang,
      ingestedAt: new Date().toISOString(),
    }));

    // Mark as ingested
    await env.TICKER_KV.put(`youtube:ingested:${videoId}`, result.slug);

    return jsonResponse({
      ok: true,
      videoId,
      slug: result.slug,
      title: meta.title,
      duration: meta.duration,
      transcriptLang: transcriptData.lang,
      transcriptLines: transcriptData.transcript ? transcriptData.transcript.split('\n').length : 0,
      transcriptFailed,
      message: `Pending at youtube:pending:${videoId}. Run scripts/wiki-youtube-ingest.cjs to write source file.`,
    }, 200, request);

  } catch (e) {
    return jsonResponse({ error: 'Ingest failed: ' + e.message }, 500, request);
  }
}

// ── Resolve handle → channelId (with KV cache) ────────────────────────

async function resolveChannelId(handle, apiKey, kv) {
  const cacheKey = `youtube:channel_id:${handle}`;
  const cached = await kv.get(cacheKey);
  if (cached) return cached;

  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`channels API error for ${handle}: ${resp.status}`);
  const data = await resp.json();
  const channelId = data.items?.[0]?.id;
  if (!channelId) throw new Error(`No channelId found for handle ${handle}`);

  // Cache indefinitely (handles don't change)
  await kv.put(cacheKey, channelId);
  console.log(`[youtube-scan] Resolved ${handle} → ${channelId}`);
  return channelId;
}

// ── Channel scan (Mode A: cron) ────────────────────────────────────────

export async function handleYoutubeChannelScan(env) {
  if (!env.YOUTUBE_API_KEY) {
    console.log('[youtube-scan] YOUTUBE_API_KEY not set, skipping');
    return { scanned: 0, new: 0 };
  }

  // Load channels list from KV (seeded by CLI from data/youtube-channels.json)
  const channelsRaw = await env.TICKER_KV.get('youtube:channels');
  if (!channelsRaw) {
    console.log('[youtube-scan] No channels configured');
    return { scanned: 0, new: 0 };
  }

  const { channels } = JSON.parse(channelsRaw);
  if (!channels || channels.length === 0) return { scanned: 0, new: 0 };

  // Resolve handle → channelId for channels that only have handle
  for (const ch of channels) {
    if (!ch.channelId && ch.handle) {
      try {
        ch.channelId = await resolveChannelId(ch.handle, env.YOUTUBE_API_KEY, env.TICKER_KV);
      } catch (e) {
        console.error(`[youtube-scan] Cannot resolve channelId for ${ch.handle}: ${e.message}`);
      }
    }
  }

  // Get last scan timestamp (default: 7 days ago)
  const lastScan = await env.TICKER_KV.get('youtube:last_scan');
  const publishedAfter = lastScan || new Date(Date.now() - 7 * 86400000).toISOString();

  let totalNew = 0;

  for (const ch of channels.slice(0, 5)) {
    if (!ch.channelId) {
      console.warn(`[youtube-scan] Skipping ${ch.handle || ch.name}: no channelId`);
      continue;
    }
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ch.channelId}&type=video&order=date&publishedAfter=${publishedAfter}&maxResults=10&key=${env.YOUTUBE_API_KEY}`;
      const resp = await fetch(searchUrl);
      if (!resp.ok) { console.error(`[youtube-scan] API error for ${ch.channelId}: ${resp.status}`); continue; }
      const data = await resp.json();

      for (const item of (data.items || [])) {
        const videoId = item.id.videoId;
        const existing = await env.TICKER_KV.get(`youtube:ingested:${videoId}`);
        if (existing) continue;

        // Fetch full metadata + transcript
        try {
          const meta = await fetchVideoMeta(videoId, env.YOUTUBE_API_KEY);
          let transcriptData;
          try {
            transcriptData = await fetchTranscript(videoId, ch.preferLang || '');
          } catch (e) {
            console.warn(`[youtube-scan] Transcript failed for ${videoId}: ${e.message}. Storing metadata-only.`);
            transcriptData = { transcript: '', lang: '', tracks: [] };
          }
          const result = buildSourceMarkdown(videoId, meta, transcriptData, ch.pillar);

          await env.TICKER_KV.put(`youtube:pending:${videoId}`, JSON.stringify({
            slug: result.slug,
            markdown: result.markdown,
            videoId,
            title: meta.title,
            channelTitle: meta.channelTitle,
            duration: meta.duration,
            transcriptLang: transcriptData.lang,
            ingestedAt: new Date().toISOString(),
          }));
          await env.TICKER_KV.put(`youtube:ingested:${videoId}`, result.slug);
          totalNew++;
          console.log(`[youtube-scan] Queued: ${meta.title} (${videoId})`);
        } catch (e) {
          console.error(`[youtube-scan] Failed ${videoId}: ${e.message}`);
        }
      }
    } catch (e) {
      console.error(`[youtube-scan] Channel ${ch.channelId} error: ${e.message}`);
    }
  }

  await env.TICKER_KV.put('youtube:last_scan', new Date().toISOString());
  console.log(`[youtube-scan] Done. ${channels.length} channels, ${totalNew} new videos`);
  return { scanned: channels.length, new: totalNew };
}
