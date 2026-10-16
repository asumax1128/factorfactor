'use strict';
const {enabled}=require('./weekly-run-next.cjs'),{tx}=require('./online-spark-client.cjs');
const ROOT='games/factor/titleNextV1';
function create({db,account}){
 if(!account?.key)throw Error('REGISTERED_ACCOUNT_REQUIRED');const ref=db.ref(`${ROOT}/presentations/${account.key}/factor_factor`);
 return{async claimAutomatic(){await ref.get();const result=await ref.transaction(old=>old?undefined:{seen:true,at:{'.sv':'timestamp'}},undefined,false);return result.committed},async seen(){return !!(await ref.get()).val()},async acknowledge(){await tx(ref,old=>old||{seen:true,at:{'.sv':'timestamp'}});return(await ref.get()).val()}};
}
module.exports={ROOT,enabled,create};
