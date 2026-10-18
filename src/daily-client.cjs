const D=require('./daily-model.cjs'), Play=require('../server/daily-play.cjs'), {tx}=require('./online-spark-client.cjs');
const ROOT='games/factor/dailyV2',stamp=()=>({'.sv':'timestamp'}),clean=x=>JSON.parse(JSON.stringify(x));
const localReservations=new WeakMap();
async function reserveSerial(db,path,operation){let queues=localReservations.get(db);if(!queues){queues=new Map();localReservations.set(db,queues);}const previous=queues.get(path)||Promise.resolve(),task=previous.catch(()=>{}).then(operation);queues.set(path,task);try{return await task}finally{if(queues.get(path)===task)queues.delete(path)}}
function create({db,uid,account,storage=globalThis.localStorage}){
 const key=account?.key;if(!key)throw Error('登録アカウントでログインしてください');
 const ref=p=>db.ref(`${ROOT}/${p}`),draftKey=`fxf_daily_v2:${key}`;
 async function clock(){await ref(`clock/${uid}`).set(stamp());return(await ref(`clock/${uid}`).get()).val()}
 async function status(){const now=await clock(),day=D.epoch(now),ledger=(await ref(`attempts/${key}/${day}`).get()).val();return{now,day,used:Object.keys(ledger?.slots||{}).length}}
 async function start(difficulty){
  if(!['easy','normal','hard'].includes(difficulty))throw Error('INVALID_DIFFICULTY');
  let draft;try{draft=JSON.parse(storage?.getItem(draftKey)||'null')}catch(_){}
  // A retry after a lost acknowledgement uses its original day and reservation.
  if(draft){const old=(await ref(`attempts/${key}/${draft.day}`).get()).val();const found=Object.entries(old?.slots||{}).find(([,a])=>a.id===draft.id);if(found&&draft.status==='reserving'&&!found[1].result){storage?.setItem(draftKey,JSON.stringify({...draft,status:'started'}));return{...found[1],day:draft.day,slot:found[0],used:Object.keys(old.slots).length};}if(found)storage?.removeItem(draftKey);}
  const now=await clock(),day=D.epoch(now),id=draft?.status==='reserving'&&draft.day===day?draft.id:globalThis.crypto.randomUUID(),seed=draft?.status==='reserving'&&draft.day===day?draft.seed:globalThis.crypto.randomUUID();
  // Prepare and validate the first board before consuming a right.
  Play.begin(difficulty,seed,now);
  const attempt={id,seed,difficulty,at:stamp()};storage?.setItem(draftKey,JSON.stringify({id,day,seed,difficulty,status:'reserving'}));
  let saved=await reserveSerial(db,`${key}/${day}`,()=>tx(ref(`attempts/${key}/${day}`),ledger=>D.reserve(ledger,attempt).ledger));
  const [slot,a]=Object.entries(saved.slots).find(([,x])=>x.id===id);
  await ref(`playedDays/${key}/${day}`).set(true).catch(()=>{});
  storage?.setItem(draftKey,JSON.stringify({id,day,status:'started'}));
  return{day,slot,id,difficulty,seed,at:a.at,used:Object.keys(saved.slots).length};
 }
 async function publish(attempt,result){
  const proof=(await ref(`attempts/${key}/${attempt.day}/slots/${attempt.slot}/result`).get()).val();if(!proof)throw Error('RESULT_REQUIRED');
  const record={...proof,key,day:attempt.day,name:account.name,slot:attempt.slot};record.sortKey=D.sortKey(record);
  const board=ref(`boards/${attempt.day}/${attempt.difficulty}`);
  for(let tries=0;tries<5;tries++){
   const [mineS,leadS]=await Promise.all([board.child(`records/${key}`).get(),board.child('leader').get()]);
   const mine=mineS.val(),leader=leadS.val();if(mine&&D.compare(mine,record)<=0)return mine;
   const top=!leader||D.compare(record,leader)<0?record:leader;
   try{await board.update({[`records/${key}`]:record,leader:top});return record}catch(e){if(tries===4)throw e;}
  }
 }
 async function finish(attempt,state){
  await ref(`playedDays/${key}/${attempt.day}`).set(true);
  const result={score:Math.max(0,Math.round(state.score)),cleared:!!state.cleared,elapsed:Math.max(0,Math.round(state.elapsed||state.time-state.startAt)),correct:state.correct||0,confirmedAt:stamp(),id:attempt.id};
  await tx(ref(`attempts/${key}/${attempt.day}/slots/${attempt.slot}/result`),old=>old||result);
  const record=await publish(attempt,result);storage?.removeItem(draftKey);return record;
 }
 async function rankings(day,difficulty){const s=await ref(`boards/${day}/${difficulty}/records`).orderByChild('sortKey').limitToFirst(10).get();const rows=[];s.forEach(x=>{rows.push(x.val())});return rows.sort(D.compare)}
 async function awards(){
  const now=await clock(),days=(await ref(`playedDays/${key}`).get()).val()||{},had=(await ref(`titles/${key}`).get()).val()||{};
  const cursor=(await ref(`awardCursor/${key}`).get()).val()||0;
  const work=Object.keys(days).map(Number).filter(d=>d>cursor&&D.finalizable(d,now)).sort((a,b)=>a-b).slice(0,10);
  // 天下統一: one JST day, all three divisions, proven by that day's immutable finals. Never from separate days, never from
  // the three division flags alone. The value stays `true` (what the current rules and every reader expect).
  const grantKing=async()=>{await ref(`titles/${key}/daily_king`).set(true);had.daily_king=true;};
  const finalsOf=async day=>{const o={};for(const d of Object.keys(D.awardIds))o[d]=(await ref(`finals/${day}/${d}`).get()).val();return o;};
  for(const day of work){
   const fin={};
   for(const d of Object.keys(D.awardIds)){
    const finalRef=ref(`finals/${day}/${d}`);let final=(await finalRef.get()).val();
    if(!final){const leader=(await ref(`boards/${day}/${d}/leader`).get()).val();if(leader){try{await finalRef.set(leader);final=leader}catch(e){final=(await finalRef.get()).val();if(!final)throw e;}}}
    fin[d]=final;
    if(final?.key===key&&!had[D.awardIds[d]])had[D.awardIds[d]]=await tx(ref(`titles/${key}/${D.awardIds[d]}`),old=>old||{day});
   }
   if(!had.daily_king&&D.kingDay(day,fin,key))await grantKing();
   await ref(`awardCursor/${key}`).set(day);
  }
  if(work.length===10)return awards();
  // Past same-day wins (days already behind the cursor): only when the records PROVE one day. Holders of all three division
  // titles without 天下統一 are the only ones who can qualify, so only they are looked at.
  if(!had.daily_king&&Object.values(D.awardIds).every(id=>had[id])){
   const stored=D.sameStoredDay(had);
   if(stored!==null&&D.kingDay(stored,await finalsOf(stored),key))await grantKing();
   if(!had.daily_king){
    const scanKey=`fxf_daily_king_scan_v1:${key}`;let last=0;try{last=Number(storage?.getItem(scanKey))||0}catch(_){}
    const past=Object.keys(days).map(Number).filter(d=>d>last&&D.finalizable(d,now)&&!work.includes(d)&&d!==stored).sort((a,b)=>a-b);
    for(const day of past){if(D.kingDay(day,await finalsOf(day),key)){await grantKing();break;}}
    // a day is remembered as checked only after every read of the scan succeeded (a failure retries next time)
    if(!had.daily_king&&past.length)try{storage?.setItem(scanKey,String(past.at(-1)))}catch(_){}
   }
  }
  return had;
 }
 return{status,start,finish,publish,rankings,awards,clock};
}
module.exports={create,Play,model:D,ROOT};
