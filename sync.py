"""Conservative EAFCStats HTML table adapter.

Only imports unambiguous standings and match tables. Never synthesizes scores.
EAFCStats may change its markup or block server requests; diagnostics expose that.
"""
import re
from datetime import datetime, timezone
from pathlib import Path
import json
import httpx
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
SOURCES = {'afj': 259, 'vpg': 294, 'bronze': 301}
HEADERS = {'User-Agent': 'LosIntocablesFC27/1.0 (competition-data integration)', 'Accept': 'text/html,application/xhtml+xml'}

def norm(s):
    return re.sub(r'\s+', ' ', str(s or '')).strip()

def compact(s):
    return re.sub(r'[^a-z0-9]', '', norm(s).lower().translate(str.maketrans('áéíóúñ', 'aeioun')))

def parse_html(html):
    soup = BeautifulSoup(html, 'html.parser')
    standings, matches = [], []
    for table in soup.select('table'):
        rows = table.select('tr')
        if len(rows) < 2:
            continue
        headings = [compact(c.get_text(' ', strip=True)) for c in rows[0].select('th,td')]
        if not headings:
            continue
        def idx(*aliases):
            return next((i for i,h in enumerate(headings) if h in aliases), None)
        team = idx('equipo','club','team'); played=idx('pj','p','played','partidos'); points=idx('pts','puntos','points')
        if team is not None and played is not None and points is not None:
            for row in rows[1:]:
                cells=[norm(c.get_text(' ',strip=True)) for c in row.select('td,th')]
                if len(cells)!=len(headings) or not cells[team] or not cells[points].isdigit():continue
                def get(*names):
                    i=idx(*names)
                    return cells[i] if i is not None else '—'
                standings.append({'position':get('pos','position','puesto','#') if idx('pos','position','puesto','#') is not None else str(len(standings)+1),
                    'team':cells[team],'played':cells[played],'won':get('g','pg','ganados','victorias','w'),
                    'drawn':get('e','pe','empatados','empates','d'),'lost':get('p','pp','perdidos','derrotas','l'), 'points':cells[points]})
            continue
        home=idx('local','home','equipolocal');away=idx('visitante','away','equipovisitante');score=idx('resultado','marcador','score')
        if home is not None and away is not None and score is not None:
            for row in rows[1:]:
                cells=[norm(c.get_text(' ',strip=True)) for c in row.select('td,th')]
                if len(cells)!=len(headings) or not cells[home] or not cells[away]:continue
                result=re.fullmatch(r'(\d{1,2})\s*[-:]\s*(\d{1,2})',cells[score])
                date_i=idx('fecha','date','dia','jornada')
                matches.append({'id':f'row-{len(matches)+1}','home':cells[home],'away':cells[away],
                    'home_score':result.group(1) if result else None,'away_score':result.group(2) if result else None,
                    'date':cells[date_i] if date_i is not None else '', 'status':'Finalizado' if result else 'Pendiente'})
    return matches, standings

async def sync_one(key):
    if key not in SOURCES: raise ValueError('Unknown competition')
    url=f'https://www.eafcstats.es/competitions/{SOURCES[key]}'
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=18, follow_redirects=True) as client:
            r=await client.get(url)
            r.raise_for_status()
        matches, standings=parse_html(r.text)
        if not matches and not standings:
            return {'ok':False,'reason':'No se encontraron tablas compatibles y verificables; la página puede usar JavaScript o haber cambiado de estructura.','http_status':r.status_code}
        payload={'source_url':url,'verified_at':datetime.now(timezone.utc).isoformat(),'matches':matches,'standings':standings}
        DATA.mkdir(exist_ok=True)
        path=DATA/f'{key}.json'
        tmp=DATA/f'{key}.tmp'
        tmp.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
        tmp.replace(path)
        return {'ok':True,'matches':len(matches),'standings':len(standings),'verified_at':payload['verified_at']}
    except (httpx.HTTPError, OSError) as exc:
        return {'ok':False,'reason':f'{type(exc).__name__}: {str(exc)[:160]}'}
