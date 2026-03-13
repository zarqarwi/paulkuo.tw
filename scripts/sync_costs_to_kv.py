#!/usr/bin/env python3
"""
sync_costs_to_kv.py — 把 costs.jsonl 的費用記錄合併進 Cloudflare KV

設計原則：
  - 合併不覆蓋：KV 可能已有 Worker 寫的翻譯工具費用，必須保留
  - 用 dedup_key (timestamp + source + action + note) 去重
  - 只同步最近 N 天（預設 30），避免每次全量掃
  - 日後新增費用來源（Claude API, Gemini 等）只要寫進 costs.jsonl 就會自動同步

使用方式：
  python3 scripts/sync_costs_to_kv.py [--days 30] [--dry-run]

依賴：
  - wrangler CLI (npx wrangler)
  - data/costs.jsonl
"""

import json
import subprocess
import sys
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from collections import defaultdict

# ── Config ──
REPO_ROOT = Path(__file__).parent.parent
COSTS_FILE = REPO_ROOT / "data" / "costs.jsonl"
WRANGLER_CONFIG = "worker/wrangler.toml"
KV_NAMESPACE_ID = "c066a2fd7942494c8ead37cc518b191b"
DEFAULT_DAYS = 30
TW_TZ = timezone(timedelta(hours=8))


def dedup_key(record: dict) -> str:
    """產生去重用的 key，確保同一筆費用不會重複寫入"""
    ts = record.get("timestamp", "")
    source = record.get("source", "")
    action = record.get("action", "")
    note = record.get("note", "")
    cost = record.get("costUSD", 0)
    # 組合多個欄位，降低碰撞機率
    return f"{ts}|{source}|{action}|{note}|{cost}"


def date_from_timestamp(ts: str) -> str:
    """從 timestamp 提取台灣日期 YYYY-MM-DD"""
    try:
        # 嘗試 ISO 格式
        if "T" in ts:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            tw_dt = dt.astimezone(TW_TZ)
            return tw_dt.strftime("%Y-%m-%d")
        return ts[:10]
    except Exception:
        return ts[:10] if len(ts) >= 10 else ""


def read_costs_jsonl(days: int) -> dict[str, list[dict]]:
    """讀 costs.jsonl，按台灣日期分組，只取最近 N 天"""
    if not COSTS_FILE.exists():
        print("ERROR: costs.jsonl not found")
        return {}

    cutoff = (datetime.now(TW_TZ) - timedelta(days=days)).strftime("%Y-%m-%d")
    by_date: dict[str, list[dict]] = defaultdict(list)

    with open(COSTS_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue

            date_str = date_from_timestamp(record.get("timestamp", ""))
            if not date_str or date_str < cutoff:
                continue

            # 標記來源，方便日後追蹤
            if "_origin" not in record:
                record["_origin"] = "costs.jsonl"

            by_date[date_str].append(record)

    return dict(by_date)


def kv_get(key: str) -> str | None:
    """從 KV 讀取一個 key"""
    try:
        result = subprocess.run(
            [
                "npx", "wrangler", "kv:key", "get",
                "--config", WRANGLER_CONFIG,
                "--namespace-id", KV_NAMESPACE_ID,
                key,
            ],
            capture_output=True, text=True, timeout=15,
            cwd=str(REPO_ROOT),
        )
        if result.returncode != 0:
            return None
        output = result.stdout.strip()
        # wrangler 輸出可能有前綴訊息，找到 JSON 部分
        if output.startswith("["):
            return output
        # 嘗試找第一個 [ 開頭的行
        for line in output.split("\n"):
            if line.strip().startswith("["):
                return line.strip()
        return None
    except Exception as e:
        print(f"  WARN: kv_get({key}) failed: {e}")
        return None


def kv_put(key: str, value: str) -> bool:
    """寫入一個 KV key"""
    try:
        result = subprocess.run(
            [
                "npx", "wrangler", "kv:key", "put",
                "--config", WRANGLER_CONFIG,
                "--namespace-id", KV_NAMESPACE_ID,
                key, value,
            ],
            capture_output=True, text=True, timeout=15,
            cwd=str(REPO_ROOT),
        )
        return result.returncode == 0
    except Exception as e:
        print(f"  WARN: kv_put({key}) failed: {e}")
        return False


def merge_records(existing: list[dict], new_records: list[dict]) -> tuple[list[dict], int]:
    """合併兩組 records，用 dedup_key 去重。回傳 (merged, added_count)"""
    seen = set()
    merged = []

    # 先加入既有的（KV 裡的）
    for r in existing:
        dk = dedup_key(r)
        if dk not in seen:
            seen.add(dk)
            merged.append(r)

    # 再加入新的（costs.jsonl 裡的）
    added = 0
    for r in new_records:
        dk = dedup_key(r)
        if dk not in seen:
            seen.add(dk)
            merged.append(r)
            added += 1

    # 按 timestamp 排序
    merged.sort(key=lambda x: x.get("timestamp", ""))
    return merged, added


def main():
    dry_run = "--dry-run" in sys.argv
    days = DEFAULT_DAYS

    for i, arg in enumerate(sys.argv):
        if arg == "--days" and i + 1 < len(sys.argv):
            days = int(sys.argv[i + 1])

    print(f"sync_costs_to_kv: scanning last {days} days" + (" [DRY RUN]" if dry_run else ""))

    # 1. 讀本機 costs.jsonl
    local_by_date = read_costs_jsonl(days)
    if not local_by_date:
        print("  No local cost records to sync")
        return

    total_added = 0
    total_dates = 0

    # 2. 逐日合併
    for date_str in sorted(local_by_date.keys()):
        kv_key = f"costs_{date_str}"
        local_records = local_by_date[date_str]

        # 讀 KV 現有資料
        existing_raw = kv_get(kv_key)
        existing = []
        if existing_raw:
            try:
                existing = json.loads(existing_raw)
            except json.JSONDecodeError:
                existing = []

        # 合併
        merged, added = merge_records(existing, local_records)

        if added == 0:
            continue

        total_added += added
        total_dates += 1

        if dry_run:
            print(f"  {date_str}: would add {added} records (existing {len(existing)} → merged {len(merged)})")
        else:
            if kv_put(kv_key, json.dumps(merged)):
                print(f"  ✅ {date_str}: +{added} records ({len(existing)} → {len(merged)})")
            else:
                print(f"  ❌ {date_str}: KV write failed")

    if total_added == 0:
        print("  All records already in sync")
    else:
        action = "would sync" if dry_run else "synced"
        print(f"  Done: {action} {total_added} records across {total_dates} days")

    # 3. 寫 costs_summary（累計值，給 /ticker 用）
    #    掃全量 costs.jsonl + 合併 KV 裡可能有但 jsonl 沒有的（Worker 翻譯工具費用）
    update_summary(dry_run, days)


def update_summary(dry_run: bool, sync_days: int):
    """計算全量累計 summary 寫進 KV costs_summary"""
    # 從 costs.jsonl 讀全量
    all_records = []
    if COSTS_FILE.exists():
        with open(COSTS_FILE) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    all_records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    local_keys = {dedup_key(r) for r in all_records}

    # 從 KV 讀最近 sync_days 天，找出 jsonl 裡沒有的記錄（Worker 產生的）
    now = datetime.now(TW_TZ)
    for i in range(sync_days):
        date_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        kv_key = f"costs_{date_str}"
        existing_raw = kv_get(kv_key)
        if not existing_raw:
            continue
        try:
            kv_records = json.loads(existing_raw)
        except json.JSONDecodeError:
            continue
        for r in kv_records:
            if dedup_key(r) not in local_keys:
                all_records.append(r)

    total_usd = sum(r.get("costUSD", 0) for r in all_records)
    total_tokens = sum(
        r.get("inputTokens", 0) + r.get("outputTokens", 0) for r in all_records
    )
    total_calls = len(all_records)

    summary = {
        "totalUSD": round(total_usd, 4),
        "totalTokens": total_tokens,
        "totalCalls": total_calls,
        "updatedAt": datetime.now(TW_TZ).isoformat(),
    }

    if dry_run:
        print(f"  Summary: {total_calls} calls, {total_tokens:,} tokens, ${total_usd:.2f} [DRY RUN]")
    else:
        if kv_put("costs_summary", json.dumps(summary)):
            print(f"  ✅ Summary → KV: {total_calls} calls, {total_tokens:,} tokens, ${total_usd:.2f}")
        else:
            print(f"  ❌ Summary KV write failed")


if __name__ == "__main__":
    main()
