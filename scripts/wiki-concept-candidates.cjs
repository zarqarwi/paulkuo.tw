#!/usr/bin/env node
// wiki-concept-candidates.cjs
// 掃描所有 sources 的 candidates 欄位，統計提名次數，輸出排序清單
// 同時顯示哪些是現有 concept、哪些是新候選

const fs = require('fs');
const path = require('path');
const glob = require('glob').sync || require('glob').globSync;

const SOURCES_DIR = path.join(__dirname, '../src/content/wiki/sources');
const CONCEPTS_DIR = path.join(__dirname, '../src/content/wiki/concepts');

// 取得現有 concept slugs
const existingConcepts = new Set(
  fs.readdirSync(CONCEPTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''))
);

// 統計 candidates 提名次數
const candCounts = {};
const candBy = {};
const candTitles = {};

const matchedCounts = {};
const matchedBy = {};

const files = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.md'));

for (const fname of files) {
  const fpath = path.join(SOURCES_DIR, fname);
  const content = fs.readFileSync(fpath, 'utf8');
  const slug = fname.replace('.md', '');

  // 解析 candidates
  const candRegex = /slug_zh:\s*["']([^"']+)["']\s*\n\s*title:\s*["']([^"']+)["']/g;
  let m;
  while ((m = candRegex.exec(content)) !== null) {
    const candSlug = m[1];
    const candTitle = m[2];
    candCounts[candSlug] = (candCounts[candSlug] || 0) + 1;
    candBy[candSlug] = candBy[candSlug] || [];
    candBy[candSlug].push(slug);
    candTitles[candSlug] = candTitle;
  }

  // 解析 matched
  const matchedM = content.match(/concept_links:[\s\S]*?matched:\s*\[([^\]]*)\]/);
  if (matchedM) {
    const items = matchedM[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
    for (const item of items) {
      matchedCounts[item] = (matchedCounts[item] || 0) + 1;
      matchedBy[item] = matchedBy[item] || [];
      matchedBy[item].push(slug);
    }
  }
}

// 輸出報告
console.log('='.repeat(70));
console.log('WIKI CONCEPT CANDIDATES REPORT');
console.log(`Generated: ${new Date().toISOString().slice(0, 10)}`);
console.log('='.repeat(70));
console.log();

console.log('【現有 Concept 被提名次數（candidates）】');
console.log('-'.repeat(50));
const existingCandidates = Object.keys(candCounts)
  .filter(s => existingConcepts.has(s))
  .sort((a, b) => candCounts[b] - candCounts[a]);
for (const slug of existingCandidates) {
  console.log(`  ${String(candCounts[slug]).padStart(3)}  ${slug}`);
}
console.log();

console.log('【新候選 Concepts（candidates >= 2，尚無頁面）】');
console.log('-'.repeat(50));
const newCandidates = Object.keys(candCounts)
  .filter(s => !existingConcepts.has(s) && candCounts[s] >= 2)
  .sort((a, b) => candCounts[b] - candCounts[a]);
for (const slug of newCandidates) {
  console.log(`  ${String(candCounts[slug]).padStart(3)}  ${slug}  （${candTitles[slug]}）`);
  console.log(`       提名來源: ${candBy[slug].slice(0, 3).join(', ')}${candBy[slug].length > 3 ? '...' : ''}`);
}
console.log();

console.log('【低提名候選（candidates = 1，待累積）】');
console.log('-'.repeat(50));
const lowCandidates = Object.keys(candCounts)
  .filter(s => !existingConcepts.has(s) && candCounts[s] === 1)
  .sort((a, b) => a.localeCompare(b));
for (const slug of lowCandidates) {
  console.log(`    1  ${slug}  （${candTitles[slug]}）`);
}
console.log();

console.log('【Matched 統計（sources 正式連結數）】');
console.log('-'.repeat(50));
const matchedSorted = Object.keys(matchedCounts)
  .sort((a, b) => matchedCounts[b] - matchedCounts[a]);
for (const slug of matchedSorted.slice(0, 20)) {
  const isNew = existingConcepts.has(slug) ? '' : ' [未建頁面]';
  console.log(`  ${String(matchedCounts[slug]).padStart(3)}  ${slug}${isNew}`);
}
console.log();

console.log('='.repeat(70));
console.log(`統計: ${files.length} 個 sources，${Object.keys(candCounts).length} 個 candidate slugs，${existingConcepts.size} 個現有 concepts`);
console.log(`需新建: ${newCandidates.length} 個（candidates >= 2）`);
console.log('='.repeat(70));
