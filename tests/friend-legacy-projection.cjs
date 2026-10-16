// Compare the complete previous friend lobby when the new version flag is absent.
module.exports=function project(n){if(!(n.body.body||[]).some(s=>(s.declarations||[]).some(d=>d.id?.name==='powers')))return n;
 n.body.body=n.body.body.filter(s=>!(s.declarations||[]).some(d=>d.id?.name==='powers'));
 const walk=x=>{if(!x||typeof x!=='object')return x;if(x.type==='Identifier'&&x.name==='powers')x.name='RAID_POWER';
 if(x.type==='BinaryExpression'&&x.operator==='==='&&x.left?.object?.name==='state'&&x.left?.property?.name==='friendPolicyVersion'&&x.right?.value===1)return{type:'BooleanLiteral',value:false};
 for(const k of Object.keys(x)){const v=x[k];if(v&&typeof v==='object')x[k]=Array.isArray(v)?v.map(walk):walk(v)}
 if(x.type==='ConditionalExpression'&&x.test?.type==='BooleanLiteral')return x.test.value?x.consequent:x.alternate;return x;
 };return walk(n);
};
