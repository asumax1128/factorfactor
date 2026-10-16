'use strict';
const {enabled}=require('./weekly-run-next.cjs'),{tx}=require('./online-spark-client.cjs');
const ROOT='games/factor/friendRaidNextV1',MATCHES='games/factor/onlineSparkV1/matches';
const powers=Object.freeze({easy:{label:'よわい',k:.7,enabled:true},normal:{label:'ふつう',k:1,enabled:true},hard:{label:'つよい',k:1.4,enabled:true},oni:{label:'鬼',k:null,enabled:false}});
function official(m,account){const members=Object.values(m?.members||{}),r=m?.receipt;
 if(members.some(p=>!p||typeof p!=='object'))return false;
 return !!m&&m.phase==='settled'&&!m.opponent&&!m.bot&&!m.practice&&!m.selfGhost&&['A','B'].includes(m.mode)&&['easy','normal'].includes(m.difficulty)&&members.length===2&&new Set(members.map(p=>p.uid)).size===2&&new Set(members.map(p=>p.key)).size===2&&members.every(p=>/^a[a-z0-9_]+$/.test(p.key||'')&&typeof p.uid==='string'&&p.uid!=='_ghost')&&members.some(p=>p.key===account)&&m.game?.id===m.id&&!!m.game.result&&!!r&&members.every(p=>r.players?.[p.key])&&(m.game.result.draw===true||members.some(p=>p.uid===m.game.result.winner))&&m.game.result.winner===r.result?.winner&&!!m.game.result.draw===!!r.result?.draw;
}
async function qualify({db,account}){
 if(!account?.key)throw Error('REGISTERED_ACCOUNT_REQUIRED');const q=db.ref(`${ROOT}/eligibility/${account.key}`),saved=(await q.get()).val();if(saved?.version===1&&Object.values(saved.matches||{}).length===10)return saved;
 const p=(await db.ref(`games/factor/onlineSparkV1/profiles/${account.key}`).get()).val(),ids=Object.keys(p?.processed||{}).filter(id=>p.processed[id]===true).sort().reverse().slice(0,30),valid=[];
 for(let i=0;i<ids.length&&valid.length<10;i+=5){const batch=await Promise.all(ids.slice(i,i+5).map(async id=>{try{const m=(await db.ref(`${MATCHES}/${id}`).get()).val();return m?.id===id&&official(m,account.key)?id:null}catch{return null}}));for(const id of batch)if(id&&!valid.includes(id))valid.push(id);}
 if(valid.length<10)throw Error(`公式対人戦10戦の確定記録を確認できません（確認済み${valid.length}戦）。旧通算・CPU・自己ゴーストは加算しません。`);
 await tx(q,old=>old||{version:1,matches:valid.slice(0,10),at:{'.sv':'timestamp'}});return(await q.get()).val();
}
function settings(state){const p=powers[state.friendPower||state.power||'normal'];if(!p?.enabled||(state.friendPower&&state.power&&state.friendPower!==state.power))throw Error('FRIEND_DIFFICULTY_NOT_APPROVED');return p;}
module.exports={ROOT,enabled,official,qualify,powers,settings};
