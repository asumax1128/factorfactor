'use strict';
// Node-only trusted worker. No deployed Functions or browser admin capability.
const {ref,get,set,serverTimestamp,runTransaction}=require('firebase/database'),Weekly=require('./weekly.cjs');
const ROOT='games/factor/nextAuthorityV1';
function assertEmulator(db){const url=new URL(ref(db).toString()),host=process.env.FIREBASE_DATABASE_EMULATOR_HOST;if(db.app.options.projectId!=='demo-factorfactor-tower'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||!/^127\.0\.0\.1:\d+$/.test(host||''))throw Error('EMULATOR_AUTHORITY_ONLY');}
async function atomic(target,fn){await get(target);let failure;const out=await runTransaction(target,current=>{try{failure=null;return fn(current)}catch(e){failure=e;return undefined}},{applyLocally:false});if(failure)throw failure;if(!out.committed)throw Error('AUTHORITY_COMMIT_ABORTED');return out.snapshot.val();}
function create({database:db}){
 assertEmulator(db);const weekRef=week=>ref(db,`${ROOT}/weekly/${week}`);
 const clock=async()=>{const r=ref(db,ROOT+'/clock');await set(r,serverTimestamp());return (await get(r)).val()};
 function publish(root){const w=root.state;root.public={enabled:true,revision:w.revision,week:w.week,meta:w.meta,revived:Weekly.info(w,Weekly.api(w,w.time)).revived,hp:Math.max(0,Weekly.info(w,Weekly.api(w,w.time)).hp),hpMax:w.hpMax,kill:w.kill||null,closed:w.closed};root.views ||= {};for(const acct of new Set([...Object.values(w.runs||{}).map(r=>r.account),...Object.keys(w.accounts||{})]))root.views[acct]=Weekly.view(w,acct);return root;}
 async function ensure(week,meta,baselines={}){const at=await clock();return atomic(weekRef(week),old=>{if(old?.state){if(JSON.stringify(old.state.meta)!==JSON.stringify(meta))throw Error('WEEK_POLICY_CONFLICT');return old}const w=Weekly.create({week,meta,seed:Weekly.api({rng:1},at).hashSeed(week),at});w.accounts=JSON.parse(JSON.stringify(baselines));return publish({state:w})})}
 async function process(week){const now=await clock();return atomic(weekRef(week),root=>{
  if(root===null)return null;if(!root.state)throw Error('WEEK_NOT_INITIALIZED');root.processed ||= {};let w=root.state;
  const pending=Object.entries(root.requests||{}).flatMap(([account,rs])=>Object.entries(rs).map(([id,r])=>({account,id,...r}))).filter(c=>!root.processed[c.account]?.[c.id]).sort((a,b)=>a.at-b.at||a.account.localeCompare(b.account)||a.id.localeCompare(b.id));
  for(const c of pending){if(Number.isSafeInteger(c.at)&&c.at>now)continue;root.processed[c.account]||={};try{if(!Number.isSafeInteger(c.at)||!c.uid)throw Error('INVALID_REQUEST_CLOCK');const next=Weekly.execute(w,{...c,payload:JSON.parse(c.payload)});w=next;root.processed[c.account][c.id]={ok:true,revision:w.revision,runId:w.receipts[c.account][c.id].runId,at:now};}catch(e){root.processed[c.account][c.id]={ok:false,error:e.message,at:now}}}
  Weekly.advance(w,Math.max(w.time,now));root.state=w;return publish(root);
 })}
 return{ensure,process,clock};
}
module.exports={ROOT,assertEmulator,create,atomic};
