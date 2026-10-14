# Chromebook の表示・入力確認

対象: Ver.5.19以降。氏名、アカウント、PIN、認証情報を送らないでください。

1. Chromeメニューのズームを確認し、まず100%に戻す（Ctrl+0）。ウィンドウを最大化する。
2. ChromeOS「設定 → デバイス → ディスプレイ」で解像度・表示サイズを確認。アクセシビリティの全画面/ドッキング拡大鏡も確認する。学校管理の設定は管理者に相談する。
3. ゲーム以外のページでも指のタップ・スクロールができるか確認。できなければ機種のタッチ対応・OS設定・ハードウェアを確認する。タッチ非対応/無効な端末をゲームから有効化することはできない。
4. ソロ、CPU練習、オンラインで、1枚のタップが残らず、1枚から別のカードへ指でつないで離すと解答になることを確認。トラックパッドのドラッグとも比較する。
5. ズーム125/150/200%で同じ比較をする。高さの足りない画面ではゲーム枠を縦にスクロールできる。カード上は回答ドラッグのためスクロールを止めるので、枠/情報部分からスクロールする。
6. 問題が続く場合、機種、Chrome/ChromeOSバージョン、ウィンドウ最大化有無、ズーム、表示サイズ、発生モードだけを報告する。画面写真に氏名があれば隠す。

## 開発者向け匿名診断（任意・授業中の生徒に要求しない）

教員/管理者がDevToolsコンソールで以下を実行し、カードを1回ドラッグしてから `JSON.stringify(fxfInputDiagnostic)` を確認する。外部送信・永続保存はしない。ページを再読み込みすると消える。記録は直近40件のみ。アカウント・URL・問題内容・カードIDは記録しない。

```js
(() => {
  const vv = window.visualViewport;
  window.fxfInputDiagnostic = {
    viewport: {width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
    visualViewport: vv ? {width:vv.width,height:vv.height,scale:vv.scale,offsetLeft:vv.offsetLeft,offsetTop:vv.offsetTop} : null,
    maxTouchPoints:navigator.maxTouchPoints,
    pointerEvents:!!window.PointerEvent,
    coarse:matchMedia('(any-pointer: coarse)').matches,
    fine:matchMedia('(any-pointer: fine)').matches,
    events:[]
  };
  if (window.fxfInputDiagnosticStop) window.fxfInputDiagnosticStop();
  const types=['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchmove','touchend','touchcancel'];
  const log=e=>{
    const p=e.changedTouches?.[0]||e;
    const hit=document.elementFromPoint(p.clientX,p.clientY)?.closest('[data-btile],[data-tile-id]');
    const r=hit?.getBoundingClientRect();
    fxfInputDiagnostic.events.push({ms:Math.round(performance.now()),event:e.type,pointerType:e.pointerType||null,cancelable:e.cancelable,prevented:e.defaultPrevented,cardHit:!!hit,card:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null});
    if(fxfInputDiagnostic.events.length>40)fxfInputDiagnostic.events.shift();
  };
  types.forEach(k=>window.addEventListener(k,log,{capture:true,passive:true}));
  window.fxfInputDiagnosticStop=()=>types.forEach(k=>window.removeEventListener(k,log,true));
})();
```

`maxTouchPoints > 0` は能力の申告であり、実際にタッチが有効な保証ではない。touchのpointerdownが届かなければ端末/OS/ブラウザ側とDOM上の遮蔽物を切り分ける。pointercancelはスクロール競合やOSのジェスチャー中断の証拠になるが、それだけで原因は断定しない。

## 自動検証の範囲

Chromiumのタッチ対応コンテキスト、マウス、1366×650/1093×520/911×433/683×325、1024×600/512×300、縮小ウィンドウ800×450、スマホ縦390×844を比較。ズーム倍率によるCSS viewport減少相当の寸法であり、ChromeOS実機やChromeツールバーの実ズーム操作そのものではない。devicePixelRatioや画面拡大鏡による見え方も実機確認が必要。iPhone Safari実機/ChromeOS実機はクラウド環境にはない。
