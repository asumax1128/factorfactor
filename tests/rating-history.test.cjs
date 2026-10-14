const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync('index.html','utf8');const a=s.indexOf('const RatingHistory ='),b=s.indexOf('// Presentation only:',a);const H=vm.runInNewContext(s.slice(a,b)+'\nRatingHistory');
const cases=[
 ['easy higher',{easy:{maxRating:1900},normal:{maxRating:1800}},null,1900],
 ['normal higher',{easy:{maxRating:1700},normal:{maxRating:1900}},null,1900],
 ['equal',{easy:{maxRating:1820},normal:{maxRating:1820}},null,1820],
 ['easy only',{easy:{maxRating:1821,rating:1500}},null,1821],
 ['normal only',{normal:{maxRating:1822,rating:1600}},null,1822],
 ['missing',{},null,null],['zero/null',{easy:{maxRating:0},normal:{maxRating:null}},null,null],
 ['numeric strings',{easy:{maxRating:'1900.5'},normal:{maxRating:' 1850 '}},null,1900.5],
 ['invalid strings',{easy:{maxRating:''},normal:{maxRating:'abc',seasonMax:Infinity}},null,null],
 ['current is not history',{easy:{rating:2100}},null,null],
 ['season proof',{easy:{seasonHist:{'2026-09':{max:1830}}}},null,1830],
 ['legacy peak',null,{maxRating:1901,rating:1600},1901],
 ['legacy season',null,{seasonMax:'1902'},1902],
 ['migrated embedded legacy',{easy:{maxRating:1700},legacy:{stats:{maxRating:1903}}},null,1903],
 ['unplayed initial',{easy:{games:0,maxRating:1500},normal:{games:0,maxRating:1500}},null,null],
 ['rated ghost-only history',{easy:{games:0,ghost:{games:1},maxRating:1500}},null,1500],
 ['rated bot-only string counts',{normal:{games:'0',ghost:{games:'1'},maxRating:'1500'}},null,1500],
 ['read-only preview',{statsKnown:false,easy:{maxRating:2000}},null,null],
 ['hard ignored',{easy:{maxRating:1700},hard:{maxRating:2200}},null,1700]
];
for(const [name,p,l,want]of cases)test(name,()=>{const before=JSON.stringify([p,l]);assert.equal(H.highest(p,l),want);assert.equal(JSON.stringify([p,l]),before)});
for(const d of ['easy','normal'])for(const rating of [1820,1900])test(d+' permanent master '+rating,()=>assert.equal(H.master({[d]:{rating:1500,maxRating:rating}},null,1820),true));
test('threshold is unchanged',()=>assert.equal(H.master({easy:{maxRating:1819.9}},null,1820),false));
test('current without history does not invent proof',()=>assert.equal(H.master({easy:{rating:1900}},null,1820),false));
for(const badge of ['easy_master','normal_master','dual_master'])test('permanent '+badge+' rescues missing peak',()=>assert.equal(H.master({badges:{[badge]:true}},null,1820),true));
test('future HARD does not unlock master',()=>assert.equal(H.master({hard:{maxRating:2200}},null,1820),false));
test('legacy master remains usable',()=>assert.equal(H.master(null,{skin:{tile:'master'}},1820),true));
test('other equipped tile is not proof',()=>assert.equal(H.master({}, {skin:{tile:'wood'}},1820),false));
test('explicit future difficulty extension only',()=>assert.equal(H.highest({hard:{maxRating:2000}},null,['easy','normal','hard']),2000));
