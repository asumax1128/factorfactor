const E=require('../server/online-rated/engine.cjs'),{pump}=require('./b2-pump.cjs'),{tx}=require('./online-spark-client.cjs');
const stamp=()=>({'.sv':'timestamp'}),clean=x=>JSON.parse(JSON.stringify(x));
async function prepare({db,code,state}){
 const ref=db.ref(`games/factor/rooms/${code}/b2/${state.gid}`);
 await ref.child('clock').set(stamp());const now=(await ref.child('clock').get()).val();
 const startAt=now+3800,game=E.begin(state.gid,state.diff,'B',state.players,state.seed,startAt,{rules:'b2',duration:state.duration||90});
 await ref.update({game,accounts:state.accts||{},phase:'play',revision:0,clock:now});return startAt;
}
function create({db,code,state,uid,isHost,onView,onError}){
 const ref=db.ref(`games/factor/rooms/${code}/b2/${state.gid}`);let current=null,busy=false,closed=false;
 const listener=s=>{current=s.val();if(current?.game){onView(current);if(isHost&&Object.entries(current.inputs||{}).some(([u,entries])=>Object.keys(entries).some(id=>!current.handled?.[u]?.[id])))queueMicrotask(process)}};ref.on('value',listener,onError);
 async function process(){if(!isHost||closed||busy||!current?.game||current.game.result)return;busy=true;try{
  await ref.child('clock').set(stamp());const clock=(await ref.child('clock').get()).val();
  await tx(ref,raw=>{if(!raw?.game)return raw;const n=pump(raw,Math.max(clock,raw.game.time));n.revision=(raw.revision||0)+1;return clean(n)});
 }catch(e){onError?.(e)}finally{busy=false}}
 const timer=isHost?setInterval(process,500):null;
 async function request(command){const input=command.type==='cheer'?`c${command.seq}`:command.type==='answer'?`a${command.seq}`:'leave';await tx(ref.child(`inputs/${command.type==='cheer'?'cheer_'+command.account:uid}/${input}`),old=>old||clean({...command,at:stamp()}));await process();return current;}
 return{request,process,view:raw=>E.view(raw.game,uid),close(){closed=true;clearInterval(timer);ref.off('value',listener)}};
}
module.exports={prepare,create};
