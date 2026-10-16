'use strict';
const Engine=require('../online-rated/engine.cjs'),AResult=require('../../src/a-result.cjs');
// Called only after the protected match/member/settlement boundary is checked.
function read(game,uid){
 if(game?.mode!=='A'||game.rules==='b2'||!Number.isFinite(game.startAt)||!game.result||game.ids?.length!==2||!game.ids.includes(uid))throw Error('UNCONFIRMED_A_GAME');
 const g=JSON.parse(JSON.stringify(game)),rt=Engine.runtime(g),api=rt.api,claims=Array.isArray(g.claims)?g.claims:Object.values(g.claims||{}),N=api.DIFFICULTY_CONFIG[g.difficulty]?.clearCount;
 if(!N)throw Error('INVALID_A_DIFFICULTY');let last=g.startAt;
 for(let q=0;q<claims.length;q++){const c=claims[q],begin=api.qStartA(claims,q,g.startAt);if(!c||!Number.isFinite(c.at)||c.at<last||c.at<begin||!g.ids.includes(c.uid)&&c.uid!=='_none')throw Error('INVALID_A_CLAIM');if(c.uid!=='_none'&&(!Number.isFinite(c.pts)||c.j!==api.getJudgment(c.at-begin).label))throw Error('INCOMPLETE_A_CLAIM');last=c.at;}
 const score=api.scoreA(rt.bank,claims,g.ids,N,{}),report=AResult.build(score,claims,g.ids,g.startAt,api.A_NEXT_DELAY);if(!report.consistent)throw Error('INCONSISTENT_A_POINTS');
 if(g.result.reason==='clear'&&(claims.length!==N||!!g.result.draw!==(score.sc[g.ids[0]]===score.sc[g.ids[1]])||!g.result.draw&&score.sc[g.result.winner]!==Math.max(...Object.values(score.sc))))throw Error('INCONSISTENT_A_RESULT');
 return{hist:claims.flatMap((c,q)=>c.uid===uid?[{ok:true,lv:api.problemForA(rt.bank,q).level,ms:c.at-api.qStartA(claims,q,g.startAt),j:c.j}]:[]),best:score.best[uid],opponentZero:g.ids.filter(u=>u!==uid).every(u=>score.sc[u]===0)};
}
module.exports={read};
