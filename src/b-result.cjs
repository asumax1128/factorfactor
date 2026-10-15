'use strict';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
// Consume one final atomic game snapshot, never infer points or elapsed time.
function build(game){
 const bad=reason=>({consistent:false,reason});
 if(!game?.result)return bad('結果はまだ確定していません。');
 const t=game.scoreTrace,ids=game.ids;
 if(!t||t.version!==1||!t.complete||!Array.isArray(ids)||ids.length<2)return bad('この試合には完全な得点履歴がありません。');
 const events=Array.isArray(t.events)?t.events:Object.values(t.events||{}),rows=[];let previous=null;
 for(const e of events){
  if(previous&&e.id===previous.id){if(JSON.stringify(e)!==JSON.stringify(previous))return bad('履歴の重複内容が一致しません。');continue;}
  if(!Number.isInteger(e.id)||e.id!==(previous?previous.id+1:0)||!finite(e.at)||e.at<(previous?.at??game.startAt)||e.at>game.result.at||ids.some(u=>!finite(e.scores?.[u])||e.scores[u]<0))return bad('得点履歴が不足しています。');
  if(!previous&&(e.at!==game.startAt||ids.some(u=>e.scores[u]!==0)))return bad('開始時の記録が不足しています。');
  if(previous&&(!ids.includes(e.uid)||!finite(e.gain)||e.gain<0||ids.some(u=>e.scores[u]!==previous.scores[u]+(u===e.uid?e.gain:0))))return bad('得点履歴の整合性を確認できません。');
  rows.push(e);previous=e;
 }
 if(!previous||previous.id!==t.seq||ids.some(u=>previous.scores[u]!==game.states?.[u]?.score))return bad('最終得点と履歴が一致しません。');
 return {consistent:true,ids,startAt:game.startAt,endAt:game.result.at,revision:t.seq,rows,final:previous.scores,summary:Object.fromEntries(ids.map(u=>{const s=game.states[u],h=s.hist||[];return[u,{correct:s.c,wrong:h.filter(x=>x.ok===false&&!x.timeout).length,timeouts:h.filter(x=>x.timeout).length,best:s.best,perfects:s.perfects??h.filter(x=>x.ok&&x.j==='Perfect').length,attack:s.ojSent??0,cancel:s.cancelTotal??0,freeze:s.spUsed??0}]}))};
}
module.exports={build};
