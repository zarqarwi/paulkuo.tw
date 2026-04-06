import { corsHeaders, jsonResponse, checkRateLimit } from './utils.js';

/**
 * Search through wiki concepts by keyword matching
 * GET /api/wiki/search?q=...
 */
export async function handleWikiSearch(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    // Get index from KV
    const indexData = await env.TICKER_KV.get('wiki:index');
    if (!indexData) {
      return jsonResponse(
        { results: [], total: 0, message: 'Wiki index not available' },
        200,
        request
      );
    }

    const index = JSON.parse(indexData);
    let results = [...index.concepts];

    // If no query, return all sorted by source_count
    if (!query || query.trim() === '') {
      results.sort((a, b) => (b.source_count || 0) - (a.source_count || 0));
      results = results.slice(0, 20);
      return jsonResponse(
        { results, total: results.length },
        200,
        request
      );
    }

    // Search with scoring
    const queryLower = query.toLowerCase();
    const scoredResults = results
      .map(concept => {
        let score = 0;

        // Title match (+10)
        if (concept.title.toLowerCase().includes(queryLower)) {
          score += 10;
        }

        // Tag match (+5)
        if (concept.tags && Array.isArray(concept.tags)) {
          if (concept.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
            score += 5;
          }
        }

        // Excerpt match (+1)
        if (concept.excerpt && concept.excerpt.toLowerCase().includes(queryLower)) {
          score += 1;
        }

        return { ...concept, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ score, ...rest }) => rest);

    return jsonResponse(
      { results: scoredResults, total: scoredResults.length },
      200,
      request
    );
  } catch (error) {
    console.error('[wiki-search] error:', error);
    return jsonResponse(
      { error: 'Search failed', details: error.message },
      500,
      request
    );
  }
}

/**
 * Get full concept data by slug
 * GET /api/wiki/concept/:slug
 */
export async function handleWikiConcept(request, env, slug) {
  try {
    const conceptKey = `wiki:concept:${slug}`;
    const conceptData = await env.TICKER_KV.get(conceptKey);

    if (!conceptData) {
      return jsonResponse(
        { error: 'Concept not found' },
        404,
        request
      );
    }

    const concept = JSON.parse(conceptData);
    const response = jsonResponse(concept, 200, request);
    response.headers.set('Cache-Control', 'public, max-age=3600');
    return response;
  } catch (error) {
    console.error('[wiki-concept] error:', error);
    return jsonResponse(
      { error: 'Failed to fetch concept', details: error.message },
      500,
      request
    );
  }
}

/**
 * Get wiki graph (nodes + edges)
 * GET /api/wiki/graph
 */
export async function handleWikiGraph(request, env) {
  try {
    const graphData = await env.TICKER_KV.get('wiki:graph');

    if (!graphData) {
      return jsonResponse(
        { error: 'Wiki graph not available' },
        503,
        request
      );
    }

    const graph = JSON.parse(graphData);
    const response = jsonResponse(graph, 200, request);
    response.headers.set('Cache-Control', 'public, max-age=3600');
    return response;
  } catch (error) {
    console.error('[wiki-graph] error:', error);
    return jsonResponse(
      { error: 'Failed to fetch graph', details: error.message },
      500,
      request
    );
  }
}

/**
 * Ask question to wiki assistant (rate limited)
 * POST /api/wiki/ask
 * Body: { "question": "..." }
 */
export async function handleWikiAsk(request, env) {
  try {
    // Rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(ip, 5)) {
      return jsonResponse(
        { error: 'Rate limit exceeded (5 per minute)' },
        429,
        request
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { error: 'Invalid JSON body' },
        400,
        request
      );
    }

    const { question } = body;

    // Validate question
    if (!question || typeof question !== 'string') {
      return jsonResponse(
        { error: 'Question is required' },
        400,
        request
      );
    }

    if (question.length >= 500) {
      return jsonResponse(
        { error: 'Question too long (max 500 chars)' },
        400,
        request
      );
    }

    // Get wiki index
    const indexData = await env.TICKER_KV.get('wiki:index');
    if (!indexData) {
      return jsonResponse(
        { error: 'Wiki index not available' },
        503,
        request
      );
    }

    const index = JSON.parse(indexData);

    // Find top 3-5 related concepts
    const queryLower = question.toLowerCase();
    const relatedConcepts = index.concepts
      .map(concept => {
        let score = 0;
        if (concept.title.toLowerCase().includes(queryLower)) score += 10;
        if (concept.tags?.some(tag => tag.toLowerCase().includes(queryLower))) score += 5;
        if (concept.excerpt?.toLowerCase().includes(queryLower)) score += 1;
        return { ...concept, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Fetch full concept content for context
    const contextParts = [];
    const sources = [];

    for (const concept of relatedConcepts) {
      try {
        const conceptKey = `wiki:concept:${concept.slug}`;
        const conceptData = await env.TICKER_KV.get(conceptKey);
        if (conceptData) {
          const fullConcept = JSON.parse(conceptData);
          sources.push({ slug: concept.slug, title: concept.title });

          // Extract summary and core insights
          const body_text = fullConcept.body || '';
          const excerpt = concept.excerpt || '';
          contextParts.push(`【${concept.title}】\n${excerpt}\n${body_text.substring(0, 500)}`);
        }
      } catch (err) {
        console.error(`Failed to fetch concept ${concept.slug}:`, err);
      }
    }

    const context = contextParts.join('\n\n');

    const systemPrompt = `你是 Paul Kuo 的個人知識庫助手。根據以下知識回答問題，引用概念時用 [[slug]] 格式。如果知識庫沒有相關內容，誠實告知。回答使用繁體中文。`;

    const userMessage = `知識庫內容：\n${context}\n\n問題：${question}`;

    let answer = '';

    // Try Workers AI first
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages
      });

      answer = aiResponse.response || '';
    } catch (aiError) {
      console.error('[wiki-ask] Workers AI failed:', aiError);

      // Fallback to Anthropic API
      try {
        if (!env.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured');
        }

        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userMessage }
            ]
          })
        });

        if (!anthropicResponse.ok) {
          throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
        }

        const anthropicData = await anthropicResponse.json();
        answer = anthropicData.content?.[0]?.text || '';
      } catch (fallbackError) {
        console.error('[wiki-ask] Anthropic fallback failed:', fallbackError);
        return jsonResponse(
          { error: 'Failed to generate answer', details: fallbackError.message },
          503,
          request
        );
      }
    }

    // Extract [[slug]] references from answer
    const slugRegex = /\[\[([^\]]+)\]\]/g;
    const relatedConceptsFromAnswer = [];
    const seenSlugs = new Set();

    let match;
    while ((match = slugRegex.exec(answer)) !== null) {
      const slug = match[1];
      if (!seenSlugs.has(slug)) {
        seenSlugs.add(slug);
        const concept = index.concepts.find(c => c.slug === slug);
        if (concept) {
          relatedConceptsFromAnswer.push({ slug, title: concept.title });
        }
      }
    }

    return jsonResponse(
      {
        answer,
        related_concepts: relatedConceptsFromAnswer,
        sources
      },
      200,
      request
    );
  } catch (error) {
    console.error('[wiki-ask] error:', error);
    return jsonResponse(
      { error: 'Ask failed', details: error.message },
      500,
      request
    );
  }
}
