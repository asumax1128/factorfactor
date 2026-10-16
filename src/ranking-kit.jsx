// Ver.6.0 ranking parts shared by the three ranking lists. Presentation only: ranks, ordering, ties,
// limits and data sources are decided by the callers exactly as before.
export function RankingHead({title,note}){return <header className="rk-head"><h2>{title}</h2>{note&&<p>{note}</p>}</header>}
// Segmented: one selected button, aria-pressed for assistive tech, >=44px targets.
export function Segmented({label,items,value,onChange,className=''}){
 return <div className={'rk-seg '+className} role="group" aria-label={label}>{items.map(([id,text])=><button key={id} type="button" aria-pressed={value===id} onClick={()=>onChange(id)}>{text}</button>)}</div>;
}
// ListState: loading / empty / error in one look. `retry` shows the existing update button.
export function ListState({status,message,detail,onRetry,retryLabel='↻ 更新'}){
 if(status==='ok')return null;
 const text=message||(status==='loading'?'読み込み中…':status==='error'?'読み込みに失敗しました。通信環境を確認してもう一度試してね。':'まだ記録がありません');
 return <div className={'rk-state rk-'+status} role={status==='error'?'alert':'status'}><p>{text}</p>{detail&&<small>({detail})</small>}{onRetry&&status!=='loading'&&<button type="button" onClick={onRetry}>{retryLabel}</button>}</div>;
}
// RankRow: rank / name / main value / optional sub line. `self` highlights the player's own row.
export function RankRow({rank,name,value,unit='',sub,extra,self=false,onName}){
 const top=rank>=1&&rank<=3;
 return <li className={'rk-row'+(self?' rk-self':'')+(top?' rk-top rk-top'+rank:'')} data-rank={rank} aria-current={self?'true':undefined}>
  <span className="rk-no" aria-label={rank+'位'}>{rank}</span>
  <span className="rk-main">{onName?<button type="button" className="rk-name" onClick={onName}>{name}</button>:<strong className="rk-name">{name}</strong>}{self&&<em className="rk-me">あなた</em>}{extra&&<span className="rk-extra">{extra}</span>}{sub&&<small>{sub}</small>}</span>
  <span className="rk-val"><b>{value}</b>{unit&&<i>{unit}</i>}</span>
 </li>;
}
export function RankList({children,label}){return <ol className="rk-list" aria-label={label}>{children}</ol>}
