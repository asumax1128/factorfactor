// Extract the original createBEngine (and its pure rule dependencies) from the
// main index.html for Emulator-only authority replay. Generated; do not edit.
const fs=require('node:fs'),path=require('node:path'),Babel=require('@babel/standalone');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const src=html.match(/<script type="text\/plain" id="app-source">([\s\S]*?)<\/script>/)[1];
const seeds=['createBEngine'],injected=new Set(['fref','TSV','fbNow']);
let result;
Babel.transform(src,{presets:['react'],code:false,plugins:[()=>({visitor:{Program(p){
 const selected=new Map(),queue=[...seeds];
 while(queue.length){
  const name=queue.pop();if(selected.has(name)||injected.has(name))continue;
  const binding=p.scope.getBinding(name);if(!binding)throw Error('Missing engine dependency: '+name);
  const b=binding.path;if(!b.isFunctionDeclaration()&&!b.isVariableDeclarator())throw Error('Unsupported binding '+name);
  selected.set(name,b);
  const collect=r=>{const t=r.scope.getBinding(r.node.name);if(t&&t.scope===p.scope&&!selected.has(r.node.name))queue.push(r.node.name)};
  b.traverse({ReferencedIdentifier:collect});
 }
 const defs=[...selected.values()].sort((a,b)=>a.node.start-b.node.start).map(b=>b.isVariableDeclarator()?'let '+src.slice(b.node.start,b.node.end)+';':src.slice(b.node.start,b.node.end));
 result='// GENERATED from main index.html; do not edit. Server-only.\n'+defs.join('\n')+'\n({createBEngine});\n';
 if(/(?:React\.|document\.|localStorage\.|Tone\.|window\.)/.test(result))throw Error('Browser dependency in server engine');
}}})]});
const out=path.join(__dirname,'../server/next-authority/c-source.js');
fs.writeFileSync(out,result);console.log('C authority engine extracted:',result.length,'bytes');
