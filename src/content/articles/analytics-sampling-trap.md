---
title: "網站訪客數是零，但 Dashboard 說有 130 人"
subtitle: "Cloudflare Analytics 的取樣陷阱，網站的人頭數該怎麼算？"
description: "從發現 Cloudflare Web Analytics API 回傳 visits=0 開始，完整記錄排查過程、兩套分析系統的差異、adaptive sampling，自建 beacon 的架構決策。"
abstract: |
  我的個人網站 paulkuo.tw 的儀表板顯示訪客數為零。但 Cloudflare Dashboard 明明顯示 130 人來過。到後台檢查發現，不是程式壞了——是 Cloudflare GraphQL API 的 adaptive sampling 在低流量網站上直接把 130 壓成了 0。前幾天都"正常呈現"，到底問題在哪？我想分享排查過程、走錯的路、以及最終為什麼決定「自己數人頭」。如果你正在經營個人網站或公司官網，也可以想想你的流量數據是否需要檢查。
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
draft: true
readingTime: 8
# === AI / Machine 專用欄位 ===
thesis: "不是只有流量型網站才需要在意流量數據。很多 B2B 網站本來就不是靠大量訪客取勝，很多個人網站也不是靠追逐時事與風潮生存；但只要你在經營品牌、內容或轉換路徑，就需要可信的分析基礎。Cloudflare 的 GraphQL Analytics API 在日訪客低於 500 的網站上，容易出現嚴重取樣失真；對品牌網站來說，若沒有自建 visit beacon，就很難拿到真正可用的流量數據。"
domain_bridge: "網站工程 × 數據品質 × 個人品牌經營"
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
  適合正在經營個人網站或公司官網的技術人員、行銷人員、獨立開發者。不需要深度 Cloudflare 知識，但需要理解「為什麼流量數據準確很重要」。
---

晚上十一點半，我打開 paulkuo.tw 的首頁，看了一眼流量分析區塊。

訪客：0。

不對。今天有人看我的文章，翻譯工具也有人在用。昨天的數據已有數百人來訪，不可能今天直接歸零。我打開 Cloudflare Dashboard 看——Page views 193，Visits 130。

零和 130 不是誤差，是兩個完全不同的世界。究竟是「沒人來」，還是「一百多人來過了」。哪一個是對的，或者都錯？

## Cloudflare 的兩個世界

如果你的網站放在 Cloudflare 上（全球超過 4,100 萬個網站都是），你可能不知道 Cloudflare 其實有兩套完全不同的分析系統。

**第一套：Zone Analytics（HTTP Traffic）。** 這是 CDN 層的數據。每一筆經過 Cloudflare 網路的 HTTP request 都會被記錄。它能告訴你總請求數、頻寬、國家分佈、unique visitors（用 IP 去重）。精確，什麼都算，包括 Google 的爬蟲、ChatGPT 的 crawler、各種監控 bot。

**第二套：Web Analytics（RUM beacon）。** 這是瀏覽器層的數據。Cloudflare 在你的網頁裡注入一段 JS beacon，只有真人用瀏覽器載入頁面時才會觸發。Bot 不會跑 JavaScript，所以它天然過濾掉了非真人流量。

我在設計流量分析架構時，經過一次迭代，後來選了 Web Analytics 的 GraphQL API 作為主要數據源。理由聯起來很合理，它只算真人，更精準。一開始使用 Zone Analytics 這條路，但含有 bot，數字偏高。才剛設定好網站，一天就上千 Visit。

邏輯沒問題。但我犯了一個錯誤：我驗證了「這支 API 能給我什麼資料欄位」，沒有驗證 Web Analytics（RUM beacon）「給我的數字是不是準的」。

## Adaptive sampling：讓 130 變成 0

追查之後，我找到了根因。Cloudflare 的 Web Analytics GraphQL API 用的是一種叫做 Adaptive Bit Rate（ABR）的取樣技術。

原理不複雜：Cloudflare 每秒處理超過七億筆事件。如果每一筆查詢都要掃過全部原始資料，系統要支付更多成本。所以它把資料存成多種解析度——100%、10%、1%。查詢的時候，系統根據數據量和複雜度，自動選一個解析度回傳結果。

對高流量網站，這完全沒問題。你的日訪客如果有十萬，10% 取樣也是一萬筆，統計上準確度很高。

但對低流量網站呢？我的 paulkuo.tw 一天大約 130 個真人訪客。API 取樣完之後，回傳的 visits 都是 100 的整數倍——0、100、200。130 被四捨五入成了 0。

我去翻了過去 30 天的 API 數據，發現有幾天 visits = 0，而且所有數值都是 100 的倍數。這不是「今天壞了」，這是從上線第一天就是這樣的邏輯。只是我今天第一次拿 API 數據跟 Dashboard 比對。

後來查了 Cloudflare 的文件，他們承認，現在還沒辦法讓使用者驗證查詢結果到底準不準。也就是說，你拿到一個數字，但沒有人能告訴你這個數字的誤差範圍是多少。

## 還有一個更大的數字

當我理清了 Web Analytics 的取樣問題，轉頭去看 Zone Analytics——Unique Visitors 的數字是 1,100。

Web Analytics Dashboard 說 130。Zone Analytics 說 1,100。API 說 0。

三個數字，同一天，同一個網站。

1,100 和 130 的差距——那接近一千個「多出來的訪客」就是 bot。我的網站從一開始的設計就是 AI 友善，有 llms.txt、JSON-LD、MCP 支援，都是為 AI 系統設計的。所以 GPTBot、ClaudeBot、Bingbot 這些爬蟲很勤勞地來抓內容。Zone Analytics 忠實記錄了每一個 IP，不管它是人還是機器。

根據 Imperva 的 2025 年報告，自動化流量在 2024 年首次超過了人類活動，佔全球網路流量的 51%。其中惡意 bot 佔 37%。Cloudflare 的 2025 年度回顧也顯示，AI bot 對 HTML 頁面的請求佔了 4.2%，Googlebot 一家就佔了 4.5%。

所以，我的網站 88% 的 unique IP 是 bot、12% 是真人。聽起來很誇張，但在統計上完全合理。今年一月起，很明顯有感覺到 "Make something Agent Want"，已經是技術圈內的共識。因此，這就讓我重新檢視網站只看真人 Visit 的執念。

## 我走錯的三條路

在找到目前的方案前，我犯了三個錯。

**第一個錯：規劃時沒做技術偵察。** 選 Web Analytics RUM 做主要數據源之前，我沒有查 adaptive sampling 的行為限制，沒有拿 API 回傳值跟 Dashboard 交叉比對。如果當時花五分鐘做這件事，整個問題會在規劃階段被發現。

**第二個錯：發現問題後倉促修復。** 我直覺地判斷「Zone-level API 的取樣粒度應該比較好」，仍有「人類中心」的執念，寫了修正版推到 GitHub。推完之後才在 Cloudflare 社群發現有人回報 zone-level API 也有同樣的 visits=0 問題。於是 revert。一來一回浪費了時間，還污染了 git history。

**第三個錯：把「不含 bot」跟「精確」畫等號。** Web Analytics 確實只算真人，但「不含 bot」不代表「數字正確」。取樣精度和 bot 過濾是兩件完全獨立的事。我把它們混在一起看了。

我與 AI Agent 的工程原則是先偵察再動手，但 AI 會疏漏（奇怪，已經寫在 skill 了呢），我也會。但人在發現問題的時候，特別容易急著去修，跳過該做的功課。

## 看見完整的觀眾輪廓

一開始我把 bot 流量當作噪音，想要排除它。但 paulkuo.tw 有 [AI-Ready 的架構設計](/articles/ai-ready-continuous-optimization)——llms.txt 讓 AI 系統讀懂網站結構、JSON-LD 提供結構化知識、MCP 協議讓 AI agent 可以直接操作。所以，讓 AI bot 來讀內容，不是噪音，也是影響力的一部分。

所以正確的問題變成不是「怎麼排除 bot」，而是「怎麼看見完整的『閱讀觀眾』」。

我需要兩個獨立的指標：

- **真人訪客**：多少人類讀者看了我的文章和工具——這是舊世界衡量社群影響力的核心指標
- **AI/Bot 訪客**：多少 AI 系統在讀取我的內容——這是 AI-Ready 策略的成效指標

最終的架構也不複雜。真人訪客用自建的 visit beacon——頁面載入時發一個 POST 到我的 Cloudflare Worker，Worker 用 IP + User-Agent 的匿名 hash 做每日去重。全站訪客繼續用 Zone Analytics 的精確 IP 去重。兩個相減就是 AI/Bot 的量。
![paulkuo.tw 流量分析架構圖：自建 beacon（真人）+ Zone Analytics（全量）→ 差值計算 AI/Bot](/images/articles/analytics-sampling-trap-architecture.svg)


三個數字都是自己算出來的，不靠 Cloudflare 的估算。做法跟 Google Analytics、Plausible、Umami 這類網站流量分析工具的原理一樣。在網頁裡埋一段追蹤碼，自己數人頭，每一個都算到。只是我不需要額外裝第三方工具，直接跑在網站既有的伺服器上就行。

## 你的數據可能會誤導你

2025 年，自動化流量首次超過人類活動，佔全球網路流量的 51%。AI crawler 的爬取量在同一年增長了超過 15 倍。你的網站不只被人類讀，也被機器讀。

如果你的網站用的是 Cloudflare Web Analytics 的 free plan，而且日訪客在幾百以下，儀表板上的 visits 數字，很可能跟我一樣，是取樣後的估算值，不是精確值。

這不代表 Cloudflare 不好用。它的 CDN、DNS、安全防護在業界頂尖。Web Analytics 的 Dashboard UI 數字是準的。但如果你要用 API 把數據拉到自己的儀表板，在低流量場景下，你需要自己驗證一次。拿 API 回傳的數字跟 Dashboard 比對，五分鐘就能知道答案。

當數據落差過大時，網站經營者可能需要回到更直接的方法，自己建立精確的訪問計數機制。這不是因為 Cloudflare 不值得信任，而是因為取樣在流量規模還小的時候，先天就容易失準。隨著受眾規模擴大，取樣的精度自然會逐步提升；但也正是在流量仍在成長的階段，精確數字最不可或缺，因為那正是判斷方向與調整策略的關鍵時刻。

網站經營不能只靠感覺，數據就像健康檢查報告。若連最基本的觸及人數都無法準確掌握，就如同對自己的體重、體脂與生理指標一無所知，所謂的改善與成長，也就很難建立在清楚而有根據的判斷之上。
