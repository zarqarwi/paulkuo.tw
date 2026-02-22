/**
 * WebMCP Tool Registration for paulkuo.tw
 * 
 * Registers structured tools via navigator.modelContext API,
 * allowing AI agents to discover and interact with Paul's expertise,
 * articles, and contact capabilities.
 * 
 * Progressive enhancement: no-op if WebMCP is not supported.
 * W3C WebMCP Spec: https://webmachinelearning.github.io/webmcp/
 */
(function () {
  'use strict';

  // Feature detection — only run if WebMCP API is available
  if (!('modelContext' in navigator)) {
    console.log('[WebMCP] navigator.modelContext not available. Skipping tool registration.');
    return;
  }

  const SITE_URL = 'https://paulkuo.tw';
  let articleIndex = null;

  // ============================================================
  // Tool 1: get_paul_profile
  // "Tell me about Paul Kuo" — structured personal profile
  // ============================================================
  navigator.modelContext.registerTool({
    name: 'get_paul_profile',
    description: 'Get Paul Kuo\'s professional profile including background, expertise areas, career history, and contact information. Paul is a cross-disciplinary professional spanning theology, circular economy, semiconductor industry, and AI systems development based in Taiwan.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
    async execute() {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            name: 'Paul Kuo 郭曜郎',
            title: 'Commercial Integration & AI Digital Development Director',
            organization: 'SDTI 佳龍科技',
            location: 'Taiwan',
            website: SITE_URL,
            email: 'paul@lasaas.com',
            tagline: 'Rebuilding Order in an Age of Intelligence',
            summary: 'Cross-disciplinary professional with 15 years of theological training, over a decade in PCB manufacturing metal recovery, and deep expertise in AI systems development. Currently leading Taiwan-Japan semiconductor cooperation and circular economy initiatives at SDTI.',
            background: [
              '15 years theological training — systematic thinking, ethical reasoning, cross-cultural communication',
              '10+ years PCB manufacturing metal recovery — circular economy, urban mining, resource regeneration',
              'AppWorks accelerator alumnus — startup ecosystem, venture building',
              '半畝塘 VP — sustainable architecture and community development',
              '厚生市集 — local food systems and agricultural supply chain',
              'Currently: AI-driven circular economy platform (CircleFlow) development',
              'Currently: Taiwan-Japan semiconductor industry cooperation',
            ],
            expertise: [
              'AI Systems & Agentic Workflows',
              'Circular Economy & Urban Mining',
              'Taiwan-Japan Cross-border Industry Integration',
              'Semiconductor Supply Chain',
              'Startup Ecosystem & Venture Building',
              'Theological & Ethical Reasoning',
              'Multi-Agent AI Collaboration',
              'Digital Transformation Strategy',
              'ESG & Sustainability Consulting',
            ],
            languages: ['Chinese (Native)', 'English (Professional)', 'Japanese (Conversational)'],
            socialProfiles: {
              linkedin: 'https://www.linkedin.com/in/paulkuo/',
              medium: 'https://medium.com/@paulkuo',
              threads: 'https://www.threads.net/@zarqarwi',
              x: 'https://x.com/paulkuo',
            },
          }, null, 2)
        }]
      };
    }
  });

  // ============================================================
  // Tool 2: get_expertise_areas
  // "What does Paul specialize in?" — five content pillars
  // ============================================================
  navigator.modelContext.registerTool({
    name: 'get_expertise_areas',
    description: 'Get Paul Kuo\'s five expertise pillars with detailed descriptions, relevant experience, and example topics. Useful for understanding his cross-disciplinary capabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        pillar: {
          type: 'string',
          description: 'Optional: filter to a specific pillar. Options: ai, circular, faith, startup, life',
          enum: ['ai', 'circular', 'faith', 'startup', 'life'],
        },
      },
    },
    annotations: {
      readOnlyHint: true,
    },
    async execute(args) {
      const pillars = {
        ai: {
          name: '智能與秩序 — AI & Order',
          color: '#2563EB',
          description: 'AI systems architecture, multi-agent collaboration, agentic workflows, and the philosophical implications of intelligence augmentation.',
          experience: 'Building AI-driven platforms (CircleFlow), multi-model debate engines, automated content pipelines, and browser-based AI agent tools. Exploring how AI can serve human agency rather than replace it.',
          topics: ['Agentic AI', 'Multi-Agent Collaboration', 'AI Ethics', 'LLM Orchestration', 'WebMCP', 'MCP Protocol', 'AI-Human Collaboration'],
        },
        circular: {
          name: '循環再利用 — Circular Economy',
          color: '#059669',
          description: 'Resource regeneration, urban mining, PCB metal recovery, and building sustainable industrial systems.',
          experience: 'Over a decade in PCB manufacturing metal recovery. Developing CircleFlow, an AI-driven circular economy data platform. Deep expertise in precious metal extraction from electronic waste.',
          topics: ['Urban Mining', 'PCB Metal Recovery', 'ESG Strategy', 'Carbon Fee', 'CBAM', 'Waste-to-Resource', 'Industrial Ecology'],
        },
        faith: {
          name: '文明與人性 — Civilization & Human Nature',
          color: '#B45309',
          description: 'Theological reflection, ethics, civilization patterns, and preserving human dignity in the age of AI.',
          experience: '15 years of theological training. Explores how ancient wisdom traditions inform modern technology ethics, organizational leadership, and the meaning of human work in an age of automation.',
          topics: ['Theology & Technology', 'Ethics of AI', 'Human Dignity', 'Incarnational Thinking', 'Civilizational Patterns'],
        },
        startup: {
          name: '創造與建構 — Creation & Enterprise',
          color: '#DC2626',
          description: 'Entrepreneurship, venture building, cross-border business development, and turning ideas into operational systems.',
          experience: 'AppWorks accelerator alumnus, VP at 半畝塘 (sustainable architecture), founded 厚生市集 (local food systems). Currently leading Taiwan-Japan semiconductor cooperation at SDTI.',
          topics: ['Startup Strategy', 'Taiwan-Japan Business', 'Semiconductor Industry', 'Cross-border Commerce', 'Business Model Design'],
        },
        life: {
          name: '沉思與記憶 — Reflections & Memory',
          color: '#7C3AED',
          description: 'Personal reflections, life lessons, creative writing, and the intersection of memory, identity, and technology.',
          experience: 'Documenting the journey of a "super individual" — one person leveraging AI tools to accomplish team-scale work across multiple domains. Exploring what it means to build a meaningful life in an era of radical technological change.',
          topics: ['Personal Branding', 'Life Design', 'AI-Augmented Work', 'Creative Writing', 'Digital Identity'],
        },
      };

      const result = args.pillar
        ? { [args.pillar]: pillars[args.pillar] }
        : pillars;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  });

  // ============================================================
  // Tool 3: search_articles
  // "What has Paul written about semiconductors?" — article search
  // ============================================================
  navigator.modelContext.registerTool({
    name: 'search_articles',
    description: 'Search Paul Kuo\'s published articles by keyword, topic, or content pillar. Returns matching articles with titles, descriptions, dates, and URLs. Paul writes about AI, circular economy, semiconductors, theology, startups, and cross-disciplinary topics.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword or topic (e.g., "semiconductor", "AI agent", "循環經濟")',
        },
        pillar: {
          type: 'string',
          description: 'Optional: filter by content pillar',
          enum: ['ai', 'circular', 'faith', 'startup', 'life'],
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
        },
      },
      required: ['query'],
    },
    annotations: {
      readOnlyHint: true,
    },
    async execute(args) {
      // Lazy-load article index
      if (!articleIndex) {
        try {
          const res = await fetch(SITE_URL + '/api/articles.json');
          articleIndex = await res.json();
        } catch (e) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({ error: 'Failed to load article index', message: e.message })
            }]
          };
        }
      }

      const query = (args.query || '').toLowerCase();
      const pillar = args.pillar || null;
      const limit = args.limit || 10;

      let results = articleIndex.filter(function (a) {
        // Pillar filter
        if (pillar && a.pillar !== pillar) return false;

        // Keyword match across title, description, abstract, tags
        const searchable = [
          a.title,
          a.description,
          a.abstract,
          ...(a.tags || []),
          a.pillarLabel,
        ].join(' ').toLowerCase();

        return searchable.includes(query);
      });

      results = results.slice(0, limit).map(function (a) {
        return {
          title: a.title,
          description: a.description,
          pillar: a.pillarLabel,
          date: a.date,
          tags: a.tags,
          url: SITE_URL + a.url,
          readingTime: a.readingTime ? a.readingTime + ' min' : undefined,
        };
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query: args.query,
            pillar: pillar,
            totalResults: results.length,
            articles: results,
          }, null, 2)
        }]
      };
    }
  });

  // ============================================================
  // Tool 4: get_project_portfolio
  // "What projects has Paul worked on?" — career & project history
  // ============================================================
  navigator.modelContext.registerTool({
    name: 'get_project_portfolio',
    description: 'Get Paul Kuo\'s project portfolio and career highlights, including current and past ventures, technologies built, and roles held.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
    },
    async execute() {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            current: [
              {
                name: 'SDTI 佳龍科技',
                role: 'Commercial Integration & AI Digital Development Director',
                period: 'Current',
                description: 'Leading Taiwan-Japan semiconductor cooperation, circular economy initiatives, and AI systems development for cross-border industrial integration.',
                technologies: ['AI/ML', 'Cross-border Commerce', 'Semiconductor Supply Chain'],
              },
              {
                name: 'CircleFlow',
                role: 'Founder & Developer',
                period: 'Current',
                description: 'AI-driven circular economy data platform. Tracks resource flows, optimizes recovery processes, and provides ESG reporting for manufacturers.',
                technologies: ['Python', 'AI/ML', 'Data Pipeline', 'ESG Analytics'],
              },
              {
                name: 'paulkuo.tw',
                role: 'Personal Knowledge Hub',
                period: 'Current',
                description: 'Multilingual (zh-TW/zh-CN/en/ja) personal website built with Astro, featuring automated content pipelines, WebMCP integration, and comprehensive AIO (AI Optimization) for AI agent discoverability.',
                technologies: ['Astro', 'TypeScript', 'Cloudflare Pages', 'GitHub Actions', 'WebMCP', 'JSON-LD'],
              },
            ],
            past: [
              {
                name: 'AppWorks',
                role: 'Accelerator Alumnus',
                description: 'Southeast Asia\'s largest startup accelerator. Developed venture building skills and startup ecosystem expertise.',
              },
              {
                name: '半畝塘',
                role: 'Vice President',
                description: 'Sustainable architecture and community development. Led business operations for an innovative green building company.',
              },
              {
                name: '厚生市集',
                role: 'Founder',
                description: 'Local food systems platform connecting farmers with consumers. Built agricultural supply chain infrastructure.',
              },
            ],
            technicalCapabilities: [
              'Full-stack web development (Astro, React, TypeScript)',
              'AI agent systems & multi-model orchestration',
              'CI/CD pipeline design (GitHub Actions, Cloudflare)',
              'Automation & API integration (OneUp, Fitbit, Google APIs)',
              'Data visualization & analysis',
              'Cross-platform content management',
              'WebMCP & Agentic SEO implementation',
            ],
          }, null, 2)
        }]
      };
    }
  });

  // ============================================================
  // Tool 5: contact_paul
  // "Help me reach out to Paul about a collaboration"
  // ============================================================
  navigator.modelContext.registerTool({
    name: 'contact_paul',
    description: 'Send a message or inquiry to Paul Kuo. Use this for consulting requests, speaking invitations, collaboration proposals, Taiwan-Japan business inquiries, or general questions. The message will be delivered via email.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Your name',
        },
        email: {
          type: 'string',
          description: 'Your email address for Paul to reply to',
        },
        topic: {
          type: 'string',
          description: 'Topic of inquiry',
          enum: ['consulting', 'speaking', 'collaboration', 'taiwan-japan-business', 'circular-economy', 'ai-development', 'general'],
        },
        message: {
          type: 'string',
          description: 'Your message to Paul',
        },
      },
      required: ['name', 'email', 'message'],
    },
    annotations: {
      idempotentHint: false,
    },
    async execute(args) {
      // Compose mailto link and open it
      const subject = encodeURIComponent(
        '[paulkuo.tw] ' + (args.topic || 'General') + ' inquiry from ' + args.name
      );
      const body = encodeURIComponent(
        'From: ' + args.name + ' <' + args.email + '>\n' +
        'Topic: ' + (args.topic || 'General') + '\n\n' +
        args.message
      );
      const mailto = 'mailto:paul@lasaas.com?subject=' + subject + '&body=' + body;

      // Try to open mailto
      window.open(mailto, '_blank');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'email_client_opened',
            message: 'An email draft has been prepared to paul@lasaas.com. The user\'s mail client should open with the pre-filled message.',
            recipient: 'paul@lasaas.com',
            subject: '[paulkuo.tw] ' + (args.topic || 'General') + ' inquiry from ' + args.name,
          }, null, 2)
        }]
      };
    }
  });

  console.log('[WebMCP] 5 tools registered: get_paul_profile, get_expertise_areas, search_articles, get_project_portfolio, contact_paul');
})();
