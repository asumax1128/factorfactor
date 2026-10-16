const fs=require('node:fs'),a=require('node:assert/strict'),firebase=require('firebase/compat/app');require('firebase/compat/auth');require('firebase/compat/database');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing'),{set,ref,get}=require('firebase/database'),Store=require('../server/next-authority/emulator-store.cjs'),CW=require('../server/next-authority/c-writer.cjs'),CI=require('../server/next-authority/c-input.cjs');
const TS=firebase.database.ServerValue.TIMESTAMP,rej=async(fn,m)=>{try{await fn()}catch(e){if(String(e.message).includes(m))return;throw Error('wrong rejection '+e.message+' expected '+m)}throw Error('expected rejection '+m)};
(async()=>{a.equal(process.env.GCLOUD_PROJECT,'demo-factorfactor-tower');
 const rules=JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));rules.rules.games.factor.nextAuthorityV1=JSON.parse(fs.readFileSync('firebase/next-authority.fragment.rules.json'));
 const env=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}}),apps=[];
 try{
  for(let i=0;i<5;i++){const app=firebase.initializeApp({projectId:process.env.GCLOUD_PROJECT,apiKey:'fixture',databaseURL:'https://demo-factorfactor-tower.firebaseio.com'},'h-'+i);app.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});app.database().useEmulator('127.0.0.1',9000);const {user}=await app.auth().signInAnonymously();apps.push({app,db:app.database(),uid:user.uid})}
  const [A,B,Cc,D,out]=apps,ids=[A,B,Cc,D].map(x=>x.uid),tm={[A.uid]:0,[B.uid]:0,[Cc.uid]:1,[D.uid]:1},R=c=>'games/factor/rooms/'+c,root='games/factor/nextAuthorityV1/cInput/';
  const clean=o=>JSON.parse(JSON.stringify(o)),entry=(n,over={})=>({n,k:'answer',q:n,a:['f1','f2'],ct:Date.now(),sat:TS,...over});
  const put=(code,gid,u,n,v)=>u.db.ref(root+code+'/'+gid+'/'+u.uid+'/'+n).set(clean(v||entry(n)));
  const mk=(c,g,extra={})=>({meta:{host:A.uid},players:Object.fromEntries([...ids,out.uid].map(u=>[u,{n:1}])),state:{phase:'play',mode:'C',diff:'easy',gid:g,startAt:Date.now()-1000,players:ids,tm,handi:{},...extra}});
  const seed=async(c,g)=>env.withSecurityRulesDisabled(async x=>{await set(ref(x.database(),R(c)),mk(c,g));if(!process.env.NO_PIN)await CW.create({database:x.database()}).open(c)});
  // ============ 1. sat is a server timestamp, never a client value
  await seed('1000','s1');
  for(const bad of [Date.now()-1000,Date.now()+1000,Date.now()-3600000,Date.now()+3600000,0,1.5,'now',null])await assertFails(put('1000','s1',A,0,entry(0,{sat:bad})));
  const noSat=entry(0);delete noSat.sat;await assertFails(put('1000','s1',A,0,noSat));
  const realNow=Date.now,skew=3600000;Date.now=()=>realNow()+skew;// a client whose clock is one hour fast
  const t0=realNow();try{await assertSucceeds(put('1000','s1',A,0,entry(0,{ct:realNow()})))}finally{Date.now=realNow}
  const t1=realNow(),e0=(await A.db.ref(root+'1000/s1/'+A.uid+'/0').get()).val();
  a(e0.sat>=t0-2000&&e0.sat<=t1+2000,'stored sat is the server time ('+e0.sat+' not in '+t0+'..'+t1+')');a(e0.sat<t0+skew/2,'client clock skew did not leak into sat');
  // a delayed legitimate write keeps its (older) claimed ct but gets the arrival sat
  await assertSucceeds(put('1000','s1',A,1,entry(1,{ct:realNow()-90000})));const e1=(await A.db.ref(root+'1000/s1/'+A.uid+'/1').get()).val();a(e1.sat-e1.ct>=89000);a(e1.sat>=e0.sat);
  // ============ 2. seal under concurrent / interleaved activity
  const code='2000',gid='s2',key=code+'_'+gid,sealBox={};
  await seed(code,gid);
  await env.withSecurityRulesDisabled(async c=>{
   const db=c.database(),w=CW.create({database:db}),r=CI.create({database:db});await w.open(code);
   for(const u of [A,B,Cc,D])await put(code,gid,u,0);await put(code,gid,A,1);
   await rej(()=>r.seal(code,gid),'NOT_FINISHED');
   const inside=async(u,n)=>{const e0=(await get(ref(db,root+code+'/'+gid+'/'+u.uid+'/0'))).val();return set(ref(db,root+code+'/'+gid+'/'+u.uid+'/'+n),{n,k:'answer',q:n,a:['x','y'],ct:e0.sat,sat:e0.sat})};// same sat as the first entry => inside the barrier
   // 2a: a write that races finish() is either in the log before the barrier, or rejected; never half
   const results=await Promise.allSettled([put(code,gid,B,1),w.finish(code,gid)]);a.equal(results[1].status,'fulfilled');
   // 2b: appends after final are rejected by the rules
   await assertFails(put(code,gid,Cc,1));await assertFails(put(code,gid,D,1));
   // 2c: interleaved change between the two reads (privileged writer) aborts and stores nothing
   await rej(()=>r.seal(code,gid,{betweenReads:()=>inside(Cc,1)}),'LOG_CHANGED_DURING_SEAL');
   a.equal((await get(ref(db,Store.ROOT+'/c/'+key+'/inputs'))).val(),null,'nothing stored by an aborted seal');
   await set(ref(db,root+code+'/'+gid+'/'+Cc.uid+'/1'),null);
   // 2d: change after the second read, before commit, is caught by the post-seal verification
   const sealed=await r.seal(code,gid,{beforeCommit:()=>inside(D,1)});
   a.equal((await r.verifySeal(code,gid)).ok,false,'seal no longer matches the log');a.equal((await r.verifySeal(code,gid)).reason,'DIGEST_MISMATCH');
   await set(ref(db,root+code+'/'+gid+'/'+D.uid+'/1'),null);a.equal((await r.verifySeal(code,gid)).ok,true);
   // 2e: concurrent seals converge on one record; a differing digest can never replace it
   const both=await Promise.all([r.seal(code,gid),r.seal(code,gid)]);a.deepEqual(both[0],both[1]);a.deepEqual(both[0],sealed);
   await inside(D,1);
   await rej(()=>r.seal(code,gid),'SEAL_MISMATCH');
   await set(ref(db,root+code+'/'+gid+'/'+D.uid+'/1'),null);a.equal((await r.verifySeal(code,gid)).ok,true);
   await inside(A,2);await rej(()=>r.seal(code,gid),'INPUT_LOG_INCONSISTENT');await set(ref(db,root+code+'/'+gid+'/'+A.uid+'/2'),null);
  });
  // ============ 3. the host rewrites game state: pinned definition wins
  const c3='3000',g3='s3';await seed(c3,g3);
  await env.withSecurityRulesDisabled(async c=>{const db3=c.database(),w3=CW.create({database:db3}),r3=CI.create({database:db3});await w3.open(c3);await rej(()=>r3.read('3999','nope'),'NOT_PINNED');
  await assertSucceeds(put(c3,g3,A,0));await assertSucceeds(put(c3,g3,D,0));
  const hostState=(patch)=>A.db.ref(R(c3)+'/state').update(clean(patch));
  // 3a: host swaps D for the outsider. Outsider is not in the pinned list => cannot write; D still can.
  await hostState({players:[A.uid,B.uid,Cc.uid,out.uid]});
  await assertFails(put(c3,g3,out,0));await assertSucceeds(put(c3,g3,D,1));
  await (async()=>{const v=await r3.read(c3,g3);a.deepEqual(v.drift,['PLAYERS_CHANGED']);a.equal(v.consistent,false);a.deepEqual(v.pinned.ids,ids);a.equal(v.players[D.uid].count,2);a.equal(v.players[out.uid],undefined)})();
  await hostState({players:ids});
  await (async()=>{a.deepEqual((await r3.read(c3,g3)).drift,[]);})();
  // 3b: teams / handicap / difficulty / start rewritten
  for(const [patch,code] of [[{tm:{...tm,[A.uid]:1}},'TEAMS_CHANGED'],[{handi:{[A.uid]:3}},'HANDICAP_CHANGED'],[{diff:'hard'},'DIFFICULTY_CHANGED'],[{startAt:1},'START_CHANGED'],[{mode:'B'},'MODE_CHANGED']]){
   const before=(await A.db.ref(R(c3)+'/state').get()).val();await hostState(patch);
   await (async()=>{const v=await r3.read(c3,g3);a.deepEqual(v.drift,[code]);})();
   await A.db.ref(R(c3)+'/state').set(clean(before));}
  // 3c: host changes gid / phase => the old game's log is closed to new writes by the existing rules
  await hostState({gid:'other'});await assertFails(put(c3,g3,B,0));
  await (async()=>{a.deepEqual((await r3.read(c3,g3)).drift,[],'room moved on: nothing to compare, pin stays authoritative');})();
  await hostState({gid:g3,phase:'lobby'});await assertFails(put(c3,g3,B,0));await hostState({phase:'play'});await assertSucceeds(put(c3,g3,B,0));
  // 3d: finish + drift => sealing is refused; the game is not confirmed
  await hostState({players:[A.uid,B.uid,Cc.uid,out.uid]});
  await (async()=>{await w3.finish(c3,g3);await rej(()=>r3.seal(c3,g3),'STATE_DRIFT:PLAYERS_CHANGED');a.equal((await get(ref(db3,Store.ROOT+'/c/'+c3+'_'+g3+'/inputs'))).val(),null);})();
  });
  console.log('PASS C input hardening SDK: sat is server time only (past/future/skewed client rejected), seal aborts on interleaved change and is first-wins/verifiable, host rewrite of players/teams/start/gid detected or blocked by pinned definition');
 }finally{await Promise.all(apps.map(x=>x.app.delete()));await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>setTimeout(()=>process.exit(process.exitCode||0),100));
