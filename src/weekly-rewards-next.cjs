'use strict';
// A receipt consumer, NOT a source of shared boss truth. Only an immutable
// authority manifest may enter this boundary; client checkpoints are not proof.
const {ROOT,monday}=require('./weekly-next.cjs'),{tx}=require('./online-spark-client.cjs');
const proof=m=>JSON.stringify(Object.keys(m).sort().map(k=>[k,m[k]]));
const clone=x=>JSON.parse(JSON.stringify(x)),KINDS=['kill','lastHit','final'];
function validate(m,account,week,kind){
 if(!m||m.version!==1||m.source!=='weekly-authority-v1'||m.account!==account||m.week!==week||m.kind!==kind||!KINDS.includes(kind)||!monday(week)||typeof m.id!=='string'||!m.id||!Number.isSafeInteger(m.at)||m.at<=0||typeof m.boss!=='string'||!m.boss||!Number.isSafeInteger(m.rank)||m.rank<1||!Number.isFinite(m.damage)||m.damage<=0||!Number.isFinite(m.hpMax)||m.hpMax<=0||!Number.isInteger(m.rage)||m.rage<0||!Number.isFinite(m.exp)||m.exp<0)throw Error('INVALID_WEEKLY_AUTHORITY_MANIFEST');
 const expected=kind==='kill'?Math.round((20+Math.min(60,Math.round(m.damage/m.hpMax*400))+(m.rank===1?30:m.rank<=3?15:0))*(m.rage>=2?2:m.rage>=1?1.5:1)):0;
 if(m.exp!==expected||kind!=='final'&&m.defeated!==true||kind==='lastHit'&&m.lastHitAccount!==account||kind==='final'&&m.at<Date.parse(week+'T00:00:00+09:00')+7*86400000)throw Error('UNCONFIRMED_WEEKLY_OUTCOME');
 return m;
}
function apply(data,manifest){
 const m=validate(manifest,manifest.account,manifest.week,manifest.kind),n=clone(data||{});
 const receipts=n.settlements ||= {},week=receipts[m.week] ||= {},old=week[m.kind];
 if(old){if(old.id!==m.id||old.proof!==proof(m))throw Error('CONFLICTING_WEEKLY_MANIFEST');return n;}
 const s=n.stats ||= {},w=s.wk ||= {};w.done ||= {};
 const marker=m.kind==='kill'?'k':m.kind==='final'?'s':null;
 // Existing historical k/s is evidence of a prior award, not an extra reward.
 const imported=marker?String(w.done[m.week]||'').includes(marker):m.legacyCovered===true;
 const before=s.exp||0;
 if(!imported){
  if(m.kind==='kill'){w.boss ||= {};w.kills=(w.kills||0)+1;w.boss[m.boss]=(w.boss[m.boss]||0)+1;if(m.rage)w.rageKills=(w.rageKills||0)+1;s.exp=before+m.exp;}
  if(m.kind==='lastHit')w.lastHit=(w.lastHit||0)+1;
  if(m.kind==='final'&&m.rank===1)w.ace=(w.ace||0)+1;
  if(marker)w.done[m.week]=String(w.done[m.week]||'')+marker;
 }
 week[m.kind]={id:m.id,proof:proof(m),sourceAt:m.at,exp:imported?0:m.exp,imported,before,after:s.exp||0};
 return n;
}
async function claim({db,uid,account,week}){
 if(!monday(week))throw Error('INVALID_WEEK');
 const clock=db.ref(`${ROOT}/clock/${uid}`);await clock.set({'.sv':'timestamp'});const now=(await clock.get()).val();if(!Number.isFinite(now))throw Error('SERVER_CLOCK_UNAVAILABLE');
 const manifests=(await db.ref(`${ROOT}/awards/${account}/${week}`).get()).val()||{},result=[];
 for(const kind of KINDS){const m=manifests[kind];if(!m)continue;validate(m,account,week,kind);if(m.at>now)continue;await tx(db.ref(`${ROOT}/games/${account}`),data=>apply(data,m));result.push(m.id);}
 return result;
}
module.exports={validate,apply,claim};
