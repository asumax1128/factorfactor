const fs = require("node:fs"),
  path = require("node:path");
const fragment = require("../firebase/math-tower.rules.fragment.json");
// Local minimal fixture only: existing account verification shape, not production rules.
const rules = {
  rules: {
    ".read": false,
    ".write": false,
    games: {
      factor: {
        teachers: { ".read": "auth != null" },
        logins: {
          $k: {
            $uid: {
              ".write":
                'auth != null && auth.uid === $uid && newData.val() === root.child("games/factor/pins/" + $k).val()',
            },
          },
        },
        ...fragment,
      },
    },
  },
};
fs.writeFileSync(
  path.join(__dirname, "../firebase/math-tower.emulator.rules.json"),
  JSON.stringify(rules, null, 2),
);
