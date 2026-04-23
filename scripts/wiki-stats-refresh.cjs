#!/usr/bin/env node
/**
 * wiki-stats-refresh.cjs
 * Scans src/content/wiki/ and regenerates stats.json with current counts.
 * Called at end of daily pipeline and after batch ingest.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const WIKI_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'wiki');
const STATS_PATH = path.join(WIKI_DIR, 'stats.json');
const GRAPH_PATH = path.join(WIKI_DIR, 'graph.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('Invalid frontmatter format');

  const frontmatterStr = match[1];
  const frontmatter = {};
  const lines = frontmatterStr.split('\n');
  let currentKey = null;
  let currentValue = [];
  let isArray = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentKey && isArray && currentValue.length > 0) {
        frontmatter[currentKey] = currentValue;
        currentKey = null; currentValue = []; isArray = false;
      }
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      if (isArray && trimmed.startsWith('-')) currentValue.push(trimmed.slice(1).trim());
      continue;
    }

    const key = line.substring(0, colonIndex).trim();
    const valueStr = line.substring(colonIndex + 1).trim();

    if (currentKey && isArray && currentValue.length > 0) {
      frontmatter[currentKey] = currentValue;
      currentKey = null; currentValue = []; isArray = false;
    }

    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      frontmatter[key] = valueStr.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else if (valueStr === 'true') {
      frontmatter[key] = true;
    } else if (valueStr === 'false') {
      frontmatter[key] = false;
    } else if (!isNaN(valueStr) && valueStr !== '') {
      frontmatter[key] = parseInt(valueStr, 10);
    } else if (valueStr === '') {
      currentKey = key; currentValue = []; isArray = true;
    } else {
      frontmatter[key] = valueStr.replace(/^["']|["']$/g, '');
    }
  }
  if (currentKey && isArray && currentValue.length > 0) frontmatter[currentKey] = currentValue;
  return frontmatter;
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md'));
}

function run() {
  const types = ['concepts', 'sources', 'entities'];
  const byType = {};
  const byPillar = {};
  const byVisibility = {};
  const bySourceType = {};
  let total = 0;

  const typeKey = { concepts: 'concept', sources: 'source', entities: 'entity' };
  for (const type of types) {
    const dir = path.join(WIKI_DIR, type);
    const files = scanDir(dir);
    byType[typeKey[type]] = files.length;
    total += files.length;

    for (const f of files) {
      try {
        const content = fs.readFileSync(path.join(dir, f), 'utf8');
        const fm = parseFrontmatter(content);

        if (fm.pillar) byPillar[fm.pillar] = (byPillar[fm.pillar] || 0) + 1;
        if (fm.visibility) byVisibility[fm.visibility] = (byVisibility[fm.visibility] || 0) + 1;
        if (fm.raw_source_type) bySourceType[fm.raw_source_type] = (bySourceType[fm.raw_source_type] || 0) + 1;
        else if (fm.type) bySourceType[fm.type] = (bySourceType[fm.type] || 0) + 1;
      } catch (_) {}
    }
  }

  // graph counts from graph.json
  let graphNodes = 0, graphEdges = 0;
  try {
    const g = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
    graphNodes = (g.nodes || []).length;
    graphEdges = (g.edges || g.links || []).length;
  } catch (_) {}

  const now = new Date();
  const stats = {
    total_pages: total,
    by_type: byType,
    by_pillar: byPillar,
    by_visibility: byVisibility,
    by_source_type: bySourceType,
    graph: { nodes: graphNodes, edges: graphEdges },
    generated_at: now.toISOString(),
    generated: now.toISOString().slice(0, 10),
    total_nodes: graphNodes,
    total_edges: graphEdges
  };

  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
  console.log(`✅ stats.json updated: total_pages=${total}, generated_at=${stats.generated_at}`);
  console.log(`   by_type: ${JSON.stringify(byType)}`);
  console.log(`   by_pillar: ${JSON.stringify(byPillar)}`);
  return stats;
}

module.exports = { run };

if (require.main === module) {
  run();
}
