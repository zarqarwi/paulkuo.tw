---
title: "我做了一個追蹤 Claude 用量的 Chrome Extension"
subtitle: "工作到一半被 rate limit 擋下來，所以我做了一隻橘虎斑來盯著用量。"
description: "一個同時跑官方用量 API 和即時 token 攔截的 Chrome Extension 開發紀實，從市場調研到三語國際化的完整過程。"
abstract: |
  Claude 重度使用者最怕的就是聊到一半撞 rate limit。市場上有十幾個用量追蹤工具，但幾乎全是 macOS 原生 app、只追蹤單一資料來源、沒有中文介面。這篇記錄我用 Claude 協作開發一個 Chrome Extension 的過程——同時跑官方 API 和即時 token 攔截兩條管道，讓用量差異可見。從踩坑 isolated world、猜 API 格式、到 icon 迭代三版，完整的開發體感。
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

工作到一半被 rate limit 擋下來，大概是 Claude 使用者最煩的時刻。

我原本的習慣，是到被擋了才去 Settings 頁面看用量，然後才發現額外用量已經 84%、七天用量也過半了。就想，這個數字如果可以在畫面上該多好？

所以我做了一個 Chrome Extension 來解決這件事。叫「Claude 用量喵喵」，工具列上蹲著一隻橘虎斑，點一下就知道用多少額度。

## 它做什麼

裝上之後有三個地方可以看到用量：

工具列上的橘貓 icon 會顯示一個小 badge，每四秒自動輪播切換——五小時 session 用了多少、七天用了多少、額外 credits 剩多少、即時花費多少錢。綠色代表安全，黃色要注意，橘色快到了，紅色快爆了。不用點開任何東西，瞄一眼就知道。

點開 popup 會看到完整的用量卡片。上半部是 Anthropic 官方的數字：五小時 session 百分比、七天用量百分比、額外用量的已用跟上限，每一項都有重置倒數。下半部是即時 token 追蹤：你剛才那則對話用了多少 input token、多少 output token、花了多少錢，用的是哪個模型，全部列出來。

claude.ai 頁面的右下角還有一條半透明的浮動狀態條，常駐顯示用量摘要。點貓頭可以收合。

![Claude 用量喵喵的 popup 介面，顯示官方用量和即時 token 追蹤](/images/articles/claude-usage-nyan-popup.png)
*popup 點開的完整畫面：上半部是官方用量，下半部是即時 token 追蹤。*

## 兩條管道，看差異

這個工具跟其他追蹤器最不同的地方是它同時跑兩條資料管道。

第一條是官方的。Extension 每五分鐘去呼叫一次 claude.ai 的 usage API，拿回來的數字跟你自己去 Settings 頁面看的一模一樣。這個數字是權威的，但有延遲——Anthropic 那邊的更新不是即時的，有時候你明明已經用了很多，百分比還是不動。

第二條是即時推算的。Extension 會在 claude.ai 的頁面裡攔截每一次你跟 Claude 對話的 API 呼叫，在 request 送出去的時候估算 input token，在 response streaming 回來的時候累加 output token，再根據模型價格算費用。這個是即時的，但是估算值，跟官方數字會有誤差。

兩者並排放在一起，你可以自己觀察官方的百分比跟你實際燒掉的 token 差多少。做這個工具的目的之一就是讓這個差異可見。

## 動手之前先查了一圈

在開始寫程式之前，我有先調查市場上現有的工具。

結果是這個小工具已經很多，光我找到的就超過十個。但幾乎全部都是 macOS 的原生 app，要下載 .dmg 安裝，Windows 跟 Linux 使用者沒得選。而且大部分只做官方用量追蹤或即時 token 計算其中一個，沒有人把兩個放在一起。所有介面都是英文，亞洲市場完全沒有在地化的選項。

所以我的定位就很明確了：做成 Chrome Extension 讓它跨平台、兩條管道同時跑、中文優先。後來還加了英文和日文的介面，Chrome 會根據瀏覽器語言自動切換。

## 開發過程踩到的幾個坑（對技術沒興趣可直接省略）

整個開發我是跟 Claude 對話完成的，過程不是一帆風順。

第一個坑是 API 格式。Anthropic 的 usage API 沒有公開文件，我只能猜格式。第一次接上去，popup 噴出一坨 raw JSON。但這坨 JSON 本身就是答案——我看到 five_hour.utilization、seven_day.resets_at 這些欄位名稱，馬上就知道怎麼解析了。所以 "Claude" 故意在 popup 裡留了一個 debug 模式：如果解析失敗就直接顯示原始 JSON，這樣未來 API 格式變了也能快速修。

第二個坑比較有趣。Chrome Extension 的 content script 跑在一個叫 isolated world 的隔離環境裡，我在裡面 patch 了 window.fetch 想攔截 claude.ai 的 API 呼叫，結果什麼都攔截不到。花了一點時間才搞清楚：isolated world 的 window 跟頁面本身的 window 是不同的物件。解法是用 Chrome MV3 的 world: "MAIN" 設定，把攔截腳本直接注入到頁面的 context 裡，再透過 CustomEvent 把資料傳回 isolated world 的橋接層。一個問題拆成兩層解決。

第三個坑是 icon。迭代了三版——第一版太普通，第二版塞進圓形裡看不出是貓，第三版我丟了一張橘虎斑的照片當參考，指定要「耳朵往外張開、有 M 字額紋」，才對味。這種事很難用規格描述，給一張參考圖比說一百句有用。

## 限制先說清楚

Anthropic 的 usage API 沒有公開文件，格式隨時可能改。改了這個 Extension 就要跟著更新，沒人維護就會壞。即時 token 是估算值，不是精確數字。英文大約四個字元一個 token，中文大約 1.5 個字元，這跟 Anthropic 實際的 tokenizer 有落差。

只追蹤 claude.ai 網頁版。如果你用的是 Claude Code CLI，那走的是不同的通道，這個 Extension 抓不到。

Extension 需要讀取 claude.ai 的 session cookie 來存取 API。所有資料只存在你的瀏覽器本機，不傳到任何外部伺服器，完整開源。但裝任何 Extension 之前自己判斷風險是基本的。

---

安裝方式很簡單：clone GitHub repo、Chrome 開發者模式、載入資料夾，三步。支援繁中、英文、日文介面。

🔗 https://github.com/zarqarwi/claude-usage-nyan
