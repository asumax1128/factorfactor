'use strict';
// Display label for ANY title id used as the equipped title (stats.nick): catalog titles (100) and the hidden title.
// The catalog defines no icon, so a temporary shared icon is used; rarity (stars) is never touched here.
const catalog = require('./title-catalog-next.json');
const COMMON_ICON = '🏅';
const byId = new Map(catalog.titles.map((t) => [t.id, t]));
function of(id) {
  const t = byId.get(id);
  if (t) return { id, icon: t.icon || COMMON_ICON, label: t.name, source: 'catalog' };
  if (id === catalog.hidden.id) return { id, icon: catalog.hidden.icon || COMMON_ICON, label: catalog.hidden.name, source: 'hidden' };
  return null;
}
// Official display: the catalog name wins; a title the catalog does not define keeps its legacy name/icon.
function resolve(id, legacy) {
  const c = of(id);
  if (c) return { id, icon: (legacy && legacy.icon) || c.icon, label: c.label, source: c.source };
  return legacy ? { id, icon: legacy.icon, label: legacy.label, source: 'legacy' } : null;
}
const equippableIds = () => [...catalog.titles.map((t) => t.id), catalog.hidden.id];
module.exports = { of, resolve, COMMON_ICON, equippableIds, hiddenId: catalog.hidden.id };
