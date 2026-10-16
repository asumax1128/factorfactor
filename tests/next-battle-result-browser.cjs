const fs=require('node:fs'),assert=require('node:assert/strict'),E=require('../server/online-rated/engine.cjs'),BR=require('../src/b-result.cjs'),AR=require('../src/a-result.cjs'),M=require('../src/battle-result-model.cjs'),{chromium,context,drag}=require('./browser-harness.cjs');
const exe=process.env.CHROMIUM_PATH||'/usr/bin/chromium',WIDTHS=[375,390,430,1440];
// ---------- fixtures (real new-B engine + a-result objects) ----------
function pairOf(g,u,right=true){const v=E.view(g,u),api=E.runtime(g).api;for(let i=0;i<v.tiles.length;i++)for(let j=i+1;j<v.tiles.length;j++)if(api.polyEqual(api.multiply(v.tiles[i].factor,v.tiles[j].factor),v.poly)===right)return{type:'answer',seq:(g.seq[u]||0)+1,question:v.question,tiles:[v.tiles[i].id,v.tiles[j].id]}}
function playB(ids,plan){let g=E.begin('t','easy','B',ids,'fixed',1000,{rules:'b2',duration:90}),t=2000;for(const[u,r,gap]of plan){t+=gap;g=E.step(g,u,{type:'heartbeat'},t);g=E.step(g,u,pairOf(g,u,r),t)}for(const u of g.ids)g.states[u].hp=Math.max(g.states[u].hp,1);return E.step(g,ids[0],{type:'heartbeat'},g.endAt)}
const plan=[['a',true,900],['b',true,1500],['b',true,1200],['a',true,2500],['a',true,800],['a',false,900],['b',true,3000],['a',true,700],['a',true,600],['b',false,1000],['a',true,1800]];
const names={a:'あなた',b:'ソラ',c:'ミナト',d:'ハル'};
const B2=playB(['a','b'],plan),B3=playB(['a','b','c'],[['a',true,900],['b',true,1000],['c',true,1100],['a',true,1500]]);
function aFix(winners,ids=['a','b']){const cb=Object.fromEntries(ids.map(u=>[u,0])),sc={...cb},best={...cb},log=[],claims=[];winners.forEach((w,q)=>{const at=10000+q*5000;if(w){const pts=Math.round(10*(1+cb[w]*.1));sc[w]+=pts;cb[w]++;best[w]=Math.max(best[w],cb[w]);for(const p of ids)if(p!==w)cb[p]=0;log.push({q,w,pts,at});claims[q]={uid:w,at,j:'Great'}}else{ids.forEach(p=>cb[p]=0);log.push({q,w:null,at});claims[q]={uid:'_none',at}}});return{claims,report:AR.build({sc,best,log},claims,ids,5000,420)}}
const af=aFix(['a','a','a','b','b','b','b']);
const cases={
 'A-lose':M.build({kind:'A',me:'a',ids:['a','b'],names,outcome:'l',reasonText:'得点で勝負',A:{report:af.report,claims:af.claims}}),
 'B-win':M.build({kind:'B',me:'a',ids:B2.ids,names,outcome:'w',reasonText:'試合時間終了・得点で勝負',B:{game:B2,trace:BR.build(B2)}}),
 'B-draw':M.build({kind:'B',me:'a',ids:B2.ids,names,outcome:'d',reasonText:'同点',B:{game:B2,trace:BR.build(B2)}}),
 'B-3p':M.build({kind:'B',me:'a',ids:B3.ids,names,outcome:'l',rank:{a:2,b:1,c:3},reasonText:'試合時間終了',B:{game:B3,trace:BR.build(B3)}}),
 'B-missing':M.build({kind:'B',me:'a',ids:B2.ids,names,outcome:'w',B:{game:(()=>{const g=structuredClone(B2);delete g.states.b.hist;delete g.scoreTrace;return g})(),trace:null}}),
};
// win / lose / draw for 2 and 3 players, both methods
const rankFor=(ids,outcome)=>outcome==='w'?Object.fromEntries(ids.map((u,i)=>[u,u==='a'?1:i+1])):outcome==='d'?Object.fromEntries(ids.map(u=>[u,1])):Object.fromEntries(ids.map((u,i)=>[u,u==='a'?ids.length:i+1]));
const af3=aFix(['a','b','c','a','b','c','a'],['a','b','c']);
for(const[tag,outcome]of [['win','w'],['lose','l'],['draw','d']])for(const n of [2,3]){
 const g=n===2?B2:B3,ids=g.ids,af_=n===2?af:af3;
 cases[`B-${n}p-${tag}`]=M.build({kind:'B',me:'a',ids,names,outcome,rank:rankFor(ids,outcome),reasonText:'R',B:{game:g,trace:BR.build(g)}});
 cases[`A-${n}p-${tag}`]=M.build({kind:'A',me:'a',ids,names,outcome,rank:rankFor(ids,outcome),reasonText:'R',A:{report:af_.report,claims:af_.claims}});
}
(async()=>{const b=await chromium.launch({executablePath:exe});try{
 // ===== 1. isolated component states, 4 widths, normal and reduced motion =====
 for(const reduced of [false,true])for(const width of WIDTHS){
  const t=await context(b),p=t.page;await p.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await p.setViewportSize({width,height:900});
  await p.evaluate(()=>{document.getElementById('root').style.display='none';const el=document.createElement('div');el.id='tr';el.style.cssText='max-width:'+(innerWidth>=900?'1120px':'100%')+';margin:0 auto;padding:8px';document.body.appendChild(el);window.R=ReactDOM.createRoot(el);window.show=(m,x)=>R.render(React.createElement(NextResults.BattleSummary,{model:m,...x}))});
  for(const[name,m]of Object.entries(cases)){
   const tag=`${name}@${width}${reduced?'/reduced':''}`;
   await p.evaluate(([m,review,tag])=>show(m,{reviewCount:review,onReview:()=>{window.__reviewed=1},notes:React.createElement('span',{'data-case':tag},tag),growth:React.createElement('div',{className:'g'},'成長'),badges:m.outcome==='win'?['逆転勝ち']:[]}),[m,3,tag]);
   // wait until THIS case (marker + outcome + heading of this model) is what is rendered, never just "some .nbr"
   await p.waitForFunction(([tag,word,out])=>{const n=document.querySelector('.nbr');return !!n&&!!n.querySelector('[data-case="'+tag+'"]')&&n.dataset.outcome===out&&n.querySelector('.nbr-word')?.textContent===word},[tag,m.word,m.outcome],{timeout:10000});
   const info=await p.evaluate(()=>({word:document.querySelector('.nbr-word').textContent,out:document.querySelector('.nbr').dataset.outcome,hero:document.querySelector('.nbr-hero').textContent,conf:document.querySelectorAll('.nbr-confetti i').length,anim:getComputedStyle(document.querySelector('.nbr-word')).animationName,ov:document.documentElement.scrollWidth>innerWidth,boxOv:document.querySelector('.nbr').scrollWidth>document.querySelector('.nbr').clientWidth+1,rank:document.querySelectorAll('.nbr-rank li').length,details:document.querySelectorAll('.nbr-cmp details').length,open:[...document.querySelectorAll('.nbr-cmp details')].some(d=>d.open),rows:document.querySelectorAll('.nbr-cmp .nbr-panel>[data-row]').length,wide:document.querySelector('.nbr').dataset.wide,hl:document.querySelectorAll('.nbr-card').length,txt:document.querySelector('.nbr').textContent}));
   assert.equal(info.out,m.outcome,tag);assert.equal(info.word,m.word,tag);assert(!info.ov&&!info.boxOv,'no horizontal overflow '+tag);
   assert(info.hl<=3,tag);assert(!/新B方式/.test(info.txt),tag);
   assert.equal(info.conf>0,m.outcome==='win'&&!reduced,'confetti only on a win without reduced motion '+tag);
   if(reduced)assert.equal(info.anim,'none','reduced motion disables hero animation '+tag);
   { const mm=/^([AB])-([23])p-(win|lose|draw)$/.exec(name);if(mm){const lose=(info.hero.match(/LOSE/g)||[]).length,n=+mm[2];
     if(mm[3]==='win'){assert.equal(info.word,'WIN!',tag);assert.equal(lose,0,'no LOSE on a win '+tag)}
     if(mm[3]==='draw'){assert.equal(info.word,'DRAW',tag);assert.equal(lose,0,'a draw never shows LOSE '+tag)}
     if(mm[3]==='lose'){assert.equal(lose,1,'exactly one LOSE on a loss '+tag);assert.equal(info.word,n===2?'LOSE':`${m.place}位`,tag)}
     assert.equal(info.rank,n===3?3:0,tag)} }
   if(name==='B-3p'){assert.equal(info.rank,3,tag);assert.match(info.txt,/2位/);assert.match(info.txt,/1位/);assert.match(info.txt,/3位/)}else if(!/^[AB]-[23]p-/.test(name))assert.equal(info.rank,0,tag);
   if(name==='B-draw')assert.match(info.word,/DRAW/);
   if(name==='A-lose'){assert.match(info.txt,/獲得した問題の平均解答時間/);assert(!/誤答/.test(info.txt))}
   if(/^B-(win|draw)$/.test(name)){assert.match(info.txt,/送った量です。相手に与えたダメージではありません/);assert(!/被ダメージ|与えたダメージ[^で]/.test(info.txt.replace('相手に与えたダメージではありません','')))}
   if(name==='B-missing'){assert(!/平均解答時間|誤答|時間切れ/.test(info.txt),'rows needing missing history are not shown');assert.match(info.txt,/記録がない項目は表示していません/);assert.equal(info.hl>0?await p.evaluate(()=>!/リード交代|最大の得点/.test(document.querySelector('.nbr-hl').innerText)):true,true)}
   // phone: extra compare rows collapsed; wide: all rows visible without the expander
   if(width<760&&info.rows>0&&name==='B-win'){assert.equal(info.details,1,tag);assert.equal(info.open,false,tag);assert(info.rows<=4,'only primary rows are visible '+tag);await p.getByText(/さらに\d+項目を見る/).click();assert(await p.locator('.nbr-cmp details [data-row]').first().isVisible())}
   if(width>=1100&&name==='B-win'){assert.equal(info.wide,'true');assert.equal(info.details,0);assert(info.rows>=7)}
   if(!reduced&&name==='B-win')await p.getByRole('button',{name:/間違えた問題を復習/}).click(),assert.equal(await p.evaluate(()=>window.__reviewed),1);
   if(!reduced&&width!==390&&['B-win','A-lose','B-3p'].includes(name))await p.screenshot({path:`/tmp/nbr-${name}-${width}.png`,fullPage:true}).catch(()=>{});
  }
  assert.deepEqual(t.errors,[]);await t.ctx.close();
 }
 console.log('PASS component: win/lose/draw/3-player/missing at 375/390/430/1440, reduced motion, no overflow, expandable rows, no causal/damage wording');
 // ===== 2. real room flows (mock Firebase): CPU practice B and A reach BattleResult with the new summary =====
 for(const mode of ['B','A']){
  const initial={rating:1600,exp:100,games:12,w:7,l:5,skin:{tile:'wood'},nick:'first'},tree={games:{factor:{accounts:{ateacher:{name:'Teacher',stats:structuredClone(initial)}},onlineSparkV1:{config:{enabled:true,protocol:'spark-v1'}}}}};
  const spark=fs.readFileSync('online-spark.js','utf8')+'\n{const c=RoomB2.create;RoomB2.create=o=>c({...o,onView:r=>{window.localView=r;o.onView(r)}})}';
  const t=await context(b,{tree,assetOverrides:{'/online-spark.js':spark}}),p=t.page;
  await p.locator('.action-card.online').click();await p.getByRole('group',{name:'方式',exact:true}).getByRole('button',{name:mode==='B'?'新B方式':/^A/}).first().click();
  await p.getByRole('group',{name:'CPUの強さ',exact:true}).getByRole('button',{name:mode==='B'?'つよい':'よわい',exact:true}).click();await p.getByRole('button',{name:'CPUと練習スタート',exact:true}).click();
  if(mode==='B'){await p.waitForFunction(()=>document.querySelector('[data-online-ready]')?.dataset.onlineReady==='true');await drag(p);await p.waitForFunction(()=>window.localView?.game.states.me.c===1);await p.clock.install();await p.clock.fastForward(91000)}
  else for(let i=0;i<80&&!await p.locator('[data-battle-summary]').count();i++){await p.waitForTimeout(250);await drag(p).catch(()=>{})}
  await p.locator('[data-battle-summary]').waitFor({timeout:8000});
  for(const width of WIDTHS){await p.setViewportSize({width,height:1100});await p.waitForTimeout(250);
   const r=await p.evaluate(()=>({kind:document.querySelector('.nbr').dataset.kind,ov:document.documentElement.scrollWidth>innerWidth,box:document.querySelector('.nbr').getBoundingClientRect().width,old:!!document.querySelector('.v7-open'),analysis:!!document.querySelector('[data-a-result],[data-b-result]'),review:!!document.querySelector('[data-review-card]'),btn:[...document.querySelectorAll('button')].map(x=>x.textContent).join('|')}));
   assert.equal(r.kind,mode,mode+width);assert(!r.ov,'overflow '+mode+width);assert(!r.old,'old hero is not rendered beside the new one');assert(r.analysis,'existing analysis is kept');assert(r.review);assert.match(r.btn,/もう一戦/);assert.match(r.btn,/設定にもどる|ロビー|部屋を出る/);
   if(width===1440)assert(r.box>900,'wide layout reached on desktop: '+r.box)}
  // Ver.6.0 ResultShell: dark details, one scroll container, review toggle, reachable action row (phone / short Chromebook)
  for(const [w,h] of [[390,844],[683,325]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(250);
   const sh=await p.evaluate(()=>{const scroller=document.querySelector('[data-result-scroll]'),inner=[...scroller.querySelectorAll('*')].filter(e=>{const o=getComputedStyle(e).overflowY;return(o==='auto'||o==='scroll')&&e.scrollHeight>e.clientHeight+1});
    const d=document.querySelector('.rs-details'),bg=d&&getComputedStyle(d).backgroundColor.match(/\d+/g).slice(0,3).map(Number);
    return{shell:!!document.querySelector('[data-result-shell]'),inner:inner.length,detailsDark:!bg||Math.max(...bg)<90,old:!!document.querySelector('.v7-panel.next-a-details'),actions:!!document.querySelector('.rs-actions .rs-btn')}});
   assert(sh.shell&&sh.actions,'shell rendered '+mode+w);assert.equal(sh.inner,0,'no independent inner scroll area '+mode+w);assert(sh.detailsDark,'details use the dark theme '+mode+w);assert(!sh.old,'old light details gone');
   const btn=p.getByRole('button',{name:/もう一戦/}).first();await btn.waitFor();
   const box=await btn.boundingBox();assert(box&&box.y>=0&&box.y+box.height<=h+1,`rematch stays reachable without scrolling ${mode} ${w}x${h}: ${JSON.stringify(box)}`);
   await p.evaluate(()=>{const s=document.querySelector('[data-result-scroll]');s.scrollTop=s.scrollHeight});
   const end=await btn.boundingBox();assert(end&&end.y+end.height<=h+1,'still reachable at the bottom')}
  await p.setViewportSize({width:1100,height:1100});
  await p.getByRole('button',{name:/ふり返り（/}).click();assert(await p.locator('.rs-review-row').count()>0,'review list opens with the same toggle');
  await p.getByRole('button',{name:/間違えた問題を復習/}).click().catch(()=>{});
  assert.deepEqual(t.errors,[]);await t.ctx.close();console.log('PASS real CPU '+mode+' flow: new summary + existing analysis/review/rematch controls, 4 widths');
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
