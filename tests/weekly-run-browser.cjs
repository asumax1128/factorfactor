const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium,context,drag}=require('./browser-harness.cjs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});try{
const initial={exp:100,rating:1600,B:{w:4,l:3},nick:'tour1'},app=fs.readFileSync('index.html','utf8').replace('function RaidPlay({ boss, hp, max, endAt, ended, title, onHit, onQuit, footer, sessionInfo, opts, bossExtra }) {','function RaidPlay({ boss, hp, max, endAt, ended, title, onHit, onQuit, footer, sessionInfo, opts, bossExtra }) {window.__weeklyHit=onHit;');
for(const width of [375,390,430,1440]){
 const tree={games:{factor:{accounts:{ateacher:{name:'Teacher',stats:structuredClone(initial)}}}}};
 // Only test doubles force the gate. The SDK test verifies the actual URL/project gate.
 const spark=fs.readFileSync('online-spark.js','utf8')+'\nWeeklyRunNext.enabled=()=>true;';
 const t=await context(browser,{tree,assetOverrides:{'/':app,'/online-spark.js':spark}}),p=t.page;await p.setViewportSize({width,height:844});await p.getByRole('button',{name:'今週のボスに挑む',exact:true}).click();await p.getByText('開発検証モード：出撃・ダメージ・報酬は専用データにのみ記録します').waitFor();
 await p.getByRole('button',{name:/出撃する（(?:60|90)秒）/}).click();await p.locator('[data-btile]').first().waitFor();await drag(p);await p.waitForFunction(()=>{const r=JSON.parse(localStorage.getItem('fxf_weekly_dev_run:ateacher'));return !!r});
 for(let i=0;i<50&&!Object.values(tree.games.factor.weeklyNextV1?.games?.ateacher?.runs||{}).some(r=>r.session.d>0);i++)await p.waitForTimeout(100);assert(Object.values(tree.games.factor.weeklyNextV1.games.ateacher.runs).some(r=>r.session.d>0));
 const data=tree.games.factor.weeklyNextV1,day=Object.keys(data.attempts.ateacher)[0],slots=Object.keys(data.attempts.ateacher[day].slots);assert.equal(slots.length,1);
 await p.reload();await p.getByRole('button',{name:'今週のボスに挑む',exact:true}).click();await p.locator('[data-btile]').first().waitFor();assert.equal(Object.keys(tree.games.factor.weeklyNextV1.attempts.ateacher[day].slots).length,1,'reload resumes original reservation');
 await p.clock.install();await p.clock.fastForward(93000);await p.getByText('出撃おつかれさま！',{exact:true}).waitFor();const saved=Object.values(tree.games.factor.weeklyNextV1.games.ateacher.runs)[0];assert.equal(saved.status,'done');assert(saved.receipt);assert(saved.reward.after>100);assert.deepEqual(tree.games.factor.accounts.ateacher.stats,initial);
 assert.equal(t.writes.filter(x=>/\/raidw\/.*\/(dmg|sup|kill)|\/accounts\/.*\/stats|\/onlineSparkV1\/profiles/.test(x.path)).length,0);assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));assert.deepEqual(t.errors,[]);await t.ctx.close();
}console.log('PASS weekly actual UI: 4 widths, real drag, reservation after validation, reload without extra slot, timed finish and isolated reward, legacy stats unchanged');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
