import vpg from './data/vpg.json';
import bronze from './data/bronze.json';
interface Env { ASSETS: {fetch(r:Request):Promise<Response>}; TWITCH_CLIENT_ID?:string; TWITCH_CLIENT_SECRET?:string; TWITCH_CHANNEL?:string }
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
const competitions=[['afj','AFJ · 4ª División','259',null],['vpg','VPG · 5ª División C','294',vpg],['bronze','VPG · Bronze Zero','301',bronze]].map(([id,name,source,p])=>{const s=p as typeof vpg|null;return {id,name,source,matches:s?.matches??[],standings:s?.standings??[],updated_at:s?.verified_at??null,status:s?'ok':'unavailable',message:s?'':'Sin datos verificados disponibles'}});
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const path=new URL(request.url).pathname;
 if(path==='/api/health')return json({status:'ok',time:new Date().toISOString(),migration:'partial'});
 if(path==='/api/competitions')return json({competitions});
 if(path.startsWith('/api/competitions/')){const c=competitions.find(c=>c.id===path.split('/').pop());return c?json(c):json({detail:'Competición desconocida'},404);}
 if(path==='/api/auth/me')return json({logged_in:false,username:null,is_admin:false});
 if(path==='/api/twitch/videos'){
 const client=env.TWITCH_CLIENT_ID,secret=env.TWITCH_CLIENT_SECRET,channel=env.TWITCH_CHANNEL||'losintocablesfc';
 if(!client||!secret)return json({detail:'Configura los secretos de Twitch en Cloudflare'},503);
 try{
 const tokenRes=await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',body:new URLSearchParams({client_id:client,client_secret:secret,grant_type:'client_credentials'})});
 if(!tokenRes.ok)throw Error();const token=await tokenRes.json() as {access_token:string};
 const helix=async(p:string,q:Record<string,string>)=>{const res=await fetch('https://api.twitch.tv/helix/'+p+'?'+new URLSearchParams(q),{headers:{'Client-Id':client,Authorization:'Bearer '+token.access_token}});if(!res.ok)throw Error();return (await res.json() as {data:any[]}).data;};
 const users=await helix('users',{login:channel});if(!users.length)return json({detail:'Canal no encontrado'},404);
 return json({channel,videos:await helix('videos',{user_id:users[0].id,type:'archive',first:'12'})});
 }catch{return json({detail:'No se pudo consultar Twitch'},502);}
 }
 if(path.startsWith('/api/')||/^\/(admin|login|register|logout)(\/|$)/.test(path))return json({detail:'Función pendiente de migración'},503);
 return env.ASSETS.fetch(request);
}};