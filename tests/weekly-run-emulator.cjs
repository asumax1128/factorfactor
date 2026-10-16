const assert=require('node:assert/strict'),fs=require('node:fs'),firebase=require('firebase/compat/app');require('firebase/compat/auth');require('firebase/compat/database');
const {initializeTestEnvironment,assertFails}=require('@firebase/rules-unit-testing'),{set,ref,get}=require('firebase/database'),W=require('../src/weekly-next.cjs'),Run=require('../src/weekly-run-next.cjs');
(async()=>{assert.equal(process.env.GCLOUD_PROJECT,'demo-factorfactor-tower');const rules=JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));rules.rules.games.factor.weeklyNextV1=JSON.parse(fs.readFileSync('firebase/next-weekly.fragment.rules.json'));const env=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}}),apps=[];
try{
 for(let i=0;i<3;i++){const app=firebase.initializeApp({projectId:process.env.GCLOUD_PROJECT,apiKey:'fixture',databaseURL:'https://demo-factorfactor-tower.firebaseio.com'},'run-'+i);app.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});app.database().useEmulator('127.0.0.1',9000);const{user}=await app.auth().signInAnonymously();apps.push({app,db:app.database(),uid:user.uid})}
 const[a,b,v]=apps;await env.withSecurityRulesDisabled(c=>set(ref(c.database(),'games/factor/logins'),{ar:{[a.uid]:'x',[b.uid]:'x'},vr:{[v.uid]:'x'}}));
 assert(Run.enabled(a.db,{hostname:'localhost'}));assert(!Run.enabled(a.db,{hostname:'asumax1128.github.io'}));assert(!Run.enabled({ref:()=>({toString:()=> 'https://asumath-games-default-rtdb.firebaseio.com'}),app:{options:{projectId:'asumath-games'}}},{hostname:'localhost'}));
 const initial={exp:100,rating:1688,B:{w:5},nick:'tour1'},opts={account:{key:'ar'},initialStats:initial,validateBoard:x=>x?.valid===true},ca=Run.create({...a,...opts}),cb=Run.create({...b,...opts});
 await assert.rejects(()=>ca.start({id:'bad',week:'2026-10-12',duration:60000,role:'atk',board:{valid:false}}),/INVALID_INITIAL/);
 assert.equal((await a.db.ref(W.ROOT+'/attempts/ar').get()).val(),null);
 let r=await ca.start({id:'first',week:'2026-10-12',duration:60000,role:'atk',board:{valid:true}});
 const pointer={id:r.id,reservation:r.reservation};assert.equal((await cb.resume(pointer)).id,r.id);
 await ca.checkpoint(r.id,1,{d:50,sp:2,chests:0,shards:0,chestExp:0,absExt:0});
 await Promise.all([ca.checkpoint(r.id,1,{d:50,sp:2,chests:0,shards:0,chestExp:0,absExt:0}),cb.checkpoint(r.id,1,{d:50,sp:2,chests:0,shards:0,chestExp:0,absExt:0})]);
 await assert.rejects(()=>cb.checkpoint(r.id,1,{d:80}),/CONFLICTING/);await assert.rejects(()=>ca.finish(r.id,()=>{}),/RUN_NOT_COMPLETED/);
 // Time travel only the isolated fixture's start time, never production or client clock.
 await env.withSecurityRulesDisabled(c=>set(ref(c.database(),`${W.ROOT}/games/ar/runs/first/startAt`),Date.now()-61000));
 const award=(s,S)=>{const before=s.exp;s.exp+=2*(10+Math.min(30,Math.floor(S.d/15)))+S.chestExp;return{before,after:s.exp,first:true}};
 await assert.rejects(()=>ca.finish(r.id,()=>{throw Error('INTERRUPTED_AWARD')}),/INTERRUPTED_AWARD/);assert.equal((await cb.resume(pointer)).status,'settling');
 const finished=await Promise.all([ca.finish(r.id,award),cb.finish(r.id,award)]);assert.deepEqual(finished[0].reward,{before:100,after:126,first:true});assert.deepEqual(finished[0],finished[1]);
 assert.deepEqual((await cb.resume(pointer)).receipt,finished[0].receipt);await ca.finish(r.id,()=>{throw Error('must not reaward')});
 const data=(await a.db.ref(W.ROOT+'/games/ar').get()).val();assert.equal(data.stats.exp,126);assert.equal(data.stats.rating,1688);assert.equal(data.stats.nick,'tour1');assert.equal(data.stats.B.w,5);assert.deepEqual(Run.damage(data,'2026-10-12'),{d:50,p:2,s:1,b:50});
 const abandoned=await ca.start({id:'quit',week:'2026-10-12',duration:60000,role:'atk',board:{valid:true}});await ca.abandon(abandoned.id);await assert.rejects(()=>ca.finish(abandoned.id,award),/NOT_COMPLETABLE/);assert.equal((await a.db.ref(W.ROOT+'/games/ar/stats/exp').get()).val(),126);
 await env.withSecurityRulesDisabled(c=>set(ref(c.database(),'games/factor/logins/ar_recovery'),{[a.uid]:'x'}));const recoveredClient=Run.create({...a,...opts,account:{key:'ar_recovery'}});let orphan;
 await assert.rejects(()=>recoveredClient.start({id:'orphan',week:'2026-10-12',duration:60000,role:'atk',board:{valid:true},onReserved:reservation=>{orphan={id:reservation.id,reservation};throw Error('INTERRUPTED_AFTER_RESERVATION')}}),/INTERRUPTED_AFTER_RESERVATION/);
 assert.equal((await a.db.ref(W.ROOT+'/games/ar_recovery/runs/orphan').get()).val(),null);const recovered=await recoveredClient.resume(orphan,{board:{valid:true}});assert.equal(recovered.startAt,orphan.reservation.at+600);assert.equal(recovered.duration,60000);assert.equal((await a.db.ref(`${W.ROOT}/attempts/ar_recovery/${orphan.reservation.day}/slots`).get()).numChildren(),1);await assertFails(a.db.ref(`${W.ROOT}/attempts/ar_recovery/${orphan.reservation.day}/slots/${orphan.reservation.slot}/duration`).set(90000));
 const rest=await Promise.allSettled(Array.from({length:5},(_,i)=>(i%2?cb:ca).start({id:'remaining'+i,week:'2026-10-12',duration:60000,role:'atk',board:{valid:true}})));assert.equal(rest.filter(x=>x.status==='fulfilled').length,3);
 await assertFails(v.db.ref(W.ROOT+'/games/ar').get());await assertFails(v.db.ref(W.ROOT+'/games/ar/stats').set({exp:999}));
 await env.withSecurityRulesDisabled(async c=>{for(const p of ['accounts','raidw','onlineSparkV1'])assert.equal((await get(ref(c.database(),'games/factor/'+p))).val(),null)});
 console.log('PASS weekly real SDK: validation before reserve, cross-device resume, immutable event IDs, early finish denied, final receipt + reward once, quit without reward, five starts, owner authorization; crash after reserve and after finish recover without another slot/reward');
}finally{await Promise.all(apps.map(a=>a.app.delete()));await env.cleanup()}})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>setTimeout(()=>process.exit(process.exitCode||0),100));
