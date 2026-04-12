/**
 * Cloudflare Pages Function — Personalized OG tags for /tracker/?u={userId}
 * Intercepts Facebook/social crawler requests and serves personalized og:image
 * so share previews show the user's personal achievement card.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('u');

  // No user param → serve static page as-is
  if (!userId) return context.next();

  const ua = (context.request.headers.get('user-agent') || '').toLowerCase();
  const isCrawler = /facebookexternalhit|facebot|twitterbot|slackbot|linkedinbot|discordbot|telegrambot|whatsapp|kakaotalk|pinterest|googlebot/i.test(ua);

  // Normal users get the static page (client JS reads ?u= and fetches data)
  if (!isCrawler) return context.next();

  // For crawlers: serve a minimal HTML with personalized OG tags
  const apiBase = 'https://api.paulkuo.tw';
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
    // On API error, still serve OG with generic fallback image
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
