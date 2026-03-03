#!/usr/bin/env python3
"""timing_fetch_local.py v4 — 直接讀 Timing SQLite DB，用 bundleIdentifier + URL + title 精準匹配 AI 平台

解決歷史版本的問題：
- v1-v2: AppleScript 只能拿 project 層級，claude.ai 埋在 Office & Business
- v3: Web API 拿不到 app usage（只有 time entries）
- v4: 直接讀 SQLite DB，三層匹配：bundleIdentifier → path URL → title 關鍵字

輸出到 data/timing.json，供 CostTicker.astro 讀取
"""
import json, os, sys, sqlite3
from datetime import datetime, timedelta

# ── 設定 ──────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT = os.path.join(REPO_ROOT, "data", "timing.json")

DB_PATH = os.path.expanduser(
    "~/Library/Application Support/info.eurocomp.Timing2/SQLite.db"
)

# ── AI 平台匹配規則（三層）──────────────────────────────
# 1) bundleIdentifier 匹配（原生 app）
BUNDLE_MAP = {
    "com.anthropic.claudefordesktop": "Claude",
    "com.openai.chat": "ChatGPT",
    # 如有其他 AI 原生 app 在此新增
}

# 2) Path URL 匹配（瀏覽器）
PATH_MAP = {
    "claude.ai": "Claude",
    "chatgpt.com": "ChatGPT",
    "gemini.google": "Gemini",
    "perplexity.ai": "Perplexity",
    "chat.openai.com": "ChatGPT",
    "aistudio.google": "Gemini",
    "poe.com": "Poe",
    "copilot.microsoft.com": "Copilot",
}

# 3) Title 關鍵字 fallback（最後手段）
TITLE_MAP = {
    "ChatGPT": "ChatGPT",
    "Gemini": "Gemini",
    "Perplexity": "Perplexity",
}

# ── SQL ───────────────────────────────────────────────

# 建立 CASE WHEN 子句
def _build_case_sql():
    """Build SQL CASE for platform classification."""
    parts = []

    # Bundle ID（最高優先）
    for bid, name in BUNDLE_MAP.items():
        parts.append(f"WHEN app.bundleIdentifier = '{bid}' THEN '{name}'")

    # Path URL
    for domain, name in PATH_MAP.items():
        parts.append(f"WHEN p.stringValue LIKE '%{domain}%' THEN '{name}'")

    # Title fallback
    for kw, name in TITLE_MAP.items():
        parts.append(f"WHEN t.stringValue LIKE '%{kw}%' THEN '{name}'")

    return "\n    ".join(parts)


def _build_where_sql():
    """Build SQL WHERE for AI platform filtering."""
    conditions = []

    for bid in BUNDLE_MAP:
        conditions.append(f"app.bundleIdentifier = '{bid}'")

    for domain in PATH_MAP:
        conditions.append(f"p.stringValue LIKE '%{domain}%'")

    for kw in TITLE_MAP:
        conditions.append(f"t.stringValue LIKE '%{kw}%'")

    return " OR ".join(conditions)


QUERY_TEMPLATE = """
SELECT
  CASE
    {case_sql}
    ELSE 'Other'
  END as platform,
  round(sum(a.endDate - a.startDate) / 3600.0, 4) as hours,
  count(*) as entries
FROM AppActivity a
LEFT JOIN Title t ON a.titleID = t.id
LEFT JOIN Path p ON a.pathID = p.id
LEFT JOIN Application app ON a.applicationID = app.id
WHERE a.isDeleted = 0
  AND date(a.startDate, 'unixepoch', 'localtime') {date_filter}
  AND ({where_sql})
GROUP BY platform
ORDER BY hours DESC;
"""


# ── 主邏輯 ────────────────────────────────────────────
def query_day(conn, date_str):
    """Query AI platform hours for a specific day."""
    sql = QUERY_TEMPLATE.format(
        case_sql=_build_case_sql(),
        date_filter=f"= '{date_str}'",
        where_sql=_build_where_sql(),
    )
    try:
        rows = conn.execute(sql).fetchall()
    except Exception as e:
        print(f"  ⚠ SQL error: {e}")
        return 0.0, {}

    breakdown = {}
    total = 0.0
    for platform, hours, entries in rows:
        if platform == "Other":
            continue
        breakdown[platform] = round(hours, 2)
        total += hours
    return round(total, 2), breakdown


def load_existing():
    """Load existing timing.json."""
    if not os.path.exists(OUTPUT):
        return {}
    try:
        with open(OUTPUT, encoding="utf-8") as f:
            data = json.load(f)
        return {d["date"]: d for d in data.get("daily", [])}
    except Exception:
        return {}


def main():
    if not os.path.exists(DB_PATH):
        print(f"  ERROR: Timing DB not found at {DB_PATH}")
        sys.exit(1)

    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    period = now.strftime("%Y-%m")

    print(f"  Timing v4 (SQLite) — {period}")

    # 唯讀連接
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)

    # 今天
    today_hrs, today_bd = query_day(conn, today_str)
    tag = " ✦" if today_hrs > 0 else ""
    print(f"  {today_str}: {today_hrs:.1f}h{tag}")
    if today_bd:
        for k, v in sorted(today_bd.items(), key=lambda x: -x[1]):
            print(f"    {k}: {v:.2f}h")

    # 讀既有
    existing = load_existing()
    existing[today_str] = {
        "date": today_str,
        "ai_hours": today_hrs,
        "breakdown": today_bd,
    }

    # 補抓缺失天數（本月，最多 7 天）
    month_start = datetime.strptime(f"{period}-01", "%Y-%m-%d")
    for i in range(1, 8):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        if d < f"{period}-01":
            break
        if d in existing:
            continue
        hrs, bd = query_day(conn, d)
        existing[d] = {"date": d, "ai_hours": hrs, "breakdown": bd}
        if hrs > 0:
            print(f"  {d}: {hrs:.1f}h ✦ (backfill)")

    conn.close()

    # 過濾本月
    daily = sorted(
        [v for k, v in existing.items() if k.startswith(period)],
        key=lambda d: d["date"],
    )

    total_hours = sum(d["ai_hours"] for d in daily)
    active_days = sum(1 for d in daily if d["ai_hours"] > 0.1)

    # 平台累計
    platform_totals = {}
    for d in daily:
        for platform, hrs in d.get("breakdown", {}).items():
            platform_totals[platform] = round(
                platform_totals.get(platform, 0) + hrs, 2
            )

    output = {
        "updated": now.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "source": "timing-sqlite-direct",
        "method": "SQLite DB + bundleIdentifier/path/title matching",
        "api_version": "v4",
        "month_summary": {
            "period": period,
            "total_ai_hours": round(total_hours, 1),
            "active_days": active_days,
            "avg_daily": round(total_hours / max(active_days, 1), 1),
            "platform_breakdown": platform_totals,
        },
        "daily": daily,
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {period} | {total_hours:.1f}h | {active_days} active days")
    if platform_totals:
        print(
            "  📊 "
            + " | ".join(
                f"{k}: {v:.1f}h"
                for k, v in sorted(platform_totals.items(), key=lambda x: -x[1])
            )
        )


if __name__ == "__main__":
    main()
