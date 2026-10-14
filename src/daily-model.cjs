const DAY=86400000,SHIFT=32400000,GRACE=1200000;
const epoch=t=>Math.floor((t+SHIFT)/DAY);
const date=d=>new Date(d*DAY).toISOString().slice(0,10);
function sortKey(r){return `${2000000-r.score}:${r.cleared?'0':'1'}:${1000000000+(r.cleared?r.elapsed:100-r.correct)}:${10000000000000+r.confirmedAt}`}
function compare(a,b){return b.score-a.score||Number(b.cleared)-Number(a.cleared)||(a.cleared&&b.cleared?a.elapsed-b.elapsed:b.correct-a.correct)||a.confirmedAt-b.confirmedAt}
function best(previous,next){return !previous||compare(next,previous)<0?next:previous}
function reserve(ledger,attempt){
 const next=JSON.parse(JSON.stringify(ledger||{slots:{}}));next.slots ||= {};
 const existing=Object.entries(next.slots).find(([,a])=>a.id===attempt.id);if(existing)return {ledger:next,slot:Number(existing[0]),attempt:existing[1]};
 const slot=Object.keys(next.slots).length;if(slot>=3)throw Error('今日の挑戦は合計3回までです');
 next.slots[slot]=attempt;return {ledger:next,slot,attempt};
}
const finalizable=(d,now)=>now>=(d+1)*DAY-SHIFT+GRACE;
const awardIds={easy:'daily_easy_king',normal:'daily_normal_king',hard:'daily_hard_king'};
function titles(had,d){const next={...had,[awardIds[d]]:true};if(Object.values(awardIds).every(id=>next[id]))next.daily_king=true;return next}
module.exports={DAY,SHIFT,GRACE,epoch,date,sortKey,compare,best,reserve,finalizable,awardIds,titles};
