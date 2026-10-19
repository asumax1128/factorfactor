const E=require('../server/online-rated/engine.cjs'),{pump}=require('./b2-pump.cjs'),{tx}=require('./online-spark-client.cjs');
// Shared-state stall detection (participants only). The host's browser writes `clock` (server time) and bumps `revision` on
// every tick (500 ms, <=1 s when the tab is in the background), so a long gap in BOTH means the shared state is not being processed.
// Nothing here concludes that the host disconnected, and nothing here writes game, result, rating, EXP or title data.
const config={warnMs:10000,leaveMs:20000,readMs:4000};
function health({online=true,serverAge=null,localAge=0,lagMs=0},cfg=config){
 if(online===false)return 'offline';                       // our own connection is down: never blame the shared state
 const age=serverAge==null?localAge:Math.min(serverAge,localAge);  // both clocks must agree; a fresh reconnect/resume restarts localAge
 const worst=Math.max(age,lagMs);                          // lagMs: host is writing but the game is not being processed (see processing())
 return worst>=cfg.leaveMs?'stopped':worst>=cfg.warnMs?'warn':'ok';
}
// "Host alive" (clock/revision move) is not "game processed". While a match runs the host's every tick also advances game.time to the
// server clock, and consumes every input whose stamp has passed. So a healthy match -- even with nobody answering -- has lag ~ one tick.
// lag = how far game.time is behind the clock, or how long one of MY next-expected inputs has been left unhandled.
function processing(raw,uid){
 const g=raw?.game,clock=raw?.clock;if(!g||typeof clock!=='number'||g.result)return 0;
 let lag=0;if(clock>=g.startAt+2000&&typeof g.time==='number')lag=Math.max(lag,clock-g.time);
 for(const [id,c] of Object.entries(raw.inputs?.[uid]||{})){
  if(!c||typeof c.at!=='number'||c.at>clock||raw.handled?.[uid]?.[id])continue;
  if(c.type==='answer'&&c.seq!==(g.seq?.[uid]||0)+1)continue;   // a sequence gap is deferred by design, never "unhandled"
  lag=Math.max(lag,clock-c.at);
 }
 return lag;
}
// Monotonic: a snapshot may never move the view backwards (late get() vs. live listener) and a confirmed result is never un-confirmed.
const newer=(prev,next)=>!prev?.game?true:!next?.game?!prev.game.result:!(prev.game.result&&!next.game.result)&&(next.revision||0)>=(prev.revision||0);
const decide=read=>!read||!read.ok?'unreadable':read.result?'result':'unconfirmed';
const stamp=()=>({'.sv':'timestamp'}),clean=x=>JSON.parse(JSON.stringify(x));
async function prepare({db,code,state}){
 const path=`games/factor/rooms/${code}/b2/${state.gid}`,ref=db.ref(path),sub=p=>db.ref(path+'/'+p);
 await sub('clock').set(stamp());const now=(await sub('clock').get()).val();
 const startAt=now+3800,game=E.begin(state.gid,state.diff,'B',state.players,state.seed,startAt,{rules:'b2',duration:state.duration||90});
 await ref.update({game,...(state.localPractice?{cpu:state.cpu||{}}:{}),accounts:state.accts||{},phase:'play',revision:0,clock:now});return startAt;
}
function create({db,code,state,uid,isHost,onView,onError,localBots}){
 const path=`games/factor/rooms/${code}/b2/${state.gid}`,ref=db.ref(path),sub=p=>db.ref(path+'/'+p);let current=null,busy=false,closed=false;
 const listener=s=>{const v=s.val();if(!newer(current,v))return;current=v;if(current?.game){onView(current);if(isHost&&Object.entries(current.inputs||{}).some(([u,entries])=>Object.keys(entries).some(id=>!current.handled?.[u]?.[id])))queueMicrotask(process)}};ref.on('value',listener,onError);
 async function process(){if(!isHost||closed||busy||!current?.game||current.game.result)return;busy=true;try{
  await sub('clock').set(stamp());const clock=(await sub('clock').get()).val();if(closed)return;
  await tx(ref,raw=>{if(!raw?.game)return raw;const input=localBots?localBots(raw,clock,E.runtime(raw.game).api):raw;const n=pump(input,Math.max(clock,raw.game.time));n.revision=(raw.revision||0)+1;return clean(n)});
 }catch(e){if(!closed)onError?.(e)}finally{busy=false}}
 const timer=isHost?setInterval(process,localBots?100:500):null;
 async function refresh(){let timer;
  if(current?.game?.result)return{ok:true,result:current.game.result,source:'received'};   // already received: no read needed, it wins
  try{
   const snap=await Promise.race([ref.get(),new Promise((_,rej)=>{timer=setTimeout(()=>rej(Error('READ_TIMEOUT')),config.readMs)})]);
   if(closed)return{ok:false,error:'CLOSED'};const v=snap.val();if(!v?.game)return{ok:false,error:'EMPTY'};
   if(newer(current,v)){current=v;onView(v)}
   return{ok:true,result:current.game.result||null,clock:current.clock,revision:current.revision};   // best known state, never an older read
  }catch(e){return{ok:false,error:e.message}}finally{clearTimeout(timer)}}
 async function request(command){if(closed)return current;const input=command.type==='cheer'?`c${command.seq}`:command.type==='answer'?`a${command.seq}`:'leave';await tx(sub(`inputs/${uid}/${input}`),old=>old||clean({...command,at:stamp()}));await process();return current;}
 return{request,process,refresh,view:raw=>E.view(raw.game,uid),close(){closed=true;clearInterval(timer);ref.off('value',listener)}};
}
module.exports={prepare,create,health,decide,processing,newer,config};
