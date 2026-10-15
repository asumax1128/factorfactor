'use strict';
// Local practice only. Reuse the existing CPU timing/miss functions; never write bot intents to Firebase.
function create({think,miss,levels,random=Math.random}){
 const plans=new Map();
 return function plan(raw,clock,api){
  if(raw.game?.result||clock<raw.game.startAt)return raw;
  for(const[uid,level]of Object.entries(raw.cpu||{})){
   const s=raw.game.states[uid];if(!s||s.hp<=0||s.resolving||s.freezeUntil>clock)continue;
   const key=`${uid}:${s.serial}`;let p=plans.get(key);
   if(!p){const conf=levels[level]||levels.normal;p={at:s.qStart+think(conf,s.cur.level),wrong:random()<miss(conf,s.cur.level)};plans.set(key,p)}
   if(p.at>clock)continue;
   let pair=null;for(let i=0;i<s.cur.tiles.length;i++)for(let j=i+1;j<s.cur.tiles.length;j++)if(api.polyEqual(api.multiply(s.cur.tiles[i].factor,s.cur.tiles[j].factor),s.cur.poly)!==p.wrong)pair=[s.cur.tiles[i].id,s.cur.tiles[j].id];
   if(!pair)continue;
   const seq=(raw.game.seq?.[uid]||0)+1;
   raw.inputs ||= {};raw.inputs[uid] ||= {};raw.inputs[uid]['a'+seq] ||= {type:'answer',seq,question:`${s.cur.level}:${s.cur.k}`,tiles:pair,at:Math.max(p.at,raw.game.time,s.freezeUntil||0)};
  }
  return raw;
 };
}
module.exports={create};
