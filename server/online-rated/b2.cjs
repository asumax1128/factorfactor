// Timed online B only. Legacy CPU/C engines and in-flight B v1 matches stay intact.
const copy = x => JSON.parse(JSON.stringify(x));
const POINTS = {1:10,2:12,3:14,4:16,5:18,6:20,7:30,8:40,9:50};
const heal = ms => ms<=2000?25:ms<=3000?20:ms<=5000?15:ms<=10000?10:ms<=15000?5:2;
const cap = d => d==='easy'?6:3;
function event(m,uid,type,payload){m.visualEvents ||= [];m.visualSeq=(m.visualSeq||0)+1;m.visualEvents.push({id:m.visualSeq,uid,type,payload});m.visualEvents=m.visualEvents.slice(-32)}
// Additive, match-scoped record; old in-flight games deliberately remain without a trace.
function scoreEvent(m,uid,gain){if(!m.scoreTrace)return;const t=m.scoreTrace;t.seq++;t.events.push({id:t.seq,at:m.time,uid,gain,scores:Object.fromEntries(m.ids.map(u=>[u,m.states[u].score]))});}
function board(m,s,bank,api,at){
  const lv=bank.level(s.c+1),k=s.served[lv]||0;s.served[lv]=k+1;
  const b=bank.get(lv,k),tiles=copy(b.tiles);
  s.oj=Math.min(cap(m.difficulty),s.oj+s.queued);s.queued=0;
  if(s.cheerPoints===30 && s.oj>0 && s.cheerRemoved<3){s.oj--;s.cheerRemoved++;s.cheerPoints=0}
  let guard=0;
  while(tiles.length<b.tiles.length+s.oj && guard<400){
    const f=bank.get(lv,k+77+guard).tiles[guard%b.tiles.length].factor;guard++;
    if(tiles.some(t=>JSON.stringify(t.factor)===JSON.stringify(f)||api.polyEqual(api.multiply(t.factor,f),b.poly)))continue;
    // Insert at a deterministic varying slot. No distinguishing ojama property/style.
    tiles.splice((guard*7)%(tiles.length+1),0,{id:`oj${s.serial}_${guard}`,factor:copy(f)});
  }
  s.cur={level:lv,k,poly:copy(b.poly),tiles,oj:tiles.length-b.tiles.length};
  s.qStart=at;s.comboDue=at+10000;s.resolving=false;s.nextAt=null;s.serial++;
}
function begin(base,duration,bank,api){
  if(![60,90,120,180].includes(duration))throw Error('INVALID_DURATION');
  const m=copy(base);m.rules='b2';m.duration=duration;m.endAt=m.startAt+duration*1000;m.visualEvents=[];
  m.states=Object.fromEntries(m.ids.map(u=>[u,{hp:100,c:0,score:0,combo:0,best:0,gauge:0,sp:0,freezeUntil:0,oj:0,queued:0,pending:0,pendQ:[],cancelFull:0,counterUntil:0,cheerPoints:0,cheerRemoved:0,serial:0,served:{},hist:[],resolving:false,nextAt:null}]));
  for(const u of m.ids)board(m,m.states[u],bank,api,m.startAt);
  m.scoreTrace={version:1,complete:true,seq:0,events:[{id:0,at:m.startAt,scores:Object.fromEntries(m.ids.map(u=>[u,0]))}]};
  return m;
}
function finish(m,reason){
  const dead=m.ids.filter(u=>m.states[u].hp<=0),top=Math.max(...m.ids.map(u=>m.states[u].score));
  const alive=m.ids.filter(u=>!dead.includes(u));
  const best=Math.max(...alive.map(u=>m.states[u].score));
  const winners=reason==='ko'?alive:alive.filter(u=>m.states[u].score===best);
  m.result={winner:winners.length===1?winners[0]:null,draw:winners.length!==1,reason,at:m.time};
  const order=[...m.ids].sort((a,b)=>(Number(m.states[b].hp>0)-Number(m.states[a].hp>0)) || (m.states[b].eliminatedAt||0)-(m.states[a].eliminatedAt||0) || m.states[b].score-m.states[a].score);
  const rank={};order.forEach((u,i)=>{const p=order[i-1],s=m.states[u],prev=m.states[p];rank[u]=p&&((s.hp>0&&prev.hp>0&&s.score===prev.score)||(s.hp<=0&&prev.hp<=0&&s.eliminatedAt===prev.eliminatedAt))?rank[p]:i+1});m.result.rank=rank;
}
function ko(m){for(const u of m.ids)if(m.states[u].hp<=0&&m.states[u].eliminatedAt==null)m.states[u].eliminatedAt=m.time;const alive=m.ids.filter(u=>m.states[u].hp>0);if(alive.length<=1){finish(m,'ko');return true}return false}
function target(m,uid,requested){return m.ids.find(u=>u===requested&&u!==uid&&m.states[u].hp>0)||m.ids.slice(m.ids.indexOf(uid)+1).concat(m.ids).find(u=>u!==uid&&m.states[u].hp>0)}
function automatic(m){
  for(const u of m.ids){const s=m.states[u],to=target(m,u,s.target),o=m.states[to];if(s.hp<=0||!o)continue;
    if(s.gauge===100 && o.freezeUntil<=m.time){s.spUsed=(s.spUsed||0)+1;s.gauge=s.sp=0;o.freezeUntil=m.time+3000;event(m,to,'freeze',{until:o.freezeUntil,from:u})}
  }
}
function advance(m,to,bank,api){
  m.seq ||= {};for(const s of Object.values(m.states)){s.hist ||= [];s.served ||= {};}
  if(to<m.time)throw Error('CLOCK_REVERSED');
  while(!m.result && m.time<to){
    let t=Math.min(to,m.endAt);
    for(const u of m.ids){const s=m.states[u],f=s.freezeUntil>m.time;if(s.hp<=0)continue;
      t=Math.min(t,m.time+s.hp*1000,s.qStart+20000);
      for(const d of [s.nextAt,f?s.freezeUntil:0,!f&&!s.resolving&&s.combo>0?s.comboDue+1:0,!f&&s.pending?s.counterUntil:0])if(d>m.time)t=Math.min(t,d);
    }
    if(t<=m.time)t=Math.min(to,m.time+1);
    const dt=t-m.time;
    for(const u of m.ids){const s=m.states[u];if(s.freezeUntil>m.time){if(s.combo>0)s.comboDue+=dt;if(s.pending)s.counterUntil+=dt}s.hp=Math.max(0,Math.round((s.hp-dt/1000)*1e6)/1e6);s.minHp=Math.min(s.minHp??100,s.hp);if(Math.max(...m.ids.filter(v=>v!==u).map(v=>m.states[v].score))-s.score>=40)s.behind=true;}
    m.time=t;
    // A single common priority: natural KO, then match deadline, then timed effects.
    if(ko(m))break;
    if(t>=m.endAt){finish(m,'time');break}
    for(const u of m.ids){const s=m.states[u],f=s.freezeUntil>t;if(s.hp<=0)continue;
      if(!f&&!s.resolving&&s.combo>0&&s.comboDue<t)s.combo=0;
      if(!f&&s.pending&&s.counterUntil<=t){s.queued=Math.min(cap(m.difficulty)-s.oj,s.queued+s.pending);s.pending=0;s.pendQ=[];s.counterUntil=0}
      if(s.resolving&&s.nextAt<=t)board(m,s,bank,api,s.nextAt);
      if(!s.resolving&&s.qStart+20000<=t){s.combo=0;s.hp=Math.max(0,s.hp-(m.difficulty==='normal'?5:0));s.hist.push({lv:s.cur.level,k:s.cur.k,ok:false,timeout:true,ms:20000});s.resolving=true;s.nextAt=t+420;s.qStart=t;}
    }
    if(ko(m))break;
    automatic(m);
  }
  return m;
}
function step(raw,uid,cmd,now,bank,api){
  const m=advance(copy(raw),now,bank,api);if(m.result)return m;
  const s=m.states[uid],to=target(m,uid,cmd.target),o=m.states[to];
  if(!s)throw Error('NOT_PARTICIPANT');
  if(cmd.type==='heartbeat')return m;
  if(cmd.type==='cheer'){
    const actor=cmd.actor||cmd.viewer;if(m.ids.includes(actor)||m.ids.includes(cmd.viewer))throw Error('PLAYER_CANNOT_CHEER');m.cheerReceipts ||= {};const id=actor+':'+cmd.seq;
    if(m.cheerReceipts[id])return m;const used=Object.values(m.cheerReceipts).filter(x=>x.viewer===cmd.viewer).length;
    const actorUsed=Object.values(m.cheerReceipts).filter(x=>(x.actor||x.viewer)===actor).length;if(used>=3||actorUsed>=3||!Number.isInteger(cmd.seq)||cmd.seq<1||cmd.seq>3)throw Error('CHEER_LIMIT');m.cheerReceipts[id]={viewer:cmd.viewer,actor,target:uid};s.cheerPoints=Math.min(30,s.cheerPoints+10);return m;
  }
  if(cmd.type==='special')throw Error('FREEZE_IS_AUTOMATIC');
  if(s.hp<=0)throw Error('KO');
  s.target=to;
  if(s.freezeUntil>now)throw Error('FROZEN');
  if(s.resolving||cmd.question!==`${s.cur.level}:${s.cur.k}`)throw Error('STALE_QUESTION');
  const fs=cmd.tiles?.map(id=>s.cur.tiles.find(t=>t.id===id)?.factor);
  if(fs?.length!==2||cmd.tiles[0]===cmd.tiles[1]||fs.some(f=>!f))throw Error('INVALID_TILES');
  const ok=api.polyEqual(api.multiply(...fs),s.cur.poly),ms=now-s.qStart;
  if(ok){
    s.combo++;s.best=Math.max(s.best,s.combo);const recovery=heal(ms),P=Math.round(POINTS[s.cur.level]*(1+.1*(s.combo-1)))+Math.max(0,Math.round(s.hp+recovery-100));
    const bonus=Math.round(P*.1*s.cur.oj);s.score+=P+bonus;s.hp=Math.min(100,s.hp+recovery);s.c++;s.oj=Math.max(0,s.oj-1);
    let attack=s.combo===1?0:s.combo===2?1:s.combo===3?2:3;
    if(s.pending&&s.counterUntil>now){const cancel=Math.min(s.pending,attack);s.cancelTotal=(s.cancelTotal||0)+cancel;cancelEvents(s,cancel);s.pending-=cancel;attack-=cancel;if(!s.pending)s.counterUntil=0;}
    const room=Math.max(0,cap(m.difficulty)-o.oj-o.queued-o.pending),arrived=Math.min(attack,room);
    if(arrived){s.ojSent=(s.ojSent||0)+arrived;if(!o.pending)o.counterUntil=now+3000;queueArrival(o,arrived);o.pending+=arrived;event(m,to,'incoming',{oj:arrived,until:o.counterUntil})}
    if(s.combo>=2&&s.gauge<100)s.gauge=Math.min(100,s.gauge+s.cur.level*3);s.sp=s.gauge;
    s.hist.push({lv:s.cur.level,k:s.cur.k,ok:true,ms,j:api.getJudgment(ms).label,gain:P+bonus,base:P,bonus,oj:s.cur.oj});
    scoreEvent(m,uid,P+bonus);
    if(ms<=2000)s.perfects=(s.perfects||0)+1;
    automatic(m);
  }else{s.combo=0;const dmg=m.difficulty==='easy'?20:25;s.dmgTaken=(s.dmgTaken||0)+dmg;s.hp=Math.max(0,s.hp-dmg);s.minHp=Math.min(s.minHp??100,s.hp);s.hist.push({lv:s.cur.level,k:s.cur.k,ok:false,ms});}
  s.resolving=true;s.nextAt=now+420;s.qStart=now;
  ko(m);return m;
}
// Ver.6.0 A8: bookkeeping of attack EVENTS waiting in `pending` (the amount logic above is unchanged). pendQ holds the size of
// each arrived attack still waiting, oldest first. A cancel consumes the oldest first; an event whose remainder reaches 0 was
// cancelled completely and is counted once in cancelFull. A partly cancelled event that later lands is never counted.
function pendQueue(s){return Array.isArray(s.pendQ)?s.pendQ:(s.pendQ=s.pending>0?[s.pending]:[])}
function queueArrival(o,arrived){pendQueue(o).push(arrived)}
function cancelEvents(s,c){const q=pendQueue(s);while(c>0&&q.length){const t=Math.min(c,q[0]);q[0]-=t;c-=t;if(q[0]<=0){q.shift();s.cancelFull=(s.cancelFull||0)+1}}}
function view(m,uid){const s=m.states[uid];return {id:m.id,mode:'B',difficulty:m.difficulty,rules:'b2',result:m.result||null,question:`${s.cur.level}:${s.cur.k}`,poly:s.cur.poly,tiles:s.cur.tiles,level:s.cur.level,startAt:s.qStart,timeoutMs:20000,acceptedSeq:m.seq?.[uid]||0,visualEvents:m.visualEvents||[],resolving:s.resolving,combo:s.combo,readyAt:s.nextAt||s.qStart,endAt:m.endAt,freezeUntil:s.freezeUntil,live:copy(m.states)};}
module.exports={begin,step,view,advance,heal,cap,POINTS};
