'use strict';
// Teacher coordinator; never settles ranked profiles or rewrites an older tournament.
const {pump}=require('./b2-pump.cjs');
const E=require('../server/online-rated/engine.cjs'),Room=require('./room-b2-client.cjs'),{tx}=require('./online-spark-client.cjs');
const clean=x=>JSON.parse(JSON.stringify(x)),arr=x=>Array.isArray(x)?x:Object.values(x||{});
const active=s=>s?.phase==='tour'&&s.mode==='B'&&s.tournamentVersion===2;
function matchState(s,m){return {phase:'play',mode:'B',rules:'b2',tournamentVersion:2,tournamentId:s.tournamentId,duration:s.duration||90,diff:s.diff||'easy',gid:m.gid,seed:m.seed,startAt:m.startAt,players:[m.a,m.b],names:s.names||{},accts:s.accts||{},nicks:s.nicks||{},tour:true};}
async function ensure({db,code,state,match,uid}){
 if(!active(state)||!match.b)throw Error('NOT_B2_TOURNAMENT');
 const meta=(await db.ref(`games/factor/rooms/${code}/meta`).get()).val();if(meta?.host!==uid)throw Error('NOT_TOURNAMENT_HOST');
 const path=`games/factor/rooms/${code}/b2/${match.gid}`,ref=db.ref(path),ms=matchState(state,match);
 const initial={tournamentId:state.tournamentId,game:E.begin(ms.gid,ms.diff,'B',ms.players,ms.seed,ms.startAt,{rules:'b2',duration:ms.duration}),accounts:ms.accts,phase:'play',revision:0};
 await tx(ref,old=>{if(old?.game){if(old.tournamentId!==state.tournamentId||old.game.startAt!==ms.startAt||old.game.id!==ms.gid||old.game.ids.join(',')!==ms.players.join(',')||old.game.seed!==ms.seed)throw Error('TOURNAMENT_MATCH_CONFLICT');return old}return clean(initial)});
 return ms;
}
function coordinate({db,code,state,uid,onError=()=>{}}){
 let closed=false;const clients=[],round=arr(state.rounds)[state.round||0]||[],ready=[];
 if(!active(state))return {ready:Promise.resolve(),close(){}};
 for(const m of arr(round).filter(m=>m.b&&!m.done))ready.push((async()=>{
  const ms=await ensure({db,code,state,match:m,uid});if(closed)return;
  let published=false,publishing=false;
  const client=Room.create({db,code,state:ms,uid,isHost:true,onError,onView:raw=>{
   if(!raw.game.result||published||publishing)return;publishing=true;
   const result={...raw.game.result,b2Revision:raw.revision,protocol:'tournament-b2-v1'};
   tx(db.ref(`games/factor/rooms/${code}/result/${m.gid}`),old=>{if(old){if(old.protocol!=='tournament-b2-v1'||old.at!==result.at)throw Error('TOURNAMENT_RESULT_CONFLICT');return old}return result}).then(()=>{published=true}).catch(onError).finally(()=>{publishing=false});
  }});clients.push(client);await client.process();
 })());
 return{ready:Promise.all(ready),close(){closed=true;clients.forEach(c=>c.close())}};
}
async function adjudicate({db,code,gid,winner}){
 const path=`games/factor/rooms/${code}/b2/${gid}`,clock=db.ref(path+'/clock');await clock.set({'.sv':'timestamp'});const now=(await clock.get()).val();
 return tx(db.ref(path),raw=>{if(!raw?.game)throw Error('MATCH_NOT_READY');if(raw.game.result)return raw;const n=pump(raw,now);if(!n.game.result){if(!n.game.ids.includes(winner))throw Error('INVALID_WINNER');n.game.result={winner,draw:false,reason:'judge',at:n.game.time,rank:Object.fromEntries(n.game.ids.map(u=>[u,u===winner?1:2]))};}n.revision=(raw.revision||0)+1;return clean(n)});
}
async function advance({db,code,state,patch}){return tx(db.ref(`games/factor/rooms/${code}/state`),cur=>{if(!active(cur)||cur.tournamentId!==state.tournamentId||cur.round!==state.round||cur.champion)return cur;return {...cur,...patch}})}
// Pure, idempotent account updates. Tournament records and XP are separate from
// regular matches/rating; the champion is awarded only from the bracket's champion.
function record(stats,{tournamentId,game,uid,champion=false,at}){
 if(!tournamentId||!game?.result||!game.ids.includes(uid))throw Error('UNCONFIRMED_TOURNAMENT_RESULT');
 const s=clean(stats||{});s.tournamentB2 ||= {};const t=s.tournamentB2[tournamentId] ||= {matches:{}};t.matches ||= {};
 if(!t.matches[game.id]){const state=game.states[uid],outcome=game.result.draw?'d':game.result.winner===uid?'w':'l',perfects=Object.values(state.hist||{}).filter(h=>h.ok&&h.j==='Perfect').length,exp=(outcome==='w'?30:outcome==='d'?20:15)+Math.min(10,perfects);const before=s.exp||0;s.exp=before+exp;t.matches[game.id]={outcome,score:state.score,perfects,exp,at:game.result.at};}
 if(champion&&!t.champion){t.champion={at};s.tourWins=(s.tourWins||0)+1;}
 return s;
}
module.exports={active,matchState,ensure,coordinate,adjudicate,advance,record};
