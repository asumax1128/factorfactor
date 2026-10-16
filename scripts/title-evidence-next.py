#!/usr/bin/env python3
"""Source-indexed evidence inventory; never reads Firebase or awards titles."""
import csv,io,json,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[1]
c=json.loads((root/'src/title-catalog-next.json').read_text())
with (root/'reports/titles_inventory.csv').open(encoding='utf-8-sig',newline='') as f: legacy=list(csv.DictReader(f))
assert len(legacy)==97
old={r['内部ID']:r for r in legacy}
assert len(old)==97 and len(c['titles'])==100 and len({t['id'] for t in c['titles']})==100
assert sum(t['stars']==5 for t in c['titles'])==26
online=set('dual dual50 shutout online_first first wins100_ab games100 games300 lose50 rival20 wide10 wide30 perfect50 perfect100 perfect300 perfect500 perfect1000 flash flash3 combo20 combo30 nomiss nomiss10 accuracy10 lv9 alllv sp3 sp50 ojama100 ojama500'.split())
rating=set('rgold master1600 master1700 rmaster master1900 easy_adept easy_master normal_adept normal_master dual_master'.split())
weekly=set('wk1 wk_runs20 wkk1 wkk5 wkk10 wkace wkace5 wkone wkone2 wkst3 wkst5 wkst10 wksup1 wkchest1 wkchest10 wksup100 wksup500 wkrage'.split())
dry=set('daily_easy_king daily_normal_king daily_hard_king daily_king lb7 lb_cards7 lb30 lb100 cancel500 cancel2000'.split())
assert (online|rating|weekly|dry)<=set(t['id'] for t in c['titles'])
source=(root/'server/next-authority/titles.cjs').read_text().splitlines()
planner=(root/'src/title-awards-next.cjs').read_text().splitlines()
def loc(lines,word,path):
 return path+':'+str(next(i for i,s in enumerate(lines,1) if word in s))
out=io.StringIO(newline='');fields=['新番号','内部ID','旧番号','旧台帳名','正式名','星数','取得条件','参照する確定記録','証明アダプター','遡及判定','正式付与接続','判定コード','旧判定コード','備考'];w=csv.DictWriter(out,fieldnames=fields,lineterminator='\n');w.writeheader();counts={}
for t in c['titles']:
 id=t['id'];prior=old.get(t['legacyId']);state='未接続';record='証明元・adapter未整備';judge='';note='旧取得済みは固定snapshotで保持。旧判定式を新条件の証明へ無条件流用しない。'
 if id in online:state='管理側接続済み（A/B2記録の範囲）';record='onlineRatedV2/privateState: settled matches + settlements +確定hist／A claims';judge=loc(planner,'function matchFacts','src/title-awards-next.cjs');note+=' C等の証明adapterは未接続。CPU／自己ゴースト／未確定試合は対象外。'
 elif id in rating:state='管理側接続済み';record='onlineRatedV2/privateState/players/<account>/easy|normal/maxRating';judge=loc(planner,"if(history?.source",'src/title-awards-next.cjs');note+=' 1820等の内部判定は丸めない。'
 elif id in weekly:state='管理側接続済み（authority記録のみ）';record='nextAuthorityV1/weekly/<week>/state: runs/receipt, awards, closed';judge=loc(source,'const runs=', 'server/next-authority/titles.cjs');note+=' 旧raidw／本人書込sandboxの自己申告値は使わない。'
 elif id in dry:state='dry-runのみ／正式証明元未接続';record='既存plannerの入力形式はあるが、信頼できる読取元との接続は未完';judge='src/title-awards-next.cjs:plan';note+=' source文字列だけでは正式証拠と認めない。'
 if id=='wkdex6':note+=' 現行ボスは15種だが指定条件は全6種。対象6種の確定が必要で推測付与しない。'
 counts[state]=counts.get(state,0)+1
 w.writerow(dict(zip(fields,[t['number'],id,t['legacyNumber'],prior['正式名'] if prior else '旧台帳なし',t['name'],t['stars'],t['condition'],record,state,'確定記録が残る場合のみ。旧既得はsnapshot保持','Emulator専用。'+('reconcile→titleNextV1/awards' if id in online|rating|weekly else '新規付与未接続'),judge or '判定処理未接続',prior['取得判定コード'] if prior else '旧台帳なし',note])))
path=root/'docs/next-major/TITLE_EVIDENCE_100.csv';data=b'\xef\xbb\xbf'+out.getvalue().encode()
if '--check' in sys.argv:
 assert path.read_bytes()==data,'TITLE_EVIDENCE_100.csv must be regenerated'
else:path.write_bytes(data)
print(json.dumps({'normal':100,'fiveStars':26,'legacy':97,'states':counts},ensure_ascii=False))
