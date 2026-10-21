const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,context,pair,sleep}=require('./browser-harness.cjs');
const sizes=[[1366,650,100],[1093,520,125],[911,433,150],[683,325,200],[1024,600,100],[512,300,200],[800,450,100],[390,844,100]];
async function gesture(p,selector,ids,touch=true){
  const first=p.locator(`${selector}="${ids[0]}"]`),last=p.locator(`${selector}="${ids[1]}"]`);
  await first.scrollIntoViewIfNeeded();await last.scrollIntoViewIfNeeded();
  const a=await first.boundingBox(),b=await last.boundingBox();
  const x=a.x+a.width/2,y=a.y+a.height/2,u=b.x+b.width/2,v=b.y+b.height/2;
  if(touch){const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await sleep(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:u,y:v}]});await sleep(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}
  else{await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(u,v,{steps:5});await p.mouse.up();}
}
async function geometry(p,attr,w,h){
  await p.setViewportSize({width:w,height:h});await sleep(150);
  const tiles=p.locator(`[${attr}]`);await p.waitForFunction(a=>document.querySelectorAll(`[${a}]`).length>=6,attr,{timeout:15000});const count=await tiles.count();assert(count>=6); 
  for(let i=0;i<count;i++){await tiles.nth(i).evaluate(e=>e.scrollIntoView({block:"center"}));await sleep(100);let r=await tiles.nth(i).boundingBox();assert(r.height>=30,`card collapsed ${w}x${h}: ${r.height}`);assert(r.x>=-1&&r.x+r.width<=w+1,`card width clipped ${w}x${h}`);assert(r.y>=-1&&r.y+r.height<=h+1,`card unreachable ${w}x${h}: ${JSON.stringify(r)}`);}
  const math=p.locator('.v7-main .v7-poly').first();await math.evaluate(e=>e.scrollIntoView({block:'center'}));await sleep(100);const r=await math.boundingBox();assert(r.x>=0&&r.x+r.width<=w+1&&r.y>=0&&r.y+r.height<=h+1,'formula must be reachable');
}
const ui=fs.readFileSync('online-rated-ui.js','utf8')+`\n(function(){const factory=window.OnlineRatedFactory;window.OnlineRatedFactory=H=>{window.__H=H;const c=H.createTransport;H.createTransport=a=>{const t=c(a);return{close:()=>t.close(),request:async cmd=>{const out=await t.request(cmd);window.__state=out;return out;}}};return factory(H)}})();`;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});try{
 const t=await context(browser,{account:{guest:true,name:'Guest'}}),p=t.page;
 await p.locator('.action-card.solo').click(); await p.locator('[data-solo-mode=cpu]').click();await p.getByRole('button',{name:'CPUと練習スタート',exact:true}).click();await p.locator('[data-btile]').first().waitFor();await sleep(3300);
 for(const[w,h,z]of sizes){await geometry(p,'data-btile',w,h);console.log(`PASS CPU reachable cards/formula effective viewport ${w}x${h} (${z}% equivalent)`)}
 for(const px of [20,24,32]){await p.evaluate(px=>document.documentElement.style.fontSize=px+'px',px);await geometry(p,'data-btile',512,300);console.log('PASS enlarged base text '+px+'px')}await p.evaluate(()=>document.documentElement.style.fontSize='');
 const metric=await t.ctx.newCDPSession(p);for(const dpr of [1,1.25,2]){await metric.send('Emulation.setDeviceMetricsOverride',{width:683,height:325,deviceScaleFactor:dpr,mobile:false});assert.equal(await p.evaluate(()=>devicePixelRatio),dpr);await geometry(p,'data-btile',683,325);console.log('PASS DPR '+dpr)}await metric.send('Emulation.clearDeviceMetricsOverride');await metric.detach();
 await p.setViewportSize({width:512,height:300});await p.locator('.compat-play').evaluate(e=>e.scrollTop=0);
 const scrollCDP=await t.ctx.newCDPSession(p);await scrollCDP.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:25,y:220}]});
 for(let y=200;y>=60;y-=20){await scrollCDP.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:25,y}]});await sleep(30)}
 await scrollCDP.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(120);assert(await p.locator('.compat-play').evaluate(e=>e.scrollTop)>20,'short window supports actual touch scrolling from HUD');await scrollCDP.detach();
 await p.setViewportSize({width:683,height:325});
 await p.evaluate(()=>{window.__events=[];for(const type of ['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchend'])window.addEventListener(type,e=>window.__events.push({type,pointerType:e.pointerType||null}),{capture:true});});
 const ids=await pair(p);await p.locator(`[data-btile="${ids[0]}"]`).tap();await p.locator(`[data-btile="${ids[1]}"]`).tap();assert.equal(await p.locator('svg line').count(),0,'single/separate taps leave no selection');
 const cpuBefore=Number(await p.locator('.v7-st b').first().textContent());
 await gesture(p,'[data-btile',ids,true);await p.waitForFunction(n=>Number(document.querySelector('.v7-st b').textContent)>n,cpuBefore,{timeout:5000});await sleep(250);assert((await p.evaluate(()=>window.__events)).some(e=>e.type==='pointerup'&&e.pointerType==='touch'));await sleep(1000);
 const mouseBefore=Number(await p.locator('.v7-st b').first().textContent());await gesture(p,'[data-btile',await pair(p),false);await p.waitForFunction(n=>Number(document.querySelector('.v7-st b').textContent)>n,mouseBefore,{timeout:5000});await sleep(1000);assert.equal(t.errors.length,0);console.log('PASS CPU touch + mouse drag on short hybrid viewport');
 await p.reload();await p.locator('.action-card.solo').click(); await p.locator('[data-solo-mode=play]').click();await p.getByRole('button',{name:'スタート',exact:true}).click();await p.locator('[data-tile-id]').first().waitFor();
 for(const[w,h,z]of sizes){await geometry(p,'data-tile-id',w,h);console.log(`PASS solo reachable cards/formula ${w}x${h}`)}
 await p.setViewportSize({width:683,height:325});const soloIds=await p.locator('[data-tile-id]').evaluateAll(es=>es.slice(0,2).map(e=>e.dataset.tileId));await gesture(p,'[data-tile-id',soloIds);await p.locator('.combat-judge:visible').first().waitFor({timeout:3000});await sleep(200);assert.equal(await p.locator('svg line').count(),0);assert.equal(t.errors.length,0);await t.ctx.close();
 for(const mode of ['A','B']){
 const t=await context(browser,{assetOverrides:{'/online-rated-ui.js':ui},tree:{games:{factor:{accounts:{ateacher:{name:'Teacher',stats:{rating:1600,exp:100}},atarget:{name:'Target',stats:{rating:1600},prof:{lv:{L1:{n:30,ok:25,ms:300000}}}}},onlineSparkV1:{config:{enabled:true,protocol:'spark-v1'}}}}}}),p=t.page;
 await p.getByRole('button',{name:'オンライン対戦（ロビー）',exact:true}).click();await p.getByRole('button',{name:'すぐ遊ぶ（ランダム対戦）',exact:true}).click();await p.getByRole('button',{name:'イージーで相手を探す',exact:true}).click();await p.getByRole('button',{name:mode==='A'?'A：早い者勝ち':'B：レース＋攻撃',exact:true}).waitFor({timeout:22000});await p.getByRole('button',{name:mode==='A'?'A：早い者勝ち':'B：レース＋攻撃',exact:true}).click();await p.locator('[data-btile]').first().waitFor();await p.locator('[data-online-ready="true"]').waitFor({timeout:10000});
 await p.setViewportSize({width:683,height:325});await p.locator('[data-poly]').waitFor({timeout:22000});await p.locator('[data-btile]').first().waitFor();let ids=await pair(p);const poly0=await p.locator('[data-poly]').getAttribute('data-poly');const seq=await p.evaluate(()=>window.__state.match.game.acceptedSeq);await gesture(p,'[data-btile',ids,true);await p.waitForFunction(n=>window.__state.match.game.acceptedSeq>n,seq,{timeout:10000});const m=await p.evaluate(()=>window.__state.match);assert(mode==='A'?m.game.live[m.selfUid]>0:m.game.live[m.selfUid].c>0,'touch must solve a problem');await p.waitForFunction(q=>{const e=document.querySelector('[data-poly]');return e&&e.dataset.poly!==q&&document.querySelector('[data-btile]')},poly0,{timeout:15000});const mouseSeq=await p.evaluate(()=>window.__state.match.game.acceptedSeq);await gesture(p,'[data-btile',await pair(p),false);await p.waitForFunction(n=>window.__state.match.game.acceptedSeq>n,mouseSeq,{timeout:10000});for(const[w,h]of sizes){await geometry(p,'data-btile',w,h)}assert.equal(t.errors.length,0);console.log('PASS online '+mode+' geometry, touch/mouse answers');await t.ctx.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
