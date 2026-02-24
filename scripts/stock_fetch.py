#!/usr/bin/env python3
"""stock_fetch.py v2 — Yahoo Finance 股價 + 日股交易時段判斷

v2 改動：
  - 修 SSL 憑證問題（macOS Python）
  - 加 --force 參數跳過交易時段檢查
  - 交易時段：JST 09:00-15:30（含盤後）= UTC+8 08:00-14:30
  - 非交易時段不抓（省 API call），除非 --force
"""
import json, urllib.request, ssl, os, sys
from datetime import datetime, timezone, timedelta

SYMBOL = "436A.T"
NAME = "CyberSolutions"
URL = f"https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=5d&interval=1d"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "stock.json")

def is_trading_hours():
    """Check if Tokyo Stock Exchange is likely open (JST 09:00-15:30, weekdays)."""
    jst = timezone(timedelta(hours=9))
    now_jst = datetime.now(jst)
    # Weekend check
    if now_jst.weekday() >= 5:
        return False
    hour, minute = now_jst.hour, now_jst.minute
    # TSE: 09:00-11:30 morning, 12:30-15:00 afternoon, +30min buffer
    return 8 <= hour < 16 or (hour == 15 and minute <= 30)

def main():
    force = "--force" in sys.argv
    
    if not force and not is_trading_hours():
        print(f"⏸️ {NAME}: outside TSE trading hours, skip")
        return
    
    try:
        # Fix macOS Python SSL cert issue
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            data = json.loads(resp.read())
        
        meta = data["chart"]["result"][0]["meta"]
        price = meta.get("regularMarketPrice", 0)
        prev = meta.get("chartPreviousClose") or meta.get("previousClose") or 0
        change_pct = ((price - prev) / prev * 100) if prev else 0
        
        result = {
            "symbol": SYMBOL,
            "name": NAME,
            "price": price,
            "previousClose": prev,
            "changePercent": round(change_pct, 2),
            "currency": "JPY",
            "updatedAt": datetime.now().strftime("%Y-%m-%dT%H:%M:%S+08:00"),
        }
        
        with open(OUT, "w") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        
        print(f"✅ {NAME} ({SYMBOL}): ¥{price:,.0f} ({change_pct:+.2f}%)")
    except Exception as e:
        print(f"⚠️ Stock fetch failed: {e}", file=sys.stderr)

if __name__ == "__main__":
    main()
