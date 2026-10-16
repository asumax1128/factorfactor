const catalog=require('./title-catalog-next.json'),compat=require('./title-compat-next.cjs');
export function TitleCinematic({muted=false,reducedMotion=false,onFinish=()=>{}}){
 const [sound,setSound]=React.useState(!muted),finished=React.useRef(false);
 const audio=React.useRef(null),done=()=>{if(finished.current)return;finished.current=true;onFinish()};
 React.useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;audio.current?.close().catch(()=>{})}},[]);
 React.useEffect(()=>{if(!sound){audio.current?.close().catch(()=>{});audio.current=null;return}try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();audio.current=c;const gain=c.createGain();gain.gain.value=.035;gain.connect(c.destination);for(const[f,i]of[[220,0],[330,1],[440,2],[660,3]]){const o=c.createOscillator();o.type='sine';o.frequency.value=f;o.connect(gain);o.start(c.currentTime+i*.2);o.stop(c.currentTime+i*.2+.3)}}catch(e){}return()=>{audio.current?.close().catch(()=>{});audio.current=null}},[sound]);
 const ref=React.useRef(null);React.useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);
 return <dialog ref={ref} className={'next-title-cinematic '+(reducedMotion?'reduced':'')} aria-label="称号獲得演出" onCancel={e=>{e.preventDefault();done()}}><div className="next-title-particles" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--i':i}}/>)}</div><div className="next-title-emblem" aria-hidden="true">×</div><div className="next-title-slash" aria-hidden="true"/><div className="next-title-reveal"><p>特別称号を獲得</p><img src="ui-next/logo-official.png" alt="FACTOR×FACTOR"/><strong>FACTOR×FACTOR</strong></div><div className="next-title-controls"><button onClick={()=>setSound(x=>!x)} aria-pressed={sound}>音声{sound?'ON':'OFF'}</button><button autoFocus onClick={done}>{reducedMotion?'閉じる':'スキップ・閉じる'}</button></div></dialog>;
}
export function TitleInventory({earnedIds=[],flags=[],equipped,accountKey,muted=true,presentationStore=null}){
 const state=compat.read({legacyEarned:earnedIds,flags,equipped}),[filter,setFilter]=React.useState('all'),[scene,setScene]=React.useState(false);
 const [presentationError,setPresentationError]=React.useState('');
 const presentationKey=accountKey?'fxf_title_presentation_v1:'+accountKey:null;
 React.useEffect(()=>{if(!state.hiddenOwned||!presentationKey)return;let active=true;
  if(presentationStore){presentationStore.seen().then(seen=>{if(active&&!seen)setScene(true)}).catch(()=>{if(active)setPresentationError('演出の閲覧状況を取得できません。再視聴は利用できます。')});}
  else {let seen=false;try{seen=localStorage.getItem(presentationKey)==='seen'}catch(e){}if(!seen)setScene(true);}
  return()=>{active=false};
 },[state.hiddenOwned,presentationKey,presentationStore]);
 const closeScene=()=>{setScene(false);if(presentationStore){presentationStore.acknowledge().then(()=>setPresentationError('')).catch(()=>setPresentationError('閲覧状況を保存できませんでした。再視聴後に再試行します。'));return;}if(presentationKey)try{localStorage.setItem(presentationKey,'seen')}catch(e){}};

 return <section className="next-title-inventory" data-title-inventory><h3>称号一覧</h3><p>通常称号 {state.normal.length} / 100</p><div role="group" aria-label="称号の絞り込み">{[['all','すべて'],['earned','取得済み'],['locked','未取得']].map(([id,label])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div><ol>{catalog.titles.filter(t=>filter==='all'||(filter==='earned')===!!state.earned[t.id]).map(t=>{const e=state.earned[t.id];return <li key={t.id} data-title-id={t.id}><header><span>No.{t.number}</span><strong>{t.name}</strong><span aria-label={`${t.stars}つ星`}>{'★'.repeat(t.stars)}</span></header><p>{t.stars<=3?t.condition:'？？？'}</p><small>{e?'取得済み':'未取得'}{equipped===t.id?' ・ 装備中':''}{e?.at?` ・ ${new Date(e.at).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'})}`:e?' ・ 取得日未記録':''}</small></li>})}</ol>{state.hiddenOwned&&<section className="next-title-special"><h4>FACTOR×FACTOR</h4><p>特別称号・取得済み</p><button onClick={()=>setScene(true)}>獲得演出を再視聴</button></section>}<p>未公開の取得条件は？？？と表示します。</p>{presentationError&&state.hiddenOwned&&<p role="alert">{presentationError}</p>}{scene&&state.hiddenOwned&&<TitleCinematic muted={muted} reducedMotion={window.matchMedia?.('(prefers-reduced-motion: reduce)').matches} onFinish={closeScene}/>}</section>;
}
