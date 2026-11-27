"""API for verified competition data. Never fabricates matches or tables.

Optional ingestion: publish JSON snapshots in server/data/<id>.json after verifying
source accuracy. A separate official feed adapter can replace this mechanism.
"""
from datetime import datetime, timezone
from pathlib import Path
import secrets
import json
from fastapi import FastAPI, Header, HTTPException
from sync import sync_one, SOURCES, SYNC_STATUS
from admin_panel import router as admin_router, guard
from fc27_importer import periodic_matches, sync_matches, STATUS as MATCH_IMPORT_STATUS
import asyncio
import os
from contextlib import asynccontextmanager
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

async def periodic_sync():
    while True:
        await asyncio.gather(*(sync_one(key) for key in SOURCES))
        await asyncio.sleep(max(300, int(os.getenv('SYNC_SECONDS', '900'))))

@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(periodic_sync())
    match_task = asyncio.create_task(periodic_matches())
    try:
        yield
    finally:
        task.cancel()
        match_task.cancel()
        await asyncio.gather(task, match_task, return_exceptions=True)

app = FastAPI(title="Los Intocables FC 27", lifespan=lifespan)
app.include_router(admin_router)
ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
COMPETITIONS = [
    ('afj', 'AFJ · 4ª División', '259'),
    ('vpg', 'VPG · 5ª División C', '294'),
    ('bronze', 'VPG · Bronze Zero', '301'),
]

def load_competition(key, name, source):
    result = {'id': key, 'name': name, 'source': source, 'matches': [],
              'standings': [], 'updated_at': None, 'status': 'unavailable',
              'message': 'Esperando integración con una fuente verificable de esta competición.'}
    path = DATA / f'{key}.json'
    if not path.is_file():
        return result
    try:
        payload = json.loads(path.read_text(encoding='utf-8'))
        if not isinstance(payload, dict):
            raise ValueError('Invalid snapshot')
        if not isinstance(payload.get('matches'), list) or not isinstance(payload.get('standings'), list):
            raise ValueError('Missing lists')
        if not payload.get('verified_at'):
            raise ValueError('Snapshot requires verified_at')
        result.update(matches=payload['matches'], standings=payload['standings'],
                      updated_at=payload['verified_at'], status='ok', message='')
    except (ValueError, OSError, TypeError, json.JSONDecodeError):
        result['message'] = 'El archivo de datos no supera la validación; se ha descartado.'
    return result

@app.post('/api/sync')
async def sync_now(authorization: str | None = Header(default=None)):
    token = os.getenv('SYNC_ADMIN_TOKEN', '').strip()
    if not token or not authorization or not secrets.compare_digest(authorization, 'Bearer ' + token):
        raise HTTPException(status_code=403, detail='Sin autorización')
    return {'results': dict(zip(SOURCES, await asyncio.gather(*(sync_one(k) for k in SOURCES))))}

@app.get('/api/sync/status')
def sync_status():
    return {'sources': SYNC_STATUS}

@app.get('/api/matches/import/status')
def match_import_status():
    return MATCH_IMPORT_STATUS

@app.post('/api/matches/import/refresh')
async def refresh_matches(request: __import__('fastapi').Request):
    guard(request)
    return await sync_matches()

@app.get('/api/health')
def health():
    return {'status': 'ok', 'time': datetime.now(timezone.utc).isoformat()}

@app.get('/api/competitions')
def competitions():
    return {'competitions': [load_competition(*c) for c in COMPETITIONS]}

@app.get('/api/competitions/{competition_id}')
def competition(competition_id: str):
    from fastapi import HTTPException
    for c in COMPETITIONS:
        if c[0] == competition_id:
            return load_competition(*c)
    raise HTTPException(status_code=404, detail='Competición desconocida')


@app.get('/api/twitch/videos')
def twitch_videos():
    import urllib.request
    import urllib.parse
    client = os.getenv('TWITCH_CLIENT_ID', '').strip()
    secret = os.getenv('TWITCH_CLIENT_SECRET', '').strip()
    channel = os.getenv('TWITCH_CHANNEL', 'losintocablesfc').strip()
    if not client or not secret:
        raise HTTPException(503, 'Configura las credenciales de Twitch en Render.')
    try:
        body = urllib.parse.urlencode({'client_id': client, 'client_secret': secret, 'grant_type': 'client_credentials'}).encode()
        with urllib.request.urlopen(urllib.request.Request('https://id.twitch.tv/oauth2/token', data=body), timeout=10) as res:
            token = json.load(res)['access_token']
        def helix(path, params):
            url = 'https://api.twitch.tv/helix/' + path + '?' + urllib.parse.urlencode(params)
            req = urllib.request.Request(url, headers={'Client-Id': client, 'Authorization': 'Bearer ' + token})
            with urllib.request.urlopen(req, timeout=10) as res:
                return json.load(res)['data']
        users = helix('users', {'login': channel})
        if not users:
            raise HTTPException(404, 'Canal de Twitch no encontrado.')
        videos = helix('videos', {'user_id': users[0]['id'], 'type': 'archive', 'first': 12})
        return {'channel': channel, 'videos': videos}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, 'No se pudo consultar Twitch. Comprueba las credenciales y vuelve a intentarlo.')

DIST = ROOT / 'dist'
if DIST.exists():
    app.mount('/assets', StaticFiles(directory=DIST / 'assets'), name='assets')

    @app.get('/{path:path}')
    def frontend(path: str):
        target = (DIST / path).resolve()
        if target.is_relative_to(DIST.resolve()) and target.is_file():
            return FileResponse(target)
        return FileResponse(DIST / 'index.html')
