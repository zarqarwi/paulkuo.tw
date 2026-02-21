/**
 * publish-social.mjs — 新文章自動發佈到 8 個社群平台
 *
 * 由 GitHub Actions publish-social.yml 觸發
 * 流程：讀文章 → Claude 產摘要 → DALL-E 生圖 → freeimage 上傳 → OneUp 排程
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { basename, join } from 'path';

import { PLATFORM_IDS, MANUAL_PLATFORMS, CHAR_LIMITS, DEFAULT_REDDIT_SUBREDDIT } from './platform-config.mjs';

// ── 設定 ────────────────────────────────────────────
const SITE_URL = process.env.SITE_URL || 'https://paulkuo.tw';
const ONEUP_API_BASE = 'https://www.oneupapp.io/api';

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
  const prompt = `你是 Paul Kuo（郭曜郎）的社群經理。以下是他的新文章，請為 8 個社群平台產生貼文摘要。

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
  "RD": "Reddit 風格，簡短介紹 + 連結，適合 r/Taiwan 或個人 subreddit",
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

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
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
  });

  if (!resp.ok) throw new Error(`Claude API error: ${resp.status}`);
  const data = await resp.json();
  let text = data.content[0].text;
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(text);
}

// ── DALL-E 圖片生成 ──────────────────────────────────
const PILLAR_STYLES = {
  ai: 'electric blue and neon purple accents, neural network patterns, data streams, futuristic digital landscape',
  circular: 'emerald green and gold accents, circular arrows, molecular structures, nature merging with industrial',
  faith: 'warm amber and deep gold, ancient textures meeting modern forms, sacred geometry',
  startup: 'warm orange and amber accents, structures under construction, dramatic light and shadow',
  life: 'soft violet and silver, reflective surfaces, contemplative spaces, memory fragments',
};

// 🟡 FIX: 預設圖片 — DALL-E 或圖床失敗時的 fallback
const FALLBACK_IMAGES = {
  ai: 'https://paulkuo.tw/images/pillar-ai.svg',
  circular: 'https://paulkuo.tw/images/pillar-circular.svg',
  faith: 'https://paulkuo.tw/images/pillar-faith.svg',
  startup: 'https://paulkuo.tw/images/pillar-startup.svg',
  life: 'https://paulkuo.tw/images/pillar-life.svg',
  default: 'https://paulkuo.tw/images/og-default.svg',
};

async function generateImage(title, pillar) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) { console.log('  ⚠️  No OPENAI_API_KEY, skipping image'); return null; }

  const style = PILLAR_STYLES[pillar] || PILLAR_STYLES.ai;
  const prompt = `Create a clean, modern digital illustration, 1024x1024 pixels. Deep navy blue (#0a192f) background with white highlights. Style: abstract and conceptual, professional, minimalist. No text, no letters, no words, no numbers anywhere in the image. Theme: ${title.slice(0, 100)}. Visual elements: ${style}. Mood: professional, forward-thinking, grounded.`;

  console.log('  🎨 Generating image with DALL-E...');
  const resp = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024', response_format: 'b64_json' }),
  });

  if (!resp.ok) { console.log(`  ❌ DALL-E error: ${resp.status}`); return null; }
  const data = await resp.json();
  return Buffer.from(data.data[0].b64_json, 'base64');
}

// ── 圖床上傳 ─────────────────────────────────────────
async function uploadToImageHost(imageBuffer) {
  const apiKey = process.env.FREEIMAGE_API_KEY;
  if (!apiKey) { console.log('  ⚠️  No FREEIMAGE_API_KEY'); return null; }

  const formData = new URLSearchParams();
  formData.append('key', apiKey);
  formData.append('action', 'upload');
  formData.append('source', imageBuffer.toString('base64'));
  formData.append('format', 'json');

  const resp = await fetch('https://freeimage.host/api/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!resp.ok) { console.log(`  ❌ Image upload error: ${resp.status}`); return null; }
  const data = await resp.json();
  if (data.status_code === 200) {
    console.log(`  🖼️  Image uploaded: ${data.image.url}`);
    return data.image.url;
  }
  console.log(`  ❌ Upload failed: ${JSON.stringify(data)}`);
  return null;
}

// ── OneUp 排程 ───────────────────────────────────────
async function schedulePost(content, platformIds, scheduledTime, imageUrl, redditTitle) {
  const endpoint = imageUrl ? 'scheduleimagepost' : 'scheduletextpost';
  const params = new URLSearchParams({
    apiKey: process.env.ONEUP_API_KEY,
    category_id: process.env.ONEUP_CATEGORY_ID || '171342',
    social_network_id: JSON.stringify(platformIds),
    scheduled_date_time: scheduledTime,
    content,
  });
  if (imageUrl) params.append('image_url', imageUrl);
  if (redditTitle) params.append('title', redditTitle);

  // Reddit needs subreddit
  const hasReddit = platformIds.some(id => id === PLATFORM_IDS.RD);
  if (hasReddit) params.append('subreddit', DEFAULT_REDDIT_SUBREDDIT);

  const resp = await fetch(`${ONEUP_API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await resp.json();
  return { status: resp.status, data };
}

// ── 排程時間計算 ─────────────────────────────────────
function getScheduledTime(offsetMinutes = 60) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + offsetMinutes);
  // 取最近的 10 分鐘
  now.setMinutes(Math.ceil(now.getMinutes() / 10) * 10, 0, 0);
  return now.toISOString().replace('T', ' ').slice(0, 16);
}

// ── Slack 通知 ───────────────────────────────────────
async function notifySlack(text) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    console.log(`  ⚠️  Slack notification failed: ${e.message}`);
  }
}

// ── 主程式 ───────────────────────────────────────────
async function main() {
  const articlePaths = process.argv[2]?.split('\n').filter(Boolean) || [];
  if (articlePaths.length === 0) {
    console.log('ℹ️  No articles to publish');
    return;
  }

  console.log(`\n🚀 Publishing ${articlePaths.length} article(s) to social media\n`);

  for (const filePath of articlePaths) {
    console.log(`\n📄 Processing: ${filePath}`);

    // 1. 解析文章
    const article = parseArticle(filePath);
    console.log(`   Title: ${article.title}`);
    console.log(`   URL: ${article.url}`);

    // 2. 產生各平台摘要
    console.log('   📝 Generating platform summaries...');
    const summaries = await generateSummaries(article);

    // 2.5 存檔摘要（可追溯）
    const logDir = 'data/social-logs';
    mkdirSync(logDir, { recursive: true });
    const logFile = join(logDir, `${article.slug}-${new Date().toISOString().slice(0,10)}.json`);
    writeFileSync(logFile, JSON.stringify({ slug: article.slug, title: article.title, url: article.url, summaries, timestamp: new Date().toISOString() }, null, 2));
    console.log(`   💾 Summaries saved: ${logFile}`);

    // 3. 生成配圖（失敗時用預設 pillar 圖）
    const imageBuffer = await generateImage(article.title, article.pillar);
    let imageUrl = null;
    if (imageBuffer) {
      imageUrl = await uploadToImageHost(imageBuffer);
    }
    if (!imageUrl) {
      imageUrl = FALLBACK_IMAGES[article.pillar] || FALLBACK_IMAGES.default;
      console.log(`   🖼️  Using fallback image: ${imageUrl}`);
    }

    // 4. 排程到各平台（分批：自動平台 + 手動平台）
    const scheduledTime = getScheduledTime(60);
    let successCount = 0;
    let failCount = 0;
    const results = [];

    // 自動排程的平台（排除 FB、IG）
    const autoPlatforms = Object.entries(PLATFORM_IDS)
      .filter(([code]) => !MANUAL_PLATFORMS.has(code));

    for (const [code, id] of autoPlatforms) {
      const content = summaries[code] || summaries.X || article.description;

      // 字數檢查
      if (content.length > (CHAR_LIMITS[code] || 5000)) {
        console.log(`   ⚠️  ${code}: content too long (${content.length}), truncating`);
      }

      const truncated = content.slice(0, CHAR_LIMITS[code] || 5000);

      try {
        const redditTitle = code === 'RD' ? article.title : undefined;
        const { status, data } = await schedulePost(
          truncated, [id], scheduledTime, imageUrl, redditTitle
        );

        if (status === 200) {
          console.log(`   ✅ ${code}: scheduled for ${scheduledTime}`);
          successCount++;
          results.push(`✅ ${code}`);
        } else {
          console.log(`   ❌ ${code}: HTTP ${status} — ${JSON.stringify(data)}`);
          failCount++;
          results.push(`❌ ${code}: ${status}`);
        }
      } catch (e) {
        console.log(`   ❌ ${code}: ${e.message}`);
        failCount++;
        results.push(`❌ ${code}: ${e.message}`);
      }

      // 間隔避免 rate limit
      await new Promise(r => setTimeout(r, 2000));
    }

    // 5. 通知
    const summary = [
      `📢 社群自動發佈完成`,
      `📝 ${article.title}`,
      `🔗 ${article.url}`,
      `⏰ 排程: ${scheduledTime}`,
      `${imageUrl ? '🖼️ 配圖: ' + imageUrl : '📝 純文字（無配圖）'}`,
      `📊 結果: ${successCount} 成功 / ${failCount} 失敗`,
      results.join(' | '),
      `⚠️ FB、IG 需手動發佈`,
    ].join('\n');

    console.log(`\n${'─'.repeat(50)}`);
    console.log(summary);
    console.log('─'.repeat(50));

    await notifySlack(summary);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
