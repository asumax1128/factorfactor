const fs=require('node:fs'),assert=require('node:assert/strict'),firebase=require('firebase/compat/app');require('firebase/compat/auth');require('firebase/compat/database');
const{initializeTestEnvironment,assertFails}=require('@firebase/rules-unit-testing'),{set,ref}=require('firebase/database');
const Daily=require('../src/daily-client.cjs'),D=Daily.model,Room=require('../src/room-b2-client.cjs'),Spark=require('../src/online-spark-client.cjs'),E=require('../server/online-rated/engine.cjs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{assert.equal(process.env.GCLOUD_PROJECT,'demo-factorfactor-tower');const env=await initializeTestEnvironment({projectId:process.env.GCLOUD_PROJECT,database:{host:'127.0.0.1',port:9000,rules:fs.readFileSync('firebase/v524.candidate.rules.json','utf8')}}),users=[];
try{
 for(const key of ['aa','ab','av','ad']){const app=firebase.initializeApp({projectId:process.env.GCLOUD_PROJECT,apiKey:'fixture',databaseURL:'https://demo-factorfactor-tower.firebaseio.com'},'v524-'+key);app.auth().useEmulator('http://127.0.0.1:9099',{disableWarnings:true});app.database().useEmulator('127.0.0.1',9000);const{user}=await app.auth().signInAnonymously();users.push({key,uid:user.uid,app,db:app.database()});}
 const[a,b,v,peer]=users;await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database()),{games:{factor:{accounts:Object.fromEntries(users.map(u=>[u.key,{name:u.key,stats:{rating:1500}}])),logins:Object.fromEntries(users.map(u=>[u.key,{[u.uid]:'fixture'}])),onlineSparkV1:{config:{enabled:true}},rooms:{1234:{meta:{host:a.uid,createdAt:Date.now()},players:{[a.uid]:{name:'A'},[b.uid]:{name:'B'}},state:{phase:'lobby',players:[a.uid,b.uid],accts:{[a.uid]:a.key,[b.uid]:b.key}}}}}}}));
 await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),`games/factor/logins/aa/${peer.uid}`),'fixture'));
 const client=u=>Daily.create({db:u.db,uid:u.uid,account:{key:u.key,name:u.key},storage:null}),da=client(a),da2=Daily.create({db:peer.db,uid:peer.uid,account:{key:a.key,name:a.key},storage:null}),db=client(b);
 const starts=await Promise.allSettled([da.start('easy'),da2.start('easy'),da.start('easy'),da2.start('easy')]);console.log(starts.map(x=>x.status==='fulfilled'?'reserved':x.reason.message));assert.equal(starts.filter(x=>x.status==='fulfilled').length,3);assert.equal((await da.status()).used,3);
 const attempt=starts.find(x=>x.status==='fulfilled').value;await da.finish(attempt,{score:100,cleared:false,elapsed:1200,correct:2});assert.equal((await da.rankings(attempt.day,'easy'))[0].score,100);
 await assertFails(a.db.ref(`${Daily.ROOT}/attempts/${a.key}/${attempt.day}`).remove());await assertFails(a.db.ref(`${Daily.ROOT}/attempts/${a.key}/${attempt.day}/slots/3`).set({id:'four',seed:'s',difficulty:'hard',at:firebase.database.ServerValue.TIMESTAMP}));
 await assertFails(b.db.ref(`${Daily.ROOT}/attempts/${a.key}/${attempt.day}`).set({slots:{}}));
 await assertFails(a.db.ref(`${Daily.ROOT}/titles/${a.key}/daily_easy_king`).set({day:attempt.day}));
 await assertFails(a.db.ref(`${Daily.ROOT}/finals/${attempt.day}/easy`).set((await da.rankings(attempt.day,'easy'))[0]));
 await assertFails(a.db.ref(`${Daily.ROOT}/finals/${attempt.day-1}/hard`).set({fake:true}));
 await assertFails(a.db.ref(`games/factor/accounts/${a.key}/stats/nick`).set('daily_king'));
 const ba=await db.start('normal');await db.finish(ba,{score:200,cleared:true,elapsed:5000,correct:30});assert.equal((await db.rankings(ba.day,'normal'))[0].cleared,true);
 // Wrong difficulty/forged scores cannot enter either leaderboard.
 const forged={...(await da.rankings(attempt.day,'easy'))[0],score:999999};await assertFails(a.db.ref(`${Daily.ROOT}/boards/${attempt.day}/easy/records/${a.key}`).set(forged));
 // Past winners are fixed after the grace period, then claimed only by that account.
 const yesterday=attempt.day-1;const historical={...forged,day:yesterday,score:120,confirmedAt:(yesterday+1)*D.DAY-D.SHIFT-1000};historical.sortKey=D.sortKey(historical);
 await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),`${Daily.ROOT}/boards/${yesterday}/easy`),{leader:historical,records:{[a.key]:historical}}));
 await a.db.ref(`${Daily.ROOT}/finals/${yesterday}/easy`).set(historical);await assertFails(b.db.ref(`${Daily.ROOT}/titles/${b.key}/daily_easy_king`).set({day:yesterday}));await a.db.ref(`${Daily.ROOT}/titles/${a.key}/daily_easy_king`).set({day:yesterday});await assertFails(a.db.ref(`${Daily.ROOT}/titles/${a.key}/daily_easy_king`).remove());
 for(const d of ['normal','hard']){const older={...historical,day:yesterday-1,confirmedAt:historical.confirmedAt-D.DAY};older.sortKey=D.sortKey(older);await env.withSecurityRulesDisabled(ctx=>set(ref(ctx.database(),`${Daily.ROOT}/finals/${yesterday-1}/${d}`),older));await a.db.ref(`${Daily.ROOT}/titles/${a.key}/${D.awardIds[d]}`).set({day:yesterday-1});}
 await a.db.ref(`${Daily.ROOT}/titles/${a.key}/daily_king`).set(true);await a.db.ref(`games/factor/accounts/${a.key}/stats/nick`).set('daily_king');
 // Native SDK room: immutable server timestamps, actual start, input and spectator cap.
 const state={gid:'room-test',diff:'easy',seed:'fixture',players:[a.uid,b.uid],accts:{[a.uid]:a.key,[b.uid]:b.key},duration:60};state.startAt=await Room.prepare({db:a.db,code:'1234',state});
 await a.db.ref('games/factor/rooms/1234/state').set({...state,phase:'play',mode:'B',rules:'b2'});
 let av,bv;const host=Room.create({db:a.db,code:'1234',state,uid:a.uid,isHost:true,onView:m=>av=m,onError:e=>{throw e}}),guest=Room.create({db:b.db,code:'1234',state,uid:b.uid,isHost:false,onView:m=>bv=m,onError:e=>{throw e}});
 await sleep(Math.max(0,state.startAt-Date.now())+50);await host.process();await sleep(100);
 const view=E.view(av.game,a.uid),api=E.runtime(av.game).api;let tiles;for(let i=0;i<view.tiles.length;i++)for(let j=i+1;j<view.tiles.length;j++)if(api.polyEqual(api.multiply(view.tiles[i].factor,view.tiles[j].factor),view.poly))tiles=[view.tiles[i].id,view.tiles[j].id];
 await host.request({type:'answer',seq:1,question:view.question,tiles});await sleep(100);assert.equal(av.game.states[a.uid].c,1);assert.equal(bv.game.states[a.uid].score,av.game.states[a.uid].score);
 const inputRef=a.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/${a.uid}/a1`);const saved=(await inputRef.get()).val();await assertFails(inputRef.set({...saved,at:saved.at+1000}));
 for(let seq=1;seq<=3;seq++)await v.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/cheer_${v.key}/c${seq}`).set({type:'cheer',account:v.key,target:a.uid,seq,at:firebase.database.ServerValue.TIMESTAMP});await sleep(250);await host.process();assert.equal(av.game.states[a.uid].cheerPoints,30);
 await assertFails(v.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/cheer_${v.key}/c4`).set({type:'cheer',account:v.key,target:a.uid,seq:4,at:firebase.database.ServerValue.TIMESTAMP}));
 await assertFails(a.db.ref(`games/factor/rooms/1234/b2/room-test/inputs/cheer_${a.key}/c1`).set({type:'cheer',account:a.key,target:b.uid,seq:1,at:firebase.database.ServerValue.TIMESTAMP}));host.close();guest.close();
 console.log('v5.24 actual Firebase SDK: daily concurrency, immutable proofs, awards, room sync and spectator denial passed');
}finally{await Promise.all(users.map(u=>u.app.delete()));await env.cleanup()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>setTimeout(()=>process.exit(process.exitCode||0),100));
