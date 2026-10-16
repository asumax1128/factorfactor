import {RankingHead,Segmented,ListState,RankRow,RankList} from './ranking-kit.jsx';
// Solo ranking (みんなのベスト / みんなの総得点 / この端末 TOP3). Data, ranks (withRanks), TOP20 and the GAS source
// are produced by the existing game code and passed in untouched; this component only presents them.
export function SoloRanking({gas,netStatus,netError,best,total,local,storageOk,onReload,diffs,defaultDiff,tab,onTab,selfName}){
 const [diff,setDiff]=React.useState(defaultDiff||'normal');
 const tabs=[...(gas?[['best','みんなのベスト'],['total','みんなの総得点']]:[]),['local','この端末 TOP3']];
 const cfg=diffs[diff]||{};
 const net=tab==='best'?best:total;
 const rows=(net?.[diff]||[]);
 const status=tab==='local'?'ok':(netStatus==='loading'||netStatus==='idle')?'loading':netStatus==='error'?'error':rows.length?'ok':'empty';
 const self=name=>!!selfName&&name===selfName;
 return <div className="rk-solo" data-ranking="solo">
  <RankingHead title="ソロランキング" note={tab==='best'?'みんなのランキング（全期間）':tab==='total'?'これまでの全プレイの合計点数ランキング（プレイ回数・平均点つき）':'この端末の記録'}/>
  <Segmented label="ランキングの種類" items={tabs} value={tab} onChange={onTab}/>
  {tab!=='local'&&<div className="rk-bar"><Segmented label="難易度" items={Object.entries(diffs).map(([id,c])=>[id,c.label])} value={diff} onChange={setDiff}/><button type="button" className="rk-reload" onClick={onReload}>↻ 更新</button></div>}
  {tab!=='local'&&<ListState status={status} detail={netError} message={status==='empty'?(tab==='best'?'まだ記録がありません。全国1位を目指そう！':'まだ記録がありません。プレイして最初の1位を目指そう！'):status==='error'?'読み込みに失敗しました。通信環境を確認して「↻ 更新」を押してね。':undefined}/>}
  {tab==='best'&&status==='ok'&&<RankList label={cfg.label+' TOP20'}>{rows.map((r,i)=><RankRow key={i} rank={r.rank} name={r.name} value={r.score} unit="点" sub={r.caught+'組'} self={self(r.name)}/>)}</RankList>}
  {tab==='total'&&status==='ok'&&<RankList label={cfg.label+' 総合TOP20'}>{rows.map((r,i)=><RankRow key={i} rank={r.rank} name={r.name} value={r.totalScore} unit="点" sub={r.playCount+'回プレイ・平均'+r.avgScore+'点・計'+r.totalCaught+'組'} self={self(r.name)}/>)}</RankList>}
  {tab!=='local'&&status==='ok'&&<p className="rk-foot">{cfg.label} TOP20</p>}
  {tab==='local'&&<>
   {!storageOk&&<p className="rk-warn">⚠️ この環境ではランキングを保存できません（ブラウザの設定でサイトデータの保存がブロックされています）</p>}
   {local.length===0?<ListState status="empty" message="まだ記録がありません。最初の1位を目指そう！"/>
    :<RankList label="この端末 TOP3">{local.map((r,i)=><RankRow key={i} rank={r.rank} name={r.name} value={r.score} unit="点" sub={(diffs[r.difficulty]?.label||'')+'・'+r.caught+'組'} self={self(r.name)}/>)}</RankList>}
  </>}
 </div>;
}
