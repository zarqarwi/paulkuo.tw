#!/usr/bin/env python3
"""
generate_covers.py — 批次為 paulkuo.tw 文章產生 DALL-E 封面圖
存放：~/Desktop/02_參考資料/generate_covers.py
用法：python3 generate_covers.py [--dry-run] [--limit N]

v2 改進 (2026-02-24):
- 冪等性：用 regex 精確檢查 frontmatter 是否已有 cover，不重複插入
- 圖片+frontmatter 雙重檢查：兩者都到位才跳過
- 不自動 commit/push：只產圖+改 frontmatter，由使用者決定何時 push
- billing 失敗自動停止：連續 3 次 billing error 就中斷，不浪費時間
"""

import os, sys, json, time, re, subprocess, urllib.request, datetime, ssl

# SSL workaround for macOS
try:
    _ssl_ctx = ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE
except: _ssl_ctx = None

# === Config ===
ARTICLES_DIR = os.path.expanduser("~/Desktop/01_專案進行中/paulkuo.tw/src/content/articles")
COVERS_DIR = os.path.expanduser("~/Desktop/01_專案進行中/paulkuo.tw/public/images/covers")
COSTS_FILE = os.path.expanduser("~/Desktop/01_專案進行中/paulkuo.tw/data/costs.jsonl")
API_KEY = os.environ.get("OPENAI_API_KEY", "")

COST_PER_IMAGE = 0.080  # DALL-E 3 standard 1792x1024
TWD_RATE = 32.5

PILLAR_THEMES = {
    "ai": {
        "accent": "#2563EB",
        "accent_name": "electric blue",
        "metaphors": "neural networks, circuit patterns, data streams, geometric brain, digital constellation"
    },
    "circular": {
        "accent": "#059669",
        "accent_name": "emerald green",
        "metaphors": "recycling loops, organic cycles, regeneration, urban mining, molecular rebirth"
    },
    "faith": {
        "accent": "#B45309",
        "accent_name": "warm amber",
        "metaphors": "ancient architecture, light through stained glass, sacred geometry, manuscripts, wisdom"
    },
    "startup": {
        "accent": "#DC2626",
        "accent_name": "bold red",
        "metaphors": "building blocks, construction, forge and anvil, launching, blueprints"
    },
    "life": {
        "accent": "#7C3AED",
        "accent_name": "deep purple",
        "metaphors": "contemplation, still water reflection, journaling, solitary path, twilight sky"
    },
}


def parse_frontmatter(filepath):
    """Parse YAML frontmatter from markdown file."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    if not content.startswith("---"):
        return None, content
    end = content.index("---", 3)
    fm_text = content[3:end].strip()
    
    data = {}
    for line in fm_text.split("\n"):
        if ":" in line:
            key = line.split(":")[0].strip()
            val = ":".join(line.split(":")[1:]).strip().strip('"').strip("'")
            data[key] = val
    return data, content


def has_cover_in_frontmatter(filepath):
    """Check if frontmatter already contains a cover field (precise regex)."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    # Match cover: inside frontmatter block only
    m = re.search(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not m:
        return False
    fm = m.group(1)
    return bool(re.search(r'^cover\s*:', fm, re.MULTILINE))


def slug_to_english(slug):
    """Convert slug to readable English phrase."""
    return slug.replace('-', ' ').title()


def build_prompt(title, description, pillar, slug=""):
    """Build DALL-E prompt based on article metadata (English only)."""
    theme = PILLAR_THEMES.get(pillar, PILLAR_THEMES["ai"])
    topic = slug_to_english(slug) if slug else "abstract concept"
    
    prompt = (
        f"Abstract editorial illustration for a blog article about: {topic}. "
        f"Visual metaphor inspired by: {theme['metaphors']}. "
        f"Deep navy blue (#1B2D4F) background with {theme['accent_name']} ({theme['accent']}) accent highlights. "
        f"Clean, minimal, professional editorial style. Abstract and conceptual, not literal. "
        f"No text, no letters, no words, no numbers anywhere in the image. "
        f"Wide cinematic format."
    )
    return prompt


def generate_image(prompt, api_key):
    """Call DALL-E 3 API. Returns (image_url, error_code) tuple."""
    url = "https://api.openai.com/v1/images/generations"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = json.dumps({
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": "1792x1024",
        "quality": "standard",
        "response_format": "url"
    }).encode()
    
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120, context=_ssl_ctx) as resp:
            data = json.loads(resp.read())
            return data["data"][0]["url"], None
    except Exception as e:
        err_body = ""
        err_code = ""
        if hasattr(e, 'read'):
            try:
                err_body = e.read().decode('utf-8')
                err_json = json.loads(err_body)
                err_code = err_json.get("error", {}).get("code", "")
            except: pass
        print(f"  ❌ API error: {e}")
        if err_body:
            print(f"  📋 Detail: {err_body[:300]}")
        return None, err_code


def download_and_convert(image_url, output_path):
    """Download image and convert to JPG using sips."""
    tmp_png = output_path.replace(".jpg", ".tmp.png")
    try:
        req2 = urllib.request.Request(image_url)
        with urllib.request.urlopen(req2, context=_ssl_ctx) as resp2:
            with open(tmp_png, 'wb') as f2:
                f2.write(resp2.read())
        subprocess.run(
            ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "80", tmp_png, "--out", output_path],
            capture_output=True, check=True
        )
        os.remove(tmp_png)
        size_kb = os.path.getsize(output_path) / 1024
        return size_kb
    except Exception as e:
        print(f"  ❌ Download/convert error: {e}")
        if os.path.exists(tmp_png):
            os.remove(tmp_png)
        return None


def update_frontmatter(filepath, cover_path):
    """Add cover field to frontmatter. IDEMPOTENT: won't duplicate."""
    # Double-check: skip if already has cover
    if has_cover_in_frontmatter(filepath):
        print(f"  ⚠️  Frontmatter already has cover, skipping write")
        return
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Insert cover before readingTime line
    if "readingTime:" in content:
        content = content.replace("readingTime:", f'cover: "{cover_path}"\nreadingTime:', 1)  # only first occurrence
    elif "---" in content[3:]:
        idx = content.index("---", 3)
        content = content[:idx] + f'cover: "{cover_path}"\n' + content[idx:]
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


def log_cost(slug):
    """Append cost entry to costs.jsonl."""
    entry = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "service": "openai",
        "model": "dall-e-3",
        "action": "image-gen",
        "source": "cover-image",
        "inputTokens": 0,
        "outputTokens": 0,
        "costUSD": COST_PER_IMAGE,
        "costTWD": round(COST_PER_IMAGE * TWD_RATE, 2),
        "note": f"{slug} cover"
    }
    with open(COSTS_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def main():
    dry_run = "--dry-run" in sys.argv
    limit = None
    for i, arg in enumerate(sys.argv):
        if arg == "--limit" and i + 1 < len(sys.argv):
            limit = int(sys.argv[i + 1])
    
    if not API_KEY and not dry_run:
        print("❌ OPENAI_API_KEY not set")
        sys.exit(1)
    
    os.makedirs(COVERS_DIR, exist_ok=True)
    
    # Scan articles — 雙重檢查：frontmatter + 圖片檔都到位才跳過
    md_files = sorted([f for f in os.listdir(ARTICLES_DIR) if f.endswith(".md")])
    
    to_process = []
    skipped = 0
    for fname in md_files:
        filepath = os.path.join(ARTICLES_DIR, fname)
        data, _ = parse_frontmatter(filepath)
        if not data:
            continue
        if data.get("draft", "").lower() == "true":
            continue
        
        slug = fname.replace(".md", "")
        jpg_exists = os.path.exists(os.path.join(COVERS_DIR, f"{slug}.jpg"))
        fm_has_cover = has_cover_in_frontmatter(filepath)
        
        if jpg_exists and fm_has_cover:
            skipped += 1
            continue  # 完整到位，跳過
        
        to_process.append((slug, filepath, data, jpg_exists, fm_has_cover))
    
    if limit:
        to_process = to_process[:limit]
    
    tag = " (DRY RUN)" if dry_run else ""
    print(f"📸 {len(to_process)} articles need covers{tag} ({skipped} already complete)")
    print(f"💰 Estimated cost: ${len(to_process) * COST_PER_IMAGE:.2f} USD")
    print()
    
    if dry_run:
        for slug, _, data, jpg_exists, fm_has_cover in to_process:
            status = []
            if jpg_exists: status.append("jpg✓")
            if fm_has_cover: status.append("fm✓")
            tag = f" [{', '.join(status)}]" if status else ""
            print(f"  → {slug} [{data.get('pillar', '?')}]{tag}")
        return
    
    success = 0
    failed = 0
    consecutive_billing_errors = 0
    
    for i, (slug, filepath, data, jpg_exists, fm_has_cover) in enumerate(to_process):
        title = data.get("title", slug)
        pillar = data.get("pillar", "ai")
        print(f"[{i+1}/{len(to_process)}] {slug}")
        print(f"  📝 {title[:60]}")
        
        # 如果圖片已存在但 frontmatter 沒有 → 只補 frontmatter
        if jpg_exists and not fm_has_cover:
            cover_rel = f"/images/covers/{slug}.jpg"
            update_frontmatter(filepath, cover_rel)
            print(f"  ✅ Frontmatter updated (image already existed)")
            success += 1
            continue
        
        # 產圖
        prompt = build_prompt(title, data.get("description", ""), pillar, slug)
        image_url, err_code = generate_image(prompt, API_KEY)
        
        if not image_url:
            failed += 1
            # Billing limit → 連續 3 次就停
            if err_code == "billing_hard_limit_reached":
                consecutive_billing_errors += 1
                if consecutive_billing_errors >= 3:
                    print(f"\n🛑 Billing limit hit {consecutive_billing_errors}x in a row. Stopping.")
                    print(f"   請去 OpenAI Platform 提高額度後重跑。")
                    break
            time.sleep(2)
            continue
        
        consecutive_billing_errors = 0  # reset on success
        
        # Download & convert
        output_path = os.path.join(COVERS_DIR, f"{slug}.jpg")
        size_kb = download_and_convert(image_url, output_path)
        if not size_kb:
            failed += 1
            time.sleep(2)
            continue
        
        # Update frontmatter (冪等)
        cover_rel = f"/images/covers/{slug}.jpg"
        update_frontmatter(filepath, cover_rel)
        
        # Log cost
        log_cost(slug)
        
        print(f"  ✅ {size_kb:.0f}KB | ${COST_PER_IMAGE}")
        success += 1
        
        # Rate limit: ~3 requests per minute
        if i < len(to_process) - 1:
            time.sleep(22)
    
    print(f"\n🎉 Done! {success} generated, {failed} failed")
    print(f"💰 Total cost: ${success * COST_PER_IMAGE:.2f} USD")
    
    # ⚠️ 不自動 commit/push — 請手動確認後再 push
    if success > 0:
        print(f"\n📋 下一步:")
        print(f"   cd ~/Desktop/01_專案進行中/paulkuo.tw")
        print(f"   npx astro build          # 先驗證 build 通過")
        print(f"   git add -A && git commit -m 'feat: add cover images'")
        print(f"   git push")


if __name__ == "__main__":
    main()
