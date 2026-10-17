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
// Awarding new titles (judged from Spark data) and freezing the legacy titles are INDEPENDENT: a player whose legacy
// `stats` cannot be confirmed yet (e.g. random-match-only accounts) still receives new titles, and the freeze is retried later.
// `canFreeze=false` means "do not create the snapshot now"; legacy-held ids are still excluded from new awards while no snapshot
// exists, because the later freeze will retain them.
function plan({account,snapshot,awards,legacy=[],equipped=null,facts={},canFreeze=true}){
 const held=new Set([...Object.keys(snapshot?.earned||{}),...Object.entries(awards||{}).filter(([,v])=>v?.earned===true).map(([id])=>id)]);
 const out={snapshot:null,add:{}};
 if(!snapshot){
  for(const id of legacy)held.add(id);
  if(canFreeze){
   const frozen=Cut.freeze(null,{account,migrationId:MIGRATION_ID,capturedAt:1,legacyEarned:legacy,equipped});
   out.snapshot={...frozen,capturedAt:stamp()};
  }
 }
 for(const id of judge(facts))if(!held.has(id))out.add[id]={earned:true,at:stamp(),source:'client-judged-v1'};
 return out;
}
// Persist through compat/RTDB. Safe to call on every login/profile open: re-runs add nothing new.
// All sources are read here (not taken from UI hooks that may still be loading), so the one-time freeze
// can never capture a half-loaded legacy state. `computeBadgeIds(stats)` is the game's own legacy BADGES evaluator.
// status: 'ok' | 'deferred' (offline: nothing written, retried; no user warning) | 'failed' (user is told).
// `freezeDeferred` names why the legacy snapshot was not created this time (new awards are still processed).
const isEmpty=v=>v==null||(typeof v==='object'&&!Object.keys(v).length);
async function sync({db,account,computeBadgeIds=()=>[]}){
 const key=account?.key;if(!key)return{status:'skipped',reason:'guest',added:[],awards:{}};
 const g=p=>db.ref(`games/factor/${p}`).get().then(s=>s.val());
 const sRef=db.ref(`${ROOT}/snapshots/${key}`),aRef=db.ref(`${ROOT}/awards/${key}`);
 let stats,daily,sparkProfile,snap0,awards0,acctName,connected;
 try{
  [stats,daily,sparkProfile,snap0,awards0,acctName]=await Promise.all([g(`accounts/${key}/stats`),g(`dailyV2/titles/${key}`),g(`onlineSparkV1/profiles/${key}`),sRef.get().then(s=>s.val()),aRef.get().then(s=>s.val()),g(`accounts/${key}/name`)]);
 }catch(e){return{status:'failed',error:'READ_FAILED',added:[],awards:{}};}   // a failed read is never treated as "no titles"
 try{connected=(await db.ref('.info/connected').get()).val();}catch(e){connected=undefined;}
 // Offline writes would hang until reconnect: do nothing now and retry.
 if(connected===false)return{status:'deferred',reason:'OFFLINE',added:[],awards:awards0||{},snapshot:snap0||null};
 let snapshot=snap0,awards=awards0||{},canFreeze=true,freezeDeferred=null;
 if(!snapshot){
  // The freeze is write-once, so it only happens on non-empty legacy data of an existing account.
  if(acctName==null){canFreeze=false;freezeDeferred='ACCOUNT_UNCONFIRMED';}
  else if(isEmpty(stats)){canFreeze=false;freezeDeferred='STATS_EMPTY';}
 }
 const legacy=legacyIds({badgeIds:computeBadgeIds(stats||{}),flags:[daily,stats?.ghostTitles,sparkProfile?.badges]});
 const p=plan({account:key,snapshot,awards,legacy,equipped:stats?.nick||null,facts:{sparkProfile},canFreeze});
 let snapshotError=null;
 if(p.snapshot){
  try{await sRef.set(p.snapshot);}catch(e){/* a concurrent device froze it first, or rules deny: re-read decides */}
  try{snapshot=(await sRef.get()).val();}catch(e){snapshot=null;}
  if(!snapshot)snapshotError='SNAPSHOT_UNAVAILABLE';
 }
 // New awards do not depend on the snapshot (rules check ownership, add-only and Spark evidence).
 const added=[],failed=[];
 for(const[id,record]of Object.entries(p.add)){
  try{await aRef.child(id).set(record);added.push(id);}
  catch(e){let exists=false;try{exists=(await aRef.child(id).get()).exists();}catch(_){}if(!exists)failed.push(id);}
 }
 try{awards=(await aRef.get()).val()||{};}catch(e){}
 const error=snapshotError||(failed.length?'AWARD_NOT_SAVED':null);
 return{status:error?'failed':'ok',...(error?{error}:{}),...(failed.length?{failed}:{}),...(freezeDeferred?{freezeDeferred}:{}),snapshot:snapshot||null,awards,added,frozen:!!(p.snapshot&&snapshot&&!snapshotError)};
}
// What the UI shows: snapshot (retained) + awards, never fewer than before.
function view({snapshot,awards,equipped=null}){
 const retained=Object.fromEntries(Object.entries(snapshot?.earned||{}).map(([id,r])=>[id,{earned:true,at:r.at}]));
 return Compat.read({flags:[retained,awards||{}],equipped:equipped??snapshot?.equipped??null});
}
module.exports={ROOT,MIGRATION_ID,JUDGES,RATE_RULES,legacyIds,judge,plan,sync,view};
