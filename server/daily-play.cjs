// Daily uses the existing solo board generator, timing tiers and level points.
const E=require('./online-rated/engine.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
function runtime(s){return E.runtime(E.begin('daily',s.difficulty,'A',['daily','unused'],s.seed,s.startAt))}
function serve(s,at){const {api,bank}=runtime(s),lv=bank.level(s.index+1),k=s.used[lv]||0;s.used[lv]=k+1;s.cur={...bank.get(lv,k),level:lv,k};
 if(s.correct>api.REVERSE_STAGE_MIN_CORRECT&&api.withSeed(`${s.seed}:reverse:${s.index}`,()=>Math.random()<api.REVERSE_STAGE_CHANCE)){s.cur={...api.withSeed(`${s.seed}:reverse-board:${s.index}`,()=>api.buildReverseQuestion()),reverse:true,k};}
 s.qStart=at;s.readyAt=at;s.resolving=false;}
function begin(difficulty,seed,at,count){if(!['easy','normal','hard'].includes(difficulty))throw Error('INVALID_DIFFICULTY');count ||= ({easy:15,normal:30,hard:50})[difficulty];const s={difficulty,seed,count,startAt:at,time:at,index:0,hp:100,score:0,combo:0,best:0,correct:0,hist:[],used:{},done:false,cleared:false};serve(s,at);return s}
function finish(s,at,cleared,reason){s.done=true;s.cleared=cleared;s.elapsed=Math.max(0,Math.round(at-s.startAt));s.reason=reason;if(cleared)s.score+=Math.round(s.correct*15-s.elapsed/1000);}
function next(s,at){s.index++;if(s.index>=s.count){finish(s,at,s.hp>0,'complete');return}s.resolving=true;s.readyAt=at+420;}
function tick(raw,at){const s=copy(raw);if(s.done)return s;
 while(s.time<at&&!s.done){let t=at;if(s.resolving)t=Math.min(t,s.readyAt);else t=Math.min(t,s.qStart+20000);t=Math.min(t,s.time+s.hp*1000);
  s.hp=Math.max(0,Math.round((s.hp-(t-s.time)/1000)*1e6)/1e6);s.time=t;
  if(s.hp<=0){finish(s,t,false,'ko');break}
  if(s.resolving&&t>=s.readyAt){serve(s,t);continue}
  if(!s.resolving&&t>=s.qStart+20000){s.hp=Math.max(0,s.hp-({easy:0,normal:5,hard:10})[s.difficulty]);s.combo=0;s.hist.push({lv:s.cur.level,k:s.cur.k,ok:false,ms:20000,timeout:true});s.index++;
   if(s.hp<=0||s.index>=s.count){finish(s,t,false,s.hp<=0?'ko':'timeout');break}s.resolving=true;s.readyAt=t+420;}
 }
 return s;
}
function answer(raw,ids,at){const s=tick(raw,at);if(s.done||s.resolving)throw Error('NOT_READY');const {api}=runtime(s);let ok;if(s.cur.reverse){const choice=s.cur.choices.find(c=>c.id===ids[0]);if(!choice)throw Error('INVALID_CHOICE');ok=choice.correct;}else{const fs=ids.map(id=>s.cur.tiles.find(t=>t.id===id)?.factor);if(fs.length!==2||ids[0]===ids[1]||fs.some(f=>!f))throw Error('INVALID_TILES');ok=api.polyEqual(api.multiply(...fs),s.cur.poly)}const ms=at-s.qStart,j=api.getJudgment(ms);
 if(ok){const gain=Math.round((s.cur.reverse?api.REVERSE_STAGE_POINTS:api.LEVEL_POINTS[s.cur.level])*(1+s.combo*.1))+Math.max(0,Math.round(s.hp+j.recover-100));s.score+=gain;s.hp=Math.min(100,Math.round((s.hp+j.recover)*100)/100);s.combo++;s.best=Math.max(s.best,s.combo);s.correct++;s.hist.push({lv:s.cur.level,k:s.cur.k,ok:true,ms,j:j.label,gain});}
 else{s.combo=0;s.hp=Math.max(0,s.hp-({easy:20,normal:25,hard:30})[s.difficulty]);s.hist.push({lv:s.cur.level,k:s.cur.k,ok:false,ms});}
 if(s.hp<=0)finish(s,at,false,'ko');else next(s,at);return s;
}
module.exports={begin,tick,answer};
