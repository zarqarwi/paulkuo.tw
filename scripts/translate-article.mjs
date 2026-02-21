/**
 * translate-article.mjs
 * 
 * 自動翻譯 paulkuo.tw 文章到 en/ja/zh-cn
 * 使用 Claude API (Anthropic)
 * 
 * 使用方式：
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-article.mjs
 * 
 * 或由 GitHub Actions 自動觸發
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { join, basename } from 'path';

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

async function callClaude(content, locale) {
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
  let text = data.content[0].text;
  
  // Strip any accidental code fences
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:markdown|md)?\n?/, '').replace(/\n?```$/, '');
  }
  
  return text;
}

async function main() {
  // Find articles to translate
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
    // Not in CI or git diff failed — translate all root articles
    console.log('📝 No git diff available, checking all articles...');
  }

  // 🔴 FIX: Fallback 加上限，最多翻 5 篇（避免意外翻全部 60+ 篇爆 API 費用）
  const MAX_FALLBACK = 5;
  if (filesToTranslate.length === 0) {
    if (existsSync(ARTICLES_DIR)) {
      const allFiles = readdirSync(ARTICLES_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => join(ARTICLES_DIR, f));
      
      // 只翻還沒有翻譯版本的檔案
      const untranslated = allFiles.filter(f => {
        const slug = basename(f, '.md');
        return !existsSync(join(ARTICLES_DIR, 'en', `${slug}.md`));
      });

      if (untranslated.length > MAX_FALLBACK) {
        console.log(`⚠️  Fallback: ${untranslated.length} untranslated articles found, limiting to ${MAX_FALLBACK}`);
        console.log('   Run manually for bulk translation.');
        filesToTranslate = untranslated.slice(0, MAX_FALLBACK);
      } else {
        filesToTranslate = untranslated;
      }
    }
  }

  if (filesToTranslate.length === 0) {
    console.log('ℹ️  No articles to translate.');
    return;
  }

  console.log(`🌐 Found ${filesToTranslate.length} article(s) to translate`);

  for (const file of filesToTranslate) {
    const filename = basename(file);
    const content = readFileSync(file, 'utf-8');
    
    console.log(`\n📄 Translating: ${filename}`);

    for (const locale of LOCALES) {
      const outDir = join(ARTICLES_DIR, locale.code);
      const outFile = join(outDir, filename);
      
      // Skip if translation already exists and source hasn't changed
      // (In CI, git diff already filtered; locally, always retranslate)
      
      console.log(`   → ${locale.name} (${locale.code})...`);
      
      try {
        mkdirSync(outDir, { recursive: true });
        const translated = await callClaude(content, locale);
        writeFileSync(outFile, translated, 'utf-8');
        console.log(`   ✅ ${locale.name}: ${outFile}`);
      } catch (err) {
        console.error(`   ❌ ${locale.name} failed: ${err.message}`);
      }
      
      // Rate limit: wait 1s between API calls
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log('\n🎉 Translation complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
