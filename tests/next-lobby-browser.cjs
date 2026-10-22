const nav = require("./browser-harness.cjs"); // shared navigation (goHome / openSoloMode …)
const assert=require('node:assert/strict');const {chromium,context,drag}=require('./browser-harness.cjs');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});try{
 for(const width of [375,390,430,1440].filter(w=>!process.env.NEXT_LOBBY_WIDTH||w===Number(process.env.NEXT_LOBBY_WIDTH))){
  const tree={games:{factor:{}}},f=tree.games.factor;f.accounts={ateacher:{name:'Teacher',stats:{games:10,w:8,l:1,d:1,rating:1700,streak:3}},atarget:{name:'Target',stats:{games:5,w:4,l:1,d:0,streak:4,rating:1600}}};f.onlineSparkV1={config:{enabled:true,protocol:'spark-v1'}};
  const t=await context(b,{tree}),p=t.page;await p.setViewportSize({width,height:width>900?1080:844});await p.locator('.action-card.online').click();await p.locator('[data-next-lobby]').waitFor();
  await p.getByRole('button',{name:'すぐ遊ぶ（ランダム対戦）',exact:true}).waitFor();await p.waitForFunction(()=>!document.querySelector('.next-primary').disabled);
  assert.equal(await p.getByRole('button',{name:/先生用ダッシュボード/}).count(),0,'unauthorized dashboard hidden');assert(!await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  if(process.env.CAPTURE_LOBBY==='1'&&[390,1440].includes(width)){await p.evaluate(()=>document.fonts.ready);const old=width>900?1080:844;if(width<900)await p.setViewportSize({width,height:await p.evaluate(()=>document.documentElement.scrollHeight)});await p.screenshot({path:`docs/next-major/phase2b/lobby-${width}.png`,fullPage:true});await p.setViewportSize({width,height:old});}
  await p.getByRole('button',{name:'みんなの成績',exact:true}).click();await p.getByPlaceholder('名前でさがす').fill('Target');await p.locator('.v7-modal').getByText('Target',{exact:true}).click();assert.equal(await p.locator('.v7-modal').count(),0,'list is replaced by selected profile');await p.getByRole('button',{name:'とじる',exact:true}).click();
  await p.getByRole('button',{name:/^賞金首リスト/}).click();await p.locator('.v7-modal').getByText('Target',{exact:true}).click();assert.equal(await p.locator('.v7-modal').count(),0);await p.getByRole('button',{name:'とじる',exact:true}).click();
  await p.getByRole('button',{name:'自分のゴースト・成績',exact:true}).click();await p.locator('[data-next-profile]').waitFor();await p.getByRole('button',{name:'戻る',exact:true}).click();await p.locator('[data-next-lobby]').waitFor();
  if(width===390){await p.getByRole('button',{name:'オンラインレーティング',exact:true}).click();await p.locator('.or-rating').waitFor();await p.getByRole('button',{name:'オンラインへ戻る',exact:true}).click();await p.locator('[data-next-lobby]').waitFor();}
  assert.equal(await p.locator('.next-mode-links').getByRole('button',{name:/^C方式/}).count(),0,'C is hidden in Ver.6.0 room modes');
  for(const [mode,label]of [['A','A方式'],['B','新B方式']]){
   await p.locator('.next-mode-links').getByRole('button',{name:new RegExp('^'+label)}).click();await p.getByRole('button',{name:'部屋を出る',exact:true}).waitFor();
   const room=Object.values(f.rooms||{}).find(r=>r.state?.phase==='lobby'&&r.state.mode===mode);assert(room,'actual created '+mode+' lobby');assert.equal(room.state.diff,'easy');assert(!await p.locator('.bottom-nav').count(),'game/room lifecycle keeps existing navigation guards');
   await p.getByRole('button',{name:'部屋を出る',exact:true}).click();await p.locator('[data-next-lobby]').waitFor();
  }
  await p.getByPlaceholder('部屋コード4桁').fill('12');await p.getByRole('button',{name:'参加',exact:true}).click();await p.getByRole('alert').getByText('4桁の数字を入れてください',{exact:true}).waitFor();
  await p.getByRole('button',{name:'ゴースト対戦',exact:true}).click();await p.getByRole('button',{name:/イージーゴースト/}).waitFor();await p.getByRole('button',{name:'オンラインへ戻る',exact:true}).click();await p.locator('[data-next-lobby]').waitFor();
  await nav.goHome(p);await p.locator('.action-card.solo').click();await p.locator('[data-solo-mode=cpu]').click();
  const choice=p.getByRole('group',{name:'方式',exact:true});assert.equal(await choice.getByRole('button',{name:/^C /}).count(),0,'C hidden in CPU practice');await choice.getByRole('button',{name:'A方式',exact:true}).click();await p.getByRole('group',{name:'難易度',exact:true}).getByRole('button',{name:'ノーマル',exact:true}).click();await p.getByRole('button',{name:'CPUと練習スタート',exact:true}).click();await p.locator('[data-btile]').first().waitFor();assert(!await p.locator('.bottom-nav').count(),'no menu navigation during combat');
  assert.deepEqual(t.errors,[]);console.log(`PASS lobby ${width}: actual A/B room creation (C hidden), search/bounty modal replacement, own profile, ghost menu, CPU NORMAL A start, protected room/game navigation`);await t.ctx.close();
 }
for(const isTeacher of [false,true]){
 const tree={games:{factor:{accounts:{ateacher:{name:'Teacher',stats:{}}},teachers:isTeacher?{ateacher:true}:{},onlineSparkV1:{config:{enabled:false,protocol:'spark-v1'}}}}};
 const t=await context(b,{tree}),p=t.page;await p.locator('.action-card.online').click();await p.locator('[data-next-lobby]').waitFor();
 await p.getByText('レーティング対戦は現在利用できません。ルーム対戦を利用できます。',{exact:true}).waitFor();
 assert(await p.getByRole('button',{name:'すぐ遊ぶ（ランダム対戦）',exact:true}).isDisabled());assert(await p.getByRole('button',{name:'部屋を作る（ホスト）',exact:true}).isEnabled());
 if(isTeacher){await p.getByRole('button',{name:/先生用ダッシュボード/}).waitFor();await p.getByRole('button',{name:/クラス協力レイドを開く/}).waitFor();}else assert.equal(await p.getByRole('button',{name:/先生用ダッシュボード/}).count(),0);
 assert.deepEqual(t.errors,[]);console.log(`PASS lobby config disabled; teacher=${isTeacher}: existing role gate, CPU available, no old random fallback`);await t.ctx.close();
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
