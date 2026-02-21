#!/usr/bin/env python3
"""
fitbit_fetch.py — 用 Fitbit Web API 抓步數等數據，更新 data/fitbit.json
OAuth2 token 存在 scripts/.fitbit_token (JSON: access_token, refresh_token, expires_at)
"""
import json, os, sys, time
from datetime import datetime, timedelta
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT = os.path.join(REPO_ROOT, "data", "fitbit.json")
TOKEN_FILE = os.path.join(SCRIPT_DIR, ".fitbit_token")

# Fitbit OAuth2 app credentials (Personal type)
# 你需要在 https://dev.fitbit.com/apps 建立一個 Personal app
CLIENT_ID = os.environ.get("FITBIT_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("FITBIT_CLIENT_SECRET", "")

def load_token():
    if not os.path.exists(TOKEN_FILE):
        return None
    with open(TOKEN_FILE) as f:
        return json.load(f)

def save_token(token_data):
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f)

def refresh_token(token_data):
    """Refresh expired OAuth2 token."""
    data = urlencode({
        "grant_type": "refresh_token",
        "refresh_token": token_data["refresh_token"],
        "client_id": CLIENT_ID,
    }).encode()
    req = Request("https://api.fitbit.com/oauth2/token", data=data, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    
    try:
        with urlopen(req) as resp:
            new_token = json.loads(resp.read())
            new_token["expires_at"] = time.time() + new_token.get("expires_in", 28800)
            save_token(new_token)
            return new_token
    except HTTPError as e:
        print(f"Token refresh failed: {e.code} {e.read().decode()}")
        return None

def api_get(path, token_data):
    """Make authenticated GET request to Fitbit API."""
    access_token = token_data["access_token"]
    
    # Check if token expired
    if time.time() > token_data.get("expires_at", 0):
        token_data = refresh_token(token_data)
        if not token_data:
            return None
    
    url = f"https://api.fitbit.com{path}"
    req = Request(url)
    req.add_header("Authorization", f"Bearer {access_token}")
    
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read())
    except HTTPError as e:
        if e.code == 401:
            # Token expired, try refresh
            token_data = refresh_token(token_data)
            if token_data:
                return api_get(path, token_data)
        print(f"API error: {e.code} {e.read().decode()}")
        return None

def main():
    token = load_token()
    if not token:
        print("ERROR: No Fitbit token. Run fitbit_auth.py first.")
        sys.exit(1)
    
    today = datetime.now().strftime("%Y-%m-%d")
    week_start = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Get today's summary
    summary = api_get(f"/1/user/-/activities/date/{today}.json", token)
    if not summary:
        print("Failed to fetch today's activity")
        sys.exit(1)
    
    s = summary.get("summary", {})
    goals = summary.get("goals", {})
    
    # Get week steps
    steps_data = api_get(
        f"/1/user/-/activities/steps/date/{week_start}/{today}.json", token
    )
    week = []
    if steps_data:
        for d in steps_data.get("activities-steps", []):
            week.append({
                "date": d["dateTime"],
                "steps": int(d["value"])
            })
    
    output = {
        "updated": datetime.now().strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "today": {
            "steps": s.get("steps", 0),
            "goal": goals.get("steps", 10000),
            "distance_km": round(
                next((d["distance"] for d in s.get("distances", []) 
                      if d["activity"] == "total"), 0), 2
            ),
            "calories": s.get("activityCalories", 0),
            "resting_hr": s.get("restingHeartRate", 0)
        },
        "week": week
    }
    
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Fitbit updated: {s.get('steps', 0)} steps today")

if __name__ == "__main__":
    main()
