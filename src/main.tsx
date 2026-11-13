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
/* Vista compacta de partidos, diseñada para móvil */
.match-center{width:100%;min-width:0}.match-filters{display:flex;gap:6px;overflow-x:auto;padding:2px 0 13px;margin-bottom:10px;scrollbar-width:none}.match-filters button{flex:0 0 auto;background:#1c1d24;border:1px solid #ffffff22;border-radius:6px;color:#ddd;padding:8px 11px;font-size:12px;font-weight:700}.match-filters button.chosen{background:#be243f;color:white}.match-entry{background:#17181e;border:1px solid #ffffff1c;border-radius:9px;margin:9px 0;overflow:hidden}.match-main{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:13px 14px;background:transparent;color:white;border:0;text-align:left}.match-ident{min-width:0;flex:1}.match-ident h3{font:800 18px 'Barlow Condensed',sans-serif;line-height:1.12;margin:5px 0;overflow-wrap:anywhere}.match-ident h3 span{color:#e6445d}.match-ident small{font-size:11px;color:#a7a7b2}.match-league{font-size:10px;color:#ef5068;font-weight:800}.match-result{text-align:right;flex-shrink:0}.match-result strong{display:block;font:900 25px 'Barlow Condensed',sans-serif;white-space:nowrap}.match-result small{display:block;color:#aaa;font-size:10px;margin-top:5px}.match-expanded{padding:12px 14px;border-top:1px solid #ffffff1b}.match-expanded h4{font-size:15px;color:#f05269;margin:6px 0 12px}.match-stat-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.match-stat-grid>div{display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;background:#25262e;border-radius:5px;padding:9px}.match-stat-grid span{font-size:11px;color:#c4c4cd;overflow-wrap:anywhere}.match-stat-grid b{font-size:12px;text-align:right}.match-players section{padding:12px 0;border-top:1px solid #ffffff20}.match-players section>strong{display:block;margin-bottom:9px}.head{flex-wrap:wrap;gap:9px}.account-actions{margin-left:auto}.account-btn{padding:9px 12px}@media(max-width:600px){.header .head{display:flex;flex-direction:column;align-items:stretch;padding:12px 0;gap:10px}.header .logo{font-size:17px;justify-content:center;text-align:center}.header .menu{display:flex;flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;width:100%;gap:3px;padding-bottom:4px;scrollbar-width:none}.header .menu button{font-size:12px;white-space:nowrap;padding:9px 10px;flex:0 0 auto}.header .account-actions{width:100%;display:flex;justify-content:center;padding:0}.header .account-btn{font-size:12px;padding:9px 14px}.section{padding-top:14px}.section .title{font-size:clamp(30px,9vw,48px);margin:8px 0 15px}.match-main{padding:11px}.match-ident h3{font-size:17px}.match-result strong{font-size:23px}.match-expanded{padding:11px}.match-stat-grid>div{padding:8px 7px}}

.match-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:22px}.match-summary>div{padding:20px;border:1px solid #ffffff20;background:#181920;border-radius:10px}.match-summary span{display:block;color:#b2b2bc;font-size:10px;font-weight:800;letter-spacing:1px}.match-summary strong{font:900 36px 'Barlow Condensed',sans-serif;color:#ed4258}.match-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}.match-filters button{background:#22232b;border:1px solid #ffffff20;border-radius:7px;color:#eee;padding:10px 13px;font-size:12px;font-weight:800}.match-filters button.chosen{background:#c82743}.match-entry{background:#17181e;border:1px solid #ffffff20;border-radius:12px;margin:12px 0;overflow:hidden}.match-main{display:flex;justify-content:space-between;gap:15px;width:100%;padding:20px;text-align:left;background:none;border:0;color:white}.match-main h3{font:800 clamp(19px,3vw,27px) 'Barlow Condensed',sans-serif;margin:10px 0}.match-main h3 span{color:#f04c65}.match-main small,.match-score small{color:#a6a6b1;font-size:11px}.match-league{color:#ed4258;font-size:10px;font-weight:900;letter-spacing:1px}.match-score{text-align:right;white-space:nowrap;font:900 30px 'Barlow Condensed',sans-serif}.match-score small{display:block;font:700 10px Inter,sans-serif;margin-top:9px}.match-expanded{padding:20px;border-top:1px solid #ffffff20}.match-expanded h4{color:#ed4258}.match-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}.match-facts>div{background:#25262f;padding:10px;border-radius:6px;min-width:0;overflow-wrap:anywhere}.match-facts span{display:block;color:#aaa;font-size:10px}.match-facts strong{font-size:13px}.match-players section{border-top:1px solid #ffffff20;margin-top:15px;padding-top:15px}@media(max-width:540px){.match-summary{grid-template-columns:1fr 1fr 1fr;gap:6px}.match-summary>div{padding:10px}.match-summary strong{font-size:26px}.match-summary span{font-size:8px}.match-main{padding:13px}.match-score{font-size:23px}}

.account-actions{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px}.account-btn{display:inline-flex;align-items:center;justify-content:center;background:#c82743;color:#fff;border-radius:7px;padding:11px 15px;font-size:12px;font-weight:800;white-space:nowrap}.account-btn:hover{background:#e43a56}.account-muted{background:#272832}.account-name{font-size:12px;color:#fff;font-weight:700}.head{flex-wrap:wrap}@media(max-width:850px){.account-actions{width:100%;padding-bottom:5px}}

.helper-form{display:grid;gap:9px;margin:16px 0;padding:15px;border:1px solid #ffffff25;background:#22232b;border-radius:9px}.helper-form strong{font-size:13px;letter-spacing:1px}.helper-form input{min-width:0;padding:11px;border:1px solid #ffffff30;border-radius:6px;background:#11131a;color:#fff}.helper-form button{background:#cb2945;color:white;border:0;border-radius:6px;padding:12px;font-weight:800}.helper-removal{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.helper-removal button{font-size:11px;border:1px solid #ffffff25;color:#e5b4bd;background:transparent;padding:8px;border-radius:6px}

.kit-editor{background:linear-gradient(130deg,#20232d,#111219);border:1px solid #ffffff22;border-radius:12px;padding:19px;margin:0 0 17px}.kit-editor-heading{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center}.kit-editor-heading strong{font:800 21px 'Barlow Condensed',sans-serif;letter-spacing:1px}.kit-editor-heading span,.kit-preview span{font-size:10px;color:#aeb1bd}.kit-options{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.kit-options label{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;color:#e0e0e7;background:#ffffff0b;border:1px solid #ffffff15;border-radius:8px;padding:8px}.kit-options input[type=color]{width:36px;height:30px;border:0;background:transparent;cursor:pointer}.kit-options select{background:#191b23;border:1px solid #ffffff30;color:#fff;padding:8px;border-radius:6px}.kit-preview{display:flex;align-items:center;gap:10px;margin-top:12px}.kit-preview .jersey{width:65px;height:65px}.pitch-slot .jersey{width:100%;max-width:78px;height:64px;filter:drop-shadow(0 6px 5px #0009);transition:transform .18s}.pitch-slot:hover .jersey,.pitch-slot.active .jersey{transform:scale(1.12)}.pitch-slot{width:20%}.pitch-name{font-size:clamp(9px,1.2vw,12px);font-weight:900;letter-spacing:.3px}.pitch-pos{font-weight:800;color:#cfe4d8}.pitch{background:repeating-linear-gradient(0deg,#0f4035 0%,#0f4035 12.5%,#154d3e 12.5%,#154d3e 25%)}@media(max-width:500px){.pitch-slot .jersey{height:48px}.pitch-slot{width:20%}.kit-editor{padding:12px}}

.lineup-controls .lineup-export{background:#cf2944;border-color:#f35b70;color:#fff;box-shadow:0 5px 18px #0005}.lineup-controls .lineup-export:hover{background:#eb3c57}

.lineup-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(250px,1fr);gap:24px;align-items:start}.lineup-controls{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap}.lineup-controls label{font-size:12px;font-weight:800;color:#d7d7dd}.lineup-controls select,.lineup-controls button,.remove-slot{margin-left:10px;background:#1c1e24;border:1px solid #ffffff30;border-radius:6px;color:white;padding:11px;font-weight:700}.pitch{position:relative;aspect-ratio:3/4;background:repeating-linear-gradient(0deg,#164e3d 0%,#164e3d 12.5%,#195943 12.5%,#195943 25%);border:3px solid #c0d9c85c;border-radius:9px;overflow:hidden;max-width:640px;margin:auto}.pitch:before{content:'';position:absolute;inset:5%;border:2px solid #ffffff50;pointer-events:none}.pitch-mid{position:absolute;left:5%;right:5%;top:50%;border-top:2px solid #ffffff50}.pitch-circle{position:absolute;left:50%;top:50%;width:25%;aspect-ratio:1;border:2px solid #ffffff50;border-radius:50%;transform:translate(-50%,-50%)}.pitch-box{position:absolute;left:25%;width:50%;height:15%;border:2px solid #ffffff50}.pitch-box-top{top:5%;border-top:0}.pitch-box-bottom{bottom:5%;border-bottom:0}.pitch-slot{position:absolute;transform:translate(-50%,-50%);width:18%;min-width:52px;border:0;background:transparent;color:white;display:flex;align-items:center;flex-direction:column;gap:2px;padding:0;z-index:1;touch-action:manipulation}.pitch-shirt{display:grid;place-items:center;width:43px;height:43px;background:#cf2944;border:2px solid #ffb7c3;border-radius:13px 13px 7px 7px;box-shadow:0 3px 14px #0008;font-weight:900;font-size:15px}.pitch-slot.active .pitch-shirt{outline:3px solid #fff}.pitch-name{background:#0c1114df;border-radius:4px;padding:3px 5px;font-size:clamp(8px,1.2vw,11px);font-weight:900;max-width:100%;overflow:hidden;text-overflow:ellipsis}.pitch-pos{font-size:9px;color:#e4f0e8}.lineup-help{font-size:12px;line-height:1.7;color:#a7a7b1}.lineup-roster{background:#17181e;border:1px solid #ffffff20;border-radius:9px;padding:18px}.lineup-roster h3{display:flex;justify-content:space-between;margin:0;font:800 27px 'Barlow Condensed'}.lineup-roster h3 span{color:#e33149}.lineup-roster p{color:#9fa0ac;font-size:12px;line-height:1.6}.lineup-player-list{display:grid;gap:6px;max-height:620px;overflow:auto}.lineup-player{width:100%;background:#22232a;border:1px solid #ffffff17;border-radius:6px;padding:10px;display:flex;align-items:center;gap:12px;text-align:left;color:white}.lineup-player b{color:#ee425b;min-width:35px}.lineup-player span{font-weight:700;font-size:12px;flex:1}.lineup-player small{display:block;color:#9e9fa9;font-size:10px;margin-top:3px}.lineup-player em{font-style:normal;font-size:9px;color:#aeb0bb}.lineup-player.selected{border-color:#ff526c;background:#4c202c}.lineup-player.used{opacity:.76}.remove-slot{margin:15px 0 0;width:100%}@media(max-width:780px){.lineup-layout{grid-template-columns:1fr}.lineup-player-list{grid-template-columns:repeat(2,minmax(0,1fr));max-height:none}.pitch-name{font-size:10px}}@media(max-width:420px){.pitch-shirt{width:34px;height:34px;font-size:12px}.pitch-slot{min-width:45px}.lineup-player-list{grid-template-columns:1fr}}

@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#0b0c10;color:#f7f7f8;font-family:Inter,system-ui,sans-serif}button{cursor:pointer;font:inherit}a{color:inherit;text-decoration:none}.app{min-height:100vh;background:radial-gradient(ellipse at 85% 12%,#4e101a40,transparent 42%),#0b0c10}.wrap{width:min(1120px,calc(100% - 40px));margin:auto}.header{border-bottom:1px solid #ffffff15;background:#0c0d11e8;position:sticky;top:0;z-index:2;backdrop-filter:blur(12px)}.head{min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:20px}.logo{display:flex;align-items:center;gap:12px;font:900 25px 'Barlow Condensed',sans-serif;letter-spacing:.5px}.shield{display:grid;place-items:center;width:42px;height:46px;background:#db2b43;color:white;clip-path:polygon(50% 0,96% 17%,96% 76%,50% 100%,4% 76%,4% 17%);font:900 17px Inter,sans-serif}.logo em{font-style:normal;color:#ec344d}.menu{display:flex;gap:6px;flex-wrap:wrap}.menu button{border:0;background:none;color:#a9a9b4;padding:10px 12px;border-radius:5px;font-size:12px;font-weight:700}.menu button:hover,.menu button.selected{color:#fff;background:#bc2238}.home{padding:105px 0 90px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:3px;color:#ed4258;text-transform:uppercase}.hero-title{font:900 clamp(65px,10vw,128px)/.85 'Barlow Condensed',sans-serif;margin:24px 0 22px;text-transform:uppercase;letter-spacing:-1px}.hero-title span{color:#e33149}.subtitle{color:#a7a7b1;font-size:15px;line-height:1.7;max-width:520px;margin-bottom:48px}.tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.tile{border:1px solid #ffffff1c;border-radius:8px;background:linear-gradient(145deg,#1b1c23,#121319);text-align:left;color:white;padding:29px;min-height:170px;transition:transform .2s,border-color .2s}.tile:hover{transform:translateY(-4px);border-color:#df3049}.tile-top{display:flex;justify-content:space-between;color:#eb3b52;font-size:12px;font-weight:800}.tile h2{font:800 37px 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:20px 0 6px}.tile p{color:#a7a7b2;font-size:12px;margin:0}.section{padding:70px 0 100px;min-height:70vh}.title{font:900 clamp(46px,7vw,75px) 'Barlow Condensed',sans-serif;text-transform:uppercase;margin:12px 0 30px}.back{border:1px solid #ffffff35;background:none;color:#fff;padding:11px 15px;border-radius:5px;font-size:12px;font-weight:700}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{background:#17181e;border:1px solid #ffffff18;padding:24px;border-radius:7px}.card h3{font:800 27px 'Barlow Condensed',sans-serif;margin:5px 0 16px}.card p{color:#a8a8b3;font-size:13px;line-height:1.7}.tag{font-size:10px;letter-spacing:1.5px;font-weight:800;color:#e84259}.players{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.player{display:flex;align-items:center;gap:14px;background:#17181e;border:1px solid #ffffff15;border-radius:6px;padding:17px}.num{font:900 36px 'Barlow Condensed',sans-serif;color:#e53850;min-width:43px}.player strong{font-size:13px}.player small{display:block;color:#a2a2ac;font-size:11px;margin-top:4px}.note{background:#21171d;border-left:3px solid #df3047;color:#c9bfc4;padding:19px 22px;font-size:13px;line-height:1.6}.tablewrap{overflow:auto;margin-top:16px;border:1px solid #ffffff18;border-radius:6px}table{width:100%;border-collapse:collapse;min-width:480px}td,th{text-align:left;border-bottom:1px solid #ffffff14;padding:14px;font-size:12px}th{color:#ed4258;background:#1a1b21}.x-news{position:fixed;bottom:22px;right:22px;z-index:20;display:flex;flex-direction:column;align-items:flex-end;gap:12px}.x-launch{border:1px solid #f14b61;background:#c5223b;color:white;border-radius:100px;box-shadow:0 8px 35px #0009;padding:13px 20px;display:flex;align-items:center;gap:10px;font-size:12px;font-weight:800}.x-symbol{font-size:22px;line-height:1}.x-panel{width:min(370px,calc(100vw - 30px));height:min(620px,calc(100vh - 110px));max-height:calc(100vh - 90px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #ffffff30;background:#111218;border-radius:12px;box-shadow:0 20px 80px #000c}.x-panel-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;background:#1c1d24;border-bottom:1px solid #ffffff18}.x-panel-head strong{font-size:12px;letter-spacing:1px}.x-panel-head small{display:block;margin-top:5px;color:#a4a4af;font-size:11px}.x-panel-head button{border:0;background:transparent;color:#fff;font-size:28px;line-height:1}.x-feed{overflow-y:auto;overscroll-behavior:contain;min-height:220px;flex:1;padding:8px;scrollbar-width:thin;scrollbar-color:#b82c47 #111218}.x-feed>a{display:block;text-align:center;padding:45px 10px;color:#f26b7d;font-size:13px}.x-panel-foot{padding:12px 17px;border-top:1px solid #ffffff17;text-align:right}.x-panel-foot a{font-size:12px;font-weight:700;color:#ef536a}@media(max-width:540px){.x-news{right:12px;bottom:12px}.x-panel{max-height:65vh}}.standings th:not(:nth-child(2)),.standings td:not(:nth-child(2)){text-align:center}.standings .team-name{font-weight:700;min-width:180px}.standings .club-row{background:#64202e!important;color:#fff}.standings .club-row td{border-color:#c32a4166}.standings-caption{color:#8e8e99;font-size:11px;margin-top:12px}.note a{color:#ff6b80}.footer{border-top:1px solid #ffffff16;color:#92929c;font-size:11px;padding:25px 0}.footer .wrap{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
@media(max-width:850px){.head{flex-direction:column;padding:15px 0}.menu{justify-content:center}.cards{grid-template-columns:1fr}.players{grid-template-columns:repeat(2,minmax(0,1fr))}.home{padding-top:75px}}@media(max-width:540px){.tiles{grid-template-columns:1fr}.players{grid-template-columns:1fr}.hero-title{font-size:65px}.tile{min-height:140px}.logo{font-size:22px}.menu button{padding:9px}}
`;
type Formation = '4-3-3'|'4-4-2'|'4-2-3-1'|'3-5-2'|'5-3-2'|'4-1-2-1-2';
const formations:Record<Formation,number[]>={'4-3-3':[3,3,4,1],'4-4-2':[2,4,4,1],'4-2-3-1':[1,3,2,4,1],'3-5-2':[2,5,3,1],'5-3-2':[2,3,5,1],'4-1-2-1-2':[2,1,2,1,4,1]};
type PitchPosition={x:number;y:number;label:string};
const tacticalPositions:Record<Formation,PitchPosition[]>={
 '4-3-3':[
 {x:21,y:17,label:'EI'},{x:50,y:13,label:'DC'},{x:79,y:17,label:'ED'},
 {x:28,y:40,label:'MC'},{x:50,y:48,label:'MCD'},{x:72,y:40,label:'MC'},
 {x:13,y:70,label:'LI'},{x:38,y:75,label:'DFC'},{x:62,y:75,label:'DFC'},{x:87,y:70,label:'LD'},
 {x:50,y:90,label:'POR'}],
 '4-4-2':[
 {x:38,y:16,label:'DC'},{x:62,y:16,label:'DC'},
 {x:13,y:43,label:'MI'},{x:39,y:47,label:'MC'},{x:61,y:47,label:'MC'},{x:87,y:43,label:'MD'},
 {x:13,y:70,label:'LI'},{x:38,y:75,label:'DFC'},{x:62,y:75,label:'DFC'},{x:87,y:70,label:'LD'},
 {x:50,y:90,label:'POR'}],
 '4-2-3-1':[
 {x:50,y:12,label:'DC'},
 {x:20,y:34,label:'MI'},{x:50,y:35,label:'MCO'},{x:80,y:34,label:'MD'},
 {x:38,y:55,label:'MCD'},{x:62,y:55,label:'MCD'},
 {x:13,y:74,label:'LI'},{x:38,y:76,label:'DFC'},{x:62,y:76,label:'DFC'},{x:87,y:74,label:'LD'},
 {x:50,y:91,label:'POR'}],
 '3-5-2':[
 {x:38,y:14,label:'DC'},{x:62,y:14,label:'DC'},
 {x:50,y:34,label:'MCO'},
 {x:13,y:49,label:'CAI'},{x:37,y:52,label:'MC'},{x:63,y:52,label:'MC'},{x:87,y:49,label:'CAD'},
 {x:26,y:75,label:'DFC'},{x:50,y:78,label:'DFC'},{x:74,y:75,label:'DFC'},
 {x:50,y:91,label:'POR'}],
 '5-3-2':[
 {x:38,y:15,label:'DC'},{x:62,y:15,label:'DC'},
 {x:28,y:44,label:'MC'},{x:50,y:48,label:'MCD'},{x:72,y:44,label:'MC'},
 {x:11,y:69,label:'CAI'},{x:30,y:75,label:'DFC'},{x:50,y:78,label:'DFC'},{x:70,y:75,label:'DFC'},{x:89,y:69,label:'CAD'},
 {x:50,y:91,label:'POR'}],
 '4-1-2-1-2':[
 {x:38,y:13,label:'DC'},{x:62,y:13,label:'DC'},
 {x:50,y:32,label:'MCO'},
 {x:27,y:48,label:'MC'},{x:73,y:48,label:'MC'},
 {x:50,y:60,label:'MCD'},
 {x:12,y:74,label:'LI'},{x:38,y:78,label:'DFC'},{x:62,y:78,label:'DFC'},{x:88,y:74,label:'LD'},
 {x:50,y:91,label:'POR'}]
};
function positions(shape:Formation):PitchPosition[]{return tacticalPositions[shape]}
type Kit={primary:string;secondary:string;trim:string;pattern:'solid'|'stripe'|'halves'};
const defaultKit:Kit={primary:'#C81F3D',secondary:'#111827',trim:'#F4F4F5',pattern:'stripe'};
const kitPath='M -23 -32 L -37 -23 L -49 -8 L -36 2 L -29 -7 L -29 34 Q 0 40 29 34 L 29 -7 L 36 2 L 49 -8 L 37 -23 L 23 -32 L 12 -37 Q 0 -27 -12 -37 Z';
function Jersey({number,kit}:{number:string;kit:Kit}){
 const id=useRef('kit'+Math.random().toString(36).slice(2)).current;
 return <svg className="jersey" viewBox="-54 -46 108 92" aria-hidden="true"><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".26"/><stop offset=".4" stopColor="#ffffff" stopOpacity="0"/><stop offset="1" stopColor="#000000" stopOpacity=".4"/></linearGradient><clipPath id={id+'clip'}><path d={kitPath}/></clipPath></defs><path d={kitPath} fill={kit.primary} stroke={kit.trim} strokeWidth="1.4"/><g clipPath={`url(#${id}clip)`}>{kit.pattern==='stripe'?<path d="M-10 -45H10V43H-10Z" fill={kit.secondary}/>:kit.pattern==='halves'?<path d="M0 -45H55V45H0Z" fill={kit.secondary}/>:null}<path d={kitPath} fill={`url(#${id})`}/></g><path d="M-12 -37 Q0 -27 12 -37" stroke={kit.trim} strokeWidth="5" fill="none"/><path d="M-39 -20 L-49 -8 M39 -20 L49 -8" stroke={kit.trim} strokeWidth="3"/><path d="M-27 30 Q0 35 27 30" stroke={kit.trim} strokeOpacity=".45" fill="none"/><text x="0" y="14" fill="#ffffff" stroke="#000000" strokeWidth=".6" paintOrder="stroke" textAnchor="middle" fontSize="27" fontWeight="900" fontFamily="Arial">{number}</text><path d="M19 -18l4 2v6l-4 3-4-3v-6z" fill={kit.trim}/></svg>;
}
function paintJersey(ctx:CanvasRenderingContext2D,x:number,y:number,number:string,kit:Kit,scale=1){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.shadowColor='#0009';ctx.shadowBlur=15;ctx.shadowOffsetY=9;
 const p=new Path2D(kitPath);ctx.fillStyle=kit.primary;ctx.fill(p);ctx.shadowColor='transparent';
 ctx.save();ctx.clip(p);ctx.fillStyle=kit.secondary;if(kit.pattern==='stripe')ctx.fillRect(-10,-42,20,85);if(kit.pattern==='halves')ctx.fillRect(0,-42,55,85);
 const shine=ctx.createLinearGradient(-40,-40,40,40);shine.addColorStop(0,'#ffffff55');shine.addColorStop(.48,'#ffffff00');shine.addColorStop(1,'#00000066');ctx.fillStyle=shine;ctx.fill(p);ctx.restore();
 ctx.strokeStyle=kit.trim;ctx.lineWidth=2;ctx.stroke(p);ctx.beginPath();ctx.moveTo(-12,-37);ctx.quadraticCurveTo(0,-27,12,-37);ctx.stroke();
 ctx.fillStyle='#fff';ctx.strokeStyle='#10131c';ctx.lineWidth=2;ctx.textAlign='center';ctx.font='900 27px Arial';ctx.strokeText(number,0,14);ctx.fillText(number,0,14);ctx.restore();
}
async function exportLineup(formation:Formation,slots:(number|null)[],kit:Kit,share:boolean,roster:string[][]){
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('No se pudo generar la imagen');
 const W=1080,H=1350;
 const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#12141d');bg.addColorStop(.65,'#080b10');bg.addColorStop(1,'#26101b');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 ctx.fillStyle=kit.primary;ctx.fillRect(0,0,W,10);
 ctx.fillStyle='#ffffff08';ctx.beginPath();ctx.arc(920,30,300,0,Math.PI*2);ctx.fill();
 ctx.textAlign='left';ctx.fillStyle='#fff';ctx.font='900 70px Arial';ctx.fillText('LOS INTOCABLES',65,103);
 ctx.fillStyle=kit.primary;ctx.fillRect(65,123,52,5);
 ctx.fillStyle='#d4d5de';ctx.font='bold 22px Arial';ctx.fillText('FC 27  /  ONCE TITULAR',65,166);
 ctx.textAlign='right';ctx.fillStyle='#ffffff';ctx.font='900 45px Arial';ctx.fillText(formation,1015,162);
 ctx.fillStyle='#a6a9b5';ctx.font='bold 16px Arial';ctx.fillText('SISTEMA TÁCTICO',1015,119);
 const px=48,py=202,pw=984,ph=1022;
 const grass=ctx.createLinearGradient(px,py,px+pw,py+ph);grass.addColorStop(0,'#173d36');grass.addColorStop(.55,'#0d302d');grass.addColorStop(1,'#092321');ctx.fillStyle=grass;ctx.fillRect(px,py,pw,ph);
 for(let i=0;i<12;i++){ctx.fillStyle=i%2===0?'#ffffff08':'#00000009';ctx.fillRect(px,py+i*ph/12,pw,ph/12)}
 const vignette=ctx.createRadialGradient(540,py+ph*.46,120,540,py+ph*.46,700);vignette.addColorStop(0,'#00000000');vignette.addColorStop(1,'#00000070');ctx.fillStyle=vignette;ctx.fillRect(px,py,pw,ph);
 ctx.strokeStyle='#ffffff34';ctx.lineWidth=2.5;ctx.strokeRect(px+25,py+25,pw-50,ph-50);
 ctx.beginPath();ctx.moveTo(px+25,py+ph/2);ctx.lineTo(px+pw-25,py+ph/2);ctx.stroke();
 ctx.beginPath();ctx.arc(540,py+ph/2,110,0,Math.PI*2);ctx.stroke();
 ctx.strokeRect(px+pw*.24,py+25,pw*.52,135);ctx.strokeRect(px+pw*.24,py+ph-160,pw*.52,135);
 const coords=positions(formation);
 coords.forEach((p,i)=>{
  const idx=slots[i];const player=idx===null?null:roster[idx];
  const x=px+(11+p.x*.78)/100*pw;
  const y=py+(5+p.y*.88)/100*ph;
  ctx.fillStyle='#00000048';ctx.beginPath();ctx.ellipse(x,y+28,52,14,0,0,Math.PI*2);ctx.fill();
  paintJersey(ctx,x,y-13,player?player[2]:'+',kit,1.03);
  const name=player?player[0]:'POR ASIGNAR';
  ctx.font='900 19px Arial';const textWidth=Math.min(140,ctx.measureText(name).width+22);
  const labelWidth=Math.max(91,textWidth);
  ctx.fillStyle='#090d14ed';ctx.beginPath();ctx.roundRect(x-labelWidth/2,y+33,labelWidth,30,6);ctx.fill();
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.fillText(name,x,y+54,130);
  ctx.fillStyle='#e6f2ed';ctx.font='bold 14px Arial';ctx.fillText(p.label,x,y+81);
 });
 ctx.fillStyle='#10131b';ctx.fillRect(0,1224,W,126);
 ctx.fillStyle=kit.primary;ctx.fillRect(65,1262,7,46);
 ctx.textAlign='left';ctx.fillStyle='#fff';ctx.font='900 27px Arial';ctx.fillText('LOS INTOCABLES FC',91,1281);
 ctx.fillStyle='#9ca1af';ctx.font='bold 17px Arial';ctx.fillText('COMPETICIÓN · FC 27',91,1306);
 ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font='900 23px Arial';ctx.fillText('MATCHDAY XI',1015,1284);
 ctx.fillStyle='#9ca1af';ctx.font='17px Arial';ctx.fillText('ORGULLO INTOCABLE',1015,1309);
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Error al exportar')),'image/png'));
 const file=new File([blob],'los-intocables-once-oficial.png',{type:'image/png'});
 if(share&&navigator.share&&navigator.canShare?.({files:[file]})){
  try{await navigator.share({files:[file],title:'Once titular · Los Intocables FC 27'});return}catch(err){if((err as Error).name==='AbortError')return}
 }
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function Lineup(){
 const [formation,setFormation]=useState<Formation>(()=>{try{const v=localStorage.getItem('li-formation');return v&&v in formations?v as Formation:'4-3-3'}catch{return '4-3-3'}});
 const [slots,setSlots]=useState<(number|null)[]>(()=>{try{const v=JSON.parse(localStorage.getItem('li-lineup')||'[]');return Array.isArray(v)?Array.from({length:11},(_,i)=>typeof v[i]==='number'&&v[i]>=0&&v[i]<1000?v[i]:null):Array(11).fill(null)}catch{return Array(11).fill(null)}});
 const [helpers,setHelpers]=useState<string[][]>(()=>{try{const v=JSON.parse(localStorage.getItem('li-helpers')||'[]');return Array.isArray(v)?v.filter((p:unknown)=>Array.isArray(p)&&typeof p[0]==='string'&&typeof p[2]==='string'):[]}catch{return []}});
 const [helperName,setHelperName]=useState('');
 const [helperNumber,setHelperNumber]=useState('');
 const roster=[...players,...helpers];
 const addHelper=()=>{const name=helperName.trim().toUpperCase();if(!name)return;setHelpers(old=>[...old,[name,'AYUDA',helperNumber.trim()||'—']]);setHelperName('');setHelperNumber('')};
 const removeHelper=(index:number)=>{setHelpers(old=>old.filter((_,i)=>i!==index));setSlots(old=>old.map(n=>n===players.length+index?null:n!==null&&n>players.length+index?n-1:n))};
 useEffect(()=>{try{localStorage.setItem('li-helpers',JSON.stringify(helpers))}catch{}},[helpers]);
 const [selected,setSelected]=useState<number|null>(null);
 const [active,setActive]=useState<number|null>(null);
 const [exportError,setExportError]=useState('');
 const [kit,setKit]=useState<Kit>(()=>{try{const k=JSON.parse(localStorage.getItem('li-kit')||'null');return k&&/^#[0-9a-f]{6}$/i.test(k.primary)&&/^#[0-9a-f]{6}$/i.test(k.secondary)&&/^#[0-9a-f]{6}$/i.test(k.trim)&&['solid','stripe','halves'].includes(k.pattern)?k:defaultKit}catch{return defaultKit}});
 useEffect(()=>{try{localStorage.setItem('li-formation',formation);localStorage.setItem('li-lineup',JSON.stringify(slots))}catch{}},[formation,slots]);
 useEffect(()=>{try{localStorage.setItem('li-kit',JSON.stringify(kit))}catch{}},[kit]);
 const assign=(slot:number,player:number|null)=>{
  setSlots(old=>{const next=[...old];if(player!==null){const previous=next.indexOf(player);if(previous!==-1&&previous!==slot)next[previous]=next[slot];}next[slot]=player;return next});
  setActive(null);setSelected(null);
 };
 const pick=(index:number)=>{if(active!==null){assign(active,index);return}setSelected(index)};
 const drop=(slot:number,e:React.DragEvent)=>{e.preventDefault();const raw=e.dataTransfer.getData('text/plain');if(raw.startsWith('player:')){const n=Number(raw.slice(7));if(Number.isInteger(n)&&n>=0&&n<roster.length)assign(slot,n)}else if(raw.startsWith('slot:')){const from=Number(raw.slice(5));if(from>=0&&from<11){setSlots(old=>{const next=[...old];[next[from],next[slot]]=[next[slot],next[from]];return next})}}};
 const coords=positions(formation);
 return <div className="lineup-layout"><div><div className="lineup-controls"><label>FORMACIÓN <select value={formation} onChange={e=>setFormation(e.target.value as Formation)}>{Object.keys(formations).map(f=><option key={f} value={f}>{f}</option>)}</select></label><button onClick={()=>{setSlots(Array(11).fill(null));setActive(null);setSelected(null)}}>Vaciar once</button><button className="lineup-export" onClick={()=>{setExportError('');exportLineup(formation,slots,kit,false,roster).catch(()=>setExportError('No se pudo generar la imagen.'))}}>📸 Descargar imagen</button><button className="lineup-export" onClick={()=>{setExportError('');exportLineup(formation,slots,kit,true,roster).catch(()=>setExportError('No se pudo compartir la imagen.'))}}>Compartir once</button></div><div className="kit-editor"><div className="kit-editor-heading"><strong>DISEÑA TU EQUIPACIÓN</strong><span>Personaliza los colores y el estilo del once</span></div><div className="kit-options"><label>Principal <input aria-label="Color principal" type="color" value={kit.primary} onChange={e=>setKit(k=>({...k,primary:e.target.value}))}/></label><label>Secundario <input aria-label="Color secundario" type="color" value={kit.secondary} onChange={e=>setKit(k=>({...k,secondary:e.target.value}))}/></label><label>Detalles <input aria-label="Color de detalles" type="color" value={kit.trim} onChange={e=>setKit(k=>({...k,trim:e.target.value}))}/></label><label>Diseño <select value={kit.pattern} onChange={e=>setKit(k=>({...k,pattern:e.target.value as Kit['pattern']}))}><option value="stripe">Franja central</option><option value="halves">Mitades</option><option value="solid">Liso</option></select></label></div><div className="kit-preview"><Jersey number="10" kit={kit}/><span>VISTA PREVIA · EQUIPACIÓN TITULAR</span></div></div><div className="pitch" aria-label="Campo de fútbol para organizar la alineación"><div className="pitch-mid"/><div className="pitch-circle"/><div className="pitch-box pitch-box-top"/><div className="pitch-box pitch-box-bottom"/>{coords.map((p,i)=>{const n=slots[i];const player=n===null?null:roster[n];return <button key={i} className={'pitch-slot'+(active===i?' active':'')} style={{left:p.x+'%',top:p.y+'%'}} draggable={n!==null} onDragStart={e=>e.dataTransfer.setData('text/plain','slot:'+i)} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(i,e)} onClick={()=>{if(selected!==null)assign(i,selected);else setActive(active===i?null:i)}} title="Pulsa para elegir un jugador o arrastra uno aquí"><Jersey number={player?player[2]:'+'} kit={kit}/><span className="pitch-name">{player?player[0]:'Elegir'}</span><span className="pitch-pos">{p.label}</span></button>})}</div>{exportError&&<p role="alert" className="lineup-help">{exportError}</p>}<p className="lineup-help">Pulsa una posición y después un jugador, o arrastra jugadores al campo. Puedes intercambiar jugadores entre posiciones. El once se guarda en este navegador.</p></div><aside className="lineup-roster"><h3>PLANTILLA <span>{slots.filter(x=>x!==null).length}/11</span></h3><p>Selecciona un jugador y toca su posición en el campo.</p><form className="helper-form" onSubmit={e=>{e.preventDefault();addHelper()}}><strong>+ AÑADIR AYUDAS</strong><input aria-label="Nombre de la ayuda" value={helperName} onChange={e=>setHelperName(e.target.value)} placeholder="Nombre del jugador" maxLength={22} required/><input aria-label="Dorsal de la ayuda" value={helperNumber} onChange={e=>setHelperNumber(e.target.value.replace(/[^0-9]/g,'').slice(0,3))} placeholder="Dorsal (opcional)" inputMode="numeric"/><button type="submit">Añadir ayuda</button></form><div className="lineup-player-list">{roster.map(([name,pos,num],i)=><button key={i} draggable onDragStart={e=>e.dataTransfer.setData('text/plain','player:'+i)} className={'lineup-player'+(selected===i?' selected':'')+(slots.includes(i)?' used':'')} onClick={()=>pick(i)}><b>#{num}</b><span>{name}<small>{pos}</small></span><em>{slots.includes(i)?'EN EL 11':'+'}</em></button>)}</div><div className="helper-removal">{helpers.map((p,i)=><button key={i} type="button" onClick={()=>removeHelper(i)}>Eliminar ayuda: {p[0]} ×</button>)}</div>{active!==null&&<button className="remove-slot" onClick={()=>assign(active,null)}>Quitar jugador de la posición</button>}</aside></div>;
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

type MatchRecord={id:string;played_at:string;opponent:string;home_goals:number|null;away_goals:number|null;league:string|null;details:Record<string,unknown>};
const leagueLabels:Record<string,string>={all:'Todos',unassigned:'Sin clasificar',vpg:'VPG 5ª',afj:'AFJ 4ª',bronze:'Bronze Zero',friendly:'Amistosos'};
const statsNames:Record<string,string>={goals:'Goles',assists:'Asistencias',rating:'Nota',shots:'Tiros',shotsOnTarget:'Tiros a puerta',passesMade:'Pases',passesCompleted:'Pases acertados',tacklesWon:'Entradas ganadas',interceptions:'Intercepciones',saves:'Paradas',yellowCards:'Amarillas',redCards:'Rojas',dribblesCompleted:'Regates',possession:'Posesión',fouls:'Faltas',offsides:'Fueras de juego',corners:'Córners',shotAttempts:'Disparos',passAttempts:'Pases intentados'};
const hiddenStats=new Set(['matchId','match_id','id','timestamp','matchDate','date','clubId','clubName','opponentId','opponentName','matchType','match_type','players','raw','home_goals','away_goals','goalsFor','goalsAgainst','goals','clubs','score','teamId','playerId','playerName','playername','name']);
function readableStat(key:string){return statsNames[key]||key.replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase())}
function MatchCenter(){
 const [matches,setMatches]=useState<MatchRecord[]>([]);
 const [filter,setFilter]=useState('all');
 const [opened,setOpened]=useState<string|null>(null);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(true);
 useEffect(()=>{fetch('/api/matches/detailed').then(r=>{if(!r.ok)throw Error('No disponible');return r.json()}).then(d=>setMatches(Array.isArray(d.matches)?d.matches:[])).catch(()=>setError('No se han podido cargar los partidos.')).finally(()=>setBusy(false))},[]);
 const shown=matches.filter(m=>filter==='all'||(filter==='unassigned'?!m.league:m.league===filter));
 const entries=(obj:Record<string,unknown>)=>Object.entries(obj).filter(([k,v])=>!hiddenStats.has(k)&&(['string','number','boolean'].includes(typeof v))&&String(v).length<65);
 return <div className="match-center"><div className="match-filters">{Object.entries(leagueLabels).map(([key,label])=><button key={key} className={filter===key?'chosen':''} onClick={()=>setFilter(key)}>{label}</button>)}</div>{busy&&<p>Cargando partidos…</p>}{error&&<p role="alert">{error}</p>}{!busy&&!error&&!shown.length&&<div className="note">No hay partidos registrados en esta categoría.</div>}{shown.map(m=>{const d=m.details||{};const players=Array.isArray(d.players)?d.players as Record<string,unknown>[]:[];const expanded=opened===m.id;const facts=entries(d);return <article className="match-entry" key={m.id}><button className="match-main" onClick={()=>setOpened(expanded?null:m.id)} aria-expanded={expanded}><div className="match-ident"><span className="match-league">{leagueLabels[m.league||'unassigned']||'Sin clasificar'}</span><h3>Los Intocables <span>–</span> {m.opponent}</h3><small>{m.played_at?new Date(m.played_at).toLocaleString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'Sin fecha'}</small></div><div className="match-result"><strong>{m.home_goals??'–'} : {m.away_goals??'–'}</strong><small>{expanded?'Cerrar −':'Estadísticas +'}</small></div></button>{expanded&&<div className="match-expanded"><h4>Estadísticas del partido</h4>{facts.length?<div className="match-stat-grid">{facts.map(([k,v])=><div key={k}><span>{readableStat(k)}</span><b>{String(v)}</b></div>)}</div>:<p>No hay estadísticas generales disponibles para este partido.</p>}{players.length>0&&<><h4>Jugadores ({players.length})</h4><div className="match-players">{players.map((p,i)=><section key={i}><strong>{String(p.playername||p.playerName||p.name||'Jugador '+(i+1))}</strong><div className="match-stat-grid">{entries(p).map(([k,v])=><div key={k}><span>{readableStat(k)}</span><b>{String(v)}</b></div>)}</div></section>)}</div></>}</div>}</article>})}</div>;
}
function App(){
 const [page,setPage]=useState<Page>('inicio');
 const [comps,setComps]=useState<Competition[]>([]);
 const [loading,setLoading]=useState(true);
 const [account,setAccount]=useState<{logged_in:boolean;username:string|null;is_admin:boolean}>({logged_in:false,username:null,is_admin:false});
 useEffect(()=>{fetch('/api/auth/me',{credentials:'same-origin'}).then(r=>r.json()).then(setAccount).catch(()=>{})},[]);
 useEffect(()=>{fetch('/api/competitions').then(r=>{if(!r.ok)throw new Error('API unavailable');return r.json()}).then(d=>setComps(Array.isArray(d.competitions)?d.competitions:[])).catch(()=>setComps([])).finally(()=>setLoading(false))},[]);
 const go=(p:Page)=>{setPage(p);window.scrollTo(0,0)};
 const names:[string,string][]=[['afj','AFJ · 4ª DIVISIÓN'],['vpg','VPG · 5ª DIVISIÓN'],['bronze','VPG · BRONZE ZERO']];
 return <div className="app"><style>{style}</style><header className="header"><div className="wrap head"><a href="#" className="logo" onClick={e=>{e.preventDefault();go('inicio')}}><span className="shield">LI</span> LOS INTOCABLES <em>FC 27</em></a><nav className="menu">{(['inicio','competiciones','partidos','plantilla','clasificaciones','alineacion'] as Page[]).map(p=><button key={p} className={p===page?'selected':''} onClick={()=>go(p)}>{titles[p]}</button>)}</nav><div className="account-actions">{account.logged_in?<><span className="account-name">👤 {account.username}</span>{account.is_admin&&<a className="account-btn" href="/admin">Panel de control</a>}<a className="account-btn account-muted" href="/logout">Salir</a></>:<a className="account-btn" href="/login">Iniciar sesión</a>}</div></div></header>
 {page==='inicio'?<main className="wrap home"><div className="eyebrow">Clubes Pro · Temporada FC 27</div><h1 className="hero-title">LOS <span>INTOCABLES.</span></h1><p className="subtitle">La casa de nuestro club. Toda la información, los jugadores y las competiciones en un solo lugar.</p><div className="tiles">{links.map(x=><button className="tile" key={x.id} onClick={()=>go(x.id)}><div className="tile-top"><span>↗</span></div><h2>{x.name}</h2><p>{x.description}</p></button>)}</div></main>:
 <main className="wrap section"><button className="back" onClick={()=>go('inicio')}>← Volver al inicio</button><div className="eyebrow" style={{marginTop:35}}>Los Intocables · FC 27</div><h1 className="title">{titles[page]}</h1>
 {page==='plantilla'?<div className="players">{players.map(([name,pos,num],i)=><div className="player" key={i}><span className="num">{num}</span><div><strong>{name}</strong><small>{pos}</small></div></div>)}</div>:
 page==='alineacion'?<Lineup/>:
 page==='competiciones'?<div className="cards">{names.map(([id,name])=>{const c=comps.find(x=>x.id===id);return <article className="card" key={id}><div className="tag">COMPETICIÓN</div><h3>{name}</h3><p>{loading?'Cargando información…':c?.standings?.length?'Clasificación disponible: '+c.standings.length+' equipos.':'Clasificación pendiente de datos verificados.'}</p><button className="back" onClick={()=>go('clasificaciones')}>Ver clasificaciones →</button></article>})}</div>:
 page==='partidos'?<MatchCenter/>:
 <>{names.map(([id,name])=>{const c=comps.find(x=>x.id===id);return <section key={id} style={{marginBottom:42}}><h2 style={{fontFamily:'Barlow Condensed',fontSize:34,marginBottom:15}}>{name}</h2>{c?.standings?.length?<Standings competition={c}/>:<div className="note">{loading?'Cargando clasificación…':'Clasificación pendiente de datos verificados.'} <a href={id==='afj'?'https://www.eafcstats.es/competitions/259':id==='vpg'?'https://virtualprogaming.com/league/quinta-division-c':'https://virtualprogaming.com/league/superliga-zero-spain'} target="_blank" rel="noreferrer">Fuente oficial ↗</a></div>}</section>})}</>}

 </main>}
 <XNews/><footer className="footer"><div className="wrap"><strong>LOS INTOCABLES FC 27</strong><span>AFJ 4ª · VPG 5ª · BRONZE ZERO</span></div></footer></div>
}
createRoot(document.getElementById('root')!).render(<App />);
