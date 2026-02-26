/**
 * prepare-social.mjs — 產生社群摘要 + 配圖，但不排程
 *
 * 由 publish-social.yml 自動觸發（deploy 完成後）
 * 產出存到 data/social-logs/{slug}-{date}.json，等人工確認後再由 dispatch-social.mjs 發送
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { basename, join } from 'path';
import sharp from 'sharp';
import { logCost } from './cost-tracker.mjs';

const SITE_URL = process.env.SITE_URL || 'https://paulkuo.tw';

// ── Retry helper ────────────────────────────────────
async function fetchWithRetry(url, options, { maxRetries = 3, baseDelay = 2000, label = 'API' } = {}) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const resp = await fetch(url, options);
    if (resp.ok) return resp;
    const isRetryable = [429, 500, 502, 503, 529].includes(resp.status);
    if (!isRetryable || attempt === maxRetries) {
      throw new Error(`${label} error: ${resp.status} (after ${attempt} attempts)`);
    }
    const delay = baseDelay * Math.pow(2, attempt - 1);
    console.log(`  ⏳ ${label} returned ${resp.status}, retrying in ${delay / 1000}s...`);
    await new Promise(r => setTimeout(r, delay));
  }
}

// ── 文章解析 ─────────────────────────────────────────
function parseArticle(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw new Error(`Invalid frontmatter: ${filePath}`);
  const fm = {};
  for (const line of fmMatch[1].split('\n')) {
    const m = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
    if (m) fm[m[1]] = m[2];
  }
  return {
    title: fm.title || '',
    subtitle: fm.subtitle || '',
    description: fm.description || '',
    pillar: fm.pillar || 'ai',
    slug: basename(filePath, '.md'),
    body: fmMatch[2].trim(),
    url: `${SITE_URL}/articles/${basename(filePath, '.md')}`,
  };
}

// ── Claude API：產各平台摘要 ─────────────────────────
async function generateSummaries(article) {
  const prompt = `你是 Paul Kuo（郭曜郎）的社群經理。以下是他的新文章，請為 7 個社群平台產生貼文摘要。

文章標題：${article.title}
副標題：${article.subtitle}
描述：${article.description}
連結：${article.url}

文章正文（前 2000 字）：
${article.body.slice(0, 2000)}

請以 JSON 格式回覆，為每個平台產生適合的貼文：
{
  "X": "280字以內，含文章連結，簡潔有力，可加 1-2 個 hashtag",
  "LI": "LinkedIn 風格，500-800字，專業但有個人觀點，結尾加連結",
  "TH": "Threads 風格，300字以內，口語化，加連結",
  "BS": "Bluesky 風格，250字以內，加連結",
  "YT": "YouTube community post 風格，300-500字",
  "FB": "Facebook 風格，300-500字，比較 casual",
  "IG": "Instagram caption 風格，300字以內，多用 emoji 和 hashtag"
}

規則：
- 每則都要包含文章連結 ${article.url}
- 用繁體中文
- 語氣是知識分子但不學究，像在跟朋友分享一個重要想法
- X 的字數一定要在 280 字以內（含連結）
- 只輸出 JSON，不要其他文字`;

  const resp = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  }, { maxRetries: 3, baseDelay: 3000, label: 'Claude API' });

  const data = await resp.json();
  let text = data.content[0].text;
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  const parsed = JSON.parse(text);
  const usage = data.usage || {};
  logCost({ service: 'anthropic', model: 'claude-sonnet', action: 'social-summary', source: 'prepare-social', inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0 });
  return parsed;
}

// ── DALL-E 圖片生成 ──────────────────────────────────
const PILLAR_STYLES = {
  ai: 'electric blue and neon purple accents, neural network patterns, data streams, futuristic digital landscape',
  circular: 'emerald green and gold accents, circular arrows, molecular structures, nature merging with industrial',
  faith: 'warm amber and deep gold, ancient textures meeting modern forms, sacred geometry',
  startup: 'warm orange and amber accents, structures under construction, dramatic light and shadow',
  life: 'soft violet and silver, reflective surfaces, contemplative spaces, memory fragments',
};

const FALLBACK_IMAGES = {
  ai: 'https://paulkuo.tw/images/pillar-ai.svg',
  circular: 'https://paulkuo.tw/images/pillar-circular.svg',
  faith: 'https://paulkuo.tw/images/pillar-faith.svg',
  startup: 'https://paulkuo.tw/images/pillar-startup.svg',
  life: 'https://paulkuo.tw/images/pillar-life.svg',
  default: 'https://paulkuo.tw/images/og-default.svg',
};

async function generateAndUploadImage(title, pillar) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.log('  ⚠️  No OPENAI_API_KEY, skipping image'); return null; }

  const style = PILLAR_STYLES[pillar] || PILLAR_STYLES.ai;
  const prompt = `Create a clean, modern digital illustration, 1024x1024 pixels. Deep navy blue (#0a192f) background with white highlights. Style: abstract and conceptual, professional, minimalist. No text, no letters, no words, no numbers anywhere in the image. Theme: ${title.slice(0, 100)}. Visual elements: ${style}. Mood: professional, forward-thinking, grounded.`;

  console.log('  🎨 Generating image with DALL-E...');
  try {
    const resp = await fetchWithRetry('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', response_format: 'b64_json' }),
    }, { maxRetries: 2, baseDelay: 5000, label: 'DALL-E' });

    const data = await resp.json();
    logCost({ service: 'openai', model: 'dall-e-3', action: 'image-gen', source: 'prepare-social', note: title.slice(0, 50) });
    const rawBuffer = Buffer.from(data.data[0].b64_json, 'base64');

    // 壓縮
    let imageBuffer = rawBuffer;
    if (rawBuffer.length > 950000) {
      for (const quality of [90, 80, 70, 60, 50, 40]) {
        const compressed = await sharp(rawBuffer)
          .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true }).toBuffer();
        if (compressed.length <= 950000) { imageBuffer = compressed; break; }
      }
    }

    // 上傳圖床
    const freeimageKey = process.env.FREEIMAGE_API_KEY;
    if (!freeimageKey) { console.log('  ⚠️  No FREEIMAGE_API_KEY'); return null; }

    const formData = new URLSearchParams();
    formData.append('key', freeimageKey);
    formData.append('action', 'upload');
    formData.append('source', imageBuffer.toString('base64'));
    formData.append('format', 'json');

    const uploadResp = await fetchWithRetry('https://freeimage.host/api/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    }, { maxRetries: 2, baseDelay: 3000, label: 'FreeImage' });

    const uploadData = await uploadResp.json();
    if (uploadData.status_code === 200) {
      console.log(`  🖼️  Image uploaded: ${uploadData.image.url}`);
      return uploadData.image.url;
    }
    return null;
  } catch (e) {
    console.log(`  ❌ Image failed: ${e.message}`);
    return null;
  }
}

// ── 主程式 ───────────────────────────────────────────
async function main() {
  const articlePaths = process.argv[2]?.split('\n').filter(Boolean) || [];
  if (articlePaths.length === 0) { console.log('ℹ️  No articles'); return; }

  console.log(`\n📝 Preparing social content for ${articlePaths.length} article(s)\n`);

  for (const filePath of articlePaths) {
    console.log(`\n📄 Processing: ${filePath}`);
    const article = parseArticle(filePath);
    console.log(`   Title: ${article.title}`);
    console.log(`   URL: ${article.url}`);

    // 1. 產摘要
    console.log('   📝 Generating platform summaries...');
    const summaries = await generateSummaries(article);

    // 2. 產配圖 + 上傳
    const imageUrl = await generateAndUploadImage(article.title, article.pillar)
      || FALLBACK_IMAGES[article.pillar] || FALLBACK_IMAGES.default;

    // 3. 存檔（dispatch-social.mjs 會讀這個檔案）
    const logDir = 'data/social-logs';
    mkdirSync(logDir, { recursive: true });
    const logFile = join(logDir, `${article.slug}-${new Date().toISOString().slice(0,10)}.json`);
    writeFileSync(logFile, JSON.stringify({
      slug: article.slug,
      title: article.title,
      url: article.url,
      pillar: article.pillar,
      summaries,
      imageUrl,
      status: 'pending_review',  // ← 等待審核
      timestamp: new Date().toISOString(),
    }, null, 2));

    console.log(`   💾 Saved: ${logFile}`);
    console.log(`   ⏸️  Waiting for review — will NOT auto-publish`);
  }

  console.log('\n✅ Preparation complete. Review via GitHub Issue, then dispatch.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
