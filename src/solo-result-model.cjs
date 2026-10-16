'use strict';
// Presentation model for the normal solo (FactorHunt) CLEAR / GAME OVER screen.
// Only facts from the run are emitted. Missing/inconsistent log data hides the items derived from it.
const fin=n=>typeof n==='number'&&Number.isFinite(n);
const clock=s=>`${Math.floor(Math.round(s)/60)}分${Math.round(s)%60}秒`;
const sec=ms=>(ms/1000).toFixed(1);
// input: {label, clearCount, cleared, score, caught, elapsedSeconds, levelText, unlockedLevel, clearTimeBonus,
//         isRecord, rankedIn, snapshot:{maxCombo, log:[{ok,ms,j?,lv?,timeout?,reverse?}]}|null}
function build(i){
 if(!i||!fin(i.score)||!fin(i.caught))return null;
 const snap=i.snapshot,log=Array.isArray(snap?.log)?snap.log:null;
 // the log must account for every correct answer (normal AND bonus stage); otherwise nothing is derived from it
 const logOk=!!log&&log.every(e=>e&&typeof e.ok==='boolean'&&fin(e.ms))&&log.filter(e=>e.ok).length===i.caught;
 const maxCombo=fin(snap?.maxCombo)&&snap.maxCombo>=0?snap.maxCombo:null;
 const cleared=!!i.cleared;
 const judged=logOk&&log.filter(e=>e.ok).every(e=>typeof e.j==='string');
 const perfect=judged?log.filter(e=>e.ok&&e.j==='Perfect').length:null;
 const misses=logOk?log.filter(e=>!e.ok).length:null;
 const fastest=logOk?log.filter(e=>e.ok).sort((a,b)=>a.ms-b.ms)[0]:null;
 const tiles=[{id:'score',label:'得点',value:i.score,unit:'点'},{id:'caught',label:'正解数',value:i.caught,unit:'問'}];
 if(maxCombo!==null)tiles.push({id:'combo',label:'最大コンボ',value:maxCombo,unit:''});
 if(perfect!==null)tiles.push({id:'perfect',label:'Perfect',value:perfect,unit:'回'});
 if(misses!==null)tiles.push({id:'miss',label:'ミス',value:misses,unit:'回（誤答・時間切れ）'});
 if(fin(i.elapsedSeconds))tiles.push({id:'time',label:'プレイ時間',value:clock(i.elapsedSeconds),text:true,unit:''});
 if(i.label)tiles.push({id:'difficulty',label:'難易度',value:i.label,text:true,unit:''});
 if(i.levelText)tiles.push({id:'level',label:'到達レベル',value:i.levelText,text:true,unit:''});
 const hl=[];
 if(cleared&&fin(i.elapsedSeconds))hl.push({id:'clear',title:'クリアタイム',tag:clock(i.elapsedSeconds),detail:fin(i.clearTimeBonus)?`タイムボーナス ${i.clearTimeBonus>=0?'+':''}${i.clearTimeBonus}点`:`${i.clearCount}問を達成`});
 if(maxCombo!==null&&maxCombo>=2)hl.push({id:'combo',title:`最大${maxCombo}コンボ`,tag:'',detail:'この挑戦で連続して正解した最長記録'});
 if(fastest)hl.push({id:'fast',title:'最速解答',tag:`${sec(fastest.ms)}秒`,detail:[typeof fastest.j==='string'?fastest.j:null,fin(fastest.lv)?`Lv.${fastest.lv}`:null].filter(Boolean).join(' ・ ')||'最も速く正解した問題'});
 const badges=[];if(i.isRecord&&i.score>0)badges.push('自己ベスト更新！');if(i.rankedIn)badges.push('ランキング入り！');
 return{kind:'S',cleared,outcome:cleared?'win':'lose',word:cleared?'CLEAR!':'GAME OVER',methodLabel:`ソロ${i.label?' ・ '+i.label:''}`,
  reasonText:cleared?`${i.clearCount}問達成！`:'体力切れ…',score:i.score,badges,tiles,highlights:hl.slice(0,3),misses,
  learnButton:misses!==null&&misses>=1};
}
module.exports={build,clock};
