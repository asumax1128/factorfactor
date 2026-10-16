'use strict';
// Emulator-only C confirmed-operation writer (minimal). The trusted Node side reads a
// participant-written ev record, replays it through the ORIGINAL createBEngine
// (extracted into c-source.js) and stores the applied operation under a revision.
// It never trusts committed/sent/thp claims and never splits shared HP.
const fs=require('node:fs'),vm=require('node:vm'),{ref,get,child}=require('firebase/database'),Store=require('./emulator-store.cjs');
const source=fs.readFileSync(require.resolve('./c-source.js'),'utf8'),sourceHash=require('node:crypto').createHash('sha256').update(source).digest('hex');
const clock={t:0};class Clock extends Date{static now(){return clock.t}}
const noop=()=>{},sink=new Proxy({},{get:(_,k)=>k==='transaction'||k==='set'?()=>Promise.resolve():noop});
const engine=new vm.Script(source).runInNewContext({Date:Clock,fref:()=>sink,TSV:()=>({}),fbNow:()=>clock.t},{timeout:1000});
const KEY=/^[A-Za-z0-9_-]{1,64}$/,CODE=/^[0-9]{4}$/;
const gameRef=(db,code,gid)=>ref(db,`${Store.ROOT}/c/${code}_${gid}`);
const copy=x=>JSON.parse(JSON.stringify(x));
const nat=n=>Number.isSafeInteger(n)&&n>=0;
function hydrate(g){g.log ||={};g.applied ||={};g.recv ||={};for(const u of g.ids)g.recv[u] ||={pend:[],ojNext:0};for(const r of Object.values(g.recv)){r.pend=Array.isArray(r.pend)?r.pend:Object.values(r.pend||{});r.ojNext||=0}return g}
// Replays exactly one received event against the recipient's authority-side engine state.
function replay(g,to,id,e,at){
 const fx=[],eng=engine.createBEngine({code:g.code,gid:g.gid,uid:to,ids:g.ids,bank:{level:()=>1,get:()=>({tiles:[],poly:null})},N:0,diff:g.diff,hc:(g.handi||{})[to]||0,tm:g.tm,view:()=>({live:{},ko:{}}),sound:null,fx:(t,p)=>fx.push([t,p]),onClear:null});
 clock.t=at;const r=g.recv[to];eng.s.pend=r.pend.map(p=>({...p}));eng.s.ojNext=r.ojNext;
 eng.receive({[id]:e});
 r.pend=eng.s.pend.map(p=>({dmg:p.dmg,oj:p.oj,t:p.t,from:p.from}));eng.dispose();
 const cover=fx.find(([t])=>t==='covered'),inc=fx.find(([t])=>t==='incoming');
 if(e.cover!==undefined)return{kind:'cover',phase:'covered',sender:e.from,recipient:to,units:cover?cover[1].units:0};
 if(!inc)throw Error('EVENT_NOT_APPLIED');
 // phase is "received": queued in the recipient's pending list. Landing/cancel/block are NOT claimed.
 return{kind:'receive',phase:'received',sender:e.from,recipient:to,damage:inc[1].dmg,ojama:inc[1].oj};
}
function create({database:db}){
 Store.assertEmulator(db);
 const serverNow=async()=>{const{set,serverTimestamp}=require('firebase/database');const r=ref(db,Store.ROOT+'/clock');await set(r,serverTimestamp());return(await get(r)).val()};
 async function room(code){if(!CODE.test(code))throw Error('BAD_ROOM');const s=(await get(ref(db,`games/factor/rooms/${code}/state`))).val();if(!s||s.phase!=='play'||s.mode!=='C'||!KEY.test(s.gid||'')||!Array.isArray(s.players)||new Set(s.players).size!==4||!s.tm)throw Error('NOT_AN_ACTIVE_C_GAME');return s}
 async function open(code){
  const s=await room(code),r=gameRef(db,code,s.gid);
  await Store.atomic(r,old=>old?.ids?old:{code,gid:s.gid,ids:s.players,tm:s.tm,diff:s.diff||'easy',handi:s.handi||{},startAt:s.startAt,sourceHash,revision:0,log:{},applied:{},recv:Object.fromEntries(s.players.map(u=>[u,{pend:[],ojNext:0}]))});
  return{s,r};
 }
 // Apply one event exactly once. Duplicates return the original revision unchanged.
 async function apply(code,to,id){
  const{r,s}=await open(code);if(!KEY.test(to)||!KEY.test(id))throw Error('BAD_EVENT_ID');
  const raw=(await get(ref(db,`games/factor/rooms/${code}/ev/${s.gid}/${to}/${id}`))).val(),at=await serverNow();
  let duplicate=false;
  const out=await Store.atomic(r,old=>{
   duplicate=false;if(old==null)return old;const g=hydrate(copy(old)),k=to+'_'+id;
   if(g.sourceHash!==sourceHash)throw Error('C_SOURCE_CHANGED');
   if(g.applied[k]){duplicate=true;return old} // idempotent resend: no engine call, no new revision
   if(g.final)throw Error('GAME_ENDED');
   if(!g.ids.includes(to))throw Error('NOT_A_PARTICIPANT');
   const e=raw;
   if(!e||typeof e!=='object'||!g.ids.includes(e.from)||e.from===to)throw Error('INVALID_EVENT_SENDER');
   const isCover=e.cover!==undefined;
   if(isCover?(!nat(e.cover)||g.tm[e.from]!==g.tm[to]):(!nat(e.dmg)||!nat(e.oj)||g.tm[e.from]===g.tm[to]))throw Error('INVALID_EVENT_SHAPE');
   if(!Number.isFinite(e.at)||e.at>at)throw Error('INVALID_EVENT_TIME');
   const proof=replay(g,to,id,e,at),rev=g.revision+1;
   g.revision=rev;g.applied[k]=rev;
   g.log[rev]={gameId:g.gid,revision:rev,at,actor:e.from,kind:proof.kind,proof:{committed:true,eventId:id,gameId:g.gid,...proof,recipient:to}};
   return g;
  });
  return{revision:out.applied[to+'_'+id],duplicate};
 }
 // End barrier: nothing can be applied after this revision.
 async function finish(code,gid,endAt){
  if(!CODE.test(code)||!KEY.test(gid))throw Error('BAD_GAME');const r=gameRef(db,code,gid),at=endAt??await serverNow();
  const out=await Store.atomic(r,old=>{if(old==null)return old;if(!old.ids)throw Error('UNKNOWN_GAME');if(old.final)return old;const g=copy(old);g.final={source:'c-authority-v1',mode:'C',gameId:g.gid,ids:g.ids,teams:g.tm,revision:g.revision||0,endAt:at};return g});
  return out.final;
 }
 return{apply,finish,open};
}
module.exports={create,sourceHash,replay};
