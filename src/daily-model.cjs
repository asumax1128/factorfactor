const DAY=86400000,SHIFT=32400000,GRACE=1200000;
const epoch=t=>Math.floor((t+SHIFT)/DAY);
const date=d=>new Date(d*DAY).toISOString().slice(0,10);
function sortKey(r){return `${2000000-r.score}:${r.cleared?'0':'1'}:${1000000000+(r.cleared?r.elapsed:100-r.correct)}:${10000000000000+r.confirmedAt}:${r.key||''}`}
function compare(a,b){return b.score-a.score||Number(b.cleared)-Number(a.cleared)||(a.cleared&&b.cleared?a.elapsed-b.elapsed:b.correct-a.correct)||a.confirmedAt-b.confirmedAt||((a.key||'')<(b.key||'')?-1:(a.key||'')>(b.key||'')?1:0)}
function best(previous,next){return !previous||compare(next,previous)<0?next:previous}
function reserve(ledger,attempt){
 const next=JSON.parse(JSON.stringify(ledger||{slots:{}}));next.slots ||= {};
 const existing=Object.entries(next.slots).find(([,a])=>a.id===attempt.id);if(existing)return {ledger:next,slot:Number(existing[0]),attempt:existing[1]};
 const slot=Object.keys(next.slots).length;if(slot>=3)throw Error('今日の挑戦は合計3回までです');
 next.slots[slot]=attempt;return {ledger:next,slot,attempt};
}
const finalizable=(d,now)=>now>=(d+1)*DAY-SHIFT+GRACE;
const awardIds={easy:'daily_easy_king',normal:'daily_normal_king',hard:'daily_hard_king'};
// Each division title is permanent and independent. The composite (天下統一, daily_king) is NOT derived from them: it needs
// the three division wins on ONE JST day, which only the immutable finals of that day can prove (see kingDay).
function titles(had,d){return {...had,[awardIds[d]]:true}}
// finals = { easy, normal, hard } records of ONE day (dailyV2/finals/<day>/<division>). True only when every division's
// final names this account AND carries that same day (a missing or different day is "unknown": never granted).
const isDay=x=>Number.isInteger(x);
// 天下統一 is granted ONLY for days on or after the Ver.6.0 public release day (JST). The threshold is a constant of the program and the
// day comes from the immutable finals (server-confirmed), so a device clock can neither move the threshold nor fake a day; days before
// the release (test records made before the public start) can never grant it. There is no retroactive grant of any kind.
const KING_FROM_DAY=Math.floor(Date.UTC(2026,9,24)/DAY);   // 2026-10-24 JST (epoch(JST midnight of that date) === this number)
function kingDay(day,finals,key,from=KING_FROM_DAY){
 if(!isDay(day)||day<from||typeof key!=='string'||!key||!finals)return false;
 return Object.keys(awardIds).every(d=>{const f=finals[d];return !!f&&typeof f==='object'&&f.key===key&&isDay(f.day)&&f.day===day});
}
module.exports={DAY,SHIFT,GRACE,epoch,date,sortKey,compare,best,reserve,finalizable,awardIds,titles,kingDay,KING_FROM_DAY};
