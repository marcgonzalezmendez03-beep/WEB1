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
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
SOURCES = {'afj': 259, 'vpg': 294, 'bronze': 301}
VPG_URLS = {'vpg': 'https://virtualprogaming.com/league/quinta-division-c', 'bronze': 'https://virtualprogaming.com/league/superliga-zero-spain'}
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
    if key in VPG_URLS:
        return await sync_vpg(key)
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

def parse_vpg_standings(html):
    """Read VPG standings only when the official HTML exposes a real table."""
    soup = BeautifulSoup(html, 'html.parser')
    rows = []
    for table in soup.select('table'):
        trs = table.select('tr')
        if len(trs) < 2:
            continue
        headers = [compact(x.get_text(' ', strip=True)) for x in trs[0].select('th,td')]
        def col(*aliases):
            return next((i for i,h in enumerate(headers) if h in aliases), None)
        team_i = col('team','equipo')
        pts_i = col('points','pts','puntos')
        if team_i is None or pts_i is None:
            continue
        for tr in trs[1:]:
            cells = [norm(x.get_text(' ', strip=True)) for x in tr.select('th,td')]
            if len(cells) != len(headers) or not cells[team_i] or not cells[pts_i].isdigit():
                continue
            def get(*aliases):
                i = col(*aliases)
                return cells[i] if i is not None else ''
            rows.append({'position': get('pos','position','rank') or str(len(rows)+1),
                'team':cells[team_i],'played':get('played','pj'),
                'won':get('wins','won','pg'),'drawn':get('draws','drawn','pe'),
                'lost':get('losses','lost','pp'),'gd':get('gd'),
                'points':cells[pts_i]})
        if rows:
            break
    return rows

def parse_vpg_matches(html, state):
    """Parse visible VPG match cards; only keep games with a verified team label."""
    soup = BeautifulSoup(html, 'html.parser')
    matches = []
    seen = set()
    # VPG currently labels team names and score values in match cards.
    # Extract only card containers with two team names, not page-wide text.
    for card in soup.select('article, [class*="match-card"], [class*="MatchCard"], [data-testid*="match"], [class*="fixture-card"]'):
        text = norm(card.get_text(' ',strip=True))
        if 'LOS INTOCABLES' not in text.upper():
            continue
        names = [norm(x.get_text(' ',strip=True)) for x in card.select('[class*="team-name"],[class*="teamName"],[class*="TeamName"]')]
        names = [n for n in names if n]
        if len(names) != 2 or not any('LOS INTOCABLES' in n.upper() for n in names):
            continue
        scores = [norm(x.get_text(' ',strip=True)) for x in card.select('[class*="score"],[class*="Score"]')]
        scores = [x for x in scores if x.isdigit()]
        finished = state == 'completed' and len(scores) >= 2
        date_el = card.select_one('time')
        date = date_el.get('datetime') if date_el and date_el.get('datetime') else (norm(date_el.get_text(' ',strip=True)) if date_el else '')
        match = {'home':names[0],'away':names[1],'home_score':scores[0] if finished else None,
            'away_score':scores[1] if finished else None,'date':date,
            'status':'Finalizado' if finished else 'Programado','round':''}
        key = (match['home'],match['away'],match['date'],match['status'])
        if key not in seen:
            seen.add(key)
            matches.append(match)
    return matches

async def sync_vpg(key):
    url = VPG_URLS[key]
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=25, follow_redirects=True) as client:
            table_response = await client.get(url)
            table_response.raise_for_status()
            standings = parse_vpg_standings(table_response.text)
            matches = []
            for state in ('completed','scheduled'):
                # Separate views on VPG, may be rendered dynamically by the provider.
                for match_url in (url + '/matches?status=' + state,):
                    response = await client.get(match_url)
                    if response.is_success:
                        matches.extend(parse_vpg_matches(response.text,state))
        if not standings and not matches:
            return {'ok':False,'reason':'VPG no expone datos de tabla o tarjetas de partido en HTML verificable.'}
        path = DATA / f'{key}.json'
        existing = {}
        if path.is_file():
            try:
                existing = json.loads(path.read_text(encoding='utf-8'))
            except (ValueError,OSError):
                pass
        if not standings:
            standings = existing.get('standings',[])
        if not matches:
            matches = existing.get('matches',[])
        payload = {'source_url':url,'verified_at':datetime.now(timezone.utc).isoformat(),
            'matches':matches,'standings':standings}
        DATA.mkdir(exist_ok=True)
        temp = DATA / f'{key}.tmp'
        temp.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
        temp.replace(path)
        return {'ok':True,'matches':len(matches),'standings':len(standings)}
    except (httpx.HTTPError,OSError) as exc:
        return {'ok':False,'reason':f'{type(exc).__name__}: {str(exc)[:160]}'}
