/**
 * paulkuo-tw asset Worker with social crawler OG interception.
 * Intercepts requests from social crawlers to serve personalized og:image
 * for Formosa ESG 2026 tracker share links (?u=userId).
 *
 * NOTE: paulkuo.tw is currently deployed via Cloudflare Pages (GitHub auto-deploy),
 * so the Pages Function in functions/ handles this instead. This worker is kept
 * in sync as a fallback for wrangler deploy mode.
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ua = request.headers.get('user-agent') || '';

    // Only intercept social crawlers on tracker page with ?u= param
    if (
      /facebookexternalhit|facebot|line|twitterbot|slackbot|linkedinbot|discordbot|telegrambot|whatsapp|kakaotalk|pinterest|googlebot/i.test(ua) &&
      url.pathname === '/projects/formosa-esg-2026/tracker/' &&
      url.searchParams.has('u')
    ) {
      const userId = url.searchParams.get('u');
      const apiBase = 'https://paulkuo-ticker.paul-4bf.workers.dev';
      const ogImageUrl = `${apiBase}/api/formosa/og/${encodeURIComponent(userId)}.png`;
      const trackerUrl = `https://paulkuo.tw/projects/formosa-esg-2026/tracker/?u=${encodeURIComponent(userId)}`;
      const defaultOgImage = 'https://paulkuo.tw/images/formosa-esg-2026-og.png';

      try {
        const apiResp = await fetch(`${apiBase}/api/formosa/user/${encodeURIComponent(userId)}`);
        const data = await apiResp.json();

        const rankName = data.stats?.rank?.name || '進香香客';
        const rankIcon = data.stats?.rank?.icon || '🙏';
        const totalKm = data.stats?.total_km || 0;
        const checkins = data.stats?.checkins || 0;
        const carbonKg = data.stats?.carbon_kg || 0;

        const title = `${rankIcon} ${rankName} — 白沙屯媽祖 ESG 進香 2026`;
        const description = `已走 ${totalKm.toFixed(1)} 公里，打卡 ${checkins} 次，碳足跡 ${carbonKg.toFixed(1)} kg CO₂e`;

        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${ogImageUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${trackerUrl}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${ogImageUrl}" />
</head>
<body><p>2026 白沙屯媽祖 ESG 進香</p></body>
</html>`;

        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=300',
          },
        });
      } catch (e) {
        const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>2026 白沙屯媽祖 ESG 進香 — 我的進香足跡</title>
<meta property="og:title" content="2026 白沙屯媽祖 ESG 進香 — 我的進香足跡" />
<meta property="og:description" content="一起來記錄進香足跡、累積善行碳足跡！" />
<meta property="og:image" content="${defaultOgImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${trackerUrl}" />
<meta property="og:type" content="website" />
</head>
<body><p>2026 白沙屯媽祖 ESG 進香</p></body>
</html>`;

        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            'Cache-Control': 'public, max-age=60',
          },
        });
      }
    }

    // All other requests: serve static assets
    return env.ASSETS.fetch(request);
  },
};
