const assert=require('node:assert/strict');const {chromium,context}=require('./browser-harness.cjs');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});try{
 const stats={exp:900,rating:1650,maxRating:1800,skin:{tile:'wood'},games:5,w:3,l:2};const tree={games:{factor:{accounts:{ateacher:{name:'Teacher',stats:structuredClone(stats)}}}}};
 const t=await context(b,{tree}),p=t.page;await p.locator('[data-next-home]').waitFor();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('fxf_skin_v1')||'{}').tile==='wood');
 await p.locator('.account-main').click();await p.locator('[data-highest-rating]').waitFor();await p.getByRole('button',{name:'とじる',exact:true}).click();
 await p.getByRole('button',{name:'設定',exact:true}).click();await p.getByRole('dialog',{name:'設定',exact:true}).waitFor();await p.getByRole('button',{name:'きせかえ',exact:true}).click();await p.getByRole('button',{name:'タイル',exact:true}).waitFor();await p.getByRole('button',{name:'とじる',exact:true}).click();
 assert.deepEqual(tree.games.factor.accounts.ateacher.stats,stats);assert.equal(t.writes.filter(x=>/\/stats(?:\/|$)|onlineSparkV1\/profiles\//.test(x.path)).length,0);assert.deepEqual(t.errors,[]);await t.ctx.close();
 const f=await context(b,{blockedAssets:['/next-home-ui.js']});await f.page.getByRole('alert').getByText('新しいホームを読み込めませんでした。従来のメニューを表示します。',{exact:true}).waitFor();await f.page.getByRole('button',{name:'スタート',exact:true}).waitFor();assert.deepEqual(f.errors,[]);await f.ctx.close();
 console.log('PASS account profile/settings/wardrobe; saved equipment synced locally; EXP/rating/stats/equipment unchanged');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
