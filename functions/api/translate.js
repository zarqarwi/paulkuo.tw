// Cloudflare Pages Function: DeepL Translation Proxy
// Route: /api/translate
// Purpose: Proxy translation requests to DeepL API, keeping API key server-side

const LANG_MAP = {
  'zh-CN': 'ZH-HANS',
  'en': 'EN',
  'ja': 'JA'
};

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://paulkuo.tw',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, target_lang } = await request.json();

    // Validate
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(JSON.stringify({ error: 'texts array required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!target_lang || !LANG_MAP[target_lang]) {
      return new Response(JSON.stringify({ error: 'Invalid target_lang. Use: zh-CN, en, ja' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Rate limit: max 10 texts per request
    if (texts.length > 10) {
      return new Response(JSON.stringify({ error: 'Max 10 texts per request' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const apiKey = env.DEEPL_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Translation service not configured' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    // Call DeepL API
    const deepLResponse = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: texts,
        source_lang: 'ZH',
        target_lang: LANG_MAP[target_lang],
        preserve_formatting: true
      })
    });

    if (!deepLResponse.ok) {
      const errText = await deepLResponse.text();
      console.error('DeepL API error:', deepLResponse.status, errText);
      return new Response(JSON.stringify({ error: 'Translation service error' }), {
        status: 502,
        headers: corsHeaders
      });
    }

    const result = await deepLResponse.json();
    const translations = result.translations.map(t => t.text);

    return new Response(JSON.stringify({ translations }), {
      headers: corsHeaders
    });

  } catch (err) {
    console.error('Translate function error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Handle OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://paulkuo.tw',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
