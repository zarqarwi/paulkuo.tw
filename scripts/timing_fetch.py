#!/usr/bin/env python3
"""
timing_fetch.py — 從 Timing Web API 抓取 AI 協作時間，更新 data/timing.json
近似邏輯：Development + Web Browsing = AI 協作時間
"""
import json, subprocess, sys, os
from datetime import datetime, timedelta

TOKEN = os.environ.get("TIMING_API_TOKEN", "")
if not TOKEN and len(sys.argv) > 1:
    TOKEN = sys.argv[1]
if not TOKEN:
    print("ERROR: No TIMING_API_TOKEN set")
    sys.exit(1)

# AI-proxy categories (Timing built-in)
AI_PROXY_PROJECTS = {
    "/projects/3804106244517507840": "Development",
    "/projects/3804106244496281088": "Web Browsing",
}

BASE_URL = "https://web.timingapp.com/api/v1/report"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(SCRIPT_DIR, "data", "timing.json")
# If run from repo root
if not os.path.isdir(os.path.join(SCRIPT_DIR, "data")):
    OUTPUT = os.path.join(os.getcwd(), "data", "timing.json")

def fetch_day(date_str):
    """Fetch AI-proxy hours for a single day."""
    start = f"{date_str}T00:00:00+08:00"
    end_date = (datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")
    end = f"{end_date}T00:00:00+08:00"
    
    url = f"{BASE_URL}?start_date_min={start}&start_date_max={end}&include_app_usage=1"
    result = subprocess.run(
        ["curl", "-s", url, "-H", f"Authorization: Bearer {TOKEN}"],
        capture_output=True, text=True
    )
    try:
        data = json.loads(result.stdout)
    except json.JSONDecodeError:
        return 0.0, {}
    
    total = 0.0
    breakdown = {}
    for entry in data.get("data", []):
        proj = entry.get("project")
        pid = proj.get("self") if proj else None
        if pid in AI_PROXY_PROJECTS:
            hrs = entry.get("duration", 0) / 3600
            total += hrs
            breakdown[AI_PROXY_PROJECTS[pid]] = round(hrs, 2)
    
    return round(total, 2), breakdown

def main():
    now = datetime.now()
    month_start = now.replace(day=1).strftime("%Y-%m-%d")
    today = now.strftime("%Y-%m-%d")
    period = now.strftime("%Y-%m")
    
    # Fetch each day of the month
    daily = []
    total_hours = 0.0
    active_days = 0
    
    current = datetime.strptime(month_start, "%Y-%m-%d")
    end = datetime.strptime(today, "%Y-%m-%d")
    
    while current <= end:
        ds = current.strftime("%Y-%m-%d")
        hrs, breakdown = fetch_day(ds)
        daily.append({
            "date": ds,
            "ai_hours": hrs,
            "breakdown": breakdown
        })
        total_hours += hrs
        if hrs > 0.1:
            active_days += 1
        current += timedelta(days=1)
    
    output = {
        "updated": now.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "source": "timing-api",
        "method": "Development + Web Browsing as AI proxy",
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
    
    print(f"✅ Updated {OUTPUT}")
    print(f"   Period: {period} | Total: {total_hours:.1f}h | Active days: {active_days}")

if __name__ == "__main__":
    main()
