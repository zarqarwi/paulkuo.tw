/**
 * Cloudflare Pages Function — Personalized OG tags for /my/?u={userId}
 * Intercepts crawler requests and injects user-specific OG meta tags
 * so LINE/FB/Twitter previews show the user's personal achievement card.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('u');

  // No user param → serve static page as-is
  if (!userId) return context.next();

  const ua = (context.request.headers.get('user-agent') || '').toLowerCase();
  const isCrawler = /facebookexternalhit|line|twitterbot|slackbot|linkedinbot|discordbot|telegrambot|whatsapp|kakaotalk|pinterest|googlebot/i.test(ua);

  // Normal users get the static page (client JS reads ?u= and fetches data)
  if (!isCrawler) return context.next();

  // For crawlers: fetch user data and inject personalized OG tags
  try {
    const apiBase = 'https://paulkuo-ticker.paul-4bf.workers.dev';
    const apiResp = await fetch(`${apiBase}/api/formosa/user/${encodeURIComponent(userId)}`);
    const data = await apiResp.json();

    const ogImageUrl = `${apiBase}/api/formosa/og/${encodeURIComponent(userId)}.png`;
    const pageUrl = `https://paulkuo.tw/projects/formosa-esg-2026/my/?u=${encodeURIComponent(userId)}`;

    const rankName = data.stats?.rank?.name || '進香香客';
    const rankIcon = data.stats?.rank?.icon || '🙏';
    const totalKm = data.stats?.total_km || 0;
    const checkins = data.stats?.checkins || 0;
    const carbonKg = data.stats?.carbon_kg || 0;

    const title = `${rankIcon} ${rankName} — 白沙屯媽祖 ESG 進香 2026`;
    const description = `已走 ${totalKm.toFixed(1)} 公里，打卡 ${checkins} 次，碳足跡 ${carbonKg.toFixed(1)} kg CO₂e`;

    // Fetch original page and rewrite OG tags
    const originalResp = await context.next();
    let html = await originalResp.text();

    // Replace OG tags
    html = html.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${ogImageUrl}"`);
    html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`);
    html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`);
    html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${pageUrl}"`);

    // Replace Twitter card tags
    html = html.replace(/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${ogImageUrl}"`);
    html = html.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`);
    html = html.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`);

    // Replace page title
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      }
    });
  } catch (e) {
    // On error, fall back to static page
    return context.next();
  }
}
