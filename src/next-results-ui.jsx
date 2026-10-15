import {Spectator} from './next-spectator-ui.jsx';
const BResult=require('./b-result.cjs');
const palette=['#71e0cf','#f6bd62','#b5a5ff','#83c8ff'];
function BDetails({game,report,names={},me}){
 const r=report||BResult.build(game),[selected,setSelected]=React.useState(0);
 if(!r.consistent)return <section className="next-result-details" data-b-result><h3>新B方式 得点の推移</h3><p role="status">{r.reason||'詳細記録がありません。'}</p></section>;
 const ids=r.ids,other=ids.find(u=>u!==me),row=r.rows[Math.min(selected,r.rows.length-1)],max=Math.max(1,...Object.values(r.final)),duration=Math.max(1,r.endAt-r.startAt);
 const x=at=>42+(at-r.startAt)/duration*540,y=n=>196-n/max*155,label=u=>names[u]||'プレイヤー';
 let lastLead=0;const reversals=r.rows.filter(e=>{const lead=Math.sign(e.scores[me]-e.scores[other]);const change=lead&&lastLead&&lead!==lastLead;if(lead)lastLead=lead;return change});
 return <section className="next-result-details" data-b-result><h3>新B方式 得点の推移</h3><p>確定得点履歴 #{r.revision} ・ 横軸：経過秒 ／ 縦軸：得点</p>
 <ul className="next-result-legend">{ids.map((u,i)=><li key={u}><span style={{background:palette[i%4]}}/>{label(u)} <b>{r.final[u]}点</b></li>)}</ul>
 <svg viewBox="0 0 610 230" role="img" aria-label="確定した累積得点の推移"><title>確定得点。逆転箇所は丸印</title>{[0,Math.round(max/2),max].map((n,i)=><g key={i}><line x1="42" x2="582" y1={y(n)} y2={y(n)} stroke="#344c60"/><text x="36" y={y(n)+4} textAnchor="end">{n}</text></g>)}
 {ids.map((u,i)=>{let points=[];r.rows.forEach((e,j)=>{if(j)points.push([x(e.at),y(r.rows[j-1].scores[u])]);points.push([x(e.at),y(e.scores[u])])});points.push([x(r.endAt),y(r.final[u])]);return <polyline key={u} fill="none" stroke={palette[i%4]} strokeWidth="3" strokeDasharray={i%2?'7 3':undefined} points={points.map(p=>p.join(',')).join(' ')}/>})}
 {reversals.map(e=><circle key={e.id} cx={x(e.at)} cy={y(e.scores[me])} r="5" fill="#f6bd62"/>)}
 <text x="42" y="218">0秒</text><text x="582" y="218" textAnchor="end">{(duration/1000).toFixed(1)}秒</text></svg>
 <label className="next-result-slider">確定イベント <input type="range" min="0" max={r.rows.length-1} value={selected} onChange={e=>setSelected(Number(e.target.value))}/></label>
 <p aria-live="polite">{((row.at-r.startAt)/1000).toFixed(1)}秒：{ids.map(u=>`${label(u)} ${row.scores[u]}点`).join(' ／ ')}{me&&other&&`（得点差 ${row.scores[me]-row.scores[other]}点）`}</p>
 <p>● リード交代 {reversals.length}回（同点を挟む交代を含む）</p>
 <div className="next-result-table"><table><caption>確定した正解・攻撃の合計</caption><thead><tr><th>プレイヤー</th>{['正解','誤答','時間切れ','最高コンボ','Perfect','送信お邪魔','相殺枚数','FREEZE'].map(t=><th key={t}>{t}</th>)}</tr></thead><tbody>{ids.map(u=><tr key={u}><th>{label(u)}</th>{['correct','wrong','timeouts','best','perfects','attack','cancel','freeze'].map(k=><td key={k}>{r.summary[u][k]??'—'}</td>)}</tr>)}</tbody></table></div>
 <details><summary>得点イベントの詳細</summary><ol>{r.rows.slice(1).map(e=><li key={e.id}>#{e.id} {((e.at-r.startAt)/1000).toFixed(1)}秒：{label(e.uid)} ＋{e.gain}点 ／ {ids.map(u=>`${label(u)} ${e.scores[u]}点`).join('・')}</li>)}</ol></details>
 </section>;
}
function CDetails({ids=[],records={},names={},teams={},teamLabels={}}){
 const known=(u,k)=>typeof records[u]?.[k]==='number'&&Number.isFinite(records[u][k])?records[u][k]:null;
 const max=Math.max(1,...ids.map(u=>known(u,'c')??0));
 return <section className="next-result-details" data-c-result><h3>C方式 個人別の記録</h3><p>終了画面で取得できた保存済み報告。正解数と得点は別の指標です。総合貢献点には換算しません。</p><ul className="next-c-bars">{ids.map((u,i)=><li key={u}><div>{teamLabels[teams[u]]||'チーム未記録'} ／ {names[u]||'プレイヤー'} <b>{known(u,'c')===null?'未記録':known(u,'c')+'問正解'}</b></div>{known(u,'c')!==null&&<div className="next-c-bar" role="img" aria-label={`${names[u]||'プレイヤー'} 正解${known(u,'c')}問`}><span style={{width:100*known(u,'c')/max+'%',background:palette[i%4]}}/></div>}<p>得点 {known(u,'score')??'未記録'} ／ 最終報告コンボ {known(u,'combo')??'未記録'}</p></li>)}</ul><p>攻撃・相殺・防御・回復・個人別HP寄与の確定合計／時系列は未記録のため表示できません。チーム共有HPを個人の貢献へ推測配分しません。</p></section>;
}
window.NextResults={BDetails,CDetails,Spectator,buildB:BResult.build};
