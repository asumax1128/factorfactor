const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium,context}=require('./browser-harness.cjs');
(async()=>{
 const bytes=fs.readFileSync('ui-next/logo-official.png');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'f6f33fa07b4c9524d38d1884921276d91eca75f2a9c2bb73c11d9a0484537910','exact supplied PNG');
 assert.equal(bytes[25],6,'RGBA PNG');
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
 try {for(const width of [375,390,430,1440]){
  const d=new Date(Date.now()+9*3600000);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);const week=d.toISOString().slice(0,10);
  const tree={games:{factor:{raidw:{}}}};tree.games.factor.raidw[week]={meta:{boss:'dragon',rage:0},dmg:{fixture:{d:17550}}};
  const t=await context(b,{tree}),p=t.page;await p.setViewportSize({width,height:width>900?1000:844});
  const logo=p.locator('.brand-slot img:visible,.mobile-brand img:visible');await logo.waitFor();await logo.evaluate(e=>e.decode());await p.evaluate(()=>document.fonts.ready);
  assert.equal(await logo.getAttribute('src'),'ui-next/logo-official.png');
  const image=await logo.evaluate(e=>{const r=e.getBoundingClientRect();return{size:[e.naturalWidth,e.naturalHeight],ratio:r.width/r.height,bg:getComputedStyle(e).backgroundColor,width:r.width,height:r.height}});
  assert.deepEqual(image.size,[1774,887]);assert(Math.abs(image.ratio-2)<.01);assert.equal(image.bg,'rgba(0, 0, 0, 0)');assert(image.width>=140);assert.equal(await p.locator('.logo-note').count(),0);
  assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));assert.deepEqual(t.errors,[]);
  if(process.env.CAPTURE_LOGO==='1'&&[390,1440].includes(width)){
   await p.locator('.boss-art img').waitFor();await p.locator('.boss-art img').evaluate(e=>e.decode());
   await p.screenshot({path:`docs/next-major/logo-final/home-${width===390?'mobile':'pc'}.png`});
  }
  console.log(`PASS ${width}: original RGBA logo, 2:1 ratio, decoded, no added background/overflow`);await t.ctx.close();
 }}finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
