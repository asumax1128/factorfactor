export function AuthorityWeekly({H,acct,onExit}){
 const {useState,useEffect,useMemo}=React,{FB,fbNow,weekKey,useTick,TargetCard,BattleBoard,weeklyInfo,bossForm,MonsterPic}=H;
 const key='fxf_weekly_authority:'+acct.key,[week,setWeek]=useState(()=>{try{return JSON.parse(localStorage.getItem(key))?.week||weekKey(fbNow())}catch{return weekKey(fbNow())}}),[view,setView]=useState(null),[shared,setShared]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(()=>{try{return JSON.parse(localStorage.getItem(key))?.pending||null}catch{return null}});
 const client=useMemo(()=>window.NextAuthority.weekly({db:FB.db,uid:FB.uid,account:acct,week}),[acct.key,week]);
 useEffect(()=>{setView(null);setShared(null);const stop=client.subscribe(setView,e=>setError(e.message)),r=FB.db.ref(`${window.NextAuthority.ROOT}/weekly/${week}/public`),f=s=>setShared(s.val());r.on('value',f,e=>setError(e.message));return()=>{stop();r.off('value',f)}},[client]);useTick(200,true);
 const persist=p=>{localStorage.setItem(key,JSON.stringify({week,pending:p}));setPending(p)};
 async function send(command){if(busy)return;const c=command||pending;if(!c)return;persist(c);setBusy(true);setError('');try{await client.submit(c.type,c.payload,c.id);persist(null)}catch(e){if(e.confirmed)persist(null);setError(e.message)}finally{setBusy(false)}}
 const command=(type,payload)=>send({id:client.newId(),type,payload}),now=fbNow(),runs=Object.values(view?.runs||{}),run=runs.find(r=>r.status==='play')||runs.sort((a,b)=>b.startAt-a.startAt)[0],active=run?.status==='play',live=!!view&&now-view.serverAt<4000&&FB.conn!==false;
 const board=useMemo(()=>run?.prob,[JSON.stringify(run?.prob)]);
 const ready=active&&!!run.prob&&!run.pending&&!busy&&!pending&&live&&view.revision===shared?.revision&&now>=run.startAt&&now>=run.stunUntil&&now<run.endAt;
 const info=shared?.meta?weeklyInfo(week,{},shared.meta,{}):null,boss=info&&bossForm(info.boss,shared.revived),fmt=n=>Number.isFinite(n)?n.toLocaleString():'—';
 return <main className="authority-weekly next-result-details" data-weekly-authority><link rel="stylesheet" href="ui-next/home.css"/><link rel="stylesheet" href="ui-next/weekly.css"/>
 <header><button className="small-button" onClick={onExit}>ホームへ</button><h1>今週のボス</h1></header><p className="authority-dev-note">Emulator専用・本番の戦績と報酬には反映されません</p>
 {error&&<p role="alert">{error}</p>}{pending&&<button className="small-button" disabled={busy} onClick={()=>send()}>同じ操作を再送</button>}
 {shared?.enabled?<><section className="authority-boss"><div><h2>{boss?.name||'今週のボス'}</h2><p>HP <b data-authority-hp>{fmt(shared.hp)} / {fmt(shared.hpMax)}</b>{shared.kill?' ・ 討伐済み':''}</p><progress aria-label="ボスの残りHP" value={shared.hp} max={shared.hpMax}/><p>{week} の週{shared.closed?' ・ 確定済み':''}</p></div>{boss&&<MonsterPic id={boss.id} icon={boss.icon} size="8rem"/>}</section>
 {active?<><dl className="authority-hud"><div><dt>残り時間</dt><dd>{Math.max(0,Math.ceil((run.endAt-now)/1000))}秒</dd></div><div><dt>ダメージ</dt><dd>{fmt(run.d)}</dd></div><div><dt>コンボ</dt><dd>{run.combo}</dd></div></dl>
 <p role="status">{now<run.startAt?'READY':busy?'解答を確定しています…':!live?'通信・workerの復旧を待っています':run.pending?'次の問題を待っています':now<run.stunUntil?'反撃でしびれています':run.chest?.on?'宝箱：次の問題で開錠':'因数タイルを2枚つないで解答'}</p>
 {run.lastAnswer&&now-run.lastAnswer.at<1500&&<p aria-live="polite">{run.lastAnswer.ok?`${run.lastAnswer.judge} ＋${run.lastAnswer.damage}ダメージ`:'不正解'}</p>}
 <div className={'authority-board'+(now<run.fogUntil?' fogged':'')}>
 {ready?<><TargetCard v7 poly={board.poly} level={board.level} qLabel={board.poly2?'式A':undefined} gaugeKey={run.qs} gaugeMs={20000}/>{board.poly2&&<TargetCard v7 poly={board.poly2} level={board.level2||board.level} qLabel="式B（どちらも解答可能）" gaugeKey={run.qs} gaugeMs={20000}/>}
 <BattleBoard v7 tiles={Array.isArray(board.tiles)?board.tiles:Object.values(board.tiles)} flash={{}} mirror={info?.T.gim==='mirror'} disabled={!ready} onMatch={(first,second)=>command('answer',{runId:run.id,questionAt:run.qs,first,second})}/></>:<div className="authority-board-wait" aria-label="盤面は操作解禁まで表示されません"/>}</div>
 <button className="small-button" disabled={busy||!!pending} onClick={()=>command('quit',{runId:run.id})}>出撃を終了</button></>:<>
 {run&&<section data-authority-result><h2>{run.receipt?'出撃おつかれさま！':'出撃終了（未完走）'}</h2><p>{fmt(run.d)}ダメージ ／ 正解 {run.n}問 ／ 最高 {run.best}コンボ</p>{run.reward&&<p>獲得EXP {run.reward.after-run.reward.before}</p>}</section>}
 <p>1日5回まで。途中退出も1回として消費します。</p><div className="authority-actions"><button className="small-button" disabled={busy||!!pending||shared.closed||!!shared.kill} onClick={()=>command('start',{role:'atk'})}>アタッカーで出撃</button><button className="small-button" disabled={busy||!!pending||shared.closed||!!shared.kill} onClick={()=>command('start',{role:'sup'})}>サポーターで出撃</button></div></>}
 {shared.closed&&<button className="small-button" onClick={()=>{localStorage.removeItem(key);setPending(null);setWeek(weekKey(fbNow()))}}>今週へ切り替え</button>}
 {view?.awards&&Object.keys(view.awards).length>0&&<section><h2>確定報酬</h2><ul>{Object.values(view.awards).map(a=><li key={a.id}>{({kill:'討伐',lastHit:'最終打',final:'週締め'})[a.kind]}：{a.exp} EXP</li>)}</ul></section>}
 {view?.ranking&&<section><h2>週締め順位</h2><ol>{view.ranking.map(r=><li key={r.account}>{r.account}：{fmt(r.damage)}ダメージ</li>)}</ol></section>}
 </>:<p role="status">{error?'HP情報を取得できません':'管理側workerの準備を待っています…'}</p>}
 </main>;
}
