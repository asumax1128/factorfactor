const fs=require('node:fs'),a=require('node:assert/strict'),firebase=require('firebase/compat/app');require('firebase/compat/auth');require('firebase/compat/database');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing'),{set,ref,get}=require('firebase/database'),Store=require('../server/next-authority/emulator-store.cjs'),CW=require('../server/next-authority/c-writer.cjs'),CI=require('../server/next-authority/c-input.cjs');
const TS=firebase.database.ServerValue.TIMESTAMP,pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{a.equal(process.env.GCLOUD_PROJECT,'demo-factorfactor-tower');
 const rules=JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));rules.rules.games.factor.nextAuthorityV1=JSON.parse(fs.readFileSync('firebase/next-authority.fragment.rules.json'));
 const env=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}}),apps=[];
 try{
  for(let i=0;i<6;i++){const app=firebase.initializeApp({projectId:process.env.GCLOUD_PROJECT,apiKey:'fixture',databaseURL:'https://demo-factorfactor-tower.firebaseio.com'},'ci-'+i);app.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});app.database().useEmulator('127.0.0.1',9000);const {user}=await app.auth().signInAnonymously();apps.push({app,db:app.database(),uid:user.uid})}
  const [A,B,Cc,D,out,spec]=apps,ids=[A,B,Cc,D].map(x=>x.uid),tm={[A.uid]:0,[B.uid]:0,[Cc.uid]:1,[D.uid]:1};
  const code='4321',gid='170',key=code+'_'+gid,R=c=>'games/factor/rooms/'+c,root='games/factor/nextAuthorityV1/cInput/';
  const entry=(n,over={})=>({n,k:'answer',q:n,a:['f1','f2'],ct:Date.now(),sat:TS,...over});
  const clean=o=>JSON.parse(JSON.stringify(o)),put=(u,n,v,as=u,k=key)=>u.db.ref(root+k.replace('_','/')+'/'+as.uid+'/'+n).set(clean(v===undefined?entry(n):v)).then(x=>x);
  const room=(c,g,extra={})=>({meta:{host:A.uid},players:Object.fromEntries([...ids,out.uid].map(u=>[u,{n:1}])),state:{phase:'play',mode:'C',diff:'easy',gid:g,startAt:Date.now()-1000,players:ids,tm,handi:{},...extra}});
  await env.withSecurityRulesDisabled(async c=>{
   const db=c.database();for(const [c2,g,ex] of [[code,gid,{}],['1111','g2',{cpu:{x:1}}],['2222','g3',{mode:'B'}],['3333','g4',{}],['5555','g5',{}]])await set(ref(db,R(c2)),room(c2,g,ex));
   await set(ref(db,R('3333')+'/result/g4'),{winner:'x'});
   await set(ref(db,R('5555')+'/state/startAt'),Date.now()+600000);
  });
  // ---- allowed: own, contiguous, server-assigned sat
  for(const u of [A,B,Cc,D])await assertSucceeds(put(u,0));
  await assertSucceeds(put(A,1,entry(1,{k:'special',q:undefined,a:undefined,s:'shield'})));
  await assertSucceeds(put(A,2,entry(2,{ct:Date.now()-60000})));// legitimately delayed (queued) write
  // ---- identity / participation
  await assertFails(put(A,1,undefined,B));// impersonation: A writes into B's log
  await assertFails(put(out,0,undefined,out));// room member but not a game participant
  await assertFails(put(spec,0,undefined,spec));
  await assertFails(put(out,5,undefined,A));
  // ---- overwrite / replay
  await assertFails(put(A,0,entry(0,{q:99})));await assertFails(put(A,0));await assertFails(A.db.ref(root+code+'/'+gid+'/'+A.uid+'/0').remove());
  // ---- sequence
  await assertFails(put(B,2));// gap
  await assertFails(put(B,1,entry(7)));// n != key
  await assertFails(put(B,'01',entry(1)));await assertFails(put(B,'-1',entry(1)));await assertFails(put(B,10000,entry(10000)));
  // ---- concurrent same seq: exactly one wins, other is rejected (no overwrite)
  const res=await Promise.allSettled([put(B,1,entry(1,{q:1})),put(B,1,entry(1,{q:2}))]);a.equal(res.filter(r=>r.status==='fulfilled').length,1);
  // ---- different players at the same time: both accepted, ordered by SERVER time
  await Promise.all([put(Cc,1),put(D,1)]);
  // ---- server time is not self-reported
  await assertFails(put(B,2,entry(2,{sat:Date.now()-5000})));await assertFails(put(B,2,entry(2,{sat:Date.now()+999999})));
  const noSat=entry(2);delete noSat.sat;await assertFails(put(B,2,noSat));
  await assertFails(put(B,2,entry(2,{ct:Date.now()+60000})));await assertFails(put(B,2,entry(2,{ct:Date.now()-600000})));await assertFails(put(B,2,entry(2,{ct:'x'})));
  // ---- shape
  for(const bad of [entry(2,{k:'attack'}),entry(2,{x:1}),entry(2,{a:['f1']}),entry(2,{a:['f1','f1']}),entry(2,{a:['f1','f2','f3']}),entry(2,{a:['a b','c']}),entry(2,{q:-1}),entry(2,{q:1.5e9}),entry(2,{s:'big'}),entry(2,{k:'special',q:undefined,a:undefined,s:'nuke'}),entry(2,{k:'special',s:'big'}),entry(2,{dmg:9999}),{n:2}])await assertFails(put(B,2,bad));
  // ---- other games: CPU room, non-C mode, result already written, before start
  await assertFails(put(A,0,undefined,A,'1111_g2'));await assertFails(put(A,0,undefined,A,'2222_g3'));await assertFails(put(A,0,undefined,A,'3333_g4'));await assertFails(put(A,0,undefined,A,'5555_g5'));
  await assertFails(put(A,0,undefined,A,'4321_other'));await assertFails(put(A,0,undefined,A,'bad key'));
  // ---- read: own log only
  await assertSucceeds(A.db.ref(root+code+'/'+gid+'/'+A.uid).get());await assertFails(A.db.ref(root+code+'/'+gid+'/'+B.uid).get());await assertFails(out.db.ref(root+code+'/'+gid+'/'+A.uid).get());await assertFails(out.db.ref(root+code+'/'+gid).get());
  await assertFails(A.db.ref(Store.ROOT+'/c/'+key).get());
  // ---- trusted verification, finish barrier and seal
  await env.withSecurityRulesDisabled(async c=>{
   const db=c.database(),w=CW.create({database:db}),r=CI.create({database:db});
   await w.open(code);let v=await r.read(code,gid);
   a.equal(v.consistent,true,JSON.stringify(v.anomalies));a.deepEqual(Object.fromEntries(ids.map(u=>[u,v.players[u].count])),{[A.uid]:3,[B.uid]:2,[Cc.uid]:2,[D.uid]:2});
   a(v.ordered.every((e,i,l)=>i===0||l[i-1].sat<=e.sat),'cross-player order is by server arrival time');
   await assertRejectsMsg(()=>r.seal(code,gid),'NOT_FINISHED');
   // a gap or tampered counter can only come from a non-rules writer; verifier refuses it
   await set(ref(db,root+code+'/'+gid+'/'+Cc.uid+'/5'),{n:5,k:'answer',q:5,a:['x','y'],ct:1,sat:2});v=await r.read(code,gid);a.equal(v.consistent,false);a.equal(v.anomalies[0].problem,'GAP_OR_MISNUMBERED');a.equal(v.players[Cc.uid].count,2,'only the contiguous prefix is ever counted');
   await set(ref(db,root+code+'/'+gid+'/'+Cc.uid+'/5'),null);
   const lastSat=Math.max(...v.ordered.map(e=>e.sat)),fin=await w.finish(code,gid,lastSat-1);
   const sealed=await r.seal(code,gid);a.equal(sealed.endAt,lastSat-1);a.equal(sealed.excludedAfterEnd>=1,true);a.equal((await r.verifySeal(code,gid)).ok,true);a.match(sealed.digest,/^[0-9a-f]{64}$/);
   a.deepEqual(await r.seal(code,gid),sealed,'seal is idempotent');
   a.equal(fin.revision,0);
  });
  // ---- after the end barrier nothing can be appended
  await assertFails(put(D,2));await assertFails(put(A,3));
  console.log('PASS C input log SDK: owner-only append, participant/game/mode checks, no overwrite, contiguous seq, server-assigned arrival time, bounded claimed time, concurrent writes, post-end rejected, verified+sealed');
 }finally{await Promise.all(apps.map(x=>x.app.delete()));await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>setTimeout(()=>process.exit(process.exitCode||0),100));
async function assertRejectsMsg(fn,m){try{await fn()}catch(e){if(String(e.message).includes(m))return;throw e}throw Error('expected '+m)}
