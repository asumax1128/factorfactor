const C=require('../server/online-rated/core.cjs'),G=require('./ghost-model.cjs');
function candidates(accounts,profiles,difficulty,now){
 const players={...profiles};
 for(const [k,a]of Object.entries(accounts))if(!players[k]&&a?.name&&typeof a.stats?.rating==='number'&&Number.isFinite(a.stats.rating))players[k]={name:a.name,statsKnown:false,easy:C.initial(a.stats.rating,now),normal:C.initial(1500,now)};
 return C.rankings({players},difficulty,now).slice(0,10).filter(r=>r.rank<=10&&G.eligible(accounts[r.key])).map(r=>({...r,weight:11-r.rank}));
}
function select({accounts,profiles,difficulty,key,now,random=Math.random}){
 const rows=candidates(accounts,profiles,difficulty,now);if(!rows.length)throw Error('ランキングTOP10に対戦可能な学習記録がありません');
 let roll=random()*rows.reduce((n,r)=>n+r.weight,0),r=rows.at(-1);for(const x of rows){roll-=x.weight;if(roll<0){r=x;break}}
 const a=accounts[r.key],own=profiles[key]?.[difficulty],my=own?C.ratingView(own,now).rating:1500;
 return {type:'hyper',key:r.key,base:a.name,name:a.name+'のハイパーゴースト'+(r.key===key?'（自分・練習）':''),rating:r.rating,rank:G.rank(r.rating),rankingRank:r.rank,rankDifference:G.rank(r.rating)-G.rank(my),profile:G.profile(a.prof,a.stats,true)};
}
module.exports={candidates,select};
