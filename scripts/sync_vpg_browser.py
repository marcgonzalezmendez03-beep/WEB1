"""Browser-based, conservative sync for the two VPG leagues.
Run in GitHub Actions: python scripts/sync_vpg_browser.py
Only writes a table with >=10 clubs including Los Intocables.
"""
import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from sync import parse_html, parse_vpg_standings, compact

LEAGUES = {
    "vpg": "https://virtualprogaming.com/league/quinta-division-c",
    "bronze": "https://virtualprogaming.com/league/superliga-zero-spain",
}


async def fetch(page, url):
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(7000)
        return await page.content()
    except Exception as exc:
        print(f"Could not load {url}: {type(exc).__name__}: {exc}")
        return ""


async def main():
    async with async_playwright() as browser_api:
        browser = await browser_api.chromium.launch(headless=True)
        page = await browser.new_page(locale="es-ES", viewport={"width": 1365, "height": 900})
        for key, base in LEAGUES.items():
            print(f"Checking {key}...")
            standings = []
            source = ""
            for url in (base, base + "/table", base + "/standings"):
                html = await fetch(page, url)
                if not html:
                    continue
                _, candidate = parse_html(html)
                if not candidate:
                    candidate = parse_vpg_standings(html)
                if len(candidate) >= 10 and any("intocables" in compact(row.get("team")) for row in candidate):
                    standings, source = candidate, url
                    break
                print(f"  {url}: {len(candidate)} recognized table rows")
            matches = []
            match_html = await fetch(page, base + "/matches")
            if match_html:
                from sync import extract_structured_matches, parse_vpg_matches
                matches = extract_structured_matches(match_html)
                matches.extend(parse_vpg_matches(match_html, "scheduled"))
                matches = [m for m in matches if "intocables" in compact(m.get("home")) or "intocables" in compact(m.get("away"))]
            path = ROOT / "data" / f"{key}.json"
            previous = {}
            if path.exists():
                try:
                    previous = json.loads(path.read_text(encoding="utf-8"))
                except (OSError, ValueError):
                    pass
            if not standings:
                print(f"  No verified standings for {key}; retaining existing snapshot")
                continue
            payload = {
                "source_url": source,
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "matches": matches or previous.get("matches", []),
                "standings": standings,
            }
            path.parent.mkdir(parents=True, exist_ok=True)
            # Avoid committing new timestamps when the actual data did not change.
            if payload["standings"] == previous.get("standings") and payload["matches"] == previous.get("matches"):
                print(f"  {key}: no changes")
                continue
            path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"  {key}: saved {len(standings)} verified teams, {len(payload['matches'])} matches")
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
