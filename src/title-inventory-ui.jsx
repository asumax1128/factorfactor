const catalog=require('./title-catalog-next.json'),compat=require('./title-compat-next.cjs');
export function TitleCinematic({muted=false,reducedMotion=false,onFinish=()=>{}}){
 const [sound,setSound]=React.useState(!muted),finished=React.useRef(false);
 const audio=React.useRef(null),done=()=>{if(finished.current)return;finished.current=true;onFinish()};
 React.useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;audio.current?.close().catch(()=>{})}},[]);
 React.useEffect(()=>{if(!sound){audio.current?.close().catch(()=>{});audio.current=null;return}try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();audio.current=c;const gain=c.createGain();gain.gain.value=.035;gain.connect(c.destination);for(const[f,i]of[[220,0],[330,1],[440,2],[660,3]]){const o=c.createOscillator();o.type='sine';o.frequency.value=f;o.connect(gain);o.start(c.currentTime+i*.2);o.stop(c.currentTime+i*.2+.3)}}catch(e){}return()=>{audio.current?.close().catch(()=>{});audio.current=null}},[sound]);
 const ref=React.useRef(null);React.useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close()},[]);
 return <dialog ref={ref} className={'next-title-cinematic '+(reducedMotion?'reduced':'')} aria-label="称号獲得演出" onCancel={e=>{e.preventDefault();done()}}><div className="next-title-particles" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--i':i}}/>)}</div><div className="next-title-emblem" aria-hidden="true">×</div><div className="next-title-slash" aria-hidden="true"/><div className="next-title-reveal"><p>特別称号を獲得</p><img src="ui-next/logo-official.png" alt="FACTOR×FACTOR"/><strong>FACTOR×FACTOR</strong></div><div className="next-title-controls"><button onClick={()=>setSound(x=>!x)} aria-pressed={sound}>音声{sound?'ON':'OFF'}</button><button autoFocus onClick={done}>{reducedMotion?'閉じる':'スキップ・閉じる'}</button></div></dialog>;
}
export function TitleEquipControl({equip,id,name,earned}){
 const route=equip.routeOf(id,earned),on=equip.isEquipped(id),st=equip.status?.id===id?equip.status:null,reason=equip.reasonOf(id,earned);
 const busy=equip.busy,compat=equip.compatId===id;
 return <div className="next-title-equip" data-title-equip={id} data-equip-state={on?'on':route?'off':'disabled'}>
  {on&&<span className="next-title-equipped" data-equipped>✔ 装備中</span>}
  {route&&!on&&<button type="button" className="next-title-equip-btn" disabled={busy} onClick={()=>equip.onEquip(id)} aria-label={name+'を装備する'}>装備する</button>}
  {route&&on&&<button type="button" className="next-title-equip-btn off" disabled={busy} onClick={()=>equip.onUnequip(id)} aria-label={name+'をはずす'}>はずす</button>}
  {!route&&<button type="button" className="next-title-equip-btn" disabled aria-label={name+'を装備する'} aria-describedby={'equip-why-'+id}>装備する</button>}
  {reason&&<span className="next-title-equip-why" id={'equip-why-'+id}>{reason}</span>}
  {compat&&<span className="next-title-equip-why" data-rating-title-note>従来のランキング称号を表示中です。はずす、または別の称号を装備すると、統一の装備枠の設定に切り替わります。</span>}
  {st&&<span className={'next-title-equip-status '+st.state} role={st.state==='failed'?'alert':'status'} data-equip-status={st.state}>{st.state==='saving'?(st.slow?'保存中…（通信が遅れています。そのままお待ちください）':'保存中…'):st.message}</span>}
 </div>
}
// Summary of the current equip slot. Also the only place that can clear an equipped legacy title that is not in the 100-title list.
export function TitleEquipCurrent({equip}){
 const cur=equip.current,listed=id=>id===catalog.hidden.id||catalog.titles.some(t=>t.id===id);
 const stx=equip.status&&!listed(equip.status.id)?equip.status:null;   // status of a title that has no row in the list (legacy-only id)
 const statusEl=stx&&<span className={'next-title-equip-status '+stx.state} role={stx.state==='failed'?'alert':'status'} data-equip-status={stx.state}>{stx.state==='saving'?'保存中…':stx.message}</span>;
 if(!cur)return statusEl?<div className="next-title-equip-current" data-equip-current-result>{statusEl}</div>:null;
 return <div className="next-title-equip-current" data-equip-current={cur.id}>
  <span>現在の装備：〈{cur.label}〉{!cur.inCatalog&&cur.label!=='表示できない称号'&&'（従来の称号）'}</span>
  <button type="button" className="next-title-equip-btn off" disabled={equip.busy||!equip.real} onClick={()=>equip.onUnequip(cur.id)} aria-label="装備中の称号をはずす">はずす</button>
  {statusEl}
 </div>
}
// ---- 称号・実績：一覧（3列〜のグリッド）と詳細（スマホは下から出るシート、広い画面は中央）。通常100＋隠し1（取得後だけ分母にも加わる）-----------------------
// 未取得は固有の絵文字を出さず 🔒。名称・★は常に見せ、条件は★1〜3と取得済みだけ（★4〜5の未取得は「？？？」）。隠し称号は取得するまで存在も見せない。
const RARITY=['','ふつう','まあまあ','めずらしい','レア','とくべつ'];
// ★4・★5の条件公開：前段階（同じ指標でしきい値が上がる称号）を取得すると次の条件を公開する。ここに無い★4・★5は独立型（取得まで？？？）。
export const TITLE_PREREQ={streak30:['streak10'],streak50:['streak30'],giant250:['giant'],master1700:['master1600'],master1900:['master1700'],easy_master:['easy_adept'],normal_master:['normal_adept'],dual_master:['easy_master','normal_master'],perfect300:['perfect100'],perfect500:['perfect300'],perfect1000:['perfect500'],combo30:['combo20'],miracle:['clutch'],alllv:['lv9'],tour3:['tour1'],tour10:['tour3'],wkace5:['wkace'],wkone2:['wkone'],wkst10:['wkst5'],wkk10:['wkk5'],wkdex6:['wkdex3'],cancel2000:['cancel500'],dual50:['dual'],nomiss10:['nomiss'],bounty10:['bounty1'],daily30:['daily7'],ghost_up2:['ghost_up1']};
const condVisible=(t,earnedMap)=>t.stars<=3||!!earnedMap[t.id]||(TITLE_PREREQ[t.id]||[]).every(x=>!!earnedMap[x])&&!!TITLE_PREREQ[t.id];
function TitleDetail({t,earnedMap={},earned,equipped,iconOf,equip,readOnly,onClose,onScene,hidden}){
 const ref=React.useRef(null);
 React.useEffect(()=>{const d=ref.current;if(d&&!d.open)d.showModal();return()=>{try{d&&d.open&&d.close()}catch(e){}}},[]);
 const isHidden=!!hidden,name=isHidden?catalog.hidden.name:t.name,stars=isHidden?5:t.stars,id=isHidden?catalog.hidden.id:t.id;
 const cond=isHidden?(earned?`通常称号のうち ${catalog.hidden.requiredDistinctFiveStar} 種類の★5を集める`:''):(condVisible(t,earnedMap)?t.condition:'？？？');
 return <dialog ref={ref} className="tc-sheet" data-title-detail={id} aria-label={name+'の詳細'} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===ref.current)onClose()}}>
  <div className="tc-sheet-body">
   <div className="tc-sheet-icon" aria-hidden="true" data-rarity={stars}>{earned?iconOf(id):'🔒'}</div>
   <h4>{name}</h4>
   <p className="tc-sheet-stars" aria-label={`${stars}つ星`}><span data-rarity={stars}>{'★'.repeat(stars)}</span> <small>{RARITY[stars]}</small></p>
   <p className="tc-sheet-state" data-state={earned?'earned':'locked'}>{earned?(earned.at?`取得済み ・ ${new Date(earned.at).toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'})+(earned.dateWasUnknown?'（確認日・取得日不明）':'')}`:'取得済み ・ 取得日未記録'):'未取得'}{equipped===id?' ・ 装備中':''}</p>
   <dl><dt>取得条件</dt><dd>{cond||'？？？'}</dd>{!isHidden&&<><dt>分類</dt><dd>{t.category}</dd></>}</dl>
   {!readOnly&&equip&&earned&&<TitleEquipControl equip={equip} id={id} name={name} earned={true}/>}
   {!readOnly&&equip&&!earned&&<p className="tc-sheet-note">未取得のため装備できません</p>}
   {isHidden&&earned&&<button type="button" className="tc-sheet-sub" onClick={onScene}>獲得演出を再視聴</button>}
   <button type="button" className="tc-sheet-close" onClick={onClose}>とじる</button>
  </div>
 </dialog>
}
export function TitleInventory({earnedIds=[],flags=[],equipped,accountKey,muted=true,presentationStore=null,equip=null,readOnly=false,iconOf=()=>catalog.hidden.icon||'🏅'}){
 const state=compat.read({legacyEarned:earnedIds,flags,equipped,deriveHidden:true}),[filter,setFilter]=React.useState('all'),[scene,setScene]=React.useState(false),[open,setOpen]=React.useState(null);
 const [presentationError,setPresentationError]=React.useState('');
 const presentationKey=accountKey?'fxf_title_presentation_v1:'+accountKey:null;
 React.useEffect(()=>{if(readOnly||!state.hiddenOwned||!presentationKey)return;let active=true;
  if(presentationStore){(presentationStore.claimAutomatic?presentationStore.claimAutomatic():presentationStore.seen().then(seen=>!seen)).then(claimed=>{if(active&&claimed)setScene(true)}).catch(()=>{if(active)setPresentationError('演出の閲覧状況を取得できません。再視聴は利用できます。')});}
  else {let seen=false;try{seen=localStorage.getItem(presentationKey)==='seen'}catch(e){}if(!seen)setScene(true);}
  return()=>{active=false};
 },[readOnly,state.hiddenOwned,presentationKey,presentationStore]);
 const closeScene=()=>{setScene(false);if(presentationStore){presentationStore.acknowledge().then(()=>setPresentationError('')).catch(()=>setPresentationError('閲覧状況を保存できませんでした。再視聴後に再試行します。'));return;}if(presentationKey)try{localStorage.setItem(presentationKey,'seen')}catch(e){}};
 const total=100+(state.hiddenOwned?1:0),got=state.normal.length+(state.hiddenOwned?1:0),pct=Math.round(got*100/total);
 const shown=catalog.titles.filter(t=>filter==='all'||(filter==='earned')===!!state.earned[t.id]);
 const openT=open==='__hidden'?null:catalog.titles.find(t=>t.id===open);
 const card=(t,earned,hidden)=>{const id=hidden?catalog.hidden.id:t.id,name=hidden?catalog.hidden.name:t.name,stars=hidden?5:t.stars;
  return <li key={id}><button type="button" className="tc-card" data-title-id={id} data-state={earned?'earned':'locked'} data-rarity={stars} data-equipped={equipped===id?'true':'false'} aria-label={`${name}、${stars}つ星、${earned?'取得済み':'未取得'}${equipped===id?'、装備中':''}`} onClick={()=>setOpen(hidden?'__hidden':id)}>
   {equipped===id&&<span className="tc-ribbon" data-equipped>装備中</span>}
   <span className="tc-icon" aria-hidden="true">{earned?iconOf(id):'🔒'}</span>
   <strong className="tc-name">{name}</strong>
   <span className="tc-stars" aria-hidden="true">{'★'.repeat(stars)}</span>
  </button></li>};
 return <section className="next-title-inventory tc" data-title-inventory>
  <header className="tc-head"><h3>称号・実績</h3><p className="tc-count" data-title-count><b>{got}</b> / {total}<span>　達成率 {pct}%</span></p><div className="tc-bar" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={got} aria-label="称号の獲得数"><i style={{width:pct+'%'}}/></div></header>
  {!readOnly&&equip&&<TitleEquipCurrent equip={equip}/>}
  <div role="group" aria-label="称号の絞り込み" className="tc-filter">{[['all','すべて'],['earned','取得済み'],['locked','未取得']].map(([id,label])=><button type="button" key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div>
  <ol className="tc-grid">{shown.map(t=>card(t,state.earned[t.id],false))}{state.hiddenOwned&&filter!=='locked'&&card(null,true,true)}</ol>
  <p className="tc-note">★4〜5の未取得の条件は「？？？」と表示します。</p>
  {presentationError&&state.hiddenOwned&&<p role="alert">{presentationError}</p>}
  {open&&(open==='__hidden'?state.hiddenOwned:openT)&&<TitleDetail t={openT} earnedMap={state.earned} hidden={open==='__hidden'} earned={open==='__hidden'?state.earned[catalog.hidden.id]:state.earned[open]} equipped={equipped} iconOf={iconOf} equip={equip} readOnly={readOnly} onClose={()=>setOpen(null)} onScene={()=>{setOpen(null);setScene(true)}}/>}
  {scene&&state.hiddenOwned&&<TitleCinematic muted={muted} reducedMotion={window.matchMedia?.('(prefers-reduced-motion: reduce)').matches} onFinish={closeScene}/>}
 </section>;
}
