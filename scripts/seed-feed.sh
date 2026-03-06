#!/bin/bash
# seed-feed.sh — 填入初始 feed 資料到 Worker KV
# 用法: ADMIN_CODE=你的admin碼 bash seed-feed.sh
#
# 這些是不同平台、不同內容的代表性貼文
# 之後由 social-poster 自動更新

WORKER="https://paulkuo-ticker.paul-4bf.workers.dev/feed/push"
CODE="${ADMIN_CODE:?請設定 ADMIN_CODE 環境變數}"

echo "🌱 Seeding feed data..."

# X — 短觀點
curl -s -X POST "$WORKER" -H 'Content-Type: application/json' -d "{
  \"code\": \"$CODE\",
  \"platform\": \"X\",
  \"icon\": \"𝕏\",
  \"color\": \"#1DA1F2\",
  \"content\": \"AI 的價值不在給標準答案，在幫你看見沒想到的角度。讓人當人工具當工具。\",
  \"url\": \"https://x.com/zarqarwi\",
  \"datetime\": \"2026-03-05 14:10\",
  \"category\": \"ai\"
}" && echo " ✅ X"

# LinkedIn — 專業分析
curl -s -X POST "$WORKER" -H 'Content-Type: application/json' -d "{
  \"code\": \"$CODE\",
  \"platform\": \"LinkedIn\",
  \"icon\": \"in\",
  \"color\": \"#0A66C2\",
  \"content\": \"循環經濟不是回收的升級版，是整個產業邏輯的重新設計。當我們把『廢棄物』重新定義為『錯置的資源』，商業模式就會跟著翻轉。\",
  \"url\": \"https://www.linkedin.com/in/paulkuo\",
  \"datetime\": \"2026-03-04 10:30\",
  \"category\": \"circular\"
}" && echo " ✅ LinkedIn"

# Threads — 日常思考
curl -s -X POST "$WORKER" -H 'Content-Type: application/json' -d "{
  \"code\": \"$CODE\",
  \"platform\": \"Threads\",
  \"icon\": \"◉\",
  \"color\": \"#000000\",
  \"content\": \"寫了一整天的程式，突然想到：我們花這麼多時間教 AI 理解人類，有花同樣的時間理解彼此嗎？\",
  \"url\": \"https://www.threads.net/@zarqarwi\",
  \"datetime\": \"2026-03-03 22:15\",
  \"category\": \"life\"
}" && echo " ✅ Threads"

# YouTube — 影片
curl -s -X POST "$WORKER" -H 'Content-Type: application/json' -d "{
  \"code\": \"$CODE\",
  \"platform\": \"YouTube\",
  \"icon\": \"▶\",
  \"color\": \"#FF0000\",
  \"content\": \"【超級學習者的 6 個能力模組】AI 讓知識唾手可得，但真正的學習能力更稀缺了。\",
  \"url\": \"https://www.youtube.com/@kuopaul8265\",
  \"datetime\": \"2026-03-02 15:00\",
  \"category\": \"ai\"
}" && echo " ✅ YouTube"

# Bluesky
curl -s -X POST "$WORKER" -H 'Content-Type: application/json' -d "{
  \"code\": \"$CODE\",
  \"platform\": \"Bluesky\",
  \"icon\": \"🦋\",
  \"color\": \"#0085FF\",
  \"content\": \"道必須成為肉身，秩序必須進入現場。技術落地不是口號，是每天的選擇。\",
  \"url\": \"https://bsky.app/profile/paulkuo.bsky.social\",
  \"datetime\": \"2026-03-01 18:40\",
  \"category\": \"faith\"
}" && echo " ✅ Bluesky"

# Instagram
curl -s -X POST "$WORKER" -H 'Content-Type: application/json' -d "{
  \"code\": \"$CODE\",
  \"platform\": \"Instagram\",
  \"icon\": \"📷\",
  \"color\": \"#E4405F\",
  \"content\": \"台日橋接不只是商業合作，是兩種精緻文化的對話。每次跨境專案都在重新理解什麼是『信任』。\",
  \"url\": \"https://www.instagram.com/zarqarwi\",
  \"datetime\": \"2026-02-28 16:20\",
  \"category\": \"startup\"
}" && echo " ✅ Instagram"

# Facebook
curl -s -X POST "$WORKER" -H 'Content-Type: application/json' -d "{
  \"code\": \"$CODE\",
  \"platform\": \"Facebook\",
  \"icon\": \"📘\",
  \"color\": \"#1877F2\",
  \"content\": \"阿哥拉廣場翻譯工具上線了！支援 12 種語言即時翻譯，用 Deepgram + Claude Haiku 打造，歡迎來試。\",
  \"url\": \"https://www.facebook.com/guo.yao.lang.2025\",
  \"datetime\": \"2026-02-27 11:00\",
  \"category\": \"startup\"
}" && echo " ✅ Facebook"

echo ""
echo "🎉 Feed seeded! 驗證: curl $WORKER/../feed | jq .items[].platform"
