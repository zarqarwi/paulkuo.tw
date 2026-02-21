#!/usr/bin/env python3
"""
fitbit_fetch.py — 用 Fitbit Web API 抓步數等數據，更新 data/fitbit.json
OAuth2 token 存在 scripts/.fitbit_token
"""
import json, os, sys, time, subprocess
from datetime import datetime, timedelta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
OUTPUT = os.path.join(REPO_ROOT, "data", "fitbit.json")
TOKEN_FILE = os.path.join(SCRIPT_DIR, ".fitbit_token")

CLIENT_ID = "23V2BH"
CLIENT_SECRET = "4adac11e3241afadf53cccfaa7b7e86a"

def load_token():
    if not os.path.exists(TOKEN_FILE):
        return None
    with open(TOKEN_FILE) as f:
        return json.load(f)

def save_token(data):
    with open(TOKEN_FILE, "w") as f:
        json.dump(data, f, indent=2)

def refresh_token(token_data):
    """Refresh expired OAuth2 token using curl."""
    import base64
    creds = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    result = subprocess.run([
        "curl", "-s", "-X", "POST", "https://api.fitbit.com/oauth2/token",
        "-H", f"Authorization: Basic {creds}",
        "-H", "Content-Type: application/x-www-form-urlencoded",
        "-d", f"grant_type=refresh_token&refresh_token={token_data['refresh_token']}"
    ], capture_output=True, text=True)
    try:
        new_token = json.loads(result.stdout)
        if "access_token" in new_token:
            new_token["expires_at"] = time.time() + new_token.get("expires_in", 28800)
            save_token(new_token)
            return new_token
        else:
            print(f"Refresh failed: {result.stdout[:200]}")
            return None
    except json.JSONDecodeError:
        print(f"Refresh parse error: {result.stdout[:200]}")
        return None

def api_get(path, token_data):
    """GET request to Fitbit API using curl."""
    # Auto-refresh if expired
    if time.time() > token_data.get("expires_at", 0):
        token_data = refresh_token(token_data)
        if not token_data:
            return None

    result = subprocess.run([
        "curl", "-s",
        "-H", f"Authorization: Bearer {token_data['access_token']}",
        f"https://api.fitbit.com{path}"
    ], capture_output=True, text=True)
    
    try:
        data = json.loads(result.stdout)
        # If 401, try refresh once
        if "errors" in data and any(e.get("errorType") == "expired_token" for e in data["errors"]):
            token_data = refresh_token(token_data)
            if token_data:
                return api_get(path, token_data)
            return None
        return data
    except json.JSONDecodeError:
        print(f"API parse error: {result.stdout[:200]}")
        return None

def main():
    token = load_token()
    if not token:
        print("ERROR: No Fitbit token. Run fitbit_auth.py first.")
        sys.exit(1)

    today = datetime.now().strftime("%Y-%m-%d")
    week_start = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    # Today's activity summary
    summary = api_get(f"/1/user/-/activities/date/{today}.json", token)
    if not summary or "summary" not in summary:
        print(f"Failed to fetch activity: {str(summary)[:200]}")
        sys.exit(1)

    s = summary["summary"]
    goals = summary.get("goals", {})

    # Week steps
    steps_data = api_get(
        f"/1/user/-/activities/steps/date/{week_start}/{today}.json", token
    )
    week = []
    if steps_data and "activities-steps" in steps_data:
        for d in steps_data["activities-steps"]:
            week.append({"date": d["dateTime"], "steps": int(d["value"])})

    # Build output
    dist = next(
        (d["distance"] for d in s.get("distances", []) if d["activity"] == "total"),
        0
    )
    output = {
        "updated": datetime.now().strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "today": {
            "steps": s.get("steps", 0),
            "goal": goals.get("steps", 10000),
            "distance_km": round(dist, 2),
            "calories": s.get("activityCalories", 0),
            "resting_hr": s.get("restingHeartRate", 0)
        },
        "week": week
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Fitbit: {s.get('steps', 0)} steps | {round(dist, 1)}km | HR {s.get('restingHeartRate', '?')}")

if __name__ == "__main__":
    main()
