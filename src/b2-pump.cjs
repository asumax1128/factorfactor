// Replay server-stamped intents in one canonical order. Usable by ranked and room hosts.
const E=require('../server/online-rated/engine.cjs');
function pump(raw,clock){
 const m=JSON.parse(JSON.stringify(raw));if(m.game?.rules!=='b2')throw Error('NOT_B2');
 m.game.seq ||= {};
 const intents=[];for(const [uid,entries]of Object.entries(m.inputs||{}))for(const [id,c]of Object.entries(entries)){
   if(typeof c.at!=='number'||c.at>clock||m.handled?.[uid]?.[id])continue;intents.push({uid,id,c});
 }
 intents.sort((a,b)=>a.c.at-b.c.at||a.uid.localeCompare(b.uid)||a.id.localeCompare(b.id));
 for(const {uid,id,c}of intents){
   // A sequence gap is deferred, never consumed. Replayed network duplicates
   // carry the original immutable stamp and cannot move an answer forward.
   if(c.type==='answer'&&c.seq>(m.game.seq[uid]||0)+1)continue;
   m.handled ||= {};m.handled[uid] ||= {};m.handled[uid][id]=true;
   if(m.game.result)continue;
   if(!m.game.ids.includes(uid)){
    if(c.at>=m.game.startAt&&c.type==='cheer'&&m.game.ids.includes(c.target)&&!uid.startsWith('cheer_')&&!Object.values(m.accounts||{}).includes(c.account)){
     try{m.game=E.step(m.game,c.target,{type:'cheer',viewer:c.account,actor:uid,seq:c.seq},Math.max(c.at,m.game.time))}
     catch(e){if(!['CHEER_LIMIT','PLAYER_CANNOT_CHEER'].includes(e.message))throw e;m.rejected ||= {};m.rejected[uid]={seq:c.seq,code:e.message}}
    }
    continue;
   }
   if(c.type==='leave'){
    if(c.at<m.game.startAt){m.phase='cancelled';return m}
    m.game=E.step(m.game,uid,{type:'heartbeat'},Math.max(c.at,m.game.time));
    if(!m.game.result){m.game.states[uid].hp=0;m.game.states[uid].eliminatedAt=m.game.time;m.game=E.step(m.game,uid,{type:'heartbeat'},m.game.time+1);if(m.game.result)m.game.result.reason='leave';}continue;
   }
   if(c.type!=='answer')continue;
   if(c.seq<=(m.game.seq[uid]||0))continue;
   if(c.at<m.game.startAt){m.rejected ||= {};m.rejected[uid]={seq:c.seq,code:'BEFORE_START'};m.game.seq[uid]=c.seq;continue;}
   try{m.game=E.step(m.game,uid,c,Math.max(c.at,m.game.time))}
   catch(e){if(!['STALE_QUESTION','FROZEN','INVALID_TILES','KO'].includes(e.message))throw e;m.rejected ||= {};m.rejected[uid]={seq:c.seq,code:e.message}}
   m.game.seq[uid]=c.seq;
 }
 if(!m.game.result && clock>=m.game.startAt)m.game=E.step(m.game,m.game.ids[0],{type:'heartbeat'},Math.max(clock,m.game.time));
 return m;
}
module.exports={pump};
