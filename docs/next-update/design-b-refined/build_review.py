from pathlib import Path
import json
out=Path(__file__).resolve().parent
icons={
'home':'m3 10 9-7 9 7v11h-6v-7H9v7H3Z',
'online':'m4 3 6 6-3 3-6-6M20 3l-6 6 3 3 6-6M8 13l-5 8M16 13l5 8M3 17l4 3M17 20l4-3M9 10l6 6M15 10l-6 6',
'solo':'M5 3h11l4 4v14H5ZM8 9h8M8 13h3M14 13h2M8 17h3M14 17h2',
'daily':'M4 5h16v16H4ZM8 2v6M16 2v6M4 10h16m-12 5 3 3 5-5',
'rank':'M8 3h8v5c0 4-2 6-4 6s-4-2-4-6ZM8 5H3v2c0 3 2 4 5 4M16 5h5v2c0 3-2 4-5 4M12 14v5M7 21h10',
'help':'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4M12 18h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20',
'account':'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
'chevron':'m9 5 7 7-7 7',
'sound':'M4 10h4l5-5v14l-5-5H4ZM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14',
'settings':'m9 3-1 3-3 1-2 4 2 2v3l3 2 3-1 3 2 4-2v-3l3-2-1-4-3-1-1-3ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
'more':'M4 6h16M4 12h16M4 18h16',
'room':'M3 4h18v16H3ZM8 4v16M11 9h6M11 13h6',
'cpu':'M5 5h14v14H5ZM8 8h8v8H8ZM8 2v3M12 2v3M16 2v3M8 19v3M12 19v3M16 19v3M2 8h3M2 12h3M2 16h3M19 8h3M19 12h3M19 16h3',
'ghost':'M5 21V10a7 7 0 0 1 14 0v11l-4-3-3 3-3-3ZM9 10v2M15 10v2',
'raid':'m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6ZM8 12h8M12 8v8',
'record':'M4 3h16v18H4ZM8 7h8M8 12h2M13 12h3M8 17h2M13 17h3',
'people':'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 5 5',
'bounty':'M4 3h16v18l-3-1-2 1-3-1-3 1-3-1-2 1ZM12 7l1 3h3l-2 2 1 3-3-2-3 2 1-3-2-2h3Z'
}
def icon(name):return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{icons[name]}"/></svg>'
nav=[('home','ホーム'),('online','オンライン対戦'),('solo','ソロモード'),('daily','デイリーミッション'),('rank','ランキング'),('help','あそびかた')]
def navitem(key,label,active,compact=False):
 attr=f'href="{"home.html" if key=="home" else "online.html"}"' if key in ['home','online'] else f'href="#" data-preview="{label}"'
 return f'<a class="nav-item {"selected" if key==active else ""}" {attr} {"aria-current=page" if key==active else ""}>{icon(key)}<span>{label}</span><i aria-hidden="true"></i></a>'
def profile():return f'''<div class="account-row"><a href="#" data-preview="ログイン情報・成績・きせかえ" class="account-main"><span class="avatar">{icon('account')}</span><span><small>装備中の称号</small><strong>プレイヤー</strong><span class="level">Lv. <b>14</b><span class="xp"><i></i></span><small>83 / 320 EXP</small></span></span></a><div class="ratings"><div><small>イージー</small><strong>1666</strong></div><div><small>ノーマル</small><strong>1580</strong></div></div><a href="#" data-preview="成績確認" class="account-link">成績確認 {icon('chevron')}</a></div>'''
def action(key,name,desc,foot):return f'''<a class="action-card {key}" href="{'online.html' if key=='online' else '#'}" {'' if key=='online' else f'data-preview="{name}"'}><span class="action-icon">{icon(key)}</span><span class="surface-lines" aria-hidden="true"></span><span class="action-text"><strong>{name}</strong><small>{''.join('<span>'+part+'</span>' for part in ({'online':['すぐ遊ぶ・ルーム','ゴースト・レイド'],'solo':['イージー・ノーマル','ハード']}.get(key,[desc])))}</small></span><span class="action-foot">{foot}{icon('chevron')}</span></a>'''
def boss():return '''<section class="boss-stage" aria-label="今週のボス・ドラゴン"><div class="boss-label"><span class="status-dot"></span>今週のボス<span class="preview-tag">表示例</span></div><div class="boss-art"><div class="boss-orbit" aria-hidden="true"></div><img src="../../../img/monsters/dragon.webp" alt="ドラゴン" width="512" height="512"></div><div class="boss-details"><div><small>協力レイド</small><h2>ドラゴン</h2></div><a href="#" class="small-button" data-preview="今週のボス">ボスに挑む <span aria-hidden="true">→</span></a></div></section>'''
home=f'''<div class="home-content"><div class="home-actions">{action('online','オンライン対戦','すぐ遊ぶ・ルーム・ゴースト・レイド','対戦ロビーへ')}{action('solo','ソロモード','イージー・ノーマル・ハード','難易度を選ぶ')}</div>{boss()}</div><div class="home-support"><a class="mission-strip" href="#" data-preview="デイリーミッション">{icon('daily')}<span><strong>デイリーミッション</strong><small>今日のミッション・デイリーチャレンジ</small></span><b>残り <em>3</em> 回</b>{icon('chevron')}</a><a class="support-link" href="#" data-preview="ランキング">{icon('rank')}<span>ランキング</span>{icon('chevron')}</a><a class="support-link" href="#" data-preview="あそびかた">{icon('help')}<span>あそびかた</span>{icon('chevron')}</a></div>'''
def route(iconname,name,desc,tag=''):
 return f'<a class="route-item" href="#" data-preview="{name}"><span class="route-icon">{icon(iconname)}</span><span><strong>{name}</strong><small>{desc}</small></span>{f"<b class=route-tag>{tag}</b>" if tag else ''}{icon('chevron')}</a>'
online=f'''<section class="quick-match"><div class="quick-info"><span class="quick-mark">{icon('online')}</span><div><h2>すぐ遊ぶ</h2><p>イージー・ノーマルのレーティング対戦</p></div></div><div class="quick-bottom"><p>マッチング後にA・B方式を選択</p><a href="#" class="primary-button" data-preview="レーティング対戦の難易度選択">対戦相手を探す {icon('chevron')}</a></div></section><div class="lobby-grid"><section class="lobby-group"><h2>対戦</h2>{route('room','4桁ルーム','A・新B・C方式','友だちと対戦')}{route('cpu','CPU練習','難易度・方式・強さを選択')}</section><section class="lobby-group"><h2>協力</h2>{route('raid','今週のボス','全員でボスにダメージを与える')}{route('people','フレンドレイド','開催条件：オンライン対戦10戦以上')}</section><section class="lobby-group"><h2>ゴースト</h2>{route('ghost','通常ゴースト','イージー・ノーマルの分身に挑戦')}{route('ghost','ハイパーゴースト','ランキング上位の分身に挑戦')}</section><section class="lobby-group"><h2>記録・プレイヤー</h2><div class="record-links">{''.join(f'<a href="#" data-preview="{name}">{icon(key)}<span>{name}</span>{icon("chevron")}</a>' for key,name in [('record','成績・称号'),('rank','オンラインランキング'),('people','みんなの成績'),('bounty','賞金首リスト'),('ghost','ゴースト対戦記録')])}</div></section></div>'''
for key,name,content in [('home','ホーム',home),('online','オンライン対戦',online)]:
 sidebar=f'''<aside class="sidebar"><a class="brand-slot" href="home.html" aria-label="ホームへ"><img data-brand-image src="../design-directions/title-original.png" alt="FACTOR×FACTOR" width="688" height="371"><span class="logo-note">仮ロゴ</span></a><div class="side-divider"></div><nav aria-label="PCメインメニュー">{''.join(navitem(k,n,key) for k,n in nav)}</nav><div class="sidebar-account"><span>{icon('account')}</span><div><strong>プレイヤー</strong><small>Lv.14</small></div><a href="#" data-preview="ログイン情報" aria-label="ログイン情報を開く">{icon('chevron')}</a></div></aside>'''
 mobile=f'''<header class="mobile-top"><a href="home.html" class="mobile-brand"><img data-brand-image src="../design-directions/title-original.png" alt="FACTOR×FACTOR" width="688" height="371"><span class="logo-note">仮ロゴ</span></a><div class="header-tools"><button aria-label="音声設定" data-preview="音声設定">{icon('sound')}</button><button aria-label="設定" data-preview="設定">{icon('settings')}</button></div></header>'''
 bottom='<nav class="bottom-nav" aria-label="スマホメインメニュー">'+''.join(navitem(k,n,key,True) for k,n in [('home','ホーム'),('online','対戦'),('solo','ソロ'),('rank','順位')])+f'<button class="nav-item" id="open-menu" aria-label="メニューを開く" aria-expanded="false">{icon("more")}<span>メニュー</span></button></nav>'
 doc=f'''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B案改良版・{name} — デザインレビュー</title><link rel="stylesheet" href="refined.css"><body><div class="review-ribbon"><span>B案改良版 · {name}</span><span>デザインレビュー用 / 未実装</span></div><div class="app-shell">{sidebar}<div class="page-shell">{mobile}<header class="page-header"><div><span class="page-marker" aria-hidden="true"></span><h1>{name}</h1></div><div class="header-tools"><button aria-label="音声設定" data-preview="音声設定">{icon('sound')}</button><button aria-label="設定" data-preview="設定">{icon('settings')}</button></div></header>{profile()}<main>{content}</main><footer><span>※ プレイヤー情報・数値・ボスはサンプル</span><span>先生専用機能は権限確認後に表示</span></footer></div></div>{bottom}<dialog id="menu-sheet" aria-label="メインメニュー"><div class="sheet-title"><h2>メニュー</h2><button data-close="menu-sheet" aria-label="メニューを閉じる">×</button></div><nav>{''.join(navitem(k,n,key) for k,n in nav)}</nav></dialog><dialog id="preview-dialog"><h2 id="preview-title"></h2><p>デザイン確認用の案です。実機能への接続はまだ行っていません。</p><button data-close="preview-dialog" class="primary-button">閉じる</button></dialog><script src="review.js"></script></body></html>'''
 doc=doc.replace('<span>オンラインランキング</span>','<span>オンライン<span class="mobile-break"></span>ランキング</span>')
 (out/f'{key}.html').write_text(doc)
(out/'brand-config.json').write_text(json.dumps({'src':'../design-directions/title-original.png','alt':'FACTOR×FACTOR','temporary':True,'note':'元PNG無加工。正式ロゴ決定後はこの設定のsrcから差し替える。'},ensure_ascii=False,indent=2)+'\n')
