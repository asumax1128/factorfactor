'use strict';
const Store=require('./emulator-store.cjs'),Weekly=require('./weekly.cjs'),{get,ref}=require('firebase/database');
async function start({database,interval=250,onError=console.error}){
 Store.assertEmulator(database);const worker=Store.create({database}),weeks=new Set(),now=await worker.clock(),current=Weekly.api({rng:1},now).weekKey(now);
 // Resume existing independent authority weeks. Never import a client checkpoint.
 const existing=(await get(ref(database,Store.ROOT+'/weekly'))).val()||{};for(const [week,v]of Object.entries(existing))if(v.state&&!v.state.closed)weeks.add(week);
 async function ensureCurrent(week,at){
  if(weeks.has(week))return;
  const a=Weekly.api({rng:1},at),previous=new Date(Date.parse(week+'T00:00:00+09:00')-7*86400000+9*3600000).toISOString().slice(0,10),prior=(await get(ref(database,Store.ROOT+'/weekly/'+previous+'/state'))).val();
  let boss=a.weeklyBoss(week).id,rage=0;
  if(prior){const info=Weekly.info(prior,Weekly.api(prior,at));if(info.rows.length&&!info.dead){boss=info.boss.id;rage=Math.min(2,(prior.meta.rage||0)+1)}else if(boss===info.boss.id)boss=a.BOSSES[(a.BOSSES.findIndex(b=>b.id===boss)+1)%a.BOSSES.length].id;}
  await worker.ensure(week,{boss,rage,rule:a.WK_RULES[a.hashSeed('rule:'+week)%a.WK_RULES.length].id});weeks.add(week);
 }
 await ensureCurrent(current,now);
 let stopped=false,timer,inflight=Promise.resolve(),lastTitlesAt=0;
 async function tick(){if(stopped)return;try{const at=await worker.clock();await ensureCurrent(Weekly.api({rng:1},at).weekKey(at),at);for(const week of weeks)await worker.process(week);if(at-lastTitlesAt>=5000){lastTitlesAt=at;const snapshots=(await get(ref(database,'games/factor/titleNextV1/snapshots'))).val()||{};for(const account of Object.keys(snapshots))await require('./titles.cjs').reconcile({database,account})}}catch(e){onError(e)}finally{if(!stopped)timer=setTimeout(()=>{inflight=tick()},interval)}}
 inflight=tick();return{stop:async()=>{stopped=true;clearTimeout(timer);await inflight},worker};
}
module.exports={start};
if(require.main===module){
 if(process.env.GCLOUD_PROJECT!=='demo-factorfactor-tower'||process.env.FIREBASE_DATABASE_EMULATOR_HOST!=='127.0.0.1:9000')throw Error('DEMO_LOOPBACK_REQUIRED');
 const{initializeTestEnvironment}=require('@firebase/rules-unit-testing');
 (async()=>{const env=await initializeTestEnvironment({projectId:'demo-factorfactor-tower',database:{host:'127.0.0.1',port:9000}});await env.withSecurityRulesDisabled(async c=>{const running=await start({database:c.database()});console.log('Weekly authority ready (Emulator only)');await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve)});await running.stop()});await env.cleanup()})().catch(e=>{console.error(e);process.exitCode=1});
}
