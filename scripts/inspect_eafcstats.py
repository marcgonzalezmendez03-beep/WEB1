#!/usr/bin/env python3
"""Inspecciona las fuentes de calendario de EAFCStats usando un navegador real.
Uso: pip install playwright && python -m playwright install chromium
     python scripts/inspect_eafcstats.py
No modifica los calendarios existentes; guarda capturas de diagnóstico.
"""
import asyncio, json, re
from pathlib import Path
from playwright.async_api import async_playwright

COMPETITIONS = {"afj":259,"vpg":294,"bronze":301}
OUT = Path("calendar-inspection")
OUT.mkdir(exist_ok=True)

async def inspect(browser, name, competition_id):
    page = await browser.new_page(locale="es-ES", timezone_id="Europe/Madrid")
    responses = []
    async def capture(response):
        try:
            if response.request.resource_type not in ("xhr", "fetch"): return
            body = await response.text()
            if len(body) > 500_000: return
            responses.append({"url":response.url,"status":response.status,"body":body[:100000]})
        except Exception: pass
    page.on("response", capture)
    url = f"https://www.eafcstats.es/competitions/{competition_id}"
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await page.wait_for_timeout(6000)
        await page.screenshot(path=str(OUT/f"{name}.png"), full_page=True)
        (OUT/f"{name}.html").write_text(await page.content(),encoding="utf-8")
        (OUT/f"{name}.json").write_text(json.dumps({"url":page.url,"title":await page.title(),"responses":responses},ensure_ascii=False,indent=2),encoding="utf-8")
        print(f"{name}: {len(responses)} peticiones API capturadas; revisar calendar-inspection/{name}.json")
    except Exception as exc:
        print(f"{name}: error de acceso: {exc}")
    finally: await page.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for name, id_ in COMPETITIONS.items(): await inspect(browser,name,id_)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
