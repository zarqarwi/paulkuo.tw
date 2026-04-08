/**
 * Cloudflare Pages Function — ACP Portfolio share page
 * Routes /portfolio/{8-char-id} to the SPA view page.
 * Social crawlers get OG-enriched HTML for rich share previews.
 */
export async function onRequest(context) {
  const { params } = context;
  const id = params.id;

  // Only handle 8-char alphanumeric IDs (skip "view" and other paths)
  if (!/^[a-z0-9]{8}$/.test(id)) return context.next();

  const ua = (context.request.headers.get('user-agent') || '').toLowerCase();
  const isCrawler = /facebookexternalhit|facebot|line|twitterbot|slackbot|linkedinbot|discordbot|telegrambot|whatsapp|kakaotalk|pinterest|googlebot/i.test(ua);

  if (isCrawler) {
    try {
      const apiResp = await fetch(`https://api.paulkuo.tw/api/acp/${id}`);
      if (apiResp.ok) {
        const data = await apiResp.json();
        const ogImage = `https://api.paulkuo.tw/api/acp/${id}/og`;
        const portfolioUrl = `https://paulkuo.tw/portfolio/${id}`;
        const title = `${data.grade} — AI Collaboration Portfolio (${data.total_score}/100)`;
        const desc = data.github_username
          ? `${data.grade} level AI collaborator (${data.total_score}/100). GitHub: ${data.github_username}`
          : `${data.grade} level AI collaborator scoring ${data.total_score}/100 across 5 dimensions.`;

        return new Response(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"><title>${title}</title>
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${portfolioUrl}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${ogImage}" />
</head><body><p>AI Collaboration Portfolio</p></body></html>`, {
          status: 200,
          headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=300' },
        });
      }
    } catch {}
  }

  // Non-crawler: serve the SPA view page
  // Use direct fetch (not ASSETS) since Pages ASSETS.fetch doesn't rewrite paths correctly
  const spaUrl = new URL(context.request.url);
  spaUrl.pathname = '/portfolio/view/';
  spaUrl.search = '';
  return fetch(spaUrl.toString());
}
