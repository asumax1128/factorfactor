// Specialize the optional recovery adapter OFF and compare every legacy statement.
// Recovery has dedicated browser + SDK tests; do not skip the shared RaidPlay.
module.exports=function project(n){
 const names=d=>d.id?.type==='ArrayPattern'?d.id.elements.map(x=>x?.name):[d.id?.name];
 const dev=new Set(['recovery','recovered','recoverPending','recoverLock','recoverSaving','setRecoverSaving','recoverPersist']);
 n.body.body=n.body.body.filter(s=>!(s.type==='VariableDeclaration'&&s.declarations.some(d=>names(d).some(x=>dev.has(x))))&&!(s.type==='ExpressionStatement'&&s.expression.callee?.name==='useEffect'&&JSON.stringify(s.expression).includes('"name":"recovery"')));
 const walk=x=>{if(!x||typeof x!=='object')return x;
  if(x.type==='Identifier'&&x.name==='recovery')return{type:'BooleanLiteral',value:false};
  for(const k of Object.keys(x)){const v=x[k];if(v&&typeof v==='object')x[k]=Array.isArray(v)?v.map(walk).filter(v=>v!==null):walk(v);}
  const bool=y=>y?.type==='BooleanLiteral'?y.value:undefined;
  if(x.type==='LogicalExpression'&&bool(x.left)!==undefined){if(x.operator==='&&')return bool(x.left)?x.right:x.left;if(x.operator==='||')return bool(x.left)?x.left:x.right;}
  if(x.type==='ConditionalExpression'&&bool(x.test)!==undefined)return bool(x.test)?x.consequent:x.alternate;
  if(x.type==='IfStatement'&&bool(x.test)!==undefined)return bool(x.test)?x.consequent:x.alternate||null;
  if(x.type==='NewExpression'&&x.callee.name==='Set'&&x.arguments.length===1&&x.arguments[0].type==='ArrayExpression'&&!x.arguments[0].elements.length)x.arguments=[];
  // Optional adapter is the sole added dependency of this callback.
  if(x.type==='CallExpression'&&x.callee?.name==='useCallback'&&x.arguments[1]?.type==='ArrayExpression')x.arguments[1].elements=x.arguments[1].elements.filter(v=>bool(v)!==false);
  return x;
 };return walk(n);
};
