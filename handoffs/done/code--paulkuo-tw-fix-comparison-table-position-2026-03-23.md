# code--paulkuo-tw-fix-comparison-table-position-2026-03-23.md

## 背景

比較表格（312004f）插在了錯誤的位置——目前在「把 autoresearch 的精神搬到網站上」段落中間，應該放在文章末尾「系統實際架構」兩張圖之後。另外表格沒有隔線，可能是 CSS 沒生效。

---

## Step 0 偵察

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 0-1 確認目前狀態
git status --short
git log --oneline -3

# 0-2 找到表格目前的位置（四語言）
grep -n "面向.*Karpathy" src/content/articles/ai-ready-continuous-optimization.md
grep -n "Aspect.*Karpathy" src/content/articles/en/ai-ready-continuous-optimization.md
grep -n "観点.*Karpathy" src/content/articles/ja/ai-ready-continuous-optimization.md
grep -n "面向.*Karpathy" src/content/articles/zh-cn/ai-ready-continuous-optimization.md

# 0-3 找到目標位置：「系統實際架構」兩張圖之後的位置
grep -n "ai-ready-opt-eval-scoring" src/content/articles/ai-ready-continuous-optimization.md
grep -n "ai-ready-opt-eval-scoring" src/content/articles/en/ai-ready-continuous-optimization.md
grep -n "ai-ready-opt-eval-scoring" src/content/articles/ja/ai-ready-continuous-optimization.md
grep -n "ai-ready-opt-eval-scoring" src/content/articles/zh-cn/ai-ready-continuous-optimization.md

# 0-4 找到「我不是把 autoresearch 原封不動搬過來」那句（表格上方的導言也要一起搬）
grep -n "不是把 autoresearch 原封不動" src/content/articles/ai-ready-continuous-optimization.md
grep -n "didn't just copy\|not simply transplanting" src/content/articles/en/ai-ready-continuous-optimization.md

# 0-5 確認 global.css 的 table CSS 存在
grep -n "article-body table" public/styles/global.css

# 0-6 確認文章的 HTML 是否被 article-body class 包住
grep -n "article-body" src/components/ArticlePage.astro
```

---

## 任務

用 Python 腳本處理四語言檔案，每個檔案做兩件事：

1. **剪下**：把導言（「下面整理我這次實作與...」）+ 整張表格從目前位置移除
2. **貼到**：`ai-ready-opt-eval-scoring` 那張圖片之後（即「系統實際架構」區塊的最後）

### 邏輯

每個語言檔案：
- 找到導言起始行（zh-TW: `下面整理我這次實作`、en: `Here's a comparison`、ja: `ここで、今回の実装`、zh-CN: `下面整理我这次实作`）
- 找到表格結束行（最後一個 `|` 開頭的行之後的空行）
- 整塊剪下（含導言前後空行）
- 找到 `ai-ready-opt-eval-scoring` 那行
- 在該行之後插入一個空行 + 導言 + 表格 + 空行

### Python 腳本

```python
#!/usr/bin/env python3
"""Move comparison tables to end of 系統實際架構 section in 4 language versions."""
import re

BASE = "/Users/apple/Desktop/01_專案進行中/paulkuo.tw/src/content/articles"

# (filepath, intro_anchor, table_header_anchor, insert_after_anchor)
tasks = [
    (
        f"{BASE}/ai-ready-continuous-optimization.md",
        "下面整理我這次實作與",
        "| 面向 |",
        "ai-ready-opt-eval-scoring",
    ),
    (
        f"{BASE}/en/ai-ready-continuous-optimization.md",
        "Here's a comparison",
        "| Aspect |",
        "ai-ready-opt-eval-scoring",
    ),
    (
        f"{BASE}/ja/ai-ready-continuous-optimization.md",
        "ここで、今回の実装",
        "| 観点 |",
        "ai-ready-opt-eval-scoring",
    ),
    (
        f"{BASE}/zh-cn/ai-ready-continuous-optimization.md",
        "下面整理我这次实作",
        "| 面向 |",
        "ai-ready-opt-eval-scoring",
    ),
]

for filepath, intro_anchor, header_anchor, insert_anchor in tasks:
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Step 1: Find the intro line
    intro_start = None
    for i, line in enumerate(lines):
        if intro_anchor in line:
            intro_start = i
            break

    if intro_start is None:
        print(f"⚠️ Intro not found in {filepath}")
        continue

    # Step 2: Find the end of the table (last line starting with |)
    table_end = intro_start
    in_table = False
    for i in range(intro_start, len(lines)):
        stripped = lines[i].strip()
        if stripped.startswith("|"):
            in_table = True
            table_end = i
        elif in_table and not stripped.startswith("|") and stripped == "":
            # Empty line after table = end
            table_end = i
            break

    # Include blank line before intro if exists
    block_start = intro_start
    if block_start > 0 and lines[block_start - 1].strip() == "":
        block_start -= 1

    # Extract the block
    table_block = lines[block_start:table_end + 1]

    # Step 3: Remove the block from original position
    new_lines = lines[:block_start] + lines[table_end + 1:]

    # Step 4: Find insert position (after ai-ready-opt-eval-scoring image line)
    insert_after = None
    for i, line in enumerate(new_lines):
        if insert_anchor in line:
            insert_after = i
            break

    if insert_after is None:
        print(f"⚠️ Insert anchor not found in {filepath}")
        continue

    # Insert after the image line (skip any blank line right after it)
    insert_pos = insert_after + 1
    # Skip immediate blank line after image
    if insert_pos < len(new_lines) and new_lines[insert_pos].strip() == "":
        insert_pos += 1

    # Step 5: Insert the block at new position
    final_lines = new_lines[:insert_pos] + ["\n"] + table_block + new_lines[insert_pos:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(final_lines)

    print(f"✅ Moved table in {filepath}")

print("Done. Review with git diff.")
```

---

## 驗證

```bash
# 確認表格位置在 eval-scoring 圖片之後
for f in src/content/articles/ai-ready-continuous-optimization.md src/content/articles/en/ai-ready-continuous-optimization.md src/content/articles/ja/ai-ready-continuous-optimization.md src/content/articles/zh-cn/ai-ready-continuous-optimization.md; do
  echo "=== $f ==="
  grep -n "eval-scoring\|面向.*Karpathy\|Aspect.*Karpathy\|観点.*Karpathy" "$f"
done

# eval-scoring 的行號應該要小於表格的行號

# 確認「把 autoresearch 的精神搬到網站上」段落裡已經沒有表格
grep -A2 "autoresearch 目前專注在小型語言模型" src/content/articles/ai-ready-continuous-optimization.md

# git diff 確認
git diff --stat
```

---

## CSS 除錯

如果表格搬到正確位置後仍然沒有隔線，檢查：

```bash
# 確認 ArticlePage.astro 裡的 article-body class
grep -n "article-body" src/components/ArticlePage.astro

# 確認 global.css 有 table styles
grep -n "\.article-body table" public/styles/global.css
```

如果 Markdown 表格沒有被 `.article-body` 包住，table CSS 就不會生效。Astro 的 Markdown content 渲染出來的 HTML 結構需要確認是否在 `.article-body` div 內。

可能的修法：
- 如果 `ArticlePage.astro` 的 `<slot />` 沒有被 `.article-body` 包住 → 加上
- 或者把 CSS selector 改成不依賴 `.article-body`（但要注意別影響其他表格）

---

## Commit + Push

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git add \
  src/content/articles/ai-ready-continuous-optimization.md \
  src/content/articles/en/ai-ready-continuous-optimization.md \
  src/content/articles/ja/ai-ready-continuous-optimization.md \
  src/content/articles/zh-cn/ai-ready-continuous-optimization.md \
&& git commit -m 'fix(article): move comparison table to end of system architecture section (4 langs) [skip-translate]' \
&& git push origin main
```

> ⚠️ 如果 CSS 也改了，記得加到 git add
> ⚠️ 完成後刪除 Python 腳本
> ⚠️ push 被拒：`git stash && git pull --rebase origin main && git push && git stash pop`

---

## 注意事項

- ⚠️ Repo 路徑是 `~/Desktop/01_專案進行中/paulkuo.tw`
- ⚠️ commit + push 用 `&&` 串聯（cron stash/pop 風險）
- ⚠️ 用 Python 腳本操作，不用 osascript
- ⚠️ 搬移時注意保留表格前後的空行，否則 Markdown 渲染會出問題

---

## 回報格式

完成後回報：
1. 四個檔案的 grep 行號（確認表格在 eval-scoring 之後）
2. CSS 是否生效（如果有改 CSS 一併回報）
3. commit hash
4. push 結果
