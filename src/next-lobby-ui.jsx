import {Panel,BackButton} from './next-ui.jsx';
const icons=require('./next-home-icons.json');
function Icon({name}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]||icons.online}/></svg>}
function Choices({label,items,value,onChange}){return <fieldset className="next-choices"><legend>{label}</legend><div>{items.map(([id,name])=><button key={id} aria-pressed={value===id} onClick={()=>onChange(id)}>{name}</button>)}</div></fieldset>}
export function createLobby(H){
 const {DIFFICULTY_CONFIG,CPU_LEVELS}=H;
 return function Lobby({cpuOnly=false,fb,acct,who,err,onQuick,quickPending,quickMessage,quickError,onConfigRetry,ratedEnabled,onRatedStats,onCreate,onJoin,onPractice,onGhosts,onProfile,onNavigate,onExit,code,setCode,pc,setPc,onPlayers,onBounty,bountyCount,onVs,teacherArea,currentRatings}){
  const ready=!!fb.ready;
  const cpuPanel=<Panel title="CPU練習"><p className="next-note">公式レート・対人戦績には反映されません。</p><Choices label="方式" items={[['A','A方式'],['B','新B方式'],...(window.FXF_FEATURES?.cMode?[['C','C 2対2']]:[])]} value={pc.mode} onChange={mode=>setPc({mode})}/><Choices label="難易度" items={['easy','normal'].map(d=>[d,DIFFICULTY_CONFIG[d].label])} value={pc.diff} onChange={diff=>setPc({diff})}/><Choices label="CPUの強さ" items={Object.entries(CPU_LEVELS).map(([id,c])=>[id,c.label])} value={pc.lv} onChange={lv=>setPc({lv})}/>{pc.mode==='C'?<p className="next-note">あなた＋味方CPU 対 相手CPU2人。体力はチームで共有。</p>:<Choices label="CPUの人数" items={[[1,'1人'],[2,'2人'],[3,'3人']]} value={pc.n} onChange={n=>setPc({n})}/>}<button className="next-secondary" onClick={()=>onPractice(pc)}>CPUと練習スタート</button></Panel>;
  if(cpuOnly)return <main className="next-lobby next-cpu" data-next-lobby data-cpu-only><div className="next-lobby-grid">{cpuPanel}</div></main>;
  return <main className="next-lobby" data-next-lobby>
   {!ready&&<p className="next-note" role="status">{fb.err||'サーバーに接続しています…'}</p>}
   {err&&<p className="next-error" role="alert">{err}</p>}
   <section className="next-quick"><Icon name="online"/><div><h2>ランダムレーティング対戦</h2><p>イージー・ノーマル。マッチング後にA・新B方式を選択。</p>{!quickPending&&!ratedEnabled&&<p>レーティング対戦は現在利用できません。ルーム対戦を利用できます。</p>}{quickMessage&&<p role={quickError?'alert':'status'}>{quickMessage}</p>}</div><button className="next-primary" disabled={!ready||quickPending||!ratedEnabled} onClick={onQuick}>すぐ遊ぶ（ランダム対戦）</button>{quickError&&<button className="small-button" onClick={onConfigRetry}>設定を再試行</button>}</section>
   {currentRatings&&<Panel title="現在レーティング" className="next-panel next-lobby-ratings">{currentRatings}</Panel>}
   <div className="next-lobby-grid">
    <Panel title="4桁ルーム対戦"><p className="next-note">友だちと対戦。方式を選んで部屋を作ります。</p><div className="next-mode-links">{[['A','A方式','先に正解して得点'],['B','新B方式','時間制\n得点と妨害'],...(window.FXF_FEATURES?.cMode?[['C','C方式','2対2のチーム戦']]:[])].map(([mode,label,note])=><button key={mode} disabled={!ready} onClick={()=>onCreate(false,mode)}><strong>{label}</strong><small style={{whiteSpace:'pre-line'}}>{note}</small></button>)}</div><button className="next-secondary" disabled={!ready} onClick={()=>onCreate(false)}>部屋を作る（ホスト）</button><label className="next-code-label" htmlFor="next-room-code">部屋コード4桁</label><div className="next-room-join"><input id="next-room-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="部屋コード4桁" inputMode="numeric" maxLength={4}/><button className="next-secondary" disabled={!ready} onClick={()=>onJoin(code,false)}>参加</button><button className="next-secondary" disabled={!ready} onClick={()=>onJoin(code,true)}>観戦</button></div><p className="next-note">クラス大会も同じコードから参加できます。</p></Panel>
    
    <Panel title="ゴースト対戦"><p className="next-note">通常ゴーストとランキングTOP10対象のハイパーゴーストを選べます。自己対戦は無報酬の練習です。</p><button className="next-secondary" disabled={!ready||!ratedEnabled} onClick={onGhosts}><Icon name="ghost"/>ゴースト対戦</button>{acct&&<button className="next-secondary" onClick={onProfile}><Icon name="account"/>自分のゴースト・成績</button>}<p className="next-note">自分のゴーストは成績の「称号の装備・詳細記録」から。記録がなければ開始できません。</p></Panel>
    <Panel title="協力・プレイヤー"><div className="next-link-list"><button className="next-secondary" onClick={()=>onNavigate('boss')}><Icon name="raid"/>今週のボス</button><button className="next-secondary" disabled={!ready} onClick={()=>onCreate('fraid')}><Icon name="people"/>フレンドレイドを開く（1〜4人で協力）</button><button className="next-secondary" onClick={onPlayers}><Icon name="people"/>みんなの成績</button><button className="next-secondary" onClick={onBounty}><Icon name="bounty"/>賞金首リスト{bountyCount?`（${bountyCount}人）`:''}</button><button className="next-secondary" disabled={!onRatedStats} onClick={onRatedStats}><Icon name="rank"/>オンラインレーティング</button>{onVs&&<button className="next-secondary" onClick={onVs}>相手ごとの成績</button>}</div></Panel>
   </div>
   {teacherArea&&<section className="next-admin" aria-label="開催権限と先生機能">{teacherArea}</section>}
  </main>;
 }
}
