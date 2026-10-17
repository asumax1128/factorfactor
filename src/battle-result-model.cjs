'use strict';
// Pure presentation model for the A / B(新B=b2) battle result summary.
// Only facts that are present in already-confirmed data are emitted. Nothing is inferred:
// a row needs a value for EVERY player, a highlight needs the exact events that show it.
const fin=n=>typeof n==='number'&&Number.isFinite(n);
const sec=ms=>(ms/1000).toFixed(1);
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const leadOf=(scores,me,ids)=>Math.sign(scores[me]-Math.max(...ids.filter(u=>u!==me).map(u=>scores[u])));
// last lead exchange; a tie between two leaders is bridged (same rule as the existing graphs)
function lastReversal(frames,me,ids){let last=0,out=null;for(const f of frames){const l=leadOf(f.scores,me,ids);if(l&&last&&l!==last)out={frame:f,toMe:l>0};if(l)last=l}return out}
function runOf(flags){let best=0,bi=-1,cur=0;flags.forEach((ok,i)=>{cur=ok?cur+1:0;if(cur>best){best=cur;bi=i}});return best?{len:best,from:bi-best+1,to:bi}:null}
function pick(cands){const used=new Set(),out=[];for(const c of cands){if(!c)continue;if(c.refs.some(r=>used.has(r)))continue;c.refs.forEach(r=>used.add(r));const{refs,...rest}=c;out.push(rest);if(out.length===3)break}return out}
function rank(ids,score,given){if(given&&ids.every(u=>fin(given[u])))return given;const o=[...ids].sort((a,b)=>score[b]-score[a]),r={};o.forEach((u,i)=>{r[u]=i&&score[u]===score[o[i-1]]?r[o[i-1]]:i+1});return r}
function row(id,label,unit,ids,get,extra={}){const values={};for(const u of ids){const v=get(u);if(!fin(v))return null;values[u]=v}return{id,label,unit,values,...extra}}

function buildA({me,ids,report,claims}){
 const ok=!!report&&report.consistent===true&&Array.isArray(report.events);
 const score=report&&report.scores?report.scores:null;
 const rows=[],hl=[];let hidden=!ok;const add=r=>{rows.push(r);if(!r)hidden=true};
 if(score)add(row('score','得点','点',ids,u=>score[u]));else hidden=true;
 let wins=null;
 if(ok){
  wins=Object.fromEntries(ids.map(u=>[u,report.events.filter(e=>e.winner===u).length]));
  add(row('won','取った問題','問',ids,u=>wins[u],{note:`${report.events.length}問中`}));
 }
 if(report&&report.best)add(row('combo','最大コンボ','',ids,u=>report.best[u]));else hidden=true;
 if(ok){
  const judged=report.events.filter(e=>e.winner);const hasJ=judged.every(e=>typeof claims?.[e.question-1]?.j==='string');
  if(hasJ&&judged.length)add(row('perfect','Perfect','回',ids,u=>judged.filter(e=>e.winner===u&&claims[e.question-1].j==='Perfect').length));else hidden=true;
  add(row('time','平均解答時間','秒',ids,u=>{const t=report.events.filter(e=>e.winner===u&&fin(e.ms)).map(e=>e.ms);return t.length?Math.round(mean(t))/1000:null},{better:'low',note:'獲得した問題の平均解答時間（取れなかった問題の時間は記録されません）',decimals:1}));
  const rev=lastReversal(report.events.map(e=>({q:e.question,scores:e.totals})),me,ids);
  const mine=report.events.filter(e=>e.winner===me);
  const run=runOf(report.events.map(e=>e.winner===me));
  const fast=mine.filter(e=>fin(e.ms)).sort((a,b)=>a.ms-b.ms)[0];
  const big=[...mine].sort((a,b)=>b.pts-a.pts)[0];
  const range=(a,b)=>{const r=[];for(let i=a;i<=b;i++)r.push('q'+i);return r};
  hl.push(rev&&{id:'reversal',title:'リード交代',tag:`第${rev.frame.q}問`,detail:`${rev.toMe?'あなたがリードを奪った':'相手がリードを奪った'}（以後リード交代なし）`,refs:['q'+rev.frame.q]});
  hl.push(run&&run.len>=2&&run.len===report.best?.[me]&&{id:'combo',title:`${run.len}問連続で獲得`,tag:`第${run.from+1}〜${run.to+1}問`,detail:'連続して正解を取った区間',refs:range(run.from+1,run.to+1)});
  hl.push(fast&&{id:'fast',title:'最速で獲得した問題',tag:`第${fast.question}問`,detail:`${sec(fast.ms)}秒`+(typeof claims?.[fast.question-1]?.j==='string'?` ・ ${claims[fast.question-1].j}`:''),refs:['q'+fast.question]});
  hl.push(big&&big.pts>0&&{id:'big',title:'最大得点の問題',tag:`第${big.question}問`,detail:`+${big.pts}点`,refs:['q'+big.question]});
 }
 return{rows:rows.filter(Boolean),hl:pick(hl),extras:[],analysis:ok,hidden};
}

function buildB({me,ids,game,trace}){
 const S=game&&game.states,rows=[],hl=[],extras=[];
 if(!S||!ids.every(u=>S[u]))return{rows:[],hl:[],extras:[],analysis:false,hidden:true};
 const hist=u=>Array.isArray(S[u].hist)?S[u].hist:null,okH=u=>(hist(u)||[]).filter(h=>h.ok);
 rows.push(row('score','得点','点',ids,u=>S[u].score));
 rows.push(row('correct','正解数','問',ids,u=>S[u].c));
 rows.push(row('combo','最大コンボ','',ids,u=>S[u].best));
 rows.push(row('perfect','Perfect','回',ids,u=>fin(S[u].perfects)?S[u].perfects:hist(u)?okH(u).filter(h=>h.j==='Perfect').length:null));
 rows.push(row('time','平均解答時間','秒',ids,u=>{const t=okH(u).filter(h=>fin(h.ms)).map(h=>h.ms);return hist(u)&&t.length?Math.round(mean(t))/1000:null},{better:'low',note:'正解した問題の平均解答時間',decimals:1}));
 rows.push(row('wrong','誤答','回',ids,u=>hist(u)?hist(u).filter(h=>h.ok===false&&!h.timeout).length:null,{better:'low'}));
 rows.push(row('timeout','時間切れ','回',ids,u=>hist(u)?hist(u).filter(h=>h.timeout).length:null,{better:'low'}));
 // method-specific; "sent" is a quantity of cards that reached the opponent's queue, never damage dealt
 extras.push(row('sent','送信お邪魔カード','枚',ids,u=>S[u].ojSent??0,{note:'送った量です。相手に与えたダメージではありません'}));
 extras.push(row('cancel','相殺','枚',ids,u=>S[u].cancelTotal??0));
 extras.push(row('freeze','FREEZE使用','回',ids,u=>S[u].spUsed??0));
 const mine=hist(me)||[];
 const rev=trace&&trace.consistent?lastReversal(trace.rows.map(r=>({id:r.id,at:r.at,scores:r.scores})),me,ids):null;
 const big=trace&&trace.consistent?trace.rows.filter(r=>r.uid===me&&fin(r.gain)).sort((a,b)=>b.gain-a.gain)[0]:null;
 const best=S[me].best,run=runOf(mine.map(h=>!!h.ok)),located=run&&run.len===best;
 const fast=mine.map((h,i)=>({h,i})).filter(x=>x.h.ok&&fin(x.h.ms)).sort((a,b)=>a.h.ms-b.h.ms)[0];
 const range=(a,b)=>{const r=[];for(let i=a;i<=b;i++)r.push('q'+i);return r};
 hl.push(rev&&{id:'reversal',title:'リード交代',tag:`${sec(rev.frame.at-trace.startAt)}秒`,detail:`${rev.toMe?'あなたがリードを奪った':'相手がリードを奪った'}（以後リード交代なし）`,refs:['r'+rev.frame.id]});
 hl.push(best>=2&&{id:'combo',title:`最大${best}コンボ`,tag:located?`第${run.from+1}〜${run.to+1}問`:'',detail:located?'連続して正解した区間':'この試合での最大',refs:located?range(run.from+1,run.to+1):['combo']});
 hl.push(fast&&{id:'fast',title:'最速解答',tag:`第${fast.i+1}問`,detail:`${sec(fast.h.ms)}秒`+(typeof fast.h.j==='string'?` ・ ${fast.h.j}`:''),refs:['q'+(fast.i+1)]});
 hl.push(big&&{id:'big',title:'最大の得点',tag:`${sec(big.at-trace.startAt)}秒`,detail:`+${big.gain}点`,refs:['r'+big.id]});
 hl.push(fin(S[me].minHp)&&S[me].minHp<100&&{id:'minhp',title:'HPの最低値',tag:`${Math.round(S[me].minHp)}%`,detail:`HPが最小${Math.round(S[me].minHp)}%まで低下した`,refs:['hp']});
 return{rows:rows.filter(Boolean),hl:pick(hl),extras:extras.filter(Boolean),analysis:!!(trace&&trace.consistent),hidden:rows.some(r=>!r)||extras.some(r=>!r)};
}

// input: {kind:'A'|'B', me, ids, names:{uid:name}, outcome:'w'|'l'|'d', rank?, reasonText,
//         A:{report,claims}  |  B:{game,trace}}
function build(input){
 const{kind,me,ids,names={},outcome}=input;
 if(!['A','B'].includes(kind)||!me||!Array.isArray(ids)||!ids.includes(me))return null;
 const part=kind==='A'?buildA({me,ids,report:input.A?.report,claims:input.A?.claims}):buildB({me,ids,game:input.B?.game,trace:input.B?.trace});
 const sc=Object.fromEntries(ids.map(u=>[u,kind==='A'?input.A?.report?.scores?.[u]:input.B?.game?.states?.[u]?.score]));
 const haveScore=ids.every(u=>fin(sc[u])),ranks=haveScore||input.rank?rank(ids,haveScore?sc:{},input.rank):{};
 const order=[me,...ids.filter(u=>u!==me)];
 const players=order.map((u,i)=>({uid:u,name:names[u]||'プレイヤー',me:u===me,tone:i,rank:ranks[u]??null,score:haveScore?sc[u]:null}));
 const multi=ids.length>2,place=ranks[me]??null;
 const result=outcome==='w'?'win':outcome==='d'?'draw':'lose';
 const tiles=[];
 const get=id=>part.rows.find(r=>r.id===id);
 if(haveScore)tiles.push({id:'score',label:'得点',value:sc[me],unit:'点'});
 for(const[id,label]of kind==='A'?[['won','取った問題'],['combo','最大コンボ'],['perfect','Perfect']]:[['correct','正解数'],['combo','最大コンボ'],['perfect','Perfect']]){const r=get(id);if(r)tiles.push({id,label,value:r.values[me],unit:r.unit})}
 return{kind,methodLabel:kind==='A'?'A方式':'B方式',outcome:result,multi,place,word:result==='win'?'WIN!':result==='draw'?'DRAW':multi&&place?`${place}位`:'LOSE',
  reasonText:input.reasonText||'',players,tiles,rows:part.rows,extras:part.extras,highlights:part.hl,
  hiddenRows:part.hidden,analysisAvailable:part.analysis};
}
module.exports={build,pick,lastReversal,runOf,rank};
