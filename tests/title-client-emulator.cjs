// Emulator-only (demo project): client-judged titles, own account, add-only. Candidate rules: firebase/title-client.fragment.rules.json
const fs=require('node:fs'),assert=require('node:assert/strict'),firebase=require('firebase/compat/app');
require('firebase/compat/auth');require('firebase/compat/database');
const{initializeTestEnvironment,assertFails,assertSucceeds}=require('@firebase/rules-unit-testing'),{set,ref}=require('firebase/database');
const T=require('../src/title-client-next.cjs');
(async()=>{
 assert.equal(process.env.GCLOUD_PROJECT,'demo-factorfactor-tower');
 const rules=JSON.parse(fs.readFileSync('firebase/v525.candidate.rules.json'));
 rules.rules.games.factor.titleNextV1=JSON.parse(fs.readFileSync('firebase/title-client.fragment.rules.json'));
 const env=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT,database:{host:'127.0.0.1',port:9000,rules:JSON.stringify(rules)}}),apps=[];
 try{
  for(const n of ['dev1','dev2','other','stranger']){
   const app=firebase.initializeApp({projectId:process.env.GCLOUD_PROJECT,apiKey:'fixture',databaseURL:'https://demo-factorfactor-tower.firebaseio.com'},'tc-'+n);
   app.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});app.database().useEmulator('127.0.0.1',9000);
   const{user}=await app.auth().signInAnonymously();apps.push({n,app,db:app.database(),uid:user.uid});
  }
  const[d1,d2,o,s]=apps,acct={key:'ap',name:'AP'};
  const stats={nick:'first',w:3,maxRating:1500,games:5};
  await env.withSecurityRulesDisabled(c=>set(ref(c.database(),'games/factor'),{
   logins:{ap:{[d1.uid]:'x',[d2.uid]:'x'},bp:{[o.uid]:'x'}},
   accounts:{ap:{name:'AP',stats},bp:{name:'BP',stats:{}}},
   dailyV2:{titles:{ap:{daily_easy_king:true}}},
   onlineSparkV1:{profiles:{ap:{easy:{maxRating:1830},normal:{maxRating:1700}},bp:{easy:{maxRating:1500},normal:{maxRating:1500}}}}
  }));
  const legacyOf=st=>st.nick==='first'||st.w>=1?['first','streak10']:[];
  // 1. first login freezes legacy titles and adds only what the stored peaks prove
  const r1=await T.sync({db:d1.db,account:acct,computeBadgeIds:legacyOf});
  assert.equal(r1.frozen,true);assert.deepEqual(r1.added.sort(),['easy_adept','easy_master'],'peak titles are judged; daily/legacy ones are frozen, not re-awarded');
  const snap=(await d1.db.ref('games/factor/titleNextV1/snapshots/ap').get()).val();
  assert.deepEqual(Object.keys(snap.earned).sort(),['daily_easy_king','first','streak10']);assert(Number.isSafeInteger(snap.capturedAt));assert.equal(snap.equipped,'first');
  const a1=(await d1.db.ref('games/factor/titleNextV1/awards/ap').get()).val();assert.equal(a1.easy_master.earned,true);assert(Number.isSafeInteger(a1.easy_master.at));
  console.log('PASS freeze + first client award saved under the player');
  // 2. re-login on the same device and a second device see the same state; nothing is added twice
  const r2=await T.sync({db:d1.db,account:acct,computeBadgeIds:legacyOf});
  assert.equal(r2.frozen,false);assert.deepEqual(r2.added,[]);
  const r3=await T.sync({db:d2.db,account:acct,computeBadgeIds:()=>[]});
  assert.deepEqual(r3.added,[]);assert.deepEqual(Object.keys(T.view({snapshot:r3.snapshot,awards:r3.awards}).earned).sort(),['daily_easy_king','easy_adept','easy_master','first','streak10']);
  assert.equal((await d2.db.ref('games/factor/titleNextV1/snapshots/ap/migrationId').get()).val(),'v6-client-1');
  console.log('PASS re-login / second device reproduce the same titles without duplicates');
  // 3. peaks rising later add; legacy-looking inputs on a later run cannot overwrite the frozen snapshot
  await env.withSecurityRulesDisabled(c=>set(ref(c.database(),'games/factor/onlineSparkV1/profiles/ap/normal/maxRating'),1822));
  const r4=await T.sync({db:d1.db,account:acct,computeBadgeIds:()=>['something_else']});
  assert.deepEqual(r4.added.sort(),['dual_master','normal_adept','normal_master']);
  assert.equal((await d1.db.ref('games/factor/titleNextV1/snapshots/ap/earned/something_else').get()).exists(),false);
  // a later drop in the stored peak never removes anything
  await env.withSecurityRulesDisabled(c=>set(ref(c.database(),'games/factor/onlineSparkV1/profiles/ap'),{easy:{maxRating:1000},normal:{maxRating:1000}}));
  const r5=await T.sync({db:d1.db,account:acct,computeBadgeIds:()=>[]});
  assert.deepEqual(r5.added,[]);assert.equal(Object.keys(r5.awards).length,5);
  console.log('PASS later peak gains add, later drops remove nothing');
  // 4. nobody can touch other accounts, forge evidence, rewrite, or delete
  const A='games/factor/titleNextV1/awards/',S='games/factor/titleNextV1/snapshots/',stamp={'.sv':'timestamp'},rec={earned:true,at:stamp,source:'client-judged-v1'};
  await assertFails(o.db.ref(A+'ap/dual_master').set(rec));
  await assertFails(o.db.ref(S+'ap').set({version:1}));
  await assertFails(d1.db.ref(A+'bp/easy_adept').set(rec));
  await assertFails(o.db.ref(A+'bp/easy_adept').set(rec));
  await assertFails(d1.db.ref(A+'ap/easy_master').set(rec));
  await assertFails(d1.db.ref(A+'ap/easy_master').remove());
  await assertFails(d1.db.ref(A+'ap/easy_master/at').set(7));
  await assertFails(d1.db.ref(A+'ap').remove());
  await assertFails(d1.db.ref(S+'ap').remove());
  await assertFails(d1.db.ref(S+'ap/earned/first').remove());
  await assertFails(d1.db.ref(S+'ap/earned/streak30').set({id:'streak30',at:null,source:'legacy-evidence'}));
  await assertFails(d1.db.ref(A+'ap/tour1').set(rec));
  await assertFails(o.db.ref(A+'bp/easy_adept').set({...rec,at:5}));
  await assertFails(o.db.ref(A+'bp/normal_master').set(rec));
  await assertFails(s.db.ref(A+'ap').get());await assertFails(s.db.ref(S+'ap').get());
  await assertFails(d1.db.ref(A+'ap/hidden_forge').set(rec));
  console.log('PASS other accounts, unproven ids, overwrite, delete and strangers are all rejected');
  // 5. a fresh account with no snapshot cannot be awarded first; the snapshot comes first
  await assertFails(o.db.ref(A+'bp/easy_adept').set(rec));
  // 6. legacy stats/nick untouched
  const st=(await d1.db.ref('games/factor/accounts/ap/stats').get()).val();assert.deepEqual(st,stats);
  console.log('PASS legacy stats and nick untouched');
 }finally{await Promise.all(apps.map(a=>a.app.delete()));await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>setTimeout(()=>process.exit(process.exitCode||0),100));
