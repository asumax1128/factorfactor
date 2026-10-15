export function Spectator({H,g,time,names={},onLeave,children}){
 const[selected,setSelected]=React.useState(g.ids[0]),[expanded,setExpanded]=React.useState(false),focus=g.ids.includes(selected)?selected:g.ids[0];
 const last=g.scoreTrace?.events?.slice(-1)[0],notice=last?.uid?`${names[last.uid]||'プレイヤー'}が正解。＋${last.gain}点`:'試合状況を表示しています。';
 return <main className={'next-spectator '+(expanded?'expanded':'')} data-next-spectator><header><h1>観戦・新B方式</h1><button onClick={onLeave}>観戦を終了</button></header><p>残り {Math.max(0,(g.endAt-time)/1000).toFixed(1)}秒</p>
 <div className="next-spectator-hud">{g.ids.map(u=>{const s=g.states[u];return <button key={u} onClick={()=>setSelected(u)} aria-pressed={u===focus}><strong>{names[u]||'プレイヤー'}</strong><span>{s.score}点 ／ HP {Math.round(s.hp)}%</span><small>正解{s.c}問 ・ {s.combo}コンボ ／ お邪魔{s.cur.oj}枚</small></button>})}</div>
 <p aria-live="polite">{notice}</p><button className="next-view-size" onClick={()=>setExpanded(v=>!v)}>{expanded?'両者を並べる':'選択した盤面を拡大'}</button>
 <div className="next-spectator-boards">{g.ids.map(u=>{const s=g.states[u],visible=time>=g.startAt&&!s.resolving&&time>=s.qStart&&time>=s.freezeUntil&&!g.result&&s.hp>0;
 return <section key={u} data-spectator-player={u} className={(u===focus?'focused':'')+' spectator-board'}><h2>{names[u]||'プレイヤー'}</h2>{visible?<div className="next-readonly-board" inert=""><H.TargetCard poly={s.cur.poly} level={s.cur.level} qLabel={`${s.c+1}問`} v7/><H.BattleBoard tiles={s.cur.tiles} disabled onMatch={()=>{}} v7/></div>:<p role="status">{g.result?'試合終了':time<g.startAt?'開始待ち':time<s.freezeUntil?'FREEZE中':s.hp<=0?'KO':'次の問題を待っています'}</p>}</section>})}</div>
 {children}{g.result&&<p>{g.result.draw?'引き分け':`${names[g.result.winner]||'プレイヤー'}の勝利`}</p>}
 </main>;
}
