const {test}=require('node:test'),a=require('node:assert/strict'),R=require('../server/next-authority/c-replay.cjs');
const mulberry=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const pinOf=(seed,diff='easy')=>({ids:['a','b','c','d'],mode:'C',tm:{a:0,b:0,c:1,d:1},diff,seed,startAt:1000,pinnedAt:500,cpu:false,clientVersion:R.version,engineHash:R.engineHash});
// Drives the REAL extracted createBEngine (the same code the browser runs) and records the log a faithful client would write.
function playReal(seed,diff,rnd,steps){
 const {api,clock}=R.sandbox(),cfg=api.DIFFICULTY_CONFIG[diff],bank=api.makeBank(seed,cfg.tileCount);clock.t=1000;
 const eng=api.createBEngine({code:'1234',gid:'g',uid:'a',ids:['a','b','c','d'],bank,N:99999,diff,hc:0,tm:null,view:()=>({live:{},ko:{}}),sound:null,fx:null,onClear:null});
 const log=[],truth=[],served=()=>Object.values(eng.s.served).reduce((x,y)=>x+y,0);
 let skippedCorrectExpected=0;
 for(let i=0;i<steps&&!eng.s.over;i++){
  const kind=['correct','correct','correct','wrong','ojama','timeout'][Math.floor(rnd()*6)];
  eng.s.hp=100;
  if(kind==='ojama'&&!eng.s.cur.tiles.some(t=>t.ojama)){/* the real board carries ojama only when queued before serve; force one via the engine's own state */ eng.s.ojNext=0}
  const cur=eng.s.cur,b=served()-1,tiles=cur.tiles,pair=()=>{for(const x of tiles)for(const y of tiles)if(x.id<y.id&&api.polyEqual(api.multiply(x.factor,y.factor),cur.poly))return[x.id,y.id]};
  clock.t+=500+Math.floor(rnd()*3000);
  if(kind==='timeout'){clock.t+=api.QUESTION_TIMEOUT_MS+10;eng.tick();clock.t+=500;eng.tick();truth.push({b,kind:'timeout'});continue}
  let ids;
  if(kind==='correct')ids=pair();
  else if(kind==='wrong'){const real=tiles.filter(t=>!t.ojama);outer:for(const x of real)for(const y of real)if(x.id<y.id&&!api.polyEqual(api.multiply(x.factor,y.factor),cur.poly)){ids=[x.id,y.id];break outer}}
  else{const oj=tiles.filter(t=>t.ojama),real=tiles.filter(t=>!t.ojama);if(!oj.length){i--;continue}ids=[oj[0].id,real[0].id]}
  const t1=tiles.find(t=>t.id===ids[0]),t2=tiles.find(t=>t.id===ids[1]);
  const r=eng.answer(api.polyEqual(api.multiply(t1.factor,t2.factor),cur.poly));// exactly what onMatch does
  log.push({n:log.length,k:'answer',q:b,a:ids,ct:clock.t,sat:clock.t});
  truth.push({b,kind:r.ok?'correct':kind==='ojama'?'ojama-wrong':'wrong',c:eng.s.c,combo:eng.s.combo,level:cur.level,k:cur.k});
  if(rnd()<0.4)eng.s.ojNext=1;// what a landed attack leaves behind; the engine's own serve() then adds the ojama tile
  clock.t+=500;eng.tick();
 }
 return{log,truth,engine:{c:eng.s.c,combo:eng.s.combo,best:eng.s.best,served:served()}};
}
// ojama appears on boards only after a queued attack; give the real engine the same state a landed attack would create
function withOjama(seed,diff,rnd,steps){return playReal(seed,diff,()=>rnd(),steps)}
test('replay matches the real createBEngine over many seeds: correct count, combo, best, board order, wrong/timeout resets',()=>{
 let answers=0,ok=0,oj=0;
 for(let s=0;s<120;s++)for(const diff of ['easy','normal','hard']){
  const seed='seed-'+s+diff,rnd=mulberry(s*7+diff.length),real=playReal(seed,diff,rnd,40);
  const r=R.replaySolo({pin:pinOf(seed,diff),uid:'a',entries:real.log});
  a.equal(r.confirmed,true,seed+JSON.stringify(r.reasons));
  const correct=real.truth.filter(t=>t.kind==='correct').length;
  a.equal(r.player.correct,real.engine.c,seed);a.equal(r.player.correct,correct,seed);const lastAnswered=real.truth.filter(t=>t.kind!=='timeout').at(-1),trailingTimeout=real.truth.at(-1)?.kind==='timeout';a.equal(r.player.combo,lastAnswered?lastAnswered.combo:0,seed);if(!trailingTimeout)a.equal(r.player.combo,real.engine.combo,seed+' (a trailing timeout is invisible to the log and is not guessed)');a.equal(r.player.bestCombo,real.engine.best,seed);
  const answered=real.truth.filter(t=>t.kind!=='timeout');a.equal(r.steps.length,answered.length);
  r.steps.forEach((st,i)=>{const t=answered[i];a.equal(st.b,t.b);a.equal(st.kind,t.kind,seed+':'+i);a.equal(st.level,t.level);a.equal(st.k,t.k);a.equal(st.c,t.c);a.equal(st.combo,t.combo)});
  a.equal(r.player.unattributedMisses>=0,true);answers+=answered.length;oj+=r.player.ojamaWrong;ok++;
 }
 a(answers>2000,'compared '+answers+' answers over '+ok+' games');a(oj>50,'ojama answers compared against the real engine: '+oj);console.log('compared',answers,'answers,',oj,'ojama answers,',ok,'games');
});
test('ojama boards: any pair containing an ojama tile is wrong in the real engine, replay agrees (and never confirms it correct)',()=>{
 let seen=0;
 for(let s=0;s<60;s++){
  const {api,clock}=R.sandbox(),bank=api.makeBank('oj'+s,6);clock.t=1000;
  const eng=api.createBEngine({code:'1',gid:'g',uid:'a',ids:['a','b','c','d'],bank,N:99999,diff:'easy',hc:0,tm:null,view:()=>({live:{},ko:{}}),sound:null,fx:null,onClear:null});
  // advance one board so a landed attack (ojNext) is applied by the engine's own serve(): exactly the production path
  const cur0=eng.s.cur;const t1=cur0.tiles,pr=(()=>{for(const x of t1)for(const y of t1)if(x.id<y.id&&api.polyEqual(api.multiply(x.factor,y.factor),cur0.poly))return[x.id,y.id]})();
  eng.s.ojNext=2;eng.answer(true);clock.t+=500;eng.tick();
  const cur=eng.s.cur,oj=cur.tiles.filter(t=>t.ojama);if(!oj.length)continue;seen+=oj.length;
  for(const o of oj)for(const t of cur.tiles){if(o.id===t.id)continue;a.equal(api.polyEqual(api.multiply(o.factor,t.factor),cur.poly),false,'engine: every ojama pair is wrong')}
  const log=[{n:0,k:'answer',q:0,a:pr,ct:1,sat:1500},{n:1,k:'answer',q:1,a:[oj[0].id,cur.tiles.find(t=>!t.ojama).id],ct:2,sat:2500}];
  const r=R.replaySolo({pin:pinOf('oj'+s),uid:'a',entries:log});a.equal(r.confirmed,true);a.equal(r.steps[1].kind,'ojama-wrong');a.equal(r.player.ojamaWrong,1);a.equal(r.player.combo,0);
 }
 a(seen>20,'ojama tiles exercised: '+seen);
});
test('skipped boards are NEVER confirmed as timeouts; counts become lower bounds; plausibility is only an annotation',()=>{
 const seed='skip',pin=pinOf(seed),{api}=R.sandbox(),bank=api.makeBank(seed,6);
 const solve=(lv,k)=>{const b=bank.get(lv,k);for(const x of b.tiles)for(const y of b.tiles)if(x.id<y.id&&api.polyEqual(api.multiply(x.factor,y.factor),b.poly))return[x.id,y.id]};
 const fast=R.replaySolo({pin,uid:'a',entries:[{n:0,k:'answer',q:0,a:solve(1,0),ct:2000,sat:2000},{n:1,k:'answer',q:3,a:solve(1,3),ct:3000,sat:3000}]});
 a.equal(fast.confirmed,true);a.equal(fast.player.unattributedMisses,2);a.equal(fast.unattributed.every(u=>u.timeoutPlausible===false),true,'1s gap cannot hold two 20s timeouts');a.equal(fast.player.countsExact,false);a.equal(fast.player.combo,1);
 const slow=R.replaySolo({pin,uid:'a',entries:[{n:0,k:'answer',q:0,a:solve(1,0),ct:2000,sat:2000},{n:1,k:'answer',q:3,a:solve(1,3),ct:99999,sat:99999}]});
 a.equal(slow.unattributed.every(u=>u.timeoutPlausible===true),true);a.equal(slow.unattributed.length,2);a.equal(slow.player.countsExact,false,'plausible is still not confirmed');a.equal(slow.notConfirmed.includes('score'),true);
});
test('unreproducible or ineligible inputs are unconfirmed, with the reason, never guessed',()=>{
 const pin=pinOf('x'),{api}=R.sandbox(),bank=api.makeBank('x',6),b0=bank.get(1,0),ok=(()=>{for(const x of b0.tiles)for(const y of b0.tiles)if(x.id<y.id&&api.polyEqual(api.multiply(x.factor,y.factor),b0.poly))return[x.id,y.id]})();
 const run=(over,entries)=>R.replaySolo({pin:{...pin,...over},uid:'a',entries});
 const good=[{n:0,k:'answer',q:0,a:ok,ct:1,sat:2000}];
 a.equal(run({},good).confirmed,true);
 for(const [over,why] of [[{cpu:true},'CPU_GAME'],[{seed:null},'NO_SEED'],[{pinnedAt:1001},'NOT_PINNED_BEFORE_START'],[{clientVersion:'5.24'},'CLIENT_VERSION_MISMATCH'],[{clientVersion:null},'CLIENT_VERSION_MISMATCH'],[{engineHash:'old'},'ENGINE_CHANGED'],[{mode:'B'},'NOT_A_PINNED_C_GAME']])a.deepEqual(run(over,good).reasons,[why]);
 for(const [entries,why] of [
  [[{n:0,k:'answer',q:0,a:['q1_0_99','q1_0_98'],ct:1,sat:2}],'TILE_NOT_ON_BOARD'],
  [[{n:0,k:'answer',q:0,a:['q1_1_0',ok[1]],ct:1,sat:2}],'TILE_NOT_ON_BOARD'],// a tile of another board
  [[{n:0,k:'answer',q:0,a:ok,ct:1,sat:2},{n:1,k:'answer',q:0,a:ok,ct:1,sat:3}],'BOARD_REWIND_OR_DUPLICATE'],
  [[{n:0,k:'answer',q:5,a:ok,ct:1,sat:2}],'TILE_NOT_ON_BOARD'],// ids from board 0 presented as board 5
  [[{n:0,k:'answer',q:100000,a:ok,ct:1,sat:2}],'SKIP_TOO_LARGE'],[[{n:0,k:'answer',q:0,a:[ok[0],ok[0]],ct:1,sat:2}],'BAD_TILE_PAIR'],[[{n:0,k:'answer',q:0,a:[ok[0],'zzz'],ct:1,sat:2}],'TILE_NOT_ON_BOARD']])
  a.deepEqual(run({},entries).reasons,[why]);
 // same factor VALUE on another tile id must not pass: validation is by tile id on the reproduced board
 const dup=bank.get(1,0).tiles.map(t=>t.id);a.equal(new Set(dup).size,dup.length);
});
test('specials and unknown speed data never enter confirmed fields (J3)',()=>{
 const pin=pinOf('sp'),{api}=R.sandbox(),b0=api.makeBank('sp',6).get(1,0),ids=(()=>{for(const x of b0.tiles)for(const y of b0.tiles)if(x.id<y.id&&api.polyEqual(api.multiply(x.factor,y.factor),b0.poly))return[x.id,y.id]})();
 const r=R.replaySolo({pin,uid:'a',entries:[{n:0,k:'special',s:'big',ct:1,sat:1500},{n:1,k:'answer',q:0,a:ids,ct:2,sat:2000}]});
 a.equal(r.player.claimedSpecials,1);a.equal(r.player.correct,1);for(const f of ['score','judgment','attackAmount','healAmount','specialGauge'])a(r.notConfirmed.includes(f));a.equal(r.steps[0].score,undefined);
});
