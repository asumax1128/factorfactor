// Preserve original tournament A / unversioned B code in AST regression.
module.exports=function project(n){
 if(!JSON.stringify(n).includes('tournamentVersion'))return n;
 if(n.id.name==='TourBoard')n.body.body=n.body.body.filter(s=>!(s.type==='ExpressionStatement'&&s.expression.callee?.name==='useEffect'&&JSON.stringify(s).includes('tournamentVersion')));
 if(n.id.name==='TourMatchCard')n.body.body=n.body.body.filter(s=>!(s.declarations||[]).some(d=>['modern','live'].includes(d.id?.name)));
 const isVersion=x=>x?.type==='MemberExpression'&&x.object?.name==='state'&&x.property?.name==='tournamentVersion';
 const walk=x=>{if(!x||typeof x!=='object')return x;
  if(x.type==='Identifier'&&x.name==='legacyLive')x.name='live';
  if(x.type==='BinaryExpression'&&isVersion(x.left)&&x.right?.value===2)return {type:'BooleanLiteral',value:x.operator==='!=='?true:false};
  for(const k of Object.keys(x)){const v=x[k];if(v&&typeof v==='object')x[k]=Array.isArray(v)?v.map(walk).filter(v=>v!==null):walk(v)}
  const bool=v=>v?.type==='BooleanLiteral'?v.value:undefined;
  if(x.type==='LogicalExpression'&&x.operator==='&&'){if(bool(x.left)!==undefined)return bool(x.left)?x.right:x.left;if(bool(x.right)===false)return x.right;if(bool(x.right)===true)return x.left;}
  if(x.type==='ConditionalExpression'&&bool(x.test)!==undefined)return bool(x.test)?x.consequent:x.alternate;
  if(x.type==='IfStatement'&&bool(x.test)!==undefined)return bool(x.test)?x.consequent:x.alternate||null;
  return x;
 };return walk(n);
};
