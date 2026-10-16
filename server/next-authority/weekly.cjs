'use strict';
const fs=require('node:fs'),vm=require('node:vm'),W=require('../../src/weekly-next.cjs'),Rewards=require('../../src/weekly-rewards-next.cjs');
function hydrate(w){for(const k of ['log','runs','damage','support','accounts','awards','receipts'])w[k] ||= {};w.log=Object.fromEntries(Object.entries(w.log).filter(([,v])=>v));for(const r of Object.values(w.runs)){r.fired ||= {};r.seen=Array.isArray(r.seen)?r.seen:Object.values(r.seen||{});r.chestLog=Array.isArray(r.chestLog)?r.chestLog:Object.values(r.chestLog||{});if(r.prob)for(const k of ['tiles','factors','factors2'])if(r.prob[k]&&!Array.isArray(r.prob[k]))r.prob[k]=Object.values(r.prob[k]);if(r.gim)r.gim.fired ||= {}}return w;}
const script=new vm.Script(fs.readFileSync(require.resolve('./weekly-source.js'),'utf8')),copy=x=>JSON.parse(JSON.stringify(x)),DAY=86400000;
function api(w,at,r){
 const math=Object.create(Math);math.random=()=>{w.rng=(Math.imul(w.rng,1664525)+1013904223)>>>0;return w.rng/4294967296};class Clock extends Date{static now(){return at}}let hook=0;
 return script.runInNewContext({Math:math,Date:Clock,useRef:x=>({current:hook++===0&&r?.gim?{...r.gim,fired:r.gim.fired||{}}:x}),FX:new Proxy({},{get:()=>()=>{}}),rectC:()=>null,qs:()=>null},{timeout:1000});
}
function info(w,a){const sorted=Object.fromEntries(Object.entries(w.damage).sort(([a],[b])=>a.localeCompare(b)));return a.weeklyInfo(w.week,sorted,w.meta,w.support)}
function log(w,type,actor,at,data={}){const revision=++w.revision;w.log[revision]={revision,type,actor,at,data};return revision}
function create({week,meta,seed=1,at}){if(!W.monday(week)||!Number.isSafeInteger(at)||at<Date.parse(week+'T00:00:00+09:00')||at>=Date.parse(week+'T00:00:00+09:00')+7*DAY)throw Error('INVALID_WEEK');const w={version:1,week,meta:copy(meta),seed:seed>>>0,rng:seed>>>0,time:at,revision:0,log:{},runs:{},damage:{},support:{},accounts:{},awards:{},receipts:{},closed:false};const a=api(w,at),i=info(w,a);if(i.boss.id!==meta.boss)throw Error('INVALID_BOSS');w.hpMax=i.hpMax;return w;}
function gim(w,r,at,a){const i=info(w,a);return a.useBossGim(i.T.gim||null,{active:r.status==='play',t0:r.startAt,hpRatio:Math.max(0,i.hp)/i.hpMax,checkpointRotation:true,ctl:{current:{rotate:()=>{if(r.pending)return false;r.prob.tiles.unshift(r.prob.tiles.pop());log(w,'rotate',r.account,at,{run:r.id,nextWave:r.gim?.nextWave});return true}}},onAbs:()=>{if(r.absExt>=15000)return false;r.absExt+=3000;r.endAt+=3000;return true}})}
function family(w,r,at,a,g){const i=info(w,a),sec=(at-r.startAt)/1000,win=a.wkWeakOf(i.boss.id).find(([x,y])=>sec>=x&&sec<y);return g.chFam||(win?(i.T.weakFam?a.RAID_FAMS.find(f=>f.id===i.T.weakFam):a.RAID_FAMS[a.hashSeed(`${r.startAt}:${win[0]}`)%a.RAID_FAMS.length]):null)}
function level(w,r,at,a,g,lv,how){let n=lv+(how==='up'?1:how==='miss'?-1:0);n=Math.max(1,Math.min(9,how==='init'?(info(w,a).rule?.id==='high'?3:1):n));const f=family(w,r,at,a,g);return f?[...f.lv].sort((x,y)=>Math.abs(x-n)-Math.abs(y-n))[0]:n}
function board(w,r,at,a,g,lv){const seen=new Set(r.seen||[]),b=g.buildProb?g.buildProb(lv,seen):{level:lv,...a.buildBoard(lv,seen,6)};if(r.oj){b.tiles=a.addOjama(b.tiles,b.poly,lv,r.oj);r.oj=0}r.prob=copy(b);r.seen=[...seen];r.qs=at;r.pending=null;log(w,'board',r.account,at,{run:r.id,level:lv});}
function manifest(w,kind,at){const a=api(w,at),i=info(w,a),rows=i.rows;for(let ix=0;ix<rows.length;ix++){const row=rows[ix],account=row.k;if(kind==='lastHit'&&w.kill.account!==account)continue;const m={version:1,source:'weekly-authority-v1',account,week:w.week,kind,id:`${w.week}_${kind}_${account}`,at,boss:i.boss.id,rank:ix+1,damage:row.d,hpMax:i.hpMax,rage:i.rage,exp:kind==='kill'?a.wkBonus(i,row):0,defeated:!!w.kill,...(kind==='lastHit'?{lastHitAccount:account,legacyCovered:false}:{})};Rewards.validate(m,account,w.week,kind);w.awards[account]||={};if(!w.awards[account][kind])w.awards[account][kind]=m;const data=w.accounts[account]||{stats:{}};w.accounts[account]=Rewards.apply(data,m);}}
function complete(w,r,at,a){if(r.status!=='play')return;r.status='done';const acct=w.accounts[r.account]||={stats:{}};r.reward=copy(a.devAward(acct.stats,r,{week:w.week,reservation:r.reservation}));w.accounts[r.account]=copy(acct);r.receipt={id:r.id,at,completed:true};log(w,'complete',r.account,at,{run:r.id,damage:r.d,reward:r.reward});}
function advance(w,until){
 hydrate(w);
 if(until<w.time)throw Error('STALE_AUTHORITY_TIME');if(w.closed)return;
 const cutoff=Date.parse(w.week+'T00:00:00+09:00')+7*DAY;until=Math.min(until,Math.max(cutoff,...Object.values(w.runs).filter(r=>r.status==='play').map(r=>r.endAt)));
 for(let safety=0;safety<10000;safety++){
  let next=null;for(const r of Object.values(w.runs)){if(r.status!=='play')continue;const a=api(w,w.time,r),i=info(w,a),g=gim(w,r,w.time,a),times=[{t:r.endAt,k:'end'}];if(r.pending)times.push({t:r.pending.at,k:'next'});
   for(const sec of a.wkCtrOf(i.boss.id))if(!r.fired['s'+sec])times.push({t:r.startAt+sec*1000,k:'counter',sec});
   const wave=i.T.gim==='wave'||i.T.gim==='king'&&g.kPh===3;if(wave&&!r.pending)times.push({t:r.startAt+(r.gim?.nextWave||5)*1000,k:'gim'});
   if(i.T.gim==='chimera')times.push({t:r.startAt+(Math.floor(Math.max(0,w.time-r.startAt)/12000)+1)*12000,k:'gim'});
   for(const e of times)if(e.t<=until&&(!next||e.t<next.t||e.t===next.t&&r.id<next.r.id))next={...e,r};
  }
  if(!next){w.time=until;break}const {r,k,sec}=next,at=Math.max(w.time,next.t);w.time=at;const a=api(w,at,r),g=gim(w,r,at,a),i=info(w,a);
  if(k==='end'){complete(w,r,at,a);continue}
  if(k==='counter'){r.fired['s'+sec]=true;const c=a.ctrOf(i.boss.id),phase=i.hp/i.hpMax<=.25?3:i.hp/i.hpMax<=.5?2:i.hp/i.hpMax<=.75?1:0,guarded=r.lastOk>0&&at-r.lastOk<=a.RAID_CTR_GUARD;const stun=c.stunByPhase?c.stunByPhase[phase]:c.stun;if(!guarded){r.stunUntil=Math.max(r.stunUntil,at+(stun||0));r.fogUntil=Math.max(r.fogUntil,at+(c.fog||0));r.oj=Math.min(4,r.oj+(c.oj||0))}log(w,'counter',r.account,at,{run:r.id,phase,guarded,stunUntil:r.stunUntil,fogUntil:r.fogUntil,oj:r.oj});}
  if(k==='next')board(w,r,at,a,g,r.pending.lv);
  g.tick();r.gim=copy(g.checkpoint());if(k==='gim')log(w,'gimmick',r.account,at,{run:r.id,state:copy(r.gim)});
  if(safety===9999)throw Error('AUTHORITY_EVENT_LIMIT');
 }
 if(until>=cutoff&&!Object.values(w.runs).some(r=>r.status==='play')){const closedAt=Math.max(cutoff,...Object.values(w.runs).map(r=>r.receipt?.at||0));w.time=closedAt;w.closed=true;log(w,'close','authority',closedAt);manifest(w,'final',closedAt);}
}
function execute(input,{account,id,type,payload={},at}){
 const w=hydrate(copy(input)),receiptKey=id;if(!/^[A-Za-z0-9_-]{1,64}$/.test(account)||!/^[A-Za-z0-9_-]{1,64}$/.test(id)||['__proto__','constructor','prototype'].includes(account)||['__proto__','constructor','prototype'].includes(id))throw Error('INVALID_REQUEST_ID');w.receipts[account] ||= {};if(w.receipts[account][receiptKey]){const old=w.receipts[account][receiptKey];if(old.type!==type||JSON.stringify(old.payload)!==JSON.stringify(payload))throw Error('CONFLICTING_REQUEST_ID');return w}
 advance(w,at);if(w.closed)throw Error('WEEK_CLOSED');let r=w.runs[payload.runId];
 if(type==='start'){
  if(at>=Date.parse(w.week+'T00:00:00+09:00')+7*DAY)throw Error('WEEK_ENTRY_CLOSED');
  if(info(w,api(w,at)).dead)throw Error('BOSS_DEFEATED');
  if(Object.values(w.runs).some(r=>r.account===account&&r.status==='play'))throw Error('ACTIVE_RUN_EXISTS');
  if(!['atk','sup'].includes(payload.role))throw Error('INVALID_ROLE');const day=W.day(at),used=Object.values(w.runs).filter(x=>x.account===account&&x.reservation.day===day).length;if(used>=5)throw Error('WEEKLY_DAILY_LIMIT');
  const runId=account.length+'_'+account+'_'+id;if(w.runs[runId])throw Error('RUN_ID_CONFLICT');const a=api(w,at);r=w.runs[runId]={id:runId,account,week:w.week,role:payload.role,reservation:{id:runId,day,at},startAt:at+600,endAt:at+600+a.wkSession(info(w,a)),status:'play',combo:0,streak:0,d:0,sp:0,n:0,pf:0,best:0,dp:{a:0,b:0,c:0},lastOk:0,absExt:0,stunUntil:0,fogUntil:0,oj:0,fired:{},chests:0,shards:0,chestExp:0,chestLog:[],chest:{on:false,n:0},seen:[]};const ar=api(w,r.startAt,r),g=gim(w,r,r.startAt,ar);board(w,r,at,ar,g,level(w,r,r.startAt,ar,g,1,'init'));r.qs=r.startAt;g.tick();r.gim=copy(g.checkpoint());
 }else{
  if(!r||r.account!==account)throw Error('NOT_RUN_OWNER');
  if(type==='answer'){
   if(r.status!=='play'||r.pending||at<r.startAt||at<r.stunUntil||payload.questionAt!==r.qs)throw Error('BOARD_NOT_READY');const a=api(w,at,r),g=gim(w,r,at,a),i=info(w,a),[x,y]=[payload.first,payload.second].map(id=>r.prob.tiles.find(t=>t.id===id));if(!x||!y||x.id===y.id)throw Error('INVALID_PAIR');const product=a.multiply(x.factor,y.factor),side=a.polyEqual(product,r.prob.poly)?'A':r.prob.poly2&&a.polyEqual(product,r.prob.poly2)?'B':null,lv=side==='B'?r.prob.level2||r.prob.level:r.prob.level,ms=at-r.qs;
   if(r.chest.on){r.chest.on=false;if(side){const c=a.chestRoll(true);r.chests++;r.shards+=c.shard||0;r.chestExp+=c.exp||0;r.chestLog.push(c.label)}}else if(side&&r.chest.n<2&&((w.rng=(Math.imul(w.rng,1664525)+1013904223)>>>0)/4294967296)<(i.rule?.id==='chest'?.18:.06)){r.chest.on=true;r.chest.n++}
   let next,damage=0,j=null;if(side){j=a.getJudgment(ms);const fam=family(w,r,at,a,g);let mul=(fam&&fam.lv.includes(lv)?fam.mul||2:1)*((i.T.lvMul||{})[lv]||1)*g.mul(lv,r.combo);if(i.rule?.id==='perfect'&&j.label==='Perfect')mul*=2;if(i.rule?.id==='combo'&&r.combo>=5)mul*=1.5;if(i.rule?.id==='high')mul*=lv>=5?1.5:.7;if(i.rule?.id==='lucky'&&lv===7)mul*=3;mul*=r.role==='sup'?.3:i.supMul;damage=Math.round(a.raidDamage(lv,j.label,r.combo)*mul);r.combo++;r.streak++;r.best=Math.max(r.best,r.combo);r.n++;if(j.label==='Perfect')r.pf++;r.dp[a.partOfLv(lv)]+=damage;damage+=g.onHit(damage,{lv,side});r.d+=damage;r.lastOk=at;next=level(w,r,at,a,g,r.prob.level,r.streak>=2?'up':'ok');if(r.streak>=2)r.streak=0;w.damage[account]||={d:0};w.damage[account].d+=damage;if(r.role==='sup'){const p=j.label==='Perfect'?2:1;r.sp+=p;w.support[account]||={p:0};w.support[account].p+=p}}
   else{r.combo=0;r.streak=0;g.onMiss();r.stunUntil=at+1200*g.missMul;next=level(w,r,at,a,g,r.prob.level,'miss')}
   r.lastAnswer={at,ok:!!side,judge:j?.label||null,damage,ms};r.pending={at:at+(side?420:900),lv:next};r.gim=copy(g.checkpoint());const rev=log(w,'answer',account,at,{run:r.id,ok:!!side,ms,level:lv,judge:j?.label||null,damage,total:r.d,combo:r.combo,questionAt:r.qs});
   if(!w.kill&&info(w,a).dead){w.kill={account,at,revision:rev};log(w,'kill',account,at,{answerRevision:rev});manifest(w,'kill',at);manifest(w,'lastHit',at)}
  }else if(type==='quit'){if(r.status==='play'){r.status='abandoned';log(w,'quit',account,at,{run:r.id})}}
  else if(type!=='resume')throw Error('INVALID_WEEKLY_OPERATION');
 }
 w.time=at;w.receipts[account][receiptKey]={type,payload:copy(payload),at,revision:w.revision,runId:r.id};return w;
}
function view(w,account){hydrate(w);const a=api(w,w.time),i=info(w,a);return copy({revision:w.revision,serverAt:w.time,week:w.week,hp:Math.max(0,i.hp),hpMax:i.hpMax,kill:w.kill||null,closed:w.closed,runs:Object.fromEntries(Object.entries(w.runs).filter(([,r])=>r.account===account).map(([id,r])=>[id,{...copy(r),prob:r.status==='play'&&!r.pending&&w.time>=r.startAt?r.prob:null}])),awards:w.awards[account]||{},stats:w.accounts[account]?.stats||null,ranking:w.closed?i.rows.map((r,index)=>({account:r.k,damage:r.d,rank:index+1})):null});}
module.exports={create,execute,advance,view,api,info};
