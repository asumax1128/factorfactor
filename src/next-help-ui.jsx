const B2=require('../server/online-rated/b2.cjs');
// Ver.6.14: visual guide built from real game screenshots (tools/capture-guide.cjs → ui-next/guide/).
// Every number comes from the game's own definitions passed in from index.html (no copies of the rules here).
const GUIDE=require('../ui-next/guide/guide-shots.json');
const STEPS=[['basic','基本操作'],['perfect','Perfect'],['difficulty','難易度'],['solo','ソロモード'],['online','オンライン対戦'],['ghost','ゴースト対戦'],['boss','今週のボス'],['growth','成長とやりこみ']];
function Shot({name,marks=[],note,wide}){
 const s=GUIDE.shots[name];if(!s)return null;
 const v=window.FactorVersion?.number?'?v='+window.FactorVersion.number:'';
 return <figure className={'hg-shot'+(wide?' hg-wide':'')} data-guide-shot={name}>
  <div className="hg-frame" style={{aspectRatio:`${s.w} / ${s.h}`}}>
   <img src={'ui-next/guide/'+s.file+v} alt={s.alt} width={s.w} height={s.h} loading="lazy" decoding="async"/>
   {marks.map(([label,n,tone])=>{const m=s.marks.find(x=>x.label===label);return m&&<span key={label} className={'hg-mark'+(tone?' hg-'+tone:'')} style={{left:m.x+'%',top:m.y+'%',width:m.w+'%',height:m.h+'%'}} aria-hidden="true"><b>{n}</b></span>})}
  </div>
  {note&&<figcaption>{note}</figcaption>}
 </figure>;
}
const Art=({name})=>{const s=GUIDE.shots[name];return s?<img className="hg-art" src={'ui-next/guide/'+s.file} alt={s.alt} width={s.w} height={s.h} loading="lazy" decoding="async" data-guide-shot={name}/>:null};
const Play=({onClick,children='遊んでみる'})=><button type="button" className="hg-play" data-guide-play onClick={onClick}>{children} <span aria-hidden="true">→</span></button>;
export function Help({tiers,difficulties,missPenalty,timeoutExtra,questionMs,aLockMs,aLastSpurt,visual={},onClose,onPlay,onGo}){
 const top=React.useRef(null);
 const jump=id=>{const el=document.getElementById('hg-'+id);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.focus({preventScroll:true});}};
 const shown=t=>t.label==='Fair'?'OK':t.label; // the game shows the 20-second tier as "OK" (timingVisual); the guide matches the screen
 const colorOf=t=>visual[shown(t)]||t.color;
 const perfect=tiers[0],sec=ms=>ms/1000;
 const diffs=Object.entries(difficulties);
 const go=key=>onGo&&onGo(key);
 const Step=({id,n,title,lead,children,hero})=><section id={'hg-'+id} tabIndex={-1} className={'hg-step'+(hero?' hg-hero':'')} data-guide-step={id} aria-labelledby={'hg-'+id+'-h'}><header><span className="hg-num">STEP {n}</span><h2 id={'hg-'+id+'-h'}>{title}</h2>{lead&&<p className="hg-lead">{lead}</p>}</header>{children}</section>;
 return <main className="next-help hg" data-next-help ref={top}>
  <link rel="stylesheet" href="ui-next/help.css"/>
  <div className="hg-top"><button type="button" className="small-button" data-guide-home onClick={onClose}>← ホームへ戻る</button></div>
  <nav className="hg-toc" aria-label="あそびかたの目次">{STEPS.map(([id,label],i)=><button key={id} type="button" data-toc={id} onClick={()=>jump(id)}><b>{i+1}</b>{label}</button>)}</nav>

  <Step id="basic" n={1} hero title="因数分解の基本操作" lead="上の式を、下の因数タイル2枚のかけ算で作ろう。">
   <ol className="hg-strip" aria-label="操作の流れ" data-guide-strip><li><b>1</b>式を見る</li><li><b>2</b>正しい2枚を探す</li><li><b>3</b>ドラッグして離す</li><li><b>4</b>合体！</li></ol>
   <ol className="hg-flow">
    <li><Shot name="s1-board" marks={[['式',1],['タイル1',2],['タイル2',2]]}/><div><h3><b>1</b>上の式を見る</h3><h3><b>2</b>下のタイルから正しい2枚を探す</h3><p>タイルはイージー{difficulties.easy.tileCount}枚、ノーマル{difficulties.normal.tileCount}枚、ハード{difficulties.hard.tileCount}枚。</p></div></li>
    <li><Shot name="s1-drag" marks={[['押さえる',3],['ここで離す',3,'drop']]}/><div><h3><b>3</b>1枚を押さえたまま、もう1枚までドラッグして離す</h3><p>押さえたタイルは金色の枠になり、指まで線が伸びます。2枚を別々にタップするだけでは答えになりません。</p></div></li>
    <li><Shot name="s1-correct"/><div><h3><b>4</b>正解すると2枚が合体！</h3><p>2枚が水色に光り、式に吸いこまれて次の問題へ。</p></div></li>
    <li className="hg-miss"><Shot name="s1-miss"/><div><h3><b>×</b>まちがえると</h3><p>2枚が赤くなって「Bad」。HPが減り、コンボが途切れて次の問題に進みます。</p></div></li>
   </ol>
   <Play onClick={onPlay}>遊んでみる（難易度を選ぶ）</Play>
  </Step>

  <Step id="perfect" n={2} hero title="Perfectを狙おう！" lead={`出題から${sec(perfect.max)}秒以内に正解するとPerfect！`}>
   <Shot name="s2-perfect" wide marks={[['判定',1,'gold'],['HP',2,'gold']]}/>
   <ul className="hg-points">
    <li><b>1</b>HPが<strong>{perfect.recover}%</strong>回復（いちばん多い）</li>
    <li><b>2</b>HPが100%を超えた分は、1%＝1点として得点に加算</li>
    <li><b>★</b>Perfectの通算回数はプロフィールに記録され、称号（Perfect 50回など）につながる</li>
    <li><b>★</b>今週のボスには、Perfectのダメージが2倍になるボスもいる</li>
   </ul>
   <p className="hg-note">正解の得点は問題のレベルとコンボで決まります。Perfectで得点の倍率が上がるのではなく、HPの回復と、その超過分が得点になります。</p>
   <table className="hg-judge" data-guide-judge><caption>判定と回復（解答時間は「以内」）</caption><thead><tr><th>画面の表示</th><th>解答時間</th><th>HP回復</th></tr></thead><tbody>
    {tiers.map(t=><tr key={t.label} data-tier={t.label}><th style={{color:colorOf(t)}}>{shown(t)}</th><td>{sec(t.max)}秒以内</td><td>＋{t.recover}%</td></tr>)}
    <tr data-tier="Bad"><th style={{color:visual.Bad||'#FF5C5C'}}>Bad</th><td>ミス・時間切れ</td><td>回復なし</td></tr>
   </tbody></table>
   <p className="hg-note">「OK」は2段階あります（{sec(tiers[4].max)}秒以内は＋{tiers[4].recover}%、{sec(tiers[5].max)}秒以内は＋{tiers[5].recover}%）。</p>
  </Step>

  <Step id="difficulty" n={3} title="難易度を選ぼう" lead="イージー・ノーマル・ハードの3つから選んでスタート。">
   <div className="hg-two"><Shot name="s3-difficulty" marks={[['難易度',1],['スタート',2]]}/>
    <div className="hg-diffs" data-guide-difficulty>{diffs.map(([id,d])=><div key={id} className="hg-diff" data-diff={id} style={{'--d':d.color}}><h3>{d.label}</h3><dl><dt>クリア</dt><dd>{d.clearCount}問</dd><dt>タイル</dt><dd>{d.tileCount}枚</dd><dt>ミス</dt><dd>−{missPenalty[id]}%</dd><dt>時間切れ</dt><dd>−{timeoutExtra[id]}%</dd></dl></div>)}</div>
   </div>
   <p className="hg-note">ミス・時間切れの数字はHPの減り方です（時間切れは、毎秒の減少に加えてさらに減ります）。</p>
   <ul className="hg-bullets"><li>HPは1秒に1%ずつ減り、0%になると終了。1問は{sec(questionMs)}秒で時間切れ（Bad）。</li><li>3問正解するごとに、次のレベルの問題が出るようになります（最大Lv.9）。</li><li>クリアに必要な問題数を解くとクリア。早くクリアするほどタイムボーナスが増えます。</li></ul>
  </Step>

  <Step id="solo" n={4} title="ソロモード" lead="ひとりでじっくり、またはCPUと対戦練習。">
   <div className="hg-cards">
    <div className="hg-card"><Art name="art-solo"/><h3>通常プレイ</h3><p>難易度を選んで、スコアとクリアを目指そう。ランキングにも挑戦できます。</p><Play onClick={onPlay}/></div>
    <div className="hg-card"><Art name="art-cpu"/><h3>CPU練習</h3><p>CPUを相手にA方式・新B方式の練習。難易度・CPUの強さ・人数を選べます。<strong>公式レーティング・対人戦績には反映されません。</strong></p><Play onClick={()=>go('cpu')}/></div>
   </div>
   <div className="hg-sub"><h3>デイリーミッション</h3><p>毎日変わるミッションと、1日合計3回のデイリーチャレンジ（日本時間0時に更新）。開始後の退出や再読み込みでも回数は戻りません。デイリーはホームから開けます。</p></div>
  </Step>

  <Step id="online" n={5} title="オンライン対戦" lead="同じ問題で友だちや全国のプレイヤーと勝負。">
   <div className="hg-vs">
    <div className="hg-mode"><Shot name="s5-battle-a" note="画面はCPU練習の例"/><h3>A方式（早い者勝ち）</h3><ul className="hg-bullets"><li>同じ問題をみんなで同時に解く</li><li>先に正解した人だけが得点</li><li>まちがえると{sec(aLockMs)}秒操作できない（お手つき）</li><li>最後の{aLastSpurt}問は得点2倍</li><li>全部の問題が終わったとき、得点が多い人の勝ち</li></ul></div>
    <div className="hg-mode"><Shot name="s5-battle-b" note="画面はCPU練習の例"/><h3>新B方式（レース＋攻撃）</h3><ul className="hg-bullets"><li>HPと得点を持って自分のペースで解く</li><li>連続正解（コンボ）で相手にお邪魔タイルを送る</li><li>届いたお邪魔は3秒以内の正解で相殺できる</li><li>ゲージが100%になるとFREEZEが自動発動</li><li>時間終了時の得点が多い人の勝ち。HP0はKO</li></ul></div>
   </div>
   <details className="hg-details"><summary>新B方式のくわしいルール</summary>
    <p>すぐ遊ぶは90秒、ルームでは60・90・120・180秒から選べます。HPは毎秒1%減少。誤答はイージー20%・ノーマル25%減少。問題時間切れの追加減少はイージー0%・ノーマル5%です。正解回復のHP超過分は得点になります。</p>
    <p>2コンボで1枚、3コンボで2枚、4コンボ以降は3枚のお邪魔を送ります。お邪魔はイージー最大{B2.cap('easy')}枚・ノーマル最大{B2.cap('normal')}枚まで盤面に加わり、正解に使えない偽カードです。問題開始時に配置されたお邪魔1枚につき通常得点の10%を加算します。到着した攻撃は3秒間、今回の正解で発生した攻撃と相殺できます。</p>
    <p>2コンボ目からレベル×3%のゲージを獲得。100%でFREEZEが自動発動し、相手の式・カードと操作を3秒遮蔽します。コンボは次の問題が操作可能になってから10秒以内に正解すると継続します。観戦応援は1回10pt、1人3回。30ptで次問のお邪魔1枚を除去し、試合全体で最大3枚です。</p>
    <ul className="hg-levels">{Object.entries(B2.POINTS).map(([lv,n])=><li key={lv}>Lv.{lv}：{n}点</li>)}</ul>
    {window.FXF_FEATURES?.cMode&&<p>C方式：4人・2対2のチーム戦です。HPはチームで共有します。</p>}
   </details>
   <div className="hg-sub"><h3>対戦の入口（「対戦」タブ）</h3><ul className="hg-bullets"><li><strong>すぐ遊ぶ</strong>：ランダムレーティング対戦。マッチング後にA・新B方式を選びます。</li><li><strong>4桁ルーム</strong>：部屋を作ったあと、ホストが方式を選びます。友だちは4桁のコードで参加・観戦できます。</li></ul></div>
   <Play onClick={()=>go('battle')}>対戦画面へ</Play>
  </Step>

  <Step id="ghost" n={6} title="ゴースト対戦" lead="実在のプレイヤーの学習記録から動くゴーストと対戦。">
   <div className="hg-two"><Shot name="s6-ghost-tiles" marks={[['イージー',1],['ノーマル',2],['ハイパー',3]]}/>
    <ul className="hg-points">
     <li><b>1</b><span><strong>イージーゴースト</strong>：イージーで、自分以外のプレイヤーのゴースト（なるべく同じランク帯）と対戦</span></li>
     <li><b>2</b><span><strong>ノーマルゴースト</strong>：ノーマルで同じように対戦</span></li>
     <li><b>3</b><span><strong>ハイパーゴースト</strong>：タイルの中の「イージー」「ノーマル」で難易度を選ぶ。その難易度のレーティングTOP10から抽選（順位が高いほど出やすい）</span></li>
    </ul></div>
   <Shot name="s6-ghost-start" note="開始すると方式（A・新B）を選びます"/>
   <ul className="hg-bullets"><li>登録アカウントでのログインが必要。学習記録が20問以上あるプレイヤーがゴーストになります。</li><li>オンライン画面のゴースト対戦では、レーティングは変わりません。</li><li>「すぐ遊ぶ」の待ち時間にゴーストが乱入した対戦は、レーティングが通常の3分の1だけ変動します。</li><li>自分のゴーストとの対戦は練習（報酬なし）です。</li></ul>
   <Play onClick={()=>go('battle')}>対戦画面へ</Play>
  </Step>

  <Step id="boss" n={7} title="今週のボス" lead="みんなのダメージを合わせて、1週間でボスを倒そう。">
   <div className="hg-two"><div className="hg-bossart"><Art name="art-boss"/><p className="hg-note">ボスの例：因数ドラゴン</p></div>
    <ul className="hg-bullets"><li>月曜日に新しいボスが登場</li><li>1回の出撃は60秒</li><li><strong>アタッカー</strong>でダメージを与えるか、<strong>サポーター</strong>でみんなのダメージを上げる</li><li>弱点タイムはダメージ2倍。反撃の予告が出たら正解して身を守ろう</li><li>倒すと、ダメージを与えた全員に討伐報酬。参加したボスの記念きせかえも解放</li></ul></div>
   <Shot name="s7-weekly" note="今週のボスの出撃画面"/>
   <Play onClick={()=>go('raidw')}>今週のボスへ</Play>
  </Step>

  <Step id="growth" n={8} title="成長とやりこみ" lead="遊ぶほど記録が増えて、レベルと称号が育つ。">
   <div className="hg-two"><Shot name="s8-profile" note="プロフィール"/>
    <ul className="hg-bullets"><li><strong>レーティング</strong>：イージー・ノーマル別。対戦の勝敗で上下し、ランク帯が決まります。毎月新しいシーズン。</li><li><strong>EXPとレベル</strong>：ソロ・対戦・ミッションなどで経験値がたまり、レベルが上がります。</li><li><strong>称号</strong>：条件を満たすと取得し、名前の上に飾れます（未公開の条件は？？？）。</li><li><strong>きせかえ</strong>：タイル・背景・エフェクトを着せかえ。レベルやランク、ボス討伐などで解放。</li><li><strong>ランキング</strong>：「順位」タブからソロ・デイリー・レーティング。</li></ul></div>
   <Shot name="s8-ranking" note="ランキング（順位タブ）"/>
   <div className="hg-actions"><Play onClick={()=>go('profile')}>プロフィールへ</Play><Play onClick={()=>go('rankings')}>ランキングへ</Play></div>
  </Step>

  <div className="hg-top hg-bottom"><button type="button" className="small-button" onClick={()=>{top.current?.scrollIntoView({behavior:'smooth',block:'start'})}}>↑ 目次へ</button><button type="button" className="small-button" onClick={onClose}>← ホームへ戻る</button></div>
 </main>;
}
