#!/usr/bin/env node

/**
 * Wiki Enrichment CLI (Issue #157)
 *
 * 把 YouTube source 從「原始稿」升級成「有結構知識節點」：
 *   summary / key_points / quotes / chapters / concept_links
 *
 * Usage:
 *   node scripts/wiki-enrich.cjs <slug> --dry-run   # 印 JSON，不寫檔
 *   node scripts/wiki-enrich.cjs <slug>              # 寫回 frontmatter
 *
 * Model: Haiku 4.5 主力（claude-haiku-4-5-20251001）
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const PROJECT_ROOT  = path.resolve(__dirname, '..');
const SOURCES_DIR   = path.join(PROJECT_ROOT, 'src', 'content', 'wiki', 'sources');
const CONCEPTS_DIR  = path.join(PROJECT_ROOT, 'src', 'content', 'wiki', 'concepts');
const MODEL_PRIMARY = 'claude-haiku-4-5-20251001';
const TODAY         = new Date().toISOString().slice(0, 10);

// ── .env loader (zero-dep) ────────────────────────────────────────────────
(function loadDotEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  try {
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const rawLine of raw.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env) || process.env[key] === '') process.env[key] = val;
    }
  } catch (err) {
    console.warn(`[dotenv] failed to load ${envPath}: ${err.message}`);
  }
})();

// ── Arg parsing ───────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const slug   = args.find(a => !a.startsWith('--'));

if (!slug) {
  console.error('Usage: node scripts/wiki-enrich.cjs <slug> [--dry-run]');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[wiki-enrich] ANTHROPIC_API_KEY not set. Add it to .env');
  process.exit(1);
}

// ── Frontmatter helpers ───────────────────────────────────────────────────

/**
 * Split a source .md into { fmRaw, body, openDelim, midDelim }.
 * Format:  ---\n<fmRaw>\n---\n<body>
 */
function splitFrontmatter(content) {
  const m = content.match(/^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$/);
  if (!m) throw new Error('No YAML frontmatter found');
  return { openDelim: m[1], fmRaw: m[2], midDelim: m[3], body: m[4] };
}

/** Extract a scalar value from raw YAML text (handles quoted / unquoted). */
function yamlGet(fmRaw, key) {
  const re = new RegExp(`^${key}:\\s*(.*)`, 'm');
  const m = fmRaw.match(re);
  if (!m) return null;
  let val = m[1].trim();
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  return val || null;
}

// ── Concept loader ────────────────────────────────────────────────────────
function loadConcepts() {
  const files = fs.readdirSync(CONCEPTS_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const raw   = fs.readFileSync(path.join(CONCEPTS_DIR, f), 'utf-8');
    const cSlug = f.replace(/\.md$/, '');
    let title   = cSlug;
    const titleM = raw.match(/^title:\s*(.+)/m);
    if (titleM) {
      title = titleM[1].trim().replace(/^["']|["']$/g, '');
    }
    // First non-empty paragraph after closing ---
    const bodyM = raw.match(/^---[\s\S]*?---\n([\s\S]*?)(\n##|$)/);
    const description = bodyM ? bodyM[1].trim().slice(0, 120) : '';
    return { slug: cSlug, title, description };
  });
}

// ── Transcript extractor ──────────────────────────────────────────────────
function extractTranscript(body) {
  // Try to find ## 逐字稿 section
  const m = body.match(/##\s*逐字稿\n([\s\S]*?)(?:\n##|$)/);
  const text = m ? m[1].trim() : body.trim();
  // Limit to ~8 000 chars to keep token cost low
  return text.length > 8000 ? text.slice(0, 8000) + '\n[…逐字稿截斷]' : text;
}

// ── YAML serialiser (minimal, no external deps) ───────────────────────────
function yamlStr(s) {
  if (typeof s !== 'string') s = String(s ?? '');
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

function buildEnrichmentYaml(data) {
  const lines = [];
  lines.push(`enriched_at: ${TODAY}`);
  lines.push(`enriched_by: haiku-4.5`);
  lines.push(`summary: ${yamlStr(data.summary)}`);

  lines.push('key_points:');
  for (const kp of (data.key_points || [])) {
    lines.push(`  - ${yamlStr(kp)}`);
  }

  lines.push('quotes:');
  for (const q of (data.quotes || [])) {
    lines.push(`  - text: ${yamlStr(q.text)}`);
    lines.push(`    timestamp: ${yamlStr(q.timestamp || '')}`);
  }

  lines.push('chapters:');
  for (const ch of (data.chapters || [])) {
    lines.push(`  - title: ${yamlStr(ch.title)}`);
    lines.push(`    start: ${yamlStr(ch.start || '')}`);
    lines.push(`    summary: ${yamlStr(ch.summary)}`);
  }

  lines.push('concept_links:');
  const matched = (data.concept_links?.matched || []);
  lines.push(`  matched: [${matched.join(', ')}]`);
  lines.push('  candidates:');
  for (const c of (data.concept_links?.candidates || [])) {
    lines.push(`    - slug_zh: ${yamlStr(c.slug_zh || '')}`);
    lines.push(`      title: ${yamlStr(c.title || '')}`);
    lines.push(`      reason: ${yamlStr(c.reason || '')}`);
  }

  return lines.join('\n');
}

// ── Write enrichment back to file ─────────────────────────────────────────
function writeFrontmatter(sourcePath, content, enrichmentYaml) {
  const { openDelim, fmRaw, midDelim, body } = splitFrontmatter(content);

  // Guard: already enriched?
  if (fmRaw.includes('enriched_at:')) {
    console.warn('[wiki-enrich] File already has enriched_at. Skipping (use --force in E2).');
    return false;
  }

  const newContent = openDelim + fmRaw + '\n' + enrichmentYaml + midDelim + body;
  fs.writeFileSync(sourcePath, newContent, 'utf-8');
  return true;
}

// ── LLM call ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `你是 Paul Kuo 的 LLM Wiki 知識管理助手。任務：把 YouTube 逐字稿或筆記內容，升級成結構化的知識節點摘要。

輸出規則：
1. 繁體中文，台灣用語（影片/軟體/網路，不用視頻/软件/网络）
2. 嚴格輸出 JSON，無前後綴文字
3. summary 控制在 280-320 字
4. key_points 5 條，每條 20-40 字
5. quotes 3-5 條，原文金句 + timestamp（若逐字稿無時間戳，留空字串）
6. chapters 依逐字稿結構分 3-8 段
7. concept_links.matched：只從提供的 concept 清單挑選；不要發明
8. 若逐字稿品質差（口語重複、雜訊多），summary 仍需凝練；不要照抄`;

function buildUserPrompt(meta, concepts, transcript) {
  const conceptListJson = JSON.stringify(concepts, null, 2);
  return `## 現有 Concept 清單（只能從這裡 match）
${conceptListJson}

## Source Metadata
- title: ${meta.title}
- pillar: ${meta.pillar}
- raw_note_id: ${meta.raw_note_id || ''}
- 來源類型: ${meta.raw_source_type || 'youtube'}

## 逐字稿 / 原文內容
${transcript}

---

請輸出 JSON：
{
  "summary": "300 字摘要",
  "key_points": ["...", "...", "...", "...", "..."],
  "quotes": [{"text": "...", "timestamp": "MM:SS 或空字串"}, ...],
  "chapters": [{"title": "...", "start": "MM:SS 或空字串", "summary": "30 字"}, ...],
  "concept_links": {
    "matched": ["slug1", "slug2"],
    "candidates": [
      {"slug_zh": "中文slug", "title": "標題", "reason": "為何值得獨立成 concept"}
    ]
  }
}`;
}

function extractJson(text) {
  // Strip any markdown fences or leading text before the JSON object
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON object found in LLM response');
  return JSON.parse(m[0]);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  const sourcePath = path.join(SOURCES_DIR, `${slug}.md`);
  if (!fs.existsSync(sourcePath)) {
    console.error(`[wiki-enrich] Source not found: ${sourcePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(sourcePath, 'utf-8');
  const { fmRaw, body } = splitFrontmatter(content);

  // Guard: already enriched
  if (!dryRun && fmRaw.includes('enriched_at:')) {
    console.warn('[wiki-enrich] Already enriched. Use --force (E2) to overwrite. Exiting.');
    process.exit(0);
  }

  const meta = {
    title:           yamlGet(fmRaw, 'title') || slug,
    pillar:          yamlGet(fmRaw, 'pillar') || 'ai',
    raw_note_id:     yamlGet(fmRaw, 'raw_note_id'),
    raw_source_type: yamlGet(fmRaw, 'raw_source_type') || 'youtube',
  };

  const transcript = extractTranscript(body);
  if (transcript.length < 50) {
    console.error('[wiki-enrich] Transcript too short or missing. Exiting.');
    process.exit(1);
  }

  console.error(`[wiki-enrich] Enriching: ${slug}`);
  console.error(`[wiki-enrich] Transcript chars: ${transcript.length}`);

  const concepts = loadConcepts();
  console.error(`[wiki-enrich] Loaded ${concepts.length} concepts for Pass 1 alignment`);

  // Load SDK
  const _sdk = require('@anthropic-ai/sdk');
  const AnthropicClass = _sdk.default || _sdk;
  const client = new AnthropicClass({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.error(`[wiki-enrich] Calling ${MODEL_PRIMARY}…`);
  const response = await client.messages.create({
    model:      MODEL_PRIMARY,
    max_tokens: 4096,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: buildUserPrompt(meta, concepts, transcript) }],
  });

  const rawText = response.content[0]?.text;
  if (!rawText) throw new Error('Empty response from LLM');

  const result = extractJson(rawText);

  const usage = response.usage;
  console.error(`[wiki-enrich] Tokens — in: ${usage?.input_tokens}, out: ${usage?.output_tokens}`);

  if (dryRun) {
    console.log(JSON.stringify(result, null, 2));
    console.error('[wiki-enrich] dry-run complete. No files written.');
    return;
  }

  const enrichmentYaml = buildEnrichmentYaml(result);
  const written = writeFrontmatter(sourcePath, content, enrichmentYaml);
  if (written) {
    console.log(`[wiki-enrich] Written: ${sourcePath}`);
  }
}

main().catch(err => {
  console.error('[wiki-enrich] Fatal:', err.message);
  process.exit(1);
});
