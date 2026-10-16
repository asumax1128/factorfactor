// Test helper: reads the rendered solo target/tiles and returns/drags a correct or wrong tile pair (no game code is touched).
// parses the rendered target/tiles and returns a correct or wrong pair of solo tile ids
async function soloPair(p,correct=true){
 return p.evaluate(ok=>{
  const sup={'²':'^2','³':'^3','⁴':'^4'};
  const parse=t=>{let s=t.replace(/[\s()（）]/g,'').replace(/[−–—]/g,'-').replace(/×|·/g,'').replace(/[²³⁴]/g,c=>sup[c]);if(!s)return null;const co={};const re=/([+-]?)(\d*)(x?)(\^(\d))?/g;let m,pos=0;s=s.replace(/^\+/,'');
   const terms=s.match(/[+-]?[^+-]+/g);if(!terms||terms.join('')!==s)return null;
   for(const term of terms){const mm=term.match(/^([+-]?)(\d*)(x?)(?:\^(\d))?$/);if(!mm)return null;const sign=mm[1]==='-'?-1:1,num=mm[2]===''?(mm[3]?1:null):+mm[2];if(num===null)return null;const deg=mm[3]?(mm[4]?+mm[4]:1):0;co[deg]=(co[deg]||0)+sign*num}
   return co};
  const mul=(a,b)=>{const o={};for(const i in a)for(const j in b)o[+i+ +j]=(o[+i+ +j]||0)+a[i]*b[j];return o};
  const eq=(a,b)=>{const ks=new Set([...Object.keys(a),...Object.keys(b)]);for(const k of ks)if((a[k]||0)!==(b[k]||0))return false;return true};
  const txt=el=>{const c=el.cloneNode(true);c.querySelectorAll('sup').forEach(x=>x.textContent='^'+x.textContent);return c.textContent};const target=parse(txt(document.querySelector('.v7-target .v7-poly')));
  const tiles=[...document.querySelectorAll('[data-tile-id]')].map(e=>({id:e.dataset.tileId,f:parse(txt(e))}));
  if(!target||tiles.some(t=>!t.f))return {error:'unparsed',target:document.querySelector('.v7-target').innerText,tiles:tiles.map(t=>t.id)};
  for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++)if(eq(mul(tiles[i].f,tiles[j].f),target)===ok)return [tiles[i].id,tiles[j].id];
  return {error:'nopair',target:JSON.stringify(target),tiles:tiles.map(t=>JSON.stringify(t.f)+' '+txt(document.querySelector('[data-tile-id="'+t.id+'"]')))}},correct);
}
async function soloDrag(p,correct=true){const r=await soloPair(p,correct);if(!r||r.error)throw Error('solo pair: '+JSON.stringify(r));
 const a=await p.locator(`[data-tile-id="${r[0]}"]`).boundingBox(),b=await p.locator(`[data-tile-id="${r[1]}"]`).boundingBox();
 await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:4});await p.mouse.up()}
module.exports={soloPair,soloDrag};
// ---- bonus (展開) stage helpers ----
async function reverseState(p){return p.evaluate(()=>/REVERSE BONUS/.test(document.body.innerText))}
async function reverseClick(p,correct=true){
 const idx=await p.evaluate(ok=>{
  const sup={'²':'^2','³':'^3','⁴':'^4'},txt=el=>{const c=el.cloneNode(true);c.querySelectorAll('sup').forEach(x=>x.textContent='^'+x.textContent);return c.textContent};
  const parse=t=>{let s=t.replace(/[\s()（）]/g,'').replace(/[−–—]/g,'-').replace(/×|·/g,'').replace(/[²³⁴]/g,c=>sup[c]);const terms=s.replace(/^\+/,'').match(/[+-]?[^+-]+/g);if(!terms)return null;const co={};for(const term of terms){const m=term.match(/^([+-]?)(\d*)(x?)(?:\^(\d))?$/);if(!m)return null;const n=m[2]===''?(m[3]?1:null):+m[2];if(n===null)return null;const d=m[3]?(m[4]?+m[4]:1):0;co[d]=(co[d]||0)+(m[1]==='-'?-1:1)*n}return co};
  const mul=(a,b)=>{const o={};for(const i in a)for(const j in b)o[+i+ +j]=(o[+i+ +j]||0)+a[i]*b[j];return o};
  const eq=(a,b)=>{for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if((a[k]||0)!==(b[k]||0))return false;return true};
  const raw=txt(document.querySelector('.v7-target .v7-poly')).replace(/\s/g,'').replace(/[−–—]/g,'-');
  const m=raw.match(/^([+-]?\d*)((?:\([^()]*\))*)$/);if(!m)return {error:'target '+raw};
  let prod={0:m[1]===''||m[1]==='+'?1:m[1]==='-'?-1:+m[1]};for(const g of m[2].matchAll(/\(([^()]*)\)/g)){const f=parse(g[1]);if(!f)return {error:'factor '+g[1]};prod=mul(prod,f)}
  const btns=[...document.querySelectorAll('button')].filter(b=>/rgb\(255, 138, 138\)/.test(getComputedStyle(b).borderColor));
  const polys=btns.map(b=>parse(txt(b)));if(polys.some(x=>!x))return {error:'choices '+btns.map(b=>txt(b)).join('|')};
  const hit=polys.findIndex(q=>eq(q,prod)===ok);return hit;
 },correct);
 if(typeof idx!=='number'||idx<0)throw Error('reverse choice: '+JSON.stringify(idx));
 const btns=await p.evaluate(()=>[...document.querySelectorAll('button')].map((b,i)=>/rgb\(255, 138, 138\)/.test(getComputedStyle(b).borderColor)?i:-1).filter(i=>i>=0));
 await p.locator('button').nth(btns[idx]).click();
}
module.exports.reverseState=reverseState;module.exports.reverseClick=reverseClick;
