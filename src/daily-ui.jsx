(function(root){root.DailyFactory=function(H){
 const {useState,useEffect,useRef}=React,D=root.DailyV2.model,P=root.DailyV2.Play;
 function App({acct,onExit,onMode}){
  const [client]=useState(()=>acct?.key?root.DailyV2.create({db:H.FB.db,uid:H.FB.uid,account:acct}):null);
  const [status,setStatus]=useState(null),[day,setDay]=useState(null),[difficulty,setDifficulty]=useState('easy'),[rows,setRows]=useState([]),[err,setErr]=useState(''),[busy,setBusy]=useState(false),[record,setRecord]=useState(null);
  const [game,setGame]=useState(null),[time,setTime]=useState(0),[muted,setMuted]=H.useGameMute(),[feedback,setFeedback]=useState(null),[attempt,setAttempt]=useState(null);
  const sound=H.useBattleSound(muted);
  const ref=useRef(null),saved=useRef(false),pending=useRef(null),feedbackTimer=useRef(null),origin=useRef(0),startClock=useRef(0);
  const refresh=async()=>{if(!client)return;const s=await client.status();setStatus(s);setDay(d=>d===null?s.day:status?.day!==s.day?s.day+(d===status?.day-1?-1:0):d);};
  useEffect(()=>{if(!status)return;const ms=(status.day+1)*D.DAY-D.SHIFT-status.now;const timer=setTimeout(()=>refresh().catch(e=>setErr(e.message)),Math.max(100,ms+100));return()=>clearTimeout(timer)},[status?.now]);
  useEffect(()=>{refresh().then(()=>client?.awards()).catch(e=>setErr(e.message));return()=>clearTimeout(feedbackTimer.current)},[]);
  useEffect(()=>{if(client&&day!==null){let active=true;client.rankings(day,difficulty).then(r=>active&&setRows(r)).catch(e=>active&&setErr(e.message));return()=>{active=false}}},[day,difficulty,record]);
  const done=async(s,a)=>{if(saved.current)return;saved.current=true;pending.current={s,a};try{const r=await client.finish(a,s);setRecord(r);setErr('');await refresh();await H.onCompleted?.(acct,a,s);pending.current=null;}catch(e){saved.current=false;setErr('記録を送信できませんでした。再試行してください：'+e.message)}};
  useEffect(()=>{if(!attempt||!game||game.done)return;const t=setInterval(()=>{const now=startClock.current+performance.now()-origin.current;setTime(now);if(now<startClock.current)return;const n=P.tick(ref.current,now);ref.current=n;setGame(n);if(n.done)done(n,attempt)},40);return()=>clearInterval(t)},[attempt,!!game,game?.done]);
  const start=async()=>{if(busy)return;setBusy(true);setErr('');try{const a=await client.start(difficulty);setStatus(s=>({...s,day:a.day,now:a.at,used:a.used??s?.used}));setDifficulty(a.difficulty);setAttempt(a);setRecord(null);saved.current=false;origin.current=performance.now()+3000;startClock.current=Date.now();const s=P.begin(a.difficulty,a.seed,startClock.current);ref.current=s;setGame(s);setTime(startClock.current-3000);}catch(e){setErr(e.message)}finally{setBusy(false)}};
  const answer=(id1,id2)=>{const ids=Array.isArray(id1)?id1:[id1,id2];if(time<startClock.current||ref.current?.resolving||ref.current?.done)return;const at=startClock.current+performance.now()-origin.current;try{const n=P.answer(ref.current,ids,at),hist=n.hist.slice(-1)[0];ref.current=n;setGame(n);setFeedback({judge:H.timingVisual(hist.ok?H.getJudgment(hist.ms):{label:'Bad',color:'#FF5C5C'}),flash:Object.fromEntries(ids.map(id=>[id,hist.ok?'correct':'wrong']))});sound.play(hist.ok?'ok':'buzz');clearTimeout(feedbackTimer.current);feedbackTimer.current=setTimeout(()=>setFeedback(null),420);if(n.done)done(n,attempt)}catch(e){setErr(e.message)}};
  if(game&&!game.done){if(game.cur.reverse)return <H.BattleSurface><h2>展開ボーナス・{H.DIFFICULTY_CONFIG[difficulty].label}</h2><H.MathText text={game.cur.factors.map(H.formatFactorTile).join('')}/><p>正しい展開結果を選ぼう</p>{game.cur.choices.map(c=><button key={c.id} data-daily-choice={c.id} disabled={game.resolving||time<startClock.current} onClick={()=>answer([c.id])}><H.MathText text={c.text}/></button>)}<H.HpBar hp={game.hp}/></H.BattleSurface>;const g={id:attempt.id,mode:'B',difficulty,question:`${game.cur.level}:${game.cur.k}`,poly:game.cur.poly,tiles:game.cur.tiles,level:game.cur.level,startAt:game.qStart,timeoutMs:20000,resolving:game.resolving,readyAt:game.readyAt,combo:game.combo,live:{daily:{...game,c:game.index},unused:{score:0,hp:100,c:0,combo:0}},acceptedSeq:0};
   return <H.BattleView H={H} m={{id:attempt.id,daily:true,selfUid:'daily',mode:'B',difficulty,gameStartAt:startClock.current,members:[{uid:'daily',name:acct.name},{uid:'unused',name:'デイリーチャレンジ'}]}} g={g} time={time} muted={muted} setMuted={setMuted} disabled={time<startClock.current} onMatch={answer} onSpecial={()=>{}} feedback={feedback} onLeave={()=>{if(confirm('途中退出は未クリアとなり、挑戦回数は戻りません。退出しますか？')){const s={...ref.current,done:true,cleared:false,elapsed:Math.max(0,time-startClock.current)};ref.current=s;setGame(s);done(s,attempt)}}}/>;
  }
  return <main className="or-app"><header><button onClick={onExit}>← タイトルへ</button><h1>デイリーチャレンジ</h1></header>
   {!client&&<section><p>1日3回の挑戦権とランキングを管理するため、登録アカウントでログインしてください。ソロ・CPU練習はゲストでも遊べます。</p></section>}
   {err&&<section role="alert"><p>{err}</p>{pending.current&&<button onClick={()=>done(pending.current.s,pending.current.a)}>記録の送信を再試行</button>}</section>}
   {game?.done&&<section><h2>{game.cleared?'クリア！':'未クリア'}</h2><p>{game.score}点・{game.correct}問正解</p><p>{game.cleared?`クリアタイム ${(game.elapsed/1000).toFixed(2)}秒`:'途中終了も獲得得点でランキングに参加します'}</p><button onClick={()=>{setGame(null);setAttempt(null)}}>デイリーへ戻る</button></section>}
   <section><h2>今日の挑戦</h2><p>3難易度を合わせて1日3回。残り{status?Math.max(0,3-status.used):'…'}回</p><p>{H.DIFFICULTY_CONFIG[difficulty].clearCount}問。ソロと同じ難易度のランダム問題です。誤答があっても最後まで完走すればクリア。</p>
    <div className="or-difficulty-grid">{['easy','normal','hard'].map(d=><button key={d} className={'or-difficulty '+(difficulty===d?'selected':'')} style={{'--difficulty-color':H.DIFFICULTY_CONFIG[d].color}} onClick={()=>setDifficulty(d)}>{H.DIFFICULTY_CONFIG[d].label}</button>)}</div>
    <button disabled={busy||!client||!status||status.used>=3} onClick={start}>この難易度で挑戦</button><p>開始後の退出・再読み込みでも1回消費します。日本時間0時に更新。</p>
   </section>
   <section><h2>デイリーランキング・{day===null?'':D.date(day)}</h2><button onClick={()=>status&&setDay(status.day)}>今日</button><button onClick={()=>status&&setDay(status.day-1)}>昨日</button>
    <p>{H.DIFFICULTY_CONFIG[difficulty].label} TOP10</p><ol>{rows.map((r,i)=><li key={r.key}>{i+1}位 {r.name}：{r.score}点・{r.cleared?`${(r.elapsed/1000).toFixed(2)}秒`:'未クリア'}（{r.correct}問正解）{day<status?.day&&i===0?' 🏆 優勝':''}</li>)}</ol>{!rows.length&&<p>まだ記録がありません</p>}
    <p>得点→クリア→タイム／正解数→確定時刻の順。前日の優勝称号は日跨ぎ挑戦の終了猶予後、次回起動時に付与します。</p>
   </section><H.Missions acct={acct} onMode={onMode}/>
  </main>;
 }
 return{App};
};})(window);
