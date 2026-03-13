#!/usr/bin/env python3
"""
SEO Layer 2: Auto-submit new URLs to Google Indexing API.

Reads sitemap-index.xml → parses all child sitemaps → compares with
.seo/indexed-urls.txt → submits new URLs via Indexing API → updates the file.
"""

import json
import os
import sys
import tempfile
from pathlib import Path
from xml.etree import ElementTree as ET

import requests
from google.oauth2 import service_account

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SITEMAP_INDEX_URL = "https://paulkuo.tw/sitemap-index.xml"
INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"
SCOPES = ["https://www.googleapis.com/auth/indexing"]
DAILY_LIMIT = 200

REPO_ROOT = Path(__file__).resolve().parent.parent
INDEXED_FILE = REPO_ROOT / ".seo" / "indexed-urls.txt"

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

def get_credentials():
    """Build credentials from GOOGLE_INDEXING_KEY env var (JSON string)."""
    key_json = os.environ.get("GOOGLE_INDEXING_KEY")
    if not key_json:
        print("ERROR: GOOGLE_INDEXING_KEY environment variable is not set.")
        sys.exit(1)

    key_path = Path(tempfile.gettempdir()) / "gcp-key.json"
    key_path.write_text(key_json)

    creds = service_account.Credentials.from_service_account_file(
        str(key_path), scopes=SCOPES
    )

    # Clean up
    key_path.unlink(missing_ok=True)
    return creds


# ---------------------------------------------------------------------------
# Sitemap helpers
# ---------------------------------------------------------------------------
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def fetch_sitemap_index(url: str) -> list[str]:
    """Return list of child sitemap URLs from a sitemap index."""
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    return [loc.text.strip() for loc in root.findall(".//sm:loc", NS) if loc.text]


def fetch_sitemap_urls(sitemap_url: str) -> list[str]:
    """Return all <loc> URLs from a single sitemap."""
    resp = requests.get(sitemap_url, timeout=30)
    resp.raise_for_status()
    root = ET.fromstring(resp.content)
    return [loc.text.strip() for loc in root.findall(".//sm:loc", NS) if loc.text]


def get_all_urls() -> set[str]:
    """Fetch sitemap index, then each child sitemap, return all URLs."""
    print(f"Fetching sitemap index: {SITEMAP_INDEX_URL}")
    child_sitemaps = fetch_sitemap_index(SITEMAP_INDEX_URL)
    print(f"  Found {len(child_sitemaps)} child sitemap(s)")

    all_urls: set[str] = set()
    for sm_url in child_sitemaps:
        urls = fetch_sitemap_urls(sm_url)
        print(f"  {sm_url} → {len(urls)} URLs")
        all_urls.update(urls)

    print(f"Total URLs from sitemap: {len(all_urls)}")
    return all_urls


# ---------------------------------------------------------------------------
# Indexed URLs tracking
# ---------------------------------------------------------------------------

def load_indexed() -> set[str]:
    if not INDEXED_FILE.exists():
        return set()
    return {
        line.strip()
        for line in INDEXED_FILE.read_text().splitlines()
        if line.strip()
    }


def save_indexed(urls: set[str]) -> None:
    INDEXED_FILE.parent.mkdir(parents=True, exist_ok=True)
    INDEXED_FILE.write_text("\n".join(sorted(urls)) + "\n")


# ---------------------------------------------------------------------------
# Indexing API
# ---------------------------------------------------------------------------

def submit_url(session: requests.Session, url: str) -> bool:
    """Submit a single URL to Google Indexing API. Returns True on success."""
    payload = {"url": url, "type": "URL_UPDATED"}
    resp = session.post(INDEXING_ENDPOINT, json=payload)
    if resp.status_code == 200:
        return True
    else:
        print(f"  FAIL [{resp.status_code}]: {url}")
        try:
            print(f"    {resp.json()}")
        except Exception:
            print(f"    {resp.text[:200]}")
        return False


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # 1. Gather URLs
    all_urls = get_all_urls()
    indexed = load_indexed()
    new_urls = sorted(all_urls - indexed)

    print(f"\nAlready indexed: {len(indexed)}")
    print(f"New URLs to submit: {len(new_urls)}")

    if not new_urls:
        print("Nothing new to submit. Done!")
        return

    # 2. Cap at daily limit
    batch = new_urls[:DAILY_LIMIT]
    if len(new_urls) > DAILY_LIMIT:
        print(f"Capping to daily limit of {DAILY_LIMIT} (remaining {len(new_urls) - DAILY_LIMIT} will be submitted next run)")

    # 3. Auth
    creds = get_credentials()
    session = requests.Session()

    # Manually set auth header using token
    creds.refresh(requests.Request())  # type: ignore[arg-type]
    # Use google.auth.transport.requests for proper token refresh
    from google.auth.transport.requests import Request as AuthRequest
    creds.refresh(AuthRequest())
    session.headers["Authorization"] = f"Bearer {creds.token}"
    session.headers["Content-Type"] = "application/json"

    # 4. Submit
    success_count = 0
    fail_count = 0

    for url in batch:
        ok = submit_url(session, url)
        if ok:
            print(f"  OK: {url}")
            indexed.add(url)
            success_count += 1
        else:
            fail_count += 1

    # 5. Save
    save_indexed(indexed)

    # 6. Summary
    print(f"\n{'='*60}")
    print(f"Submitted: {success_count} OK / {fail_count} failed")
    print(f"Total indexed URLs: {len(indexed)}")
    print(f"{'='*60}")

    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
