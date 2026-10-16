'use strict';
// Trusted-input adapter only; callers must load these inputs from protected paths.
const Catalog=require('../../src/title-catalog-next.json'),Cut=require('../../src/title-cutover-next.cjs'),Plan=require('../../src/title-awards-next.cjs'),Compat=require('../../src/title-compat-next.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
function evaluate({account,snapshot,onlineState={},weeklyStates=[],existing={},now}){
 Cut.validate(snapshot,account);if(!Number.isSafeInteger(now)||now<=0)throw Error('INVALID_TITLE_AUTHORITY_TIME');
 const confirmedMatches=[];
 for(const m of Object.values(onlineState.matches||{})){
  if(m.practice||m.selfGhost||m.bot||m.ghost||m.members?.some(x=>x.kind&&x.kind!=='human')||m.phase!=='settled'||!m.receipt||!onlineState.settlements?.[m.id]||m.mode!=='B'||m.game?.rules!=='b2'||!m.members?.some(x=>x.key===account)||new Set(m.members.map(x=>x.key)).size!==2)continue;
  const member=m.members.find(x=>x.key===account);confirmedMatches.push({source:'confirmed-human-online',uid:member.uid,game:m.game,participants:Object.fromEntries(m.members.map(x=>[x.uid,{account:x.key,kind:'human'}]))});
 }
 const player=onlineState.players?.[account],history=player?{source:'saved-historical-rating',easy:player.easy?.maxRating,normal:player.normal?.maxRating}:null;
 const proposal=Plan.plan({account,legacySnapshot:snapshot,confirmedMatches,history}),awards=copy(existing),proofs=new Map();
 // Acquisition and condition visibility are independent. Stars 4/5 may be proven
 // here; the unapproved reveal graph is never imported or activated.
 for(const row of proposal.rows)if(['proven','pending-reveal-approval'].includes(row.status))proofs.set(row.id,row.evidence);
 const runs=[],kills=[],finals=[];
 for(const w of weeklyStates){if(w?.version!==1||!w.week||!w.accounts)continue;for(const r of Object.values(w.runs||{}))if(r.account===account&&r.reservation?.id===r.id)runs.push({week:w.week,...r});const a=w.awards?.[account];if(a?.kill&&w.kill)kills.push({week:w.week,...a.kill});if(a?.final&&w.closed)finals.push({week:w.week,...a.final});}
 const unique=(xs,key)=>[...new Map(xs.map(x=>[key(x),x])).values()],allRuns=unique(runs,r=>r.week+':'+r.id),completed=allRuns.filter(r=>r.receipt?.completed&&r.status==='done'),wins=unique(kills,r=>r.week),ranks=unique(finals,r=>r.week),add=(id,ok,proof)=>{if(ok)proofs.set(id,proof)};
 add('wk1',allRuns.length>=1,'weekly authority: accepted reservation');add('wk_runs20',completed.length>=20,'weekly authority: 20 distinct completed receipts');
 for(const [id,n]of [['wkk1',1],['wkk5',5],['wkk10',10]])add(id,wins.length>=n,'weekly authority: distinct kill manifests');
 for(const [id,n]of [['wkace',1],['wkace5',5]])add(id,ranks.filter(r=>r.rank===1).length>=n,'weekly authority: closed rank-1 finals');
 for(const [id,n]of [['wkone',600],['wkone2',1200]])add(id,allRuns.some(r=>r.d>=n),'weekly authority: actual completed run damage');
 const touched=[...new Set(allRuns.map(r=>Date.parse(r.week+'T00:00:00+09:00')))].sort((a,b)=>a-b);let streak=0,best=0,last=null;for(const t of touched){streak=last!==null&&t-last===7*86400000?streak+1:1;best=Math.max(best,streak);last=t}
 for(const [id,n]of [['wkst3',3],['wkst5',5],['wkst10',10]])add(id,best>=n,'weekly authority: consecutive accepted weeks');
 add('wksup1',allRuns.some(r=>r.role==='sup'),'weekly authority: accepted supporter reservation');
 const chests=allRuns.reduce((n,r)=>n+(r.chests||0),0),support=allRuns.reduce((n,r)=>n+(r.sp||0),0);
 for(const [id,n]of [['wkchest1',1],['wkchest10',10]])add(id,chests>=n,'weekly authority: opened chests');
 for(const [id,n]of [['wksup100',100],['wksup500',500]])add(id,support>=n,'weekly authority: confirmed support points');
 add('wkrage',wins.some(r=>r.rage>=1),'weekly authority: kill manifest with rage');
 // Only catalog IDs are eligible; obsolete IDs remain preserved in prior awards.
 const allowed=new Set(Catalog.titles.map(t=>t.id));
 const retained=Cut.read(snapshot,account);for(const [id,r]of Object.entries(retained.earned))if(!awards[id])awards[id]={earned:true,at:r.at||now,dateWasUnknown:!r.at,dateOrigin:r.at?'original':'migration-applied',source:'immutable-cutover:'+snapshot.migrationId};
 for(const [id,source]of proofs)if(allowed.has(id)&&!awards[id])awards[id]={earned:true,at:now,dateWasUnknown:true,dateOrigin:'authority-confirmed-at',source};
 const state=Compat.read({flags:[awards],equipped:snapshot.equipped});if(state.fiveStarCount>=15&&!awards[Catalog.hidden.id])awards[Catalog.hidden.id]={earned:true,at:now,dateWasUnknown:true,dateOrigin:'authority-confirmed-at',source:'15 distinct stored five-star IDs'};
 return{awards,equipped:snapshot.equipped,archived:state.archived,proofs:Object.fromEntries([...proofs].filter(([id])=>allowed.has(id))),rejected:proposal.rejected,revealRulesActivated:false};
}
async function reconcile({database,account}){
 const Store=require('./emulator-store.cjs');Store.assertEmulator(database);const{ref,get}=require('firebase/database');
 if(!/^a[a-z0-9_]+$/.test(account))throw Error('INVALID_ACCOUNT');
 const now=await Store.create({database}).clock(),snapshot=(await get(ref(database,`games/factor/titleNextV1/snapshots/${account}`))).val();Cut.validate(snapshot,account);
 const onlineState=(await get(ref(database,'games/factor/onlineRatedV2/privateState'))).val()||{},weeks=(await get(ref(database,Store.ROOT+'/weekly'))).val()||{};
 const weeklyStates=Object.values(weeks).map(v=>v.state).filter(Boolean),target=ref(database,`games/factor/titleNextV1/awards/${account}`);
 return Store.atomic(target,existing=>evaluate({account,snapshot,onlineState,weeklyStates,existing:existing||{},now}).awards);
}
module.exports={evaluate,reconcile};
