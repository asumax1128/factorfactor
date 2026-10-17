// Ver.6.0 ResultShell: display-only building blocks shared by every result screen (solo / A / B2 / CPU / random match / tournament).
// It never decides results and never saves anything: every write, ack, rematch or send is a callback owned by the caller.
export const WORD={win:'WIN!',draw:'DRAW',lose:'LOSE'};
export const wordOf=o=>WORD[{w:'win',d:'draw',l:'lose',win:'win',draw:'draw',lose:'lose'}[o]]||WORD.lose;
const reduced=()=>typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Section wrapper that keeps the dark result tokens outside `.nbr` as well (details, review, actions live in the same scroller).
export function ResultShell({kind,outcome,busy=false,className='',children,...p}){
 return <div className={'rs-scope '+className} data-result-shell data-kind={kind} data-outcome={outcome} data-busy={busy||undefined} aria-busy={busy||undefined} {...p}>{children}</div>;
}
export function ResultDetails({title,id,children,...p}){return <section className="rs-details" aria-label={title} {...p}>{title&&<h3>{title}</h3>}{children}</section>;}
export function ResultButton({tone='secondary',children,...p}){return <button type="button" className={'rs-btn rs-'+tone} {...p}>{children}</button>;}
// Action row: sticky at the bottom of the (single) scroll container so the key buttons are never scrolled out of reach.
export function ResultActions({children,busy=false,note=null,...p}){return <div className="rs-actions" data-busy={busy||undefined} {...p}>{children}{note}</div>;}
export function ReviewCard({summary,open,onToggle,onlyLabel,onlyMiss,onOnlyMiss,rows,emptyText='ありません'}){
 return <section className="rs-review" data-review-card-body>
  <button type="button" className="rs-review-toggle" aria-expanded={open} onClick={onToggle}><span>{summary}</span><span aria-hidden="true">{open?'▲':'▼'}</span></button>
  {open&&<>
   <label className="rs-review-only"><input type="checkbox" checked={onlyMiss} onChange={e=>onOnlyMiss(e.target.checked)}/> {onlyLabel}</label>
   <div className="rs-review-list">
    {rows.length===0&&<p>{emptyText}</p>}
    {rows.map(r=><div key={r.n} className="rs-review-row"><div className="rs-review-meta"><span>問{r.n} ・ Lv.{r.lv}</span><span data-good={r.good}>{r.good?'○':'×'} {r.mark}</span></div><div className="rs-review-body">{r.content}</div></div>)}
   </div>
  </>}
 </section>;
}
// Title reveal ("バッジのめくり"), shared by every result screen. `fx` = {sound,confetti} supplied by the host page.
// A reveal key (account + match) is stored once the cards were shown, so a re-displayed result never replays sound/confetti.
export function TitleReveal({titles,fx={},revealKey=null,staticOnly=false}){
 const seen=React.useRef(null);
 if(seen.current===null){let s=false;try{s=!!revealKey&&localStorage.getItem('fxf_title_reveal_v1:'+revealKey)==='1'}catch(e){}seen.current=s;}
 const still=staticOnly||seen.current||reduced();
 const [open,setOpen]=React.useState(still?titles.length:0);
 React.useEffect(()=>{
  if(!titles.length||still){if(revealKey&&titles.length)try{localStorage.setItem('fxf_title_reveal_v1:'+revealKey,'1')}catch(e){}return;}
  let i=0;const t=setInterval(()=>{i++;setOpen(i);fx.sound&&fx.sound();fx.confetti&&fx.confetti();if(i>=titles.length){clearInterval(t);if(revealKey)try{localStorage.setItem('fxf_title_reveal_v1:'+revealKey,'1')}catch(e){}}},900);
  return()=>clearInterval(t);
 },[titles.length]);
 if(!titles.length)return null;
 return <section className="rs-title" data-title-reveal data-new-title="1" aria-label="称号ゲット"><h3>🎉 称号ゲット！</h3>
  <div className="rs-title-cards">{titles.map((b,i)=>i<open
   ?<div key={b.id} className="rs-title-card" data-revealed="true"><span className="rs-title-icon" aria-hidden="true">{b.icon}</span><b>{b.label}</b>{b.desc&&<small>{b.desc}</small>}</div>
   :<div key={b.id} className="rs-title-card rs-title-back" aria-hidden="true">?</div>)}</div></section>;
}
