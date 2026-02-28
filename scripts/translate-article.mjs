/**
 * translate-article.mjs
 * 
 * 自動翻譯 paulkuo.tw 文章到 en/ja/zh-cn
 * 使用 Claude API (Anthropic)
 * 
 * 特性：
 *   - manifest 防重複：原文沒改過就跳過翻譯（idempotent）
 *   - 費用追蹤：每次 API call 記錄到 costs.jsonl
 *   - fallback 上限：非 CI 環境最多翻 5 篇
 * 
 * 使用方式：
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-article.mjs
 * 
 * 或由 GitHub Actions 自動觸發
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import { logCost } from './cost-tracker.mjs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const LOCALES = [
  { 
    code: 'en', 
    name: 'English', 
    instructions: 'Translate to natural, professional English. Preserve theological terms accurately (Logos, Sarx, incarnation). Keep technical terms precise. Maintain the author\'s intellectual voice — thoughtful, measured, with philosophical depth.' 
  },
  { 
    code: 'ja', 
    name: 'Japanese', 
    instructions: '自然で知的な日本語に翻訳してください。神学用語（ロゴス、サルクス、受肉）は正確に。技術用語は適切なカタカナまたは漢字を使用。文体は「です・ます」ではなく「だ・である」調で。著者の知的な語り口を維持してください。' 
  },
  { 
    code: 'zh-cn', 
    name: 'Simplified Chinese', 
    instructions: '转换为简体中文。注意繁体到简体的字符转换。保持原文的思想深度和知识分子语气。神学术语保持准确。不要大幅改变句式结构，主要做字符层面的繁简转换和必要的用语调整。' 
  },
];

const ARTICLES_DIR = 'src/content/articles';
const MANIFEST_PATH = 'data/translation-manifest.json';

// ── Manifest 管理 ──────────────────────────────────────────

function loadManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveManifest(manifest) {
  mkdirSync('data', { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

function fileHash(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  // 只 hash 文章本文（frontmatter 之後的部分）
  // 這樣改 cover/readingTime 等 metadata 不會觸發重翻
  const bodyOnly = extractBody(content);
  return createHash('md5').update(bodyOnly).digest('hex').slice(0, 12);
}

function extractBody(content) {
  // 找第二個 --- 分隔符之後的內容
  if (!content.startsWith('---')) return content;
  const secondDash = content.indexOf('---', 3);
  if (secondDash === -1) return content;
  return content.slice(secondDash + 3).trim();
}

function needsTranslation(manifest, filename, locale) {
  const entry = manifest[filename];
  if (!entry) return true;  // 新文章，沒記錄
  
  // 檢查原文是否改過
  const sourcePath = join(ARTICLES_DIR, filename);
  if (!existsSync(sourcePath)) return false;  // 原文不存在
  
  const currentHash = fileHash(sourcePath);
  if (currentHash !== entry.sourceHash) return true;  // 原文改過，需要重翻
  
  // 檢查該語系翻譯是否存在
  if (!entry.translations[locale]) return true;  // 該語系沒翻過
  
  // 原文沒改 + 翻譯存在 → 跳過
  return false;
}

function updateManifest(manifest, filename, locale, translatedPath) {
  if (!manifest[filename]) {
    manifest[filename] = {
      sourceHash: fileHash(join(ARTICLES_DIR, filename)),
      translations: {}
    };
  }
  
  // 更新 source hash（可能是新文章）
  manifest[filename].sourceHash = fileHash(join(ARTICLES_DIR, filename));
  
  manifest[filename].translations[locale] = {
    hash: fileHash(translatedPath),
    translatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4'
  };
}

// ── Claude API ─────────────────────────────────────────────

async function callClaude(content, locale, slug = '') {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `You are translating a blog article for paulkuo.tw, a personal website by Paul Kuo (郭曜郎) about rebuilding order at the intersection of technology, theology, and civilization.

${locale.instructions}

CRITICAL RULES:
1. Translate the ENTIRE article including frontmatter fields: title, subtitle, description
2. Keep these frontmatter fields UNCHANGED: date, updated, pillar, tags, platform, featured, draft, readingTime, medium_url
3. Keep all Markdown formatting intact
4. Keep code blocks, URLs, and proper nouns (Paul Kuo, CircleFlow, AppWorks, SDTI, etc.) unchanged
5. The frontmatter must remain valid YAML between --- delimiters
6. Output ONLY the translated Markdown file content, no explanations or code fences

Here is the article to translate:

${content}`
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  
  // 費用追蹤
  const usage = data.usage || {};
  logCost({
    service: 'anthropic',
    model: 'claude-sonnet',
    action: `translate-${locale.code}`,
    source: 'translate-article',
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
    note: slug,
  });

  let text = data.content[0].text;
  
  // Strip any accidental code fences
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:markdown|md)?\n?/, '').replace(/\n?```$/, '');
  }
  
  return text;
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  const manifest = loadManifest();
  let filesToTranslate = [];

  // Check if running in CI with git diff available
  try {
    const changed = execSync(
      `git diff --name-only HEAD~1 HEAD -- '${ARTICLES_DIR}/*.md' 2>/dev/null`
    ).toString().trim();
    
    if (changed) {
      filesToTranslate = changed.split('\n').filter(f => 
        f.endsWith('.md') && 
        !f.includes('/en/') && 
        !f.includes('/ja/') && 
        !f.includes('/zh-cn/')
      );
    }
  } catch {
    console.log('📝 No git diff available, checking all articles...');
  }

  // Fallback：掃描所有文章，用 manifest 過濾
  const MAX_FALLBACK = 5;
  if (filesToTranslate.length === 0) {
    if (existsSync(ARTICLES_DIR)) {
      const allFiles = readdirSync(ARTICLES_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => join(ARTICLES_DIR, f));
      
      // 用 manifest 判斷：原文改過或翻譯缺失的才需要翻
      const needWork = allFiles.filter(f => {
        const slug = basename(f);
        return LOCALES.some(l => needsTranslation(manifest, slug, l.code));
      });

      if (needWork.length > MAX_FALLBACK) {
        console.log(`⚠️  Fallback: ${needWork.length} articles need translation, limiting to ${MAX_FALLBACK}`);
        console.log('   Run manually with higher limit for bulk translation.');
        filesToTranslate = needWork.slice(0, MAX_FALLBACK);
      } else {
        filesToTranslate = needWork;
      }
    }
  }

  if (filesToTranslate.length === 0) {
    console.log('ℹ️  No articles to translate (all up to date per manifest).');
    saveManifest(manifest);
    return;
  }

  console.log(`🌐 Found ${filesToTranslate.length} article(s) to translate`);

  let translated = 0;
  let skipped = 0;

  for (const file of filesToTranslate) {
    const filename = basename(file);
    const content = readFileSync(join(ARTICLES_DIR, filename), 'utf-8');
    
    console.log(`\n📄 ${filename}`);

    for (const locale of LOCALES) {
      // Manifest 檢查：跳過不需要翻的
      if (!needsTranslation(manifest, filename, locale.code)) {
        console.log(`   ⏭️  ${locale.name}: up to date (skipped)`);
        skipped++;
        continue;
      }

      const outDir = join(ARTICLES_DIR, locale.code);
      const outFile = join(outDir, filename);
      
      console.log(`   → ${locale.name} (${locale.code})...`);
      
      try {
        mkdirSync(outDir, { recursive: true });
        const slug = basename(filename, '.md');
        const result = await callClaude(content, locale, slug);
        writeFileSync(outFile, result, 'utf-8');
        updateManifest(manifest, filename, locale.code, outFile);
        console.log(`   ✅ ${locale.name}: ${outFile}`);
        translated++;
      } catch (err) {
        console.error(`   ❌ ${locale.name} failed: ${err.message}`);
      }
      
      // Rate limit: wait 1s between API calls
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 儲存更新後的 manifest
  saveManifest(manifest);
  console.log(`\n🎉 Done! Translated: ${translated}, Skipped: ${skipped}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
