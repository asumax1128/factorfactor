'use strict';
// Read-only presentation. Distinct storage generations are NEVER summed here.
function number(value){
 if(typeof value==='string'){if(!/^\s*\d+(?:\.\d+)?\s*$/.test(value))return null;value=Number(value);}
 return typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;
}
function record(source){
 const r=source||{},w=number(r.w),l=number(r.l),d=number(r.d),stored=number(r.games);
 // A sparse mode record does not prove that a missing result count is zero.
 const games=stored!==null?stored:([w,l,d].every(x=>x!==null)?w+l+d:null);
 return {games,w,l,d,winRate:games>0&&w!==null&&w<=games?100*w/games:null};
}
function read(stats,profile){
 const st=stats||{},wk=st.wk||{};
 return {exp:number(st.exp),legacy:record(st),modes:Object.fromEntries(['A','B','C'].map(m=>[m,record(st[m])])),
  rated:Object.fromEntries(['easy','normal'].map(d=>[d,record(profile?.[d])])),
  ghosts:Object.fromEntries(['easy','normal'].map(d=>[d,record(profile?.[d]?.ghost)])),
  metrics:Object.fromEntries(['maxStreak','perfects','comebacks','tourWins','bestMs','maxCombo'].map(k=>[k,number(st[k])])),
  weekly:Object.fromEntries(['weeks','kills','best','maxStreak'].map(k=>[k,number(wk[k])]))};
}
module.exports={number,record,read};
