#!/usr/bin/env python3
"""
fitbit_auth.py — Fitbit OAuth2 授權流程（一次性）
產生 .fitbit_token 給 fitbit_fetch.py 用
"""
import http.server
import json
import os
import sys
import time
import webbrowser
from urllib.request import Request, urlopen
from urllib.parse import urlencode, parse_qs, urlparse
import base64

CLIENT_ID = "23V2BH"
CLIENT_SECRET = "4adac11e3241afadf53cccfaa7b7e86a"
REDIRECT_URI = "http://localhost:3000/callback"
SCOPES = "activity heartrate profile"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_FILE = os.path.join(SCRIPT_DIR, ".fitbit_token")

auth_code = None

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        query = parse_qs(urlparse(self.path).query)
        if "code" in query:
            auth_code = query["code"][0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write("✅ 授權成功！可以關閉這個視窗了。".encode("utf-8"))
        else:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Error: no code received")
    
    def log_message(self, format, *args):
        pass  # suppress logs

def main():
    # Step 1: Open browser for authorization
    auth_url = (
        f"https://www.fitbit.com/oauth2/authorize?"
        f"response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={SCOPES.replace(' ', '%20')}"
        f"&expires_in=31536000"
    )
    
    print("Opening browser for Fitbit authorization...")
    print(f"If browser doesn't open, visit:\n{auth_url}\n")
    webbrowser.open(auth_url)
    
    # Step 2: Wait for callback
    server = http.server.HTTPServer(("localhost", 3000), CallbackHandler)
    server.timeout = 120
    print("Waiting for authorization callback...")
    
    while auth_code is None:
        server.handle_request()
    
    server.server_close()
    print(f"Got authorization code: {auth_code[:10]}...")
    
    # Step 3: Exchange code for token
    credentials = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    data = urlencode({
        "grant_type": "authorization_code",
        "code": auth_code,
        "redirect_uri": REDIRECT_URI,
    }).encode()
    
    req = Request("https://api.fitbit.com/oauth2/token", data=data, method="POST")
    req.add_header("Authorization", f"Basic {credentials}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    
    with urlopen(req) as resp:
        token_data = json.loads(resp.read())
    
    token_data["expires_at"] = time.time() + token_data.get("expires_in", 28800)
    
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f, indent=2)
    
    print(f"\n✅ Token saved to {TOKEN_FILE}")
    print(f"   User: {token_data.get('user_id', '?')}")
    print(f"   Expires in: {token_data.get('expires_in', 0) // 3600} hours")

if __name__ == "__main__":
    main()
