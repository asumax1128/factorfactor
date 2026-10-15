// Home is presentation/read-only: no boss initialization, rewards or migration writes.
const icons = require('./next-home-icons.json');
window.NextHomeFactory = H => {
 const {useState,useEffect,useRef}=React;
 const {FB,useFbReady,weekKey,now,weeklyInfo,bossForm,suriImg,useRatingHistoryProfile,RatingDisplay,levelOf,isReal,loadGuest,nickOf,PlayerProfile,Wardrobe,useFbValue,useGameMute,LoginBonus,syncSkin}=H;
 const Icon=({name})=><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]||icons.home}/></svg>;
 function useBoss(){
  const fb=useFbReady(),[tick,setTick]=useState(0),[retry,setRetry]=useState(0),[data,setData]=useState(null);
  useEffect(()=>{const t=setInterval(()=>setTick(x=>x+1),1000);return()=>clearInterval(t)},[]);
  const wk=weekKey(now());
  useEffect(()=>{
   if(!fb.ready)return;
   let active=true;const vals={},done=new Set(),subs=[];
   setData({wk,status:'loading'});
   for(const key of ['meta','dmg']){
    const ref=FB.db.ref(`games/factor/raidw/${wk}/${key}`);
    const f=s=>{if(!active)return; vals[key]=s.val();done.add(key);if(done.size===2)setData({wk,status:vals.meta?'ready':'preparing',...vals});};
    ref.on('value',f,e=>{if(active){active=false;setData({wk,status:e?.code==='PERMISSION_DENIED'?'denied':'error'});}});subs.push([ref,f]);
   }
   return()=>{active=false;subs.forEach(([r,f])=>r.off('value',f));};
  },[fb.ready,wk,retry]);
  if(fb.err)return {status:'error',retry:()=>setRetry(x=>x+1)};
  if(!fb.ready||data?.wk!==wk)return {status:'loading'};
  if(data.status!=='ready')return {...data,retry:()=>setRetry(x=>x+1)};
  const info=weeklyInfo(wk,data.dmg,data.meta);
  if(!Number.isFinite(info.hp)||!Number.isFinite(info.hpMax)||info.hpMax<=0)return {status:'error',retry:()=>setRetry(x=>x+1)};
  return {status:'ready',info,boss:bossForm(info.boss,info.revived)};
 }
 function Home({acct,onGo,onLogout}){
  const boss=useBoss(),fb=useFbReady(),st=useFbValue(fb.ready&&isReal(acct)?`accounts/${acct.key}/stats`:null);
  const profile=useRatingHistoryProfile(isReal(acct)?acct.key:null),L=levelOf((isReal(acct)?st:loadGuest())?.exp||0);
  const [panel,setPanel]=useState(null),dialog=useRef(null),[muted,setMuted]=useGameMute(),skinAccount=useRef(null);
  useEffect(()=>{if(st?.skin&&isReal(acct)&&skinAccount.current!==acct.key){skinAccount.current=acct.key;syncSkin(st.skin)}},[st,acct.key]);
  useEffect(()=>{if(panel==='menu'||panel==='settings')dialog.current?.showModal();else dialog.current?.close();},[panel]);
  const go=key=>{setPanel(null);onGo(key)};
  const nav=[['home','ホーム'],['online','オンライン対戦'],['solo','ソロモード'],['daily','デイリーミッション'],['rank','ランキング'],['help','あそびかた']];
  const navButton=(key,label)=><button key={key} className={'nav-item '+(key==='home'?'selected':'')} aria-current={key==='home'?'page':undefined} onClick={()=>go(key)}><Icon name={key}/><span>{label}</span><i aria-hidden="true"/></button>;
  const brand=<><img src="ui-next/logo-official.jpg" alt="FACTOR × FACTOR" width="1280" height="640"/></>;
  const hp=boss.info?Math.max(0,boss.info.hp):null,max=boss.info?.hpMax,pct=max?Math.min(100,hp/max*100):0;
  const statusText={loading:'HP情報を読み込み中…',preparing:'次のボスを準備中',error:'HP情報を取得できません',denied:'HP情報を取得できません（権限不足）'}[boss.status];
  return <><link rel="stylesheet" href="ui-next/home.css"/><div className="next-home" data-next-home>
   {acct&&<LoginBonus acct={acct}/>}
   <div className="app-shell"><aside className="sidebar"><button className="brand-slot" onClick={()=>go('home')} aria-label="ホームへ">{brand}</button><div className="side-divider"/><nav aria-label="PCメインメニュー">{nav.map(([k,n])=>navButton(k,n))}</nav><div className="sidebar-account"><Icon name="account"/><button onClick={()=>setPanel('profile')}>{acct.name}<small>Lv.{L.lv}</small></button></div></aside>
   <div className="page-shell"><header className="mobile-top"><button className="mobile-brand" onClick={()=>go('home')} aria-label="ホームへ">{brand}</button><div className="header-tools"><button aria-label={muted?'音声をオン':'音声をオフ'} onClick={()=>setMuted(!muted)}><Icon name="sound"/></button><button aria-label="設定" onClick={()=>setPanel('settings')}><Icon name="settings"/></button></div></header>
   <header className="page-header"><h1>ホーム</h1><button className="pc-settings" onClick={()=>setPanel('settings')} aria-label="設定"><Icon name="settings"/></button></header>
   <div className="account-row"><button className="account-main" onClick={()=>setPanel('profile')}><span className="avatar"><Icon name="account"/></span><span><small>{nickOf(st?.nick)?.label||'装備中の称号なし'}</small><strong>{acct.name}</strong><span className="level">Lv. <b>{L.lv}</b><span className="xp"><i style={{width:`${L.cur/L.need*100}%`}}/></span></span></span></button><div className="ratings">{['easy','normal'].map(d=>{const r=RatingDisplay.current(profile,st,d);return <div key={d}><small>{d==='easy'?'イージー':'ノーマル'}</small><strong>{isReal(acct)?RatingDisplay.format(r.value):'―'}</strong></div>})}</div><button className="account-link" onClick={()=>setPanel('profile')}>成績確認 <Icon name="chevron"/></button></div>
   <main><div className="home-content"><div className="home-actions">{[['online','オンライン対戦',['すぐ遊ぶ・ルーム','ゴースト・レイド'],'対戦ロビーへ'],['solo','ソロモード',['イージー・ノーマル','ハード'],'難易度を選ぶ']].map(([k,n,desc,foot])=><button key={k} className={'action-card '+k} aria-label={k==='online'?'オンライン対戦・CPU練習':undefined} onClick={()=>go(k)}><span className="action-icon"><Icon name={k}/></span><span className="surface-lines"/><span className="action-text"><strong>{n}</strong><small>{desc.map(t=><span key={t}>{t}</span>)}</small></span><span className="action-foot">{foot}<Icon name="chevron"/></span></button>)}</div>
   <section className="boss-stage" aria-label="今週のボス"><div className="boss-label"><span className="status-dot"/>今週のボス</div><div className="boss-art"><div className="boss-orbit"/>{boss.boss&&<img key={boss.boss.id} src={suriImg(boss.boss.id)} alt={boss.boss.name} width="512" height="512" onError={e=>{e.currentTarget.hidden=true}}/>}</div>
   <div className="boss-hp" aria-live="polite">{statusText?<p role={['error','denied'].includes(boss.status)?'alert':'status'}>{statusText}{boss.retry&&['error','denied'].includes(boss.status)&&<button onClick={boss.retry}>再試行</button>}</p>:<><div className="hp-numbers"><span>HP <b>{hp.toLocaleString('ja-JP')}</b> / {max.toLocaleString('ja-JP')}</span><strong>{boss.info.dead?'討伐済み':`${pct.toFixed(1)}%`}</strong></div><div className="hp-track" role="progressbar" aria-label="今週のボスの残りHP" aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp}><i style={{width:`${pct}%`}}/></div></>}</div>
   <div className="boss-details"><h2>{boss.boss?.name||'今週のボス'}</h2><button className="small-button" aria-label="今週のボスに挑む" onClick={()=>go('boss')}>ボスに挑む <span aria-hidden="true">→</span></button></div></section></div>
   <div className="home-support"><button className="mission-strip" onClick={()=>go('daily')}><Icon name="daily"/><span><strong>デイリーミッション</strong><small>今日のミッション・デイリーチャレンジ</small></span><Icon name="chevron"/></button>{[['rank','ランキング'],['help','あそびかた']].map(([k,n])=><button className="support-link" key={k} onClick={()=>go(k)}><Icon name={k}/><strong>{n}</strong><Icon name="chevron"/></button>)}</div></main>
   <footer className="page-footer"><span>FACTOR × FACTOR</span><span>先生専用機能は権限確認後に表示</span></footer></div></div>
   <nav className="bottom-nav" aria-label="スマホメインメニュー">{[['home','ホーム'],['online','対戦'],['solo','ソロ'],['rank','順位']].map(([k,n])=>navButton(k,n))}<button className="nav-item" aria-label="メニューを開く" aria-expanded={panel==='menu'} onClick={()=>setPanel('menu')}><Icon name="more"/><span>メニュー</span></button></nav>
   <dialog ref={dialog} className="home-menu" aria-label={panel==='settings'?'設定':'メインメニュー'} onCancel={()=>setPanel(null)}><div className="sheet-title"><h2>{panel==='settings'?'設定':'メニュー'}</h2><button onClick={()=>setPanel(null)} aria-label="閉じる">×</button></div>{panel==='settings'?<nav><button onClick={()=>setMuted(!muted)}>音声：{muted?'オフ':'オン'}</button><button onClick={()=>setPanel('wardrobe')}>きせかえ</button><button onClick={onLogout}>{isReal(acct)?'ログアウト':'登録・ログイン'}</button></nav>:<nav>{nav.map(([k,n])=>navButton(k,n))}<button className="nav-item" onClick={()=>go('learn')}>学びの部屋</button></nav>}</dialog>
   </div>{panel==='profile'&&<PlayerProfile name={acct.name} st={st||loadGuest()||{}} nameOf={{}} me acctKey={isReal(acct)?acct.key:null} onClose={()=>setPanel(null)}/>}{panel==='wardrobe'&&<Wardrobe acct={acct} st={st||loadGuest()} exp={(isReal(acct)?st:loadGuest())?.exp||0} onClose={()=>setPanel(null)}/>}</>;
 }
 return Home;
};
