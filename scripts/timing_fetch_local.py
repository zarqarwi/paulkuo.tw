#!/usr/bin/env python3
"""
timing_fetch_local.py — 用 AppleScript 從本機 Timing App 抓 AI 協作時間
AI 近似 = Development + Web Browsing
輸出到 data/timing.json
"""
import json, subprocess, os, re
from datetime import datetime, timedelta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT = os.path.join(REPO_ROOT, "data", "timing.json")

# Categories to count as AI collaboration
AI_CATEGORIES = {"Development", "Web Browsing"}

def fetch_day(date_str):
    """Use AppleScript to get time summary for YYYY-MM-DD."""
    script = f'''
set dayStart to date "{date_str}"
set time of dayStart to 0
set dayEnd to dayStart + 86400
tell application "TimingHelper"
    set summary to get time summary between dayStart and dayEnd
    return times per project of summary
end tell
'''
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode != 0:
            return 0.0, {}
        raw = result.stdout.strip()
        if not raw:
            return 0.0, {}

        breakdown = {}
        total = 0.0
        # Parse "Key:1234.56, Key2:789.01, ..."
        # Handle scientific notation like 3.21E+4
        for pair in raw.split(", "):
            idx = pair.find(":")
            if idx == -1:
                continue
            key = pair[:idx].strip()
            val_str = pair[idx+1:].strip()
            try:
                secs = float(val_str)
            except ValueError:
                continue
            if key in AI_CATEGORIES:
                hrs = round(secs / 3600, 2)
                breakdown[key] = hrs
                total += hrs

        return round(total, 2), breakdown
    except Exception as e:
        print(f"  Error {date_str}: {e}")
        return 0.0, {}


def main():
    now = datetime.now()
    month_start = now.replace(day=1)
    period = now.strftime("%Y-%m")

    daily = []
    total_hours = 0.0
    active_days = 0

    current = month_start
    while current.date() <= now.date():
        ds = current.strftime("%Y-%m-%d")
        hrs, breakdown = fetch_day(ds)
        daily.append({"date": ds, "ai_hours": hrs, "breakdown": breakdown})
        total_hours += hrs
        if hrs > 0.1:
            active_days += 1
        tag = " ✦" if hrs > 0 else ""
        print(f"  {ds}: {hrs:.1f}h{tag}")
        current += timedelta(days=1)

    output = {
        "updated": now.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "source": "timing-app-local",
        "method": "AppleScript: Development + Web Browsing as AI proxy",
        "month_summary": {
            "period": period,
            "total_ai_hours": round(total_hours, 1),
            "active_days": active_days
        },
        "daily": daily
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ {OUTPUT}")
    print(f"   {period} | {total_hours:.1f}h | {active_days} active days")


if __name__ == "__main__":
    main()
