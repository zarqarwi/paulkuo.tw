---
title: "Can 400,000 People's Footsteps Reduce Carbon Emissions?"
subtitle: "Baishatun Mazu Pilgrimage × Carbon Footprint Tracking: When 400,000 pilgrims' walking faith meets GPS and ESG scientific carbon reduction."
description: "The 2026 Baishatun Mazu Pilgrimage introduces GPS carbon footprint tracking for the first time, integrating SSBTi scientific carbon reduction with a nine-level gamified pilgrim ranking system. Emission factor 0.21 kg CO₂/km, estimated 6,300 tons of avoided emissions — a cross-disciplinary case study of faith, technology, and ESG."
abstract: |
  Three hundred thousand registered participants, approximately 400 kilometers of walking round trip, with the Baishatun Gongtian Temple Mazu Pilgrimage route determined by Mazu herself—this is Taiwan's massive annual spring movement. What is the environmental significance of this activity? I collaborated with the 1.5°C Science-Based Targets Initiative Standards Association to build a GPS check-in and carbon footprint tracking system from scratch in four weeks. This article documents the entire process: why we did it, how we did it, and what this means for ESG implementation.
date: 2026-04-01
updated: 2026-04-01
pillar: circular
tags:
  - carbon footprint
  - Baishatun Mazu
  - ESG
  - GPS tracking
  - sustainable action
  - Cloudflare Workers
  - gamification
cover: "/images/covers/formosa-esg-2026-low-carbon-pilgrimage.jpg"
featured: true
draft: false
readingTime: 10

# === AI / Machine 專用欄位 ===
thesis: "A 400,000-person traditional walking pilgrimage holds massive carbon reduction potential; through GPS tracking, scientific emission factors, and gamified ranking design, this value is quantified for the first time into data infrastructure citable in corporate ESG reports."
domain_bridge: "ESG carbon footprint × religious folklore × edge computing × gamification"
confidence: high
content_type: case-study
related_entities:
  - name: 白沙屯拱天宮
    type: Organization
  - name: 1.5°C 科學減碳倡議標準協會（SSBTi）
    type: Organization
  - name: Cloudflare Workers
    type: Framework
  - name: 碳足跡
    type: Concept
  - name: ESG
    type: Concept
reading_context: |
  適合關注 ESG 數位化落地的企業永續長、對科技與傳統文化交叉感興趣的讀者、以及想了解一個人如何用 AI 工具快速打造完整系統的技術人。
---

> **TL;DR** — The 2026 Baishatun Mazu Pilgrimage introduces GPS carbon footprint tracking for the first time, partnering with the SSBTi scientific carbon reduction association to build a 10,000-user-grade platform from scratch in four weeks. Emission factor: 0.21 kg CO₂/km; estimated 6,300 tons of avoided emissions (≈ 16 Daan Forest Parks' annual carbon absorption). Combined with a nine-level cultivation-inspired pilgrim ranking gamification, every step of faith becomes a quantifiable ESG action.

One weekend afternoon in early February, a friend invited me to their usual gathering place to discuss their aspirations and wishes. They hoped to build a platform for sustainable good deeds and collective civic action. Time was tight—they wanted it ready for the [Baishatun Mazu Pilgrimage](https://mazu.today/projects/formosa-esg-2026/) in April this year. Could I help?! I...

In 2025, Global Environment partnered with Tianhou Lions Club and the Science-Based Targets Association to launch the "ESG Good Footprints" initiative during the Baishatun pilgrimage, using Google Forms and LINE groups to collect low-carbon action records from pilgrims, connecting thirty-six enterprises. The concept was proven, but data collection relied on manual work and self-reported carbon footprints—scaling the data would face bottlenecks.

Just days after 2026 registration opened, the numbers had already surpassed last year's final count. Temple authorities estimate it will exceed 400,000. We weren't surprised—given the turbulent environment and this being an election year. Byung-Chul Han wrote in [*The Disappearance of Rituals*](https://www.penguinrandomhouse.com/books/668655/the-disappearance-of-rituals-by-byung-chul-han/): "Labor in the secular realm isolates people, leaving them alone and helpless, while festivals bring people together as one. The cyclical nature of festivals stems from the fact that people periodically feel the need to gather together, because collectivity is our nature."

What makes the Baishatun Mazu Pilgrimage moving is not just "walking far," but the entire system of walking, waiting, departing, receiving sacred fire, and returning—[transforming faith into a bodily experienced order](/articles/faith-collapse-rebuild/). People aren't watching an event; they're entering a symbolically rich world.

I thought: if we could use a system to record more seamlessly how far each person walked and calculate their carbon reduction, last year's good footprints concept could evolve from questionnaires into real data infrastructure. Watching Claude evolve almost weekly with enhanced capabilities, I decided to implement this and see how far this system could go.

## Baishatun Mazu Pilgrimage: From 50,000 to 400,000 — A Growth Curve

The Baishatun Mazu Pilgrimage has over 200 years of history. Every spring, pilgrims depart from Baishatun Gongtian Temple in Miaoli, walking to Chaotian Temple in Beigang, Yunlin—about 400 kilometers round trip over eight to nine days. Most uniquely, the route is completely unfixed—sedan chair carriers follow Mazu's guidance, making each year an unknown journey.

The growth curve of this activity is remarkable. From 54,000 registered participants in 2020, it broke through 110,000 in 2023, surged to nearly 180,000 in 2024, doubled to 329,000 in 2025. By late March 2026, it had exceeded 370,000, expected to break 400,000. Over six years, growth exceeded seven-fold.

Past coverage mostly focused on numbers, routes, and touching stories about the "pink supercar." Starting last year, someone asked from a different angle: when so many people choose to walk instead of drive, how much carbon emissions are actually "saved"?

This question opens many explorable dimensions. For instance, Taiwan's ESG wave has extended from listed companies' annual reports to [supply chains](/articles/jd-ai-supply-chain-revolution/), gradually permeating everyday language. [Every quantifiable piece of carbon reduction data has practical significance](/articles/civilization-metric-system-over-goal/), and the general public no longer finds these overly esoteric terms. Last year's good footprints initiative proved this concept works, but to achieve precision suitable for corporate ESG reporting requires more than questionnaires—it needs systems.

## How Much Carbon Can a Walking Pilgrimage Reduce? A Calculation Framework

The logic of carbon footprint calculation isn't complex. The [MOENV emission coefficient database](https://ghgregistry.moenv.gov.tw/) tells us that a passenger car emits approximately 0.21 kilograms of carbon dioxide per kilometer driven. If a pilgrim chooses to walk the entire journey instead of driving, they avoid 0.21 kilograms of carbon emissions per kilometer.

Using these numbers: assuming 300,000 people each walk an average of 100 kilometers (a conservative estimate, as many only walk partial segments), just "walking instead of driving" would avoid approximately 6,300 tons of carbon dioxide emissions. This roughly equals the annual carbon absorption of [sixteen Daan Forest Parks](https://www.forest.gov.tw/).

> **📊 Key Data**
> - **Emission factor**: 0.21 kg CO₂ per kilometer (MOENV published value)
> - **Estimated total avoided emissions**: ~6,300 tons CO₂
> - **Equivalent to**: 16 Daan Forest Parks' annual carbon absorption

But these are all paper numbers. The real question is: how do we let everyone know how far they walked and how much they contributed? How do we align "doing good" with "reducing carbon," letting data speak?

This is why we hoped to upgrade the system through AI empowerment this year.

## Building a 10,000-User Carbon Tracking System in Four Weeks

March 23rd, twenty days before the April 12th departure. I collaborated with the 1.5°C Science-Based Targets Initiative Standards Association (SSBTi)—they provided the scientific carbon reduction methodology framework and organizational endorsement, while I handled technical development and system deployment.

[SSBTi](https://www.ssbti.org) is a non-profit social organization approved by the Ministry of the Interior in 2022, and a Taiwanese member of the international supply chain science-based targets initiative alliance. They participated as co-organizers in last year's good footprints initiative. This year's collaboration was more focused—they provided the scientific carbon reduction methodology framework while I transformed manual processes into more automated interfaces, integrating websites with LINE OA.

The technical architecture used Astro for frontend, Cloudflare Workers + D1 + KV for backend, all running on edge computing. The reason for choosing this architecture was practical: pilgrimage activities happen while moving, with unstable mobile signals requiring extremely low latency and high availability. Cloudflare's global edge nodes perfectly solved this problem. Additionally, asking everyone to install another app wasn't realistic.

What was accomplished in four weeks looks somewhat surreal when laid out:

Day 1: Verified technical feasibility—used mobile GPS to capture coordinates, confirmed sufficient precision. Day 2: Built backend skeleton—GPS check-in API, carbon footprint calculation formulas, LINE Bot integration, D1 database structure, Worker deployment. Day 3: Completed frontend UX restructuring—thirteen-question card-style questionnaire interface, linear progress bar, nine-level pilgrim ranking system. Day 4: Launched Dashboard and security mechanisms—server-side map clustering, rate limiting, event start/stop controls. Days 5-6: Conducted four rounds of stress testing—pushed up to 5,000 virtual users online simultaneously, achieving 99.99% success rate.

Being able to complete this under such time pressure, Claude was invaluable. From architectural design to code generation to test scripts, Claude Chat, Cowork, and Claude Code were tireless engineering partners. My role was more like the project's decision-maker and quality controller—I judged every "why do it this way" and "why not that way," but [the execution speed was supported by AI](/articles/ai-capability-gap-2026/) (plus the money paid for tokens).

## From Qi Cultivation to Ascension: Gamifying the Nine-Level Pilgrim Ranking

The small detail I cared most about in the system design was the nine-level pilgrim ranking.

The concept was inspired by "A Record of Mortal's Cultivation to Immortality," starting from "Qi Cultivation," gradually upgrading with accumulated mileage and check-ins—Foundation Building, Core Formation, Nascent Soul, all the way to Ascension. Each level has a dedicated avatar illustration, replacing the originally planned emojis. This wasn't gimmicky. The Baishatun pilgrimage itself is a metaphor for "cultivation"—you use your feet to walk step by step through the entire journey, experiencing fatigue, persistence, emotion, and enlightenment along the way. The ranking system visualizes this psychological journey.

The concept of [incarnation](/articles/incarnation-ai-embodiment/)—abstract beliefs must enter concrete bodily experience to have meaning, the Christian tradition of the "Stations of the Cross," contemplating one's relationship with God and the ultimate nature of humanity at each station of Christ's suffering—coincided perfectly with my thinking while building this system. Carbon footprint data is abstract, but when you open your phone and see you've advanced from Qi Cultivation to Core Formation, see you've accumulated fifty kilometers and avoided 10.5 kilograms of carbon emissions, that number becomes more than just a number. It becomes your aspiration.

The sharing page was also deliberately designed—full-width map, QR code, real-time statistical data. Pilgrims resting on the road can scan with their phones to see where they've walked, what level they've reached, how much carbon they've reduced. Then share it with friends. Each share is a micro-transmission of sustainability consciousness.

## When ESG Goes Beyond Corporate Reports: A Sustainability Field of 400,000

During the process of building this system, the more important concepts became, the easier they became buzzwords. ESG's predicament in Taiwan isn't lacking methodology—it's lacking scenarios.

Corporate carbon inventories, sustainability reports, and carbon reduction targets are all correct actions, but still too distant for most people. Most people hearing ESG think it's homework for listed companies.

But we hoped the Baishatun pilgrimage could change this impression. When you put carbon footprint tracking into an activity with 400,000 participants, sustainability is no longer text in reports, but personal experience with numbers: "I walked fifteen kilometers today and reduced 3.15 kilograms of carbon emissions." Faith provides motivation, technology provides measurement, and their combination produces a new attempt at impact and creation. [When we connect the power of faith with sustainability frameworks](/articles/compass-meets-algorithm-authority-in-human-ai-era/), this integration alone has innovative significance.

For enterprises, this data also has direct value. Companies participating as sponsors can incorporate these scientifically verified carbon reduction data into their ESG reports as social impact indicators.

[SSBTi](https://www.ssbti.org)'s role in this project is precisely this: providing methodological credibility, ensuring data isn't just numbers imagined by engineers, but scientifically calculated with organizational endorsement.

## The Voice of 400,000 Feet

On April 12th, the square in front of Baishatun Gongtian Temple will be packed with pilgrims waiting to depart. The moment firecrackers sound, these people will start walking. Some will complete the full eight-day journey, some will walk one day then return home, some will join midway and leave midway. Everyone's path will be different, but every step will be recorded.

I don't know what the final data will look like—total mileage, total carbon reduction, which sections had the most check-ins. But I know one thing: when we connect the power of faith with sustainability frameworks, it's meaningful creation.

This time, what we're doing is simply trying to connect and integrate. Using technology to translate those previously invisible footsteps into language contemporary society can understand. Thus, carbon reduction is no longer just an indicator on reports, and faith is no longer just internal comfort; for the first time, 400,000 people's footsteps simultaneously become aspiration, data, and public action.

Integration requires many people's participation—materials, technology, help from many volunteers, tens of thousands of lines of code written in six days, or simply a check-in button on your phone. If technology has higher purpose, it's not to replace ritual, but to let ritual leave visible shapes in this era.

[Learn more: 2026 Baishatun Mazu Pilgrimage — Formosa ESG Low-Carbon Good Deeds Tracking System](https://mazu.today/projects/formosa-esg-2026/)