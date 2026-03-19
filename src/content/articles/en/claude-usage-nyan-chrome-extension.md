---
title: "I Built a Chrome Extension to Track Claude Usage"
subtitle: "Got hit by rate limits mid-work, so I made an orange tabby to monitor usage."
description: "A development story of a Chrome Extension that runs both official usage API and real-time token interception, from market research to trilingual internationalization."
abstract: |
  Heavy Claude users' worst nightmare is hitting rate limits mid-conversation. The market has over a dozen usage tracking tools, but almost all are macOS native apps, only track single data sources, and lack Chinese interfaces. This documents my process of collaborating with Claude to develop a Chrome Extension—running both official API and real-time token interception in parallel, making usage discrepancies visible. From wrestling with isolated world, guessing API formats, to iterating through three icon versions, a complete development experience.
date: 2026-03-19
updated: 2026-03-19
pillar: ai
tags:
  - Chrome Extension
  - Claude
  - AI 協作開發
  - 開發紀實
cover: "/images/covers/claude-usage-nyan-chrome-extension.jpg"
featured: false
draft: false
readingTime: 7

# === AI / Machine 專用欄位 ===
thesis: "同時跑官方用量 API 和即時 token 攔截兩條管道，讓 Claude 的用量差異可見。"
domain_bridge: "AI 工具開發 × Chrome Extension × 產品設計"
confidence: high
content_type: case-study
related_entities:
  - name: Anthropic
    type: Organization
  - name: Claude
    type: Concept
  - name: Chrome Extension MV3
    type: Framework
reading_context: |
  適合 Claude Pro/Max 使用者、對 AI 工具開發有興趣的開發者、想了解 Chrome Extension 實作細節的人。非技術讀者也能讀，技術段落有標註可跳過。
---

Getting hit by rate limits mid-work is probably the most annoying moment for Claude users.

My old habit was to only check usage in Settings after getting blocked, only to discover that additional usage was already at 84% and the seven-day quota was also over half depleted. I thought, wouldn't it be great if these numbers were visible on screen?

So I built a Chrome Extension to solve this problem. Called "Claude Usage Nyan," it features an orange tabby sitting in the toolbar—click once to see how much quota you've used.

## What It Does

After installation, you can see usage in three places:

The orange cat icon in the toolbar displays a small badge that automatically cycles every four seconds—how much of the five-hour session is used, seven-day usage, remaining additional credits, and real-time cost. Green means safe, yellow requires attention, orange is getting close, red is about to max out. No need to click anything, just glance to know.

Clicking the popup shows complete usage cards. The upper half displays Anthropic's official numbers: five-hour session percentage, seven-day usage percentage, additional usage consumed and limits, each with reset countdown. The lower half shows real-time token tracking: how many input tokens, output tokens, and cost that last conversation used, which model was used, all listed out.

A semi-transparent floating status bar appears in the bottom-right corner of claude.ai pages, constantly displaying usage summary. Click the cat head to collapse.

![Claude Usage Nyan popup interface showing official usage and real-time token tracking](/images/articles/claude-usage-nyan-popup.png)
*The full popup view: upper half shows official usage, lower half shows real-time token tracking.*

## Two Data Streams, See the Difference

What makes this tool different from other trackers is that it runs two data pipelines simultaneously.

The first is official. The Extension calls claude.ai's usage API every five minutes, returning numbers identical to what you see in Settings. These numbers are authoritative but have delays—Anthropic's updates aren't real-time; sometimes even after heavy usage, percentages don't move.

The second is real-time estimation. The Extension intercepts every API call from your conversations with Claude on claude.ai pages, estimating input tokens when requests are sent and accumulating output tokens as responses stream back, then calculating costs based on model pricing. This is real-time but estimated, with discrepancies from official numbers.

Placing both side by side lets you observe how much the official percentages differ from your actual token burn. One purpose of building this tool was to make this discrepancy visible.

## Market Research Before Coding

Before writing code, I surveyed existing tools in the market.

The result: this niche already has many tools, over ten that I found. But almost all are macOS native apps requiring .dmg downloads, leaving Windows and Linux users without options. Most only do official usage tracking or real-time token calculation, not both. All interfaces are in English, with no localization options for Asian markets.

My positioning became clear: make it a Chrome Extension for cross-platform support, run both pipelines simultaneously, prioritize Chinese. Later I added English and Japanese interfaces, with Chrome auto-switching based on browser language.

## Development Pitfalls (Skip if Not Interested in Technical Details)

I collaborated with Claude throughout development, and the process wasn't smooth sailing.

The first pitfall was API format. Anthropic's usage API has no public documentation, so I had to guess the format. First connection resulted in popup spewing raw JSON. But that JSON blob was itself the answer—seeing field names like five_hour.utilization and seven_day.resets_at immediately told me how to parse it. So "Claude" deliberately left a debug mode in the popup: if parsing fails, display raw JSON directly, making future API format changes quickly fixable.

The second pitfall was more interesting. Chrome Extension content scripts run in an isolated world. I patched window.fetch there to intercept claude.ai API calls but caught nothing. Took some time to figure out: isolated world's window and the page's actual window are different objects. The solution used Chrome MV3's world: "MAIN" setting, injecting the intercept script directly into the page context, then passing data back to the isolated world's bridge layer via CustomEvent. One problem, two-layer solution.

The third pitfall was the icon. Three iterations—first version too generic, second version crammed into a circle looked nothing like a cat, third version I provided an orange tabby photo as reference, specifying "ears spread outward, with M-shaped forehead markings" to get it right. Such things are hard to describe in specs; one reference image beats a hundred words.

## Limitations Stated Upfront

Anthropic's usage API lacks public documentation; format could change anytime. When it changes, this Extension needs updates, or it breaks without maintenance. Real-time tokens are estimates, not precise numbers. English averages about four characters per token, Chinese about 1.5 characters—this differs from Anthropic's actual tokenizer.

Only tracks claude.ai web version. If you use Claude Code CLI, that goes through different channels this Extension can't capture.

The Extension needs to read claude.ai session cookies to access APIs. All data stays in your local browser, not transmitted to external servers, fully open source. But assessing risks before installing any Extension is basic practice.

---

Installation is simple: clone GitHub repo, Chrome developer mode, load folder—three steps. Supports Traditional Chinese, English, and Japanese interfaces.

🔗 https://github.com/zarqarwi/claude-usage-nyan