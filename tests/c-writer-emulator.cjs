const fs=require('node:fs'),a=require('node:assert/strict'),firebase=require('firebase/compat/app');require('firebase/compat/auth');require('firebase/compat/database');
const {initializeTestEnvironment,assertFails}=require('@firebase/rules-unit-testing'),{set,ref,get}=require('firebase/database'),Store=require('../server/next-authority/emulator-store.cjs'),CW=require('../server/next-authority/c-writer.cjs'),P=require('../src/c-contribution-next.cjs');
(async()=>{a.equal(process.env.GCLOUD_PROJECT,'demo-factorfactor-tower');
 const rules=JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));rules.rules.games.factor.nextAuthorityV1=JSON.parse(fs.readFileSync('firebase/next-authority.fragment.rules.json'));
 const env=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}}),apps=[];
 try{
  for(let i=0;i<5;i++){const app=firebase.initializeApp({projectId:process.env.GCLOUD_PROJECT,apiKey:'fixture',databaseURL:'https://demo-factorfactor-tower.firebaseio.com'},'c-'+i);app.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});app.database().useEmulator('127.0.0.1',9000);const {user}=await app.auth().signInAnonymously();apps.push({app,db:app.database(),uid:user.uid})}
  const P4=apps.slice(0,4),out=apps[4],ids=P4.map(x=>x.uid),[A,B,Cc,D]=P4,tm={[A.uid]:0,[B.uid]:0,[Cc.uid]:1,[D.uid]:1},code='4321',gid='1700000000000',base='games/factor/rooms/'+code;
  const ev=(u,to,id,v)=>u.db.ref(`${base}/ev/${gid}/${to}/${id}`).set({...v,from:u.uid,at:firebase.database.ServerValue.TIMESTAMP});
  await env.withSecurityRulesDisabled(async c=>{
   const db=c.database(),w=CW.create({database:db});
   await set(ref(db,base),{meta:{host:A.uid},players:Object.fromEntries([...ids,out.uid].map(u=>[u,{n:1}])),state:{phase:'play',mode:'C',diff:'easy',gid,startAt:Date.now(),players:ids,tm,handi:{}}});
   // real clients write through the candidate rules; those writes are only INPUT, never evidence
   await ev(A,Cc.uid,'000001_a',{dmg:7,oj:1,sp:0});await ev(B,Cc.uid,'000002_b',{dmg:4,oj:0,sp:0});await ev(Cc,D.uid,'000003_c',{cover:3});await ev(A,B.uid,'000004_d',{cover:2});
   await ev(Cc,A.uid,'000005_e',{dmg:9,oj:0,sp:0});await ev(Cc,B.uid,'000006_f',{cover:4});
   const r1=await w.apply(code,Cc.uid,'000001_a');a.equal(r1.revision,1);
   // duplicate resend (also concurrent): no second application, same revision
   const dup=await Promise.all([w.apply(code,Cc.uid,'000001_a'),w.apply(code,Cc.uid,'000001_a')]);a.deepEqual(dup.map(x=>x.revision),[1,1]);a(dup.every(x=>x.duplicate));
   await w.apply(code,Cc.uid,'000002_b');
   const path=`${Store.ROOT}/c/${code}_${gid}`;let g=(await get(ref(db,path))).val();
   a.equal(g.revision,2);a.deepEqual(Object.values(g.recv[Cc.uid].pend).map(p=>p.dmg),[7,4]);a.equal(g.log[1].proof.damage,7);a.equal(g.log[1].proof.phase,'received');a.equal(g.log[1].proof.committed,true);
   // same-team attack, same-team-less cover, non-participant sender, forged shapes
   await ev(B,Cc.uid,'000010_x',{dmg:5,oj:0});await ev(Cc,B.uid,'000011_x',{dmg:5,oj:0});
   await assertRejects(()=>w.apply(code,Cc.uid,'000011_x'),'INVALID_EVENT_SENDER');// event to C written by C itself? to=C from=C
   await set(ref(db,`${base}/ev/${gid}/${Cc.uid}/000012_o`),{dmg:5,oj:0,from:out.uid,at:Date.now()});await assertRejects(()=>w.apply(code,Cc.uid,'000012_o'),'INVALID_EVENT_SENDER');
   await set(ref(db,`${base}/ev/${gid}/${Cc.uid}/000013_n`),{dmg:-5,oj:0,from:A.uid,at:Date.now()});await assertRejects(()=>w.apply(code,Cc.uid,'000013_n'),'INVALID_EVENT_SHAPE');
   await set(ref(db,`${base}/ev/${gid}/${Cc.uid}/000014_t`),{dmg:5,oj:0,from:A.uid,at:Date.now()+9e7});await assertRejects(()=>w.apply(code,Cc.uid,'000014_t'),'INVALID_EVENT_TIME');
   await set(ref(db,`${base}/ev/${gid}/${Cc.uid}/000015_s`),{cover:5,from:A.uid,at:Date.now()});await assertRejects(()=>w.apply(code,Cc.uid,'000015_s'),'INVALID_EVENT_SHAPE');// enemy "cover"
   await set(ref(db,`${base}/ev/${gid}/${A.uid}/000016_s`),{dmg:5,oj:0,from:B.uid,at:Date.now()});await assertRejects(()=>w.apply(code,A.uid,'000016_s'),'INVALID_EVENT_SHAPE');// friendly fire
   await assertRejects(()=>w.apply(code,'../x','a'),'BAD_EVENT_ID');await assertRejects(()=>w.apply(code,out.uid,'000001_a'),'NOT_A_PARTICIPANT');
   g=(await get(ref(db,path))).val();a.equal(g.revision,2,'rejections never advance revision');
   // cover applies only to really pending damage on the recipient
   await w.apply(code,B.uid,'000004_d');g=(await get(ref(db,path))).val();a.equal(g.log[3].proof.units,0);
   const fin=await w.finish(code,gid);a.equal(fin.revision,3);a.equal((await w.finish(code,gid)).revision,3,'finish is idempotent');
   await assertRejects(()=>w.apply(code,A.uid,'000005_e'),'GAME_ENDED');await assertRejects(()=>w.apply(code,B.uid,'000006_f'),'GAME_ENDED');
   a.equal((await w.apply(code,Cc.uid,'000001_a')).revision,1,'a resend after the end still returns the original, applies nothing');
   g=(await get(ref(db,path))).val();a.equal(g.revision,3);a.equal(g.final.endAt>0,true);a.equal(g.final.source,'c-authority-v1');
   // received attacks are not landed: the read-only projector refuses to count them
   const log=Object.values(g.log);a.equal(P.project({final:g.final,events:log}).consistent,false);
   // shared team HP was never written by the writer
   a.equal((await get(ref(db,`${base}/thp`))).val(),null);
  });
  // third parties / participants cannot read or write the authority record, or forge a final
  const path=`${Store.ROOT}/c/${code}_${gid}`;
  for(const u of [out,A]){await assertFails(u.db.ref(path).get());await assertFails(u.db.ref(path+'/final').set({revision:0}));await assertFails(u.db.ref(path+'/log/1/proof/damage').set(0));await assertFails(u.db.ref(path+'/applied/x').set(1));await assertFails(u.db.ref(path+'/revision').set(99))}
  console.log('PASS C writer SDK: original engine replay, unique revision per event, duplicate/concurrent resend once, bad sender/shape/time rejected, post-end input rejected, clients cannot read/write authority, no shared-HP write');
 }finally{await Promise.all(apps.map(x=>x.app.delete()));await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>setTimeout(()=>process.exit(process.exitCode||0),100));
async function assertRejects(fn,msg){try{await fn()}catch(e){if(!String(e.message).includes(msg))throw Error('wrong rejection: '+e.message+' expected '+msg);return}throw Error('expected rejection '+msg)}
