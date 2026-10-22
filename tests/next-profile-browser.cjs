const assert=require('node:assert/strict'),fs=require('node:fs');const {chromium,context}=require('./browser-harness.cjs');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});try{
 for(const width of [375,390,430,768,1440]){
 const season=new Date(Date.now()+9*3600000).toISOString().slice(0,7),stats={rating:1650,maxRating:1800,games:20,w:12,l:6,d:2,exp:900,nick:'tour1',tourWins:1,maxStreak:4,skin:{tile:'wood'},B:{w:7,l:2,d:1},wk:{weeks:3,kills:2,best:850}};
 const profiles={ateacher:{name:'Teacher',easy:{rating:1665.6,maxRating:1810.2,season,games:20,w:12,l:6,d:2},normal:{rating:1540.2,maxRating:1900.4,season,games:5,w:3,l:2,d:0}}};
 const tree={games:{factor:{accounts:{ateacher:{name:'Teacher',stats:structuredClone(stats)}},onlineSparkV1:{profiles}}}};
 const original=JSON.stringify({stats:tree.games.factor.accounts.ateacher.stats,profiles});
 const t=await context(b,{tree}),p=t.page;await p.setViewportSize({width,height:width>900?1080:844});
 await p.locator('.account-main').click();const profile=p.locator('[data-next-profile]');await profile.waitFor();await p.locator('[data-highest-rating] dd').getByText('1900',{exact:true}).waitFor();
 assert.equal(await p.locator('h1').innerText(),'プロフィール・成績');await p.getByText('勝利の王冠',{exact:true}).waitFor();assert.equal(await profile.getByText('900',{exact:true}).count(),1);assert(await profile.getByText('未記録',{exact:true}).count()>0);
 const panel=label=>profile.locator('section.next-panel').filter({has:p.getByRole('heading',{name:label,exact:true})});
 assert.match(await panel('イージー').innerText(),/1666/);assert.match(await panel('イージー').innerText(),/1810/);assert.match(await panel('ノーマル').innerText(),/1540/);assert.match(await panel('ノーマル').innerText(),/1900/);
 await p.getByRole('tab',{name:'対戦記録',exact:true}).click();const bp=panel('B方式（従来の保存記録）');assert.equal(await bp.locator('.next-stat').filter({hasText:'対戦数'}).locator('dd').innerText(),'10');assert.equal(await panel('従来の対戦記録（保存済み通算）').locator('.next-stat').filter({hasText:'対戦数'}).locator('dd').innerText(),'20');
 assert.match(await panel('C方式（従来の保存記録）').innerText(),/未記録/);await p.getByRole('tab',{name:'対戦記録'}).press('ArrowRight');await p.getByRole('tabpanel').getByText('勝利の王冠',{exact:true}).waitFor();await panel('きせかえ装備').getByText('木のタイル',{exact:true}).waitFor();
 await p.getByRole('tab',{name:'概要'}).click();assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 if(process.env.CAPTURE_PROFILE==='1'&&[390,1440].includes(width)){await p.evaluate(()=>document.fonts.ready);const vh=width>900?1080:844;if(width<900)await p.setViewportSize({width,height:await p.evaluate(()=>document.documentElement.scrollHeight)});await p.screenshot({path:`docs/next-major/phase2a/profile-${width}.png`,fullPage:true});await p.setViewportSize({width,height:vh});}
 await profile.getByRole('button',{name:'きせかえ',exact:true}).click();await p.getByRole('button',{name:'タイル',exact:true}).waitFor();await p.getByRole('button',{name:'とじる',exact:true}).click();
 await profile.getByRole('button',{name:'ゴースト対戦',exact:true}).click();await p.getByRole('button',{name:'とじる',exact:true}).click();
 await profile.getByRole('button',{name:'戻る',exact:true}).click();await p.locator('.home-content').waitFor();
 await p.locator('.support-link').filter({hasText:'ランキング'}).click();await p.locator('.ranking-grid').waitFor();
 if(width>900)await p.getByRole('navigation',{name:'PCメインメニュー'}).getByRole('button',{name:'プロフィール',exact:true}).click();else{await p.getByRole('button',{name:'メニューを開く'}).click();await p.getByRole('dialog',{name:'メインメニュー'}).getByRole('button',{name:'プロフィール',exact:true}).click();}
 await profile.waitFor();await profile.getByRole('button',{name:'戻る',exact:true}).click();await p.locator('.ranking-grid').waitFor();
 if(width<900){await p.addStyleTag({content:'.next-home .bottom-nav{padding-bottom:40px}.next-home .page-shell{padding-bottom:139px}'});}
 await p.locator('button[aria-label="ホームへ"]').first().evaluate(e=>e.click());await p.locator('.action-card.solo').click(); await p.locator('[data-solo-profile]').click();await profile.waitFor();
 const last=profile.locator('.next-stat').last();await last.evaluate(e=>e.scrollIntoView({block:'center'}));assert(await last.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit)}));
 await profile.getByRole('button',{name:'戻る',exact:true}).click();await p.getByRole('button',{name:'スタート',exact:true}).waitFor();
 assert.equal(JSON.stringify({stats:tree.games.factor.accounts.ateacher.stats,profiles:tree.games.factor.onlineSparkV1.profiles}),original);
 assert.equal(t.writes.filter(x=>/\/stats(?:\/|$)|onlineSparkV1\/profiles\//.test(x.path)).length,0);assert.deepEqual(t.errors,[]);
 console.log(`PASS profile ${width}: known/unknown values, separate records, titles/equipment retained, keyboard tabs, origin return, no stats/profile writes`);await t.ctx.close();
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
