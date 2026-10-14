const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../server/online-rated/engine.cjs'),A=require('../src/a-result.cjs');
for(const d of ['easy','normal'])test('A confirmed points, timeout, partial result, duplicate claims and score agreement '+d,()=>{
 let m=E.begin('report',d,'A',['u','v'],'report',1000);
 for(let i=0;i<8;i++){
  const uid=i<2?'u':'v',g=E.view(m,uid),api=E.runtime(m).api;let pair;
  for(let a=0;a<g.tiles.length;a++)for(let b=a+1;b<g.tiles.length;b++)if(api.polyEqual(api.multiply(g.tiles[a].factor,g.tiles[b].factor),g.poly))pair=[g.tiles[a].id,g.tiles[b].id];
  m=E.step(m,uid,{type:'answer',question:g.question,tiles:pair},g.startAt+100);
  assert.equal(typeof m.claims[i].pts,'number');
 }
 const r=E.reportA(m);assert(r.consistent);assert.equal(r.events.length,8);assert.equal(r.events[0].ms,100);assert.equal(r.best.v,6);
 for(const uid of m.ids)assert.equal(r.scores[uid],E.view(m,uid).live[uid]);
 assert.equal(r.events.at(-1).totals.v,r.scores.v);assert.equal(new Set(r.events.map(x=>x.id)).size,8);
 const before=JSON.stringify(m);assert.equal(JSON.stringify(E.reportA(m)),JSON.stringify(r));assert.equal(JSON.stringify(m),before);
 const last=E.view(m,'u');m=E.step(m,'u',{type:'heartbeat'},last.startAt+last.timeoutMs);assert.equal(E.reportA(m).events.at(-1).pts,0);assert.equal(E.reportA(m).events.at(-1).winner,null);
});
test('incomplete records cannot invent a score graph',()=>{const r=A.build({sc:{u:20,v:0},best:{u:1,v:0},log:[]},[],['u','v'],0,100);assert.equal(r.consistent,false);assert.equal(r.events.length,0)});
