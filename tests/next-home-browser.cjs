const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium,context}=require('./browser-harness.cjs');
const out='docs/next-update/home-connected';
const source=fs.readFileSync('next-home-ui.js','utf8')+`\n{const f=window.NextHomeFactory;window.NextHomeFactory=H=>{window.__homeH=H;H.now=()=>window.__homeTime||Date.parse('2026-10-15T12:00:00Z');return f(H)}}`;
const errorsMock=fs.readFileSync('tests/firebase-mock.js','utf8').replace('on(ev, fn, cancel) {',`on(ev, fn, cancel) {if(window.__denyBoss && path.includes('/raidw/')){setTimeout(()=>cancel({code:'PERMISSION_DENIED'}),0);return fn;}`);
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});const results=[];
try{for(const width of [375,390,430,1440]){
 const tree={games:{factor:{accounts:{ateacher:{name:'Teacher',stats:{exp:900,rating:1650}}},raidw:{'2026-10-12':{meta:{boss:'dragon',rage:0},dmg:{a:{d:17550}}}},onlineSparkV1:{config:{enabled:true,protocol:'spark-v1'},profiles:{ateacher:{name:'Teacher',easy:{rating:1665.6},normal:{rating:1580}}}}}}};
 const t=await context(browser,{tree,assetOverrides:{'/next-home-ui.js':source},firebaseSource:errorsMock}),p=t.page;
 await p.setViewportSize({width,height:width===1440?1080:844});
 await p.locator('[data-next-home]').waitFor();const logo=p.locator('.next-home .brand-slot img:visible, .next-home .mobile-brand img:visible');await logo.evaluate(e=>e.decode());assert.equal(await logo.getAttribute('src'),'ui-next/logo-official.png');assert.deepEqual(await logo.evaluate(e=>[e.naturalWidth,e.naturalHeight]),[1774,887]);assert.equal(await p.locator('.next-home .logo-note').count(),0);const hp=p.getByRole('progressbar',{name:'今週のボスの残りHP'});await hp.waitFor();
 assert.equal(await hp.getAttribute('aria-valuemax'),'30000');assert.equal(await hp.getAttribute('aria-valuenow'),'12450');
 await p.locator('.ratings').getByText('1666',{exact:true}).waitFor();
 await p.evaluate(()=>document.fonts.ready);await p.locator('.boss-art img').evaluate(e=>e.decode());
 assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
 const card=await p.locator('.boss-stage').boundingBox();if(width<900)assert(card.height<340,'compact HP card');
 if(process.env.CAPTURE_NEXT_HOME==='1' && [375,390,430,1440].includes(width)){if(width<900)await p.setViewportSize({width,height:await p.evaluate(()=>document.documentElement.scrollHeight)});await p.screenshot({path:`${out}/home-${width}.png`,fullPage:true});await p.setViewportSize({width,height:width===1440?1080:844});}
 if(width<900){
  await p.addStyleTag({content:'.next-home .bottom-nav{padding-bottom:40px}.next-home .page-shell{padding-bottom:139px}'});
  for(const sel of ['.boss-details .small-button','.mission-strip','.support-link'])for(const target of await p.locator(sel).all()){
   await target.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
   assert(await target.evaluate(e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h)}),'safe-area target must be reachable');
  }
 }
 await p.evaluate(()=>window.__fbApply({kind:'set',path:'games/factor/raidw/2026-10-12/dmg/a',v:{d:29000}}));await p.waitForFunction(()=>document.querySelector('[role=progressbar]').getAttribute('aria-valuenow')==='1000');
 await p.evaluate(()=>window.__fbApply({kind:'set',path:'games/factor/raidw/2026-10-12/dmg/b',v:{d:1000}}));await p.getByText('討伐済み',{exact:true}).waitFor();assert.equal(await hp.getAttribute('aria-valuenow'),'0');
 // Existing revival and rage calculations must be reused without changing the formula.
 const calc=await p.evaluate(()=>{const H=window.__homeH;return [H.weeklyInfo('2026-10-12',{a:{d:20000}},{boss:'maou',rage:0}),H.weeklyInfo('2026-10-12',{},{boss:'dragon',rage:1})].map(x=>({hp:x.hp,max:x.hpMax,revived:x.revived}));});assert.equal(calc[1].max,36000);
 await p.evaluate(()=>{window.__homeTime=Date.parse('2026-10-19T00:00:01+09:00')});await p.getByText('次のボスを準備中',{exact:true}).waitFor();assert.equal(await hp.count(),0);
 await p.evaluate(()=>window.__fbApply({kind:'set',path:'games/factor/raidw/2026-10-19/meta',v:{boss:'dragon',rage:0}}));await hp.waitFor();assert.equal(await hp.getAttribute('aria-valuenow'),'30000');
 assert.equal(t.writes.filter(x=>/\/raidw\//.test(x.path)).length,0,'home never writes boss data');
 // Retry uses genuine subscription cancellation, not a fake UI-only error flag.
 await p.evaluate(()=>{window.__denyBoss=true;window.__homeTime=Date.parse('2026-10-26T00:00:01+09:00')});await p.getByRole('alert').waitFor();assert.match(await p.getByRole('alert').innerText(),/権限不足/);assert.equal(await hp.count(),0);
 await p.evaluate(()=>{window.__denyBoss=false});await p.getByRole('button',{name:'再試行',exact:true}).click();await p.getByText('次のボスを準備中',{exact:true}).waitFor();
 const nav=p.getByRole('navigation',{name:width>900?'PCメインメニュー':'スマホメインメニュー'});
 if(width<900){await p.getByRole('button',{name:'メニューを開く'}).click();await p.getByRole('dialog',{name:'メインメニュー'}).waitFor();await p.keyboard.press('Escape');await p.getByRole('dialog',{name:'メインメニュー'}).waitFor({state:'hidden'});}
 await nav.getByRole('button',{name:width>900?'ソロモード':'ソロ',exact:true}).click();await p.getByRole('button',{name:'スタート',exact:true}).waitFor();
 assert.equal(await p.locator('link[href="ui-next/home.css"]').count(),1,'shared shell stylesheet remains on solo menu');
 await p.getByRole('button',{name:'ホームへ',exact:true}).click();await p.locator('[data-next-home]').waitFor();
 await p.locator('.support-link').filter({hasText:'ランキング'}).click();await p.locator('.ranking-entry').filter({hasText:'ソロランキング'}).click();await p.getByRole('button',{name:'この端末 TOP3',exact:true}).waitFor();
 await p.getByRole('button',{name:'ランキング総合へ戻る',exact:true}).click();await p.getByRole('button',{name:'ホームへ',exact:true}).first().click();await p.locator('.support-link').filter({hasText:'あそびかた'}).click();await p.getByRole('heading',{name:'あそびかた',exact:true}).waitFor();await p.locator('[data-next-help]').waitFor();
 // Return by root callback through exposed helpers is unnecessary: reloading tests listener cleanup too.
 await p.reload();await p.locator('[data-next-home]').waitFor();await p.locator('.action-card.online').click();await p.getByRole('button',{name:'オンラインレーティング',exact:true}).waitFor();
 assert.deepEqual(t.errors,[]);results.push({width,cardHeight:card.height,realtime:true,defeated:true,weekRollover:true,permissionAndRetry:true,navigation:true,safeArea34:width<900,bossWrites:0,errors:t.errors});await t.ctx.close();
}if(process.env.CAPTURE_NEXT_HOME==='1')fs.writeFileSync(`${out}/checks.json`,JSON.stringify(results,null,2)+'\n');console.log('PASS next home: 4 widths, exact HP/live damage/kill/rage/week/permission retry, solo/ranking/help/online navigation, no boss writes');}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
