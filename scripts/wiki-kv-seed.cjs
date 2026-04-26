#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const matter = require('gray-matter');

const PROJECT_ROOT = process.cwd();
const WIKI_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'wiki');
const CONCEPTS_DIR = path.join(WIKI_DIR, 'concepts');
const NAMESPACE_ID = 'c066a2fd7942494c8ead37cc518b191b';

function parseFrontmatter(content) {
  const parsed = matter(content);
  return {
    frontmatter: parsed.data,
    body: parsed.content.trim(),
  };
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
