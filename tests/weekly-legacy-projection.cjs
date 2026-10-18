// Compare every original weekly battle/reward statement with development mode off.
// This projection removes only explicitly named development wiring; no math or
// legacy write handler is replaced with baseline text.
// Ver.6.0 A2 (owner-approved) ADDED four statements (never edited a legacy one): the planned-end ref + its effect, the
// `a2Completed` flag and two `if (... a2Completed ...)` counters. They are removed here and counted, so the projection fails
// if more or fewer than exactly those statements exist; everything else is still compared with the baseline.
module.exports=function project(n){
 if(!n.body.body.some(s=>(s.declarations||[]).some(d=>d.id?.name==='dev')))return n;
const a2={ref:0,effect:0,decl:0,ifs:0};
 const devNames=new Set(['a2Planned','devStats','dev','devData','setDevData','devError','setDevError','devRun','devInitial','devSeq','devQueue','devEnding','pointerKey','devDmg','v','devSup','devSnapshot','devCheckpoint','restoreDev','devAward','devCombat','devEnvSaved']);
 const names=d=>d.id?.type==='ArrayPattern'?d.id.elements.map(x=>x?.name):[d.id?.name];
 n.body.body=n.body.body.filter(s=>{
  if(s.type==='VariableDeclaration'&&s.declarations.some(d=>names(d).includes('a2Planned')))a2.ref++;
  if(s.type==='VariableDeclaration'&&s.declarations.some(d=>names(d).some(x=>devNames.has(x))))return false;
  if(s.type==='ExpressionStatement'&&s.expression.callee?.name==='useEffect'&&JSON.stringify(s.expression.arguments[0]).includes('"name":"a2Planned"')&&(s.expression.arguments.at(-1).elements||[]).map(e=>e.name).join()==='scr,endAt'){a2.effect++;return false;}
  if(s.type==='ExpressionStatement'&&s.expression.type==='AssignmentExpression'&&s.expression.left?.object?.name==='devStats')return false;
  if(s.type==='ExpressionStatement'&&s.expression.callee?.name==='useEffect'&&JSON.stringify(s.expression.arguments.at(-1)).includes('"name":"dev"'))return false;
  return true;
 });
 const walk=x=>{if(!x||typeof x!=='object')return x;
  if(x.type==='VariableDeclaration'&&x.declarations.some(d=>d.id?.name==='a2Completed')){a2.decl++;return null;}
  if(x.type==='IfStatement'&&JSON.stringify(x.test).includes('"name":"a2Completed"')){a2.ifs++;return null;}
  if(x.type==='Identifier'&&x.name==='legacyV')x.name='v';
  if(x.type==='Identifier'&&['dev','devError'].includes(x.name))return {type:'BooleanLiteral',value:false};
  if(x.type==='Identifier'&&x.name==='devSup')return {type:'Identifier',name:'sup'};
  if(x.type==='ObjectProperty'&&x.key?.name==='checkpointRotation')return null;
  if(x.type==='ObjectProperty'&&['sessionInfo','recovery'].includes(x.key?.name)&&(x.key?.name==='recovery'||JSON.stringify(x.value).includes('devError')))return null;
  // Start wrapper: retain its original legacy branch, including actual reset and
  // timestamps, rather than substituting a remembered/baseline implementation.
  if(x.type==='ArrowFunctionExpression'&&x.async&&JSON.stringify(x).includes('"name":"restoreDev"')){
   const t=x.body.body.find(s=>s.type==='TryStatement'),branch=t.block.body[0];
   if(branch.type!=='IfStatement'||branch.test.name!=='dev'||!branch.alternate)throw Error('weekly start wrapper changed');
   x.async=false;x.body.body=branch.alternate.body;
  }
  if(x.type==='VariableDeclarator'&&x.id?.name==='info')x.init.arguments[1].elements=[{type:'Identifier',name:'v'},{type:'Identifier',name:'meta'},{type:'Identifier',name:'sup'}];
  for(const k of Object.keys(x)){const v=x[k];if(v&&typeof v==='object')x[k]=Array.isArray(v)?v.map(walk).filter(v=>v!==null):walk(v);}
  const bool=y=>y?.type==='BooleanLiteral'?y.value:undefined;
  if(x.type==='UnaryExpression'&&x.operator==='!'&&bool(x.argument)!==undefined)return {type:'BooleanLiteral',value:!bool(x.argument)};
  if(x.type==='LogicalExpression'&&bool(x.left)!==undefined){if(x.operator==='&&')return bool(x.left)?x.right:x.left;if(x.operator==='||')return bool(x.left)?x.left:x.right;}
  if(x.type==='ConditionalExpression'&&bool(x.test)!==undefined)return bool(x.test)?x.consequent:x.alternate;
  if(x.type==='IfStatement'&&bool(x.test)!==undefined)return bool(x.test)?x.consequent:x.alternate||null;
  if(x.type==='CallExpression'&&x.callee?.object?.name==='React'&&x.callee?.property?.name==='createElement')x.arguments=x.arguments.filter((a,i)=>i<2||bool(a)!==false);
  if(x.type==='ObjectProperty'&&x.key?.name==='children'&&x.value?.type==='ArrayExpression')x.value.elements=x.value.elements.filter(v=>bool(v)!==false);
  if(x.type==='ObjectProperty'&&x.key?.name==='stunUntil'&&x.value?.name==='stunUntil')x.shorthand=true;
  if(x.type==='IfStatement'&&x.consequent?.type==='BlockStatement'&&x.consequent.body.length===1&&x.consequent.body[0].type==='ReturnStatement')x.consequent=x.consequent.body[0];
  return x;
 };const out=walk(n);if(a2.ref!==1||a2.effect!==1||a2.decl!==1||a2.ifs!==2)throw Error('weekly A2 additions changed: '+JSON.stringify(a2));return out;
};
