const {test}=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/profile-read.cjs'),N=require('../src/next-navigation.cjs');
test('missing, null, blank and invalid fields stay unknown, explicit zero remains zero',()=>{
 for(const v of [null,undefined,'',false,{},'NaN','Infinity',-1])assert.equal(M.number(v),null);
 assert.equal(M.number('0'),0);assert.equal(M.number(' 1665.6 '),1665.6);
 assert.deepEqual(M.record(null),{games:null,w:null,l:null,d:null,winRate:null});assert.equal(M.record({games:0,w:0,l:0,d:0}).winRate,null);
});
test('stored games or a complete outcome set allow rates, sparse modes are not invented',()=>{
 assert.deepEqual(M.record({games:10,w:6}),{games:10,w:6,l:null,d:null,winRate:60});assert.equal(M.record({w:2,l:1,d:0}).games,3);
 assert.equal(M.record({w:2}).games,null);assert.equal(M.record({games:1,w:2}).winRate,null);
});
test('legacy B and rating generations are separate and all inputs are immutable',()=>{
 const st={games:20,w:12,B:{w:7,l:2,d:1},exp:100,wk:{weeks:3,best:850}},profile={easy:{games:20,w:12,l:8,d:0},normal:{games:5,w:3,l:2,d:0}};
 const before=JSON.stringify({st,profile}),v=M.read(st,profile);
 assert.equal(v.legacy.games,20);assert.equal(v.modes.B.games,10);assert.equal(v.rated.easy.games,20);assert.equal(v.rated.normal.games,5);assert.equal(v.modes.C.games,null);assert.equal(v.weekly.best,850);assert.equal(JSON.stringify({st,profile}),before);
});
test('shared navigation preserves known profile origins and rejects unknown returns',()=>{
 for(const from of ['home','solo','battle','daily','rankings','ranking-daily'])assert.equal(N.back({from}).page,from);
 assert.equal(N.back({from:'https://example.com'}).page,'home');assert.equal(N.target('rank'),'rankings');assert.equal(N.active('ranking-rating'),'rank');assert.equal(N.active('profile'),'account');assert.equal(N.back({from:'solo',fromArg:{menu:'help'}}).arg.menu,'help');
});
