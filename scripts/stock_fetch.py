#!/usr/bin/env python3
"""
stock_fetch.py — 抓取 Yahoo Finance 股價，存到 data/stock.json
用於 CostTicker 顯示
"""
import json, urllib.request, os, sys
from datetime import datetime

SYMBOL = "436A.T"
NAME = "CyberSolutions"
URL = f"https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=5d&interval=1d"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "stock.json")

try:
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
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
    # Don't overwrite existing data on failure
