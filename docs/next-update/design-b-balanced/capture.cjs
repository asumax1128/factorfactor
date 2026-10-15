// Offline review; all requests are fulfilled from this repository, never Firebase.
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium'});
 const out = {measurements:[], externalRequests:0, errors:[], assetChecks:[]};
 try {
  for (const width of [375,390,430,1440]) {
   const height = ({375:812,390:844,430:932,1440:1080})[width];
   const shots = {};
   for (const variant of ['before','after']) {
    const ctx = await browser.newContext({viewport:{width,height},hasTouch:width<900});
    await ctx.route('**/*', route => {
     const u = new URL(route.request().url());
     if(u.hostname !== 'localhost') { out.externalRequests++; return route.abort(); }
     const f = path.resolve(root,'.'+decodeURI(u.pathname));
     if(!f.startsWith(root+'/') || !fs.existsSync(f)) return route.abort();
     return route.fulfill({path:f});
    });
    const p = await ctx.newPage(); p.on('pageerror',e=>out.errors.push(e.message));
    await p.goto(`http://localhost/docs/next-update/design-b-${variant==='before'?'refined':'balanced'}/home.html`);
    await p.evaluate(()=>document.fonts.ready);
    await p.locator('.boss-art img').evaluate(e=>e.decode());
    await p.locator('[data-brand-image]:visible').evaluate(e=>e.decode());
    const m = await p.evaluate(()=>{
     const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
     const nav=box('.bottom-nav');
     return {viewport:[innerWidth,innerHeight],pageHeight:document.documentElement.scrollHeight,scroll:Math.max(0,document.documentElement.scrollHeight-innerHeight),boss:box('.boss-stage'),image:box('.boss-art img'),bossButton:box('.boss-details .small-button'),modes:[...document.querySelectorAll('.action-card')].map(e=>({height:e.offsetHeight,width:e.offsetWidth})),mission:box('.mission-strip'),nav,overflow:document.documentElement.scrollWidth>innerWidth,fontStatus:document.fonts.status};
    });
    m.variant=variant;out.measurements.push(m);assert(!m.overflow);assert.equal(m.fontStatus,'loaded');assert(m.bossButton.height>=44);
    if(width===390) {
     await p.screenshot({path:path.join(__dirname,`${variant}-first-view.png`)});
     await p.setViewportSize({width,height:m.pageHeight});
     await p.screenshot({path:path.join(__dirname,variant==='before'?'before-mobile.png':'balanced-mobile.png'),fullPage:true});
     await p.setViewportSize({width,height});
    }
    if(width===1440) shots[variant]=await p.screenshot({fullPage:true});
    if(width<900 && variant==='after') {
     assert.equal(await p.locator('.home-actions').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),2);
     // Simulate a 34px safe-area inset: Chromium on Linux has no iPhone hardware inset.
     await p.addStyleTag({content:'.bottom-nav{padding-bottom:40px}.page-shell{padding-bottom:139px}'});
     const targets=['.boss-details .small-button','.mission-strip','.support-link'];
     for(const selector of targets) for(const target of await p.locator(selector).all()) {
      await target.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
      assert(await target.evaluate(e=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===e||e.contains(hit);}),`target covered ${width} ${selector}`);
     }
     await p.getByRole('button',{name:'メニューを開く',exact:true}).click();
     await p.getByRole('dialog',{name:'メインメニュー',exact:true}).waitFor();
     await p.keyboard.press('Escape');
     await p.waitForFunction(()=>document.getElementById('open-menu').getAttribute('aria-expanded')==='false');
     for(const asset of ['dragon','kraken','abs','maou2','king']) {
      const f=path.join(root,'img/monsters',asset+'.webp');if(!fs.existsSync(f))continue;
      await p.locator('.boss-art img').evaluate(async(e,src)=>{e.src=src;await e.decode();},'../../../img/monsters/'+asset+'.webp');
      const b=await p.locator('.boss-stage').boundingBox();
      assert.equal(b.height,m.boss.height,'boss aspect ratio must not change layout');
      out.assetChecks.push({width,asset,cardHeight:b.height,objectFit:await p.locator('.boss-art img').evaluate(e=>getComputedStyle(e).objectFit)});
     }
    }
    await ctx.close();
   }
   if(width===1440) {
    assert(shots.before.equals(shots.after),'desktop must be pixel-identical');
    out.desktopPixelIdentical=true;out.desktopSha256=sha(shots.after);
    fs.writeFileSync(path.join(__dirname,'home-pc.png'),shots.after);
   }
  }
  assert.equal(out.externalRequests,0);assert.deepEqual(out.errors,[]);
  fs.writeFileSync(path.join(__dirname,'checks.json'),JSON.stringify(out,null,2)+'\n');
  console.log(JSON.stringify(out,null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
