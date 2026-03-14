#!/usr/bin/env node
/**
 * TQEF Phase 1 Migration Script
 * Reads corpus.json and R-JSON files, POSTs to TQEF API
 *
 * Usage:
 *   node scripts/tqef-migrate.mjs --api-key YOUR_ADMIN_INVITE_CODE
 *
 * Requires: corpus.json in public/tools/tqef/ and tqef-r*.json in repo root
 */
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const API_BASE = 'https://api.paulkuo.tw';
const args = process.argv.slice(2);
const apiKeyIdx = args.indexOf('--api-key');
const API_KEY = apiKeyIdx >= 0 ? args[apiKeyIdx + 1] : '';

if (!API_KEY) {
  console.error('Usage: node scripts/tqef-migrate.mjs --api-key YOUR_ADMIN_INVITE_CODE');
  process.exit(1);
}

const ROOT = resolve(import.meta.dirname, '..');

async function postJSON(path, body) {
  const url = `${API_BASE}${path}?code=${encodeURIComponent(API_KEY)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok && res.status !== 409) {
    throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

// ── Step 1: Import corpus ──
async function migrateCorpus() {
  const corpusPath = join(ROOT, 'public', 'tools', 'tqef', 'corpus.json');
  console.log(`\n📚 Reading corpus: ${corpusPath}`);
  const corpus = JSON.parse(readFileSync(corpusPath, 'utf-8'));
  console.log(`   ${corpus.length} sentences`);

  const { status, data } = await postJSON('/api/tqef/corpus/import', corpus);
  if (status === 200) {
    console.log(`   ✅ Imported: ${data.inserted} inserted, ${data.skipped} skipped, total: ${data.total}`);
  } else {
    console.log(`   ⚠️  Status ${status}:`, data);
  }
}

// ── Step 2: Import R-JSON rounds ──
async function migrateRounds() {
  // Find all tqef-r*.json files in repo root
  const files = readdirSync(ROOT)
    .filter(f => /^tqef-r[\d.]+.*\.json$/i.test(f))
    .sort();

  console.log(`\n📊 Found ${files.length} round files: ${files.join(', ')}`);

  for (const file of files) {
    const filePath = join(ROOT, file);
    console.log(`\n   Processing: ${file}`);

    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Derive round_id from filename: tqef-r8-2026-03-14.json → R8
    const match = file.match(/tqef-r([\d.]+)/i);
    const roundId = match ? 'R' + match[1] : file;

    // Normalize to upload format
    const payload = {
      round_id: roundId,
      run: raw.run || roundId,
      timestamp: raw.timestamp,
      mode: raw.mode || 'translation_only',
      corpus_size: raw.corpus_size || raw.summary?.n,
      evaluated: raw.evaluated || raw.summary?.n,
      summary: raw.summary,
      industry_breakdown: raw.industry_breakdown || raw.per_industry,
      results: raw.results,
      translation_model: raw.translation_model || 'claude-haiku-4-5'
    };

    const { status, data } = await postJSON('/api/tqef/eval/upload', payload);
    if (status === 200) {
      console.log(`   ✅ ${roundId}: overall ${raw.summary?.overall}, ${data.summary?.sentences_inserted} sentences, ${data.summary?.sentences_skipped} skipped`);
    } else if (status === 409) {
      console.log(`   ⏭️  ${roundId}: already exists, skipping`);
    } else {
      console.log(`   ⚠️  ${roundId}: Status ${status}:`, data);
    }
  }
}

async function main() {
  console.log('🔄 TQEF Phase 1 Migration');
  console.log(`   API: ${API_BASE}`);
  console.log(`   Key: ${API_KEY.slice(0, 3)}...`);

  await migrateCorpus();
  await migrateRounds();

  console.log('\n✅ Migration complete!');
  console.log('   Next: open https://paulkuo.tw/tools/tqef/admin/ to verify');
}

main().catch(e => {
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
});
