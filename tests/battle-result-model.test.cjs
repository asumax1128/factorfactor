const {test}=require('node:test'),a=require('node:assert/strict'),E=require('../server/online-rated/engine.cjs'),BR=require('../src/b-result.cjs'),AR=require('../src/a-result.cjs'),M=require('../src/battle-result-model.cjs');
const names={a:'あなた',b:'ソラ',c:'ミナト',d:'ハル'};
// ---- real new-B engine game ----
const begin=(ids=['a','b'])=>E.begin('trace','easy','B',ids,'fixed',1000,{rules:'b2',duration:90});
function pairOf(g,u,right=true){const v=E.view(g,u),api=E.runtime(g).api;for(let i=0;i<v.tiles.length;i++)for(let j=i+1;j<v.tiles.length;j++)if(api.polyEqual(api.multiply(v.tiles[i].factor,v.tiles[j].factor),v.poly)===right)return{type:'answer',seq:(g.seq[u]||0)+1,question:v.question,tiles:[v.tiles[i].id,v.tiles[j].id]}}
function play(ids,plan){let g=begin(ids),t=2000;for(const [u,right,gap] of plan){t+=gap;g=E.step(g,u,{type:'heartbeat'},t);const c=pairOf(g,u,right);g=E.step(g,u,c,t)}for(const u of g.ids)g.states[u].hp=Math.max(g.states[u].hp,1);return E.step(g,ids[0],{type:'heartbeat'},g.endAt)}
const plan=[['a',true,900],['b',true,1500],['b',true,1200],['a',true,2500],['a',true,800],['a',false,900],['b',true,3000],['a',true,700],['a',true,600],['b',false,1000],['a',true,1800]];
function model(g,over={}){return M.build({kind:'B',me:'a',ids:g.ids,names,outcome:'w',reasonText:'R',B:{game:g,trace:BR.build(g)},...over})}
test('B: every number comes from confirmed state/hist/trace and equals it exactly',()=>{
 const g=play(['a','b'],plan),m=model(g),S=g.states,row=id=>m.rows.find(r=>r.id===id);
 for(const u of ['a','b']){a.equal(row('score').values[u],S[u].score);a.equal(row('correct').values[u],S[u].c);a.equal(row('combo').values[u],S[u].best);a.equal(row('wrong').values[u],S[u].hist.filter(h=>h.ok===false&&!h.timeout).length);a.equal(row('timeout').values[u],S[u].hist.filter(h=>h.timeout).length);
  const ok=S[u].hist.filter(h=>h.ok);a.equal(row('time').values[u],Math.round(ok.reduce((x,h)=>x+h.ms,0)/ok.length)/1000)}
 for(const[id,k]of [['sent','ojSent'],['cancel','cancelTotal'],['freeze','spUsed']])for(const u of['a','b'])a.equal(m.extras.find(r=>r.id===id).values[u],S[u][k]??0);
 a.match(m.extras.find(r=>r.id==='sent').note,/与えたダメージではありません/);
 a(!JSON.stringify(m).includes('被ダメージ'),'dmgTaken only counts wrong-answer loss, so it is never shown as damage');
 a.equal(m.word,'WIN!');a.equal(m.players[0].me,true);a.equal(m.players[0].tone,0);
 a(m.highlights.length<=3);a.equal(new Set(m.highlights.map(h=>h.id)).size,m.highlights.length);
 const fast=m.highlights.find(h=>h.id==='fast');if(fast){const best=Math.min(...S.a.hist.filter(h=>h.ok).map(h=>h.ms));a.match(fast.detail,new RegExp('^'+(best/1000).toFixed(1)+'秒'))}
 const big=m.highlights.find(h=>h.id==='big');if(big)a.equal(big.detail,'+'+Math.max(...BR.build(g).rows.filter(r=>r.uid==='a').map(r=>r.gain))+'点');
});
test('B: reversal is the last lead exchange of the confirmed trace, stated without cause',()=>{
 const g=play(['a','b'],plan),tr=BR.build(g),m=model(g),rv=m.highlights.find(h=>h.id==='reversal'),r=M.lastReversal(tr.rows.map(x=>({id:x.id,at:x.at,scores:x.scores})),'a',['a','b']);
 if(r){a.equal(rv.tag,((r.frame.at-tr.startAt)/1000).toFixed(1)+'秒');a.match(rv.detail,r.toMe?/あなたがリードを奪った/:/相手がリードを奪った/)}else a.equal(rv,undefined);
 for(const h of m.highlights)a(!/逃げ切|勝敗を分け|そのため|ので/.test(h.title+h.detail),'no causal wording: '+h.detail);
});
test('B: no trace => no reversal/biggest-gain/analysis, rows still come from final states',()=>{
 const g=play(['a','b'],plan);delete g.scoreTrace;const m=model(g,{B:{game:g,trace:BR.build(g)}});
 a.equal(m.analysisAvailable,false);a(!m.highlights.some(h=>['reversal','big'].includes(h.id)));a.equal(m.rows.find(r=>r.id==='score').values.a,g.states.a.score);
});
test('B: a player without history hides every history-based row (nothing guessed), others stay',()=>{
 const g=play(['a','b'],plan);delete g.states.b.hist;const m=model(g,{B:{game:g,trace:null}}),ids=m.rows.map(r=>r.id);
 for(const x of ['time','wrong','timeout'])a(!ids.includes(x),x);for(const x of ['score','correct','combo'])a(ids.includes(x));a.equal(m.hiddenRows,true);
});
test('B: 3 players keep every rank/score; ties share a rank',()=>{
 const g=play(['a','b','c'],[['a',true,900],['b',true,1000],['c',true,1100],['a',true,1500]]),m=model(g,{ids:g.ids,rank:null});
 a.equal(m.multi,true);a.equal(m.players.length,3);const sc=Object.fromEntries(g.ids.map(u=>[u,g.states[u].score]));
 for(const p of m.players)a.equal(p.score,sc[p.uid]);a.equal(m.place,[...g.ids].sort((x,y)=>sc[y]-sc[x]).indexOf('a')+1);
 const t=M.rank(['a','b','c'],{a:5,b:5,c:1});a.deepEqual(t,{a:1,b:1,c:3});
 a.equal(M.build({kind:'B',me:'a',ids:g.ids,outcome:'l',rank:{a:2,b:1,c:3},B:{game:g,trace:null}}).word,'2位');
});
// ---- A (claims + a-result, the same objects the room produces) ----
function aFixture(winners,{judge='Great',ms=3000,noJ=false}={}){
 const ids=['a','b'],cb={a:0,b:0},sc={a:0,b:0},best={a:0,b:0},log=[],claims=[];
 winners.forEach((w,q)=>{const at=10000+q*5000;if(w){const pts=Math.round(10*(1+cb[w]*.1));sc[w]+=pts;cb[w]++;best[w]=Math.max(best[w],cb[w]);for(const p of ids)if(p!==w)cb[p]=0;log.push({q,w,pts,at});claims[q]={uid:w,at,...(noJ?{}:{j:q===3?'Perfect':judge})}}else{ids.forEach(p=>cb[p]=0);log.push({q,w:null,at});claims[q]={uid:'_none',at}}});
 return{ids,claims,report:AR.build({sc,best,log},claims,ids,5000,420)};
}
test('A: rows/highlights are exact facts of the confirmed events; speed is labelled as won-questions only',()=>{
 const f=aFixture(['b','b','a','a','a','b','a']),m=M.build({kind:'A',me:'a',ids:f.ids,names,outcome:'w',A:{report:f.report,claims:f.claims}});
 const row=id=>m.rows.find(r=>r.id===id);a.equal(row('won').values.a,4);a.equal(row('won').values.b,3);a.equal(row('score').values.a,f.report.scores.a);a.equal(row('combo').values.a,f.report.best.a);
 a.match(row('time').note,/獲得した問題/);a.equal(row('time').better,'low');a.equal(row('perfect').values.a,1);
 const rv=m.highlights.find(h=>h.id==='reversal');a.ok(rv);a(['第3問','第4問','第5問','第6問','第7問'].includes(rv.tag));
 const g2=aFixture(['a','a','a','b','b','b','b']),m2=M.build({kind:'A',me:'a',ids:g2.ids,names,outcome:'l',A:{report:g2.report,claims:g2.claims}});a.equal(m2.highlights.find(h=>h.id==='combo')?.tag,'第1〜3問');a.equal(m2.highlights.find(h=>h.id==='reversal')?.tag,'第7問');a.match(m2.highlights.find(h=>h.id==='reversal').detail,/相手がリードを奪った/);
 const cm=m.highlights.find(h=>h.id==='combo');if(cm&&rv)a.notEqual(rv.tag,cm.tag);
 a.equal(m.highlights.length<=3,true);
});
test('A: the same question never appears in two highlights',()=>{
 const f=aFixture(['b','a','a','a','b','a']),m=M.build({kind:'A',me:'a',ids:f.ids,names,outcome:'l',A:{report:f.report,claims:f.claims}});
 const refs=m.highlights.map(h=>h.tag.match(/\d+/g)?.map(Number)||[]);const all=refs.flatMap(r=>r.length===2&&/〜/.test(m.highlights[refs.indexOf(r)].tag)?Array.from({length:r[1]-r[0]+1},(_,i)=>r[0]+i):r);a.equal(new Set(all).size,all.length);
});
test('A: missing judge data hides Perfect; inconsistent report hides every event-based row and highlight',()=>{
 const f=aFixture(['a','b','a'],{noJ:true}),m=M.build({kind:'A',me:'a',ids:f.ids,names,outcome:'w',A:{report:f.report,claims:f.claims}});a(!m.rows.some(r=>r.id==='perfect'));a.equal(m.hiddenRows,true);
 const bad={...f.report,consistent:false},n=M.build({kind:'A',me:'a',ids:f.ids,names,outcome:'w',A:{report:bad,claims:f.claims}});a.deepEqual(n.rows.map(r=>r.id).sort(),['combo','score']);a.equal(n.highlights.length,0);a.equal(n.analysisAvailable,false);
 const none=M.build({kind:'A',me:'a',ids:f.ids,names,outcome:'w',rank:{a:1,b:2},A:{report:null,claims:[]}});a.equal(none.rows.length,0);a.equal(none.players[0].score,null);a.equal(none.tiles.length,0);
});
test('A: a player who won nothing makes the speed row unavailable instead of inventing a time; draw and invalid input',()=>{
 const f=aFixture(['a','a','a']),m=M.build({kind:'A',me:'a',ids:f.ids,names,outcome:'w',A:{report:f.report,claims:f.claims}});a(!m.rows.some(r=>r.id==='time'));
 const d=M.build({kind:'A',me:'a',ids:['a','b'],names,outcome:'d',A:{report:aFixture(['a','b']).report,claims:aFixture(['a','b']).claims}});a.equal(d.word,'DRAW');a.equal(d.outcome,'draw');
 a.equal(M.build({kind:'C',me:'a',ids:['a','b']}),null);a.equal(M.build({kind:'A',me:'z',ids:['a','b']}),null);
});
