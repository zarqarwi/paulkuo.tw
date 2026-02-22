---
title: "Personal Health Data Infrastructure: From 10 Years of Apple Health to AI-Driven Cross Analysis"
description: "We don't lack data—we lack infrastructure. This article documents how I exported over 10 years and 3 million health data points from iPhone and Apple Watch, combined with real-time Fitbit MCP integration and Claude AI, to build my own Personal Health Infrastructure and discover what no single device would ever tell you."
date: 2026-02-21
pillar: ai
---

## Personal Health Data Infrastructure

### From 10 Years of Apple Health to AI-Driven Cross Analysis

Ten years ago, I didn't deliberately start a health program. I simply kept my phone in my pocket and wore a watch on my wrist, and the days just passed by.

Until recently, when I exported all data from my iPhone's Health app for the first time. After unzipping, it was a 1.3GB XML file. Ten years, over 3 million records—steps, heart rate, sleep, workout tracks, autonomic nervous system indicators. A history co-written by body and time, spanning my entrepreneurship, transformation, leaving comfort zones, and starting anew.

At that moment I realized: we don't lack data—we lack infrastructure.

---

### Why Build Your Own Analysis System?

Mainstream wearable devices each have closed ecosystems and proprietary algorithms, creating two fundamental problems.

**First is data silos.** Apple Health has its interpretation logic, Fitbit has its algorithms. I wear both devices simultaneously, and while they're highly consistent on total sleep duration for the same night (differing by only 2 minutes), they differ by 21 minutes on deep sleep and 15 minutes on REM sleep. Which to trust? The answer is: trust neither completely—only cross-reference for trends.

**Second is missing dimensions.** Phone apps focus on showing you "today" and "this week," but aren't good at long-term trend analysis spanning three to five years, and cannot perform multi-dimensional cross-correlation between declining activity levels, deteriorating HRV, and accumulated sleep debt. Yet the relationships between these indicators are often the most important signals.

To see the full picture requires not another wearable device, but your own analytical infrastructure.

---

### A Decade of Digital Footprints

Since August 2015, my iPhone has continuously recorded my activities. When Apple Watch joined in 2016, heart rate and sleep began being measured more precisely. From 2023, Fitbit became the second wearable device, providing another independent measurement baseline.

The decade's accumulation: 279,537 step records, 231,300 walking and running distance records, over 1.13 million heart rate records, 29,532 sleep records. For workouts: 1,420 runs, 435 bike rides, 19 swims, leaving 966 GPS workout tracks.

From September 2023, Apple Watch began recording deeper indicators—7,710 HRV records, 753 resting heart rate records, 9,837 blood oxygen saturation records, 439 wrist temperature records, 122 VO2Max records. These are the truly valuable data from wearables: not step counts, but the operational state of the autonomic nervous system.

Numbers alone carry no emotion. But when annual distributions are laid out, many things become clear.

---

### Technical Architecture: Three Data Pipelines

#### Real-time Pipeline: Fitbit → MCP → Claude

Through Anthropic's MCP (Model Context Protocol), Fitbit API connects directly to Claude Desktop.

**How it works:** I can directly tell Claude "analyze my stress load from the past week," and Claude calls the Fitbit API through MCP, retrieving raw JSON for sleep (including all stage durations), heart rate time series, activity summaries, and analyzes in real-time. What I get is raw data returned by the API, not summaries already translated by the app.

**Technical details:** OAuth 2.0 authentication, automatic token refresh. Runs entirely locally, data doesn't pass through third-party servers.

#### Deep Pipeline: Apple Health → XML → Structured Analysis

Apple doesn't provide Health API for personal use—the only export is manual from iPhone.

**Processing flow:** Use Python to stream-parse the 1.3GB XML (not attempting to load all at once), first build data type indexes, then categorize and extract various indicators to independent JSONs—sleep, HRV, resting heart rate, blood oxygen, etc., finally create daily and monthly summaries.

**Pain point solved:** Apple's sleep divides into Core/Deep/REM three stages, Fitbit divides into Light/Deep/REM. Apple's Core roughly corresponds to Fitbit's Light, but algorithmic determination standards differ. Processing only aligns trend directions, not comparing absolute values.

#### Automation Pipeline: CI/CD Continuous Deployment

Mac's crontab executes update scripts every 10 minutes, pulling real-time data through Fitbit OAuth API, git push triggers GitHub Actions auto-build, Cloudflare Pages deployment. The health dashboard always stays current, from data generation to website update, fully automated without human intervention.

This isn't showing off. I don't want to occasionally look at charts. I want it to become long-running infrastructure.

---

### What the Data Really Says

When ten years of curves overlay, numbers are more honest than feelings.

#### Exercise Volume Fluctuations: From Daily Triathlon to Zero

In 2018, I began participating in triathlon events, at least one per year. Simultaneously joined "Daily Triathlon"—a self-discipline community where you choose one from swimming, cycling, running daily. I most often chose running—lowest barrier, just put on shoes and go out.

Starting this had two reasons. One personal: setting an example for my son, letting him see how his father manages his own body and discipline. The other learned from entrepreneurial experience—health is the hardware that carries all decision-making and execution. Almost every excellent CEO I know has regular exercise habits, even enjoys challenging extreme sports. Not because they "have time," but because they understand: the body's recovery cycle cannot be compressed.

GPS track annual distribution recorded this journey: 93 tracks in 2021, 340 in 2022, 294 in 2023, 200 in 2024, 39 in 2025. 2022 had exercise records almost every day—the most thorough Daily Triathlon execution year.

In subsequent years, work transitions, increased responsibilities, structural life changes. I didn't realize I was abandoning recovery cycles. When exercise got squeezed out of the schedule, data shows the body immediately began "debt accumulation."

#### Sleep Debt: 33 Consecutive Months Below Target

Combining Fitbit (2023/05-2026/02, 883 nights) and Apple Watch (2023/09-2025/12, 537 nights) records: 33 months, not a single month's average reached the recommended 7 hours. Overall average about 5 hours 50 minutes.

One hour less daily, over three years equals over a thousand hours of sleep debt.

The trend is more concerning: 2023-2024 around 6 hours, 2025 dropped to 5 hours 41 minutes, Q2 bottomed at 5 hours 16 minutes. Sleep efficiency fell from 83% to 74%. Not just sleeping less—lying longer, but actual sleep proportion increasingly lower. Body resting, nervous system still running.

#### HRV and Resting Heart Rate: The Most Honest Indicators

HRV declined from 42ms in 2023 to 31ms in mid-2025, over 25% decrease. Meanwhile resting heart rate rose from 60 bpm to 72 bpm. Both lines point to the same thing: autonomic nervous system chronically under stress.

This isn't emotional judgment—it's physiological signals. And this is Apple Watch exclusive data—if only looking at Fitbit, you'd never know. This is precisely the value of cross-device analysis: warnings that individual apps wouldn't proactively flag become undeniable under multi-dimensional comparison.

---

### Lessons Learned: Data Pipeline Fragility

In this analysis, I discovered weight data completely discontinued after 2022. The reason was quite mundane: the smart scale broke, and I never replaced it.

This is a typical data lesson—**hardware failure is the greatest threat to personal data infrastructure.** Once data breaks, physical changes during that period become permanent black holes. Not unwillingness to record, but once broken, never reconnected.

Similar fragility appears in Apple Health export: this is a manually triggered process—if not regularly exported, latest data only exists in iPhone, unavailable for external analysis.

Recognizing this fragility is the first step in building sustainable infrastructure.

---

### Practical Device Pairing Recommendations

26 months of dual-device overlapping data led to a set of principles: use Fitbit for total sleep duration (high coverage, 25-31 nights monthly), reference Apple Watch for REM sleep (accelerometer detects micro-movements more precisely), only watch trends not absolute values for deep sleep (indicators with greatest algorithmic differences between devices). HRV, resting heart rate, blood oxygen are Apple Watch's unique leading indicators.

Fitbit is the daily tracking workhorse, Apple Watch is the deep health assessment supplement. They complement, not replace each other.

---

### Next Steps: From Observation to Intervention

The next phase of this system isn't adding more charts, but three things: AI anomaly detection (when HRV drops below baseline for three consecutive days, Claude proactively sends intervention recommendations), lifestyle annotation (recording before/after comparisons of intervention behaviors), and more data source integration (Oura Ring temperature, smart blood pressure monitor, body fat scale—each additional pipeline adds another layer of cross-analysis dimensions).

Evolving from "viewing data" to "using data to drive behavioral change"—this is the true value of Personal Health Infrastructure.

---

### Conclusion

Ten years of data proved two things.

First, the body constantly sends signals. HRV decline, rising resting heart rate, sleep efficiency collapse, exercise volume zeroing—these signals scattered across different devices all seem "within range" in their respective apps. It's the self-built analytical infrastructure that converges them into an undeniable trend.

Second, I once could do it. 1,420 runs, 435 bike rides, one triathlon yearly—2022's 340 GPS tracks prove Daily Triathlon was feasible. Decline isn't fate, but structure.

Health shouldn't just be "how many steps today." It should be a personal system that can be verified, corrected, and continuously optimized.

Ten years of data isn't for nostalgia, but to remind myself—once trends are clear, there's no excuse to pretend not to see them.

---

*The health data analysis dashboard for this article can be viewed at [paulkuo.tw/health](/health).*

*Technical details: Fitbit MCP setup, Apple Health XML parsing processes, Chart.js visualization, CI/CD automation pipelines, etc. Welcome to contact for discussion.*