/**
 * generate-cover.mjs — Generate DALL-E cover images for new articles
 * Called by translate.yml workflow after translation step.
 * 
 * Reads changed articles, generates a cover image via DALL-E 3,
 * and saves it to public/images/covers/{slug}.jpg
 *
 * Usage: OPENAI_API_KEY=sk-... node scripts/generate-cover.mjs
 */

import { readFileSync, mkdirSync, existsSync, createWriteStream, unlinkSync, statSync } from 'fs';
import { execSync } from 'child_process';
import { join, basename } from 'path';
import https from 'https';
import sharp from 'sharp';
import { logCost } from './cost-tracker.mjs';

const MAX_SIZE_KB = 450; // 壓縮目標（validate-articles.sh 門檻 500KB，留 buffer）
const JPG_QUALITY = 80;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not set');
  process.exit(1);
}

const ARTICLES_DIR = 'src/content/articles';
const COVERS_DIR = 'public/images/covers';

const PILLAR_THEMES = {
  ai: {
    accentName: 'electric blue', accent: '#2563EB',
    metaphors: 'neural networks, circuit patterns, data streams, geometric brain, digital constellation'
  },
  circular: {
    accentName: 'emerald green', accent: '#059669',
    metaphors: 'recycling loops, organic cycles, regeneration, urban mining, molecular rebirth'
  },
  faith: {
    accentName: 'warm amber', accent: '#B45309',
    metaphors: 'ancient architecture, light through stained glass, sacred geometry, manuscripts, wisdom'
  },
  startup: {
    accentName: 'bold red', accent: '#DC2626',
    metaphors: 'building blocks, construction, forge and anvil, launching, blueprints'
  },
  life: {
    accentName: 'deep purple', accent: '#7C3AED',
    metaphors: 'contemplation, still water reflection, journaling, solitary path, twilight sky'
  }
};

function parseFrontmatter(filepath) {
  const content = readFileSync(filepath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  match[1].split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*(.+)/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      fm[m[1]] = val;
    }
  });
  return fm;
}

// DALL-E content policy 會擋掉某些敏感詞（屠宰場、崩潰、暴力等），sanitize 後再送
const SENSITIVE_PATTERNS = [
  /屠宰場?/g, /殺戮/g, /暴力/g, /血腥/g, /死亡/g, /戰爭/g, /武器/g,
  /slaughter/gi, /kill/gi, /violen(t|ce)/gi, /blood/gi, /death/gi, /weapon/gi, /war\b/gi, /crash/gi,
  /崩[潰壞]/g, /毀滅/g, /災難/g, /恐[懼慌]/g, /失眠/g,
];

function sanitizeForDallE(text) {
  let s = text;
  for (const pat of SENSITIVE_PATTERNS) s = s.replace(pat, '');
  return s.replace(/\s{2,}/g, ' ').trim();
}

function buildPrompt(title, description, pillar) {
  const theme = PILLAR_THEMES[pillar] || PILLAR_THEMES.ai;
  const safeTitle = sanitizeForDallE(title);
  const safeDesc = sanitizeForDallE(description || '');
  return `Abstract editorial illustration for a blog article titled "${safeTitle}". The article is about: ${safeDesc}. Visual style: deep navy blue background (#0A1628), accent color ${theme.accentName} (${theme.accent}) for highlights and glow effects. Visual metaphors: ${theme.metaphors}. Clean, minimal, professional style. No text, no words, no letters, no characters anywhere in the image. Dark moody atmosphere with subtle grid lines. Wide format.`;
}

// 如果 sanitize 後還是被擋，用純 pillar 主題 fallback
function buildFallbackPrompt(pillar) {
  const theme = PILLAR_THEMES[pillar] || PILLAR_THEMES.ai;
  return `Abstract editorial illustration. Visual style: deep navy blue background (#0A1628), accent color ${theme.accentName} (${theme.accent}) for highlights and glow effects. Visual metaphors: ${theme.metaphors}. Clean, minimal, professional style. No text, no words, no letters, no characters anywhere in the image. Dark moody atmosphere with subtle grid lines. Wide format.`;
}

function callDallE(prompt) {
  const body = JSON.stringify({
    model: 'dall-e-3', prompt, size: '1792x1024', quality: 'standard', n: 1
  });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com', path: '/v1/images/generations', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data?.[0]?.url) resolve(json.data[0].url);
          else reject(new Error(`DALL-E error: ${data.substring(0, 300)}`));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const follow = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location);
        } else {
          const file = createWriteStream(dest);
          res.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }
      }).on('error', reject);
    };
    follow(url);
  });
}

async function compressImage(srcPath, destPath) {
  const rawSize = statSync(srcPath).size;
  const rawKB = Math.round(rawSize / 1024);

  // 第一輪：轉 JPG + 指定 quality
  await sharp(srcPath)
    .jpeg({ quality: JPG_QUALITY, mozjpeg: true })
    .toFile(destPath);

  let finalSize = statSync(destPath).size;
  let finalKB = Math.round(finalSize / 1024);

  // 如果還是超標，逐步降 quality
  if (finalKB > MAX_SIZE_KB) {
    for (const q of [65, 50, 40]) {
      await sharp(srcPath)
        .jpeg({ quality: q, mozjpeg: true })
        .toFile(destPath);
      finalSize = statSync(destPath).size;
      finalKB = Math.round(finalSize / 1024);
      if (finalKB <= MAX_SIZE_KB) break;
    }
  }

  // 清除暫存檔
  unlinkSync(srcPath);
  console.log(`   📐 ${rawKB}KB → ${finalKB}KB (quality: ${finalKB <= MAX_SIZE_KB ? '✅' : '⚠️ still over'})`);
}

async function main() {
  let changedFiles;
  try {
    changedFiles = execSync(
      `git diff --name-only HEAD~1 HEAD -- '${ARTICLES_DIR}/*.md'`,
      { encoding: 'utf-8' }
    ).trim().split('\n').filter(f =>
      f && !f.includes('/en/') && !f.includes('/ja/') && !f.includes('/zh-cn/')
    );
  } catch {
    console.log('ℹ️  No git diff available');
    changedFiles = [];
  }

  if (changedFiles.length === 0) {
    console.log('ℹ️  No changed articles found');
    return;
  }

  mkdirSync(COVERS_DIR, { recursive: true });

  for (const filepath of changedFiles) {
    const slug = basename(filepath, '.md');
    const coverPath = join(COVERS_DIR, `${slug}.jpg`);

    if (existsSync(coverPath)) {
      console.log(`⏭️  Cover exists: ${slug}`);
      continue;
    }

    const fm = parseFrontmatter(filepath);
    if (!fm?.title) {
      console.log(`⚠️  No frontmatter: ${filepath}`);
      continue;
    }

    console.log(`🎨 Generating cover: ${slug}`);
    try {
      let imageUrl;
      try {
        imageUrl = await callDallE(buildPrompt(fm.title, fm.description || '', fm.pillar || 'ai'));
      } catch (err) {
        if (err.message.includes('content_policy')) {
          console.log(`⚠️  Content policy hit, retrying with fallback prompt...`);
          imageUrl = await callDallE(buildFallbackPrompt(fm.pillar || 'ai'));
        } else {
          throw err;
        }
      }
      const tmpPath = coverPath + '.tmp';
      await downloadFile(imageUrl, tmpPath);
      await compressImage(tmpPath, coverPath);
      logCost({
        service: 'openai',
        model: 'dall-e-3',
        action: 'cover-image',
        source: 'generate-cover',
        costUSD: 0.080,
        note: slug,
      });
      console.log(`✅ Cover saved: ${coverPath}`);
    } catch (err) {
      console.error(`❌ Failed for ${slug}: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('🎨 Cover generation complete');
}

main().catch(err => { console.error('❌ Fatal:', err); process.exit(1); });
