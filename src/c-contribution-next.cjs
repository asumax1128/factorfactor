'use strict';
// Read-only projection of a COMPLETE finalized authority log. Does not interpret
// legacy sent/covers/cancelTotal/dq or distribute shared team HP to individuals.
const METRICS=['attackDamage','attackCards','cancelUnits','blockedEvents','coverUnits','healedHP'];
function project({final,events=[]}={}){
 const fail=reason=>({consistent:false,reason,players:null,timeline:null});
 if(final?.source!=='c-authority-v1'||final.mode!=='C'||!final.gameId||!Array.isArray(final.ids)||new Set(final.ids).size!==4||!Number.isInteger(final.revision)||final.revision<0||!Number.isFinite(final.endAt))return fail('C方式の確定終了記録がありません');
 const unique=new Map();
 for(const e of events){
  if(e.gameId!==final.gameId||!Number.isInteger(e.revision)||e.revision<1||e.revision>final.revision||!final.ids.includes(e.actor)||!Number.isFinite(e.at)||e.at>final.endAt)return fail('異なる試合・終了後・不正な確定イベント');
  const old=unique.get(e.revision);if(old&&JSON.stringify(old)!==JSON.stringify(e))return fail('同一revisionに矛盾するイベント');unique.set(e.revision,e);
 }
 if(unique.size!==final.revision)return fail('確定履歴に欠損があります');
 const players=Object.fromEntries(final.ids.map(id=>[id,Object.fromEntries(METRICS.map(k=>[k,0]))])),timeline=[];
 const effects=new Set();let lastAt=-Infinity;
 const num=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 for(let r=1;r<=final.revision;r++){
  const e=unique.get(r),s=players[e.actor],p=e.proof;
  if(!p||p.committed!==true||!p.eventId||p.gameId!==final.gameId||!final.ids.includes(p.recipient))return fail('受信・適用確定の証拠が不足しています');
  const effect=[e.actor,e.kind,p.recipient,p.eventId].join(':');if(effects.has(effect)||e.at<lastAt)return fail('重複効果または確定順序の矛盾');effects.add(effect);lastAt=e.at;
  if(e.kind==='attack'){
   if(p.sender!==e.actor||p.recipient===e.actor||p.phase!=='landed'||!num(p.damage)||!Number.isInteger(p.cards)||p.cards<0)return fail('送信試行や未適用攻撃は貢献に計上できません');
   s.attackDamage+=p.damage;s.attackCards+=p.cards;
  }else if(e.kind==='cancel'){
   if(p.recipient!==e.actor||p.phase!=='cancelled'||!num(p.units))return fail('相殺確定がありません');s.cancelUnits+=p.units;
  }else if(e.kind==='block'){
   if(p.recipient!==e.actor||p.phase!=='blocked')return fail('防御確定がありません');s.blockedEvents++;
  }else if(e.kind==='cover'){
   if(p.sender!==e.actor||p.phase!=='covered'||p.recipient===e.actor||final.teams?.[e.actor]===undefined||final.teams[e.actor]!==final.teams[p.recipient]||!num(p.units))return fail('味方によるカバー適用確定がありません');s.coverUnits+=p.units;
  }else if(e.kind==='heal'){
   // Only a dedicated, actor-bound heal operation is attributable. A batched HP
   // flush (including drain/damage) does not establish personal healing.
   if(p.recipient!==e.actor||p.phase!=='healed'||p.operation!=='individual-heal'||!num(p.before)||!num(p.after)||p.after>100||p.after<p.before)return fail('共有HP差分だけでは個人回復を証明できません');s.healedHP+=p.after-p.before;
  }else return fail('未対応の確定イベント');
  timeline.push({revision:r,at:e.at,actor:e.actor,kind:e.kind,values:{...s}});
 }
 return {consistent:true,gameId:final.gameId,revision:final.revision,players,timeline};
}
module.exports={project,METRICS};
