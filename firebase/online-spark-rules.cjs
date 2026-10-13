// Only a new sibling branch. No permission changes to old games or accounts.
const linked =
  "auth != null && root.child('games/factor/logins/' + $account + '/' + auth.uid).exists()";
const actorLinked =
  "root.child('games/factor/logins/' + newData.child('key').val() + '/' + auth.uid).exists()";
const cfg =
  "root.child('games/factor/onlineSparkV1/config/enabled').val() === true";
const unchanged = ["uid", "key", "id", "name", "until"]
  .map((k) => `newData.child('${k}').val() === data.child('${k}').val()`)
  .join(" && ");
const claimsEqual = ["uid", "key", "name"]
  .map(
    (k) =>
      `newData.child('claim/${k}').val() === data.child('claim/${k}').val()`,
  )
  .join(" && ");
const slotWrite = `auth != null && (${cfg}) && ((!data.exists() || data.child('until').val() < now) && newData.exists() && newData.child('uid').val() === auth.uid && ${actorLinked} || data.child('uid').val() === auth.uid && (!newData.exists() || newData.child('uid').val() === data.child('uid').val() && newData.child('key').val() === data.child('key').val() && newData.child('id').val() === data.child('id').val() && (${claimsEqual})) || data.exists() && newData.exists() && (${unchanged}) && (!data.child('claim').exists() && newData.child('claim/uid').val() === auth.uid && root.child('games/factor/logins/' + newData.child('claim/key').val() + '/' + auth.uid).exists() || data.child('claim/uid').val() === auth.uid && !newData.child('claim').exists()))`;
const member = (snapshot) =>
  `((${snapshot}.child('members/0/uid').val() === auth.uid && root.child('games/factor/logins/' + ${snapshot}.child('members/0/key').val() + '/' + auth.uid).exists()) || (${snapshot}.child('members/1/uid').val() === auth.uid && root.child('games/factor/logins/' + ${snapshot}.child('members/1/key').val() + '/' + auth.uid).exists()))`;
const slot =
  "root.child('games/factor/onlineSparkV1/slots/' + newData.child('difficulty').val())";
const initialMatch = `${cfg} && ${member("newData")} && ${slot}.child('id').val() === $match && ${slot}.child('uid').val() === newData.child('members/0/uid').val() && ${slot}.child('key').val() === newData.child('members/0/key').val() && ${slot}.child('claim/uid').val() === newData.child('members/1/uid').val() && ${slot}.child('claim/key').val() === newData.child('members/1/key').val()`;
const immutable = [
  "id",
  "difficulty",
  "seed",
  "voteEnd",
  "members/0/uid",
  "members/0/key",
  "members/1/uid",
  "members/1/key",
]
  .map((k) => `newData.child('${k}').val() === data.child('${k}').val()`)
  .join(" && ");
const receiptImmutable = [0, 1]
  .flatMap((i) =>
    ["before", "after", "delta"].map(
      (f) =>
        `newData.child('receipt/players/' + data.child('members/${i}/key').val() + '/${f}').val() === data.child('receipt/players/' + data.child('members/${i}/key').val() + '/${f}').val()`,
    ),
  )
  .join(" && ");
const flags = {
  easy_adept: ["easy", 1730],
  easy_master: ["easy", 1820],
  normal_adept: ["normal", 1730],
  normal_master: ["normal", 1820],
};
const held = Object.keys({ ...flags, dual_master: [] })
  .map(
    (k) =>
      `(data.child('badges/${k}').val() !== true || newData.child('badges/${k}').val() === true)`,
  )
  .join(" && ");
const titleConditions = Object.entries(flags)
  .map(
    ([k, [d, value]]) =>
      `($badge === '${k}' && newData.parent().parent().child('${d}/maxRating').val() >= ${value})`,
  )
  .concat(
    "($badge === 'dual_master' && newData.parent().parent().child('easy/maxRating').val() >= 1820 && newData.parent().parent().child('normal/maxRating').val() >= 1820)",
  )
  .join(" || ");
const bucket = {
  ".validate":
    "newData.hasChildren(['rating','games','w','l','d','maxRating','season','seasonMax']) && newData.child('rating').isNumber() && newData.child('games').isNumber() && newData.child('games').val() >= 0 && newData.child('games').val() % 1 === 0 && newData.child('w').val() + newData.child('l').val() + newData.child('d').val() === newData.child('games').val() && newData.child('season').isString() && newData.child('maxRating').isNumber() && newData.child('maxRating').val() >= newData.child('rating').val() && (!data.exists() || newData.child('games').val() >= data.child('games').val() && newData.child('games').val() <= data.child('games').val() + 1 && newData.child('maxRating').val() >= data.child('maxRating').val() && (newData.child('season').val() !== data.child('season').val() || (newData.child('rating').val() >= data.child('rating').val() - 32 && newData.child('rating').val() <= data.child('rating').val() + 32)))",
};
const profile = {
  ".write": `${linked} && newData.exists()`,
  ".validate": `newData.hasChildren(['name','easy','normal','migrationId','initialRating','initializedAt']) && newData.child('name').isString() && newData.child('name').val().length > 0 && newData.child('name').val().length <= 10 && newData.child('migrationId').val() === 'spark-legacy-to-easy-v1' && newData.child('initializedAt').isNumber() && (!data.exists() && ${cfg} && newData.child('easy/rating').val() === (root.child('games/factor/accounts/' + $account + '/stats/rating').exists() ? root.child('games/factor/accounts/' + $account + '/stats/rating').val() : 1500) && newData.child('initialRating').val() === newData.child('easy/rating').val() && newData.child('normal/rating').val() === 1500 && newData.child('easy/games').val() === 0 && newData.child('normal/games').val() === 0 || data.exists() && newData.child('initialRating').val() === data.child('initialRating').val() && newData.child('initializedAt').val() === data.child('initializedAt').val()) && (${held})`,
  easy: bucket,
  normal: bucket,
  badges: {
    $badge: {
      ".validate": `newData.val() === true && (data.val() === true || ${titleConditions})`,
    },
  },
  title: {
    ".validate":
      "newData.isString() && newData.parent().child('badges/' + newData.val()).val() === true",
  },
  processed: { $match: { ".validate": "newData.val() === true" } },
};

const waitingRead = ["easy", "normal"]
  .map(
    (d) =>
      `(root.child('games/factor/onlineSparkV1/slots/${d}/id').val() === $match && (root.child('games/factor/onlineSparkV1/slots/${d}/uid').val() === auth.uid || root.child('games/factor/onlineSparkV1/slots/${d}/claim/uid').val() === auth.uid))`,
  )
  .join(" || ");
const memberRead =
  "(root.child('games/factor/logins/' + data.child('members/0/key').val() + '/' + auth.uid).exists() || root.child('games/factor/logins/' + data.child('members/1/key').val() + '/' + auth.uid).exists())";
const matchRead = `auth != null && ((data.exists() && ${memberRead}) || (!data.exists() && (${waitingRead})))`;

module.exports = {
  onlineSparkV1: {
    ".read": false,
    ".write": false,
    config: { ".read": "auth != null", ".write": false },
    profiles: { ".read": "auth != null", $account: profile },
    backups: {
      $account: {
        ".read": linked,
        ".write": `${linked} && !data.exists() && newData.exists()`,
        ".validate":
          "newData.hasChildren(['name','at']) && newData.child('name').isString() && newData.child('at').isNumber() && newData.child('stats/rating').val() === root.child('games/factor/accounts/' + $account + '/stats/rating').val()",
      },
    },
    slots: {
      ".read": "auth != null",
      $difficulty: {
        ".write": slotWrite,
        ".validate":
          "($difficulty === 'easy' || $difficulty === 'normal') && newData.hasChildren(['id','uid','key','name','until']) && newData.child('id').isString() && newData.child('uid').isString() && newData.child('key').isString() && newData.child('until').isNumber() && newData.child('until').val() <= now + 30000",
      },
    },
    matches: {
      $match: {
        ".read": matchRead,
        ".write": `auth != null && newData.exists() && (!data.exists() && (${initialMatch}) || data.exists() && ${member("data")})`,
        ".validate": `newData.hasChildren(['id','difficulty','phase','seed','members','snapshots','voteEnd']) && newData.child('id').val() === $match && (newData.child('difficulty').val() === 'easy' || newData.child('difficulty').val() === 'normal') && (newData.child('phase').val() === 'vote' || newData.child('phase').val() === 'play' || newData.child('phase').val() === 'settled' || newData.child('phase').val() === 'cancelled') && (!data.exists() || ${immutable}) && (!data.child('mode').exists() || newData.child('mode').val() === data.child('mode').val()) && (!data.child('receipt').exists() || newData.child('phase').val() === 'settled' && newData.child('receipt/at').val() === data.child('receipt/at').val() && newData.child('receipt/result/winner').val() === data.child('receipt/result/winner').val() && newData.child('receipt/result/draw').val() === data.child('receipt/result/draw').val() && ${receiptImmutable})`,
      },
    },
  },
};
