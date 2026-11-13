"""Importación periódica de partidos reales de EA FC 27 Clubs."""
import asyncio
import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from admin_panel import conn

log=logging.getLogger(__name__)
STATUS={"state":"waiting","last_checked":None,"imported":0,"error":None}
def first(obj,*keys):
    for key in keys:
        if isinstance(obj,dict) and obj.get(key) is not None:return obj[key]
    return None
def normalize_rows(data):
    if hasattr(data,"to_dict"):
        try:data=data.to_dict(orient="records")
        except TypeError:data=data.to_dict()
    if isinstance(data,dict):
        for key in ("matches","data","results"):
            if isinstance(data.get(key),list):data=data[key];break
        else:data=list(data.values()) if all(isinstance(v,dict) for v in data.values()) else []
    return [x for x in data if isinstance(x,dict)] if isinstance(data,list) else []
def normalize_match(row):
    mid=first(row,"matchId","match_id","id")
    # Without a source match ID, do not invent one: duplicates would be unsafe.
    if mid is None:return None
    opponent=first(row,"opponentName","opponent","opponent_name")
    clubs=row.get("clubs")
    if not opponent and isinstance(clubs,dict):
        for cid,club in clubs.items():
            if isinstance(club,dict):
                name=first(club,"name","clubName","club_name")
                if name and "intocables" not in str(name).casefold():opponent=name;break
    played=first(row,"timestamp","date","played_at","matchDate")
    if isinstance(played,(int,float)):
        played=datetime.fromtimestamp(played/1000 if played>1e11 else played,timezone.utc).isoformat()
    goals=first(row,"goals","goalsFor","home_goals")
    against=first(row,"goalsAgainst","goals_against","away_goals")
    def score(value):
        try:return int(value) if value is not None and 0<=int(value)<=99 else None
        except (ValueError,TypeError):return None
    return (str(mid),str(played or ""),str(opponent or "Rival sin identificar"),score(goals),score(against),json.dumps(row,ensure_ascii=False,default=str))
def save_rows(rows):
    normalized=[m for r in normalize_rows(rows) if (m:=normalize_match(r))]
    with conn() as db:
        for m in normalized:
            db.execute("""INSERT INTO matches(id,played_at,opponent,home_goals,away_goals,raw)
            VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
            played_at=excluded.played_at,opponent=excluded.opponent,
            home_goals=excluded.home_goals,away_goals=excluded.away_goals,raw=excluded.raw""",m)
    return len(normalized)
MATCH_TYPES=("leagueMatch","friendlyMatch","playoffMatch")
def fetch_fc27():
    from fc_clubs_api import FC27API
    api=FC27API(timezone="Europe/Madrid",output="records")
    club_id=int(os.getenv("FC27_CLUB_ID","5360"))
    all_matches=[]
    for match_type in MATCH_TYPES:
        try:
            matches=normalize_rows(api.get_club_matches(club_id,match_type=match_type,count=10,output="records"))
            player_rows=normalize_rows(api.get_match_players(club_id,match_type=match_type,count=10,both_teams=True,all_columns=True,include_events=True,output="records"))
            by_match={}
            for player in player_rows:
                mid=first(player,"matchId","match_id","id")
                if mid is not None:by_match.setdefault(str(mid),[]).append(player)
            for match in matches:
                mid=first(match,"matchId","match_id","id")
                match["match_type"]=match_type
                match["players"]=by_match.get(str(mid),[])
                all_matches.append(match)
        except Exception as exc:
            log.warning("FC27 %s no disponible: %s",match_type,exc)
            if match_type=="leagueMatch":raise
    return all_matches
async def sync_matches():
    STATUS["last_checked"]=datetime.now(timezone.utc).isoformat()
    try:
        data=await asyncio.to_thread(fetch_fc27)
        count=await asyncio.to_thread(save_rows,data)
        STATUS.update(state="ok",imported=count,error=None)
    except Exception as exc:
        log.exception("No se pudo consultar FC27")
        STATUS.update(state="error",error=f"{type(exc).__name__}: {str(exc)[:180]}")
    return dict(STATUS)
async def periodic_matches():
    while True:
        await sync_matches()
        await asyncio.sleep(max(300,int(os.getenv("FC27_REFRESH_SECONDS","600"))))
