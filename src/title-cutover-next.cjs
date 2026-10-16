'use strict';
// Pure dry-run boundary. A trusted migration/Emulator context supplies this
// snapshot once; ordinary clients must never be able to manufacture old awards.
const C=require('./title-compat-next.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
function validate(s,account){
 if(s?.version!==1||s.source!=='legacy-cutover-v1'||s.account!==account||!s.migrationId||!Number.isSafeInteger(s.capturedAt)||s.capturedAt<=0||!s.earned||typeof s.earned!=='object'||Array.isArray(s.earned))throw Error('INVALID_TITLE_CUTOVER');
 for(const[id,r]of Object.entries(s.earned))if(!id||r.id!==id||r.at!=null&&(!Number.isFinite(r.at)||r.at<=0))throw Error('INVALID_TITLE_CUTOVER');return s;
}
function freeze(existing,{account,migrationId,capturedAt,legacyEarned=[],flags=[],equipped=null}={}){
 if(existing){validate(existing,account);if(existing.migrationId!==migrationId)throw Error('TITLE_MIGRATION_CONFLICT');return copy(existing);}
 const c=C.read({legacyEarned,flags,equipped});return validate({version:1,source:'legacy-cutover-v1',account,migrationId,capturedAt,earned:c.earned,equipped},account);
}
function read(snapshot,account){const s=validate(snapshot,account);return C.read({flags:[Object.fromEntries(Object.entries(s.earned).map(([id,r])=>[id,{earned:true,at:r.at}]))],equipped:s.equipped});}
module.exports={freeze,read,validate};
