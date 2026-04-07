#!/usr/bin/env node

/**
 * Wiki YouTube Ingest CLI (Issue #126)
 *
 * Two modes:
 *   1) Pull pending videos from KV → write to src/content/wiki/sources/
 *      $ node scripts/wiki-youtube-ingest.cjs
 *
 *   2) Trigger single-video ingest via API, then pull
 *      $ node scripts/wiki-youtube-ingest.cjs https://www.youtube.com/watch?v=XXXX
 *      $ node scripts/wiki-youtube-ingest.cjs XXXX --pillar=circular --lang=zh-TW
 *
 * Requires: wrangler CLI (for KV access)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
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

// ── Pull pending videos from KV ────────────────────────────────────────

async function pullPending() {
  console.log('Scanning KV for youtube:pending:* keys...\n');
  const keys = kvList('youtube:pending:');

  if (keys.length === 0) {
    console.log('No pending YouTube videos in KV.');
    return 0;
  }

  let written = 0;
  for (const entry of keys) {
    const key = entry.name;
    const raw = kvGet(key);
    if (!raw) continue;

    let data;
    try { data = JSON.parse(raw); } catch { console.error(`  ✗ Bad JSON for ${key}`); continue; }

    const filename = `${data.slug}.md`;
    const filepath = path.join(SOURCES_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`  ⊘ Already exists: ${filename}`);
      kvDelete(key);
      continue;
    }

    fs.writeFileSync(filepath, data.markdown, 'utf-8');
    console.log(`  ✓ Written: ${filename} (${data.title})`);
    kvDelete(key);
    written++;
  }

  console.log(`\nWrote ${written} source file(s) to wiki/sources/`);
  return written;
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
  return pullPending();
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
    else if (arg === '--seed-channels') { seedChannels(); return; }
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage:
  node scripts/wiki-youtube-ingest.cjs                    Pull pending from KV
  node scripts/wiki-youtube-ingest.cjs <url|videoId>      Ingest single video
  node scripts/wiki-youtube-ingest.cjs --seed-channels    Upload channels.json to KV

Options:
  --lang=zh-TW       Preferred transcript language
  --pillar=ai        Wiki pillar (ai|circular|faith|startup|life)
  --force            Re-ingest even if already done
  --seed-channels    Seed data/youtube-channels.json to KV`);
      return;
    }
    else positional.push(arg);
  }

  if (positional.length > 0) {
    await triggerIngest(positional[0], options);
  } else {
    await pullPending();
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
