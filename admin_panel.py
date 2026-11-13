"""Panel privado para clasificar partidos importados al HUB."""
import os, sqlite3, secrets, hmac, hashlib, time, json, html
from pathlib import Path
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel

router = APIRouter()
DB = os.getenv("MATCHES_DB_PATH", "/tmp/intocables_matches.sqlite3")
LEAGUES = {"vpg":"VPG 5ª División", "afj":"AFJ 4ª División", "bronze":"Bronze Zero", "friendly":"Amistosos"}
def conn():
    Path(DB).parent.mkdir(parents=True,exist_ok=True)
    c=sqlite3.connect(DB)
    c.row_factory=sqlite3.Row
    c.execute("CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, played_at TEXT, opponent TEXT, home_goals INTEGER, away_goals INTEGER, league TEXT, raw TEXT)")
    return c
def signature(value):
    secret=os.getenv("ADMIN_SESSION_SECRET","")
    return hmac.new(secret.encode(),value.encode(),hashlib.sha256).hexdigest()
def authorized(req):
    token=req.cookies.get("intocables_admin","")
    try:
        stamp,mac=token.split(".",1)
        return bool(os.getenv("ADMIN_SESSION_SECRET")) and int(stamp)>time.time() and hmac.compare_digest(signature(stamp),mac)
    except (ValueError,TypeError):return False
def guard(req):
    if not authorized(req):raise HTTPException(401,"Acceso de administrador requerido")
def page(content):
    return HTMLResponse('<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>Los Intocables · Admin</title><style>body{background:#0b0c10;color:white;font:15px system-ui;margin:0;padding:35px 16px}main{max-width:850px;margin:auto}h1{color:#f04460}article{background:#191b23;border:1px solid #393a43;border-radius:12px;padding:18px;margin:12px 0}input,select,button{padding:12px;border-radius:7px;border:1px solid #555;background:#252733;color:white}button{background:#c82743;border:0;cursor:pointer}form{display:flex;gap:10px;flex-wrap:wrap}small{color:#b9b9c2}a{color:#ff7185}</style><main><h1>LOS INTOCABLES · ADMIN</h1>'+content+'</main></html>')
@router.get("/admin",response_class=HTMLResponse)
def panel(req:Request):
    if not authorized(req):
        return page('<p>Acceso privado, sin correo electrónico.</p><form method="post" action="/admin/login"><input name="username" placeholder="Usuario" required autocomplete="username"><input name="password" type="password" placeholder="Contraseña" required autocomplete="current-password"><button>Entrar</button></form>')
    with conn() as c: rows=c.execute("SELECT * FROM matches ORDER BY played_at DESC").fetchall()
    parts=['<p><a href="/">← Volver a la web</a> · <a href="/admin/logout">Cerrar sesión</a></p><p>Clasifica los partidos obtenidos de la API. Los cambios se guardan al instante.</p>']
    for r in rows:
        opts='<option value="">Sin clasificar</option>'+''.join('<option value="'+k+'"'+(' selected' if r["league"]==k else '')+'>'+v+'</option>' for k,v in LEAGUES.items())
        parts.append('<article><b>'+html.escape(r["opponent"] or "Rival desconocido")+'</b> · '+html.escape(r["played_at"] or "")+'<p>'+html.escape(str(r["home_goals"] if r["home_goals"] is not None else "—"))+' - '+html.escape(str(r["away_goals"] if r["away_goals"] is not None else "—"))+'</p><form method="post" action="/admin/assign"><input type="hidden" name="match_id" value="'+html.escape(r["id"],quote=True)+'"><select name="league">'+opts+'</select><button>Guardar liga</button></form></article>')
    if not rows:parts.append('<article>No hay partidos importados todavía. El conector de FC 27 debe enviar datos a /api/matches/import.</article>')
    return page(''.join(parts))
@router.post("/admin/login")
async def login(req:Request):
    from urllib.parse import parse_qs
    data=parse_qs((await req.body()).decode())
    user=data.get("username",[""])[0];password=data.get("password",[""])[0]
    expected=os.getenv("ADMIN_PASSWORD","")
    if not expected or not os.getenv("ADMIN_SESSION_SECRET") or not (hmac.compare_digest(user,"admin") and hmac.compare_digest(password,expected)):
        return HTMLResponse("Credenciales incorrectas o administrador sin configurar. <a href='/admin'>Volver</a>",status_code=401)
    expiry=str(int(time.time()+8*3600))
    resp=RedirectResponse("/admin",status_code=303)
    resp.set_cookie("intocables_admin",expiry+"."+signature(expiry),httponly=True,secure=True,samesite="lax",max_age=28800)
    return resp
@router.get("/admin/logout")
def logout():
    resp=RedirectResponse("/admin",status_code=303);resp.delete_cookie("intocables_admin");return resp
@router.post("/admin/assign")
async def assign(req:Request):
    from urllib.parse import parse_qs
    guard(req);d=parse_qs((await req.body()).decode())
    mid=d.get("match_id",[""])[0];league=d.get("league",[""])[0]
    if league and league not in LEAGUES:raise HTTPException(400,"Liga no válida")
    with conn() as c:
        cur=c.execute("UPDATE matches SET league=? WHERE id=?",(league or None,mid))
        if not cur.rowcount:raise HTTPException(404,"Partido desconocido")
    return RedirectResponse("/admin",status_code=303)
class MatchIn(BaseModel):
    id:str
    played_at:str|None=None
    opponent:str|None=None
    home_goals:int|None=None
    away_goals:int|None=None
    raw:dict|None=None
@router.post("/api/matches/import")
def import_matches(matches:list[MatchIn],req:Request):
    key=os.getenv("SYNC_ADMIN_TOKEN","")
    if not key or not hmac.compare_digest(req.headers.get("authorization",""),"Bearer "+key):raise HTTPException(403,"Sin autorización")
    if len(matches)>100:raise HTTPException(400,"Máximo 100 partidos por lote")
    with conn() as c:
        for m in matches:
            if not m.id or len(m.id)>200:raise HTTPException(400,"ID inválido")
            c.execute("""INSERT INTO matches(id,played_at,opponent,home_goals,away_goals,raw) VALUES(?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET played_at=excluded.played_at,opponent=excluded.opponent,home_goals=excluded.home_goals,away_goals=excluded.away_goals,raw=excluded.raw""",(m.id,m.played_at,m.opponent,m.home_goals,m.away_goals,json.dumps(m.raw or {})))
    return {"imported":len(matches)}
@router.get("/api/matches")
def public_matches():
    with conn() as c: rows=c.execute("SELECT id,played_at,opponent,home_goals,away_goals,league FROM matches WHERE league IS NOT NULL ORDER BY played_at DESC").fetchall()
    return {"leagues":LEAGUES,"matches":[dict(r) for r in rows]}
