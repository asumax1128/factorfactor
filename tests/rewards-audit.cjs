const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {entries,titles,cosmetics}=require('../scripts/audit-rewards.cjs');
function rows(file){const raw=fs.readFileSync('reports/'+file);assert(raw.subarray(0,3).equals(Buffer.from([239,187,191])));const lines=raw.toString('utf8').slice(1).trim().split(/\r?\n/);assert(lines[0].includes('ID'));return lines.length-1;}
assert.equal(rows('titles_inventory.csv'),titles.length);assert.equal(rows('achievements_inventory.csv'),entries.length);assert.equal(rows('cosmetics_inventory.csv'),cosmetics.length);
for(const list of [entries,titles,cosmetics]){assert.equal(new Set(list.map(x=>x.id)).size,list.length);for(const x of list){assert(x.id);assert.match(x.definition,/^[^:]+:\d+$/);}}
const html=fs.readFileSync('index.html','utf8');const js=html.slice(html.indexOf('const BADGES = ['),html.indexOf('function AchievementAuditPanel'));
const scope={window:{AchievementAudit:entries}};vm.createContext(scope);
vm.runInContext(js+'\nthis.api={BADGES,badgesOf,activeAchievements,achievementStatus};',scope);const {api}=scope;
const st={tower:{best:100,endN:3},w:2,maxRating:1900,skin:{tile:'towert'},nick:'tw100'},copy=JSON.stringify(st);
/* Ver.6.26: the five old-tower titles (tw10..tw100) are removed from BADGES (101 -> 96); old tower progress in the stats earns nothing and is left as it is */assert.equal(api.BADGES.length,96);assert.equal(api.activeAchievements().length,96);assert.equal(api.BADGES.filter(x=>x.g==='tower'||/^tw\d+$/.test(x.id)).length,0);assert.equal(api.badgesOf(st).filter(x=>x.g==='tower').length,0);assert.equal(JSON.stringify(st),copy);
scope.window.AchievementAudit=entries.map(x=>x.id==='first'?{...x,status:'retired'}:x);assert(!api.activeAchievements().some(x=>x.id==='first'));
assert.equal(cosmetics.filter(x=>!x.need).length,3);assert.equal(cosmetics.filter(x=>x.tower).length,0);assert(!cosmetics.some(x=>['towert','summit'].includes(x.internal)));
console.log('PASS inventories BOM/counts/IDs/source references; active/hidden/retired filters; unchanged predicates/history/equipment');
