const {test}=require('node:test'),a=require('node:assert/strict'),M=require('../src/solo-result-model.cjs');
const base={label:'イージー',clearCount:15,cleared:false,score:320,caught:4,elapsedSeconds:75.4,levelText:'Lv.2 かけ算',unlockedLevel:2,clearTimeBonus:0,isRecord:false,rankedIn:false};
const log=[{ok:true,ms:1800,j:'Perfect',lv:1},{ok:true,ms:4200,j:'Great',lv:1},{ok:false,ms:9000,lv:1},{ok:true,ms:2600,j:'Excellent',lv:1},{ok:false,ms:20000,timeout:true,lv:2},{ok:true,ms:12000,j:'OK',lv:2,reverse:true},{ok:true,ms:3000,j:'Excellent',lv:2}];
const snap={maxCombo:2,log};
test('GAME OVER: facts only from the run; ミス = 誤答+時間切れ; Perfect and fastest come from the full log (bonus stage included)',()=>{
 const m=M.build({...base,caught:5,snapshot:snap}),t=Object.fromEntries(m.tiles.map(x=>[x.id,x]));
 a.equal(m.word,'GAME OVER');a.equal(m.outcome,'lose');a.equal(m.reasonText,'体力切れ…');a.equal(t.score.value,320);a.equal(t.caught.value,5);a.equal(t.combo.value,2);a.equal(t.perfect.value,1);a.equal(t.miss.value,2);a.equal(t.time.value,'1分15秒');a.equal(t.difficulty.value,'イージー');a.equal(t.level.value,'Lv.2 かけ算');
 a.deepEqual(m.highlights.map(h=>h.id),['combo','fast']);a.equal(m.highlights[1].tag,'1.8秒');a.match(m.highlights[1].detail,/Perfect/);a.equal(m.learnButton,true);
 a(!JSON.stringify(m).includes('問目')&&!JSON.stringify(m).includes('第'),'no question numbers');
});
test('CLEAR: clear time highlight (with bonus) comes first; at most three highlights; badges only for real records',()=>{
 const m=M.build({...base,cleared:true,caught:5,score:900,clearTimeBonus:-12,elapsedSeconds:200,snapshot:snap,isRecord:true,rankedIn:true});
 a.equal(m.word,'CLEAR!');a.equal(m.outcome,'win');a.equal(m.reasonText,'15問達成！');a.deepEqual(m.highlights.map(h=>h.id),['clear','combo','fast']);a.match(m.highlights[0].detail,/-12点/);a.deepEqual(m.badges,['自己ベスト更新！','ランキング入り！']);
 a.deepEqual(M.build({...base,caught:5,snapshot:snap}).badges,[]);a.deepEqual(M.build({...base,caught:5,snapshot:snap,isRecord:true,score:0}).badges,[]);
});
test('missing or inconsistent log never invents numbers: derived tiles, highlights and the learn button disappear',()=>{
 for(const snapshot of [null,undefined,{maxCombo:3},{maxCombo:3,log:[]},{maxCombo:3,log:log.slice(0,3)},{maxCombo:3,log:[{ok:true}]}]){
  const m=M.build({...base,caught:5,snapshot}),ids=m.tiles.map(x=>x.id);
  for(const x of ['perfect','miss'])a(!ids.includes(x),x);a(!m.highlights.some(h=>h.id==='fast'));a.equal(m.learnButton,false);a(ids.includes('score')&&ids.includes('caught'));
 }
 a(!M.build({...base,caught:5,snapshot:{log}}).tiles.some(x=>x.id==='combo'),'no maxCombo => hidden');
 const noJudge=M.build({...base,caught:2,snapshot:{maxCombo:2,log:[{ok:true,ms:1000},{ok:true,ms:2000}]}});a(!noJudge.tiles.some(x=>x.id==='perfect'));a.equal(noJudge.highlights.find(h=>h.id==='fast').detail,'最も速く正解した問題');
 a.equal(M.build({}),null);a.equal(M.build({score:1}),null);
});
test('no mistakes => no learn button; zero perfects is a real zero, not hidden',()=>{
 const m=M.build({...base,caught:1,snapshot:{maxCombo:1,log:[{ok:true,ms:5000,j:'Good'}]}});a.equal(m.learnButton,false);a.equal(m.tiles.find(x=>x.id==='perfect').value,0);a.equal(m.tiles.find(x=>x.id==='miss').value,0);a(!m.highlights.some(h=>h.id==='combo'),'combo 1 is not a highlight');
});
