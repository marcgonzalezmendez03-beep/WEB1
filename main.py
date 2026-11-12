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
    try:
        yield
    finally:
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

app = FastAPI(title="Los Intocables FC 27", lifespan=lifespan)
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

DIST = ROOT / 'dist'
if DIST.exists():
    app.mount('/assets', StaticFiles(directory=DIST / 'assets'), name='assets')

    @app.get('/{path:path}')
    def frontend(path: str):
        target = (DIST / path).resolve()
        if target.is_relative_to(DIST.resolve()) and target.is_file():
            return FileResponse(target)
        return FileResponse(DIST / 'index.html')
