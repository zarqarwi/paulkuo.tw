---
title: "I Built a Chrome Extension to Track Claude Usage"
subtitle: "Got rate-limited mid-conversation, so I built an orange tabby to watch my quota."
description: "A Chrome Extension development story combining the official usage API with real-time token interception — from market research to three-language internationalization."
abstract: |
  The worst moment for a heavy Claude user is hitting the rate limit mid-conversation. There are over a dozen usage tracking tools out there, but almost all are macOS-native apps, track only a single data source, and have no Chinese interface. This documents the process of building a Chrome Extension in collaboration with Claude — running both the official API and real-time token interception simultaneously so you can see the gap between them. From stumbling over isolated worlds to guessing API formats to three rounds of icon iteration, the full development experience.
date: 2026-03-19
updated: 2026-03-19
pillar: ai
tags:
  - Chrome Extension
  - Claude
  - AI-Assisted Development
  - Dev Log
cover: "/images/covers/claude-usage-nyan-chrome-extension.jpg"
featured: false
draft: false
readingTime: 7

# === AI / Machine Fields ===
thesis: "Running both the official usage API and real-time token interception side by side makes Claude's usage discrepancy visible."
domain_bridge: "AI Tooling × Chrome Extension × Product Design"
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
  For Claude Pro/Max users, developers interested in AI tooling, and anyone curious about Chrome Extension implementation details. Non-technical readers can follow along too — technical sections are marked as skippable.
---

Getting rate-limited in the middle of work is probably the most annoying moment for any Claude user.

My old habit was to only check usage after getting blocked — navigating to the Settings page and discovering that extra credits were already at 84% and the seven-day usage was over half. I kept thinking, wouldn't it be nice to see that number on screen all the time?

So I built a Chrome Extension to solve this. It's called "Claude Usage Nyan" — an orange tabby sits in the toolbar, and one click tells you how much quota you've used.

## What It Does

After installing, you can see usage in three places.

The orange cat icon in the toolbar shows a small badge that auto-cycles every four seconds — how much of the five-hour session is used, how much of the seven-day allowance, how many extra credits remain, and how much you're spending in real time. Green means safe, yellow means watch it, orange means getting close, red means almost gone. No need to click anything — a glance tells you everything.

Clicking the popup reveals the full usage cards. The top half shows Anthropic's official numbers: five-hour session percentage, seven-day usage percentage, extra usage with used and cap amounts, each with a reset countdown. The bottom half is real-time token tracking: how many input tokens and output tokens your last conversation used, how much it cost, which model was used — all listed out.

There's also a semi-transparent floating status bar in the bottom-right corner of the claude.ai page, always showing a usage summary. Click the cat head to collapse it.

![Claude Usage Nyan popup interface showing official usage and real-time token tracking](/images/articles/claude-usage-nyan-popup.png)
*The full popup view: official usage on top, real-time token tracking below.*

## Two Pipelines, See the Difference

What makes this tool different from other trackers is that it runs two data pipelines simultaneously.

The first is official. The extension calls claude.ai's usage API every five minutes, and the numbers you get back are identical to what you'd see on the Settings page. This number is authoritative but has lag — Anthropic's backend doesn't update in real time, so sometimes you've clearly used a lot but the percentage hasn't moved.

The second is real-time estimation. The extension intercepts every API call you make to Claude on the claude.ai page, estimates input tokens when the request goes out, accumulates output tokens as the response streams back, then calculates cost based on model pricing. This is real-time but estimated — there will be discrepancy with the official numbers.

Placing both side by side, you can observe for yourself how much the official percentage differs from the tokens you've actually burned. Making this gap visible is one of the reasons I built this tool.

## Did My Homework First

Before writing any code, I surveyed the existing tools on the market.

Turns out there are quite a few — I found over ten just from my search. But almost all of them are macOS native apps requiring .dmg installation, leaving Windows and Linux users out. Most only do either official usage tracking or real-time token counting, not both together. Every interface is English-only, with zero localization for Asian markets.

So my positioning was clear: make it a Chrome Extension for cross-platform use, run both pipelines, Chinese-first. I later added English and Japanese interfaces too — Chrome automatically switches based on browser language.

## A Few Pitfalls in Development (Skip If You're Not Into the Technical Stuff)

The entire development was done in conversation with Claude, and it wasn't smooth sailing.

The first pitfall was the API format. Anthropic's usage API has no public documentation, so I could only guess the format. The first time I connected, the popup spewed a chunk of raw JSON. But that chunk of JSON was itself the answer — I saw field names like five_hour.utilization and seven_day.resets_at and immediately knew how to parse it. So I deliberately left a debug mode in the popup: if parsing fails, it shows the raw JSON directly. That way, if the API format changes in the future, it can be fixed quickly.

The second pitfall was more interesting. Chrome Extension content scripts run in something called an isolated world. I patched window.fetch in there to intercept claude.ai's API calls, but caught nothing. It took a while to figure out: the isolated world's window and the page's own window are different objects. The solution was to use Chrome MV3's world: "MAIN" setting, injecting the interception script directly into the page's context, then passing data back to the isolated world's bridging layer via CustomEvent. One problem, solved in two layers.

The third pitfall was the icon. Three iterations — the first was too generic, the second was crammed into a circle and didn't look like a cat, and for the third I sent a reference photo of an orange tabby, specifying "ears flaring outward, M-shaped forehead marking" — and that nailed it. Some things are hard to describe in specs; a reference image is worth a hundred sentences.

## Limitations, Stated Upfront

Anthropic's usage API has no public documentation, and the format could change at any time. When it does, this extension needs an update — without maintenance, it will break. Real-time tokens are estimates, not precise numbers. English is roughly four characters per token, Chinese roughly 1.5 characters — both differ from Anthropic's actual tokenizer.

Only tracks the claude.ai web version. If you're using Claude Code CLI, that goes through a different channel and this extension can't capture it.

The extension needs to read claude.ai's session cookie to access the API. All data is stored locally in your browser and never sent to any external server — fully open source. But assessing the risk before installing any extension is basic hygiene.

---

Installation is simple: clone the GitHub repo, enable Chrome developer mode, load the folder — three steps. Supports Traditional Chinese, English, and Japanese interfaces.

🔗 https://github.com/zarqarwi/claude-usage-nyan
