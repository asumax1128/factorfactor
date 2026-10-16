'use strict';
const ROOT='games/factor/nextAuthorityV1';
const enabled=require('./weekly-run-next.cjs').enabled;
function weekly({db,uid,account,week}){
 if(!module.exports.enabled(db,globalThis.location)||!account?.key)throw Error('EMULATOR_AUTHORITY_ONLY');
 const path=`${ROOT}/weekly/${week}`;
 async function submit(type,payload,id){
  const r=db.ref(`${path}/requests/${account.key}/${id}`),body=JSON.stringify(payload),old=(await r.get()).val();
  if(old){if(old.type!==type||old.payload!==body)throw Error('CONFLICTING_REQUEST_ID')}else await r.set({uid,type,payload:body,at:{'.sv':'timestamp'}});
  return new Promise((resolve,reject)=>{const target=db.ref(`${path}/processed/${account.key}/${id}`);let timer;const stop=()=>{clearTimeout(timer);target.off('value',f)},f=s=>{const v=s.val();if(!v)return;stop();if(v.ok)resolve(v);else{const e=Error(v.error);e.confirmed=true;reject(e)}};timer=setTimeout(()=>{stop();reject(Error('通信を確認し、同じ操作を再送してください'))},15000);target.on('value',f,e=>{stop();reject(e)});});
 }
 function subscribe(fn,onError){const r=db.ref(`${path}/views/${account.key}`),f=s=>fn(s.val());r.on('value',f,onError);return()=>r.off('value',f)}
 return{submit,subscribe,newId:()=>db.ref(path).push().key};
}
module.exports={ROOT,enabled,weekly};
