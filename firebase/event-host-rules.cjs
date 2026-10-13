// Patch only FACTOR rooms and add limited-host grants; all unrelated rules preserved.
const root = "games/factor/";
const linked = (k) =>
  `root.child('${root}logins/' + ${k} + '/' + auth.uid).exists()`;
const teacher = (k) =>
  `root.child('${root}teachers/' + ${k}).exists() && ${linked(k)}`;
const grant = (k, scope) =>
  `root.child('${root}eventHosts/' + ${k} + '/enabled').val() === true && root.child('${root}eventHosts/' + ${k} + '/${scope}').val() === true`;
function patch(rules) {
  const f = rules.rules.games.factor,
    r = f.rooms.$code;
  f.eventHosts = {
    ".read": "auth != null",
    $account: {
      ".write": `auth != null && newData.exists() && newData.child('teacher').isString() && ${teacher("newData.child('teacher').val()")}`,
      ".validate":
        "root.child('games/factor/accounts/' + $account + '/name').exists() && newData.hasChildren(['enabled','tournament','raid','teacher','updatedAt']) && newData.child('enabled').isBoolean() && newData.child('tournament').isBoolean() && newData.child('raid').isBoolean() && newData.child('updatedAt').isNumber() && (newData.child('enabled').val() === true || newData.child('tournament').val() === false && newData.child('raid').val() === false)",
    },
  };
  f.eventHostRooms = {
    ".read": "auth != null",
    $account: {
      $code: {
        ".write": `auth != null && newData.exists() && ${linked("$account")} && root.child('${root}rooms/' + $code + '/meta/delegatedAccount').val() === $account && root.child('${root}rooms/' + $code + '/meta/host').val() === auth.uid && root.child('${root}eventHosts/' + $account + '/enabled').val() === true`,
        ".validate":
          "newData.hasChildren(['at']) && newData.child('at').isNumber()",
      },
    },
  };
  const meta = "root.child('games/factor/rooms/' + $code + '/meta')";
  const scope = `(${meta}.child('tour').val() !== true || ${grant(meta + ".child('acct').val()", "tournament")}) && (${meta}.child('raid').val() !== true || ${grant(meta + ".child('acct').val()", "raid")})`;
  const authorized = `(!${meta}.child('delegatedAccount').exists() || (${teacher(meta + ".child('acct').val()")} || (${linked(meta + ".child('acct').val()")} && ${scope} && root.child('${root}eventHostRooms/' + ${meta}.child('delegatedAccount').val() + '/' + $code).exists())))`;
  // Host administration only. Existing participant self-writes remain exactly as before.
  for (const [field, value] of Object.entries(r)) {
    if (field === "meta" || !value[".write"]) continue;
    value[".write"] = `(${value[".write"]}) && ${authorized}`;
  }
  const takeover = `data.child('delegatedAccount').exists() && ${teacher("newData.child('acct').val()")} && newData.child('host').val() === auth.uid && newData.child('delegatedAccount').val() === data.child('delegatedAccount').val() && newData.child('createdAt').val() === data.child('createdAt').val() && newData.child('tour').val() === data.child('tour').val() && newData.child('raid').val() === data.child('raid').val() && newData.child('fraid').val() === data.child('fraid').val() && newData.child('qm').val() === data.child('qm').val()`;
  r.meta[".write"] =
    `auth != null && $code.matches(/^[0-9]{4}$/) && ((${r.meta[".write"]} && (!data.child('delegatedAccount').exists() || data.child('createdAt').val() < now - 21600000 || ${authorized})) || ${takeover})`;
  r.meta[".validate"] =
    `newData.child('host').val() === auth.uid && newData.child('createdAt').isNumber() && ((newData.child('tour').val() != true && newData.child('raid').val() != true) || (${teacher("newData.child('acct').val()")}) || (newData.child('delegatedAccount').val() === newData.child('acct').val() && ${linked("newData.child('acct').val()")} && (newData.child('tour').val() !== true || ${grant("newData.child('acct').val()", "tournament")}) && (newData.child('raid').val() !== true || ${grant("newData.child('acct').val()", "raid")})))`;
  r.meta[".validate"] +=
    " && (!data.child('delegatedAccount').exists() || data.child('createdAt').val() < now - 21600000 || newData.child('delegatedAccount').val() === data.child('delegatedAccount').val() && newData.child('tour').val() === data.child('tour').val() && newData.child('raid').val() === data.child('raid').val() && newData.child('createdAt').val() === data.child('createdAt').val())";
  return rules;
}
module.exports = { patch };
