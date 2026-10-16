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
const same=(x,y)=>JSON.stringify(x??null)===JSON.stringify(y??null);
// Compare the administrator-pinned game definition with the host-writable room state. The room
// state is only trusted for identity at pin time; later divergence of the SAME game is drift.
function drift(pin,state){
 if(!state)return['STATE_MISSING'];
 if(state.gid!==pin.gid)return[];// room moved on (next game / lobby): legitimate, nothing to compare
 const out=[];
 if(!same(state.players,pin.ids))out.push('PLAYERS_CHANGED');
 if(!same(state.tm,pin.tm))out.push('TEAMS_CHANGED');
 if(!same(state.handi||{},pin.handi||{}))out.push('HANDICAP_CHANGED');
 if((state.diff||'easy')!==pin.diff)out.push('DIFFICULTY_CHANGED');
 if(state.startAt!==pin.startAt)out.push('START_CHANGED');
 if(state.mode!=='C')out.push('MODE_CHANGED');
 return out;
}
const digestOf=v=>crypto.createHash('sha256').update(JSON.stringify(v.ordered.map(e=>[e.uid,e.n,e.k,e.q??null,e.a??null,e.s??null,e.ct,e.sat]))).digest('hex');
function create({database:db}){
 Store.assertEmulator(db);
 const gameRef=(code,gid)=>ref(db,`${Store.ROOT}/c/${code}_${gid}`);
 async function read(code,gid){
  if(!CODE.test(code)||!KEY.test(gid))throw Error('BAD_GAME');
  const g=(await get(gameRef(code,gid))).val();
  // Players come ONLY from the administrator pin (c-writer.open). Never from the host-writable state.
  if(!g?.ids)throw Error('NOT_PINNED');
  const state=(await get(ref(db,`games/factor/rooms/${code}/state`))).val();
  const v=verify({ids:g.ids,log:(await get(logRef(db,code,gid))).val(),endAt:g.final?.endAt});
  v.drift=drift(g,state);v.pinned={ids:g.ids,gid:g.gid};
  if(v.drift.length)v.consistent=false;
  return v;
 }
 // Seal after finish. Rules forbid appends once `final` exists, but the seal does not rely on that:
 // it reads the log twice around the commit, binds to the exact final it read, and a digest mismatch
 // aborts. First seal wins; any later seal must reproduce the same digest.
 async function seal(code,gid,hooks={}){
  const g=(await get(gameRef(code,gid))).val();
  if(!g?.final)throw Error('NOT_FINISHED');
  const first=await read(code,gid);
  if(first.drift.length)throw Error('STATE_DRIFT:'+first.drift.join(','));
  if(!first.consistent)throw Error('INPUT_LOG_INCONSISTENT');
  const digest=digestOf(first);
  if(hooks.betweenReads)await hooks.betweenReads();
  const second=await read(code,gid);
  if(!second.consistent||digestOf(second)!==digest)throw Error('LOG_CHANGED_DURING_SEAL');
  if(hooks.beforeCommit)await hooks.beforeCommit();
  const counts=Object.fromEntries(Object.entries(first.players).map(([u,p])=>[u,p.entries.filter(e=>e.sat<=g.final.endAt).length]));
  let mismatch=null;
  const out=await Store.atomic(gameRef(code,gid),old=>{
   mismatch=null;if(old==null)return old;
   if(!same(old.final,g.final)||!same(old.ids,g.ids))throw Error('FINAL_OR_PIN_CHANGED');
   if(old.inputs){if(old.inputs.digest!==digest)mismatch=true;return old}
   return{...old,inputs:{digest,counts,excludedAfterEnd:first.afterEnd,endAt:g.final.endAt,total:Object.values(first.players).reduce((n,p)=>n+p.count,0)}};
  });
  if(mismatch)throw Error('SEAL_MISMATCH');
  return out.inputs;
 }
 // Recompute and compare with the stored seal (detects any later change by a privileged writer).
 async function verifySeal(code,gid){
  const g=(await get(gameRef(code,gid))).val();if(!g?.inputs)return{ok:false,reason:'NOT_SEALED'};
  const v=await read(code,gid);
  return{ok:v.consistent&&digestOf(v)===g.inputs.digest,reason:v.consistent?(digestOf(v)===g.inputs.digest?null:'DIGEST_MISMATCH'):'INCONSISTENT',drift:v.drift};
 }
 return{read,seal,verifySeal};
}
module.exports={create,verify,drift,digestOf};
