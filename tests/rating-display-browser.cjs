const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,context}=require('./browser-harness.cjs');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});try{for(const width of [390,1366]){
 const season=new Date(Date.now()+9*3600e3).toISOString().slice(0,7);
 const record=(rating,maxRating=rating)=>({rating,maxRating,seasonMax:maxRating,season,games:3,w:2,l:1,d:0});
 const accounts={ateacher:{name:'Asuma',stats:{rating:1650,maxRating:1800,games:20,w:12,season,skin:{tile:'wood'}}},atarget:{name:'Target',stats:{rating:1650,maxRating:1700,games:4,w:2}}};
 const profiles={ateacher:{name:'Asuma',easy:record(1665.6,1819.9),normal:record(1540.3,1600)},atarget:{name:'Target',easy:record(1665.5,1750),normal:record(1600.4,1850)}};
 for(let i=0;i<6;i++){accounts['ap'+i]={name:'Player'+i,stats:{rating:1700}};profiles['ap'+i]={name:'Player'+i,easy:record(1800+i),normal:record(1500)}}
 const tree={games:{factor:{accounts,onlineSparkV1:{config:{enabled:true,protocol:'spark-v1'},profiles}}}};
 const ui=fs.readFileSync('online-rated-ui.js','utf8')+'\n(()=>{const f=window.OnlineRatedFactory;window.OnlineRatedFactory=H=>{window.__ratingH=H;return f(H)}})();';
 const t=await context(b,{tree,assetOverrides:{'/online-rated-ui.js':ui}}),p=t.page;
 await p.setViewportSize({width,height:844});
 await p.getByRole('button',{name:'オンライン対戦・CPU練習',exact:true}).click();
 const current=p.locator('[data-current-ratings]');await current.getByText('1666',{exact:true}).waitFor();assert.match(await current.innerText(),/イージー 現在レート/);assert.match(await current.innerText(),/ノーマル 現在レート/);assert.match(await current.innerText(),/1540/);assert(!await current.innerText().then(x=>x.includes('1650')));
 // A committed ghost/BOT rating update must immediately refresh the lobby.
 await p.evaluate(()=>window.__fbApply({kind:'set',path:'games/factor/onlineSparkV1/profiles/ateacher/easy/rating',v:1667.6}));await current.getByText('1668',{exact:true}).waitFor();
 await p.evaluate(()=>window.__fbApply({kind:'set',path:'games/factor/onlineSparkV1/profiles/ateacher/easy/rating',v:1665.6}));await current.getByText('1666',{exact:true}).waitFor();
 await p.getByRole('button',{name:'称号とくわしい成績',exact:true}).click();await p.getByRole('button',{name:'ゴースト対戦',exact:true}).click();await p.locator('.fixed.inset-0 [data-highest-rating]').getByText('1820',{exact:true}).waitFor();assert.equal(await p.locator('[data-current-ratings]').last().getByText('1666',{exact:true}).count(),1);await p.getByRole('button',{name:'とじる',exact:true}).click();await p.getByRole('button',{name:'戻る',exact:true}).click();
 await p.getByRole('button',{name:'オンラインレーティング',exact:true}).click();await p.locator('.or-rating').getByText('1666',{exact:true}).waitFor();const row=p.locator('.or-ranking li').filter({has:p.getByRole('button',{name:'Asuma',exact:true})});assert.match(await row.innerText(),/7位/);assert.equal(await row.locator('strong').innerText(),'1666');const target=p.locator('.or-ranking li').filter({has:p.getByRole('button',{name:'Target',exact:true})});assert.match(await target.innerText(),/8位/);assert.equal(await target.locator('strong').innerText(),'1666');
 await target.getByRole('button',{name:'Target',exact:true}).click();await p.locator('[data-current-ratings]').getByText('1666',{exact:true}).waitFor();await p.locator('.fixed.inset-0 [data-highest-rating]').getByText('1850',{exact:true}).waitFor();await p.getByRole('button',{name:'とじる',exact:true}).click();
 await p.getByRole('button',{name:'ノーマル',exact:true}).click();assert.equal(await p.locator('.or-rating').innerText(),'1540');
 await p.evaluate(()=>{const H=window.__ratingH,el=document.createElement('div');el.id='rating-result';document.body.appendChild(el);ReactDOM.createRoot(el).render(React.createElement(window.OnlineRatedFactory(H).Result,{H,acct:{key:'ateacher'},state:{badges:{}},titles:{},badgesBefore:{},busy:false,onExit:()=>{},m:{outcome:'win',origin:'quick',difficulty:'easy',opponent:{type:'bot'},exp:8,receipt:{players:{ateacher:{before:1665.6,after:1670.1,delta:4.5}}}}}))});await p.locator('#rating-result').getByText('1666 → 1670',{exact:true}).waitFor();assert.equal(await p.locator('#rating-result .or-delta').innerText(),'レート +5');
 assert.equal(profiles.ateacher.easy.rating,1665.6);assert.equal(accounts.ateacher.stats.rating,1650);assert.equal(profiles.ateacher.easy.maxRating,1819.9);assert.equal(accounts.ateacher.stats.skin.tile,'wood');assert.equal(t.writes.filter(x=>/\/stats(?:\/|$)|onlineSparkV1\/profiles\//.test(x.path)).length,0);assert.equal(t.errors.length,0);
 console.log('PASS lobby/current/history, realtime ghost update, 7th/8th raw ranking, other profile, NORMAL and rounded result at '+width);await t.ctx.close();
 }}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
