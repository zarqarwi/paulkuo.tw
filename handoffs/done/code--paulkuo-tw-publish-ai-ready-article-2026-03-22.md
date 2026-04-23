# code--paulkuo-tw-publish-ai-ready-article-2026-03-22.md

## 背景

Chat session 已完成文章「把 paulkuo.tw 變成一個自己進化的網站」的完整 Pipeline：
- FM 17 欄位補齊 ✅
- L1 素材查證 ✅（3 項修正已套用）
- L2 成稿查證 + 引用 spot check ✅（零 corrected）
- 四語言翻譯 ✅（zh-TW / en / ja / zh-cn）
- 品質檢查清單 14/15 ✅（差封面圖，由本 handoff 執行）

本 handoff 要完成的事：封面圖生成 → 手繪圖搬移 → 四語言文章寫入 → commit + push。

---

## Step 0 偵察

開始前先確認：

```bash
# 1. 確認 repo 最新狀態
cd ~/Desktop/01_專案進行中/paulkuo.tw  # 或 Paul 的 repo 路徑，先 ls 確認
git status
git log --oneline -3

# 2. 確認目標路徑存在
ls src/content/articles/
ls src/content/articles/en/
ls src/content/articles/ja/
ls src/content/articles/zh-cn/
ls public/images/covers/
ls public/images/articles/

# 3. 確認沒有同名檔案衝突
ls src/content/articles/ai-ready-continuous-optimization.md 2>/dev/null && echo "⚠️ 已存在" || echo "✅ 不存在，可寫入"

# 4. 確認 OPENAI_API_KEY 可用
echo $OPENAI_API_KEY | head -c 8
```

---

## Step 1：封面圖生成

建立暫存 Python 腳本，呼叫 DALL-E 3 API：

```bash
cat > /tmp/gen_cover_ai_ready.py << 'PYEOF'
import os, openai, ssl, urllib.request
from subprocess import run

ssl._create_default_https_context = ssl._create_unverified_context
client = openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

response = client.images.generate(
    model='dall-e-3',
    prompt='''Create a clean, modern digital illustration. Style: flat design with subtle depth.
Color palette: deep navy #1a1a3e base, electric blue #4A90D9 and neon purple #8B5CF6 accents, white highlights.
Subject: A continuous optimization loop visualized as a luminous circular flow — code fragments entering from one side, passing through evaluation gates (represented as geometric checkpoints), with some paths branching forward (kept) and others gracefully curving back (reverted). At the center, a small glowing website icon pulses as the hub of the cycle. Subtle neural network patterns in the background suggest AI intelligence driving the process.
Composition: centered, with breathing room. No text, no watermarks, no letters, no numbers.
Mood: forward-looking, methodical, quietly ambitious.
Size: 1792x1024, landscape orientation.''',
    size='1792x1024',
    quality='hd',
    n=1
)

url = response.data[0].url
urllib.request.urlretrieve(url, '/tmp/cover_ai_ready.png')
print(f'Downloaded: {url[:80]}...')
print('Converting to JPG...')

# 注意：這裡的目標路徑要換成實際 repo 路徑
run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85',
     '/tmp/cover_ai_ready.png', '--out',
     os.path.expanduser('~/Desktop/01_專案進行中/paulkuo.tw/public/images/covers/ai-ready-continuous-optimization.jpg')])
print('DONE - cover image saved')
PYEOF
```

執行：

```bash
/bin/zsh -l -c 'python3 /tmp/gen_cover_ai_ready.py 2>&1'
```

驗證：

```bash
ls -la public/images/covers/ai-ready-continuous-optimization.jpg
# 應該 > 100KB，1792x1024
sips -g pixelWidth -g pixelHeight public/images/covers/ai-ready-continuous-optimization.jpg
```

⚠️ **已知坑**：
- osascript 環境不讀 `.zshrc`，需用 `/bin/zsh -l -c '...'`
- Python 3.13 SSL 需要 `ssl._create_default_https_context` workaround
- openai SDK 在 user site-packages，系統 Python 找不到
- 如果路徑不對，先 `find ~/Desktop -name "paulkuo.tw" -type d` 確認

---

## Step 2：手繪圖搬移

Paul 的手繪流程圖 `IMG_2930.JPG` 需要放到文章圖片路徑。

先找到這張圖（可能在 Downloads 或 Desktop）：

```bash
# 找圖片
find ~/Desktop ~/Downloads -name "IMG_2930.JPG" 2>/dev/null

# 複製到目標路徑（壓縮一下）
sips -s format jpeg -s formatOptions 85 -Z 1200 {找到的路徑}/IMG_2930.JPG \
  --out public/images/articles/ai-ready-continuous-optimization-flow.jpg

# 驗證
ls -la public/images/articles/ai-ready-continuous-optimization-flow.jpg
```

---

## Step 3：四語言文章寫入

Chat session 已產出四個語言版本的完整 markdown 檔案（含 FM + 正文）。

檔案來源：Chat outputs 中的四個檔案。Paul 需要將這四個檔案提供給 Code session（或貼入）。

目標路徑：

```
src/content/articles/ai-ready-continuous-optimization.md              ← zh-TW
src/content/articles/en/ai-ready-continuous-optimization.md           ← English
src/content/articles/ja/ai-ready-continuous-optimization.md           ← 日本語
src/content/articles/zh-cn/ai-ready-continuous-optimization.md        ← 簡體中文
```

寫入方式：直接用 `cat > {path} << 'EOF'` 或從 Chat outputs 複製貼上。

⚠️ **注意**：四個檔案都已包含完整 FM 17 欄位 + 正文，直接寫入即可，不需要額外處理。

---

## Step 4：Commit + Push

```bash
# 部署前檢查
grep -rn "<<<<<<" src/content/articles/ai-ready-continuous-optimization.md || echo "✅ no conflicts"

# 確認所有檔案到位
echo "--- checking files ---"
ls -la src/content/articles/ai-ready-continuous-optimization.md
ls -la src/content/articles/en/ai-ready-continuous-optimization.md
ls -la src/content/articles/ja/ai-ready-continuous-optimization.md
ls -la src/content/articles/zh-cn/ai-ready-continuous-optimization.md
ls -la public/images/covers/ai-ready-continuous-optimization.jpg
ls -la public/images/articles/ai-ready-continuous-optimization-flow.jpg
echo "--- all checked ---"

# 原子操作 commit + push（cron 每 10 分鐘 stash/pop，必須用 && 串聯）
git add -A && git commit -m "feat: add article — ai-ready-continuous-optimization (4 langs + cover + flow diagram)" && git push origin main
```

---

## Step 5：上線驗證

```bash
# 等 CI/CD 跑完（約 1-2 分鐘），然後：
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/articles/ai-ready-continuous-optimization
# 應該回 200

# 確認圖片
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/images/covers/ai-ready-continuous-optimization.jpg
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/images/articles/ai-ready-continuous-optimization-flow.jpg
```

---

## 驗證方式

1. `git log --oneline -1` 確認 commit 成功
2. `curl` 確認三個 URL 都回 200（文章頁 + 封面圖 + 手繪圖）
3. 瀏覽器開 `https://paulkuo.tw/articles/ai-ready-continuous-optimization` 確認排版正常

---

## 注意事項

- ⚠️ commit + push 必須用 `&&` 串聯一行跑（cron stash/pop 風險）
- ⚠️ 封面圖 Python 腳本用完即刪 `rm /tmp/gen_cover_ai_ready.py`
- ⚠️ 如果 push 卡住，先 `ssh -T git@github.com` 測 SSH，不行就改 HTTPS
- ⚠️ Code session 執行前先通知 Paul，不要自動 push

---

## 回報格式

完成後回報：

```
✅ 封面圖生成：{尺寸} {檔案大小}
✅ 手繪圖搬移：{檔案大小}
✅ 四語言文章寫入：zh-TW / en / ja / zh-cn
✅ commit: {hash}
✅ push: success
✅ 上線驗證：{HTTP status codes}
```
