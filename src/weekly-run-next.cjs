'use strict';
// Development-only integration. No access to legacy account/weekly write paths.
const W=require('./weekly-next.cjs'),{tx}=require('./online-spark-client.cjs');
const clone=x=>JSON.parse(JSON.stringify(x)),queues=new WeakMap();
function canonical(x){const norm=v=>{if(v&&typeof v==='object'){const entries=Object.entries(v).map(([k,x])=>[k,norm(x)]).filter(([,x])=>x!==null).sort(([a],[b])=>a.localeCompare(b));return entries.length?Object.fromEntries(entries):null}return v==null?null:v};return JSON.stringify(norm(x))}
function enabled(db,location){try{const u=new URL(db.ref().toString());return ['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&['localhost','127.0.0.1','[::1]'].includes(u.hostname)&&db.app.options.projectId==='demo-factorfactor-tower';}catch{return false}}
function create({db,uid,account,validateBoard,initialStats={}}){
 const api=W.create({db,uid,account}),root=`${W.ROOT}/games/${account.key}`,ref=db.ref(root);
 function serial(fn){const last=queues.get(db)||Promise.resolve(),next=last.catch(()=>{}).then(fn);queues.set(db,next);return next;}
 const read=async id=>(await db.ref(root+'/runs/'+id).get()).val();
 async function initialize(reservation){
  const {id,week,role,duration}=reservation;
  if(!W.monday(week)||![60000,90000].includes(duration))throw Error('RESERVATION_PLAN_MISSING');
  await serial(()=>tx(ref,data=>{const n=data||{stats:clone(typeof initialStats==='function'?initialStats():initialStats),runs:{}};n.runs ||= {};if(!n.runs[id])n.runs[id]={id,week,role,reservation,startAt:reservation.at+600,duration,status:'play',seq:0,session:{d:0,sp:0,chests:0,shards:0,chestExp:0,absExt:0}};return n}));return read(id);
 }
 async function start({id,week,role,duration,board,onReserved}){
  if(!W.monday(week)||![60000,90000].includes(duration)||!validateBoard(board))throw Error('INVALID_INITIAL_STATE');
  const old=await read(id);if(old)return resume({id,reservation:old.reservation});
  const reservation=await api.reserve(id,role,{week,duration});
  onReserved?.(reservation);return initialize(reservation);
 }
 async function resume(pointer,{board}={}){const reservation=await api.resume(pointer.reservation);const r=await read(pointer.id);if(!r){if(!validateBoard(board))throw Error('INITIAL_BOARD_REQUIRED_FOR_RECOVERY');return initialize(reservation);}if(r.reservation.id!==pointer.reservation.id)throw Error('RUN_NOT_FOUND');return r;}
 async function checkpoint(id,seq,session){
  const payload=clone(session);if(payload.combat)shiftCombat(payload.combat,0);if(!Number.isInteger(seq)||seq<1||!Number.isFinite(payload.d)||payload.d<0||!Number.isFinite(payload.absExt||0)||(payload.absExt||0)>15000)throw Error('INVALID_CHECKPOINT');
  await serial(()=>tx(ref,data=>{const r=data?.runs?.[id];if(!r)throw Error('RUN_NOT_FOUND');
   if(seq<=r.seq){if(seq<r.seq||canonical(r.session)!==canonical(payload))throw Error('CONFLICTING_CHECKPOINT');return data;}
   if(r.status!=='play'||seq!==r.seq+1)throw Error('RUN_NOT_WRITABLE');
   if(payload.d<r.session.d)throw Error('NON_MONOTONIC_DAMAGE');r.seq=seq;r.session=payload;return data;}));return read(id);
 }
 async function abandon(id){await serial(()=>tx(ref,data=>{const r=data?.runs?.[id];if(!r)throw Error('RUN_NOT_FOUND');if(r.status==='play')r.status='abandoned';return data}));return read(id);}
 async function finish(id,award){
  let r=await read(id);if(!r||r.status==='abandoned')throw Error('RUN_NOT_COMPLETABLE');
  // Server clock, not the device's wall clock, decides completion eligibility.
  const cr=db.ref(`${W.ROOT}/clock/${uid}`);await cr.set({'.sv':'timestamp'});const now=(await cr.get()).val();
  if(now<r.startAt+r.duration+(r.session.absExt||0))throw Error('RUN_NOT_COMPLETED');
  await serial(()=>tx(ref,data=>{const cur=data?.runs?.[id];if(!cur||cur.status==='abandoned')throw Error('RUN_NOT_COMPLETABLE');if(now<cur.startAt+cur.duration+(cur.session.absExt||0))throw Error('RUN_NOT_COMPLETED');if(cur.status==='play')cur.status='settling';return data;}));
  const receipt=await api.finish(r.reservation,{completed:true});
  await serial(()=>tx(ref,data=>{const cur=data?.runs?.[id];if(!cur||cur.status==='abandoned')throw Error('RUN_NOT_COMPLETABLE');if(cur.receipt)return data;
   // Damage is stored as a single cumulative checkpoint; it is never incremented
   // again on retry. Reward state and the receipt commit in this same transaction.
   const s=data.stats ||= clone(typeof initialStats==='function'?initialStats():initialStats),out=award(s,clone(cur.session),cur);cur.reward=out;cur.receipt=receipt;cur.status='done';return data;}));return read(id);
 }
 function subscribe(callback){const listener=s=>callback(s.val());ref.on('value',listener);return()=>ref.off('value',listener);}
 return{start,resume,checkpoint,abandon,finish,subscribe,read,claimWeek:week=>serial(()=>require('./weekly-rewards-next.cjs').claim({db,uid,account:account.key,week}))};
}
function damage(data,week){return Object.values(data?.runs||{}).filter(r=>r.week===week).reduce((n,r)=>{n.d+=r.session?.d||0;n.p+=r.session?.sp||0;if(r.receipt){n.s++;n.b=Math.max(n.b,r.session?.d||0)}return n},{d:0,p:0,s:0,b:0})}
// Persist absolute server timestamps; convert only at the local presentation edge.
function shiftCombat(input,offset){
 const c=clone(input);
 if(c.prob){for(const key of ['tiles','factors','factors2'])if(c.prob[key]&&!Array.isArray(c.prob[key]))c.prob[key]=Object.values(c.prob[key]);}
 if(c.version!==1||!c.s||!c.prob||!Array.isArray(c.prob.tiles)||c.prob.tiles.length<2||!Number.isFinite(c.s.qs))throw Error('INVALID_COMBAT_CHECKPOINT');
 c.seen=Array.isArray(c.seen)?c.seen:Object.values(c.seen||{});c.flash ||= {};c.judge ||= null;c.pending ||= null;c.s.dp ||= {a:0,b:0,c:0};
 c.s.qs+=offset;if(c.s.stunUntil)c.s.stunUntil+=offset;if(c.pending)c.pending.at+=offset;
 return c;
}
module.exports={enabled,create,damage,packCombat:shiftCombat,unpackCombat:shiftCombat};
