'use strict';
// Which EXISTING equip process applies to a title (no new storage, no new rules):
//   'nick'  : games/factor/accounts/<key>/stats/nick  (the old profile modal's pickNick; toggling off clears it)
//   'rated' : onlineSparkV1 profile.title via the rated "equipTitle" command (changes only; the command cannot clear)
// Only EARNED titles are ever equippable; anything the existing processes cannot equip stays read-only.
const catalog = require('./title-catalog-next.json');
const known = new Set(catalog.titles.map((t) => t.id));
function route(id, { earned, legacyEquippable, ratedEarned }) {
  if (!known.has(id) || !earned.has(id)) return null;
  if (legacyEquippable.has(id)) return 'nick';
  if (ratedEarned.has(id)) return 'rated';
  return null;
}
function reason(id, { real, earned, routeOf }) {
  if (!real) return 'ゲストは称号を装備できません';
  if (!earned.has(id)) return '未取得のため装備できません';
  if (!routeOf) return 'この称号は現在の装備機能に対応していません';
  return '';
}
const SLOW_MS = 6000;
module.exports = { route, reason, SLOW_MS };
