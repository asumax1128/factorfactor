(function(root){root.RoomB2Factory=function(H){
 const{useState,useRef,useEffect}=React;
 function App(props){const{code,state,players,isHost,acct,spectator,onLeave,muted,setMuted}=props,uid=props.practice?'me':H.FB.uid;
  const[raw,setRaw]=useState(null),[time,setTime]=useState(H.now()),[err,setErr]=useState(''),[feedback,setFeedback]=useState(null),[pending,setPending]=useState(false),[target,setTarget]=useState(state.players.find(u=>u!==uid));
  const transport=useRef(null),sequence=useRef(0),pendingSeq=useRef(0),answerLock=useRef(false),feedbackTimer=useRef(null);
  useEffect(()=>{const c=root.RoomB2.create({db:props.practice?H.dbOf():H.FB.db,code,state,uid,isHost,...(props.practice?{localBots:root.LocalB2Bots.create({think:H.cpuThink,miss:H.cpuMiss,levels:H.CPU_LEVELS})}:{}),onView:r=>{setRaw(r);sequence.current=r.game.seq?.[uid]||0;if(sequence.current>=pendingSeq.current){answerLock.current=false;setPending(false)}},onError:e=>setErr(e.message)});transport.current=c;return()=>{c.close();clearTimeout(feedbackTimer.current)}},[state.gid,isHost]);
  useEffect(()=>{const t=setInterval(()=>setTime(H.now()),40);return()=>clearInterval(t)},[]);
  if(!raw?.game)return <main className="or-app"><p>対戦を同期しています…</p><button onClick={onLeave}>戻る</button>{err&&<p role="alert">{err}</p>}</main>;
  const g=raw.game;
  if(raw.phase==='cancelled')return <main className="or-app"><p>開始前に中止しました。敗北にはなりません。</p><button onClick={onLeave}>戻る</button></main>;
  if(spectator){const slots=Object.keys(raw.inputs?.[uid]||{}).filter(k=>/^c[1-3]$/.test(k)),used=Math.max(slots.length,Object.values(g.cheerReceipts||{}).filter(r=>r.viewer===acct?.key).length),next=[1,2,3].find(n=>!slots.includes('c'+n));
   if(root.NextResults?.Spectator)return <root.NextResults.Spectator H={H} g={g} time={time} names={state.names} onLeave={onLeave}><div className="next-spectator-cheers">{g.ids.map(u=><button key={u} disabled={!acct?.key||used>=3||g.states[u].hp<=0||!!g.result||time<g.startAt} onClick={()=>transport.current.request({type:'cheer',account:acct.key,target:u,seq:next}).catch(e=>setErr(e.message))}>{state.names[u]}へ応援＋10pt（残り{3-used}回）</button>)}</div>{err&&<p role="alert">{err}</p>}</root.NextResults.Spectator>;
   return <main className="or-app"><h1>観戦・B方式</h1><p>残り{Math.max(0,(g.endAt-time)/1000).toFixed(1)}秒</p>{g.ids.map(u=><section key={u}><h2>{state.names[u]}</h2><p>{g.states[u].score}点・HP {Math.round(g.states[u].hp)}%・お邪魔{g.states[u].cur.oj}枚・応援{g.states[u].cheerPoints}pt</p><button disabled={!acct?.key||used>=3||g.states[u].hp<=0||!!g.result||time<g.startAt} onClick={()=>transport.current.request({type:'cheer',account:acct.key,target:u,seq:next}).catch(e=>setErr(e.message))}>応援＋10pt（残り{3-used}回）</button></section>)}{g.result&&<p>{g.result.draw?'引き分け':`${state.names[g.result.winner]}の勝利`}</p>}{err&&<p role="alert">{err}</p>}<button onClick={onLeave}>観戦を終了</button></main>;
  }
  if(g.result&&state.tournamentVersion===2)return <H.TournamentFinal {...props} game={g}/>;
  if(g.result)return <H.Final {...props} state={{...state,b2Final:g}}/>;
  const view=transport.current.view(raw);
  const answer=(id1,id2)=>{const ids=Array.isArray(id1)?id1:[id1,id2];if(answerLock.current||time<g.startAt||time<view.freezeUntil||view.resolving||g.states[uid].hp<=0)return;answerLock.current=true;setPending(true);
   const a=view.tiles.find(t=>t.id===ids[0]),b=view.tiles.find(t=>t.id===ids[1]),ok=H.polyEqual(H.multiply(a.factor,b.factor),view.poly),judge=H.timingVisual(ok?H.getJudgment(time-view.startAt):{label:'Bad',color:'#FF5C5C'});
   setFeedback({judge,flash:{[a.id]:ok?'correct':'wrong',[b.id]:ok?'correct':'wrong'}});if(ok)H.CombatFX.merge(H.CombatFX.capture(ids.map(id=>document.querySelector(`[data-btile="${id}"]`)),document.querySelector('[data-online-opponent]')),judge.color);clearTimeout(feedbackTimer.current);feedbackTimer.current=setTimeout(()=>setFeedback(null),650);
   const seq=sequence.current+1;pendingSeq.current=seq;transport.current.request({type:'answer',seq,question:view.question,tiles:ids,target}).catch(e=>{setErr(e.message);answerLock.current=false;setPending(false)});
  };
  return <><H.BattleView H={H} m={{id:state.gid,selfUid:uid,mode:'B',difficulty:state.diff,gameStartAt:g.startAt,members:g.ids.map(u=>({uid:u,name:state.names[u]}))}} g={view} time={time} muted={muted} setMuted={setMuted} disabled={pending||g.states[uid].hp<=0} feedback={feedback} extraControls={g.ids.length>2&&<div className="or-room-targets pf-targets" role="group" aria-label="攻撃の標的">{g.ids.filter(u=>u!==uid).map(u=><button key={u} className="pf-target" disabled={g.states[u].hp<=0} onClick={()=>setTarget(u)} aria-pressed={target===u}><i className="pf-target-mark" aria-hidden="true">🎯</i>{state.names[u]}：{g.states[u].score}点</button>)}</div>} onMatch={answer} onSpecial={()=>{}} onLeave={()=>{if(time<g.startAt||confirm('対戦開始後の退出は敗北扱いです。退出しますか？'))transport.current.request({type:'leave'}).then(onLeave).catch(e=>setErr(e.message))}}/>{err&&<div className="or-room-error" role="alert">{err}</div>}</>;
 }
 return{App};
};})(window);
