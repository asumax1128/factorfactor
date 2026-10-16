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
 assert(v.includes('onlineSparkV1/profiles/'));assert(w['.write'].includes('!data.exists()'));assert(w['.write'].includes('logins/'));
 assert(r.snapshots.$account['.write'].includes('!data.exists()'));
 assert.equal(r['.write'],false);
});
