const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium,context}=require('./browser-harness.cjs'),{soloDrag}=require('./solo-test-helper.cjs');
const exe=process.env.CHROMIUM_PATH||'/usr/bin/chromium',SHOTS=process.env.SOLO_SHOTS||'',WIDTHS=[375,390,430,1440];
const cost={easy:15,normal:30,hard:50};
async function start(p,label){await p.locator('.action-card.solo').click();await p.getByRole('button',{name:new RegExp('^'+label)}).first().click();await p.getByRole('button',{name:'スタート',exact:true}).click();await p.locator('[data-tile-id]').first().waitFor()}
async function play(p,{right=0,wrong=0}){let w=0;for(let i=0;i<right;i++){await soloDrag(p,true);await p.waitForTimeout(650)}
 for(;w<wrong&&!await p.locator('[data-battle-summary]').count();w++){await soloDrag(p,false);await p.waitForTimeout(650)}
 await p.locator('[data-battle-summary]').waitFor({timeout:20000});await p.waitForTimeout(400);return w}
const read=p=>p.evaluate(()=>({tiles:Object.fromEntries([...document.querySelectorAll('.nbr-tile')].map(e=>[e.querySelector('small').textContent,e.querySelector('b').textContent])),word:document.querySelector('.nbr-word').textContent,ending:document.querySelector('.nbr').dataset.soloEnding,hl:[...document.querySelectorAll('.nbr-card h4')].map(e=>e.textContent),badges:[...document.querySelectorAll('.nbr-badges span')].map(e=>e.textContent),score:document.querySelector('[data-score]').dataset.score,reason:document.querySelector('.nbr-reason')?.textContent,learn:!!document.querySelector('[data-learn]'),buttons:[...document.querySelectorAll('button')].map(e=>e.textContent),text:document.body.innerText,ov:document.documentElement.scrollWidth>innerWidth,box:document.querySelector('.nbr').getBoundingClientRect().width,conf:document.querySelectorAll('.nbr-confetti i').length,anim:getComputedStyle(document.querySelector('.nbr-word')).animationName,grow:!!document.querySelector('.nbr-grow'),growText:document.querySelector('.nbr-grow')?.innerText||''}));
(async()=>{const b=await chromium.launch({executablePath:exe});try{
 const tree=()=>({games:{factor:{accounts:{ateacher:{name:'Teacher',stats:{exp:100,rating:1600}}}}}});
 // ===== EASY CLEAR (15 questions), logged in =====
 {const tr=tree(),t=await context(b,{tree:tr}),p=t.page;await start(p,'イージー');await play(p,{right:15});const r=await read(p);
  assert.equal(r.word,'CLEAR!');assert.equal(r.ending,'clear');assert.equal(r.reason,'15問達成！');assert.equal(r.tiles['正解数'],'15');assert.equal(r.tiles['難易度'],'イージー');assert.match(r.tiles['到達レベル'],/^Lv\.\d/);assert.equal(r.tiles['ミス'],'0');assert.equal(r.tiles['最大コンボ'],'15');assert.equal(r.tiles['得点'],r.score);
  assert(r.hl[0].startsWith('クリアタイム'));assert(r.hl.length<=3);assert(r.hl.some(x=>x.startsWith('最大15コンボ'))&&r.hl.some(x=>x.startsWith('最速解答')));assert.equal(r.learn,false,'no mistakes => no 学びの部屋へ');assert(!/復習/.test(r.text.split('Thank you')[0]),'never labelled as reviewing the missed problems');
  assert(r.badges.includes('自己ベスト更新！'));assert(r.conf>0,'gold confetti on CLEAR');assert(r.grow&&/経験値|EXP|Lv/.test(r.growText));
  assert.equal(tr.games.factor.accounts.ateacher.stats.exp-100,5+15*2+20,'EXP formula unchanged');
  const ghost=await p.evaluate(()=>JSON.parse(localStorage.fxf_solo_ghost_v1_ateacher).easy);assert.equal(ghost.score,+r.score);assert.equal(ghost.splits.length,15);
  for(const w of WIDTHS){await p.setViewportSize({width:w,height:1500});await p.waitForTimeout(250);const x=await read(p);assert(!x.ov,'overflow '+w);assert(x.buttons.some(s=>/もう一度あそぶ（イージー）/.test(s))&&x.buttons.includes('タイトルにもどる'));assert.match(x.text,/Thank you for playing/);
   if(w===1440){assert(x.box>900,'wide layout '+x.box);const g=await p.evaluate(()=>{const a=document.querySelector('.nbr-tiles').getBoundingClientRect(),h=document.querySelector('.nbr-hl').getBoundingClientRect();return{sameRow:Math.abs(a.top-h.top)<4&&h.left>a.right-2}});assert(g.sameRow,'tiles and highlights side by side on PC')}
   if(SHOTS&&(w===390||w===1440))await p.screenshot({path:`${SHOTS}/solo-clear-${w}.png`,fullPage:true})}
  assert.deepEqual(t.errors,[]);await t.ctx.close()}
 console.log('PASS easy CLEAR: ヒーロー/成績/ハイライト/成長, EXP 55, ghost saved, 4 widths, no overflow, existing buttons and credits kept');
 // ===== NORMAL GAME OVER (3 right, then wrongs) + next run is not contaminated =====
 {const tr=tree(),t=await context(b,{tree:tr}),p=t.page;await start(p,'ノーマル');const w1=await play(p,{right:3,wrong:9});let r=await read(p);
  assert.equal(r.word,'GAME OVER');assert.equal(r.ending,'gameover');assert.equal(r.reason,'体力切れ…');assert.equal(r.tiles['正解数'],'3');assert.equal(r.tiles['ミス'],String(w1),'ミス = every wrong answer of this run');assert.equal(r.tiles['難易度'],'ノーマル');assert(r.learn,'learn button when mistakes exist');assert(r.hl.some(x=>x.startsWith('最速解答')));assert(!r.hl.some(x=>x.startsWith('クリアタイム')));assert.equal(r.conf,0,'no confetti on GAME OVER');
  assert.equal(tr.games.factor.accounts.ateacher.stats.exp-100,5+3*2);
  if(SHOTS)for(const w of [390,1440]){await p.setViewportSize({width:w,height:1500});await p.waitForTimeout(250);await p.screenshot({path:`${SHOTS}/solo-gameover-${w}.png`,fullPage:true})}
  await p.setViewportSize({width:390,height:844});
  await p.getByRole('button',{name:/もう一度あそぶ（ノーマル）/}).click();await p.locator('[data-tile-id]').first().waitFor();
  assert.equal(await p.locator('[data-battle-summary]').count(),0);
  const w2=await play(p,{right:0,wrong:9});r=await read(p);
  assert.equal(r.tiles['正解数'],'0');assert.equal(r.tiles['Perfect'],'0');assert.equal(r.tiles['ミス'],String(w2),'second run starts from an empty snapshot');assert(!r.hl.some(x=>x.startsWith('最速解答')),'no highlight from the previous run');assert.equal(r.tiles['最大コンボ'],'0');
  await p.getByRole('button',{name:'学びの部屋へ'}).click();await p.getByText('レベル別の正答率と平均時間',{exact:true}).waitFor();
  assert.deepEqual(t.errors,[]);await t.ctx.close()}
 console.log('PASS normal GAME OVER: 3 correct + mistakes counted exactly, EXP 11, 学びの部屋へ opens the learning room, next run has no carry-over');
 // ===== HARD GAME OVER (no correct answers): zero is a real zero =====
 {const t=await context(b,{tree:tree()}),p=t.page;await start(p,'ハード');await play(p,{wrong:9});const r=await read(p);
  assert.equal(r.tiles['正解数'],'0');assert.equal(r.tiles['難易度'],'ハード');assert.equal(r.hl.length,0,'no highlights without correct answers');assert.deepEqual(t.errors,[]);await t.ctx.close()}
 console.log('PASS hard GAME OVER with zero correct answers');
 // ===== guest label, fallback when the shared UI is unavailable =====
 {const t=await context(b,{account:{guest:true,name:'Guest'}}),p=t.page;await start(p,'ハード');await play(p,{right:2,wrong:9});const r=await read(p);assert.match(r.growText,/ゲスト/);assert.deepEqual(t.errors,[]);await t.ctx.close()}
 {const t=await context(b,{tree:tree()}),p=t.page;await p.evaluate(()=>{delete window.NextResults.SoloSummary});await start(p,'ハード');for(let i=0;i<9&&!await p.getByText('GAME OVER').count();i++){await soloDrag(p,false);await p.waitForTimeout(650)}
  await p.getByText('GAME OVER').first().waitFor();assert.equal(await p.locator('.nbr').count(),0);assert(await p.locator('.v7-result').count());assert.equal(await p.getByRole('button',{name:'タイトルにもどる'}).count(),1,'old screen still complete');await t.ctx.close()}
 console.log('PASS guest EXP label and old-screen fallback');
 // ===== reduced motion =====
 {const t=await context(b,{tree:tree()}),p=t.page;await p.emulateMedia({reducedMotion:'reduce'});await start(p,'イージー');await play(p,{right:15});const r=await read(p);assert.equal(r.conf,0);assert.equal(r.anim,'none');assert.equal(r.word,'CLEAR!');await t.ctx.close()}
 console.log('PASS reduced motion: no confetti/animation, same content');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
