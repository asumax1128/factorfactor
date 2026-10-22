const nav = require("./browser-harness.cjs"); // shared navigation (goHome / openSoloMode …)
const assert=require('node:assert/strict');const {chromium,context}=require('./browser-harness.cjs');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});try{
 for(const width of [375,390,430,1440]){
 const season=new Date(Date.now()+9*3600000).toISOString().slice(0,7);
 const day=Math.floor((Date.now()+9*3600000)/86400000);
 const tree={games:{factor:{}}},f=tree.games.factor;
 f.accounts={ateacher:{name:'Teacher',stats:{rating:1600,exp:100}}};
 f.dailyV2={ready:true,boards:{[day]:{easy:{records:{fixture:{key:'fixture',name:'DailyFixture',score:321,cleared:true,elapsed:45000,correct:15,sortKey:'a'}}}}}};
 f.onlineSparkV1={config:{enabled:true,protocol:'spark-v1'},profiles:{ateacher:{name:'Teacher',easy:{rating:1665.6,season,games:3,w:2,l:1},normal:{rating:1550,season,games:1,w:1}}}};
 const t=await context(b,{tree}),p=t.page;await p.setViewportSize({width,height:844});
 await p.locator('[data-next-home]').waitFor();await p.locator('.support-link').filter({hasText:'ランキング'}).click();
 const nav=p.getByRole('navigation',{name:width>900?'PCメインメニュー':'スマホメインメニュー'});
 await p.locator('.ranking-grid').waitFor();assert.equal(await p.locator('.ranking-entry').count(),3);assert.equal(await nav.locator('[aria-current=page]').innerText(),width>900?'ランキング':'順位');
 for(const name of ['ソロランキング','デイリーランキング','レーティングランキング']){
  await p.locator('.ranking-entry').filter({hasText:name}).click();const view=p.getByRole('region',{name:'ランキング表示'});
  if(name==='ソロランキング'){await view.getByRole('button',{name:'この端末 TOP3',exact:true}).waitFor();await view.getByRole('button',{name:'この端末 TOP3',exact:true}).click();}
  if(name==='デイリーランキング'){await view.getByText(/DailyFixture/).waitFor();assert.match(await view.innerText(),/321\s*点/);await view.getByRole('button',{name:'昨日',exact:true}).click();await view.getByText('まだ記録がありません',{exact:true}).waitFor();await view.getByRole('button',{name:'今日',exact:true}).click();await view.getByText(/DailyFixture/).waitFor();await view.getByRole('button',{name:'ノーマル',exact:true}).click();await view.getByText('ノーマル TOP10',{exact:true}).waitFor();}
  if(name==='レーティングランキング'){await view.locator('.or-rating').getByText('1666',{exact:true}).waitFor();await view.getByRole('button',{name:'ノーマル',exact:true}).click();await view.locator('.or-rating').getByText('1550',{exact:true}).waitFor();}
  assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),name+' overflow '+width);
  await p.getByRole('button',{name:'ランキング総合へ戻る',exact:true}).click();await p.locator('.ranking-grid').waitFor();
 }
 if(width<900){await p.getByRole('button',{name:'メニューを開く',exact:true}).click();await p.getByRole('dialog',{name:'メインメニュー'}).waitFor();await p.keyboard.press('Escape');}
 await nav.goHome(p);await p.locator('.home-content').waitFor();
 await nav.getByRole('button',{name:width>900?'ランキング':'順位',exact:true}).click();await p.locator('.ranking-grid').waitFor();
 await nav.getByRole('button',{name:'ホーム',exact:true}).click();await p.locator('.home-content').waitFor();
 assert.deepEqual(t.errors,[]);assert.equal(tree.games.factor.onlineSparkV1.profiles.ateacher.easy.rating,1665.6);assert.equal(tree.games.factor.dailyV2.boards[day].easy.records.fixture.score,321);
 assert.equal(t.writes.filter(x=>/\/dailyV2\/(?:attempts|boards)\/|\/raidw\//.test(x.path)).length,0,'ranking browsing must not start challenges, change boards or initialize boss');
 console.log(`PASS ${width}: three existing rankings, sample score/rating, tabs, back/hub/home, selected navigation, no horizontal overflow`);await t.ctx.close();
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
