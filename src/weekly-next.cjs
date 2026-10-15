'use strict';
const {tx}=require('./online-spark-client.cjs');
const queues=new WeakMap();
async function serial(db,path,fn){let q=queues.get(db);if(!q){q=new Map();queues.set(db,q)}const task=(q.get(path)||Promise.resolve()).catch(()=>{}).then(fn);q.set(path,task);try{return await task}finally{if(q.get(path)===task)q.delete(path)}}
const ROOT='games/factor/weeklyNextV1',DAY=86400000,SHIFT=32400000;
const day=at=>Math.floor((at+SHIFT)/DAY);
function monday(s){const t=Date.parse(s+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(s||'')&&Number.isFinite(t)&&new Date(t).getUTCDay()===1&&new Date(t).toISOString().slice(0,10)===s;}
function baseHP(week,meta,approval){
 // Existing weekly instances are frozen, including legacy metadata without hpBase.
 if(meta)return meta.policyVersion===1&&meta.hpBase===90000?90000:30000;
 return approval?.status==='approved'&&monday(approval.firstWeek)&&monday(week)&&week>=approval.firstWeek?90000:30000;
}
function create({db,uid,account}){
 if(!db||!uid||!account?.key)throw Error('REGISTERED_ACCOUNT_REQUIRED');
 const clock=async()=>{const r=db.ref(`${ROOT}/clock/${uid}`);await r.set({'.sv':'timestamp'});const n=(await r.get()).val();if(typeof n!=='number')throw Error('SERVER_CLOCK_UNAVAILABLE');return n};
 async function reserve(id,role='atk'){
  if(!/^[A-Za-z0-9_-]{1,64}$/.test(id)||!['atk','sup'].includes(role))throw Error('INVALID_RESERVATION');
  const at=await clock(),d=day(at),r=db.ref(`${ROOT}/attempts/${account.key}/${d}`);
  const out=await serial(db,account.key+'/'+d,()=>tx(r,cur=>{const n=cur||{slots:{}};n.slots ||= {};
   if(Object.values(n.slots).some(s=>s.id===id))return n;
   const slot=[0,1,2,3,4].find(i=>!n.slots[i]);if(slot===undefined)throw Error('WEEKLY_DAILY_LIMIT');
   n.slots[slot]={id,uid,role,at:{'.sv':'timestamp'}};return n;
  }));
  const slots=(await r.get()).val().slots,[slot,s]=Object.entries(slots).find(([,s])=>s.id===id);return {...s,day:d,slot};
 }
 async function resume(r){const s=(await db.ref(`${ROOT}/attempts/${account.key}/${r.day}/slots/${r.slot}`).get()).val();if(s?.id!==r.id)throw Error('RESERVATION_NOT_FOUND');return {...s,day:r.day,slot:r.slot};}
 async function finish(r,{completed=false}={}){
  if(!completed)throw Error('RUN_NOT_COMPLETED');const saved=await resume(r),ref=db.ref(`${ROOT}/attempts/${account.key}/${saved.day}/slots/${saved.slot}/finish`);
  await tx(ref,old=>old||{id:saved.id,at:{'.sv':'timestamp'},completed:true});return (await ref.get()).val();
 }
 return {reserve,resume,finish};
}
module.exports={ROOT,DAY,SHIFT,day,monday,baseHP,create};
