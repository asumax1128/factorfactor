const linked =
  "auth != null && root.child('games/factor/logins/' + $account + '/' + auth.uid).exists()";
const participant =
  "auth != null && newData.child('byKey').isString() && root.child('games/factor/logins/' + newData.child('byKey').val() + '/' + auth.uid).exists()";
const played =
  "root.child('games/factor/ghostV1/users/' + newData.child('byKey').val() + '/matches/' + $match)";
const immutable = [
  "id",
  "at",
  "by",
  "byKey",
  "owner",
  "opponent",
  "type",
  "opponentKey",
  "difficulty",
  "mode",
  "outcome",
  "exp",
  "delta",
  "origin",
]
  .map((k) => `newData.child('${k}').val() === data.child('${k}').val()`)
  .join(" && ");
module.exports = {
  ghostV1: {
    ".read": false,
    ".write": false,
    users: {
      $account: {
        ".read": linked,
        ".write": `${linked} && newData.exists()`,
        matches: {
          $match: {
            ".validate":
              "newData.hasChildren(['id','difficulty','origin','opponent','members','phase']) && newData.child('id').val() === $match && newData.child('members/0/key').val() === $account && newData.child('members/1/uid').val() === '_ghost' && (newData.child('difficulty').val() === 'easy' || newData.child('difficulty').val() === 'normal') && (newData.child('origin').val() === 'quick' || newData.child('origin').val() === 'bounty' || newData.child('origin').val() === 'profile') && (!data.exists() || newData.child('origin').val() === data.child('origin').val() && newData.child('difficulty').val() === data.child('difficulty').val() && newData.child('opponent/key').val() === data.child('opponent/key').val() && newData.child('opponent/type').val() === data.child('opponent/type').val())",
          },
        },
        events: {
          $match: {
            ".validate":
              "newData.hasChildren(['id','at','type','difficulty','mode','outcome','exp','delta']) && newData.child('id').val() === $match && newData.child('at').isNumber() && newData.child('exp').isNumber() && newData.child('exp').val() >= 0 && newData.child('exp').val() <= 8 && (!data.exists() || newData.child('at').val() === data.child('at').val() && newData.child('outcome').val() === data.child('outcome').val() && newData.child('exp').val() === data.child('exp').val())",
          },
        },
        bountyCooldowns: {
          $target: {
            ".validate":
              "newData.isNumber() && newData.val() <= now + 604800000 && (!data.exists() || newData.val() >= data.val())",
          },
        },
      },
    },
    inbox: {
      $account: {
        $match: {
          ".read": `${linked} || (auth != null && !data.exists()) || (auth != null && data.exists() && root.child('games/factor/logins/' + data.child('byKey').val() + '/' + auth.uid).exists())`,
          ".write": `${participant} && newData.exists()`,
          ".validate": `newData.hasChildren(['id','at','by','byKey','owner','type','difficulty','mode','outcome']) && newData.child('owner').val() === $account && newData.child('id').val() === $match && newData.child('by').val() === root.child('games/factor/accounts/' + newData.child('byKey').val() + '/name').val() && root.child('games/factor/accounts/' + $account + '/name').exists() && ${played}.child('phase').val() === 'settled' && ${played}.child('opponent/key').val() === $account && (!data.exists() || ${immutable})`,
        },
        ".read": linked,
      },
    },
  },
};
