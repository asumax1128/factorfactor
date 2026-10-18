'use strict';
const catalog=require('./title-catalog-next.json');
const ids=new Set(catalog.titles.map(t=>t.id));
// deriveHidden (Ver.6.0 step 9 C, used by the client screens only): the hidden title FACTOR×FACTOR is owned when 15 DISTINCT five-star
// catalog titles are earned (the hidden title itself is never counted). Without it the reader is unchanged (stored records only).
function read({legacyEarned=[],flags=[],equipped=null,deriveHidden=false}={}){
 const earned=new Map();for(const id of legacyEarned)if(typeof id==='string')earned.set(id,{id,at:null,source:'legacy-evidence'});
 for(const map of flags)for(const[id,v]of Object.entries(map||{})){
  if(v!==true&&v?.earned!==true)continue;
  const at=v&&typeof v==='object'&&Number.isFinite(v.at)&&v.at>0?v.at:null;
  const previous=earned.get(id);earned.set(id,{id,at:previous?.at??at,source:'stored-flag',...(v&&typeof v==='object'&&v.dateWasUnknown===true?{dateWasUnknown:true,dateOrigin:v.dateOrigin}:previous?.dateWasUnknown?{dateWasUnknown:true,dateOrigin:previous.dateOrigin}:{})});
 }
 const normal=catalog.titles.filter(t=>earned.has(t.id)),rare=normal.filter(t=>t.stars===5).length;
 if(deriveHidden&&rare>=15&&!earned.has(catalog.hidden.id))earned.set(catalog.hidden.id,{id:catalog.hidden.id,at:null,source:'derived-five-star'});
 return {earned:Object.fromEntries(earned),normal,fiveStarCount:rare,hiddenEligible:rare>=15,hiddenOwned:earned.has(catalog.hidden.id),archived:[...earned.keys()].filter(id=>!ids.has(id)&&id!==catalog.hidden.id),equipped};
}
module.exports={read};
