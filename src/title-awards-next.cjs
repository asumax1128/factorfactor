'use strict';
// A conservative dry-run planner, not a Firebase writer or an award authority.
const catalog=require('./title-catalog-next.json'),compat=require('./title-compat-next.cjs'),B=require('./b-result.cjs');
const clone=x=>JSON.parse(JSON.stringify(x)),number=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0?x:null;
function matchFacts(proofs,account){
 const unique=new Map(),rejected=[];
 for(const p of proofs){const g=p.game,parts=p.participants||{};
  if(p.source!=='confirmed-human-online'||!g?.result||g.rules!=='b2'||!g.ids?.includes(p.uid)||parts[p.uid]?.account!==account||g.ids.some(u=>parts[u]?.kind!=='human')||g.ids.some(u=>u!==p.uid&&parts[u]?.account===account)||!B.build(g).consistent){rejected.push({id:g?.id||null,reason:'確定した人間同士のB2試合として検証できない（CPU・自己ゴースト・欠損を含む）'});continue;}
  const key=g.id,signature=JSON.stringify({game:g,participants:parts,uid:p.uid});if(unique.has(key)){if(unique.get(key).signature!==signature)throw Error('CONFLICTING_MATCH_PROOF');continue;}
  const s=g.states[p.uid],hist=Object.values(s.hist||{});if(hist.filter(h=>h.ok).length!==s.c){rejected.push({id:key,reason:'正解数と確定履歴が一致しない'});continue;}
  unique.set(key,{signature,id:key,mode:'B',win:!g.result.draw&&g.result.winner===p.uid,loss:!g.result.draw&&g.result.winner!==p.uid,hist,best:s.best,perfects:hist.filter(h=>h.ok&&h.j==='Perfect').length,opponents:g.ids.filter(u=>u!==p.uid).map(u=>parts[u]?.account).filter(Boolean),sp:s.spUsed||0,oj:s.ojSent||0});
 }
 return{matches:[...unique.values()],rejected};
}
function plan({account,legacyEarned=[],flags=[],equipped=null,confirmedMatches=[],login=null,history=null,blockedAttackEvents=[]}={}){
 const prior=compat.read({legacyEarned,flags,equipped}),{matches,rejected}=matchFacts(confirmedMatches,account),wins=matches.filter(m=>m.win),losses=matches.filter(m=>m.loss),perfects=matches.reduce((n,m)=>n+m.perfects,0),allHist=matches.flatMap(m=>m.hist),vs=new Map();
 matches.forEach(m=>m.opponents.forEach(k=>vs.set(k,(vs.get(k)||0)+1)));
 const facts=new Map(),prove=(id,ok,source)=>{if(ok)facts.set(id,source)};
 prove('online_first',matches.length>=1,'confirmedMatches:distinct game.id');prove('first',wins.length>=1,'confirmedMatches:result.winner');
 prove('wins100_ab',wins.length>=100,'confirmedMatches:B wins (A adapter not yet connected)');prove('games100',matches.length>=100,'confirmedMatches:distinct game.id');prove('games300',matches.length>=300,'confirmedMatches:distinct game.id');prove('lose50',losses.length>=50,'confirmedMatches:result');
 prove('rival20',[...vs.values()].some(n=>n>=20),'confirmedMatches:stable opponent account');prove('wide10',vs.size>=10,'confirmedMatches:distinct opponent account');prove('wide30',vs.size>=30,'confirmedMatches:distinct opponent account');
 for(const[n,id]of[[50,'perfect50'],[100,'perfect100'],[300,'perfect300'],[500,'perfect500'],[1000,'perfect1000']])prove(id,perfects>=n,'confirmedMatches:hist Perfect');
 prove('flash',allHist.some(h=>h.ok&&number(h.ms)!==null&&h.ms<=1000),'confirmedMatches:hist.ms');prove('flash3',matches.some(m=>m.hist.filter(h=>h.ok&&number(h.ms)!==null&&h.ms<=1000).length>=3),'confirmedMatches:hist.ms within one match');
 prove('combo20',matches.some(m=>m.best>=20),'confirmedMatches:best');prove('combo30',matches.some(m=>m.best>=30),'confirmedMatches:best');
 const noMiss=wins.filter(m=>m.hist.every(h=>h.ok));prove('nomiss',noMiss.length>=1,'confirmedMatches:B no errors/timeouts and winner');prove('nomiss10',noMiss.length>=10,'confirmedMatches:B no errors/timeouts and winner');prove('accuracy10',matches.some(m=>m.hist.length>=10&&m.hist.every(h=>h.ok)),'confirmedMatches:10 correct and zero errors/timeouts');
 prove('lv9',allHist.some(h=>h.ok&&h.lv===9&&h.j==='Perfect'),'confirmedMatches:hist Lv9 Perfect');prove('alllv',new Set(allHist.filter(h=>h.ok&&h.j==='Perfect'&&Number.isInteger(h.lv)&&h.lv>=1&&h.lv<=9).map(h=>h.lv)).size===9,'confirmedMatches:distinct Perfect levels 1..9');
 prove('sp3',matches.some(m=>m.sp>=3),'confirmedMatches:spUsed');prove('sp50',matches.reduce((n,m)=>n+m.sp,0)>=50,'confirmedMatches:spUsed');prove('ojama100',matches.reduce((n,m)=>n+m.oj,0)>=100,'confirmedMatches:ojSent cards');prove('ojama500',matches.reduce((n,m)=>n+m.oj,0)>=500,'confirmedMatches:ojSent cards');
 // Only explicit new attack event receipts. Legacy cancelTotal is an amount and
 // is deliberately absent from the planner's input contract.
 const eventIds=new Set(blockedAttackEvents.filter(e=>e.source==='confirmed-blocked-attack-event'&&matches.some(m=>m.id===e.matchId)&&typeof e.id==='string').map(e=>e.matchId+':'+e.id));prove('cancel500',eventIds.size>=500,'blockedAttackEvents:distinct matchId:eventId');prove('cancel2000',eventIds.size>=2000,'blockedAttackEvents:distinct matchId:eventId');
 if(login?.source==='saved-login-record'){for(const[id,k,n]of[['lb7','cards',1],['lb_cards7','cards',7],['lb30','n',30],['lb100','n',100]])prove(id,number(login[k])!==null&&login[k]>=n,'accounts/stats/login/'+k);}
 if(history?.source==='saved-historical-rating'){const e=number(history.easy),n=number(history.normal),peak=Math.max(e??-1,n??-1);for(const[id,min]of[['rgold',1580],['master1600',1600],['master1700',1700],['rmaster',1820],['master1900',1900]])prove(id,peak>=min,'saved historical EASY/NORMAL peak');for(const[d,p]of[['easy',e],['normal',n]]){prove(d+'_adept',p!==null&&p>=1730,'saved historical '+d+' peak');prove(d+'_master',p!==null&&p>=1820,'saved historical '+d+' peak');}prove('dual_master',e!==null&&n!==null&&e>=1820&&n>=1820,'both saved historical peaks');}
 const rows=catalog.titles.map(t=>({...t,status:prior.earned[t.id]?'retained':facts.has(t.id)?t.stars>=4?'pending-reveal-approval':'proven':'unverified',evidence:prior.earned[t.id]?.source||facts.get(t.id)||'判定根拠不足／対象adapter未接続'}));
 return{schemaVersion:1,dryRun:true,rows,rejected,retained:prior.earned,archived:prior.archived,equipped,hidden:{id:catalog.hidden.id,retained:prior.hiddenOwned,eligible:prior.fiveStarCount>=15,evidence:'distinct retained five-star IDs (tour1 included); no pending award counted'}};
}
function applyDraft(existing,proposal,appliedAt){
 if(!proposal?.dryRun||number(appliedAt)===null||appliedAt<=0)throw Error('EXPLICIT_MIGRATION_TIMESTAMP_REQUIRED');
 const out=clone(existing||{}),add=(id,old,source)=>{if(out[id])return;const at=old?.at||appliedAt;out[id]={earned:true,at,dateOrigin:old?.at?'original':'migration-applied',dateWasUnknown:!old?.at,source};};
 for(const[id,r]of Object.entries(proposal.retained))add(id,r,r.source);
 for(const r of proposal.rows)if(r.status==='proven')add(r.id,null,r.evidence);
 if(proposal.hidden.retained||proposal.hidden.eligible)add(proposal.hidden.id,proposal.retained[proposal.hidden.id],'distinct retained five-stars');
 return out;
}
module.exports={plan,applyDraft};
