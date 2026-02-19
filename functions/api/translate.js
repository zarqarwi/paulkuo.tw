// Cloudflare Pages Function: DeepL API Proxy
// Route: /api/translate
// Keeps API key server-side, never exposed to client

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://paulkuo.tw',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { texts, target_lang } = body;

    // Validation
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ error: 'texts array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!target_lang || !['zh-CN', 'en', 'ja'].includes(target_lang)) {
      return new Response(JSON.stringify({ error: 'Invalid target_lang' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit: max 10 texts per request
    if (texts.length > 10) {
      return new Response(JSON.stringify({ error: 'Max 10 texts per request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map to DeepL language codes
    const langMap = { 'zh-CN': 'ZH-HANS', 'en': 'EN', 'ja': 'JA' };
    const deeplTarget = langMap[target_lang];

    // Call DeepL API
    const apiKey = env.DEEPL_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams();
    texts.forEach(t => params.append('text', t));
    params.append('target_lang', deeplTarget);
    params.append('source_lang', 'ZH');
    params.append('tag_handling', 'html');

    const deeplRes = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!deeplRes.ok) {
      const errText = await deeplRes.text();
      return new Response(JSON.stringify({ error: `DeepL API error: ${deeplRes.status}`, details: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const deeplData = await deeplRes.json();
    const translations = deeplData.translations.map(t => t.text);

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://paulkuo.tw',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
