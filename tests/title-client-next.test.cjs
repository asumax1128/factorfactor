const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const T=require('../src/title-client-next.cjs');
const spark=(e,n)=>({easy:{maxRating:e},normal:{maxRating:n}});
test('rate titles use the raw stored peak, never a rounded display value',()=>{
 assert.deepEqual(T.judge({sparkProfile:spark(1729.99,1729.9)}),[]);
 assert.deepEqual(T.judge({sparkProfile:spark(1730,1819.99)}),['easy_adept','normal_adept']);
 assert.deepEqual(T.judge({sparkProfile:spark(1820,1819.99)}),['easy_adept','easy_master','normal_adept']);
 assert.deepEqual(T.judge({sparkProfile:spark(1820,1820)}).sort(),['dual_master','easy_adept','easy_master','normal_adept','normal_master']);
 assert.deepEqual(T.judge({sparkProfile:{easy:{rating:2000}}}),[],'current rating alone is not a peak');
 assert.deepEqual(T.judge({sparkProfile:null}),[]);assert.deepEqual(T.judge({sparkProfile:{easy:{maxRating:'1900'}}}),[]);
});
test('first plan freezes legacy titles once and adds only newly proven ones',()=>{
 const p=T.plan({account:'a',legacy:['first','easy_adept'],equipped:'first',facts:{sparkProfile:spark(1830,1700)}});
 assert.deepEqual(Object.keys(p.snapshot.earned).sort(),['easy_adept','first']);assert.equal(p.snapshot.equipped,'first');
 assert.equal(p.snapshot.migrationId,'v6-client-1');assert.deepEqual(p.snapshot.capturedAt,{'.sv':'timestamp'});
 assert.deepEqual(Object.keys(p.add),['easy_master'],'already-retained easy_adept is not awarded again');
 assert.deepEqual(p.add.easy_master.at,{'.sv':'timestamp'});
});
test('second plan never replaces the snapshot, never re-adds, and a later lower rating removes nothing',()=>{
 const snapshot={earned:{first:{id:'first',at:null}}};const awards={easy_master:{earned:true,at:5}};
 const p=T.plan({account:'a',snapshot,awards,legacy:['first','brand_new_legacy_like'],facts:{sparkProfile:spark(1500,1500)}});
 assert.equal(p.snapshot,null,'frozen once');assert.deepEqual(p.add,{});
 const v=T.view({snapshot,awards});assert(v.earned.first&&v.earned.easy_master,'retained even if the rating dropped');
});
test('view merges retained and awarded titles and keeps archived legacy ids',()=>{
 const v=T.view({snapshot:{earned:{first:{id:'first',at:null},nosp:{id:'nosp',at:null}},equipped:'nosp'},awards:{normal_master:{earned:true,at:9}}});
 assert(v.earned.first&&v.earned.normal_master);assert.deepEqual(v.archived,['nosp']);assert.equal(v.equipped,'nosp');
});
test('legacyIds unions computed legacy badges with every stored flag family',()=>{
 assert.deepEqual(T.legacyIds({badgeIds:['first','first'],flags:[{daily_king:true,x:false},{easy_adept:true},{wk1:{earned:true}}]}).sort(),['daily_king','easy_adept','first','wk1']);
});
test('rules fragment authorises exactly the judged ids, each tied to Spark evidence, add-only and own-account',()=>{
 const r=JSON.parse(fs.readFileSync('firebase/title-client.fragment.rules.json','utf8'));
 const w=r.awards.$account.$id;const v=w['.validate'];
 for(const id of Object.keys(T.JUDGES))assert(v.includes(`$id === '${id}'`),id);
 assert.equal([...v.matchAll(/\$id === '([a-z_]+)'/g)].length,Object.keys(T.JUDGES).length);
 assert(v.includes('onlineSparkV1/profiles/'));assert(w['.write'].includes('!data.exists()'));assert(w['.write'].includes('logins/'));assert(!w['.write'].includes('snapshots'),'awards no longer depend on the snapshot');
 assert(r.snapshots.$account['.write'].includes('!data.exists()'));
 assert.equal(r['.write'],false);
});

// ---- sync(): freeze safety, retry, failure reporting (in-memory fake RTDB with failure injection) ----
function fakeDb(seed,opt={}){
 const tree=JSON.parse(JSON.stringify(seed));const writes=[];
 const get=p=>p.split('/').filter(Boolean).reduce((c,k)=>c==null?c:c[k],tree);
 const setAt=(p,v)=>{const ks=p.split('/').filter(Boolean);let c=tree;for(const k of ks.slice(0,-1))c=c[k]??={};c[ks.at(-1)]=JSON.parse(JSON.stringify(v));};
 const ref=p=>({
  get:async()=>{if(opt.failRead?.test(p))throw Error('read failed');const v=p==='.info/connected'?(opt.connected??true):get(p);return{val:()=>v===undefined?null:v,exists:()=>v!=null};},
  set:async v=>{if(opt.failSet?.test(p))throw Error('PERMISSION_DENIED');if(opt.once?.test(p)&&get(p)!=null)throw Error('PERMISSION_DENIED');writes.push(p);setAt(p,v);},
  child:k=>ref(p+'/'+k)
 });
 return{db:{ref},tree,writes};
}
const base=()=>({games:{factor:{accounts:{ap:{name:'AP',stats:{nick:'first',w:2}}},onlineSparkV1:{profiles:{ap:{easy:{maxRating:1735},normal:{maxRating:1500}}}}}}});
const legacy=st=>st.w>=1?['first']:[];
test('sync: stats read failure writes nothing and is reported',async()=>{
 const f=fakeDb(base(),{failRead:/accounts\/ap\/stats$/});const r=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});
 assert.equal(r.status,'failed');assert.equal(r.error,'READ_FAILED');assert.deepEqual(f.writes,[]);
});
test('sync: random-match-only players (stats missing/empty) still get new titles; the legacy freeze is deferred, not faked',async()=>{
 for(const[label,mutate,reason]of[
  ['stats missing',t=>{delete t.games.factor.accounts.ap.stats},'STATS_EMPTY'],
  ['stats empty',t=>{t.games.factor.accounts.ap.stats={}},'STATS_EMPTY'],
  ['account unconfirmed',t=>{delete t.games.factor.accounts.ap},'ACCOUNT_UNCONFIRMED']]){
  const seed=base();mutate(seed);const f=fakeDb(seed);const r=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});
  assert.equal(r.status,'ok',label);assert.equal(r.freezeDeferred,reason,label);assert.equal(r.snapshot,null,label);
  assert.deepEqual(r.added,['easy_adept'],label+': new title awarded from the Spark profile');
  assert.equal(f.tree.games.factor.titleNextV1.snapshots,undefined,label+': no (empty) snapshot written');
 }
});
test('sync: offline writes nothing at all (it would hang) and is retried',async()=>{
 const f=fakeDb(base(),{connected:false});const r=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});
 assert.equal(r.status,'deferred');assert.equal(r.reason,'OFFLINE');assert.deepEqual(f.writes,[]);
});
test('sync: legacy flags are never re-awarded while the snapshot is still pending, and the later freeze keeps them',async()=>{
 const seed=base();seed.games.factor.accounts.ap.stats={};seed.games.factor.onlineSparkV1.profiles.ap.badges={easy_adept:true};
 seed.games.factor.dailyV2={titles:{ap:{daily_easy_king:true}}};
 const f=fakeDb(seed);
 const r1=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});
 assert.equal(r1.freezeDeferred,'STATS_EMPTY');assert.deepEqual(r1.added,[],'easy_adept is a legacy flag: left for the freeze, not re-awarded');
 f.tree.games.factor.accounts.ap.stats={nick:'first',w:2};
 const r2=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});
 assert.equal(r2.status,'ok');assert.equal(r2.frozen,true);
 assert.deepEqual(Object.keys(f.tree.games.factor.titleNextV1.snapshots.ap.earned).sort(),['daily_easy_king','easy_adept','first']);
 const v=T.view({snapshot:r2.snapshot,awards:r2.awards});assert(v.earned.first&&v.earned.easy_adept&&v.earned.daily_easy_king);
});
test('sync: titles awarded before the freeze survive it, nothing is awarded twice, stats/nick untouched',async()=>{
 const seed=base();seed.games.factor.accounts.ap.stats={};const f=fakeDb(seed,{once:/titleNextV1\/(snapshots|awards)\//});
 const r1=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});assert.deepEqual(r1.added,['easy_adept']);
 const r1b=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});assert.deepEqual(r1b.added,[],'second run adds nothing');
 f.tree.games.factor.accounts.ap.stats={nick:'first',w:2};
 const r2=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});
 assert.equal(r2.frozen,true);assert.deepEqual(r2.added,[]);
 assert(f.tree.games.factor.titleNextV1.awards.ap.easy_adept.earned,'earlier award kept');
 assert(f.tree.games.factor.titleNextV1.snapshots.ap.earned.first,'legacy frozen afterwards');
 assert.deepEqual(f.tree.games.factor.accounts.ap.stats,{nick:'first',w:2});
 const v=T.view({snapshot:r2.snapshot,awards:r2.awards});assert(v.earned.first&&v.earned.easy_adept);
});
test('sync: a rejected freeze is reported, new awards still go through, and the freeze is retried next time',async()=>{
 const f=fakeDb(base(),{failSet:/titleNextV1\/snapshots/});
 const r1=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});
 assert.equal(r1.status,'failed');assert.equal(r1.error,'SNAPSHOT_UNAVAILABLE');assert.deepEqual(r1.added,['easy_adept'],'awarding is independent of the freeze');
 assert.equal(f.tree.games.factor.titleNextV1.snapshots,undefined);
 const f2=fakeDb(f.tree);const r2=await T.sync({db:f2.db,account:{key:'ap'},computeBadgeIds:legacy});
 assert.equal(r2.status,'ok');assert(f2.tree.games.factor.titleNextV1.snapshots.ap.earned.first);assert.deepEqual(r2.added,[]);
});
test('sync: an existing snapshot is never overwritten and new awards are added once',async()=>{
 const seed=base();seed.games.factor.titleNextV1={snapshots:{ap:{version:1,earned:{old_one:{id:'old_one',at:null}}}}};
 const f=fakeDb(seed,{once:/titleNextV1\/(snapshots|awards)\//});
 const r=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:()=>['something_new']});
 assert.equal(r.status,'ok');assert.equal(r.frozen,false);assert.deepEqual(r.added,['easy_adept']);
 assert.deepEqual(Object.keys(f.tree.games.factor.titleNextV1.snapshots.ap.earned),['old_one']);
 const r2=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:()=>[]});assert.deepEqual(r2.added,[]);
});
test('sync: a failed award is reported (not silent) while legacy view stays intact',async()=>{
 const f=fakeDb(base(),{failSet:/titleNextV1\/awards/});
 const r=await T.sync({db:f.db,account:{key:'ap'},computeBadgeIds:legacy});
 assert.equal(r.status,'failed');assert.equal(r.error,'AWARD_NOT_SAVED');assert.deepEqual(r.failed,['easy_adept']);
 assert(T.view({snapshot:r.snapshot,awards:r.awards}).earned.first,'frozen legacy title still shown');
});
test('sync: guests are skipped',async()=>{assert.equal((await T.sync({db:fakeDb({}).db,account:{guest:true}})).status,'skipped');});
