import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

type Page = 'inicio' | 'competiciones' | 'partidos' | 'plantilla' | 'clasificaciones';
type Competition = {id:string;name:string;status:string;message?:string;standings?:unknown[];matches?:unknown[]};
const links: {id:Page;name:string;description:string;number:string}[] = [
 {id:'competiciones',name:'Competiciones',description:'AFJ 4ª · VPG 5ª · Bronze Zero',number:'01'},
 {id:'partidos',name:'Partidos',description:'Calendario y resultados',number:'02'},
 {id:'plantilla',name:'Plantilla',description:'Conoce a nuestros jugadores',number:'03'},
 {id:'clasificaciones',name:'Clasificaciones',description:'Posiciones de las ligas',number:'04'}
];
const players=[['ADRIAN','POR','1'],['GERARD','POR','20'],['ADRIAN','DFC','14'],['ISMAEL','DFC','4'],['PARRITA','DFC','5'],['LITO','DFC','24'],['JONATHAN','CAD','23'],['JACK','CAD','99'],['PENSUKU','CAI','19'],['MANUEL','CAR','18'],['LOREN','MC','29'],['MARC','MC','21'],['ELLIOT','MCO','11'],['BRIAN','EI','10'],['ERIC','DC','12'],['SAUL','ED','33']];
const titles:Record<Page,string>={inicio:'Inicio',competiciones:'Competiciones',partidos:'Partidos',plantilla:'Plantilla',clasificaciones:'Clasificaciones'};
const style=`
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#0b0c10;color:#f7f7f8;font-family:Inter,system-ui,sans-serif}button{cursor:pointer;font:inherit}a{color:inherit;text-decoration:none}.app{min-height:100vh;background:radial-gradient(ellipse at 85% 12%,#4e101a40,transparent 42%),#0b0c10}.wrap{width:min(1120px,calc(100% - 40px));margin:auto}.header{border-bottom:1px solid #ffffff15;background:#0c0d11e8;position:sticky;top:0;z-index:2;backdrop-filter:blur(12px)}.head{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:20px}.logo{display:flex;align-items:center;gap:12px;font:900 25px 'Barlow Condensed',sans-serif;letter-spacing:.5px}.shield{display:grid;place-items:center;width:42px;height:46px;background:#db2b43;color:white;clip-path:polygon(50% 0,96% 17%,96% 76%,50% 100%,4% 76%,4% 17%);font:900 17px Inter,sans-serif}.logo em{font-style:normal;color:#ec344d}.menu{display:flex;gap:6px;flex-wrap:wrap}.menu button{border:0;background:none;color:#a9a9b4;padding:10px 12px;border-radius:5px;font-size:12px;font-weight:700}.menu button:hover,.menu button.selected{color:#fff;background:#bc2238}.home{padding:105px 0 90px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:3px;color:#ed4258;text-transform:uppercase}.hero-title{font:900 clamp(65px,10vw,128px)/.85 'Barlow Condensed',sans-serif;margin:24px 0 22px;text-transform:uppercase;letter-spacing:-1px}.hero-title span{color:#e33149}.subtitle{color:#a7a7b1;font-size:15px;line-height:1.7;max-width:520px;margin-bottom:48px}.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.tile{border:1px solid #ffffff1c;border-radius:8px;background:linear-gradient(145deg,#1b1c23,#121319);text-align:left;color:white;padding:29px;min-height:170px;transition:transform .2s,border-color .2s}.tile:hover{transform:translateY(-4px);border-color:#df3049}.tile-top{display:flex;justify-content:space-between;color:#eb3b52;font-size:12px;font-weight:800}.tile h2{font:800 37px 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:20px 0 6px}.tile p{color:#a7a7b2;font-size:12px;margin:0}.section{padding:70px 0 100px;min-height:70vh}.title{font:900 clamp(46px,7vw,75px) 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:12px 0 30px}.back{border:1px solid #ffffff35;background:none;color:#fff;padding:11px 15px;border-radius:5px;font-size:12px;font-weight:700}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{background:#17181e;border:1px solid #ffffff18;padding:24px;border-radius:7px}.card h3{font:800 27px 'Barlow Condensed',sans-serif;margin:5px 0 16px}.card p{color:#a8a8b3;font-size:13px;line-height:1.7}.tag{font-size:10px;letter-spacing:1.5px;font-weight:800;color:#e84259}.players{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.player{display:flex;align-items:center;gap:14px;background:#17181e;border:1px solid #ffffff15;border-radius:6px;padding:17px}.num{font:900 36px 'Barlow Condensed',sans-serif;color:#e53850;min-width:43px}.player strong{font-size:13px}.player small{display:block;color:#a2a2ac;font-size:11px;margin-top:4px}.note{background:#21171d;border-left:3px solid #df3047;color:#c9bfc4;padding:19px 22px;font-size:13px;line-height:1.6}.tablewrap{overflow:auto;margin-top:16px;border:1px solid #ffffff18;border-radius:6px}table{width:100%;border-collapse:collapse;min-width:480px}td,th{text-align:left;border-bottom:1px solid #ffffff14;padding:14px;font-size:12px}th{color:#ed4258;background:#1a1b21}.x-news{position:fixed;bottom:22px;right:22px;z-index:20;display:flex;flex-direction:column;align-items:flex-end;gap:12px}.x-launch{border:1px solid #f14b61;background:#c5223b;color:white;border-radius:100px;box-shadow:0 8px 35px #0009;padding:13px 20px;display:flex;align-items:center;gap:10px;font-size:12px;font-weight:800}.x-symbol{font-size:22px;line-height:1}.x-panel{width:min(370px,calc(100vw - 30px));max-height:min(620px,calc(100vh - 110px));display:flex;flex-direction:column;overflow:hidden;border:1px solid #ffffff30;background:#111218;border-radius:12px;box-shadow:0 20px 80px #000c}.x-panel-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;background:#1c1d24;border-bottom:1px solid #ffffff18}.x-panel-head strong{font-size:12px;letter-spacing:1px}.x-panel-head small{display:block;margin-top:5px;color:#a4a4af;font-size:11px}.x-panel-head button{border:0;background:transparent;color:#fff;font-size:28px;line-height:1}.x-feed{overflow-y:auto;min-height:220px;padding:5px}.x-feed>a{display:block;text-align:center;padding:45px 10px;color:#f26b7d;font-size:13px}.x-panel-foot{padding:12px 17px;border-top:1px solid #ffffff17;text-align:right}.x-panel-foot a{font-size:12px;font-weight:700;color:#ef536a}@media(max-width:540px){.x-news{right:12px;bottom:12px}.x-panel{max-height:65vh}}.footer{border-top:1px solid #ffffff16;color:#92929c;font-size:11px;padding:25px 0}.footer .wrap{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media(max-width:850px){.head{flex-direction:column;padding:15px 0}.menu{justify-content:center}.cards{grid-template-columns:1fr}.players{grid-template-columns:repeat(2,minmax(0,1fr))}.home{padding-top:75px}}@media(max-width:540px){.tiles{grid-template-columns:1fr}.players{grid-template-columns:1fr}.hero-title{font-size:65px}.tile{min-height:140px}.logo{font-size:22px}.menu button{padding:9px}}
`;
function XNews(){
 const [open,setOpen]=useState(false);
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open||!host.current)return;
  const target=host.current;
  target.innerHTML='';
  const link=document.createElement('a');
  link.className='twitter-timeline';
  link.href='https://twitter.com/LosIntocablesFc';
  link.textContent='Publicaciones de @LosIntocablesFc';
  link.setAttribute('data-theme','dark');
  link.setAttribute('data-height','460');
  link.setAttribute('data-chrome','noheader nofooter');
  target.appendChild(link);
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
   <div className="x-panel-head"><div><strong>ÚLTIMAS NOTICIAS</strong><small>@LosIntocablesFc · X</small></div><button type="button" aria-label="Cerrar noticias" onClick={()=>setOpen(false)}>×</button></div>
   <div className="x-feed" ref={host}><a href="https://twitter.com/LosIntocablesFc" target="_blank" rel="noreferrer">Ver publicaciones en X</a></div>
   <div className="x-panel-foot"><a href="https://twitter.com/LosIntocablesFc" target="_blank" rel="noreferrer">Abrir perfil en X ↗</a></div>
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
 return <div className="app"><style>{style}</style><header className="header"><div className="wrap head"><a href="#" className="logo" onClick={e=>{e.preventDefault();go('inicio')}}><span className="shield">LI</span> LOS INTOCABLES <em>FC 27</em></a><nav className="menu">{(['inicio','competiciones','partidos','plantilla','clasificaciones'] as Page[]).map(p=><button key={p} className={p===page?'selected':''} onClick={()=>go(p)}>{titles[p]}</button>)}</nav></div></header>
 {page==='inicio'?<main className="wrap home"><div className="eyebrow">Clubes Pro · Temporada FC 27</div><h1 className="hero-title">LOS <span>INTOCABLES.</span></h1><p className="subtitle">La casa de nuestro club. Toda la información, los jugadores y las competiciones en un solo lugar.</p><div className="tiles">{links.map(x=><button className="tile" key={x.id} onClick={()=>go(x.id)}><div className="tile-top"><span>{x.number} / 04</span><span>↗</span></div><h2>{x.name}</h2><p>{x.description}</p></button>)}</div></main>:
 <main className="wrap section"><button className="back" onClick={()=>go('inicio')}>← Volver al inicio</button><div className="eyebrow" style={{marginTop:35}}>Los Intocables · FC 27</div><h1 className="title">{titles[page]}</h1>
 {page==='plantilla'?<div className="players">{players.map(([name,pos,num],i)=><div className="player" key={i}><span className="num">{num}</span><div><strong>{name}</strong><small>{pos}</small></div></div>)}</div>:
 page==='competiciones'?<div className="cards">{names.map(([id,name])=>{const c=comps.find(x=>x.id===id);return <article className="card" key={id}><div className="tag">COMPETICIÓN</div><h3>{name}</h3><p>{loading?'Cargando información…':c?.status==='ok'?'Datos de la competición disponibles.':c?.message||'Pendiente de datos verificados.'}</p><p>{c?.matches?.length||0} partidos · {c?.standings?.length||0} equipos registrados</p></article>})}</div>:
 page==='partidos'?<><div className="cards">{[['BRONZE ZERO','22:20'],['AFJ 4ª DIVISIÓN','22:40'],['VPG 5ª DIVISIÓN','23:00 y 23:20']].map(([name,time])=><article className="card" key={name}><div className="tag">HORARIO HABITUAL</div><h3>{name}</h3><p style={{fontSize:22,color:'#fff',fontWeight:800}}>{time}</p></article>)}</div><div className="note" style={{marginTop:24}}>Los resultados se mostrarán cuando la API disponga de partidos verificados. Los horarios indicados son los habituales, no confirmaciones de próximos encuentros.</div></>:
 <>{names.map(([id,name])=>{const c=comps.find(x=>x.id===id);return <section key={id} style={{marginBottom:35}}><h2 style={{fontFamily:'Barlow Condensed',fontSize:30}}>{name}</h2>{c?.status==='ok'&&c.standings?.length?<div className="tablewrap"><table><thead><tr><th>Datos de clasificación</th></tr></thead><tbody>{c.standings.map((row,i)=><tr key={i}><td>{JSON.stringify(row)}</td></tr>)}</tbody></table></div>:<div className="note">{loading?'Consultando clasificación…':'Clasificación no disponible o pendiente de verificación.'}</div>}</section>})}</>}
 </main>}
 <XNews/><footer className="footer"><div className="wrap"><strong>LOS INTOCABLES FC 27</strong><span>AFJ 4ª · VPG 5ª · BRONZE ZERO</span></div></footer></div>
}
createRoot(document.getElementById('root')!).render(<App />);
