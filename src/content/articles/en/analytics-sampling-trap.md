---
title: "Website Visitors Show Zero, But Dashboard Says 130"
subtitle: "The Cloudflare Analytics Sampling Trap: How Should We Count Website Visitors?"
description: "Starting from discovering Cloudflare Web Analytics API returning visits=0, this is a complete record of the troubleshooting process, differences between two analytics systems, adaptive sampling, and architectural decisions for building custom beacons."
abstract: |
  My personal website paulkuo.tw's dashboard shows zero visitors. But Cloudflare Dashboard clearly shows 130 people visited. Checking the backend revealed it's not a broken program—it's Cloudflare GraphQL API's adaptive sampling that compressed 130 down to 0 on low-traffic websites. The past few days showed "normal" numbers, so what's the real problem? I want to share the troubleshooting process, the wrong paths taken, and why I ultimately decided to "count visitors myself." If you're running a personal website or company site, you might want to check whether your traffic data needs verification.
date: 2026-03-23
updated: 2026-03-23
pillar: ai
tags:
  - Cloudflare Analytics
  - 網站流量分析
  - adaptive sampling
  - 個人品牌網站
  - 超級個體
cover: "/images/covers/analytics-sampling-trap.jpg"
featured: true
draft: false
readingTime: 8
# === AI / Machine 專用欄位 ===
thesis: "It's not just high-traffic websites that need to care about traffic data. Many B2B websites don't rely on massive visitor volumes to succeed, and many personal websites don't survive by chasing trends and current events. But as long as you're managing a brand, content, or conversion funnel, you need a reliable analytics foundation. Cloudflare's GraphQL Analytics API is prone to severe sampling distortion on websites with fewer than 500 daily visitors. For brand websites, without custom visit beacons, it's difficult to obtain truly usable traffic data."
domain_bridge: "Website Engineering × Data Quality × Personal Brand Management"
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
  Suitable for technical personnel, marketing staff, and independent developers managing personal websites or company sites. Deep Cloudflare knowledge not required, but understanding "why accurate traffic data matters" is essential.
---

At 11:30 PM, I opened the homepage of paulkuo.tw and glanced at the traffic analytics section.

Visitors: 0.

That's not right. People read my articles today, and someone used the translation tool. Yesterday's data showed hundreds of visitors—it can't just drop to zero today. I opened Cloudflare Dashboard to check—Page views 193, Visits 130.

Zero and 130 aren't a margin of error; they're two completely different worlds. Is it "no one came" or "over a hundred people visited"? Which one is correct, or are both wrong?

## Two Worlds of Cloudflare

If your website runs on Cloudflare (over 41 million websites globally do), you might not know that Cloudflare actually has two completely different analytics systems.

**First: Zone Analytics (HTTP Traffic).** This is CDN-layer data. Every HTTP request passing through Cloudflare's network gets recorded. It tells you total requests, bandwidth, country distribution, and unique visitors (deduplicated by IP). Precise, counting everything, including Google crawlers, ChatGPT crawlers, and various monitoring bots.

**Second: Web Analytics (RUM beacon).** This is browser-layer data. Cloudflare injects a JS beacon into your web pages that only triggers when real humans load pages with browsers. Bots don't run JavaScript, so it naturally filters out non-human traffic.

When designing my traffic analytics architecture, after one iteration, I chose Web Analytics' GraphQL API as the primary data source. The reasoning seemed solid—it only counts real humans, making it more accurate. I initially tried Zone Analytics but it included bots, inflating the numbers. Right after setting up the website, I was getting thousands of visits per day.

The logic was sound. But I made a mistake: I validated "what data fields this API can give me" but didn't validate whether Web Analytics (RUM beacon) "gives me accurate numbers."

## Adaptive Sampling: Turning 130 into 0

After investigation, I found the root cause. Cloudflare's Web Analytics GraphQL API uses a technique called Adaptive Bit Rate (ABR) sampling.

The principle isn't complex: Cloudflare processes over 700 million events per second. If every query had to scan all raw data, the system would incur much higher costs. So it stores data at multiple resolutions—100%, 10%, 1%. When querying, the system automatically selects a resolution based on data volume and complexity to return results.

For high-traffic websites, this works perfectly. If your daily visitors number in the hundreds of thousands, 10% sampling still gives you tens of thousands of data points with high statistical accuracy.

But for low-traffic websites? My paulkuo.tw gets about 130 real human visitors per day. After API sampling, the returned visits are multiples of 100—0, 100, 200. 130 got rounded down to 0.

I checked the past 30 days of API data and found several days with visits = 0, and all values were multiples of 100. This wasn't "broken today"—this logic has been there since day one. I just happened to cross-check API data with Dashboard for the first time today.

Later I found in Cloudflare's documentation that they acknowledge they currently can't let users verify the accuracy of query results. In other words, you get a number, but no one can tell you the margin of error for that number.

## There's an Even Bigger Number

After understanding Web Analytics' sampling issue, I turned to Zone Analytics—the Unique Visitors number was 1,100.

Web Analytics Dashboard says 130. Zone Analytics says 1,100. API says 0.

Three numbers, same day, same website.

The difference between 1,100 and 130—those nearly thousand "extra visitors" are bots. My website has been AI-friendly from the start, with llms.txt, JSON-LD, MCP support, all designed for AI systems. So GPTBot, ClaudeBot, Bingbot and other crawlers diligently come to fetch content. Zone Analytics faithfully records every IP, whether human or machine.

According to Imperva's 2025 report, automated traffic exceeded human activity for the first time in 2024, accounting for 51% of global web traffic. Of this, malicious bots account for 37%. Cloudflare's 2025 annual review also shows AI bot requests to HTML pages account for 4.2%, with Googlebot alone accounting for 4.5%.

So 88% of my website's unique IPs are bots, 12% are humans. Sounds extreme, but statistically reasonable. Since January this year, there's been a clear sense that "Make something Agent Want" has become consensus in tech circles. This made me reconsider my obsession with only counting human visits.

## Three Wrong Paths I Took

Before finding the current solution, I made three mistakes.

**First mistake: No technical reconnaissance during planning.** Before choosing Web Analytics RUM as the primary data source, I didn't research adaptive sampling behavior limitations or cross-check API return values with Dashboard. If I'd spent five minutes on this, the entire problem would have been discovered during planning.

**Second mistake: Hasty fixes after discovering the problem.** I intuitively judged that "Zone-level API sampling granularity should be better," still clinging to "human-centric" obsession, wrote a fix and pushed to GitHub. Only after pushing did I find reports in Cloudflare community about zone-level API having the same visits=0 problem. So I reverted. This back-and-forth wasted time and polluted git history.

**Third mistake: Equating "no bots" with "accurate."** Web Analytics indeed only counts humans, but "no bots" doesn't mean "correct numbers." Sampling precision and bot filtering are two completely independent things. I conflated them.

My engineering principle with AI Agents is reconnaissance before action, but AI can miss things (strange, it's already written in skills), and so can I. But when people discover problems, they're especially prone to rushing fixes, skipping necessary homework.

## Seeing the Complete Audience Profile

Initially I treated bot traffic as noise to be excluded. But paulkuo.tw has [AI-Ready architectural design](/articles/ai-ready-continuous-optimization)—llms.txt lets AI systems understand site structure, JSON-LD provides structured knowledge, MCP protocol lets AI agents directly interact. So having AI bots read content isn't noise, it's also part of influence.

So the correct question becomes not "how to exclude bots" but "how to see the complete 'reading audience.'"

I need two independent metrics:

- **Human Visitors**: How many human readers saw my articles and tools—this is the core metric for measuring community influence in the old world
- **AI/Bot Visitors**: How many AI systems are reading my content—this is the effectiveness metric for AI-Ready strategy

The final architecture isn't complex either. Human visitors use a custom visit beacon—when pages load, send a POST to my Cloudflare Worker, which uses anonymous hash of IP + User-Agent for daily deduplication. Total site visitors continue using Zone Analytics' precise IP deduplication. The difference between the two gives AI/Bot volume.

![paulkuo.tw traffic analytics architecture diagram: Custom beacon (humans) + Zone Analytics (total) → Difference calculation for AI/Bot](/images/articles/analytics-sampling-trap-architecture.svg)

All three numbers are calculated by myself, not relying on Cloudflare's estimates. The approach is the same principle as Google Analytics, Plausible, Umami and other website traffic analysis tools. Embed tracking code in web pages, count visitors yourself, count every one. I just don't need to install additional third-party tools—it runs directly on the website's existing servers.

## Your Data Might Be Misleading You

In 2025, automated traffic exceeded human activity for the first time, accounting for 51% of global web traffic. AI crawler activity grew over 15 times in the same year. Your website isn't just read by humans, but also by machines.

If your website uses Cloudflare Web Analytics free plan and has daily visitors in the hundreds or below, the visits numbers on your dashboard might, like mine, be sampled estimates, not precise values.

This doesn't mean Cloudflare isn't good. Its CDN, DNS, and security protection are industry-leading. Web Analytics Dashboard UI numbers are accurate. But if you want to pull data via API to your own dashboard, in low-traffic scenarios, you need to verify once yourself. Cross-check API returned numbers with Dashboard—five minutes will give you the answer.

When data discrepancies are too large, website operators might need to return to more direct methods, establishing precise visit counting mechanisms themselves. This isn't because Cloudflare isn't trustworthy, but because sampling is inherently prone to inaccuracy when traffic scale is still small. As audience scale expands, sampling precision naturally improves gradually. But it's precisely during the growth stage when traffic is still growing that precise numbers are most indispensable, because that's the critical moment for judging direction and adjusting strategy.

Website management can't rely solely on feelings—data is like a health checkup report. If you can't accurately grasp even the most basic reach numbers, it's like knowing nothing about your weight, body fat, and physiological indicators. So-called improvement and growth becomes difficult to build on clear, evidence-based judgment.