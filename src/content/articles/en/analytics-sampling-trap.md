---
title: "Your website shows zero visitors, but the dashboard says 130"
subtitle: "The sampling trap in Cloudflare Analytics, and how to actually count your visitors"
description: "Starting from discovering Cloudflare Web Analytics API returning visits=0, a complete record of the investigation process, the differences between two analytics systems, adaptive sampling, and the architectural decision to build a self-hosted beacon."
abstract: |
  My personal website paulkuo.tw dashboard showed zero visitors. But Cloudflare Dashboard clearly showed 130 people had visited. After investigating, I found it was not a bug — it was Cloudflare GraphQL API adaptive sampling compressing 130 down to 0 on a low-traffic site. The previous days looked normal, so where was the problem? I want to share the investigation process, the wrong turns, and why I ultimately decided to count heads myself. If you are running a personal or company website, it might be worth checking whether your traffic data needs verification too.
date: 2026-03-23
updated: 2026-03-23
pillar: ai
tags:
  - Cloudflare Analytics
  - website traffic analysis
  - adaptive sampling
  - personal brand website
  - super individual
cover: "/images/covers/analytics-sampling-trap.jpg"
featured: true
draft: false
readingTime: 8
# === AI / Machine fields ===
thesis: "It is not only high-traffic sites that need to care about traffic data. Many B2B sites do not rely on massive visitor counts, and many personal sites do not survive by chasing trends; but as long as you are building a brand, content, or conversion paths, you need a reliable analytics foundation. Cloudflare GraphQL Analytics API can produce severe sampling distortions on sites with fewer than 500 daily visitors; for brand websites, without a self-hosted visit beacon, it is difficult to obtain truly usable traffic data."
domain_bridge: "Web engineering × data quality × personal brand management"
confidence: high
content_type: case-study
related_entities:
  - name: Cloudflare Web Analytics
    type: Organization
  - name: Plausible Analytics
    type: Organization
  - name: Umami
    type: Organization
  - name: Imperva
    type: Organization
reading_context: |
  For technical staff, marketers, and independent developers running personal or company websites. No deep Cloudflare knowledge required, but understanding why accurate traffic data matters is essential.
---

At 11:30 PM, I opened the homepage of paulkuo.tw and glanced at the traffic analytics section.

Visitors: 0.

That could not be right. People had been reading my articles that day, and the translation tool had active users. Yesterday the data showed hundreds of visitors — it could not just drop to zero. I opened the Cloudflare Dashboard — Page views 193, Visits 130.

Zero and 130 are not a rounding error. They are two completely different worlds. Was it "nobody came" or "over a hundred people visited"? Which one was correct — or were they both wrong?

## Cloudflare has two worlds

If your website sits behind Cloudflare (over 41 million websites globally do), you may not realize that Cloudflare actually has two completely different analytics systems.

**The first: Zone Analytics (HTTP Traffic).** This is CDN-layer data. Every HTTP request passing through Cloudflare is recorded. It tells you total requests, bandwidth, country distribution, and unique visitors (deduplicated by IP). It is precise and counts everything — including Google crawlers, ChatGPT crawlers, and various monitoring bots.

**The second: Web Analytics (RUM beacon).** This is browser-layer data. Cloudflare injects a JS beacon into your pages that only fires when a real human loads the page in a browser. Bots do not execute JavaScript, so it naturally filters out non-human traffic.

When designing the traffic analytics architecture, after one iteration, I chose the Web Analytics GraphQL API as the primary data source. The reasoning sounded solid — it only counts real humans, so it is more accurate. I initially used the Zone Analytics path, but it included bots and the numbers were inflated. The website had barely been set up and it was already showing over a thousand visits per day.

The logic was fine. But I made one mistake: I verified what data fields this API could give me, but never verified whether the numbers Web Analytics (RUM beacon) returned were actually accurate.

## Adaptive sampling: how 130 becomes 0

After investigating, I found the root cause. Cloudflare Web Analytics GraphQL API uses a technique called Adaptive Bit Rate (ABR) sampling.

The principle is straightforward: Cloudflare processes over 700 million events per second. If every query had to scan all raw data, the system costs would be enormous. So it stores data at multiple resolutions — 100%, 10%, 1%. When queried, the system automatically selects a resolution based on data volume and complexity.

For high-traffic websites, this works perfectly. If you have 100,000 daily visitors, a 10% sample is still 10,000 data points — statistically very accurate.

But for low-traffic websites? My paulkuo.tw has about 130 real human visitors per day. After API sampling, the returned visits are all multiples of 100 — 0, 100, 200. The number 130 gets rounded down to 0.

I reviewed the past 30 days of API data and found several days where visits = 0, with all values being multiples of 100. This was not something that broke today — this was the logic from day one. I just happened to be the first time I compared the API data against the Dashboard.

After checking Cloudflare documentation, they acknowledge that there is currently no way for users to verify how accurate query results actually are. In other words, you receive a number, but nobody can tell you what the margin of error is.

## There is an even bigger number

Once I understood the Web Analytics sampling problem, I turned to look at Zone Analytics — Unique Visitors showed 1,100.

Web Analytics Dashboard said 130. Zone Analytics said 1,100. The API said 0.

Three numbers, same day, same website.

The gap between 1,100 and 130 — those nearly one thousand extra visitors — were bots. My website was designed to be AI-friendly from the start, with llms.txt, JSON-LD, and MCP support, all built for AI systems. So GPTBot, ClaudeBot, Bingbot and other crawlers diligently fetch content. Zone Analytics faithfully records every IP, regardless of whether it belongs to a human or a machine.

According to Imperva 2025 report, automated traffic surpassed human activity for the first time in 2024, accounting for 51% of global internet traffic. Malicious bots accounted for 37%. Cloudflare 2025 Year in Review also showed that AI bot requests for HTML pages accounted for 4.2%, with Googlebot alone accounting for 4.5%.

So, 88% of my website unique IPs are bots and 12% are real humans. It sounds extreme, but it is statistically perfectly reasonable. Since January this year, there has been a clear sense that "Make something Agent Want" has become consensus in the tech community. This made me re-examine the obsession with only tracking human visits.

## Three wrong turns I took

Before arriving at the current solution, I made three mistakes.

**First mistake: no technical reconnaissance during planning.** Before choosing Web Analytics RUM as the primary data source, I did not investigate adaptive sampling behavioral limitations, and did not cross-reference API return values against the Dashboard. If I had spent five minutes doing this, the entire problem would have been discovered during the planning phase.

**Second mistake: rushing to fix after discovering the problem.** I instinctively judged that the Zone-level API sampling granularity should be better, still clinging to the human-centric obsession, and pushed a fix to GitHub. Only after pushing did I discover on the Cloudflare community that others reported the zone-level API also had the same visits=0 problem. So I reverted. The back-and-forth wasted time and polluted git history.

**Third mistake: equating "no bots" with "accurate".** Web Analytics indeed only counts humans, but "no bots" does not mean "correct numbers". Sampling precision and bot filtering are two completely independent things. I conflated them.

My engineering principle with AI Agent is to investigate before acting, but AI can overlook things (strange — it was already written in the skill), and so can I. When you discover a problem, the temptation to rush into fixing it and skip the homework is especially strong.

## Seeing the complete audience profile

Initially I treated bot traffic as noise to be eliminated. But paulkuo.tw has an [AI-Ready architecture](/articles/ai-ready-continuous-optimization) — llms.txt helps AI systems understand the site structure, JSON-LD provides structured knowledge, and MCP protocol enables AI agents to interact directly. So letting AI bots read the content is not noise — it is also part of influence.

So the right question shifted from "how to exclude bots" to "how to see the complete reading audience".

I needed two independent metrics:

- **Human visitors**: how many human readers viewed my articles and tools — this is the old-world core metric for measuring community influence
- **AI/Bot visitors**: how many AI systems are reading my content — this is the effectiveness metric for the AI-Ready strategy

The final architecture is not complicated. Human visitors use a self-hosted visit beacon — when a page loads, it sends a POST to my Cloudflare Worker, which uses an anonymized IP + User-Agent hash for daily deduplication. Total site visitors continue using Zone Analytics precise IP deduplication. Subtract one from the other and you get the AI/Bot volume.
![paulkuo.tw analytics architecture: self-hosted beacon (human) + Zone Analytics (total) → subtract for AI/Bot](/images/articles/analytics-sampling-trap-architecture.svg)


All three numbers are self-computed, not relying on Cloudflare estimates. The approach is the same principle used by Google Analytics, Plausible, Umami, and similar website traffic analysis tools. Embed a tracking snippet in the page, count every head yourself. The only difference is I do not need to install a third-party tool — it runs directly on the existing server infrastructure.

## Your data might be misleading you

In 2025, automated traffic surpassed human activity for the first time, accounting for 51% of global internet traffic. AI crawler volume grew over 15x in the same year. Your website is not only read by humans — it is also read by machines.

If your website uses Cloudflare Web Analytics free plan and has fewer than a few hundred daily visitors, the visits number on your dashboard is likely, just like mine, a sampled estimate rather than a precise value.

This does not mean Cloudflare is bad. Its CDN, DNS, and security protection are industry-leading. The Web Analytics Dashboard UI numbers are accurate. But if you are pulling data via API to your own dashboard, in low-traffic scenarios, you need to verify it yourself. Comparing API numbers against the Dashboard takes five minutes.

When the data gap is too large, website operators may need to return to a more direct method and build their own precise visit counting mechanism. This is not because Cloudflare is untrustworthy, but because sampling is inherently prone to inaccuracy when traffic volume is still small. As the audience grows, sampling precision naturally improves; but it is precisely during the growth phase that precise numbers are most indispensable, because that is the critical moment for determining direction and adjusting strategy.

Running a website cannot rely on gut feeling alone — data is like a health checkup report. If you cannot even accurately grasp the most basic reach numbers, it is like being completely unaware of your own weight, body fat, and physiological indicators. Any talk of improvement and growth becomes difficult to build on clear, evidence-based judgment.
