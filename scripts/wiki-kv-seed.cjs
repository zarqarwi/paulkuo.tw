#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const WIKI_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'wiki');
const CONCEPTS_DIR = path.join(WIKI_DIR, 'concepts');
const NAMESPACE_ID = 'c066a2fd7942494c8ead37cc518b191b';

/**
 * Parse YAML frontmatter from markdown content
 * Returns { frontmatter: object, body: string }
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid frontmatter format');
  }

  const frontmatterStr = match[1];
  const body = match[2].trim();

  // Simple YAML parser for our specific use case
  const frontmatter = {};
  const lines = frontmatterStr.split('\n');
  let currentKey = null;
  let currentValue = [];
  let isArray = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      // Save current key if it's an array
      if (currentKey && isArray && currentValue.length > 0) {
        frontmatter[currentKey] = currentValue;
        currentKey = null;
        currentValue = [];
        isArray = false;
      }
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      // Might be continuation of array
      if (isArray && trimmed.startsWith('-')) {
        const item = trimmed.slice(1).trim();
        currentValue.push(item);
      }
      continue;
    }

    const key = line.substring(0, colonIndex).trim();
    const valueStr = line.substring(colonIndex + 1).trim();

    // Save previous key if it was an array
    if (currentKey && isArray && currentValue.length > 0) {
      frontmatter[currentKey] = currentValue;
      currentKey = null;
      currentValue = [];
      isArray = false;
    }

    // Parse arrays [item1, item2] on single line
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      const arrayContent = valueStr.slice(1, -1);
      frontmatter[key] = arrayContent
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    } else if (valueStr === 'true') {
      frontmatter[key] = true;
    } else if (valueStr === 'false') {
      frontmatter[key] = false;
    } else if (!isNaN(valueStr) && valueStr !== '') {
      frontmatter[key] = parseInt(valueStr, 10);
    } else if (valueStr === '') {
      // Empty value might be start of array
      currentKey = key;
      currentValue = [];
      isArray = true;
    } else {
      // Remove quotes if present
      frontmatter[key] = valueStr.replace(/^["']|["']$/g, '');
    }
  }

  // Save last key if it's an array
  if (currentKey && isArray && currentValue.length > 0) {
    frontmatter[currentKey] = currentValue;
  }

  return { frontmatter, body };
}

/**
 * Extract first N characters of body, removing markdown
 */
function getExcerpt(body, maxChars = 500) {
  // Remove markdown formatting
  let text = body
    .replace(/^#+\s+/gm, '') // Remove headings
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to text
    .replace(/[*_`]/g, '') // Remove emphasis markers
    .replace(/\n+/g, ' ') // Collapse newlines
    .trim();

  return text.substring(0, maxChars);
}

/**
 * Read all concept files and build search index
 */
function buildSearchIndex() {
  console.log('Building search index from concepts...');

  const concepts = [];
  const files = fs.readdirSync(CONCEPTS_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const slug = file.replace('.md', '');
    const filepath = path.join(CONCEPTS_DIR, file);
    const content = fs.readFileSync(filepath, 'utf-8');

    try {
      const { frontmatter, body } = parseFrontmatter(content);

      concepts.push({
        slug,
        title: frontmatter.title || slug,
        pillar: frontmatter.pillar || 'general',
        tags: frontmatter.tags || [],
        excerpt: getExcerpt(body),
        source_count: frontmatter.source_count || 0,
        confidence: frontmatter.confidence || 'medium',
      });

      console.log(`  ✓ Indexed ${slug}`);
    } catch (err) {
      console.error(`  ✗ Error parsing ${slug}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log(`Indexed ${concepts.length} concepts\n`);
  return { concepts };
}

/**
 * Upload a single KV key using wrangler CLI
 */
function uploadToKV(key, value) {
  try {
    const jsonStr = typeof value === 'string' ? value : JSON.stringify(value);
    const tmpFile = path.join(require('os').tmpdir(), `kv-seed-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, jsonStr, 'utf-8');

    const cmd = `wrangler kv key put '${key}' --namespace-id ${NAMESPACE_ID} --path '${tmpFile}' --remote`;

    execSync(cmd, {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    fs.unlinkSync(tmpFile);
    console.log(`  ✓ Uploaded ${key} (${Math.round(jsonStr.length / 1024)}KB)`);
  } catch (err) {
    console.error(`  ✗ Failed to upload ${key}: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Main seeding logic
 */
async function seed() {
  console.log('=== Cloudflare KV Wiki Seeder ===\n');

  // Verify files exist
  if (!fs.existsSync(WIKI_DIR)) {
    console.error(`Error: Wiki directory not found at ${WIKI_DIR}`);
    process.exit(1);
  }

  if (!fs.existsSync(CONCEPTS_DIR)) {
    console.error(`Error: Concepts directory not found at ${CONCEPTS_DIR}`);
    process.exit(1);
  }

  // Build search index
  const searchIndex = buildSearchIndex();

  // Load stats
  console.log('Loading stats...');
  let stats = {};
  const statsPath = path.join(WIKI_DIR, 'stats.json');
  if (fs.existsSync(statsPath)) {
    stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    console.log('  ✓ Loaded stats.json\n');
  }

  // Load graph
  console.log('Loading graph...');
  let graph = {};
  const graphPath = path.join(WIKI_DIR, 'graph.json');
  if (fs.existsSync(graphPath)) {
    graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    console.log('  ✓ Loaded graph.json\n');
  }

  // Upload to KV
  console.log('Uploading to Cloudflare KV...');

  // 1. Upload search index
  uploadToKV('wiki:index', searchIndex);

  // 2. Upload graph
  uploadToKV('wiki:graph', graph);

  // 3. Upload stats
  uploadToKV('wiki:stats', stats);

  // 4. Upload individual concepts
  console.log('\nUploading individual concepts...');
  const conceptFiles = fs
    .readdirSync(CONCEPTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  for (const file of conceptFiles) {
    const slug = file.replace('.md', '');
    const filepath = path.join(CONCEPTS_DIR, file);
    const content = fs.readFileSync(filepath, 'utf-8');

    try {
      const { frontmatter, body } = parseFrontmatter(content);
      uploadToKV(`wiki:concept:${slug}`, { ...frontmatter, slug, body });
    } catch (err) {
      // Fallback: upload raw content wrapped in JSON
      uploadToKV(`wiki:concept:${slug}`, { slug, body: content });
    }
  }

  console.log('\n=== Seed Complete ===');
  console.log(`Uploaded ${conceptFiles.length} concepts + index + graph + stats`);
}

// Run the seeder
seed().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
