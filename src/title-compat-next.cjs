'use strict';
const catalog=require('./title-catalog-next.json');
const ids=new Set(catalog.titles.map(t=>t.id));
function read({legacyEarned=[],flags=[],equipped=null}={}){
 const earned=new Map();for(const id of legacyEarned)if(typeof id==='string')earned.set(id,{id,at:null,source:'legacy-evidence'});
 for(const map of flags)for(const[id,v]of Object.entries(map||{})){
  if(v!==true&&v?.earned!==true)continue;
  const at=v&&typeof v==='object'&&Number.isFinite(v.at)&&v.at>0?v.at:null;
  const previous=earned.get(id);earned.set(id,{id,at:previous?.at??at,source:'stored-flag',...(v&&typeof v==='object'&&v.dateWasUnknown===true?{dateWasUnknown:true,dateOrigin:v.dateOrigin}:previous?.dateWasUnknown?{dateWasUnknown:true,dateOrigin:previous.dateOrigin}:{})});
 }
 const normal=catalog.titles.filter(t=>earned.has(t.id)),rare=normal.filter(t=>t.stars===5).length;
 return {earned:Object.fromEntries(earned),normal,fiveStarCount:rare,hiddenEligible:rare>=15,hiddenOwned:earned.has(catalog.hidden.id),archived:[...earned.keys()].filter(id=>!ids.has(id)&&id!==catalog.hidden.id),equipped};
}
module.exports={read};
