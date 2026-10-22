// Ver.6.14 visual 「あそびかた」 guide: 8 sections, no AXIOMIA for anyone, table of contents, real screenshots,
// Perfect / difficulty facts equal to the game's own definitions, back to home, 遊んでみる routes, no sideways scroll.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,context,mainNavItem}=require('./browser-harness.cjs');
const src=fs.readFileSync('index.html','utf8');
const tiers=[...src.match(/const JUDGE_TIERS = \[([\s\S]*?)\];/)[1].matchAll(/max: (\d+), label: '(\w+)', recover: (\d+)/g)].map(m=>({max:+m[1],label:m[2],recover:+m[3]}));
const diff=Object.fromEntries([...src.match(/const DIFFICULTY_CONFIG = \{([\s\S]*?)\n\};/)[1].matchAll(/(\w+): \{ label: '([^']+)', clearCount: (\d+), color: '[^']+', tileCount: (\d+)/g)].map(m=>[m[1],{label:m[2],clear:+m[3],tiles:+m[4]}]));
const obj=name=>Object.fromEntries([...src.match(new RegExp('const '+name+' = \\{([^}]*)\\}'))[1].matchAll(/(\w+): (\d+)/g)].map(m=>[m[1],+m[2]]));
const miss=obj('DIFFICULTY_MISS_PENALTY'),extra=obj('DIFFICULTY_TIMEOUT_EXTRA');
assert.equal(tiers.length,6);assert.deepEqual(Object.keys(diff),['easy','normal','hard']);
const STEPS=['basic','perfect','difficulty','solo','online','ghost','boss','growth'];
async function openHelp(p){await p.locator('[data-home-tile=help]').click();await p.locator('[data-next-help]').waitFor();}
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});try{
 for(const width of [375,390,430,1440]){
  const t=await context(b,{pc:width>900}),p=t.page;await p.setViewportSize({width,height:width>900?900:844});
  await openHelp(p);const help=p.locator('[data-next-help]');
  assert.deepEqual(await help.locator('[data-guide-step]').evaluateAll(es=>es.map(e=>e.dataset.guideStep)),STEPS,'8 sections in order');
  assert.equal(await help.locator('[data-toc]').count(),8,'8 table-of-contents entries');
  assert(!/AXIOMIA|アクシオミア|数理の塔|数学の塔/.test(await help.innerText()),'no AXIOMIA guide');
  // real screenshots load (lazy images are forced to load for the check)
  const imgs=await help.locator('img').evaluateAll(async es=>{for(const i of es){i.loading='eager';try{await i.decode()}catch(e){}}return es.map(i=>({src:i.getAttribute('src'),w:i.naturalWidth}))});
  assert(imgs.length>=14,'guide images present: '+imgs.length);for(const i of imgs)assert(i.w>0,'image loaded: '+i.src);
  assert(imgs.every(i=>/^ui-next\/guide\/[\w-]+\.webp/.test(i.src)),'guide images are the optimized copies');
  // STEP 2: the table equals JUDGE_TIERS; Fair is shown as "OK" like the game screen, with its own time and recovery
  const rows=await help.locator('[data-guide-judge] tbody tr').evaluateAll(rs=>rs.map(r=>[...r.children].map(c=>c.textContent.trim())));
  assert.deepEqual(rows,[...tiers.map(x=>[x.label==='Fair'?'OK':x.label,`${x.max/1000}秒以内`,`＋${x.recover}%`]),['Bad','ミス・時間切れ','回復なし']]);
  const text=async sel=>(await help.locator(sel).textContent()).replace(/\s+/g,'');const perfect=await text('[data-guide-step=perfect]');assert.match(perfect,new RegExp(`${tiers[0].max/1000}秒以内に正解するとPerfect`));assert.match(perfect,new RegExp(`HPが${tiers[0].recover}%回復`));
  assert.match(perfect,/得点の倍率が上がるのではなく/,'no claim that Perfect multiplies the score');
  // STEP 3: difficulty cards equal DIFFICULTY_CONFIG and the penalty constants
  for(const [id,d]of Object.entries(diff)){const card=await text(`[data-diff=${id}]`);for(const v of [d.label,`${d.clear}問`,`${d.tiles}枚`,`−${miss[id]}%`,`−${extra[id]}%`])assert(card.includes(v),id+' shows '+v);}
  const basic=await text('[data-guide-step=basic]');assert.match(basic,new RegExp(`イージー${diff.easy.tiles}枚、ノーマル${diff.normal.tiles}枚、ハード${diff.hard.tiles}枚`));
  assert.match(basic,/別々にタップするだけでは答えになりません/);
  // table of contents jumps to each section
  for(const id of STEPS){await help.locator(`[data-toc=${id}]`).click();await p.waitForFunction(id=>{const r=document.getElementById('hg-'+id).getBoundingClientRect();return r.top>=-2&&r.top<innerHeight*0.45},id);}
  assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'no horizontal scroll '+width);
  // shared navigation still intact, then back to home
  assert.equal(await p.locator('.bottom-nav .nav-item:visible, .sidebar nav .nav-item:visible').count(),5,'5 main tabs');
  await help.locator('[data-guide-home]').click();await p.locator('[data-next-home] .home-content').waitFor();
  assert.deepEqual(t.errors,[]);await t.ctx.close();console.log('PASS visual guide '+width+': 8 sections, no AXIOMIA, real images, JUDGE_TIERS/difficulty facts, table of contents, back to home');
 }
 // 遊んでみる: every button opens its real mode
 for(const [sel,check]of [["[data-guide-step=basic] [data-guide-play]",p=>p.getByRole('button',{name:'スタート',exact:true}).waitFor()],["[data-guide-step=solo] [data-guide-play] >> nth=1",p=>p.locator('[data-cpu-only]').waitFor()],["[data-guide-step=online] [data-guide-play]",p=>p.locator('[data-next-lobby]').waitFor()],["[data-guide-step=ghost] [data-guide-play]",p=>p.locator('[data-ghost-tiles]').waitFor()],["[data-guide-step=boss] [data-guide-play]",p=>p.getByText('1回の出撃は60秒',{exact:false}).waitFor()],["[data-guide-step=growth] [data-guide-play] >> nth=0",p=>p.locator('[data-next-profile]').waitFor()],["[data-guide-step=growth] [data-guide-play] >> nth=1",p=>p.locator('.ranking-grid').waitFor()]]){
  const t=await context(b),p=t.page;await openHelp(p);await p.locator(sel).click();await check(p);assert.deepEqual(t.errors,[]);await t.ctx.close();
 }
 console.log('PASS 遊んでみる: normal play, CPU practice, online lobby, ghost tiles, weekly boss, profile, ranking');
 // A teacher with AXIOMIA (math tower) access still sees no AXIOMIA guide
 {const t=await context(b,{tree:{games:{factor:{teachers:{ateacher:{name:'Teacher'}},mathTowerV2:{access:{ateacher:{enabled:true}}}}}}}),p=t.page;await openHelp(p);
  assert(!/AXIOMIA|アクシオミア|数理の塔|数学の塔/.test(await p.locator('[data-next-help]').innerText()));assert.equal(await p.locator('[data-next-help] [data-guide-step]').count(),8);await t.ctx.close();
  console.log('PASS teacher account: no AXIOMIA guide either');}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
