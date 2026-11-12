import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

type Page = 'inicio' | 'competiciones' | 'partidos' | 'plantilla' | 'clasificaciones' | 'alineacion';
type StandingsRow = {position?:string|number;team?:string;played?:string|number;won?:string|number;drawn?:string|number;lost?:string|number;gd?:string|number;points?:string|number};
type Competition = {id:string;name:string;status:string;message?:string;standings?:StandingsRow[];matches?:unknown[];updated_at?:string|null};
const links: {id:Page;name:string;description:string;number:string}[] = [
 {id:'competiciones',name:'Competiciones',description:'AFJ 4ª · VPG 5ª · Bronze Zero',number:'01'},
 {id:'partidos',name:'Partidos',description:'Calendario y resultados',number:'02'},
 {id:'plantilla',name:'Plantilla',description:'Conoce a nuestros jugadores',number:'03'},
 {id:'clasificaciones',name:'Clasificaciones',description:'Posiciones de las ligas',number:'04'},
 {id:'alineacion',name:'Alineación',description:'Crea tu once y cambia la formación',number:'05'}
];
const players=[['ADRIAN','POR','1'],['GERARD','POR','20'],['ADRIAN','DFC','14'],['ISMAEL','DFC','4'],['PARRITA','DFC','5'],['LITO','DFC','24'],['JONATHAN','CAD','23'],['JACK','CAD','99'],['PENSUKU','CAI','19'],['MANUEL','CAR','18'],['LOREN','MC','29'],['MARC','MC','21'],['ELLIOT','MCO','11'],['BRIAN','EI','10'],['ERIC','DC','12'],['SAUL','ED','33']];
function Standings({competition}:{competition:Competition}){
 const rows=competition.standings||[];
 if(!rows.length)return <div className="note">Clasificación pendiente de datos verificados. <a href={competition.id==='afj'?'https://www.eafcstats.es/competitions/259':competition.id==='vpg'?'https://virtualprogaming.com/league/quinta-division-c':'https://virtualprogaming.com/league/superliga-zero-spain'} target="_blank" rel="noreferrer">Ver fuente oficial ↗</a></div>;
 return <><div className="tablewrap"><table className="standings"><thead><tr><th>POS</th><th>EQUIPO</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>PTS</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i} className={/los\\s*intocables/i.test(r.team||'')?'club-row':''}><td>{r.position??i+1}</td><td className="team-name">{r.team||'—'}</td><td>{r.played??'—'}</td><td>{r.won??'—'}</td><td>{r.drawn??'—'}</td><td>{r.lost??'—'}</td><td>{r.gd??'—'}</td><td><strong>{r.points??'—'}</strong></td></tr>)}</tbody></table></div><p className="standings-caption">Datos de la última instantánea disponible · {competition.updated_at?.slice(0,10)||'Fecha no disponible'}</p></>;
}
const titles:Record<Page,string>={inicio:'Inicio',competiciones:'Competiciones',partidos:'Partidos',plantilla:'Plantilla',clasificaciones:'Clasificaciones',alineacion:'Alineación'};
const style=`
.lineup-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(250px,1fr);gap:24px;align-items:start}.lineup-controls{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}.lineup-controls label{font-size:12px;font-weight:800;color:#d7d7dd}.lineup-controls select,.lineup-controls button,.remove-slot{margin-left:10px;background:#1c1e24;border:1px solid #ffffff30;border-radius:6px;color:white;padding:11px;font-weight:700}.pitch{position:relative;aspect-ratio:3/4;background:repeating-linear-gradient(0deg,#164e3d 0%,#164e3d 12.5%,#195943 12.5%,#195943 25%);border:3px solid #c0d9c85c;border-radius:9px;overflow:hidden;max-width:640px;margin:auto}.pitch:before{content:'';position:absolute;inset:5%;border:2px solid #ffffff50;pointer-events:none}.pitch-mid{position:absolute;left:5%;right:5%;top:50%;border-top:2px solid #ffffff50}.pitch-circle{position:absolute;left:50%;top:50%;width:25%;aspect-ratio:1;border:2px solid #ffffff50;border-radius:50%;transform:translate(-50%,-50%)}.pitch-box{position:absolute;left:25%;width:50%;height:15%;border:2px solid #ffffff50}.pitch-box-top{top:5%;border-top:0}.pitch-box-bottom{bottom:5%;border-bottom:0}.pitch-slot{position:absolute;transform:translate(-50%,-50%);width:18%;min-width:52px;border:0;background:transparent;color:white;display:flex;align-items:center;flex-direction:column;gap:2px;padding:0;z-index:1;touch-action:manipulation}.pitch-shirt{display:grid;place-items:center;width:43px;height:43px;background:#cf2944;border:2px solid #ffb7c3;border-radius:13px 13px 7px 7px;box-shadow:0 3px 14px #0008;font-weight:900;font-size:15px}.pitch-slot.active .pitch-shirt{outline:3px solid #fff}.pitch-name{background:#0c1114df;border-radius:4px;padding:3px 5px;font-size:clamp(8px,1.2vw,11px);font-weight:900;max-width:100%;overflow:hidden;text-overflow:ellipsis}.pitch-pos{font-size:9px;color:#e4f0e8}.lineup-help{font-size:12px;line-height:1.7;color:#a7a7b1}.lineup-roster{background:#17181e;border:1px solid #ffffff20;border-radius:9px;padding:18px}.lineup-roster h3{display:flex;justify-content:space-between;margin:0;font:800 27px 'Barlow Condensed'}.lineup-roster h3 span{color:#e33149}.lineup-roster p{color:#9fa0ac;font-size:12px;line-height:1.6}.lineup-player-list{display:grid;gap:6px;max-height:620px;overflow:auto}.lineup-player{width:100%;background:#22232a;border:1px solid #ffffff17;border-radius:6px;padding:10px;display:flex;align-items:center;gap:12px;text-align:left;color:white}.lineup-player b{color:#ee425b;min-width:35px}.lineup-player span{font-weight:700;font-size:12px;flex:1}.lineup-player small{display:block;color:#9e9fa9;font-size:10px;margin-top:3px}.lineup-player em{font-style:normal;font-size:9px;color:#aeb0bb}.lineup-player.selected{border-color:#ff526c;background:#4c202c}.lineup-player.used{opacity:.76}.remove-slot{margin:15px 0 0;width:100%}@media(max-width:780px){.lineup-layout{grid-template-columns:1fr}.lineup-player-list{grid-template-columns:repeat(2,minmax(0,1fr));max-height:none}.pitch-name{font-size:10px}}@media(max-width:420px){.pitch-shirt{width:34px;height:34px;font-size:12px}.pitch-slot{min-width:45px}.lineup-player-list{grid-template-columns:1fr}}

@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#0b0c10;color:#f7f7f8;font-family:Inter,system-ui,sans-serif}button{cursor:pointer;font:inherit}a{color:inherit;text-decoration:none}.app{min-height:100vh;background:radial-gradient(ellipse at 85% 12%,#4e101a40,transparent 42%),#0b0c10}.wrap{width:min(1120px,calc(100% - 40px));margin:auto}.header{border-bottom:1px solid #ffffff15;background:#0c0d11e8;position:sticky;top:0;z-index:2;backdrop-filter:blur(12px)}.head{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:20px}.logo{display:flex;align-items:center;gap:12px;font:900 25px 'Barlow Condensed',sans-serif;letter-spacing:.5px}.shield{display:grid;place-items:center;width:42px;height:46px;background:#db2b43;color:white;clip-path:polygon(50% 0,96% 17%,96% 76%,50% 100%,4% 76%,4% 17%);font:900 17px Inter,sans-serif}.logo em{font-style:normal;color:#ec344d}.menu{display:flex;gap:6px;flex-wrap:wrap}.menu button{border:0;background:none;color:#a9a9b4;padding:10px 12px;border-radius:5px;font-size:12px;font-weight:700}.menu button:hover,.menu button.selected{color:#fff;background:#bc2238}.home{padding:105px 0 90px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:3px;color:#ed4258;text-transform:uppercase}.hero-title{font:900 clamp(65px,10vw,128px)/.85 'Barlow Condensed',sans-serif;margin:24px 0 22px;text-transform:uppercase;letter-spacing:-1px}.hero-title span{color:#e33149}.subtitle{color:#a7a7b1;font-size:15px;line-height:1.7;max-width:520px;margin-bottom:48px}.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.tile{border:1px solid #ffffff1c;border-radius:8px;background:linear-gradient(145deg,#1b1c23,#121319);text-align:left;color:white;padding:29px;min-height:170px;transition:transform .2s,border-color .2s}.tile:hover{transform:translateY(-4px);border-color:#df3049}.tile-top{display:flex;justify-content:space-between;color:#eb3b52;font-size:12px;font-weight:800}.tile h2{font:800 37px 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:20px 0 6px}.tile p{color:#a7a7b2;font-size:12px;margin:0}.section{padding:70px 0 100px;min-height:70vh}.title{font:900 clamp(46px,7vw,75px) 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:12px 0 30px}.back{border:1px solid #ffffff35;background:none;color:#fff;padding:11px 15px;border-radius:5px;font-size:12px;font-weight:700}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{background:#17181e;border:1px solid #ffffff18;padding:24px;border-radius:7px}.card h3{font:800 27px 'Barlow Condensed',sans-serif;margin:5px 0 16px}.card p{color:#a8a8b3;font-size:13px;line-height:1.7}.tag{font-size:10px;letter-spacing:1.5px;font-weight:800;color:#e84259}.players{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.player{display:flex;align-items:center;gap:14px;background:#17181e;border:1px solid #ffffff15;border-radius:6px;padding:17px}.num{font:900 36px 'Barlow Condensed',sans-serif;color:#e53850;min-width:43px}.player strong{font-size:13px}.player small{display:block;color:#a2a2ac;font-size:11px;margin-top:4px}.note{background:#21171d;border-left:3px solid #df3047;color:#c9bfc4;padding:19px 22px;font-size:13px;line-height:1.6}.tablewrap{overflow:auto;margin-top:16px;border:1px solid #ffffff18;border-radius:6px}table{width:100%;border-collapse:collapse;min-width:480px}td,th{text-align:left;border-bottom:1px solid #ffffff14;padding:14px;font-size:12px}th{color:#ed4258;background:#1a1b21}.x-news{position:fixed;bottom:22px;right:22px;z-index:20;display:flex;flex-direction:column;align-items:flex-end;gap:12px}.x-launch{border:1px solid #f14b61;background:#c5223b;color:white;border-radius:100px;box-shadow:0 8px 35px #0009;padding:13px 20px;display:flex;align-items:center;gap:10px;font-size:12px;font-weight:800}.x-symbol{font-size:22px;line-height:1}.x-panel{width:min(370px,calc(100vw - 30px));height:min(620px,calc(100vh - 110px));max-height:calc(100vh - 90px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #ffffff30;background:#111218;border-radius:12px;box-shadow:0 20px 80px #000c}.x-panel-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;background:#1c1d24;border-bottom:1px solid #ffffff18}.x-panel-head strong{font-size:12px;letter-spacing:1px}.x-panel-head small{display:block;margin-top:5px;color:#a4a4af;font-size:11px}.x-panel-head button{border:0;background:transparent;color:#fff;font-size:28px;line-height:1}.x-feed{overflow-y:auto;overscroll-behavior:contain;min-height:220px;flex:1;padding:8px;scrollbar-width:thin;scrollbar-color:#b82c47 #111218}.x-feed>a{display:block;text-align:center;padding:45px 10px;color:#f26b7d;font-size:13px}.x-panel-foot{padding:12px 17px;border-top:1px solid #ffffff17;text-align:right}.x-panel-foot a{font-size:12px;font-weight:700;color:#ef536a}@media(max-width:540px){.x-news{right:12px;bottom:12px}.x-panel{max-height:65vh}}.standings th:not(:nth-child(2)),.standings td:not(:nth-child(2)){text-align:center}.standings .team-name{font-weight:700;min-width:180px}.standings .club-row{background:#64202e!important;color:#fff}.standings .club-row td{border-color:#c32a4166}.standings-caption{color:#8e8e99;font-size:11px;margin-top:12px}.note a{color:#ff6b80}.footer{border-top:1px solid #ffffff16;color:#92929c;font-size:11px;padding:25px 0}.footer .wrap{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media(max-width:850px){.head{flex-direction:column;padding:15px 0}.menu{justify-content:center}.cards{grid-template-columns:1fr}.players{grid-template-columns:repeat(2,minmax(0,1fr))}.home{padding-top:75px}}@media(max-width:540px){.tiles{grid-template-columns:1fr}.players{grid-template-columns:1fr}.hero-title{font-size:65px}.tile{min-height:140px}.logo{font-size:22px}.menu button{padding:9px}}
`;
type Formation = '4-3-3'|'4-4-2'|'4-2-3-1'|'3-5-2'|'5-3-2'|'4-1-2-1-2';
const formations:Record<Formation,number[]>={'4-3-3':[3,3,4,1],'4-4-2':[2,4,4,1],'4-2-3-1':[1,3,2,4,1],'3-5-2':[2,5,3,1],'5-3-2':[2,3,5,1],'4-1-2-1-2':[2,1,2,1,4,1]};
function positions(shape:Formation){
 const lines=formations[shape];
 const labels=shape==='4-2-3-1'?[['DC'],['MCO','MCO','MCO'],['MCD','MCD'],['LI','DFC','DFC','LD'],['POR']]:[];
 const coords:{x:number;y:number;label:string}[]=[];
 lines.forEach((count,line)=>{
  const y=12+line*(76/(lines.length-1));
  for(let i=0;i<count;i++){
   const x= count===1?50:12+(76*i/(count-1));
   const fallback=line===lines.length-1?'POR':line===0?'DEL':line===lines.length-2?'DEF':'MED';
   coords.push({x,y,label:labels[line]?.[i]||fallback});
  }
 });
 return coords;
}
function Lineup(){
 const [formation,setFormation]=useState<Formation>(()=>{try{const v=localStorage.getItem('li-formation');return v&&v in formations?v as Formation:'4-3-3'}catch{return '4-3-3'}});
 const [slots,setSlots]=useState<(number|null)[]>(()=>{try{const v=JSON.parse(localStorage.getItem('li-lineup')||'[]');return Array.isArray(v)?Array.from({length:11},(_,i)=>typeof v[i]==='number'&&v[i]>=0&&v[i]<players.length?v[i]:null):Array(11).fill(null)}catch{return Array(11).fill(null)}});
 const [selected,setSelected]=useState<number|null>(null);
 const [active,setActive]=useState<number|null>(null);
 useEffect(()=>{try{localStorage.setItem('li-formation',formation);localStorage.setItem('li-lineup',JSON.stringify(slots))}catch{}},[formation,slots]);
 const assign=(slot:number,player:number|null)=>{
  setSlots(old=>{const next=[...old];if(player!==null){const previous=next.indexOf(player);if(previous!==-1&&previous!==slot)next[previous]=next[slot];}next[slot]=player;return next});
  setActive(null);setSelected(null);
 };
 const pick=(index:number)=>{if(active!==null){assign(active,index);return}setSelected(index)};
 const drop=(slot:number,e:React.DragEvent)=>{e.preventDefault();const raw=e.dataTransfer.getData('text/plain');if(raw.startsWith('player:')){const n=Number(raw.slice(7));if(Number.isInteger(n)&&n>=0&&n<players.length)assign(slot,n)}else if(raw.startsWith('slot:')){const from=Number(raw.slice(5));if(from>=0&&from<11){setSlots(old=>{const next=[...old];[next[from],next[slot]]=[next[slot],next[from]];return next})}}};
 const coords=positions(formation);
 return <div className="lineup-layout"><div><div className="lineup-controls"><label>FORMACIÓN <select value={formation} onChange={e=>setFormation(e.target.value as Formation)}>{Object.keys(formations).map(f=><option key={f} value={f}>{f}</option>)}</select></label><button onClick={()=>{setSlots(Array(11).fill(null));setActive(null);setSelected(null)}}>Vaciar once</button></div><div className="pitch" aria-label="Campo de fútbol para organizar la alineación"><div className="pitch-mid"/><div className="pitch-circle"/><div className="pitch-box pitch-box-top"/><div className="pitch-box pitch-box-bottom"/>{coords.map((p,i)=>{const n=slots[i];const player=n===null?null:players[n];return <button key={i} className={'pitch-slot'+(active===i?' active':'')} style={{left:p.x+'%',top:p.y+'%'}} draggable={n!==null} onDragStart={e=>e.dataTransfer.setData('text/plain','slot:'+i)} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(i,e)} onClick={()=>{if(selected!==null)assign(i,selected);else setActive(active===i?null:i)}} title="Pulsa para elegir un jugador o arrastra uno aquí"><span className="pitch-shirt">{player?'#'+player[2]:'+'}</span><span className="pitch-name">{player?player[0]:'Elegir'}</span><span className="pitch-pos">{p.label}</span></button>})}</div><p className="lineup-help">Pulsa una posición y después un jugador, o arrastra jugadores al campo. Puedes intercambiar jugadores entre posiciones. El once se guarda en este navegador.</p></div><aside className="lineup-roster"><h3>PLANTILLA <span>{slots.filter(x=>x!==null).length}/11</span></h3><p>Selecciona un jugador y toca su posición en el campo.</p><div className="lineup-player-list">{players.map(([name,pos,num],i)=><button key={i} draggable onDragStart={e=>e.dataTransfer.setData('text/plain','player:'+i)} className={'lineup-player'+(selected===i?' selected':'')+(slots.includes(i)?' used':'')} onClick={()=>pick(i)}><b>#{num}</b><span>{name}<small>{pos}</small></span><em>{slots.includes(i)?'EN EL 11':'+'}</em></button>)}</div>{active!==null&&<button className="remove-slot" onClick={()=>assign(active,null)}>Quitar jugador de la posición</button>}</aside></div>;
}
function XNews(){
 const [open,setOpen]=useState(false);
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open||!host.current)return;
  const target=host.current;
  target.innerHTML='';
  const posts=[
   {url:'https://x.com/AFJSpain/status/2120902736908619840',label:'Publicación de @AFJSpain'},
   {url:'https://x.com/LosIntocablesFC/status/2119166154002530365',label:'Publicación de @LosIntocablesFC'}
  ];
  for(const post of posts){
   const quote=document.createElement('blockquote');
   quote.className='twitter-tweet';
   quote.setAttribute('data-theme','dark');
   const link=document.createElement('a');
   link.href=post.url;
   link.textContent=post.label;
   link.target='_blank';
   link.rel='noopener noreferrer';
   quote.appendChild(link);
   target.appendChild(quote);
  }
  const w=window as Window & {twttr?:{widgets?:{load:(element?:HTMLElement)=>void}}};
  if(w.twttr?.widgets){w.twttr.widgets.load(target);return}
  const existing=document.querySelector<HTMLScriptElement>('script[data-x-widget="true"]');
  if(existing){existing.addEventListener('load',()=>w.twttr?.widgets?.load(target),{once:true});return}
  const script=document.createElement('script');
  script.src='https://platform.twitter.com/widgets.js';
  script.async=true;
  script.setAttribute('data-x-widget','true');
  script.onload=()=>w.twttr?.widgets?.load(target);
  document.body.appendChild(script);
 },[open]);
 return <aside className="x-news">
  {open&&<div className="x-panel" role="dialog" aria-label="Noticias de Los Intocables en X">
   <div className="x-panel-head"><div><strong>ÚLTIMAS NOTICIAS</strong><small>Los Intocables · AFJ Spain · X</small></div><button type="button" aria-label="Cerrar noticias" onClick={()=>setOpen(false)}>×</button></div>
   <div className="x-feed" ref={host}><a href="https://x.com/LosIntocablesFC/status/2119166154002530365" target="_blank" rel="noreferrer">Ver publicaciones en X</a></div>
   <div className="x-panel-foot"><a href="https://x.com/AFJSpain/status/2120902736908619840" target="_blank" rel="noreferrer">Ver último tuit en X ↗</a></div>
  </div>}
  <button type="button" className="x-launch" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span className="x-symbol">𝕏</span><span>{open?'Cerrar noticias':'Noticias del club'}</span></button>
 </aside>;
}
function App(){
 const [page,setPage]=useState<Page>('inicio');
 const [comps,setComps]=useState<Competition[]>([]);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{fetch('/api/competitions').then(r=>{if(!r.ok)throw new Error('API unavailable');return r.json()}).then(d=>setComps(Array.isArray(d.competitions)?d.competitions:[])).catch(()=>setComps([])).finally(()=>setLoading(false))},[]);
 const go=(p:Page)=>{setPage(p);window.scrollTo(0,0)};
 const names:[string,string][]=[['afj','AFJ · 4ª DIVISIÓN'],['vpg','VPG · 5ª DIVISIÓN'],['bronze','VPG · BRONZE ZERO']];
 return <div className="app"><style>{style}</style><header className="header"><div className="wrap head"><a href="#" className="logo" onClick={e=>{e.preventDefault();go('inicio')}}><span className="shield">LI</span> LOS INTOCABLES <em>FC 27</em></a><nav className="menu">{(['inicio','competiciones','partidos','plantilla','clasificaciones','alineacion'] as Page[]).map(p=><button key={p} className={p===page?'selected':''} onClick={()=>go(p)}>{titles[p]}</button>)}</nav></div></header>
 {page==='inicio'?<main className="wrap home"><div className="eyebrow">Clubes Pro · Temporada FC 27</div><h1 className="hero-title">LOS <span>INTOCABLES.</span></h1><p className="subtitle">La casa de nuestro club. Toda la información, los jugadores y las competiciones en un solo lugar.</p><div className="tiles">{links.map(x=><button className="tile" key={x.id} onClick={()=>go(x.id)}><div className="tile-top"><span>↗</span></div><h2>{x.name}</h2><p>{x.description}</p></button>)}</div></main>:
 <main className="wrap section"><button className="back" onClick={()=>go('inicio')}>← Volver al inicio</button><div className="eyebrow" style={{marginTop:35}}>Los Intocables · FC 27</div><h1 className="title">{titles[page]}</h1>
 {page==='plantilla'?<div className="players">{players.map(([name,pos,num],i)=><div className="player" key={i}><span className="num">{num}</span><div><strong>{name}</strong><small>{pos}</small></div></div>)}</div>:
 page==='alineacion'?<Lineup/>:
 page==='competiciones'?<div className="cards">{names.map(([id,name])=>{const c=comps.find(x=>x.id===id);return <article className="card" key={id}><div className="tag">COMPETICIÓN</div><h3>{name}</h3><p>{loading?'Cargando información…':c?.standings?.length?'Clasificación disponible: '+c.standings.length+' equipos.':'Clasificación pendiente de datos verificados.'}</p><button className="back" onClick={()=>go('clasificaciones')}>Ver clasificaciones →</button></article>})}</div>:
 page==='partidos'?<><div className="cards">{[['BRONZE ZERO','22:20'],['AFJ 4ª DIVISIÓN','22:40'],['VPG 5ª DIVISIÓN C','23:00 y 23:20']].map(([name,time])=><article className="card" key={name}><div className="tag">HORARIO HABITUAL</div><h3>{name}</h3><p style={{fontSize:22,color:'#fff',fontWeight:800}}>{time}</p></article>)}</div><div className="note" style={{marginTop:24}}>Los resultados aparecerán cuando estén verificados en las fuentes oficiales.</div></>:
 <>{names.map(([id,name])=>{const c=comps.find(x=>x.id===id);return <section key={id} style={{marginBottom:42}}><h2 style={{fontFamily:'Barlow Condensed',fontSize:34,marginBottom:15}}>{name}</h2>{c?.standings?.length?<Standings competition={c}/>:<div className="note">{loading?'Cargando clasificación…':'Clasificación pendiente de datos verificados.'} <a href={id==='afj'?'https://www.eafcstats.es/competitions/259':id==='vpg'?'https://virtualprogaming.com/league/quinta-division-c':'https://virtualprogaming.com/league/superliga-zero-spain'} target="_blank" rel="noreferrer">Fuente oficial ↗</a></div>}</section>})}</>}

 </main>}
 <XNews/><footer className="footer"><div className="wrap"><strong>LOS INTOCABLES FC 27</strong><span>AFJ 4ª · VPG 5ª · BRONZE ZERO</span></div></footer></div>
}
createRoot(document.getElementById('root')!).render(<App />);
