const nav = require("./browser-harness.cjs"); // shared navigation (goHome / openSoloMode …)
// The solo result is built from a display-only run log. This test plays real games (normal + bonus-stage questions,
// timeouts, mistakes) and checks that the numbers on the result screen equal what the test itself did and saw.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium,context}=require('./browser-harness.cjs'),{soloDrag,reverseState,reverseClick}=require('./solo-test-helper.cjs');
const exe=process.env.CHROMIUM_PATH||'/usr/bin/chromium';
// test-only copy of the page: lets the test decide when the 3% bonus-stage roll succeeds (the game code is otherwise identical)
const html=fs.readFileSync('index.html','utf8').replace('Math.random() < REVERSE_STAGE_CHANCE','Math.random() < (window.__revChance ?? REVERSE_STAGE_CHANCE)');
assert(html.includes('window.__revChance'),'hook inserted');
const tree=()=>({games:{factor:{accounts:{ateacher:{name:'Teacher',stats:{exp:100,rating:1600}}}}}});
async function begin(b,label,extra={}){const tr=tree(),t=await context(b,{tree:tr,assetOverrides:{'/':html},...extra}),p=t.page;await p.evaluate(()=>{window.__revChance=0});
 await nav.openSoloMode(p, 'play');await p.getByRole('button',{name:new RegExp('^'+label)}).first().click();await p.getByRole('button',{name:'スタート',exact:true}).click();await p.locator('[data-tile-id]').first().waitFor();return{t,p,tr}}
const judge=p=>p.evaluate(()=>[...document.querySelectorAll('.combat-judge')].map(e=>e.textContent.trim()).find(Boolean)||null);
// a recorder that mirrors what the player really did/saw
const mk=()=>({caught:0,wrong:0,timeouts:0,perfect:0,combo:0,maxCombo:0,reverseOk:0,reverseWrong:0});
async function right(p,rec,{reverse=false}={}){if(reverse){assert(await reverseState(p),'bonus stage expected');await reverseClick(p,true);rec.reverseOk++}else{assert(!await reverseState(p),'normal stage expected');await soloDrag(p,true)}
 await p.waitForTimeout(560);const j=await judge(p);assert(j,'judgement popup seen');if(j==='Perfect')rec.perfect++;rec.caught++;rec.combo++;rec.maxCombo=Math.max(rec.maxCombo,rec.combo);await p.waitForTimeout(350)}
async function wrong(p,rec,{reverse=false}={}){if(reverse){assert(await reverseState(p));await reverseClick(p,false);rec.reverseWrong++}else{await soloDrag(p,false)}rec.wrong++;rec.combo=0;await p.waitForTimeout(650)}
async function dieByWrong(p,rec){while(!await p.locator('[data-battle-summary]').count()){if(await reverseState(p))await wrong(p,rec,{reverse:true});else await wrong(p,rec);}await p.locator('[data-battle-summary]').waitFor({timeout:20000});await p.waitForTimeout(300)}
const read=p=>p.evaluate(()=>({tiles:Object.fromEntries([...document.querySelectorAll('.nbr-tile')].map(e=>[e.querySelector('small').textContent,e.querySelector('b').textContent])),hl:[...document.querySelectorAll('.nbr-card h4')].map(e=>e.textContent),learn:!!document.querySelector('[data-learn]'),score:document.querySelector('[data-score]').dataset.score,word:document.querySelector('.nbr-word').textContent}));
const same=(r,rec,tag)=>{assert.equal(r.tiles['正解数'],String(rec.caught),tag+' caught');assert.equal(r.tiles['最大コンボ'],String(rec.maxCombo),tag+' max combo');assert.equal(r.tiles['Perfect'],String(rec.perfect),tag+' perfect');assert.equal(r.tiles['ミス'],String(rec.wrong+rec.timeouts),tag+' misses')};
(async()=>{const b=await chromium.launch({executablePath:exe});try{
 // ===== 1. normal stage only: timeout + correct + wrong, ends by HP =====
 {const{t,p}=await begin(b,'ノーマル'),rec=mk();
  await p.clock.install();await p.clock.fastForward(21000);rec.timeouts=1;rec.combo=0;await p.waitForTimeout(900);
  await right(p,rec);await right(p,rec);await wrong(p,rec);await right(p,rec);await dieByWrong(p,rec);
  const r=await read(p);same(r,rec,'normal');assert.equal(rec.maxCombo,2);assert.equal(r.word,'GAME OVER');assert(r.learn);assert(r.hl.some(x=>x.startsWith('最大2コンボ')));
  const ghost=await p.evaluate(()=>JSON.parse(localStorage.fxf_solo_ghost_v1_ateacher).normal);assert.equal(String(ghost.score),r.score);assert.equal(ghost.caught,rec.caught);
  assert.deepEqual(t.errors,[]);await t.ctx.close()}
 console.log('PASS normal stage: correct / wrong / timeout counted exactly, GAME OVER log complete, combo highlight uses the real number');
 // ===== 2. hard: bonus-stage correct + wrong mixed with normal questions, then GAME OVER; then a fresh run =====
 {const{t,p}=await begin(b,'ハード'),rec=mk();
  for(let i=0;i<30;i++)await right(p,rec);
  await p.evaluate(()=>{window.__revChance=1});
  await right(p,rec);                                   // 31st correct -> next question is a bonus question
  await right(p,rec,{reverse:true});                    // bonus correct (counts as a correct answer and extends the combo)
  await p.evaluate(()=>{window.__revChance=0});await wrong(p,rec,{reverse:true}); // bonus wrong resets the combo (set before: the follow-up question is rolled 420ms after the click)
  await right(p,rec);await p.evaluate(()=>{window.__revChance=1});await right(p,rec);   // normal, then the next one is bonus
  await p.evaluate(()=>{window.__revChance=0});await right(p,rec,{reverse:true});
  await right(p,rec);
  await dieByWrong(p,rec);
  const r=await read(p);same(r,rec,'mixed');assert.equal(rec.reverseOk,2);assert.equal(rec.reverseWrong>=1,true);assert.equal(rec.maxCombo,32,'31 normal + 1 bonus');assert(r.hl.some(x=>x.startsWith('最大32コンボ')));assert(r.hl.some(x=>x.startsWith('最速解答')));
  assert.equal(r.tiles['得点'],r.score);
  // next run: nothing carries over
  await p.getByRole('button',{name:/もう一度あそぶ（ハード）/}).click();await p.locator('[data-tile-id]').first().waitFor();assert.equal(await p.locator('[data-battle-summary]').count(),0);
  const rec2=mk();await dieByWrong(p,rec2);const r2=await read(p);assert.equal(r2.tiles['正解数'],'0');assert.equal(r2.tiles['Perfect'],'0');assert.equal(r2.tiles['最大コンボ'],'0');assert.equal(r2.tiles['ミス'],String(rec2.wrong));assert(!r2.hl.some(x=>x.startsWith('最速解答')||x.startsWith('最大')));
  assert.deepEqual(t.errors,[]);await t.ctx.close()}
 console.log('PASS mixed normal + bonus stage (31 normal, bonus correct/wrong, interleaved): exact counts; fresh run starts empty');
 // ===== 3. CLEAR right after the final correct answer: the final question is made Perfect / not Perfect on purpose =====
 // Oracle: the game's own mission progress (mis.p.pf), written by flushLearn from the original learning record, counts every Perfect.
 for(const finalPerfect of [true,false]){
  const{t,p,tr}=await begin(b,'イージー'),rec=mk();for(let i=0;i<14;i++)await right(p,rec);
  if(!finalPerfect)await p.waitForTimeout(2400);        // the final question stays open > 2s: judged Great, never Perfect
  await soloDrag(p,true);await p.locator('[data-battle-summary]').waitFor();await p.waitForTimeout(900);
  const r=await read(p),pf=tr.games.factor.accounts.ateacher.mis.p.pf,expected=rec.perfect+(finalPerfect?1:0);
  assert.equal(r.word,'CLEAR!');assert.equal(r.tiles['正解数'],'15');assert.equal(r.tiles['最大コンボ'],'15');assert.equal(r.tiles['ミス'],'0');
  assert.equal(pf,expected,'oracle: the game itself counted exactly this many Perfects ('+(finalPerfect?'final fast':'final slow')+')');
  assert.equal(+r.tiles['Perfect'],expected,'displayed Perfect equals the exact expectation, no tolerance');assert.deepEqual(t.errors,[]);await t.ctx.close()}
 console.log('PASS CLEAR: final answer Perfect and not-Perfect both give the exact Perfect count (checked against the game\'s own record)');
 // ===== 4. missing / inconsistent log => no inaccurate numbers =====
 {const{t,p}=await begin(b,'ハード');await p.evaluate(()=>{const M=NextResults.SoloResultModel,f=M.build;M.build=i=>f({...i,snapshot:{...i.snapshot,log:(i.snapshot.log||[]).slice(1)}})});
  const rec=mk();await right(p,rec).catch(()=>{});await dieByWrong(p,rec);const r=await p.evaluate(()=>({tiles:[...document.querySelectorAll('.nbr-tile small:first-child')].map(e=>e.textContent),learn:!!document.querySelector('[data-learn]'),hl:[...document.querySelectorAll('.nbr-card h4')].map(e=>e.textContent)}));
  for(const x of ['Perfect','ミス'])assert(!r.tiles.includes(x),x+' hidden when the log is incomplete');assert(r.tiles.includes('正解数')&&r.tiles.includes('得点'));assert(!r.hl.some(x=>x.startsWith('最速解答')));assert.equal(r.learn,false);await t.ctx.close()}
 console.log('PASS incomplete run log: derived numbers hidden, core facts kept');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
