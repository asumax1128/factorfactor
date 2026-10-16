'use strict';
// Stage (b): deterministic replay of ONE player's answers from a sealed operation log, using the
// ORIGINAL makeBank/seed, tile ids and polyEqual/multiply. Nothing speed-dependent is confirmed (J3).
// Anything that cannot be reproduced exactly stays unconfirmed; nothing is guessed.
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),Store=require('./emulator-store.cjs'),{ref,get}=require('firebase/database');
const source=fs.readFileSync(require.resolve('./c-source.js'),'utf8'),engineHash=crypto.createHash('sha256').update(source).digest('hex');
const version=(()=>{const v=JSON.parse(fs.readFileSync(require.resolve('../../version.json'),'utf8'));return v.major+'.'+v.minor})();
// A fresh sandbox per use: own Math/Date, controllable clock for engine comparison tests.
function sandbox(){const clock={t:0};class Clock extends Date{static now(){return clock.t}}
 const noop=()=>{},sink=new Proxy({},{get:(_,k)=>k==='transaction'||k==='set'?()=>Promise.resolve():noop});
 return{clock,api:new vm.Script(source).runInNewContext({Date:Clock,fref:()=>sink,TSV:()=>({}),fbNow:()=>clock.t},{timeout:5000})}}
const NOT_CONFIRMED=['score','judgment','attackAmount','healAmount','specialGauge','hp','clear','ko','teamEffects'];
const MAX_SKIP=200,OJ=/^oj_[a-z0-9]{1,20}$/,TILE=/^q([1-9])_(\d{1,4})_(\d{1,2})$/;
// Reasons a game may not get a new confirmed record at all.
function eligibility(pin,{expectVersion=version,hash=engineHash}={}){
 const r=[];
 if(!pin||!Array.isArray(pin.ids)||pin.mode!=='C')r.push('NOT_A_PINNED_C_GAME');
 if(pin?.cpu)r.push('CPU_GAME');
 if(typeof pin?.seed!=='string'||!pin.seed)r.push('NO_SEED');
 if(!Number.isFinite(pin?.pinnedAt)||!Number.isFinite(pin?.startAt)||pin.pinnedAt>pin.startAt)r.push('NOT_PINNED_BEFORE_START');
 if(!pin?.clientVersion||pin.clientVersion!==expectVersion)r.push('CLIENT_VERSION_MISMATCH');
 if(pin?.engineHash!==hash)r.push('ENGINE_CHANGED');
 return r;
}
function replaySolo({pin,uid,entries,prevSat=null,expectVersion,hash}){
 const out=(o)=>({engineHash,notConfirmed:NOT_CONFIRMED,...o});
 const why=eligibility(pin,{expectVersion,hash});if(why.length)return out({confirmed:false,reasons:why});
 if(!pin.ids.includes(uid))return out({confirmed:false,reasons:['NOT_A_PARTICIPANT']});
 const {api}=sandbox(),cfg=api.DIFFICULTY_CONFIG[pin.diff];if(!cfg)return out({confirmed:false,reasons:['UNKNOWN_DIFFICULTY']});
 const bank=api.makeBank(pin.seed,cfg.tileCount);
 let c=0,combo=0,best=0,curB=-1,cur=null,exact=true,specials=0,wrong=0,ojWrong=0;const served={},steps=[],unattributed=[];
 const serve=()=>{const lv=bank.level(c+1),k=served[lv]||0;served[lv]=k+1;curB++;cur={b:curB,level:lv,k,board:bank.get(lv,k)}};
 serve();let lastSat=pin.startAt;
 const fail=(reason,i)=>out({confirmed:false,reasons:[reason],at:i});
 const answers=entries.filter(e=>e.k==='answer');specials=entries.length-answers.length;
 for(const [i,e] of answers.entries()){
  if(!Number.isInteger(e.q)||e.q<curB)return fail('BOARD_REWIND_OR_DUPLICATE',i);
  if(e.q-curB>MAX_SKIP)return fail('SKIP_TOO_LARGE',i);
  if(e.q>curB){ // boards the player never answered: miss or timeout, NOT distinguishable => unattributed
   const n=e.q-curB,gap=e.sat-lastSat,plausible=gap>=n*api.QUESTION_TIMEOUT_MS;
   for(;curB<e.q;){unattributed.push({b:cur.b,level:cur.level,timeoutPlausible:plausible,gapMs:gap});combo=0;exact=false;serve()}
  }
  const[id1,id2]=e.a||[];if(!id1||!id2||id1===id2)return fail('BAD_TILE_PAIR',i);
  const byId=Object.fromEntries(cur.board.tiles.map(t=>[t.id,t]));let ok=false,kind;
  for(const id of [id1,id2]){if(byId[id])continue;if(OJ.test(id))continue;return fail('TILE_NOT_ON_BOARD',i)}
  if(OJ.test(id1)||OJ.test(id2)){kind='ojama-wrong';ojWrong++;// the original addOjama rejects any factor that pairs into the answer
  }else{ok=api.polyEqual(api.multiply(byId[id1].factor,byId[id2].factor),cur.board.poly);kind=ok?'correct':'wrong';}
  if(ok){c++;combo++;best=Math.max(best,combo)}else{combo=0;wrong++}
  steps.push({b:cur.b,level:cur.level,k:cur.k,kind,c,combo,sat:e.sat,exact});lastSat=e.sat;
  serve();
 }
 return out({confirmed:true,reasons:[],uid,player:{correct:c,combo,bestCombo:best,wrong,ojamaWrong:ojWrong,answered:steps.length,unattributedMisses:unattributed.length,nextBoard:curB,claimedSpecials:specials,
  // exact: no unanswered board anywhere before this point => counts are exact; otherwise lower bounds only
  countsExact:exact},steps,unattributed});
}
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const resultDigest=r=>crypto.createHash('sha256').update(JSON.stringify(canon(JSON.parse(JSON.stringify(r))))).digest('hex');
function create({database:db}){
 Store.assertEmulator(db);
 const gref=(code,gid)=>ref(db,`${Store.ROOT}/c/${code}_${gid}`);
 // Replays one player from the SEALED log and stores the result once, bound to the seal digest.
 async function store(code,gid,uid,hooks={}){
  const g=(await get(gref(code,gid))).val();
  if(!g?.inputs)throw Error('NOT_SEALED');
  const CI=require('./c-input.cjs').create({database:db}),v=await CI.read(code,gid);
  if(!v.consistent)throw Error('INPUT_LOG_INCONSISTENT');
  if(!(await CI.verifySeal(code,gid)).ok)throw Error('SEAL_NOT_VERIFIED');
  const entries=(v.players[uid]?.entries||[]).filter(e=>e.sat<=g.final.endAt);
  const computed={...replaySolo({pin:g,uid,entries,...hooks}),inputsDigest:g.inputs.digest},result={...computed,resultDigest:resultDigest(computed)};
  let conflict=false;
  const out=await Store.atomic(gref(code,gid),old=>{conflict=false;if(old==null)return old;if(old.inputs?.digest!==g.inputs.digest)throw Error('SEAL_CHANGED');
   const have=old.replay?.[uid];if(have){conflict=have.resultDigest!==result.resultDigest;return old}
   return{...old,replay:{...(old.replay||{}),[uid]:JSON.parse(JSON.stringify(result))}}});
  if(conflict)throw Error('REPLAY_MISMATCH');
  return out.replay[uid];
 }
 return{store};
}
module.exports={replaySolo,eligibility,sandbox,create,engineHash,version,NOT_CONFIRMED};
