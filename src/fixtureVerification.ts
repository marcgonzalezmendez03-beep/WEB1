// Calendarios fijos de Los Intocables: coincidencias conservadoras con partidos EA FC 27.
export type ScheduledMatch = { id:string; competition:'afj'|'vpg'|'bronze'; round?:number; date:string; time?:string; home:string; away:string };
export type PlayedMatch = { id:string; date:string; home:string; away:string; homeGoals?:number; awayGoals?:number };
export const competitionSources = {
 afj:'https://www.eafcstats.es/competitions/259',
 vpg:'https://eafcstats.es/competitions/294',
 bronze:'https://eafcstats.es/competitions/301'
} as const;
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const day=(s:string)=>s.slice(0,10);
const dateDistance=(a:string,b:string)=>Math.abs(new Date(a).getTime()-new Date(b).getTime())/86400000;
export function verifyFixtures(fixtures:ScheduledMatch[], played:PlayedMatch[]) {
 const used=new Set<string>();
 return fixtures.map(f=>{
  const candidates=played.filter(p=>!used.has(p.id)&&normalize(p.home)===normalize(f.home)&&normalize(p.away)===normalize(f.away)&&dateDistance(day(p.date),day(f.date))<=1);
  // Nunca confirmar cuando hay dos partidos candidatos o falta un identificador fiable.
  if(candidates.length!==1)return {fixture:f,status:candidates.length?'review':'pending' as const,played:null};
  const p=candidates[0];used.add(p.id);
  return {fixture:f,status:'verified' as const,played:p};
 });
}
