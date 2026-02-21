#!/usr/bin/env python3
"""
debate-to-article.py — 辯論引擎產出 → paulkuo.tw 文章轉換器

使用方式：
  python3 scripts/debate-to-article.py                     # 互動選擇最新辯論
  python3 scripts/debate-to-article.py --file <path>       # 指定辯論檔
  python3 scripts/debate-to-article.py --list              # 列出所有辯論檔
  python3 scripts/debate-to-article.py --dry-run           # 預覽不寫檔

需要環境變數：
  ANTHROPIC_API_KEY — Claude API 金鑰（從 ~/.zshrc 讀取）

產出：
  src/content/articles/<slug>.md — 符合 Astro content collection schema 的文章
"""

import os
import sys
import re
import json
import subprocess
from pathlib import Path
from datetime import datetime

# ── 路徑設定 ──────────────────────────────────────────
DEBATES_DIR = Path.home() / "Desktop" / "02_參考資料" / "debates"
ARTICLES_DIR = Path.home() / "Desktop" / "01_專案進行中" / "paulkuo-astro" / "src" / "content" / "articles"

# ── 從 .zshrc 載入環境變數 ────────────────────────────
def load_env():
    for rc in [".zshrc", ".zshenv", ".zprofile"]:
        rc_path = Path.home() / rc
        if rc_path.exists():
            for line in rc_path.read_text().splitlines():
                m = re.match(r'^export\s+(\w+)=["\']?([^"\']+)["\']?', line)
                if m:
                    os.environ.setdefault(m.group(1), m.group(2))

load_env()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


# ── 柱子偵測 ──────────────────────────────────────────
PILLAR_KEYWORDS = {
    "ai": ["AI", "人工智慧", "機器學習", "LLM", "GPT", "演算法", "自動化", "Agent",
           "神經網路", "深度學習", "Hinton", "OpenAI", "算力", "智慧", "數位"],
    "circular": ["循環", "再生", "回收", "碳", "永續", "CircleFlow", "ESG",
                 "廢棄物", "資源", "PCB", "金屬回收"],
    "faith": ["神學", "信仰", "道成肉身", "教會", "聖經", "基督", "文明",
              "人性", "倫理", "Logos", "Sarx", "incarnation"],
    "startup": ["創業", "新創", "商業模式", "融資", "AppWorks", "SDTI",
                "市場", "產品", "半導體", "台日合作"],
    "life": ["人生", "記憶", "沉思", "日記", "反思", "生活", "家庭",
             "教育", "自學", "成長"],
}

def detect_pillar(text: str) -> str:
    scores = {}
    text_lower = text.lower()
    for pillar, keywords in PILLAR_KEYWORDS.items():
        scores[pillar] = sum(1 for kw in keywords if kw.lower() in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "ai"


# ── slug 產生 ─────────────────────────────────────────
def make_slug(title: str) -> str:
    """從中文標題產生英文 slug（簡單映射）"""
    # 移除標點
    clean = re.sub(r'[：。，、？！「」（）《》【】\s]+', ' ', title).strip()
    # 用底線連接中文詞，最後轉小寫 kebab-case
    # 這裡用簡單策略：取前幾個關鍵詞拼音或英文
    words = clean.split()
    slug_parts = []
    for w in words[:8]:
        if re.match(r'^[a-zA-Z0-9-]+$', w):
            slug_parts.append(w.lower())
        else:
            slug_parts.append(w)
    slug = "-".join(slug_parts)
    # 最後清理
    slug = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fff-]', '', slug)
    return slug[:80] if slug else f"debate-{datetime.now().strftime('%Y%m%d')}"


# ── 費用追蹤 ───────────────────────────────
def _log_cost_jsonl(service, model, action, source, input_tokens=0, output_tokens=0, cost_usd=None, note=""):
    pricing = {"claude-sonnet": (3.0, 15.0), "gpt-4o": (2.5, 10.0)}
    p = pricing.get(model, (0, 0))
    if cost_usd is None:
        cost_usd = (input_tokens / 1_000_000) * p[0] + (output_tokens / 1_000_000) * p[1]
    record = {
        "timestamp": datetime.now().isoformat(),
        "service": service, "model": model,
        "action": action, "source": source,
        "inputTokens": input_tokens, "outputTokens": output_tokens,
        "costUSD": round(cost_usd, 6),
        "costTWD": round(cost_usd * 32.5, 2),
        "note": note,
    }
    cost_file = Path(__file__).parent.parent / "data" / "costs.jsonl"
    cost_file.parent.mkdir(parents=True, exist_ok=True)
    with open(cost_file, "a") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

# ── Claude API 呼叫 ──────────────────────────────────
def call_claude(debate_content: str, debate_filename: str) -> dict:
    """用 Claude 將辯論紀錄轉成文章格式"""
    if not ANTHROPIC_API_KEY:
        print("❌ ANTHROPIC_API_KEY 未設定。請設定環境變數後再試。")
        print("   export ANTHROPIC_API_KEY='sk-ant-...'")
        sys.exit(1)
    import urllib.request

    prompt = f"""你是 Paul Kuo（郭曜郎）的寫作助理。Paul 經營 paulkuo.tw 個人網站，主題是「在技術與文明的交匯處，重建秩序」。

以下是一份多模型辯論/對話的紀錄。請將它轉化為一篇適合發佈在 paulkuo.tw 的深度文章。

轉化規則：
1. **不是摘要**——要重新整理成一篇有論述結構的文章，用 Paul 的第一人稱「我」來寫
2. **保留多元觀點的精華**，但不要出現「Gemini 說」「GPT 說」這種引用格式。把多模型的觀點融入論述中
3. **保留軍師點評的核心洞察**，自然融入文章結論
4. **字數控制在 2000-3000 字**，不要太短也不要拖沓
5. **文風**：知識分子的反思性寫作，有深度但不學究。像 Paul 平常寫的文章一樣
6. **結構**：開頭提出問題 → 展開多角度分析 → 收束為個人立場或行動建議

請以 JSON 格式回覆，包含以下欄位：
{{
  "title": "文章標題（繁體中文，簡潔有力）",
  "subtitle": "副標題（一句話點出核心張力）",
  "description": "SEO 描述（100-150字，概括文章重點）",
  "pillar": "從 ai/circular/faith/startup/life 五選一",
  "tags": ["標籤1", "標籤2", ...],  // 5-8 個
  "slug": "english-kebab-case-slug",
  "body": "完整的 Markdown 文章正文（不含 frontmatter）"
}}

只輸出 JSON，不要其他文字。

---
辯論紀錄檔名：{debate_filename}

{debate_content}"""

    payload = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 8192,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()

    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        },
    )

    print("   🤖 呼叫 Claude API 轉換中...")
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read())

    # 費用追蹤
    usage = data.get("usage", {})
    _log_cost_jsonl(
        service="anthropic", model="claude-sonnet",
        action="debate-to-article", source="debate-to-article",
        input_tokens=usage.get("input_tokens", 0),
        output_tokens=usage.get("output_tokens", 0),
    )

    text = data["content"][0]["text"]

    # 清理可能的 code fence
    if text.startswith("```"):
        text = re.sub(r'^```(?:json)?\n?', '', text)
        text = re.sub(r'\n?```$', '', text)

    return json.loads(text)


# ── 列出辯論檔 ────────────────────────────────────────
def list_debates():
    files = sorted(DEBATES_DIR.glob("*.md"), key=lambda f: f.stat().st_mtime, reverse=True)
    # 排除 backup/raw 檔
    files = [f for f in files if "_raw" not in f.name and "_backup" not in f.name]
    return files


def print_debate_list(files):
    print(f"\n📁 辯論紀錄（{DEBATES_DIR}）\n")
    for i, f in enumerate(files, 1):
        mtime = datetime.fromtimestamp(f.stat().st_mtime).strftime("%m/%d %H:%M")
        size_kb = f.stat().st_size // 1024
        name = f.stem[:60]
        print(f"  {i:2d}. [{mtime}] {name}  ({size_kb}KB)")
    print()


# ── 主程式 ────────────────────────────────────────────
def main():
    import argparse
    parser = argparse.ArgumentParser(description="辯論引擎 → paulkuo.tw 文章轉換器")
    parser.add_argument("--file", "-f", help="指定辯論檔路徑")
    parser.add_argument("--list", "-l", action="store_true", help="列出所有辯論檔")
    parser.add_argument("--dry-run", "-d", action="store_true", help="預覽不寫檔")
    parser.add_argument("--number", "-n", type=int, help="選擇第 N 個辯論檔（搭配 --list 看編號）")
    args = parser.parse_args()

    files = list_debates()

    if args.list:
        print_debate_list(files)
        return

    # 決定要轉哪一篇
    target = None
    if args.file:
        target = Path(args.file)
        if not target.exists():
            print(f"❌ 找不到檔案: {target}")
            sys.exit(1)
    elif args.number:
        if 1 <= args.number <= len(files):
            target = files[args.number - 1]
        else:
            print(f"❌ 編號超出範圍 (1-{len(files)})")
            sys.exit(1)
    else:
        # 互動選擇
        print_debate_list(files)
        try:
            choice = input("選擇要轉換的辯論編號 (Enter = 最新): ").strip()
            if not choice:
                target = files[0]
            else:
                idx = int(choice) - 1
                if 0 <= idx < len(files):
                    target = files[idx]
                else:
                    print("❌ 編號超出範圍")
                    sys.exit(1)
        except (ValueError, KeyboardInterrupt):
            print("\n取消")
            sys.exit(0)

    print(f"\n📄 選定: {target.name}")
    content = target.read_text(encoding="utf-8")
    print(f"   大小: {len(content):,} 字元")

    # 呼叫 Claude 轉換
    result = call_claude(content, target.name)

    title = result["title"]
    slug = result.get("slug", make_slug(title))
    pillar = result.get("pillar", detect_pillar(content))
    tags = result.get("tags", [])
    subtitle = result.get("subtitle", "")
    description = result.get("description", "")
    body = result["body"]

    # 從辯論檔名提取日期
    date_match = re.search(r'(\d{8})_\d{6}', target.name)
    if date_match:
        date_str = datetime.strptime(date_match.group(1), "%Y%m%d").strftime("%Y-%m-%d")
    else:
        date_str = datetime.now().strftime("%Y-%m-%d")

    # 組裝 frontmatter
    tags_str = json.dumps(tags, ensure_ascii=False)
    frontmatter = f"""---
title: "{title}"
subtitle: "{subtitle}"
description: "{description}"
date: {date_str}
pillar: {pillar}
tags: {tags_str}
platform: "Debate Engine"
featured: false
draft: false
---"""

    article_md = f"{frontmatter}\n\n{body}\n"

    # 輸出
    print(f"\n{'─' * 60}")
    print(f"   📝 標題: {title}")
    print(f"   📂 柱子: {pillar}")
    print(f"   🏷️  標籤: {', '.join(tags)}")
    print(f"   📅 日期: {date_str}")
    print(f"   🔗 Slug: {slug}")
    print(f"   📏 正文: {len(body):,} 字元")
    print(f"{'─' * 60}")

    if args.dry_run:
        print("\n🔍 Dry run — 前 500 字預覽：")
        print(article_md[:500])
        print("...")
        return

    # 寫檔
    out_path = ARTICLES_DIR / f"{slug}.md"
    if out_path.exists():
        confirm = input(f"\n⚠️  {out_path.name} 已存在，覆蓋？(y/N): ").strip().lower()
        if confirm != "y":
            print("取消")
            return

    out_path.write_text(article_md, encoding="utf-8")
    print(f"\n✅ 文章已產生: {out_path}")
    print(f"   下一步: cd ~/Desktop/01_專案進行中/paulkuo-astro && git add -A && git commit -m 'feat: {slug}' && git push")


if __name__ == "__main__":
    main()
