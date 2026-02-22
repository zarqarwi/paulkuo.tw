#!/usr/bin/env python3
"""timing_fetch_local.py v2 — 只抓今天的 AI 協作時間，增量更新

v1 問題：每次遍歷整月每一天（22 次 AppleScript），cron 每 10 分鐘跑一次太浪費。
v2 改進：只查今天，歷史日從既有 JSON 讀取，月累計用加法算。

AI 近似 = Development + Web Browsing + AI 工具開發 + Claude 協作 + 辯論引擎 + 內容創作
輸出到 data/timing.json
"""
import json, subprocess, os
from datetime import datetime, timedelta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT = os.path.join(REPO_ROOT, "data", "timing.json")

AI_CATEGORIES = {
    "Development", "Web Browsing",
    "Claude 協作", "辯論引擎", "AI 工具開發", "內容創作",
    "Office & Business",  # 暫時加入：claude.ai 目前被 Timing 歸在此 category（Rule 優先級問題）
}


def fetch_day(date_str):
    """Use AppleScript to get time summary for a single day."""
    script = f'''set dayStart to date "{date_str}"
set time of dayStart to 0
set dayEnd to dayStart + 86400
tell application "TimingHelper"
    set summary to get time summary between dayStart and dayEnd
    return times per project of summary
end tell'''
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


def load_existing():
    """Load existing timing.json, return daily dict keyed by date."""
    if not os.path.exists(OUTPUT):
        return {}
    try:
        with open(OUTPUT, encoding="utf-8") as f:
            data = json.load(f)
        return {d["date"]: d for d in data.get("daily", [])}
    except Exception:
        return {}


def main():
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    period = now.strftime("%Y-%m")

    # 只查今天（1 次 AppleScript，不是 22 次）
    today_hrs, today_breakdown = fetch_day(today_str)
    tag = " ✦" if today_hrs > 0 else ""
    print(f"  {today_str}: {today_hrs:.1f}h{tag}")

    # 讀既有資料
    existing = load_existing()

    # 更新今天
    existing[today_str] = {
        "date": today_str,
        "ai_hours": today_hrs,
        "breakdown": today_breakdown,
    }

    # 過濾只保留本月的 daily（跨月自動清理舊資料）
    month_prefix = period  # e.g. "2026-02"
    daily = sorted(
        [v for k, v in existing.items() if k.startswith(month_prefix)],
        key=lambda d: d["date"]
    )

    # 月累計
    total_hours = sum(d["ai_hours"] for d in daily)
    active_days = sum(1 for d in daily if d["ai_hours"] > 0.1)

    output = {
        "updated": now.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "source": "timing-app-local",
        "method": "AppleScript: Development + Web Browsing + AI categories as AI proxy",
        "month_summary": {
            "period": period,
            "total_ai_hours": round(total_hours, 1),
            "active_days": active_days,
        },
        "daily": daily,
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {period} | {total_hours:.1f}h | {active_days} active days")


if __name__ == "__main__":
    main()
