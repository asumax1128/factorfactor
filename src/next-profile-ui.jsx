import {TitleInventory} from './title-inventory-ui.jsx';
import {Panel,Stat,MetricGrid,BackButton} from './next-ui.jsx';
const model=require('./profile-read.cjs');
const titles=require('./title-catalog-next.json');
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
  const presentationStore=React.useMemo(()=>real&&window.TitlePresentationNext?.enabled(H.FB.db,window.location)?window.TitlePresentationNext.create({db:H.FB.db,account:acct}):null,[real,acct.key,fb.ready]);
  const earned=new Map();
  const visible=new Set(activeAchievements().map(b=>b.id));
  for(const b of badgesOf(stats||{}))if(visible.has(b.id))earned.set(b.id,b.label);
  for(const flags of [profile?.badges,daily])for(const [id,value]of Object.entries(flags||{}))if(value===true)earned.set(id,titles.titles.find(t=>t.id===id)?.name||nickOf(id)?.label||id);
  for(const [id]of earned){const t=titles.titles.find(t=>t.id===id);if(t)earned.set(id,t.name)}
  const equipped=[stats?.nick,profile?.title].filter(Boolean).map(id=>({id,name:titles.titles.find(t=>t.id===id)?.name||nickOf(id)?.label||id}));
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
   {tab==='rewards'&&<><Panel title="取得称号"><TitleInventory presentationStore={presentationStore} accountKey={acct.key} muted={muted} earnedIds={authority?[]:[...earned.keys()]} flags={authority?[Object.fromEntries(Object.entries(authoritySnapshot?.earned||{}).map(([id,r])=>[id,{earned:true,at:r.at}])),authorityAwards]:[profile?.badges]} equipped={stats?.nick}/></Panel><Panel title="きせかえ装備"><MetricGrid>{[['tile','タイル'],['bg','背景'],['fx','エフェクト']].map(([key,label])=>{const id=skin?.[key],item=skinCatalog[key].find(x=>x.id===id);return <Stat key={key} label={label} value={id?(item?.name||id):'未記録'}/>})}</MetricGrid></Panel></>}
   </div>
  </main>;
 }
}
