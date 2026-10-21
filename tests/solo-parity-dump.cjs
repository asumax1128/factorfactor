// Plays normal solo games through the real UI and dumps everything that must not change when the result screen is replaced:
// database write paths, EXP delta, ghost/ranking/mission local storage. Run on two checkouts and diff the JSON.
const fs=require('node:fs'),{chromium,context}=require('./browser-harness.cjs'),{soloDrag}=require('./solo-test-helper.cjs');
const exe=process.env.CHROMIUM_PATH||'/usr/bin/chromium';
async function start(p,label){await p.locator('.action-card.solo').click(); await p.locator('[data-solo-mode=play]').click();await p.getByRole('button',{name:new RegExp('^'+label)}).first().click();await p.getByRole('button',{name:'スタート',exact:true}).click();await p.locator('[data-tile-id]').first().waitFor()}
const norm=o=>JSON.parse(JSON.stringify(o,(k,v)=>typeof v==='number'?'#':typeof v==='string'&&/^\d{10,}/.test(v)?'#':v));
(async()=>{const b=await chromium.launch({executablePath:exe}),out={};try{
 for(const [name,label,plan] of [['easy-clear','イージー',{right:15,wrong:0}],['normal-over','ノーマル',{right:3,wrong:6}],['hard-over','ハード',{right:0,wrong:6}]]){
  const tree={games:{factor:{accounts:{ateacher:{name:'Teacher',stats:{exp:100,rating:1600}}}}}};
  const t=await context(b,{tree}),p=t.page;await start(p,label);
  for(let i=0;i<plan.right;i++){await soloDrag(p,true);await p.waitForTimeout(650)}
  for(let i=0;i<plan.wrong&&!await p.getByText(/GAME OVER|CLEAR!/).count();i++){await soloDrag(p,false);await p.waitForTimeout(650)}
  await p.getByText(/GAME OVER|CLEAR!/).first().waitFor({timeout:20000});await p.waitForTimeout(1500);
  const ls=await p.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage[k]])));
  const rec={writes:t.writes.map(w=>[w.type||w.op||'',w.path||'']).sort((x,y)=>(x[0]+x[1]).localeCompare(y[0]+y[1])),exp:tree.games.factor.accounts.ateacher.stats.exp-100,ghost:Object.keys(ls).filter(k=>/ghost/.test(k)).map(k=>JSON.parse(ls[k])),ls:Object.keys(ls),errors:t.errors};
  out[name]=rec;await t.ctx.close()}
 fs.writeFileSync(process.argv[2]||'/dev/stdout',JSON.stringify(out,null,1));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
