// A/C compatibility display. Uses published state only; never reconstructs a future board.
export function LegacySpectator({H,ids=[],names={},mode,diff,bank,live={},ko={},result,probA,startAt,time,scoreA,teams={},feed=[],onLeave,children}){
 const[focus,setFocus]=React.useState(ids[0]),[expanded,setExpanded]=React.useState(false),selected=ids.includes(focus)?focus:ids[0];
 const number=x=>typeof x==='number'&&Number.isFinite(x)?x:null,text=x=>number(x)===null?'未記録':Math.round(x);
 const hud=u=>mode==='A'?{score:scoreA?.sc?.[u],correct:scoreA?.log?.filter(x=>x.w===u).length,combo:scoreA?.cb?.[u]}:{score:live[u]?.score,correct:live[u]?.c,combo:live[u]?.combo,hp:live[u]?.hp};
 const notice=feed.at(-1)?.txt;
 return ReactDOM.createPortal(<main className={'next-spectator '+(expanded?'expanded':'')} data-next-legacy-spectator={mode}><header><h1>観戦・{mode}方式</h1><button onClick={onLeave}>観戦を終了</button></header>{mode==='C'&&<p>チームHPと個人の記録を分けて表示します。記録のない値は補完しません。</p>}
 <div className="next-spectator-hud">{ids.map(u=>{const s=hud(u);return <button key={u} aria-pressed={u===selected} onClick={()=>setFocus(u)}><strong>{names[u]||'プレイヤー'}{mode==='C'?`（${teams[u]===0?'赤':teams[u]===1?'青':'未記録'}チーム）`:''}</strong><span>{text(s.score)}点{mode==='C'?` ／ チームHP報告 ${text(s.hp)}%`:''}</span><small>正解{text(s.correct)}問 ／ {text(s.combo)}コンボ{ko[u]?' ／ KO':''}</small></button>})}</div>
 {notice&&<p aria-live="polite">{notice}</p>}<button className="next-view-size" onClick={()=>setExpanded(v=>!v)}>{expanded?'全員を並べる':'選択した盤面を拡大'}</button>
 <div className="next-spectator-boards">{ids.map(u=>{const l=live[u]||{},ready=!result&&time>=startAt&&!ko[u]&&time>=(l.freezeUntil||0)&&l.resolving!==true&&(mode==='A'?!!probA:l.boardReady===true&&l.st!=='ko'&&l.st!=='over'),p=ready?(mode==='A'?probA:Number.isInteger(l.lv)&&l.lv>=1&&l.lv<=9&&Number.isInteger(l.k)&&l.k>=0?bank.get(l.lv,l.k):null):null,unknownExtra=mode==='C'&&(number(l.oj)===null||l.oj>0);
 return <section key={u} data-spectator-player={u} className={'spectator-board '+(u===selected?'focused':'')}><h2>{names[u]||'プレイヤー'}</h2>{p?<div className="next-readonly-board" inert=""><H.TargetCard v7 poly={p.poly} level={p.level||l.lv} qLabel="共有された問題"/>{unknownExtra?<p>追加カードを含む盤面は共有されていません。</p>:<H.BattleBoard v7 tiles={p.tiles} disabled onMatch={()=>{}}/>}</div>:<p role="status">{result?'試合終了':time<startAt?'開始待ち':time<(l.freezeUntil||0)?'FREEZE中':ko[u]?'KO':'次の問題または盤面の共有を待っています'}</p>}</section>})}</div>
 {result&&<p>{result.draw?'引き分け':mode==='C'?(result.team===0?'赤チームの勝利':result.team===1?'青チームの勝利':'勝利チームは未記録'):result.winner?`${names[result.winner]||'プレイヤー'}の勝利`:'結果を確定しました'}</p>}<section className="next-spectator-support" aria-label="観戦者の応援">{children}</section>
 </main>,document.body);
}
