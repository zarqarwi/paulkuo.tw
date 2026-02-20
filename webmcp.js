/**
 * WebMCP — Agent-Native Web Protocol for paulkuo.tw
 * Phase 5: Chrome 146+ DevTrial (navigator.modelContext)
 * Spec: W3C Web Machine Learning Community Group (Google + Microsoft)
 *
 * This file registers structured tools that AI agents can discover
 * and invoke directly, replacing brittle DOM scraping.
 */
(function initWebMCP() {
  'use strict';

  if (typeof navigator === 'undefined' || !navigator.modelContext) {
    // WebMCP not available — silently exit
    return;
  }

  // ─── Tool 1: search_articles (Imperative API) ───
  navigator.modelContext.registerTool({
    name: 'search_articles',
    description:
      "Search Paul Kuo's published articles and essays by keyword, category, or topic. Returns structured results with title, category, date, excerpt, and URL.",
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description:
            'Free-text search term to match against article titles and descriptions (e.g. "circular economy", "AI", "incarnation")',
        },
        category: {
          type: 'string',
          enum: ['ai', 'circular', 'faith', 'startup', 'life'],
          description:
            'Filter by content pillar: ai (Intelligence & Order), circular (Regenerative Systems), faith (Civilization & Human Nature), startup (Creation & Enterprise), life (Reflections & Memory)',
        },
      },
    },
    handler: async function ({ keyword, category }) {
      var cards = document.querySelectorAll('#blog-grid .content-card');
      var results = [];

      cards.forEach(function (card) {
        var pillar = card.dataset.pillar || '';
        var headline = card.querySelector('[itemprop="headline"]');
        var abstract = card.querySelector('[itemprop="abstract"]');
        var dateEl = card.querySelector('[itemprop="datePublished"]');
        var sectionEl = card.querySelector('[itemprop="articleSection"]');

        if (category && pillar !== category) return;

        var title = headline ? headline.textContent.trim() : '';
        var desc = abstract ? abstract.textContent.trim() : '';

        if (keyword) {
          var kw = keyword.toLowerCase();
          if (
            title.toLowerCase().indexOf(kw) === -1 &&
            desc.toLowerCase().indexOf(kw) === -1
          )
            return;
        }

        results.push({
          title: title,
          category: sectionEl ? sectionEl.textContent.trim() : pillar,
          date: dateEl ? dateEl.getAttribute('datetime') : '',
          excerpt: desc,
          url: 'https://paulkuo.tw/#blog',
        });
      });

      return {
        query: { keyword: keyword || null, category: category || null },
        totalResults: results.length,
        articles: results,
      };
    },
  });

  // ─── Tool 2: get_site_info (Imperative API) ───
  navigator.modelContext.registerTool({
    name: 'get_site_info',
    description:
      "Get structured metadata about Paul Kuo and this website, including bio, expertise areas, social links, and content pillars.",
    inputSchema: { type: 'object', properties: {} },
    handler: async function () {
      return {
        name: 'Paul Kuo',
        alternateName: '郭曜郎',
        title: 'Commercial Integration and AI Digital Development Director',
        organization: 'SDTI (佳龍科技)',
        website: 'https://paulkuo.tw',
        expertise: [
          'Circular Economy',
          'AI Systems',
          'Urban Mining',
          'Taiwan-Japan Cooperation',
          'Theological Ethics',
          'Multi-Agent Cognitive Systems',
        ],
        contentPillars: [
          { id: 'ai', name: 'Intelligence & Order', nameZh: '智能與秩序' },
          { id: 'circular', name: 'Regenerative Systems', nameZh: '再生系統' },
          { id: 'faith', name: 'Civilization & Human Nature', nameZh: '文明與人性' },
          { id: 'startup', name: 'Creation & Enterprise', nameZh: '創造與建構' },
          { id: 'life', name: 'Reflections & Memory', nameZh: '沉思與記憶' },
        ],
        machineReadableIndex: 'https://paulkuo.tw/llm-context.json',
        social: {
          twitter: 'https://x.com/paulkuo',
          linkedin: 'https://www.linkedin.com/in/kuoyaolang',
          threads: 'https://www.threads.net/@zarqarwi',
          youtube: 'https://www.youtube.com/@kuopaul8265',
        },
      };
    },
  });

  // ─── Agent-Awareness UI: subtle footer indicator ───
  var footer = document.querySelector('footer');
  if (footer) {
    var indicator = document.createElement('span');
    indicator.className = 'webmcp-badge';
    indicator.title =
      'This site supports WebMCP — AI agents can discover and call structured tools directly.';
    indicator.textContent = ' \u2726 Agent-Ready';
    indicator.style.cssText =
      'margin-left:8px;font-size:0.72rem;color:rgba(37,99,235,0.5);letter-spacing:0.04em;';
    var footerSpan = footer.querySelector('span');
    if (footerSpan) footerSpan.appendChild(indicator);
  }

  console.log(
    '[WebMCP] paulkuo.tw — 3 tools registered: search_articles, contact_paul_kuo (declarative), get_site_info'
  );
})();
