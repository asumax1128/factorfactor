const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const catalog = require('../src/title-catalog-next.json');
const plan = require('../src/title-reveal-next.json');
const { validateCatalog, validateRevealPlan, assertReady } = require('../src/title-catalog-validation.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
test('owner supplied normal catalog has exactly 1..100, distinct old numbers and stable IDs', () => {
  assert.equal(catalog.titles.length, 100);
  assert.deepEqual(catalog.titles.map(t => t.number), Array.from({ length: 100 }, (_, i) => i + 1));
  assert.equal(new Set(catalog.titles.map(t => t.legacyNumber)).size, 100);
  assert.equal(new Set(catalog.titles.map(t => t.id)).size, 100);
  const inventory = fs.readFileSync('reports/titles_inventory.csv', 'utf8');
  for (const t of catalog.titles.filter(t => t.legacyId)) {
    assert.equal(t.id, t.legacyId);
    assert(inventory.includes(`"${t.legacyId}"`), t.id);
  }
  assert.equal(catalog.titles.filter(t => t.legacyId).length, 90);
  assert(!catalog.titles.some(t => /^tw\d+$/.test(t.id)));
});
test('final owner approval promotes No.65 with stable ID and resolves 26 five-star titles', () => {
  const r = validateCatalog(catalog);
  assert.equal(catalog.titles.find(t => t.number === 65).stars, 5);
  assert.equal(catalog.titles.find(t => t.number === 66).name, '王者防衛');
  assert.equal(r.fiveStarCount, 26);
  assert.equal(catalog.titles.find(t => t.number === 65).id, 'tour1');
  assert(r.fiveStarIds.includes('tour1'), 'existing No.65 holders count toward five-star achievements');
  assert.equal(r.valid, true);
  assert.deepEqual(r.errors, []);
  const previous = copy(catalog); previous.titles.find(t => t.number === 65).stars = 4;
  assert(validateCatalog(previous).errors.includes('FIVE_STAR_COUNT'));
  assert.throws(() => assertReady(catalog, plan), /TITLE_SPEC_NOT_APPROVED/);
});
test('every advanced title has a nonempty acyclic reveal proposal and none is approved implicitly', () => {
  assert.deepEqual(validateRevealPlan(catalog, plan), { valid: true, errors: [], count: 52 });
  assert(plan.every(p => p.status === 'proposal' && p.earnedAlwaysVisible));
  for (const t of catalog.titles.filter(t => t.stars >= 4)) assert(plan.some(p => p.id === t.id));
});
test('unknown parents, duplicate plans, missing stages and cycles are rejected', () => {
  const cycle = copy(plan); cycle.find(p => p.id === 'streak10').requires = ['streak50'];
  assert(validateRevealPlan(catalog, cycle).errors.includes('REVEAL_CYCLE'));
  const unknown = copy(plan); unknown[0].requires = ['not-a-title'];
  assert(validateRevealPlan(catalog, unknown).errors.includes('REVEAL_UNKNOWN_PARENT'));
  assert(validateRevealPlan(catalog, plan.slice(1)).errors.includes('REVEAL_MISSING'));
  assert(validateRevealPlan(catalog, [...plan, plan[0]]).errors.includes('REVEAL_ID'));
});
test('review gate requires both the corrected roster and explicit reveal approval', () => {
  // Approval fixture only; it does not modify the owner catalog or approve real reveal rules.
  const c = copy(catalog), p = copy(plan);
  assert.equal(validateCatalog(c).valid, true);
  assert.throws(() => assertReady(c, p), /TITLE_SPEC_NOT_APPROVED/);
  c.status = 'approved'; p.forEach(x => { x.status = 'approved'; });
  assert.equal(assertReady(c, p), true);
});
test('hidden schema specifies 15 of 26, no pre-earn visibility, and CPU/self exclusions', () => {
  assert.equal(catalog.expectedFiveStarCount, 26);
  assert.equal(catalog.hidden.requiredDistinctFiveStar, 15);
  assert.equal(catalog.hidden.visibleBeforeEarned, false);
  assert(!catalog.titles.some(t => t.id === catalog.hidden.id));
  assert.deepEqual(catalog.excludedAwardModes, ['cpu', 'selfGhost']);
});
