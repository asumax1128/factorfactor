const fs=require('node:fs'),assert=require('node:assert/strict'),firebase=require('firebase/compat/app');require('firebase/compat/auth');require('firebase/compat/database');
const{initializeTestEnvironment,assertFails}=require('@firebase/rules-unit-testing'),{set,ref}=require('firebase/database');
const Room=require('../src/room-b2-client.cjs'),Spark=require('../src/online-spark-client.cjs'),E=require('../server/online-rated/engine.cjs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{assert.equal(process.env.GCLOUD_PROJECT,'demo-factorfactor-tower');const env=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT,database:{host:'127.0.0.1',port:9000,rules:fs.readFileSync('firebase/v525.candidate.rules.json','utf8')}}),users=[];
try{
 for(const key of ['aa','ab','av','ad']){const app=firebase.initializeApp({projectId:process.env.GCLOUD_PROJECT,apiKey:'fixture',databaseURL:'https://demo-factorfactor-tower.firebaseio.com'},'v524-'+key);app.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});app.database().useEmulator('127.0.0.1',9000);const{user}=await app.auth().signInAnonymously();users.push({key,uid:user.uid,app,db:app.database()});}
 const[a,b,v,peer]=users;await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database()),{games:{factor:{accounts:Object.fromEntries(users.map(u=>[u.key,{name:u.key,stats:{rating:1500}}])),logins:Object.fromEntries(users.map(u=>[u.key,{[u.uid]:'fixture'}])),onlineSparkV1:{config:{enabled:true}},rooms:{1234:{meta:{host:a.uid,createdAt:Date.now()},players:{[a.uid]:{name:'A'},[b.uid]:{name:'B'}},state:{phase:'lobby',players:[a.uid,b.uid],accts:{[a.uid]:a.key,[b.uid]:b.key}}}}}}}));
 await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),`games/factor/logins/aa/${peer.uid}`),'fixture'));
 // Ver.6.31: the daily challenge and its client were removed from the game, so the daily part of this test (attempt slots,
 // board proofs, finals and title claims through src/daily-client.cjs) went with it. The dailyV2 rules themselves are not changed.
 // Native SDK room: immutable server timestamps, actual start, input and spectator cap.
 await env.withSecurityRulesDisabled(ctx=>Promise.all([set(ref(ctx.database(),`games/factor/logins/alias/${a.uid}`),'fixture'),set(ref(ctx.database(),'games/factor/accounts/alias'),{name:'alias'})]));
 const state={gid:'room-test',diff:'easy',seed:'fixture',players:[a.uid,b.uid],accts:{[a.uid]:a.key,[b.uid]:b.key},duration:60};state.startAt=await Room.prepare({db:a.db,code:'1234',state});
 await a.db.ref('games/factor/rooms/1234/state').set({...state,phase:'play',mode:'B',rules:'b2'});
 let av,bv;const host=Room.create({db:a.db,code:'1234',state,uid:a.uid,isHost:true,onView:m=>av=m,onError:e=>{throw e}}),guest=Room.create({db:b.db,code:'1234',state,uid:b.uid,isHost:false,onView:m=>bv=m,onError:e=>{throw e}});
 await sleep(Math.max(0,state.startAt-Date.now())+50);await host.process();await sleep(100);
 const view=E.view(av.game,a.uid),api=E.runtime(av.game).api;let tiles;for(let i=0;i<view.tiles.length;i++)for(let j=i+1;j<view.tiles.length;j++)if(api.polyEqual(api.multiply(view.tiles[i].factor,view.tiles[j].factor),view.poly))tiles=[view.tiles[i].id,view.tiles[j].id];
 await host.request({type:'answer',seq:1,question:view.question,tiles});await sleep(100);assert.equal(av.game.states[a.uid].c,1);assert.equal(bv.game.states[a.uid].score,av.game.states[a.uid].score);
 assert.deepEqual(av.game.scoreTrace,bv.game.scoreTrace,'both SDK clients see the same committed score revision');assert.equal(av.game.scoreTrace.seq,1);assert.equal(av.game.scoreTrace.events[1].scores[a.uid],av.game.states[a.uid].score);
 const inputRef=a.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/${a.uid}/a1`);const saved=(await inputRef.get()).val();await assertFails(inputRef.set({...saved,at:saved.at+1000}));
 for(const seq of [3,1,2])await v.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/${v.uid}/c${seq}`).set({type:'cheer',account:v.key,target:a.uid,seq,at:firebase.database.ServerValue.TIMESTAMP});await sleep(250);await host.process();assert.equal(av.game.states[a.uid].cheerPoints,30);
 await assertFails(v.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/${v.uid}/c4`).set({type:'cheer',account:v.key,target:a.uid,seq:4,at:firebase.database.ServerValue.TIMESTAMP}));
 await assertFails(a.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/${a.uid}/c1`).set({type:'cheer',account:a.key,target:b.uid,seq:1,at:firebase.database.ServerValue.TIMESTAMP}));host.close();guest.close();
 await assertFails(a.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/${a.uid}/c1`).set({type:'cheer',account:'alias',target:b.uid,seq:1,at:firebase.database.ServerValue.TIMESTAMP}));
 await assertFails(v.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/${v.uid}/other`).set({type:'cheer',account:v.key,target:a.uid,seq:1,at:firebase.database.ServerValue.TIMESTAMP}));
 await assertFails(v.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/${v.uid}/c1`).update({payload:'not-an-input-field'}));
 console.log('PASS participant alias/UID spoof and surplus spectator payload denial');
 console.log('v5.25 actual Firebase SDK: room sync and spectator denial passed');
}finally{await Promise.all(users.map(u=>u.app.delete()));await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>setTimeout(()=>process.exit(process.exitCode||0),100));
