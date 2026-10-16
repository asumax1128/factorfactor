// Execute the actual existing pairing/standings functions, not a test reimplementation.
const fs=require('node:fs'),vm=require('node:vm'),Babel=require('@babel/standalone');
module.exports=function(){const html=fs.readFileSync('index.html','utf8'),src=html.match(/<script type="text\/plain" id="app-source">([\s\S]*?)<\/script>/)[1],names=['hashSeed','swissN','isSwissRound','swissEst','unbeaten','swissOver','matchOutcome','swissStandings','swissPair'],ast=Babel.transform(src,{ast:true,code:false,parserOpts:{plugins:['jsx']}}).ast,parts=[];
 for(const n of ast.program.body){if(n.type==='FunctionDeclaration'&&names.includes(n.id.name))parts.push(src.slice(n.start,n.end));if(n.type==='VariableDeclaration')for(const d of n.declarations)if(names.includes(d.id.name))parts.push('const '+src.slice(d.start,d.end)+';');}
 if(parts.length!==names.length)throw Error('Tournament source extraction incomplete');return vm.runInNewContext(parts.join('\n')+';({'+names.join(',')+'})');};
