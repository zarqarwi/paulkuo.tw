#!/usr/bin/env node
/**
 * TQEF Phase 1 Migration — Direct D1 via wrangler
 * Bypasses API auth issues by generating SQL and executing via wrangler d1
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';

const ROOT = resolve(import.meta.dirname, '..');
const DB_NAME = 'paulkuo-auth';
const WRANGLER_CONFIG = 'worker/wrangler.toml';

function escSQL(s) {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

// ── Step 1: Import corpus ──
function migrateCorpus() {
  const corpusPath = join(ROOT, 'public', 'tools', 'tqef', 'corpus.json');
  console.log(`\n📚 Reading corpus: ${corpusPath}`);
  const corpus = JSON.parse(readFileSync(corpusPath, 'utf-8'));
  console.log(`   ${corpus.length} sentences`);

  const stmts = corpus.map(item => {
    const id = escSQL(item.id);
    const domain = escSQL(item.industry || item.domain || 'unknown');
    const source = escSQL(item.source_ja || item.source_text || '');
    const ref = escSQL(item.reference_zh_tw || item.reference_translation || '');
    const diff = escSQL(item.difficulty || 'medium');
    const focus = escSQL(JSON.stringify(item.focus || []));
    const terms = escSQL(JSON.stringify(item.critical_terms || {}));
    const nums = escSQL(JSON.stringify(item.critical_numbers || []));
    const gloss = escSQL(JSON.stringify(item.glossary || []));
    return `INSERT OR IGNORE INTO tqef_corpus (id, domain, source_lang, target_lang, source_text, reference_translation, difficulty, focus, critical_terms, critical_numbers, glossary) VALUES (${id}, ${domain}, 'ja', 'zh-TW', ${source}, ${ref}, ${diff}, ${focus}, ${terms}, ${nums}, ${gloss});`;
  });

  return stmts;
}

// ── Step 2: Import rounds ──
function migrateRounds() {
  const files = readdirSync(ROOT)
    .filter(f => /^tqef-r[\d.]+.*\.json$/i.test(f))
    .sort();

  console.log(`\n📊 Found ${files.length} round files: ${files.join(', ')}`);

  const allStmts = [];

  for (const file of files) {
    const filePath = join(ROOT, file);
    console.log(`   Processing: ${file}`);
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'));

    const match = file.match(/tqef-r([\d.]+)/i);
    const roundId = match ? 'R' + match[1] : file;
    const summary = raw.summary || {};

    // Round INSERT
    allStmts.push(`INSERT OR IGNORE INTO tqef_rounds (round_id, eval_mode, corpus_size, evaluated_count, completed_at, translation_model, l2_overall, l2_term, l2_fluency, l2_context, l2_format, l2_critical_errors, industry_breakdown, metadata) VALUES (${escSQL(roundId)}, ${escSQL(raw.mode || 'translation_only')}, ${raw.corpus_size || raw.evaluated || 29}, ${raw.evaluated || 29}, ${escSQL(raw.timestamp)}, 'claude-haiku-4-5', ${summary.overall || 'NULL'}, ${summary.terminology || 'NULL'}, ${summary.naturalness || 'NULL'}, ${summary.fidelity || 'NULL'}, ${summary.critical_data || 'NULL'}, ${summary.critical_errors || 0}, ${escSQL(JSON.stringify(raw.industry_breakdown || raw.per_industry || null))}, ${escSQL(JSON.stringify({ cn_terms: summary.cn_terms, status: summary.status }))});`);

    // Results INSERT
    const results = raw.results || [];
    for (const r of results) {
      if (r.error || (!r.scores && !r.judgment?.scores)) continue;
      const scores = r.scores || r.judgment?.scores || {};
      const translated = r.haiku_output || r.translated || r.translation || '';
      const errors = r.errors || r.judgment?.errors || [];
      const isCritical = errors.some(e => e.severity === 'critical') ? 1 : 0;
      const wt = r.weighted_total || r.judgment?.weighted_total || null;

      allStmts.push(`INSERT OR IGNORE INTO tqef_results (round_id, sentence_id, domain, difficulty, source_text, reference_translation, translation, l2_term, l2_fluency, l2_context, l2_format, weighted_total, is_critical_error, errors) VALUES (${escSQL(roundId)}, ${escSQL(r.id)}, ${escSQL(r.industry || r.domain || null)}, ${escSQL(r.difficulty || null)}, ${escSQL(r.source_ja || r.source || null)}, ${escSQL(r.reference_zh_tw || r.reference || null)}, ${escSQL(translated)}, ${scores.terminology || 'NULL'}, ${scores.naturalness || 'NULL'}, ${scores.fidelity || 'NULL'}, ${scores.critical_data || 'NULL'}, ${wt || 'NULL'}, ${isCritical}, ${escSQL(JSON.stringify(errors))});`);
    }
  }

  return allStmts;
}

// ── Main ──
console.log('🔄 TQEF Phase 1 Migration (Direct D1)');

const corpusStmts = migrateCorpus();
const roundStmts = migrateRounds();
const allSQL = [...corpusStmts, '', '-- Corpus version snapshot', `INSERT INTO tqef_corpus_versions (snapshot, sentence_count, note) VALUES ('[]', ${corpusStmts.length}, 'Phase 1 migration');`, '', ...roundStmts].join('\n');

const sqlPath = join(ROOT, 'worker', 'tqef-migrate-data.sql');
writeFileSync(sqlPath, allSQL);
console.log(`\n📝 SQL written to: ${sqlPath}`);
console.log(`   ${corpusStmts.length} corpus inserts + ${roundStmts.length} round/result inserts`);

console.log('\n🚀 Executing on remote D1...');
try {
  const cmd = `cd "${ROOT}" && wrangler d1 execute ${DB_NAME} --file=worker/tqef-migrate-data.sql --config ${WRANGLER_CONFIG} --remote`;
  const output = execSync(cmd, { encoding: 'utf-8', timeout: 60000 });
  console.log(output);
  console.log('✅ Migration complete!');
  console.log('   Next: open https://paulkuo.tw/tools/tqef/admin/ to verify');
} catch (e) {
  console.error('❌ wrangler d1 execute failed:', e.message);
  console.log(`\n💡 You can manually run:\n   wrangler d1 execute ${DB_NAME} --file=worker/tqef-migrate-data.sql --config ${WRANGLER_CONFIG} --remote`);
}
