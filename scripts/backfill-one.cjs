#!/usr/bin/env node
/**
 * One-shot backfill for a single videoId.
 * 用法：node backfill-one.cjs <videoId>
 * 走 wiki-youtube-ingest.cjs 的 fetchTranscriptLocal，成功就 inject 回 source 檔。
 */
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = '/Users/apple/Desktop/01_專案進行中/paulkuo.tw';
const SOURCES_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'wiki', 'sources');
const INGEST_SCRIPT = path.join(PROJECT_ROOT, 'scripts', 'wiki-youtube-ingest.cjs');

// 先載入 .env（因為我們會把 lib 副本 require 到 /tmp，那個副本的
// dotenv loader 用 __dirname/.. 會指錯地方）
(function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf-8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
})();

const videoId = process.argv[2];
if (!videoId) {
  console.error('Usage: node backfill-one.cjs <videoId>');
  process.exit(1);
}

// require the ingest script to reuse its helpers — but it auto-runs main()...
// 改用比較乾淨的方式：直接 import 需要的函式實作。
// fetchTranscriptLocal 沒 export，所以我們用子行程方式：改 source file 為 transcript_lang: ""
// 再呼叫 --backfill，但只對這一支。

// 最直接：讀腳本檔、eval 出 fetchTranscriptLocal 和 injectTranscript。
const scriptSrc = fs.readFileSync(INGEST_SCRIPT, 'utf-8');

// 把 main() 那段註解掉，避免 require 時自動跑
const safeSrc = scriptSrc.replace(/^main\(\)\.catch[\s\S]*$/m, '// main() disabled');
const modulePath = '/tmp/wiki-youtube-ingest-lib.cjs';
fs.writeFileSync(modulePath, safeSrc + '\nmodule.exports = { fetchTranscriptLocal, injectTranscript };\n');

const { fetchTranscriptLocal, injectTranscript } = require(modulePath);

// 找對應的 source 檔
const files = fs.readdirSync(SOURCES_DIR).filter(f => f.startsWith('youtube-') && f.endsWith('.md'));
const target = files.find(f => {
  const content = fs.readFileSync(path.join(SOURCES_DIR, f), 'utf-8');
  return content.includes(`youtube_id: "${videoId}"`);
});

if (!target) {
  console.error(`✗ No source file found for videoId=${videoId}`);
  process.exit(2);
}

const filepath = path.join(SOURCES_DIR, target);
let content = fs.readFileSync(filepath, 'utf-8');
console.log(`→ Target: ${target}`);
console.log(`→ Fetching transcript for ${videoId}...`);

const t0 = Date.now();
const result = fetchTranscriptLocal(videoId);
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

console.log(`\n── Result (${elapsed}s) ──`);
console.log(`  method: ${result.method}`);
console.log(`  lang:   ${result.lang || '(none)'}`);
console.log(`  length: ${result.transcript ? result.transcript.length : 0} chars`);

if (result.transcript) {
  content = injectTranscript(content, result);
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  content = content.replace(/^updated: .+$/m, `updated: ${today}`);
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`✓ Written back to: ${target}`);
} else {
  console.log(`✗ No transcript obtained — file unchanged`);
  process.exit(3);
}
