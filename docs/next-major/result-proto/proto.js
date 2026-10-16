/* 独立試作：すべて架空データ。本番の BattleResult / 対戦処理 / Firebase には一切接続しない。 */
(function(){
const COL=['#72dfce','#f6bd62','#b5a5ff','#83c8ff'];
const ICON={
 swap:'<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13h20l-5-5M30 23H10l5 5"/></svg>',
 flame:'<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4c2 6 9 9 9 17a9 9 0 0 1-18 0c0-4 2-6 4-8 0 3 2 4 3 4 0-5-1-8 2-13z"/></svg>',
 bolt:'<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 3 8 20h9l-2 13 13-18h-9z"/></svg>',
 target:'<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="18" cy="18" r="13"/><circle cx="18" cy="18" r="6"/><path d="M18 2v6M18 28v6M2 18h6M28 18h6"/></svg>',
 shield:'<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 4 6 9v9c0 8 5 13 12 15 7-2 12-7 12-15V9z"/></svg>'};
const P=(n,me)=>({name:n,me:!!me});
/* ---------- 架空フィクスチャ ---------- */
const S={};
S['a-win']={label:'A 勝利',mode:'A',outcome:'win',reason:'得点で勝負（15問終了）',badges:['逆転勝ち'],
 players:[{n:'あなた',me:1,rank:1,score:420},{n:'ユウキ',rank:2,score:310}],
 rows:[{l:'得点',u:'点',v:[420,310]},{l:'取った問題',u:'問',v:[9,6],s:'15問中'},{l:'最大コンボ',u:'',v:[5,3]},{l:'Perfect',u:'回',v:[4,2]},{l:'平均解答時間',u:'秒',v:[3.4,4.1],low:1,s:'獲得した問題のみの平均'}],
 hl:[{k:'reversal',q:7,p:1,t:'逆転の瞬間',tag:'第7問',d:'第7問でリードを奪い、そのまま逃げ切り',i:'swap'},{k:'decisive',q:7,p:2,t:'勝敗を分けた問題',tag:'第7問',d:'同じ出来事のため重複として除外されます',i:'target'},{k:'fast',q:4,p:3,t:'最速で取った問題',tag:'第4問',d:'1.8秒でPerfect',i:'bolt'},{k:'combo',q:11,p:4,t:'コンボで大量得点',tag:'第11問',d:'5コンボで +54点',i:'flame'}],
 grow:{exp:[1180,1300,1500],rating:[1520,1538],promo:true,chips:['称号獲得（例）','懸賞金 +80 経験値']},misses:3,
 an:['得点推移グラフ','問題ごとの成績']};
S['a-lose']={label:'A 敗北',mode:'A',outcome:'lose',reason:'得点で勝負（15問終了）',badges:[],
 players:[{n:'あなた',me:1,rank:2,score:280},{n:'ユウキ',rank:1,score:365}],
 rows:[{l:'得点',u:'点',v:[280,365]},{l:'取った問題',u:'問',v:[6,9],s:'15問中'},{l:'最大コンボ',u:'',v:[3,5]},{l:'Perfect',u:'回',v:[2,4]},{l:'平均解答時間',u:'秒',v:[4.2,3.3],low:1,s:'獲得した問題のみの平均'}],
 hl:[{k:'fast',q:2,p:3,t:'最速で取った問題',tag:'第2問',d:'2.1秒でExcellent',i:'bolt'},{k:'decisive',q:9,p:2,t:'勝敗を分けた問題',tag:'第9問',d:'ここから相手が3問連続で獲得',i:'target'},{k:'combo',q:5,p:4,t:'あなたの最大コンボ',tag:'第5問',d:'3コンボで +36点',i:'flame'}],
 grow:{exp:[1300,1345,1500],rating:[1538,1526],chips:[]},misses:5,an:['得点推移グラフ','問題ごとの成績']};
const Bn=(x)=>({l:'送信お邪魔カード',u:'枚',v:x,note:'送信した量です。相手に与えたダメージではありません'});
S['b-win']={label:'B 勝利',mode:'B',outcome:'win',reason:'試合時間終了・得点で勝負',badges:['逆転勝ち','ピンチからの勝利'],
 players:[{n:'あなた',me:1,rank:1,score:1250},{n:'ソラ',rank:2,score:980}],
 rows:[{l:'得点',u:'点',v:[1250,980]},{l:'正解数',u:'問',v:[14,11]},{l:'最大コンボ',u:'',v:[8,5]},{l:'Perfect',u:'回',v:[6,3]},{l:'平均解答時間',u:'秒',v:[2.9,3.8],low:1,s:'正解した問題'},{l:'誤答',u:'回',v:[1,3],low:1},{l:'時間切れ',u:'回',v:[0,1],low:1}],
 bsec:[{l:'送信お邪魔カード',v:'9枚 / 5枚'},{l:'相殺',v:'6枚 / 4枚'},{l:'FREEZE使用',v:'2回 / 1回'},{l:'被ダメージ',v:'28% / 61%'}],
 hl:[{k:'reversal',q:'42s',p:1,t:'逆転の瞬間',tag:'42秒',d:'連続正解でリードを奪取',i:'swap'},{k:'pinch',q:'min',p:2,t:'ピンチからの勝利',tag:'最小HP 18%',d:'体力が18%まで減ってから立て直した',i:'shield'},{k:'combo',q:'c8',p:3,t:'最大8コンボ',tag:'58〜71秒',d:'連続正解で一気に得点',i:'flame'},{k:'fast',q:'f',p:4,t:'最速解答',tag:'1.2秒',d:'Perfect',i:'bolt'}],
 grow:{exp:[2410,2560,2800],rating:[1604,1623],chips:['懸賞金 +60 経験値']},misses:4,an:['得点推移グラフ（時間軸）','攻撃・相殺の詳細']};
S['b-lose']={label:'B 敗北',mode:'B',outcome:'lose',reason:'試合時間終了・得点で勝負',badges:[],
 players:[{n:'あなた',me:1,rank:2,score:910},{n:'ソラ',rank:1,score:1140}],
 rows:[{l:'得点',u:'点',v:[910,1140]},{l:'正解数',u:'問',v:[10,13]},{l:'最大コンボ',u:'',v:[6,7]},{l:'Perfect',u:'回',v:[3,5]},{l:'平均解答時間',u:'秒',v:[3.9,3.1],low:1,s:'正解した問題'},{l:'誤答',u:'回',v:[4,2],low:1},{l:'時間切れ',u:'回',v:[2,0],low:1}],
 bsec:[{l:'送信お邪魔カード',v:'6枚 / 8枚'},{l:'相殺',v:'3枚 / 7枚'},{l:'FREEZE使用',v:'1回 / 2回'},{l:'被ダメージ',v:'55% / 30%'}],
 hl:[{k:'decisive',q:'61s',p:1,t:'勝敗を分けた瞬間',tag:'61秒',d:'この得点で相手が再びリード',i:'target'},{k:'combo',q:'c6',p:2,t:'最大6コンボ',tag:'18〜29秒',d:'序盤のリードを作った連続正解',i:'flame'},{k:'fast',q:'f',p:3,t:'最速解答',tag:'1.6秒',d:'Excellent',i:'bolt'}],
 grow:{exp:[2560,2615,2800],rating:[1623,1609],chips:[]},misses:6,an:['得点推移グラフ（時間軸）','攻撃・相殺の詳細']};
S['b-draw']={label:'B 引き分け',mode:'B',outcome:'draw',reason:'同点で時間終了',badges:[],
 players:[{n:'あなた',me:1,rank:1,score:840},{n:'ソラ',rank:1,score:840}],
 rows:[{l:'得点',u:'点',v:[840,840]},{l:'正解数',u:'問',v:[10,10]},{l:'最大コンボ',u:'',v:[5,6]},{l:'Perfect',u:'回',v:[3,4]},{l:'平均解答時間',u:'秒',v:[3.5,3.4],low:1,s:'正解した問題'},{l:'誤答',u:'回',v:[2,2],low:1},{l:'時間切れ',u:'回',v:[1,0],low:1}],
 bsec:[{l:'送信お邪魔カード',v:'7枚 / 7枚'},{l:'相殺',v:'4枚 / 5枚'},{l:'FREEZE使用',v:'1回 / 1回'},{l:'被ダメージ',v:'44% / 39%'}],
 hl:[{k:'tie',q:'88s',p:1,t:'同点に追いついた瞬間',tag:'88秒',d:'終了2秒前の得点で並んだ',i:'swap'},{k:'combo',q:'c6',p:2,t:'相手の最大コンボ',tag:'6コンボ',d:'ソラが序盤にリード',i:'flame'}],
 grow:{exp:[2615,2665,2800],rating:[1609,1609],chips:[]},misses:3,an:['得点推移グラフ（時間軸）','攻撃・相殺の詳細']};
S['a-multi']={label:'A 4人（2位）',mode:'A',outcome:'lose',reason:'得点で勝負（15問終了）',badges:[],place:2,
 players:[{n:'あなた',me:1,rank:2,score:440},{n:'ミサキ',rank:1,score:510},{n:'ユウキ',rank:3,score:380},{n:'ハルト',rank:4,score:250}],
 rows:[{l:'得点',u:'点',v:[440,510,380,250]},{l:'取った問題',u:'問',v:[7,8,5,3],s:'15問中'},{l:'最大コンボ',u:'',v:[4,5,3,2]},{l:'Perfect',u:'回',v:[3,4,2,0]},{l:'平均解答時間',u:'秒',v:[3.6,3.2,4.4,5.0],low:1,s:'獲得した問題のみの平均'}],
 hl:[{k:'fast',q:6,p:2,t:'最速で取った問題',tag:'第6問',d:'2.0秒でExcellent',i:'bolt'},{k:'reversal',q:10,p:1,t:'リード交代',tag:'第10問',d:'一時的に1位になったが、第12問で再逆転',i:'swap'}],
 grow:{exp:[1345,1395,1500],rating:[1526,1531],chips:[]},misses:4,an:['得点推移グラフ','問題ごとの成績']};
S['b-multi']={label:'B 3人（1位）',mode:'B',outcome:'win',reason:'最後まで生き残った！',badges:[],place:1,
 players:[{n:'あなた',me:1,rank:1,score:1320},{n:'ソラ',rank:2,score:1010},{n:'ミナト',rank:3,score:640}],
 rows:[{l:'得点',u:'点',v:[1320,1010,640]},{l:'正解数',u:'問',v:[15,12,8]},{l:'最大コンボ',u:'',v:[9,6,4]},{l:'Perfect',u:'回',v:[7,3,1]},{l:'平均解答時間',u:'秒',v:[2.8,3.5,4.6],low:1,s:'正解した問題'},{l:'誤答',u:'回',v:[2,3,5],low:1},{l:'時間切れ',u:'回',v:[0,1,2],low:1}],
 bsec:[{l:'送信お邪魔カード',v:'11枚 / 6枚 / 3枚'},{l:'相殺',v:'7枚 / 5枚 / 2枚'},{l:'FREEZE使用',v:'2回 / 1回 / 0回'},{l:'被ダメージ',v:'35% / 58% / 100%'}],
 hl:[{k:'combo',q:'c9',p:1,t:'最大9コンボ',tag:'31〜52秒',d:'連続正解で一気に抜け出した',i:'flame'},{k:'fast',q:'f',p:2,t:'最速解答',tag:'1.1秒',d:'Perfect',i:'bolt'}],
 grow:{exp:[2665,2815,3000],rating:[1609,1627],chips:[]},misses:5,an:['得点推移グラフ（時間軸）','攻撃・相殺の詳細']};
S['b-missing']={label:'B 履歴欠損・ゲスト',mode:'B',outcome:'win',reason:'試合時間終了・得点で勝負',badges:[],missing:true,guest:true,
 players:[{n:'あなた',me:1,rank:1,score:1020},{n:'ソラ',rank:2,score:870}],
 rows:[{l:'得点',u:'点',v:[1020,870]},{l:'正解数',u:'問',v:[12,10]},{l:'最大コンボ',u:'',v:[6,5]},{l:'平均解答時間',u:'秒',v:[3.1,null],low:1,s:'相手のデータがないため非表示'},{l:'Perfect',u:'回',v:[null,null],s:'記録なし'}],
 hl:[{k:'combo',q:'c6',p:1,t:'最大6コンボ',tag:'',d:'確認できる記録から表示',i:'flame'}],
 grow:{exp:[1500,1560,1800],rating:null,chips:[]},misses:0,an:[]};

/* ---------- ルール（正式実装でも同じ規則をユニットテストで固定する） ---------- */
function rowVisible(r){return r.v.every(x=>x!=null)}            // 全員の値がある行だけ表示（推測しない）
function pickHighlights(c){const seen=new Set(),out=[];for(const h of [...c].sort((a,b)=>a.p-b.p)){const key=h.q;if(seen.has(key))continue;seen.add(key);out.push(h);if(out.length===3)break}return out}
const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=(v,u,low)=>(low&&u==='秒'?v.toFixed(1):v)+(u||'');
function row(r,players){
 const vals=r.v,nums=vals.map(Number),best=r.low?Math.min(...nums):Math.max(...nums),max=Math.max(...nums,1),min=Math.min(...nums);
 const order=r.order||vals.map((_,i)=>i);
 return `<div class="nr-row"><div class="t"><b>${r.l}</b><span>${r.s||''}</span></div><div class="nr-bars">${order.map(i=>{const p=players.find((_,j)=>j===i)||players[i];const w=r.low?(min/Math.max(nums[i],0.01)):nums[i]/max;return `<div class="nr-bar" data-best="${nums[i]===best}"><span class="n"><i class="nr-dot" style="background:${p.color}"></i>${p.n}</span><span class="trk"><i class="fill" data-w="${Math.max(.04,w)*100}" style="background:${p.color};display:block"></i></span><span class="v num">${fmt(vals[i],r.u,r.low)}</span></div>`}).join('')}</div></div>`;
}
function render(id,view){
 const sc=S[id],place=sc.place||(sc.outcome==='lose'?2:1);
 let oi=0;sc.players.forEach(p=>p.color=p.me?COL[0]:COL[1+(oi++)%3]);
 const me=sc.players.find(p=>p.me),others=sc.players.filter(p=>!p.me),multi=sc.players.length>2;
 const word=sc.outcome==='win'?'WIN!':sc.outcome==='draw'?'DRAW':multi?`${place}位`:'LOSE…';
 const hero=`<header class="nr-hero" data-outcome="${sc.outcome}" aria-live="polite">${sc.outcome==='win'&&!reduce()?`<div class="nr-confetti" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i style="left:${(i*4.2+3)%100}%;background:${['#f6bd62','#72dfce','#b5a5ff','#83c8ff'][i%4]};animation-delay:${(i%8)*60}ms"></i>`).join('')}</div>`:''}
  <span class="nr-chip">${sc.mode}方式${multi?` ・ ${sc.players.length}人対戦`:''}</span>
  <h1 class="nr-word">${word}</h1>
  ${multi&&sc.outcome!=='win'?'<div class="nr-reason" style="color:var(--muted)">LOSE…</div>':''}
  <div class="nr-reason">${sc.reason}</div>
  ${sc.badges.length?`<div class="nr-badges">${sc.badges.map(b=>`<span class="nr-badge">${b}</span>`).join('')}</div>`:''}
  ${multi?`<div class="nr-rank"><ul>${[...sc.players].sort((a,b)=>a.rank-b.rank).map(p=>`<li data-me="${!!p.me}"><b class="num">${p.rank}位</b><span><i class="nr-dot" style="background:${p.color}"></i>${p.n}</span><span class="num">${p.score}点</span></li>`).join('')}</ul></div>`
   :`<div class="nr-score num"><span class="me" data-count="${me.score}">0</span><span class="vs">VS</span><span data-count="${others[0].score}">0</span></div>`}
 </header>`;
 const tile=(l,v,s)=>`<div class="nr-tile"><div class="l">${l}</div><div class="v num">${v}</div><div class="s">${s||'&nbsp;'}</div></div>`;
 const get=l=>{const r=sc.rows.find(x=>x.l===l);return r&&r.v[sc.players.indexOf(me)]};
 const tiles=`<div class="nr-tiles">${tile('得点',me.score,'点')}${tile(sc.mode==='A'?'取った問題':'正解数',get(sc.mode==='A'?'取った問題':'正解数')??'—','問')}${tile('最大コンボ',get('最大コンボ')??'—','')}${tile('Perfect',get('Perfect')??'—',get('Perfect')==null?'記録なし':'回')}</div>`;
 const vis=sc.rows.filter(rowVisible),hiddenN=sc.rows.length-vis.length;
 const cmp=`<div class="nr-panel nr-cmp">${vis.map(r=>row(r,sc.players)).join('')}</div>${sc.mode==='A'?'<p class="nr-note">解答時間は「獲得した問題」だけの平均です。取れなかった問題の時間は記録されません。</p>':''}${hiddenN?'<p class="nr-note">記録がない項目は表示していません。</p>':''}`;
 const bsec=sc.mode==='B'&&sc.bsec?`<section class="nr-sec"><h2>B方式の記録<small>${sc.players.map(p=>p.n).join(' / ')}</small></h2><div class="nr-sub">${sc.bsec.map(b=>`<div>${b.l}<b>${b.v}</b></div>`).join('')}</div><p class="nr-note">送信お邪魔カードは「送った量」です。相手に実際に与えたダメージではありません。</p></section>`:'';
 const hl=pickHighlights(sc.hl);
 const hls=hl.length?`<section class="nr-sec"><h2>試合のハイライト<small>${hl.length}件</small></h2><div class="nr-hl">${hl.map(h=>`<article class="nr-card">${ICON[h.i]}<div><h3>${h.t}${h.tag?`<span class="tag num">${h.tag}</span>`:''}</h3><p>${h.d}</p></div></article>`).join('')}</div></section>`:'';
 const g=sc.grow,[x0,x1,xm]=g.exp,dr=g.rating?g.rating[1]-g.rating[0]:null;
 const grow=`<section class="nr-sec"><h2>成長の記録</h2><div class="nr-panel nr-grow">
  <div class="nr-g"><h3>経験値</h3><div class="big num"><span class="pos">+${x1-x0}</span><small>${x0} → ${x1}</small></div><div class="nr-xp"><i data-w="${x1/xm*100}"></i></div></div>
  ${g.rating?`<div class="nr-g"><h3>レーティング</h3><div class="big num">${g.rating[0]} → ${g.rating[1]}<small class="${dr>=0?'pos':'neg'}">${dr>=0?'+':''}${dr}</small></div>${g.promo?'<span class="nr-reuse">昇格！ 既存RankPillを再利用</span>':'<span class="nr-reuse">ランク表示は既存RankPill</span>'}</div>`:`<div class="nr-g"><h3>レーティング</h3><p class="nr-guest">${sc.guest?'名前と合言葉を登録すると、勝敗・レーティング・称号が記録されます':'—'}</p></div>`}
  ${g.chips.length?`<div class="nr-chips" style="grid-column:1/-1">${g.chips.map(c=>`<span>${c}</span>`).join('')}</div>`:''}
 </div></section>`;
 const graph='<svg class="graph" viewBox="0 0 320 110" role="img" aria-label="得点推移グラフ（既存画面の再利用イメージ）"><g stroke="#324354"><line x1="28" x2="312" y1="20" y2="20"/><line x1="28" x2="312" y1="60" y2="60"/><line x1="28" x2="312" y1="100" y2="100"/></g><polyline fill="none" stroke="#72dfce" stroke-width="3" points="28,100 70,86 112,70 150,72 190,52 230,38 270,30 312,22"/><polyline fill="none" stroke="#f6bd62" stroke-width="3" stroke-dasharray="7 3" points="28,100 70,80 112,64 150,60 190,56 230,50 270,48 312,42"/></svg>';
 const an=sc.missing?`<section class="nr-sec nr-an"><h2>分析</h2><p class="nr-note" role="status">この試合には詳細な得点履歴がないため、推移やハイライトの一部は表示できません。</p></section>`
  :`<section class="nr-sec nr-an"><h2>分析<small>既存の分析機能へ</small></h2>${sc.an.map((t,i)=>`<details><summary>${t}</summary><div class="body"><span class="nr-reuse">既存の${sc.mode==='A'?'AResultDetails':'BDetails'}をそのまま表示</span>${i===0?graph:'<p>既存の一覧・表がここに入ります。</p>'}</div></details>`).join('')}</section>`;
 const act=`<footer class="nr-actions"><button class="nr-btn primary">もう一戦 <small>（準備OK）</small></button><div class="nr-sub-actions">${sc.misses?`<button class="nr-btn">間違いを復習（${sc.misses}問）</button>`:'<button class="nr-btn" disabled style="opacity:.45">復習する問題はありません</button>'}<button class="nr-btn">ロビーへ戻る</button></div></footer>`;
 return `<div class="next-result">${hero}<div class="nr-wrap"><div class="nr-main"><div><section class="nr-sec"><h2>あなたの成績</h2>${tiles}</section><section class="nr-sec"><h2>相手との比較</h2>${cmp}</section>${bsec}</div><div>${hls}${grow}</div></div>${an}</div>${act}</div>`;
}
function mount(id,view){
 const frame=document.getElementById('frame');frame.dataset.view=view;frame.innerHTML=render(id,view);
 const go=()=>{frame.querySelectorAll('[data-w]').forEach(e=>e.style.width=e.dataset.w+'%');
  frame.querySelectorAll('[data-count]').forEach(e=>{const to=+e.dataset.count;if(reduce()){e.textContent=to;return}const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/800);e.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0)})};
 reduce()?(frame.querySelectorAll('[data-count]').forEach(e=>e.textContent=e.dataset.count),frame.querySelectorAll('[data-w]').forEach(e=>e.style.width=e.dataset.w+'%')):requestAnimationFrame(()=>requestAnimationFrame(go));
}
function ui(){
 const q=new URLSearchParams(location.hash.slice(1)),st={s:q.get('s')||'a-win',v:q.get('v')||'pc'};
 const bar=document.getElementById('bar');
 const draw=()=>{bar.innerHTML=`<b>試作</b>${Object.entries(S).map(([k,v])=>`<button data-s="${k}" aria-pressed="${st.s===k}">${v.label}</button>`).join('')}<span class="sp"></span><button data-v="pc" aria-pressed="${st.v==='pc'}">PC</button><button data-v="phone" aria-pressed="${st.v==='phone'}">スマホ</button><button data-r="1">演出を再生</button>`;mount(st.s,st.v);history.replaceState(null,'',`#s=${st.s}&v=${st.v}`)};
 bar.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.s)st.s=b.dataset.s;if(b.dataset.v)st.v=b.dataset.v;draw()};
 draw();
}
window.RP={S,rowVisible,pickHighlights};
document.addEventListener('DOMContentLoaded',ui);
})();
