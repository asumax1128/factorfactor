// A / B(新B) battle result summary. Presentation only: all data comes from battle-result-model.cjs.
const reduced=()=>typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TONE=['#72dfce','#f6bd62','#b5a5ff','#83c8ff'];
const fmt=(v,r)=>(r.decimals?v.toFixed(r.decimals):String(v))+r.unit;
const ICON={
 reversal:<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 13h20l-5-5M30 23H10l5 5"/></svg>,
 combo:<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 4c2 6 9 9 9 17a9 9 0 0 1-18 0c0-4 2-6 4-8 0 3 2 4 3 4 0-5-1-8 2-13z"/></svg>,
 fast:<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 3 8 20h9l-2 13 13-18h-9z"/></svg>,
 big:<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="18" cy="18" r="13"/><circle cx="18" cy="18" r="6"/></svg>,
 clear:<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="20" r="12"/><path d="M18 12v8l5 3M14 3h8"/></svg>,
 minhp:<svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 4 6 9v9c0 8 5 13 12 15 7-2 12-7 12-15V9z"/></svg>
};
function useWide(ref){
 const[wide,set]=React.useState(false);
 React.useEffect(()=>{const el=ref.current;if(!el||typeof ResizeObserver==='undefined')return;const ro=new ResizeObserver(([e])=>set(e.contentRect.width>=760));ro.observe(el);return()=>ro.disconnect()},[]);
 return wide;
}
function Duel({r,players}){
 const[a,b]=[r.values[players[0].uid],r.values[players[1].uid]],low=r.better==='low';
 const w=x=>low?(x>0?1/x:2):x,wa=w(a),wb=w(b),share=wa+wb>0?wa/(wa+wb):.5;
 const better=a===b?0:(low?a<b:a>b)?1:-1;
 return <div className="nbr-row" data-row={r.id}>
  <div className="nbr-duel"><b className="num" style={{color:better>0?TONE[0]:undefined}} data-better={better>0}>{fmt(a,r)}</b><span className="nbr-label">{r.label}</span><b className="num" style={{color:better<0?TONE[players[1].tone%4]:undefined}} data-better={better<0}>{fmt(b,r)}</b></div>
  <div className="nbr-split" aria-hidden="true"><i style={{width:(share*100)+'%',background:TONE[0]}}/><i style={{width:((1-share)*100)+'%',background:TONE[players[1].tone%4]}}/></div>
  {r.note&&<small>{r.note}</small>}
 </div>;
}
function Stack({r,players}){
 const vals=players.map(p=>r.values[p.uid]),low=r.better==='low',best=low?Math.min(...vals):Math.max(...vals),max=Math.max(...vals,1e-9),min=Math.min(...vals);
 return <div className="nbr-row" data-row={r.id}><div className="nbr-label">{r.label}</div>
  {players.map((p,i)=>{const v=vals[i],w=low?(v>0?min/v:1):v/max;return <div className="nbr-bar" key={p.uid} data-best={v===best&&vals.filter(x=>x===best).length<vals.length}>
   <span className="n"><i className="nbr-dot" style={{background:TONE[p.tone%4]}}/>{p.me?'あなた':p.name}</span><span className="trk"><i style={{width:Math.max(4,w*100)+'%',background:TONE[p.tone%4]}}/></span><span className="v num">{fmt(v,r)}</span></div>})}
  {r.note&&<small>{r.note}</small>}</div>;
}
function Table({rows,players}){const D=players.length===2?Duel:Stack;return <>{rows.map(r=><D key={r.id} r={r} players={players}/>)}</>}
function Confetti({on}){return on?<div className="nbr-confetti" aria-hidden="true">{Array.from({length:10},(_,i)=><i key={i} style={{left:(i*9.7+4)+'%',background:TONE[i%4],animationDelay:(i*70)+'ms'}}/>)}</div>:null}
function Tiles({tiles}){return tiles.length>0?<section className="nbr-tiles" aria-label="あなたの成績"><h3>あなたの成績</h3><div>{tiles.map(t=><div className="nbr-tile" key={t.id}><small>{t.label}</small><b className={t.text?'num nbr-tt':'num'}>{t.value}</b><small>{t.unit}</small>{t.note&&<small className="nbr-tn">{t.note}</small>}</div>)}</div></section>:null}
function Highlights({items,title='試合のハイライト'}){return items.length>0?<section className="nbr-hl" aria-label={title}><h3>{title}</h3>{items.map(h=><article className="nbr-card" key={h.id}>{ICON[h.id]||ICON.big}<div><h4>{h.title}{h.tag&&<span className="num">{h.tag}</span>}</h4><p>{h.detail}</p></div></article>)}</section>:null}
function GrowthSection({children}){return children?<section className="nbr-grow" aria-label="成長の記録"><h3>成長の記録</h3><div className="nbr-growslot">{children}</div></section>:null}
function Count({C,to,plain}){return C&&!plain?<C from={0} to={to} ms={900}/>:<>{to}</>}
function BattleSummary({model:m,badges=[],notes=null,growth=null,reviewCount=0,onReview=null,CountUp=null}){
 const ref=React.useRef(null),wide=useWide(ref),rm=reduced(),[open,setOpen]=React.useState(false);
 const me=m.players[0],foe=m.players[1],primary=m.rows.slice(0,4),more=m.rows.slice(4);
 return <section ref={ref} className={"nbr"+(m.extras.length?" has-extra":"")} data-battle-summary data-kind={m.kind} data-outcome={m.outcome} data-wide={wide}>
  <header className="nbr-hero" data-outcome={m.outcome}>
   <Confetti on={m.outcome==='win'&&!rm}/>
   <span className="nbr-chip">{m.methodLabel}{m.multi?` ・ ${m.players.length}人対戦`:''}</span>
   <h2 className="nbr-word" aria-label={{win:'勝利',lose:m.multi?`${m.place}位`:'敗北',draw:'引き分け'}[m.outcome]}>{m.word}</h2>
   {m.multi&&m.outcome==='lose'&&<div className="nbr-sub">LOSE</div>}
   {m.reasonText&&<div className="nbr-reason">{m.reasonText}</div>}
   {badges.length>0&&<div className="nbr-badges">{badges.map(b=><span key={b}>{b}</span>)}</div>}
   {notes&&<div className="nbr-notes">{notes}</div>}
   {m.multi?<ul className="nbr-rank">{[...m.players].sort((a,b)=>(a.rank??9)-(b.rank??9)).map(p=><li key={p.uid} data-me={p.me}><b className="num">{p.rank?`${p.rank}位`:'—'}</b><span><i className="nbr-dot" style={{background:TONE[p.tone%4]}}/>{p.me?'あなた':p.name}</span><span className="num">{p.score==null?'':`${p.score}点`}</span></li>)}</ul>
    :me.score!=null&&foe.score!=null&&<div className="nbr-score num"><span style={{color:TONE[0]}} data-score={me.score}><Count C={CountUp} plain={rm} to={me.score}/></span><small>VS</small><span data-score={foe.score}><Count C={CountUp} plain={rm} to={foe.score}/></span></div>}
  </header>
  <div className="nbr-grid">
   <Tiles tiles={m.tiles}/>
   {m.rows.length>1&&<section className="nbr-cmp" aria-label="相手との比較"><h3>{m.multi?'みんなとの比較':'相手との比較'}</h3>
    <div className="nbr-panel"><Table rows={wide||!more.length?m.rows:primary} players={m.players}/>
     {!wide&&more.length>0&&<details open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary>さらに{more.length}項目を見る</summary><div><Table rows={more} players={m.players}/></div></details>}
    </div>
    {m.hiddenRows&&<p className="nbr-note">記録がない項目は表示していません。</p>}</section>}
   <Highlights items={m.highlights}/>
   <GrowthSection>{growth}</GrowthSection>
   {m.extras.length>0&&<section className="nbr-extra" aria-label="B方式の記録"><h3>B方式の記録</h3><div className="nbr-panel"><Table rows={m.extras} players={m.players}/></div></section>}
  </div>
  {onReview&&reviewCount>0&&<button type="button" className="nbr-review" onClick={onReview}>間違えた問題を復習（{reviewCount}問）</button>}
 </section>;
}
// Hero + growth only: for results whose settled data carries no comparable per-player records (e.g. thin match payloads).
function MinimalSummary({outcome,methodLabel='',notes=null,growth=null}){
 const o={win:'win',draw:'draw',lose:'lose',w:'win',d:'draw',l:'lose'}[outcome]||'lose',rm=reduced();
 return <section className="nbr" data-battle-summary data-kind="R" data-outcome={o}>
  <header className="nbr-hero" data-outcome={o}>
   <Confetti on={o==='win'&&!rm}/>
   {methodLabel&&<span className="nbr-chip">{methodLabel}</span>}
   <h2 className="nbr-word" aria-label={{win:'勝利',lose:'敗北',draw:'引き分け'}[o]}>{{win:'WIN!',draw:'DRAW',lose:'LOSE'}[o]}</h2>
   {notes&&<div className="nbr-notes">{notes}</div>}
  </header>
  {growth&&<div className="nbr-grid"><GrowthSection>{growth}</GrowthSection></div>}
 </section>;
}
// 通常ソロ：CLEAR!/GAME OVER。対戦用と同じ部品（Confetti/Tiles/Highlights/GrowthSection）と .nbr のスタイルを再利用する。
function SoloSummary({model:m,growth=null,onLearn=null,learnLabel='学びの部屋へ',CountUp=null}){
 const rm=reduced();
 return <section className="nbr" data-battle-summary data-kind="S" data-outcome={m.outcome} data-solo-ending={m.cleared?'clear':'gameover'}>
  <header className="nbr-hero" data-outcome={m.outcome}>
   <Confetti on={m.outcome==='win'&&!rm}/>
   <span className="nbr-chip">{m.methodLabel}</span>
   <h2 className="nbr-word" aria-label={m.cleared?'クリア':'ゲームオーバー'}>{m.word}</h2>
   {m.reasonText&&<div className="nbr-reason">{m.reasonText}</div>}
   {m.badges.length>0&&<div className="nbr-badges">{m.badges.map(b=><span key={b}>{b}</span>)}</div>}
   {m.score!=null&&<div className="nbr-score num"><span style={{color:TONE[0]}} data-score={m.score}><Count C={CountUp} plain={rm} to={m.score}/></span><small>点</small></div>}
   {m.note&&<div className="nbr-notes">{m.note}</div>}
  </header>
  <div className="nbr-grid nbr-solo">
   <Tiles tiles={m.tiles}/>
   <Highlights items={m.highlights} title="プレイのハイライト"/>
   <GrowthSection>{growth}</GrowthSection>
  </div>
  {onLearn&&<button type="button" className="nbr-review" data-learn onClick={onLearn}>{learnLabel}</button>}
 </section>;
}
module.exports={BattleSummary,SoloSummary,MinimalSummary};
