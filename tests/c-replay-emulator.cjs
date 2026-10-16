const fs=require('node:fs'),a=require('node:assert/strict'),firebase=require('firebase/compat/app');require('firebase/compat/auth');require('firebase/compat/database');
const {initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing'),{set,ref,get}=require('firebase/database'),Store=require('../server/next-authority/emulator-store.cjs'),CW=require('../server/next-authority/c-writer.cjs'),CI=require('../server/next-authority/c-input.cjs'),RP=require('../server/next-authority/c-replay.cjs');
const TS=firebase.database.ServerValue.TIMESTAMP,rej=async(fn,m)=>{try{await fn()}catch(e){if(String(e.message).includes(m))return;throw Error('wrong rejection '+e.message+' expected '+m)}throw Error('expected rejection '+m)};
(async()=>{a.equal(process.env.GCLOUD_PROJECT,'demo-factorfactor-tower');
 const rules=JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));rules.rules.games.factor.nextAuthorityV1=JSON.parse(fs.readFileSync('firebase/next-authority.fragment.rules.json'));
 const env=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}}),apps=[];
 try{
  for(let i=0;i<5;i++){const app=firebase.initializeApp({projectId:process.env.GCLOUD_PROJECT,apiKey:'fixture',databaseURL:'https://demo-factorfactor-tower.firebaseio.com'},'r-'+i);app.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});app.database().useEmulator('127.0.0.1',9000);const {user}=await app.auth().signInAnonymously();apps.push({app,db:app.database(),uid:user.uid})}
  const [A,B,Cc,D,out]=apps,ids=[A,B,Cc,D].map(x=>x.uid),tm={[A.uid]:0,[B.uid]:0,[Cc.uid]:1,[D.uid]:1},R=c=>'games/factor/rooms/'+c,root='games/factor/nextAuthorityV1/cInput/';
  const clean=o=>JSON.parse(JSON.stringify(o)),put=(code,gid,u,n,v)=>u.db.ref(root+code+'/'+gid+'/'+u.uid+'/'+n).set(clean({n,ct:Date.now(),sat:TS,...v}));
  const mk=(g,extra={})=>({meta:{host:A.uid},players:Object.fromEntries([...ids,out.uid].map(u=>[u,{n:1}])),state:{phase:'play',mode:'C',diff:'easy',gid:g,seed:'seed-'+g,startAt:Date.now()+2000,players:ids,tm,handi:{},...extra}});
  const {api}=RP.sandbox(),solve=(bank,lv,k)=>{const b=bank.get(lv,k);for(const x of b.tiles)for(const y of b.tiles)if(x.id<y.id&&api.polyEqual(api.multiply(x.factor,y.factor),b.poly))return[x.id,y.id]};
  await env.withSecurityRulesDisabled(async c=>{const db=c.database();
   await set(ref(db,R('1000')),mk('p1'));await set(ref(db,R('2000')),mk('late'));await set(ref(db,R('3000')),mk('cpu',{cpu:{x:1}}));await set(ref(db,R('4000')),mk('noseed',{seed:null}));
   await set(ref(db,R('2000')+'/state/startAt'),Date.now()-5000);
  });
  // ---- 7. nothing can be written without the administrator pin
  await assertFails(put('1000','p1',A,0,{k:'answer',q:0,a:['q1_0_0','q1_0_1']}));
  await env.withSecurityRulesDisabled(async c=>{
   const db=c.database(),w=CW.create({database:db}),r=CI.create({database:db}),rp=RP.create({database:db});
   // ---- 6. pin carries seed / clientVersion / pinnedAt / engineHash
   await w.open('1000',{clientVersion:RP.version});const pin=(await get(ref(db,Store.ROOT+'/c/1000_p1'))).val();
   a.equal(pin.seed,'seed-p1');a.equal(pin.clientVersion,RP.version);a(pin.pinnedAt<=pin.startAt);a.equal(pin.engineHash,RP.engineHash);a.equal(pin.cpu,false);
   const bank=api.makeBank(pin.seed,api.DIFFICULTY_CONFIG.easy.tileCount);
   // ---- real clients append an honest log (A: 3 correct, then a skipped board, then a wrong answer pair, then correct)
   const a0=solve(bank,1,0),a1=solve(bank,1,1),a2=solve(bank,1,2);
   await new Promise(r=>setTimeout(r,500));
   await assertSucceeds(put('1000','p1',A,0,{k:'answer',q:0,a:a0}));await assertSucceeds(put('1000','p1',A,1,{k:'answer',q:1,a:a1}));await assertSucceeds(put('1000','p1',A,2,{k:'answer',q:2,a:a2}));
   await assertSucceeds(put('1000','p1',A,3,{k:'special',s:'big'}));
   const b4=bank.get(2,1);// board 4 was never answered; board 5 is the next one (level 2: 3 correct => Lv2 starts) 
   const wrongPair=(()=>{const t=bank.get(2,0).tiles;for(const x of t)for(const y of t)if(x.id<y.id&&!api.polyEqual(api.multiply(x.factor,y.factor),bank.get(2,0).poly))return[x.id,y.id]})();
   await assertSucceeds(put('1000','p1',A,4,{k:'answer',q:3,a:wrongPair}));
   await assertSucceeds(put('1000','p1',B,0,{k:'answer',q:0,a:solve(bank,1,0)}));
   await w.finish('1000','p1');
   await rej(()=>rp.store('1000','p1',A.uid),'NOT_SEALED');
   const sealed=await r.seal('1000','p1');
   const res=await rp.store('1000','p1',A.uid);
   a.equal(res.confirmed,true,JSON.stringify(res.reasons));a.equal(res.player.correct,3);a.equal(res.player.wrong,1);a.equal(res.player.claimedSpecials,1);a.equal(res.player.combo,0);a.equal(res.player.bestCombo,3);a.equal(res.player.countsExact,true);a.equal(res.inputsDigest,sealed.digest);
   a.deepEqual(res.steps.map(s=>s.kind),['correct','correct','correct','wrong']);a(res.notConfirmed.includes('score'));
   a.deepEqual(await rp.store('1000','p1',A.uid),res,'stored once; a second run reproduces the same record');
   a.equal((await rp.store('1000','p1',B.uid)).player.correct,1);
   a.equal((await rp.store('1000','p1',D.uid)).player.answered,0,'a player with no log has nothing confirmed, not zeros invented');
   // ---- tampering after the seal blocks further storing
   await set(ref(db,root+'1000/p1/'+Cc.uid+'/0'),{n:0,k:'answer',q:0,a:a0,ct:1,sat:1});
   await rej(()=>rp.store('1000','p1',Cc.uid),'SEAL_NOT_VERIFIED');
   // ---- 5. ineligible games: pinned late / CPU / no seed => unconfirmed with the reason
   await w.open('2000',{clientVersion:RP.version});const late=(await get(ref(db,Store.ROOT+'/c/2000_late'))).val();a(late.pinnedAt>late.startAt);
   a.deepEqual(RP.replaySolo({pin:late,uid:A.uid,entries:[]}).reasons,['NOT_PINNED_BEFORE_START']);
   await w.open('3000',{clientVersion:RP.version});a.deepEqual(RP.replaySolo({pin:(await get(ref(db,Store.ROOT+'/c/3000_cpu'))).val(),uid:A.uid,entries:[]}).reasons,['CPU_GAME']);
   await w.open('4000',{clientVersion:RP.version});a.deepEqual(RP.replaySolo({pin:(await get(ref(db,Store.ROOT+'/c/4000_noseed'))).val(),uid:A.uid,entries:[]}).reasons,['NO_SEED']);
   await w.open('1000');// re-open is idempotent and cannot change the pin
   a.deepEqual((await get(ref(db,Store.ROOT+'/c/1000_p1/seed'))).val(),'seed-p1');
  });
  // ---- 8. duplicate-detection key is nested by recipient then event id (no "to_id" string ambiguity)
  await env.withSecurityRulesDisabled(async c=>{
   const db=c.database(),w=CW.create({database:db});await set(ref(db,R('5000')),mk('ev1'));await w.open('5000',{clientVersion:RP.version});
   await set(ref(db,R('5000')+'/ev/ev1/'+Cc.uid+'/0000_a_b'),{dmg:3,oj:0,from:A.uid,at:Date.now()-10});
   await set(ref(db,R('5000')+'/ev/ev1/'+D.uid+'/0000_a_b'),{dmg:3,oj:0,from:A.uid,at:Date.now()-10});// same event id, different recipient
   a.equal((await w.apply('5000',Cc.uid,'0000_a_b')).revision,1);a.equal((await w.apply('5000',D.uid,'0000_a_b')).revision,2,'same id for another recipient is a different event');
   a.equal((await w.apply('5000',Cc.uid,'0000_a_b')).duplicate,true);
   const g=(await get(ref(db,Store.ROOT+'/c/5000_ev1'))).val();a.equal(g.applied[Cc.uid]['0000_a_b'],1);a.equal(g.applied[D.uid]['0000_a_b'],2);
  });
  console.log('PASS C solo replay SDK: pin fields, writes only after pin, sealed log replayed once and bound to the digest, tampering/ineligible games unconfirmed, nested duplicate keys');
 }finally{await Promise.all(apps.map(x=>x.app.delete()));await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>setTimeout(()=>process.exit(process.exitCode||0),100));
