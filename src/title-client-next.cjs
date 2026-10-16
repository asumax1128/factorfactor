'use strict';
// Ver.6.0 client-side titles (owner decision): the browser judges conditions from data that exists in production
// and saves ADD-ONLY records under the player's own account. Same trust level as the legacy titles.
// Nothing here ever deletes or edits a title, and legacy `stats` / `nick` are never written.
const catalog=require('./title-catalog-next.json');
const Cut=require('./title-cutover-next.cjs');
const Compat=require('./title-compat-next.cjs');
const ROOT='games/factor/titleNextV1';
const MIGRATION_ID='v6-client-1';
const known=new Set(catalog.titles.map(t=>t.id));
const stamp=()=>({'.sv':'timestamp'});
const peak=(p,d)=>{const v=p?.[d]?.maxRating;return typeof v==='number'&&Number.isFinite(v)?v:null;};
// Raw stored maxRating only: no display rounding (1729.99 must not earn the 1730 title).
const RATE_RULES={
 easy_adept:p=>peak(p,'easy')!==null&&peak(p,'easy')>=1730,
 easy_master:p=>peak(p,'easy')!==null&&peak(p,'easy')>=1820,
 normal_adept:p=>peak(p,'normal')!==null&&peak(p,'normal')>=1730,
 normal_master:p=>peak(p,'normal')!==null&&peak(p,'normal')>=1820,
 dual_master:p=>peak(p,'easy')!==null&&peak(p,'normal')!==null&&peak(p,'easy')>=1820&&peak(p,'normal')>=1820
};
const JUDGES={...RATE_RULES};
// Ids that the game ALREADY treats as earned (legacy BADGES are computed from stats on every render, so they are
// frozen once at cutover; stored flags are daily titles, ghost titles and Spark badges).
function legacyIds({badgeIds=[],flags=[]}={}){
 const out=new Set(badgeIds.filter(id=>typeof id==='string'&&id));
 for(const map of flags)for(const[id,v]of Object.entries(map||{}))if(v===true||v?.earned===true)out.add(id);
 return [...out];
}
function judge(facts){
 const out=[];
 for(const[id,rule]of Object.entries(JUDGES))if(known.has(id)&&rule(facts.sparkProfile))out.push(id);
 return out;
}
// Decide what to write. Pure: returns {snapshot, add}. Add-only: existing awards/snapshot entries are never replaced.
function plan({account,snapshot,awards,legacy=[],equipped=null,facts={}}){
 const held=new Set([...Object.keys(snapshot?.earned||{}),...Object.entries(awards||{}).filter(([,v])=>v?.earned===true).map(([id])=>id)]);
 const out={snapshot:null,add:{}};
 if(!snapshot){
  const frozen=Cut.freeze(null,{account,migrationId:MIGRATION_ID,capturedAt:1,legacyEarned:legacy,equipped});
  out.snapshot={...frozen,capturedAt:stamp()};
  for(const id of legacy)held.add(id);
 }
 for(const id of judge(facts))if(!held.has(id))out.add[id]={earned:true,at:stamp(),source:'client-judged-v1'};
 return out;
}
// Persist through compat/RTDB. Safe to call on every login/profile open: re-runs add nothing new.
// All sources are read here (not taken from UI hooks that may still be loading), so the one-time freeze
// can never capture a half-loaded legacy state. `computeBadgeIds(stats)` is the game's own legacy BADGES evaluator.
async function sync({db,account,computeBadgeIds=()=>[]}){
 const key=account?.key;if(!key)return{skipped:'guest'};
 const g=p=>db.ref(`games/factor/${p}`).get().then(s=>s.val());
 const sRef=db.ref(`${ROOT}/snapshots/${key}`),aRef=db.ref(`${ROOT}/awards/${key}`);
 const [stats,daily,sparkProfile,snap0,awards0]=await Promise.all([g(`accounts/${key}/stats`),g(`dailyV2/titles/${key}`),g(`onlineSparkV1/profiles/${key}`),sRef.get().then(s=>s.val()),aRef.get().then(s=>s.val())]);
 let snapshot=snap0,awards=awards0||{};
 const legacy=legacyIds({badgeIds:computeBadgeIds(stats||{}),flags:[daily,stats?.ghostTitles,sparkProfile?.badges]});
 const p=plan({account:key,snapshot,awards,legacy,equipped:stats?.nick??null,facts:{sparkProfile}});
 if(p.snapshot){try{await sRef.set(p.snapshot);}catch(e){/* a concurrent device froze it first: keep theirs */}snapshot=(await sRef.get()).val();}
 if(!snapshot)return{error:'SNAPSHOT_UNAVAILABLE',added:[],awards};
 // Awards are written after the snapshot exists; rules require it, and each id can be created exactly once.
 const added=[];
 for(const[id,record]of Object.entries(p.add)){
  try{await aRef.child(id).set(record);added.push(id);}catch(e){/* already awarded elsewhere */}
 }
 awards=(await aRef.get()).val()||{};
 return{snapshot,awards,added,frozen:!!p.snapshot};
}
// What the UI shows: snapshot (retained) + awards, never fewer than before.
function view({snapshot,awards,equipped=null}){
 const retained=Object.fromEntries(Object.entries(snapshot?.earned||{}).map(([id,r])=>[id,{earned:true,at:r.at}]));
 return Compat.read({flags:[retained,awards||{}],equipped:equipped??snapshot?.equipped??null});
}
module.exports={ROOT,MIGRATION_ID,JUDGES,RATE_RULES,legacyIds,judge,plan,sync,view};
