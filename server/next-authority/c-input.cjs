'use strict';
// Emulator-only reader/sealer for the C operation log (stage a). The log proves WHO wrote
// WHAT in WHICH per-player order and the server arrival time (`sat`). It does not prove
// that an answer was correct or that any damage amount was right.
const {ref,get}=require('firebase/database'),Store=require('./emulator-store.cjs'),crypto=require('node:crypto');
const KEY=/^[A-Za-z0-9_-]{1,40}$/,CODE=/^[0-9]{4}$/,SKEW=3000;
const logRef=(db,code,gid,uid)=>ref(db,`${Store.ROOT}/cInput/${code}/${gid}${uid?'/'+uid:''}`);
const arr=o=>Object.entries(o||{});
// Returns entries per player (contiguous 0..n only) and an explicit anomaly list. Anything not
// provably well-formed makes `consistent:false`; nothing is repaired or guessed.
function verify({ids,log,endAt}){
 const anomalies=[],players={},ordered=[];
 for(const uid of Object.keys(log||{}))if(!ids.includes(uid))anomalies.push({uid,problem:'NON_PARTICIPANT_LOG'});
 for(const uid of ids){
  const raw=log?.[uid]||{},seqs=Object.keys(raw).sort((x,y)=>x-y),mine=[];let prev=null;
  for(const [i,s] of seqs.entries()){
   const e=raw[s];
   if(Number(s)!==i||e.n!==i){anomalies.push({uid,seq:s,problem:'GAP_OR_MISNUMBERED'});break}
   if(!Number.isFinite(e.sat)||!Number.isFinite(e.ct)||e.ct>e.sat+SKEW||(prev&&e.sat<prev.sat)){anomalies.push({uid,seq:s,problem:'TIME_ORDER'});break}
   mine.push({uid,...e});prev=e;
  }
  players[uid]={count:mine.length,entries:mine};ordered.push(...mine);
 }
 // Cross-player order is by SERVER arrival time, ties by uid then per-player seq. Arrival
 // order is not action order: a delayed/queued write can arrive after a later action.
 ordered.sort((a,b)=>a.sat-b.sat||a.uid.localeCompare(b.uid)||a.n-b.n);
 const inside=endAt==null?ordered:ordered.filter(e=>e.sat<=endAt);
 return{consistent:anomalies.length===0,anomalies,players,ordered:inside,afterEnd:ordered.length-inside.length};
}
function create({database:db}){
 Store.assertEmulator(db);
 async function read(code,gid){
  if(!CODE.test(code)||!KEY.test(gid))throw Error('BAD_GAME');
  const g=(await get(ref(db,`${Store.ROOT}/c/${code}_${gid}`))).val(),ids=g?.ids||(await get(ref(db,`games/factor/rooms/${code}/state/players`))).val();
  if(!Array.isArray(ids))throw Error('UNKNOWN_GAME');
  return verify({ids,log:(await get(logRef(db,code,gid))).val(),endAt:g?.final?.endAt});
 }
 // Seal after finish: stores a digest of exactly what the verified log contained at the end barrier.
 async function seal(code,gid){
  const r=ref(db,`${Store.ROOT}/c/${code}_${gid}`),g=(await get(r)).val();
  if(!g?.final)throw Error('NOT_FINISHED');
  const v=await read(code,gid);
  if(!v.consistent)throw Error('INPUT_LOG_INCONSISTENT');
  const digest=crypto.createHash('sha256').update(JSON.stringify(v.ordered)).digest('hex');
  const out=await Store.atomic(r,old=>{if(old==null)return old;if(old.inputs)return old;return{...old,inputs:{digest,counts:Object.fromEntries(Object.entries(v.players).map(([u,p])=>[u,p.entries.filter(e=>e.sat<=old.final.endAt).length])),excludedAfterEnd:v.afterEnd,endAt:old.final.endAt}}});
  return out.inputs;
 }
 return{read,seal};
}
module.exports={create,verify};
