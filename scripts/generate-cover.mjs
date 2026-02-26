/**
 * generate-cover.mjs — Generate DALL-E cover images for new articles
 * Called by translate.yml workflow after translation step.
 * 
 * Reads changed articles, generates a cover image via DALL-E 3,
 * and saves it to public/images/covers/{slug}.jpg
 *
 * Usage: OPENAI_API_KEY=sk-... node scripts/generate-cover.mjs
 */

import { readFileSync, mkdirSync, existsSync, createWriteStream } from 'fs';
import { execSync } from 'child_process';
import { join, basename } from 'path';
import https from 'https';
import { logCost } from './cost-tracker.mjs';

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

function buildPrompt(title, description, pillar) {
  const theme = PILLAR_THEMES[pillar] || PILLAR_THEMES.ai;
  return `Abstract editorial illustration for a blog article titled "${title}". The article is about: ${description}. Visual style: deep navy blue background (#0A1628), accent color ${theme.accentName} (${theme.accent}) for highlights and glow effects. Visual metaphors: ${theme.metaphors}. Clean, minimal, professional style. No text, no words, no letters, no characters anywhere in the image. Dark moody atmosphere with subtle grid lines. Wide format.`;
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
      const imageUrl = await callDallE(buildPrompt(fm.title, fm.description || '', fm.pillar || 'ai'));
      await downloadFile(imageUrl, coverPath);
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
