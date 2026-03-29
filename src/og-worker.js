/**
 * paulkuo-tw asset Worker with Facebook crawler OG interception.
 * Intercepts requests from Facebook's crawler to serve personalized og:image
 * for Formosa ESG 2026 tracker share links (?u=userId).
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ua = request.headers.get('user-agent') || '';

    // Only intercept Facebook crawler on tracker page with ?u= param
    if (
      /facebookexternalhit|facebot/i.test(ua) &&
      url.pathname === '/projects/formosa-esg-2026/tracker/' &&
      url.searchParams.has('u')
    ) {
      const userId = url.searchParams.get('u');
      const ogImageUrl = `https://paulkuo-ticker.paul-4bf.workers.dev/api/formosa/og/${encodeURIComponent(userId)}.png`;
      const defaultOg = 'https://paulkuo.tw/images/formosa-esg-2026-og.png';
      const trackerUrl = 'https://paulkuo.tw/projects/formosa-esg-2026/tracker/';

      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>2026 白沙屯媽祖 ESG 進香 — 活動紀錄</title>
<meta property="og:title" content="2026 白沙屯媽祖 ESG 進香 — 我的進香足跡" />
<meta property="og:description" content="一起來記錄進香足跡、累積善行碳足跡！" />
<meta property="og:image" content="${ogImageUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${trackerUrl}" />
<meta property="og:type" content="website" />
<meta http-equiv="refresh" content="0;url=${trackerUrl}">
</head>
<body><p>Redirecting...</p></body>
</html>`;

      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }

    // All other requests: serve static assets
    return env.ASSETS.fetch(request);
  },
};
