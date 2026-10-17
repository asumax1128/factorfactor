import {TitleInventory} from './title-inventory-ui.jsx';
import {Panel,Stat,MetricGrid,BackButton} from './next-ui.jsx';
const model=require('./profile-read.cjs');
const titles=require('./title-catalog-next.json');
const TitleClient=require('./title-client-next.cjs');
const TitleEquip=require('./title-equip-next.cjs');
const TitleCompat=require('./title-compat-next.cjs');
export function createProfile(H){
 const {RatingDisplay,RatingHistory,levelOf,isReal,useDailyTitles,useFbValue,useFbReady,weekKey,now,nickOf,badgesOf,activeAchievements,skinCatalog}=H;
 const integer=n=>n===null||n===undefined?'未記録':n.toLocaleString('ja-JP');
 function Record({label,value}){return <Panel title={label}><MetricGrid><Stat label="対戦数" value={integer(value.games)}/><Stat label="勝利" value={integer(value.w)}/><Stat label="敗北" value={integer(value.l)}/><Stat label="引き分け" value={integer(value.d)}/><Stat label="勝率" value={value.winRate===null?'未記録':value.winRate.toFixed(1)+'%'}/></MetricGrid></Panel>}
 return function Profile({acct,stats,profile,onBack,onLegacy,onWardrobe}){
  const [muted]=H.useGameMute();
  const fb=useFbReady(),real=isReal(acct),daily=useDailyTitles(real?acct.key:null);
  const mine=useFbValue(fb.ready&&real?`raidw/${weekKey(now())}/dmg/${acct.key}`:null);
  const authority=fb.ready&&real&&window.NextAuthority?.enabled(H.FB.db,window.location),authorityAwards=useFbValue(authority?`titleNextV1/awards/${acct.key}`:null),authoritySnapshot=useFbValue(authority?`titleNextV1/snapshots/${acct.key}`:null);
  const data=model.read(stats,profile),L=data.exp===null?null:levelOf(data.exp);
  const [tab,setTab]=React.useState('summary');
  // Ver.6.0 client-judged titles: freeze legacy once, then add proven titles under the player's own record (add-only).
  const [clientTitles,setClientTitles]=React.useState(null),[titleSaveFailed,setTitleSaveFailed]=React.useState(false);
  React.useEffect(()=>{if(!real||!fb.ready||authority||!H.FB.db)return;let live=true,timer=0;
   const run=(retry)=>TitleClient.sync({db:H.FB.db,account:acct,computeBadgeIds:st=>badgesOf(st).map(b=>b.id)}).then(r=>{if(!live)return;
    if(r&&(r.snapshot||Object.keys(r.awards||{}).length))setClientTitles(r);
    setTitleSaveFailed(r?.status==='failed');                      // normal and deliberately deferred runs show nothing
    if(r?.status==='deferred'&&r.reason==='OFFLINE'&&retry)timer=setTimeout(()=>run(false),4000);
   }).catch(()=>{if(live)setTitleSaveFailed(true)});
   run(true);
   return()=>{live=false;clearTimeout(timer)};
  },[real,acct.key,fb.ready,authority,profile?.easy?.maxRating,profile?.normal?.maxRating]);
  const presentationStore=React.useMemo(()=>real&&window.TitlePresentationNext?.enabled(H.FB.db,window.location)?window.TitlePresentationNext.create({db:H.FB.db,account:acct}):null,[real,acct.key,fb.ready]);
  const earned=new Map();
  const visible=new Set(activeAchievements().map(b=>b.id));
  // Same evaluation as the old modal: the daily-king achievements read st.dailyTitles (dailyV2/titles), so pass it in.
  for(const b of badgesOf({...(stats||{}),dailyTitles:daily}))if(visible.has(b.id))earned.set(b.id,b.label);
  for(const flags of [profile?.badges,daily])for(const [id,value]of Object.entries(flags||{}))if(value===true)earned.set(id,titles.titles.find(t=>t.id===id)?.name||nickOf(id)?.label||id);
  for(const [id]of earned){const t=titles.titles.find(t=>t.id===id);if(t)earned.set(id,t.name)}
  // Single equip slot (stats/nick). The inventory receives exactly these inputs, so "earned" here = what the list shows as 取得済み.
  const invIds=authority?[]:[...earned.keys()],invFlags=authority?[Object.fromEntries(Object.entries(authoritySnapshot?.earned||{}).map(([id,r])=>[id,{earned:true,at:r.at}])),authorityAwards]:[profile?.badges,...(clientTitles?[Object.fromEntries(Object.entries(clientTitles.snapshot?.earned||{}).map(([id,r])=>[id,{earned:true,at:r.at}])),clientTitles.awards]:[])];
  const memEarned=new Set(Object.keys(TitleCompat.read({legacyEarned:invIds,flags:invFlags}).earned));
  // Equip state: shown only after the existing save succeeds (never optimistic); re-synced from the live record.
  const [eqNick,setEqNick]=React.useState(stats?.nick),[eqStatus,setEqStatus]=React.useState(null),eqBusy=React.useRef(false),eqSlow=React.useRef(0),memRef=React.useRef(memEarned),[,setEqBusyTick]=React.useState(0);
  memRef.current=memEarned;
  // legacy ranking title (profile.title): read-only here, never written or cleared by this screen. Display rule shared with HOME / ranking.
  const titleValid=id=>!!(nickOf(id)||window.TitleLabelsNext?.of(id)),disp=window.TitleDisplayNext.resolve({nick:eqNick,title:profile?.title},{valid:titleValid}),shown=window.TitleDisplayNext.shownId(disp);
  React.useEffect(()=>{if(!eqBusy.current)setEqNick(stats?.nick)},[stats?.nick]);
  React.useEffect(()=>()=>clearTimeout(eqSlow.current),[]);
  const canEquip=!!(real&&H.equipNick);
  const routeOf=(id,isEarned)=>canEquip?TitleEquip.route(id,{earned:isEarned?new Set([id]):new Set()}):null;
  // Fresh read of every earned-proof source right before saving (same sources as the list).
  const freshEarned=async()=>{
   const db=H.FB.db,base='games/factor/',read=async path=>{try{return {ok:true,value:(await db.ref(base+path).get()).val()}}catch(e){return {ok:false}}};
   const [st,dl,pb,aw,sn]=await Promise.all([read('accounts/'+acct.key+'/stats'),read('dailyV2/titles/'+acct.key),read('onlineSparkV1/profiles/'+acct.key+'/badges'),read('titleNextV1/awards/'+acct.key),read('titleNextV1/snapshots/'+acct.key+'/earned')]);
   const ids=new Set();
   if(st.ok)for(const b of badgesOf({...(st.value||{}),dailyTitles:dl.ok?dl.value||{}:{}}))if(visible.has(b.id))ids.add(b.id);
   for(const r of [dl,pb])if(r.ok)for(const [id,v]of Object.entries(r.value||{}))if(v===true||v?.earned===true)ids.add(id);
   if(aw.ok)for(const [id,v]of Object.entries(aw.value||{}))if(v?.earned===true)ids.add(id);
   if(sn.ok)for(const id of Object.keys(sn.value||{}))ids.add(id);
   return {fresh:ids,complete:st.ok&&dl.ok&&pb.ok&&aw.ok&&sn.ok};
  };
  const doEquip=async(id,clear)=>{
   if(!canEquip||eqBusy.current||(!clear&&!memRef.current.has(id)))return;
   eqBusy.current=true;setEqStatus({id,state:'saving',slow:false});
   clearTimeout(eqSlow.current);eqSlow.current=setTimeout(()=>setEqStatus(s=>s&&s.id===id&&s.state==='saving'?{...s,slow:true}:s),TitleEquip.SLOW_MS);
   try{
    if(!clear){const f=await freshEarned();if(!TitleEquip.confirm(id,{fresh:f.fresh,complete:f.complete,memory:memRef.current}))throw Object.assign(new Error('NOT_EARNED'),{notEarned:true})}
    await H.equipNick(acct.key,clear?'':id);      // "" = explicitly unequipped (distinct from absent = legacy ranking title shown)
    setEqNick(clear?'':id);
    setEqStatus({id,state:'saved',message:clear?'称号をはずしました':'称号を装備しました'});
   }catch(e){
    setEqStatus({id,state:'failed',message:e&&e.notEarned?'取得状況を確認できなかったため装備しませんでした（装備は変更されていません）':'保存できませんでした。通信状態をご確認のうえ、もう一度お試しください（装備は変更されていません）'});
   }finally{eqBusy.current=false;clearTimeout(eqSlow.current);setEqBusyTick(x=>x+1)}
  };
  const labelOf=id=>titles.titles.find(t=>t.id===id)?.name||(window.TitleLabelsNext?.of(id)?.label)||nickOf(id)?.label||id;
  const equipUi=H.equipNick?{routeOf,isEquipped:id=>shown===id,status:eqStatus,busy:eqBusy.current,real,compatId:disp.state==='compat'?disp.id:null,
   current:shown?{id:shown,label:labelOf(shown),inCatalog:!!window.TitleLabelsNext?.of(shown)}:disp.state==='unresolved'?{id:eqNick,label:'表示できない称号',inCatalog:false}:null,
   reasonOf:(id,isEarned)=>TitleEquip.reason(id,{real,earned:isEarned,routeOf:routeOf(id,isEarned)}),
   onEquip:id=>doEquip(id,false),onUnequip:id=>doEquip(id,true)}:null;
  const equipped=[shown].filter(Boolean).map(id=>({id,name:labelOf(id)+(disp.state==='compat'?'（ランキング称号）':'')}));
  const skin=stats?.skin;
  return <main className="next-profile" data-next-profile>
   <div className="next-toolbar"><BackButton onClick={onBack}/><button className="small-button" onClick={onWardrobe}>きせかえ</button><button className="small-button" onClick={onLegacy}>称号の装備・詳細記録</button></div>
   {!real&&<p className="next-note">ゲストの経験値・装備はこの端末の記録です。オンライン戦績は記録されません。</p>}
   <Panel title={acct.name} aside={<span className="next-level">{L?`Lv.${L.lv}`:'レベル未記録'}</span>}>
    <div className="next-equipped">装備中称号：{equipped.length?equipped.map(x=><span key={x.id}>{x.name}</span>):'未設定'}</div>
    <MetricGrid><Stat label="累積EXP" value={integer(data.exp)}/><Stat label="次のレベル" value={L?`${L.cur} / ${L.need} EXP`:'未記録'}/><Stat label="歴代最高レート" value={real?RatingDisplay.format(RatingHistory.highest(profile,stats)):'―'} data-highest-rating/></MetricGrid>
   </Panel>
   <div className="next-profile-tabs" role="tablist" aria-label="成績の種類">{[['summary','概要'],['records','対戦記録'],['rewards','称号・装備']].map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} aria-controls={'profile-'+id} id={'profile-tab-'+id} onClick={()=>setTab(id)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...e.currentTarget.parentNode.querySelectorAll('[role=tab]')];const index=e.key==='Home'?0:e.key==='End'?tabs.length-1:(tabs.indexOf(e.currentTarget)+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;tabs[index].focus();tabs[index].click();}}}>{label}</button>)}</div>
   <div role="tabpanel" id={'profile-'+tab} aria-labelledby={'profile-tab-'+tab}>
   {tab==='summary'&&<>
    <div className="next-profile-columns">{['easy','normal'].map(d=>{const r=real?(profile===null&&d==='normal'?{value:null,note:'未記録'}:RatingDisplay.current(profile,stats,d)):{value:null,note:''};return <Panel key={d} title={d==='easy'?'イージー':'ノーマル'}><MetricGrid><Stat label="現在レーティング" value={RatingDisplay.format(r.value)} note={r.note}/><Stat label="歴代最高レーティング" value={real?RatingDisplay.format(RatingHistory.highest(profile,stats,[d])):'―'}/></MetricGrid></Panel>})}</div>
    <Panel title="保存済みの成績"><MetricGrid>{[['maxStreak','最高連勝'],['perfects','Perfect'],['comebacks','逆転勝ち'],['tourWins','大会優勝'],['bestMs','最速正解'],['maxCombo','最大コンボ']].map(([key,label])=><Stat key={key} label={label} value={key==='bestMs'&&data.metrics[key]!==null?(data.metrics[key]/1000).toFixed(2)+'秒':integer(data.metrics[key])}/>)}</MetricGrid><p className="next-note">各累積値は既存の保存記録です。保存世代の異なる対戦数を足し合わせません。</p></Panel>
    <Panel title="週間ボスの参加・貢献"><MetricGrid>{[['weeks','参加週数'],['kills','討伐貢献'],['best','過去最高ダメージ'],['maxStreak','最高連続参加週']].map(([key,label])=><Stat key={key} label={label} value={integer(data.weekly[key])}/>)}<Stat label="今週のダメージ" value={integer(model.number(mine?.d))}/><Stat label="今週の出撃記録" value={integer(model.number(mine?.s))} note="完走回数とは別の記録です"/></MetricGrid></Panel>
   </>}
   {tab==='records'&&<><p className="next-note">レーティング戦と従来の記録は、同じ試合を含む可能性があるため別々に表示します。</p><div className="next-profile-columns">{['easy','normal'].map(d=><Record key={d} label={(d==='easy'?'イージー':'ノーマル')+'・レーティング対戦'} value={data.rated[d]}/>)}</div><Record label="従来の対戦記録（保存済み通算）" value={data.legacy}/><div className="next-profile-columns">{['A','B','C'].map(m=><Record key={m} label={m+'方式（従来の保存記録）'} value={data.modes[m]}/>)}</div><p className="next-note">B方式は共有するstats.Bを一度だけ表示しています。欠損した勝敗は0と仮定しません。</p><div className="next-profile-columns">{['easy','normal'].map(d=><Record key={d} label={(d==='easy'?'イージー':'ノーマル')+'・ゴースト／BOT記録'} value={data.ghosts[d]}/>)}</div></>}
   {tab==='rewards'&&<><Panel title="取得称号">{titleSaveFailed&&<p role="status" className="next-note" data-title-save-failed>新称号の保存を確認できませんでした。通信状態をご確認ください。</p>}<TitleInventory presentationStore={presentationStore} accountKey={acct.key} muted={muted} earnedIds={invIds} flags={invFlags} equipped={shown} equip={equipUi}/></Panel><Panel title="きせかえ装備"><MetricGrid>{[['tile','タイル'],['bg','背景'],['fx','エフェクト']].map(([key,label])=>{const id=skin?.[key],item=skinCatalog[key].find(x=>x.id===id);return <Stat key={key} label={label} value={id?(item?.name||id):'未記録'}/>})}</MetricGrid></Panel></>}
   </div>
  </main>;
 }
}
