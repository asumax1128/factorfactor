'use strict';
// One equip slot: games/factor/accounts/<key>/stats/nick (the old modal's pickNick; toggling off clears it).
// Every catalog title (100) and the hidden title can be equipped once EARNED; unearned titles never can.
// Existing save: equipNick (shared with the old modal). No new storage, no rule change.
const labels = require('./title-labels-next.cjs');
const known = new Set(labels.equippableIds());
function route(id, { earned }) {
  return known.has(id) && earned.has(id) ? 'nick' : null;
}
function reason(id, { real, earned, routeOf }) {
  if (!real) return 'ゲストは称号を装備できません';
  if (!earned) return '未取得のため装備できません';
  if (!routeOf) return 'この称号は現在の装備機能に対応していません';
  return '';
}
// Re-check right before saving. `fresh` = ids proven by a fresh read of every source, or null when none could be read;
// `complete` = every source was read successfully. A title is refused only when the fresh read was complete and does not
// contain it; if any source could not be read (offline / not readable) we fall back to the state the UI already proved.
function confirm(id, { fresh, complete, memory }) {
  if (!known.has(id)) return false;
  if (fresh && fresh.has(id)) return true;
  if (complete) return false;
  return memory.has(id);
}
const SLOW_MS = 6000;
module.exports = { route, reason, confirm, SLOW_MS };
