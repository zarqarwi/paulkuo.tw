---
title: "How Many Carbon Credits Do Four Hundred Thousand Footsteps Correspond To?"
subtitle: "Baishatun Mazu Pilgrimage × Carbon Footprint Tracking: When 400,000 people's walking faith meets GPS and ESG scientific carbon reduction frameworks."
description: "The 2026 Baishatun Mazu Pilgrimage introduces GPS carbon footprint tracking for the first time, combining SSBTi scientific carbon reduction frameworks with gamified nine-level pilgrim ranking design, attempting to record the low-carbon implications of 400,000 pilgrims' walking behavior using modern methods. Emission coefficient 0.21 kg CO₂/km, estimated avoidance of approximately 6,300 tons CO₂—a cross-disciplinary experimental documentation in progress."
abstract: |
  Three hundred thousand registrants, approximately 400 kilometers of round-trip walking, the Baishatun Gongtian Temple Mazu Pilgrimage (Baishatun Mazu) route is determined by Mazu herself—this is Taiwan's massive spring crowd movement each year. What is the environmental significance of this activity? I collaborated with the 1.5°C Scientific Carbon Reduction Initiative Standards Association to build a GPS check-in and carbon footprint tracking system from scratch in four weeks. This article documents the entire process: why we did it, how we did it, and what this means for ESG practice.
date: 2026-04-01
updated: 2026-04-02
pillar: circular
tags:
  - 碳足跡
  - 白沙屯媽祖
  - ESG
  - GPS 追蹤
  - 永續行動
  - Cloudflare Workers
  - 遊戲化設計
cover: "/images/covers/formosa-esg-2026-low-carbon-pilgrimage.jpg"
featured: true
draft: false
readingTime: 10

# === AI / Machine 專用欄位 ===
thesis: "四十萬人的傳統徒步信仰活動，在行為轉換的假設下呈現出可觀的低碳效果；透過 GPS 追蹤、排放係數估算與遊戲化等級設計，這是一個正在發展中的嘗試，把信仰實踐中的行為價值轉譯為可被記錄與理解的數據。"
domain_bridge: "ESG 碳足跡 × 宗教民俗 × 邊緣運算 × 遊戲化設計"
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

> **TL;DR** — The 2026 Baishatun Mazu Pilgrimage introduces GPS carbon footprint tracking for the first time, collaborating with the SSBTi Scientific Carbon Reduction Association to build a platform for tens of thousands from scratch in four weeks. Emission coefficient 0.21 kg CO₂/km, estimated avoidance of 6,300 tons of carbon emissions (≈ annual carbon absorption of 16 Daan Forest Parks), plus gamified design with nine cultivation-style pilgrim levels, attempting to use modern language to reunderstand the behavioral values that already existed in faith practice.

One weekend afternoon in early February, a friend invited me to their regular gathering place to discuss their aspirations and wishes. They hoped to build a platform for sustainable good deeds and collective civic virtue. Time was tight—they wanted it ready for the [Baishatun Mazu Pilgrimage](https://mazu.today/projects/formosa-esg-2026/) in April this year. Could I help? I...

In 2025, Global Environment partnered with Empress Lions Club and the Scientific Carbon Reduction Association to launch the "ESG Good Footprints" initiative for the Baishatun pilgrimage, using Google Forms and LINE groups to collect low-carbon action records from pilgrims, connecting thirty-six participating companies. The concept was proven, but data collection relied on manual work and carbon footprints on self-reporting—there would be bottlenecks in scaling the data.

Just days after 2026 registration opened, numbers had already surpassed last year's final statistics. The temple estimated it would exceed 400,000. We weren't surprised—given the turbulent environment and this being an election year. Byung-Chul Han writes in [*The Disappearance of Rituals*](https://www.books.com.tw/products/0010891045): "Labor in the secular realm isolates people, leaving them helpless and alone, while festivals bring people together into unity. The cyclical nature of festivals stems from the fact that people periodically feel the need to gather together, because collectivity is our nature."

What makes the Baishatun Mazu Pilgrimage moving should be not just "walking far," but the entire set of practices—walking, waiting, departure, receiving fire, return—that [transforms faith into a bodily experienceable order](/articles/faith-collapse-rebuild/). People aren't watching an event; they're entering a world with symbolic depth.

I thought: if we could record how far each person walked and calculate carbon reduction more seamlessly through a system, last year's good footprints concept could evolve from questionnaires into real data infrastructure. Watching Claude evolve almost weekly with enhanced capabilities, I thought, let's implement this and see how far this system can go.

## Baishatun Mazu Pilgrimage: Growth Curve from 50,000 to 400,000 People

The Baishatun Mazu Pilgrimage has over 200 years of history. Each spring, pilgrims depart from Gongtian Temple in Baishatun, Miaoli, walking to Chaotian Temple in Beigang, Yunlin—approximately 400 kilometers round trip over eight to nine days. What's most unique is that the route is completely unfixed—the palanquin bearers follow Mazu's guidance, making each year an unknown journey.

The growth curve of this activity is remarkable. Registration was 54,000 in 2020, broke 110,000 in 2023, surged to nearly 180,000 in 2024, doubled to 329,000 in 2025. By late March 2026, it had already exceeded 370,000, estimated to break 400,000. More than sevenfold growth in six years.

Past coverage mostly focused on numbers, routes, and moving stories about the pink super sports car. Starting last year, people began asking from a different angle: when so many people choose walking over driving, exactly how much carbon emissions are "saved"?

This question opens many explorable dimensions. For instance, Taiwan's ESG wave has extended from listed companies' annual reports to [supply chains](/articles/jd-ai-supply-chain-revolution/), gradually permeating everyday language. [Every quantifiable piece of carbon reduction data has real significance](/articles/civilization-metric-system-over-goal/), and the general public no longer finds these overly esoteric terms. Last year's good footprints initiative proved this concept works, but getting data from concept to recordable, trackable levels requires more than questionnaires—it needs systems.

## How Much Carbon Can Walking Pilgrimage Reduce? A Calculation Logic

The logic for calculating carbon footprints is actually straightforward. The [Ministry of Environment's emission factor database](https://ghgregistry.moenv.gov.tw/) tells us that a passenger car emits approximately 0.21 kilograms of carbon dioxide per kilometer. If a pilgrim chooses to walk the entire journey instead of driving, they avoid this 0.21 kg of carbon emissions per kilometer.

Using this figure: assuming 300,000 people average 100 kilometers each (a conservative estimate, as many only walk partial segments), just the act of "walking instead of driving," under the above assumptions, roughly corresponds to about 6,300 tons of avoided carbon dioxide emissions. Using common conversion methods, this scale roughly equals the annual carbon absorption capacity of [sixteen Daan Forest Parks](https://www.forest.gov.tw/).

> **📊 Key Data**
> - **Emission Coefficient**: 0.21 kg CO₂ per kilometer (Ministry of Environment published value)
> - **Estimated Total Avoided Carbon Emissions**: Approximately 6,300 tons CO₂
> - **Equivalent**: Annual carbon absorption of 16 Daan Forest Parks

But these are all paper figures. The real question is: how do we let everyone know how far they've walked and how much they've contributed? How do we connect "doing good" and "carbon reduction," letting data speak?

This is why we hoped to upgrade the system with AI empowerment this year.

## Four Weeks to Build a Ten-Thousand-Scale Carbon Footprint Tracking System

March 23rd, twenty days before the April 12th departure. I collaborated with the [1.5°C Scientific Carbon Reduction Initiative Standards Association (SSBTi)](https://www.ssbti.org)—they provided the scientific carbon reduction methodology framework and association endorsement, while I handled technical development and system deployment.

[SSBTi](https://www.ssbti.org) is a non-profit social organization approved by the Ministry of the Interior in 2022, and a Taiwan member of the international supply chain Science Based Targets initiative alliance. They participated as co-organizers in last year's good footprints initiative; this year's collaboration is more focused—they provide the scientific carbon reduction methodology framework while I handle converting manual processes into more automated interfaces, integrating website and LINE OA.

The technical architecture uses Astro for frontend, Cloudflare Workers + D1 + KV for backend, all running on edge computing. The reason for choosing this architecture is pragmatic: pilgrimage activities happen while moving, mobile signals are unstable, requiring extremely low latency and high availability. Cloudflare's global edge nodes perfectly solve this problem. Moreover, having everyone install another app isn't realistic.

What was accomplished in four weeks seems somewhat surreal when laid out:

Day one verified technical feasibility—using mobile GPS to capture coordinates, confirming sufficient accuracy. Day two built the backend skeleton—GPS check-in API, carbon footprint calculation formulas, LINE Bot integration, D1 database structure, Worker deployment. Day three completed frontend UX restructuring—thirteen-question card-style questionnaire interface, linear progress bars, nine-level pilgrim ranking system. Day four launched Dashboard and security mechanisms—server-side map clustering, rate limiting, activity start/stop controls. Days five to six conducted four rounds of stress testing—pushed up to 5,000 virtual users online simultaneously, 99.99% success rate.

Being able to complete this under such time pressure, Claude was a huge help. From architecture design to code generation to test scripts, Claude Chat, Cowork, and Claude Code were tireless engineering partners. My role was more like the project's decision-maker and quality controller—every "why do it this way" and "why not that way" was my judgment, but [execution speed was supported by AI](/articles/ai-capability-gap-2026/) (plus the money paid for tokens).

## From Qi Refinement to Ascension: Nine-Level Pilgrim Gamification Design

The small detail I cared about most in the system design was the nine-level pilgrim ranking.

The concept was inspired by [*A Record of Mortal's Journey to Immortality*](https://youtu.be/oVrBrKtC9cQ?si=bHCqxl7pmwlXfuZz), starting from "Qi Refinement" and gradually leveling up with accumulated mileage and check-ins—Foundation Establishment, Core Formation, Nascent Soul, all the way to Ascension. Each level has a dedicated character illustration, replacing the emojis we originally planned to use. This isn't about gimmicks. The Baishatun pilgrimage itself is a metaphor for "cultivation"—you use your feet to walk the entire journey step by step, experiencing fatigue, persistence, emotion, and enlightenment in the process. The ranking system makes this psychological journey concrete.

![Nine-level pilgrim ranking character illustrations: From Qi Refinement to Ascension](/images/formosa-esg-pilgrim-ranks.png)

The concept of [incarnation](/articles/incarnation-ai-embodiment/)—abstract beliefs must enter concrete bodily experience to have meaning, the Christian tradition of the Stations of the Cross, contemplating one's relationship with the Lord and the ultimate nature of humanity at each station of Christ's suffering—aligns perfectly with my thinking while building this system. Carbon footprint data is abstract, but when you open your phone and see yourself advance from Qi Refinement to Core Formation, see you've accumulated fifty kilometers and avoided 10.5 kilograms of carbon emissions, that number is no longer just a number. It becomes your aspiration.

The sharing page is also intentionally designed—full-width map, QR code, real-time statistics. When pilgrims rest on the road and scan with their phones, they can see where they've walked, what level they are, and how much carbon they've reduced. Then share it with friends. Each share is a micro-transmission of sustainability awareness.

## When ESG Is No Longer Just Corporate Reports: A Sustainability Field for 400,000 People

In the process of building this system, the more important a concept is, the easier it becomes a buzzword. The dilemma of ESG in Taiwan isn't lacking methodology—it's lacking scenarios.

Companies doing carbon inventories, writing sustainability reports, setting carbon reduction targets—these are all correct things to do, but they're still too distant for most people. Most people hear ESG and think it's homework for listed companies.

But we hope the Baishatun pilgrimage can change this impression. When you put carbon footprint tracking into an activity with 400,000 participants, sustainability is no longer just text in reports, but personal experience with numbers—"I walked fifteen kilometers today, corresponding to approximately 3.15 kilograms of carbon emission reduction." Faith provides motivation, technology provides measurement, and the influence generated by combining the two is a new attempt and creation. Just this kind of integration has innovative significance.

For companies, this type of methodologically calculated data also provides a new perspective—as supplementary explanation for sustainability participation and social impact, not just another number in reports.

The role of [SSBTi](https://www.ssbti.org) in this project is precisely this: providing methodological reference foundations and frameworks, making data not just an engineer's calculations, but gradually moving toward behavioral indicators with methodological foundations that can be continuously optimized and understood.

## The Voice of 400,000 Feet

On April 12th, the square in front of Baishatun Gongtian Temple will be packed with pilgrims waiting to depart. The moment the firecrackers sound, these people will start walking. Some will walk the entire eight days, some will walk one day and go home, some will join midway and leave midway. Everyone's path is different, but every step will be recorded.

I don't know what the final data will look like—total mileage, total carbon reduction, which road segment has the most check-ins. But I know one thing: when we [connect the power of faith with sustainability frameworks](/articles/compass-meets-algorithm-authority-in-human-ai-era/), it's a meaningful creation.

This time, what we did was simply try to connect and integrate. Using technology to translate those originally invisible footsteps into language that contemporary society can understand. Thus, carbon reduction is no longer just an indicator on reports, and faith is no longer just internal comfort; for the first time, the footsteps of 400,000 people simultaneously become aspiration, data, and public action.

Of course, these numbers are still built on specific assumptions, such as whether walking truly replaces original transportation behavior, and there's still much room for refinement. But precisely because of this, such attempts become interesting—they give a collective action that was originally difficult to quantify the possibility of being understood and discussed.

Integration requires many people's participation—it can be materials, technology, help from many volunteers, it can be tens of thousands of lines of code written in six days, or it can just be a check-in button on your phone. If technology has a higher purpose, it's not to replace ritual, but to let ritual leave a visible shape in this era.

[Learn more: 2026 Baishatun Mazu Pilgrimage — Formosa ESG Low-Carbon Good Deeds Tracking System](https://mazu.today/projects/formosa-esg-2026/)