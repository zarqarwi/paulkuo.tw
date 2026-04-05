/**
 * remark-wikilinks — Resolves [[slug]] and [[slug|display]] in wiki markdown.
 *
 * - Routable pages (public concept/entity) → <a href="/wiki/{slug}/">
 * - Sources / non-routable → <span class="wikilink-ref"> (styled, no link)
 * - Unknown slug → <span class="wikilink-missing"> (graceful degrade)
 *
 * Slug resolution order:
 *   1. Exact id match in graph.json
 *   2. Case-insensitive title match (supports 繁體中文 titles)
 */

import { visit } from 'unist-util-visit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

export default function remarkWikilinks() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const graphPath = path.resolve(__dirname, '../content/wiki/meta/graph.json');

  // id → { title, type, visibility }
  const slugMap = new Map();
  // lowercase title → id (for Chinese title lookup)
  const titleMap = new Map();

  try {
    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
    for (const node of graph.nodes) {
      slugMap.set(node.id, {
        title: node.title || node.id,
        type: node.type,
        visibility: node.visibility,
      });
      if (node.title) {
        titleMap.set(node.title.toLowerCase(), node.id);
      }
    }
  } catch (e) {
    console.warn('[remark-wikilinks] Could not load graph.json:', e.message);
  }

  // Pages that have actual routes: public concepts + entities
  const routable = new Set();
  for (const [id, meta] of slugMap) {
    if (
      meta.visibility === 'public' &&
      (meta.type === 'concept' || meta.type === 'entity')
    ) {
      routable.add(id);
    }
  }

  return function transformer(tree) {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === null) return;
      if (!node.value.includes('[[')) return;

      const parts = [];
      let lastIndex = 0;

      WIKILINK_RE.lastIndex = 0;
      let match;
      while ((match = WIKILINK_RE.exec(node.value)) !== null) {
        // Text before this match
        if (match.index > lastIndex) {
          parts.push({ type: 'text', value: node.value.slice(lastIndex, match.index) });
        }

        const inner = match[1];
        let slug, displayText;

        if (inner.includes('|')) {
          const pipeIdx = inner.indexOf('|');
          slug = inner.slice(0, pipeIdx).trim();
          displayText = inner.slice(pipeIdx + 1).trim();
        } else {
          slug = inner.trim();
          displayText = null;
        }

        // Resolve: direct id → title lookup
        let resolvedSlug = slugMap.has(slug) ? slug : null;
        if (!resolvedSlug) {
          const byTitle = titleMap.get(slug.toLowerCase());
          if (byTitle) resolvedSlug = byTitle;
        }

        const meta = resolvedSlug ? slugMap.get(resolvedSlug) : null;
        const label = displayText || (meta ? meta.title : slug);

        if (resolvedSlug && routable.has(resolvedSlug)) {
          // Linked page exists → anchor
          parts.push({
            type: 'link',
            url: `/wiki/${resolvedSlug}/`,
            children: [{ type: 'text', value: label }],
            data: { hProperties: { class: 'wikilink' } },
          });
        } else if (meta) {
          // Known node but not routable (source, internal, etc.)
          parts.push({
            type: 'html',
            value: `<span class="wikilink-ref" title="${meta.title}">${label}</span>`,
          });
        } else {
          // Unknown slug → missing marker
          parts.push({
            type: 'html',
            value: `<span class="wikilink-missing">${label}</span>`,
          });
        }

        lastIndex = match.index + match[0].length;
      }

      if (parts.length === 0) return;

      // Remaining text
      if (lastIndex < node.value.length) {
        parts.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...parts);
      // Return the new index to avoid re-visiting inserted nodes
      return index + parts.length;
    });
  };
}
