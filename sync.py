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

SYNC_STATUS = {}

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
    url=('https://eafcstats.es/competiciones/afj-division-4a/clasificacion' if key == 'afj' else f'https://www.eafcstats.es/competitions/{SOURCES[key]}')
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


def extract_embedded_data(html):
    """Read JSON state embedded in HTML; never guess fixtures from plain text."""
    soup = BeautifulSoup(html, 'html.parser')
    payloads = []
    for script in soup.select('script[type="application/json"], script#__NEXT_DATA__'):
        raw = script.string or script.get_text()
        if not raw or len(raw) > 5_000_000:
            continue
        try:
            payloads.append(json.loads(raw))
        except (ValueError, TypeError):
            pass
    return payloads

def extract_structured_matches(html):
    """Recognize fixtures only when home and away are explicit structured fields."""
    found = []
    seen = set()
    def label(obj):
        if isinstance(obj, str):
            return norm(obj)
        if isinstance(obj, dict):
            for key in ('name','teamName','clubName','displayName','title'):
                if isinstance(obj.get(key), str):
                    return norm(obj[key])
        return ''
    def walk(obj, depth=0):
        if depth > 18:
            return
        if isinstance(obj, list):
            for item in obj[:1500]:
                walk(item,depth+1)
        elif isinstance(obj, dict):
            home = next((obj[k] for k in ('homeTeam','home_team','home','local') if k in obj),None)
            away = next((obj[k] for k in ('awayTeam','away_team','away','visitor','visitante') if k in obj),None)
            h,a=label(home),label(away)
            if h and a and h.casefold()!=a.casefold() and ('intocables' in h.casefold() or 'intocables' in a.casefold()):
                score=obj.get('score')
                hs=next((obj[k] for k in ('homeScore','home_score','homeGoals') if k in obj),None)
                az=next((obj[k] for k in ('awayScore','away_score','awayGoals') if k in obj),None)
                if isinstance(score,dict):
                    hs=score.get('home',hs)
                    az=score.get('away',az)
                valid=lambda x: isinstance(x,int) and not isinstance(x,bool) and 0<=x<=99
                completed=valid(hs) and valid(az)
                date=next((str(obj[k]) for k in ('date','scheduledAt','startTime','kickoff','matchDate') if obj.get(k)), '')
                roundval=next((str(obj[k]) for k in ('round','matchday','jornada','week') if obj.get(k) is not None),'')
                item={'home':h,'away':a,'home_score':hs if completed else None,
                    'away_score':az if completed else None,'date':date,'round':roundval,
                    'status':'Finalizado' if completed else 'Programado'}
                key=(h.casefold(),a.casefold(),date,roundval)
                if key not in seen:
                    seen.add(key)
                    found.append(item)
            for value in obj.values():
                if isinstance(value,(dict,list)):
                    walk(value,depth+1)
    for payload in extract_embedded_data(html):
        walk(payload)
    return found

async def sync_vpg(key):
    """Refresh from EAFCStats first; retain last valid table on any failure."""
    official = f'https://www.eafcstats.es/competitions/{SOURCES[key]}'
    backup = VPG_URLS[key]
    diagnostics = {'source_url':official,'checked_at':datetime.now(timezone.utc).isoformat(),'state':'checking'}
    SYNC_STATUS[key] = diagnostics
    path = DATA / f'{key}.json'
    previous = {}
    if path.exists():
        try:
            previous = json.loads(path.read_text(encoding='utf-8'))
        except (OSError, ValueError, TypeError):
            previous = {}
    standings = []
    matches = []
    selected_source = ''
    try:
        async with httpx.AsyncClient(headers=HEADERS, timeout=25, follow_redirects=True) as client:
            try:
                response = await client.get(official)
                diagnostics['eafcstats_http_status'] = response.status_code
                if response.is_success:
                    e_matches, e_standings = parse_html(response.text)
                    # Never replace a complete league table with an unrelated or partial table.
                    if len(e_standings) >= 10 and any('intocables' in compact(row.get('team')) for row in e_standings):
                        standings = e_standings
                        selected_source = official
                    if e_matches:
                        matches = [m for m in e_matches if 'intocables' in compact(m.get('home')) or 'intocables' in compact(m.get('away'))]
            except httpx.HTTPError as exc:
                diagnostics['eafcstats_error'] = type(exc).__name__

            # Secondary source: official VPG page, only when EAFCStats yielded no valid table.
            if not standings:
                for endpoint in (backup, backup + '/matches', backup + '/matches?status=completed', backup + '/matches?status=scheduled'):
                    try:
                        response = await client.get(endpoint)
                        diagnostics[endpoint] = response.status_code
                        if not response.is_success:
                            continue
                        if not standings:
                            candidate = parse_vpg_standings(response.text)
                            if len(candidate) >= 10 and any('intocables' in compact(row.get('team')) for row in candidate):
                                standings = candidate
                                selected_source = backup
                        if not matches:
                            matches = extract_structured_matches(response.text)
                            matches.extend(parse_vpg_matches(response.text,'scheduled'))
                    except httpx.HTTPError as exc:
                        diagnostics[endpoint] = type(exc).__name__
        previous_standings = previous.get('standings', [])
        previous_matches = previous.get('matches', [])
        if not standings:
            standings = previous_standings
        if not matches:
            matches = previous_matches
        if not standings and not matches:
            diagnostics.update(state='unavailable',reason='Ninguna fuente ha devuelto datos verificables.')
            return {'ok':False,'reason':diagnostics['reason']}
        changed = standings != previous_standings or matches != previous_matches
        # Keep the original snapshot date unless fresh official data was actually obtained.
        fresh = bool(selected_source or (matches and matches != previous_matches))
        verified_at = (datetime.now(timezone.utc).isoformat() if fresh else previous.get('verified_at'))
        if not verified_at:
            verified_at = datetime.now(timezone.utc).isoformat()
        payload = {'source_url':selected_source or previous.get('source_url',backup),
                   'verified_at':verified_at,'matches':matches,'standings':standings}
        if changed or not path.exists():
            DATA.mkdir(exist_ok=True)
            tmp = DATA / f'{key}.tmp'
            tmp.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
            tmp.replace(path)
        diagnostics.update(state='ok' if fresh else 'cached',source_used=payload['source_url'],
                           changed=changed,matches=len(matches),standings=len(standings),
                           reason='' if fresh else 'Se mantiene la última clasificación guardada; no se pudo leer una nueva.')
        return {'ok':True,'changed':changed,'fresh':fresh,'matches':len(matches),'standings':len(standings)}
    except (OSError, ValueError, TypeError) as exc:
        diagnostics.update(state='error',reason=f'{type(exc).__name__}: {str(exc)[:160]}')
        return {'ok':False,'reason':diagnostics['reason']}
