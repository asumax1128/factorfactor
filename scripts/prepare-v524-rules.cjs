const fs=require('node:fs'),path=require('node:path');
const source=process.argv[2]||'firebase/ghost-host.candidate.rules.json',target=process.argv[3]||'firebase/v524.candidate.rules.json';
const full=JSON.parse(fs.readFileSync(source,'utf8')),factor=full.rules.games.factor;
if(factor.dailyV2)throw Error('Review existing dailyV2 before replacing it');
factor.dailyV2=require('../firebase/daily-v2-rules.cjs');
const stats=factor.accounts.$k.stats;
const ids=['daily_easy_king','daily_normal_king','daily_hard_king','daily_king'];
const equip="("+ids.map(id=>`newData.child('nick').val() !== '${id}'`).join(' && ')+" || root.child('games/factor/dailyV2/titles/' + $k + '/' + newData.child('nick').val()).exists())";
stats['.validate']=stats['.validate']?`(${stats['.validate']}) && ${equip}`:equip;
const match=factor.onlineSparkV1.matches.$match;
match.clock={'.validate':"newData.isNumber() && (newData.val() === data.val() || newData.val() === now)"};
match.inputs={$uid:{$input:{'.validate':"newData.hasChildren(['type','at']) && (!data.exists() && auth.uid === $uid && newData.child('at').val() === now && (newData.child('type').val() === 'answer' || newData.child('type').val() === 'leave') || data.exists() && newData.child('at').val() === data.child('at').val() && newData.child('type').val() === data.child('type').val() && newData.child('seq').val() === data.child('seq').val() && newData.child('question').val() === data.child('question').val() && newData.child('tiles/0').val() === data.child('tiles/0').val() && newData.child('tiles/1').val() === data.child('tiles/1').val())"}}};
const host="auth != null && root.child('games/factor/rooms/' + $code + '/meta/host').val() === auth.uid";
const registered="root.child('games/factor/logins/' + newData.child('account').val() + '/' + auth.uid).exists()";
const noPlayer=[0,1,2,3].map(i=>`(!root.child('games/factor/rooms/' + $code + '/state/players/${i}').exists() || newData.child('account').val() !== root.child('games/factor/rooms/' + $code + '/state/accts/' + root.child('games/factor/rooms/' + $code + '/state/players/${i}').val()).val())`).join(' && ');
factor.rooms.$code.b2={$gid:{'.read':'auth != null','.write':`${host} && newData.exists()`,
 '.validate':"!data.child('game').exists() || newData.child('game').exists() && newData.child('game/id').val() === data.child('game/id').val() && newData.child('game/seed').val() === data.child('game/seed').val() && newData.child('game/startAt').val() === data.child('game/startAt').val() && newData.child('game/endAt').val() === data.child('game/endAt').val()",
 clock:{'.write':host,'.validate':"newData.isNumber() && (newData.val() === data.val() || newData.val() === now)"},
 inputs:{$uid:{$input:{'.write':"auth != null && (auth.uid === $uid || $uid === ('cheer_' + newData.child('account').val()) && root.child('games/factor/logins/' + newData.child('account').val() + '/' + auth.uid).exists()) && newData.exists()",'.validate':`newData.hasChildren(['type','at']) && (!data.exists() && (auth.uid === $uid || $uid === ('cheer_' + newData.child('account').val())) && newData.child('at').val() === now && (newData.child('type').val() === 'answer' && root.child('games/factor/rooms/' + $code + '/state/players').hasChild('0') && root.child('games/factor/rooms/' + $code + '/players/' + $uid).exists() || newData.child('type').val() === 'leave' && root.child('games/factor/rooms/' + $code + '/players/' + $uid).exists() || newData.child('type').val() === 'cheer' && ${registered} && ${noPlayer} && newData.child('seq').isNumber() && newData.child('seq').val() >= 1 && newData.child('seq').val() <= 3 && newData.child('target').isString()) || data.exists() && newData.child('at').val() === data.child('at').val() && newData.child('type').val() === data.child('type').val() && newData.child('seq').val() === data.child('seq').val() && newData.child('account').val() === data.child('account').val() && newData.child('target').val() === data.child('target').val() && newData.child('question').val() === data.child('question').val() && newData.child('tiles/0').val() === data.child('tiles/0').val() && newData.child('tiles/1').val() === data.child('tiles/1').val())`}}}
}};
fs.writeFileSync(target,JSON.stringify(full,null,2)+'\n');
console.log('Candidate prepared from',source,'at',target,'; no deployment performed');
