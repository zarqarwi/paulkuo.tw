#!/usr/bin/env python3
"""fitbit_cloud_refresh.py — GitHub Actions 用：解密 token → refresh → 抓資料 → 重新加密

解決 Fitbit token 8 小時過期、Mac 睡眠導致 chain 斷裂的問題。
在 GitHub Actions 上每 6 小時跑一次，完全不依賴本機。

環境變數：
  FITBIT_ENCRYPT_KEY — 對稱加密金鑰（GitHub Secret）
"""
import json, os, sys, time, subprocess, base64
from datetime import datetime, timedelta

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
ENC_FILE = os.path.join(SCRIPT_DIR, ".fitbit_token.enc")
DEC_FILE = os.path.join(SCRIPT_DIR, ".fitbit_token")
OUTPUT = os.path.join(REPO_ROOT, "data", "fitbit.json")

CLIENT_ID = "23V2BH"
CLIENT_SECRET = "4adac11e3241afadf53cccfaa7b7e86a"
ENCRYPT_KEY = os.environ.get("FITBIT_ENCRYPT_KEY", "")


def decrypt_token():
    """Decrypt .fitbit_token.enc → .fitbit_token"""
    if not os.path.exists(ENC_FILE):
        print("ERROR: No encrypted token file found")
        sys.exit(1)
    result = subprocess.run([
        "openssl", "enc", "-aes-256-cbc", "-d", "-salt", "-pbkdf2",
        "-in", ENC_FILE, "-out", DEC_FILE,
        "-pass", f"pass:{ENCRYPT_KEY}"
    ], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Decrypt failed: {result.stderr}")
        sys.exit(1)
    with open(DEC_FILE) as f:
        return json.load(f)


def encrypt_token():
    """Encrypt .fitbit_token → .fitbit_token.enc"""
    result = subprocess.run([
        "openssl", "enc", "-aes-256-cbc", "-salt", "-pbkdf2",
        "-in", DEC_FILE, "-out", ENC_FILE,
        "-pass", f"pass:{ENCRYPT_KEY}"
    ], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Encrypt failed: {result.stderr}")
        sys.exit(1)
    # Remove plaintext
    os.remove(DEC_FILE)


def refresh_token(token_data):
    """Refresh OAuth2 token."""
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
            with open(DEC_FILE, "w") as f:
                json.dump(new_token, f, indent=2)
            print(f"✅ Token refreshed (valid {new_token.get('expires_in', 0) // 3600}h)")
            return new_token
        else:
            print(f"❌ Refresh failed: {result.stdout[:300]}")
            return None
    except json.JSONDecodeError:
        print(f"❌ Parse error: {result.stdout[:300]}")
        return None


def api_get(path, token_data):
    """Fitbit API GET."""
    result = subprocess.run([
        "curl", "-s",
        "-H", f"Authorization: Bearer {token_data['access_token']}",
        f"https://api.fitbit.com{path}"
    ], capture_output=True, text=True)
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return None


def fetch_data(token):
    """Fetch today's Fitbit data and write to data/fitbit.json."""
    # Use UTC+8 for Taiwan time
    now_tw = datetime.utcnow() + timedelta(hours=8)
    today = now_tw.strftime("%Y-%m-%d")
    week_start = (now_tw - timedelta(days=7)).strftime("%Y-%m-%d")

    summary = api_get(f"/1/user/-/activities/date/{today}.json", token)
    if not summary or "summary" not in summary:
        print(f"Failed to fetch activity: {str(summary)[:200]}")
        return False

    s = summary["summary"]
    goals = summary.get("goals", {})

    # Week steps
    steps_data = api_get(f"/1/user/-/activities/steps/date/{week_start}/{today}.json", token)
    week = []
    if steps_data and "activities-steps" in steps_data:
        for d in steps_data["activities-steps"]:
            week.append({"date": d["dateTime"], "steps": int(d["value"])})

    dist = next(
        (d["distance"] for d in s.get("distances", []) if d["activity"] == "total"), 0
    )

    output = {
        "updated": now_tw.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        "source": "github-actions",
        "token_status": "active",
        "today": {
            "steps": s.get("steps", 0),
            "goal": goals.get("steps", 10000),
            "distance_km": round(dist, 2),
            "calories": s.get("activityCalories", 0),
            "resting_hr": s.get("restingHeartRate", 0),
        },
        "week": week,
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✅ Fitbit: {s.get('steps', 0)} steps | {round(dist, 1)}km | HR {s.get('restingHeartRate', '?')}")
    return True


def main():
    if not ENCRYPT_KEY:
        print("ERROR: FITBIT_ENCRYPT_KEY not set")
        sys.exit(1)

    # 1. Decrypt
    print("Decrypting token...")
    token = decrypt_token()

    # 2. Always refresh (keep chain alive)
    print("Refreshing token...")
    new_token = refresh_token(token)
    if not new_token:
        print("FATAL: Token refresh failed. Chain may be broken — need manual re-auth.")
        sys.exit(1)

    # 3. Fetch data
    print("Fetching Fitbit data...")
    success = fetch_data(new_token)

    # 4. Re-encrypt new token (even if fetch failed, token is still refreshed)
    print("Encrypting updated token...")
    encrypt_token()

    if not success:
        sys.exit(1)

    print("✅ All done")


if __name__ == "__main__":
    main()
