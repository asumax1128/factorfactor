'use strict';
// Build/review only. This module neither grants awards nor connects to Firebase.
function validateCatalog(catalog) {
  const errors = [], rows = catalog.titles || [], ids = new Set(), numbers = new Set(), old = new Set();
  if (rows.length !== 100) errors.push('NORMAL_COUNT');
  for (const t of rows) {
    if (!Number.isInteger(t.number) || t.number < 1 || t.number > 100 || numbers.has(t.number)) errors.push('DISPLAY_NUMBER');
    if (!Number.isInteger(t.legacyNumber) || old.has(t.legacyNumber)) errors.push('LEGACY_NUMBER');
    if (typeof t.id !== 'string' || !t.id || ids.has(t.id)) errors.push('INTERNAL_ID');
    if (!t.name || !t.condition || !Number.isInteger(t.stars) || t.stars < 1 || t.stars > 5) errors.push('TITLE_FIELDS');
    if (t.legacyId !== null && t.legacyId !== t.id) errors.push('LEGACY_ID_CHANGED');
    ids.add(t.id); numbers.add(t.number); old.add(t.legacyNumber);
  }
  const fiveStar = rows.filter(t => t.stars === 5).map(t => t.id);
  if (fiveStar.length !== 26) errors.push('FIVE_STAR_COUNT');
  if (catalog.hidden?.requiredDistinctFiveStar !== 15 || catalog.hidden?.visibleBeforeEarned !== false || ids.has(catalog.hidden?.id)) errors.push('HIDDEN_RULE');
  return { valid: errors.length === 0, errors: [...new Set(errors)], normalCount: rows.length, fiveStarCount: fiveStar.length, fiveStarIds: fiveStar };
}
function validateRevealPlan(catalog, plan) {
  const errors = [], titles = new Map(catalog.titles.map(t => [t.id, t])), nodes = new Map();
  for (const p of plan) {
    if (!titles.has(p.id) || nodes.has(p.id)) errors.push('REVEAL_ID');
    if (!p.requires?.length && !p.activity) errors.push('REVEAL_UNREACHABLE');
    if (p.requires?.some(id => !titles.has(id))) errors.push('REVEAL_UNKNOWN_PARENT');
    nodes.set(p.id, p);
  }
  for (const t of titles.values()) if (t.stars >= 4 && !nodes.has(t.id)) errors.push('REVEAL_MISSING');
  const visiting = new Set(), done = new Set();
  function visit(id) {
    if (visiting.has(id)) { errors.push('REVEAL_CYCLE'); return; }
    if (done.has(id)) return;
    visiting.add(id); for (const parent of nodes.get(id)?.requires || []) visit(parent);
    visiting.delete(id); done.add(id);
  }
  for (const id of nodes.keys()) visit(id);
  return { valid: errors.length === 0, errors: [...new Set(errors)], count: plan.length };
}
function assertReady(catalog, plan) {
  const checked = validateCatalog(catalog), reveal = validateRevealPlan(catalog, plan);
  if (!checked.valid || !reveal.valid || catalog.status !== 'approved' || plan.some(p => p.status !== 'approved')) {
    const error = new Error('TITLE_SPEC_NOT_APPROVED'); error.details = { checked, reveal }; throw error;
  }
  return true;
}
module.exports = { validateCatalog, validateRevealPlan, assertReady };
