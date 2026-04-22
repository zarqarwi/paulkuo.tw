#!/usr/bin/env node

/**
 * Wiki Enrichment CLI (Issue #157)
 *
 * 把 YouTube source 從「原始稿」升級成「有結構知識節點」：
 *   summary / key_points / quotes / chapters / concept_links
 *
 * Usage:
 *   node scripts/wiki-enrich.cjs <slug> [--dry-run] [--force]
 *   node scripts/wiki-enrich.cjs --batch [--type=youtube] [--pillar=ai] [--dry-run] [--force]
 *
 * Model: Haiku 4.5 主力（claude-haiku-4-5-20251001）
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const PROJECT_ROOT  = path.resolve(__dirname, '..');
const SOURCES_DIR   = path.join(PROJECT_ROOT, 'src', 'content', 'wiki', 'sources');
const CONCEPTS_DIR  = path.join(PROJECT_ROOT, 'src', 'content', 'wiki', 'concepts');
const LOGS_DIR      = path.join(PROJECT_ROOT, 'logs');
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
const args      = process.argv.slice(2);
const dryRun    = args.includes('--dry-run');
const force     = args.includes('--force');
const batch     = args.includes('--batch');
const typeArg   = (args.find(a => a.startsWith('--type='))   || '').replace('--type=', '')   || null;
const pillarArg = (args.find(a => a.startsWith('--pillar=')) || '').replace('--pillar=', '') || null;
const slug      = args.find(a => !a.startsWith('--'));

if (!batch && !slug) {
  console.error('Usage: node scripts/wiki-enrich.cjs <slug> [--dry-run] [--force]');
  console.error('       node scripts/wiki-enrich.cjs --batch [--type=youtube] [--pillar=ai] [--dry-run] [--force]');
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[wiki-enrich] ANTHROPIC_API_KEY not set. Add it to .env');
  process.exit(1);
}

// ── Frontmatter helpers ───────────────────────────────────────────────────

function splitFrontmatter(content) {
  const m = content.match(/^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$/);
  if (!m) throw new Error('No YAML frontmatter found');
  return { openDelim: m[1], fmRaw: m[2], midDelim: m[3], body: m[4] };
}

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
    const bodyM = raw.match(/^---[\s\S]*?---\n([\s\S]*?)(\n##|$)/);
    const description = bodyM ? bodyM[1].trim().slice(0, 120) : '';
    return { slug: cSlug, title, description };
  });
}

// ── Transcript extractor ──────────────────────────────────────────────────
function extractTranscript(body) {
  const m = body.match(/##\s*逐字稿\n([\s\S]*?)(?:\n##|$)/);
  const text = m ? m[1].trim() : body.trim();
  return text.length > 8000 ? text.slice(0, 8000) + '\n[…逐字稿截斷]' : text;
}

// ── YAML serialiser ───────────────────────────────────────────────────────
function yamlStr(s) {
  if (typeof s !== 'string') s = String(s ?? '');
  return '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

function buildEnrichmentYaml(data) {
  const lines = [];
  // E2 fix: date and string fields must be quoted for Astro schema (z.string())
  lines.push(`enriched_at: "${TODAY}"`);
  lines.push(`enriched_by: "haiku-4.5"`);
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
  const candidates = (data.concept_links?.candidates || []);
  for (const c of candidates) {
    lines.push(`    - slug_zh: ${yamlStr(c.slug_zh || '')}`);
    lines.push(`      title: ${yamlStr(c.title || '')}`);
    lines.push(`      reason: ${yamlStr(c.reason || '')}`);
  }

  // E2.5: wrong_pillar detection — triggered when Haiku returns matched=[] and
  // the first candidate reason signals no alignment with the concept list
  const firstReason = candidates[0]?.reason || '';
  const wrongPillar = matched.length === 0 && firstReason.includes('主題與現有 concept 清單無核心對齊');
  if (wrongPillar) {
    lines.push('wrong_pillar_suspected: true');
    lines.push(`enrichment_notes: "本 source 主題與 concept 清單無對齊，建議人工審查 pillar 分類"`);
  }

  return { yaml: lines.join('\n'), wrongPillar };
}

// ── Write enrichment back to file ─────────────────────────────────────────
function writeFrontmatter(sourcePath, content, enrichmentYaml) {
  const { openDelim, fmRaw, midDelim, body } = splitFrontmatter(content);

  let cleanFmRaw = fmRaw;
  if (fmRaw.includes('enriched_at:')) {
    if (!force) {
      console.warn('[wiki-enrich] Already enriched. Use --force to overwrite. Skipping.');
      return false;
    }
    // Strip existing enrichment block (always appended at end of frontmatter)
    console.warn('[wiki-enrich] --force: overwriting existing enrichment.');
    cleanFmRaw = fmRaw.replace(/\nenriched_at:[\s\S]*$/, '').trimEnd();
  }

  const newContent = openDelim + cleanFmRaw + '\n' + enrichmentYaml + midDelim + body;
  fs.writeFileSync(sourcePath, newContent, 'utf-8');
  return true;
}

// ── LLM call ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `你是 Paul Kuo 的 LLM Wiki 知識管理助手。任務：把 YouTube 逐字稿或筆記內容，升級成結構化的知識節點摘要。

輸出規則：
1. 繁體中文，台灣用語（影片/軟體/網路，不用視頻/软件/网络）
2. 嚴格輸出 JSON，無前後綴文字
3. summary 字數必須在 280-320 之間。少於 280 需補充背景脈絡或論點延伸；超過 320 需精簡，不要堆疊冗詞。
4. key_points 5 條，每條 20-40 字
5. quotes 3-5 條，原文金句 + timestamp（若逐字稿無時間戳，留空字串）
6. chapters 依逐字稿結構分 3-8 段
7. concept_links.matched：只從提供的 concept 清單挑選；只列「核心主題」——即該 concept 是影片/文章的主軸或論述骨幹。沾邊、輔助性提及的 concept 放到 candidates 的 reason 裡說明，不放 matched。寧可少列精準的 3 個，不要多列勉強的 5 個。

   ⚠️ 重要：如果影片主題與提供的 concept 清單**完全不相關**（例如影片講睡眠科學但 concept 清單全是 AI 主題），matched 直接留空陣列 []，並在 candidates 的第一個項目 reason 裡說明：「本 source 主題與現有 concept 清單無核心對齊，建議作為候選主題獨立列出。」絕不為了湊數而 match 不相關 concept。空陣列是合法且正確的輸出。
8. 若逐字稿品質差（口語重複、雜訊多），summary 仍需凝練；不要照抄
9. concept_links.candidates 的 slug_zh 欄位命名：技術術語、產業概念、國際通用主題 → 英文 kebab-case（如 spatial-intelligence, world-model-stack）；在地議題、台灣特有情境、中文人文概念 → 中文 slug（如 台灣循環經濟, 在地供應鏈）。判斷基準：該 slug 若要對英語圈讀者說明是否自然？自然→用英文；需中文語境才成立→用中文。欄位名保留 slug_zh，內容可為中英任一。
10. matched 陣列裡的每個 concept 必須在 candidates 陣列的首個項目 reason 裡附上至少一句逐字稿原文或 chapters 段落引用作為證據。如果找不到直接證據，該 concept 必須從 matched 移除。這是硬性要求，為了防止表面關鍵字匹配。`;

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
  "summary": "280-320 字摘要",
  "key_points": ["...", "...", "...", "...", "..."],
  "quotes": [{"text": "...", "timestamp": "MM:SS 或空字串"}, ...],
  "chapters": [{"title": "...", "start": "MM:SS 或空字串", "summary": "30 字"}, ...],
  "concept_links": {
    "matched": ["slug1", "slug2"],
    "candidates": [
      {"slug_zh": "英文kebab或中文slug", "title": "標題", "reason": "為何值得獨立成 concept，及是否只是沾邊提及"}
    ]
  }
}`;
}

function extractJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No JSON object found in LLM response');
  return JSON.parse(m[0]);
}

// ── Failure logger ────────────────────────────────────────────────────────
function logFailure(slug, err) {
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
  const logPath = path.join(LOGS_DIR, `wiki-enrich-${TODAY}.log`);
  const line = `[${new Date().toISOString()}] FAIL ${slug}: ${err.message}\n`;
  fs.appendFileSync(logPath, line, 'utf-8');
}

// ── Single-file enrichment ────────────────────────────────────────────────
async function enrichOne(targetSlug, client, concepts) {
  const sourcePath = path.join(SOURCES_DIR, `${targetSlug}.md`);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source not found: ${sourcePath}`);
  }

  const content = fs.readFileSync(sourcePath, 'utf-8');
  const { fmRaw, body } = splitFrontmatter(content);

  // Guard: already enriched (skip unless --force)
  if (!dryRun && !force && fmRaw.includes('enriched_at:')) {
    console.error(`[wiki-enrich] ${targetSlug}: already enriched, skipping (use --force to overwrite)`);
    return { skipped: true };
  }
  if (force && fmRaw.includes('enriched_at:')) {
    console.warn(`[wiki-enrich] ${targetSlug}: --force overwrite mode`);
  }

  const meta = {
    title:           yamlGet(fmRaw, 'title') || targetSlug,
    pillar:          yamlGet(fmRaw, 'pillar') || 'ai',
    raw_note_id:     yamlGet(fmRaw, 'raw_note_id'),
    raw_source_type: yamlGet(fmRaw, 'raw_source_type') || 'youtube',
  };

  const transcript = extractTranscript(body);
  if (transcript.length < 50) {
    throw new Error('Transcript too short or missing');
  }

  if (dryRun) {
    console.error(`[wiki-enrich] dry-run: would call LLM for ${targetSlug} (transcript: ${transcript.length} chars)`);
    return { dryRun: true };
  }

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
  console.error(`[wiki-enrich] ${targetSlug}: tokens in ${usage?.input_tokens} / out ${usage?.output_tokens}`);

  const { yaml: enrichmentYaml, wrongPillar } = buildEnrichmentYaml(result);
  const written = writeFrontmatter(sourcePath, content, enrichmentYaml);
  if (written) {
    console.log(`[wiki-enrich] Written: ${sourcePath}`);
    if (wrongPillar) {
      console.warn(`[wiki-enrich] ⚠️  wrong_pillar_suspected: ${targetSlug} — matched 為空且 concept 清單無對齊，請人工審查 pillar 分類`);
      logFailure(targetSlug, new Error('wrong_pillar_suspected: matched=[] with no concept alignment'));
    }
  }

  return {
    written,
    wrongPillar: wrongPillar || false,
    inputTokens:  usage?.input_tokens  || 0,
    outputTokens: usage?.output_tokens || 0,
  };
}

// ── Batch discovery ───────────────────────────────────────────────────────
function discoverSources() {
  const files = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.md'));
  const sources = [];

  for (const f of files) {
    const fSlug = f.replace(/\.md$/, '');
    const raw   = fs.readFileSync(path.join(SOURCES_DIR, f), 'utf-8');
    let fmRaw   = '';
    try {
      ({ fmRaw } = splitFrontmatter(raw));
    } catch {
      continue;
    }

    // raw_source_type takes precedence; fall back to source_type; no default assumption
    const sourceType = yamlGet(fmRaw, 'raw_source_type') || yamlGet(fmRaw, 'source_type') || '';
    const pillar     = yamlGet(fmRaw, 'pillar') || '';
    const enriched   = fmRaw.includes('enriched_at:');

    if (typeArg && sourceType !== typeArg) continue;
    if (pillarArg && pillar !== pillarArg) continue;
    if (enriched && !force) continue;

    sources.push({ slug: fSlug, enriched });
  }

  return sources;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  if (batch) {
    await runBatch();
  } else {
    await runSingle();
  }
}

async function runSingle() {
  const sourcePath = path.join(SOURCES_DIR, `${slug}.md`);
  if (!fs.existsSync(sourcePath)) {
    console.error(`[wiki-enrich] Source not found: ${sourcePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(sourcePath, 'utf-8');
  const { fmRaw, body } = splitFrontmatter(content);

  if (!dryRun && !force && fmRaw.includes('enriched_at:')) {
    console.warn('[wiki-enrich] Already enriched. Use --force to overwrite. Exiting.');
    process.exit(0);
  }

  const transcript = extractTranscript(body);
  if (transcript.length < 50) {
    console.error('[wiki-enrich] Transcript too short or missing. Exiting.');
    process.exit(1);
  }

  console.error(`[wiki-enrich] Enriching: ${slug}`);
  console.error(`[wiki-enrich] Transcript chars: ${transcript.length}`);

  const concepts = loadConcepts();
  console.error(`[wiki-enrich] Loaded ${concepts.length} concepts`);

  if (dryRun) {
    console.error('[wiki-enrich] dry-run: would call LLM (skipping API call).');
    return;
  }

  const _sdk = require('@anthropic-ai/sdk');
  const AnthropicClass = _sdk.default || _sdk;
  const client = new AnthropicClass({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.error(`[wiki-enrich] Calling ${MODEL_PRIMARY}…`);
  const response = await client.messages.create({
    model:      MODEL_PRIMARY,
    max_tokens: 4096,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: buildUserPrompt(
      {
        title:           yamlGet(fmRaw, 'title') || slug,
        pillar:          yamlGet(fmRaw, 'pillar') || 'ai',
        raw_note_id:     yamlGet(fmRaw, 'raw_note_id'),
        raw_source_type: yamlGet(fmRaw, 'raw_source_type') || 'youtube',
      },
      concepts,
      transcript,
    ) }],
  });

  const rawText = response.content[0]?.text;
  if (!rawText) throw new Error('Empty response from LLM');

  const result = extractJson(rawText);
  const usage = response.usage;
  console.error(`[wiki-enrich] Tokens — in: ${usage?.input_tokens}, out: ${usage?.output_tokens}`);

  const { yaml: enrichmentYaml, wrongPillar } = buildEnrichmentYaml(result);
  const written = writeFrontmatter(sourcePath, content, enrichmentYaml);
  if (written) {
    console.log(`[wiki-enrich] Written: ${sourcePath}`);
    if (wrongPillar) {
      console.warn(`[wiki-enrich] ⚠️  wrong_pillar_suspected: ${slug} — matched 為空且 concept 清單無對齊，請人工審查 pillar 分類`);
      logFailure(slug, new Error('wrong_pillar_suspected: matched=[] with no concept alignment'));
    }
  }
}

async function runBatch() {
  const sources = discoverSources();

  if (sources.length === 0) {
    console.log('[wiki-enrich] No sources to process.');
    return;
  }

  const total = sources.length;
  console.error(`[wiki-enrich] Batch: ${total} source(s) to process${typeArg ? ` (type=${typeArg})` : ''}${pillarArg ? ` (pillar=${pillarArg})` : ''}${dryRun ? ' [dry-run]' : ''}${force ? ' [force]' : ''}`);

  if (dryRun) {
    console.log(`[wiki-enrich] dry-run batch preview (${total} sources):`);
    sources.forEach((s, i) => {
      console.log(`  [${i + 1}/${total}] ${s.slug}${s.enriched ? ' (already enriched → would overwrite)' : ''}`);
    });
    return;
  }

  const _sdk = require('@anthropic-ai/sdk');
  const AnthropicClass = _sdk.default || _sdk;
  const client = new AnthropicClass({ apiKey: process.env.ANTHROPIC_API_KEY });

  const concepts = loadConcepts();
  console.error(`[wiki-enrich] Loaded ${concepts.length} concepts`);

  let successCount    = 0;
  let failCount       = 0;
  let wrongPillarCount = 0;
  let totalIn         = 0;
  let totalOut        = 0;

  for (let i = 0; i < sources.length; i++) {
    const { slug: s } = sources[i];
    process.stderr.write(`[wiki-enrich] [${i + 1}/${total}] ${s} … `);

    try {
      const res = await enrichOne(s, client, concepts);
      if (res.skipped) {
        process.stderr.write('skipped\n');
      } else {
        successCount++;
        if (res.wrongPillar) wrongPillarCount++;
        totalIn  += res.inputTokens  || 0;
        totalOut += res.outputTokens || 0;
        process.stderr.write(res.wrongPillar ? '⚠️  wrong_pillar\n' : '✓\n');
      }
    } catch (err) {
      failCount++;
      process.stderr.write(`✗ ${err.message}\n`);
      logFailure(s, err);
    }

    if (i < sources.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n[wiki-enrich] 完成 ✓ ${successCount} 成功 / ✗ ${failCount} 失敗 / ${total} 總計`);
  if (wrongPillarCount > 0) {
    console.log(`[wiki-enrich] ⚠️  wrong_pillar_suspected: ${wrongPillarCount} 支，請 grep enrichment_notes 確認`);
  }
  console.log(`[wiki-enrich] Token 消耗 — in: ${totalIn.toLocaleString()}, out: ${totalOut.toLocaleString()}`);
  if (failCount > 0 || wrongPillarCount > 0) {
    console.log(`[wiki-enrich] 詳情見 logs/wiki-enrich-${TODAY}.log`);
  }
}

main().catch(err => {
  console.error('[wiki-enrich] Fatal:', err.message);
  process.exit(1);
});
