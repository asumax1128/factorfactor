const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const catalog = require('../src/title-catalog-next.json');
const plan = require('../src/title-reveal-next.json');
const { validateCatalog, validateRevealPlan, assertReady } = require('../src/title-catalog-validation.cjs');
const copy = x => JSON.parse(JSON.stringify(x));
// Ver.6.33: the daily mode was removed and five titles went with it (No.1-4 the daily winners, No.89 mis7). The remaining 95 keep
// their display numbers, old numbers and ids exactly (no renumbering).
const REMOVED_NUMBERS = [1, 2, 3, 4, 37, 38, 89];   // Ver.6.36: No.37-38 bounty1 / bounty10
test('owner supplied normal catalog: 1..100 minus the removed daily and bounty titles, distinct old numbers and stable IDs', () => {
  assert.equal(catalog.titles.length, 93);
  assert.deepEqual(catalog.titles.map(t => t.number), Array.from({ length: 100 }, (_, i) => i + 1).filter(n => !REMOVED_NUMBERS.includes(n)));
  assert.equal(new Set(catalog.titles.map(t => t.legacyNumber)).size, 93);
  assert.equal(new Set(catalog.titles.map(t => t.id)).size, 93);
  for (const id of ['daily_easy_king', 'daily_normal_king', 'daily_hard_king', 'daily_king', 'mis7', 'bounty1', 'bounty10']) assert.equal(catalog.titles.some(t => t.id === id), false, id);
  const inventory = fs.readFileSync('reports/titles_inventory.csv', 'utf8');
  for (const t of catalog.titles.filter(t => t.legacyId)) {
    assert.equal(t.id, t.legacyId);
    assert(inventory.includes(`"${t.legacyId}"`), t.id);
  }
  assert.equal(catalog.titles.filter(t => t.legacyId).length, 83);
  // Ver.6.36: wanted (No.39) stays, renamed for a plain 7-win streak; its id and condition (maxStreak >= 7) are unchanged.
  assert.deepEqual((({ number, name, condition, stars, id, legacyId }) => ({ number, name, condition, stars, id, legacyId }))(catalog.titles.find(t => t.id === 'wanted')), { number: 39, name: '快進撃', condition: '7連勝', stars: 3, id: 'wanted', legacyId: 'wanted' });
  assert(!catalog.titles.some(t => /^tw\d+$/.test(t.id)));
});
test('final owner approval promotes No.65 with stable ID and resolves 22 five-star titles', () => {
  const r = validateCatalog(catalog);
  assert.equal(catalog.titles.find(t => t.number === 65).stars, 5);
  assert.equal(catalog.titles.find(t => t.number === 66).name, '王者防衛');
  assert.equal(r.fiveStarCount, 22);
  assert.equal(catalog.titles.find(t => t.number === 65).id, 'tour1');
  assert(r.fiveStarIds.includes('tour1'), 'existing No.65 holders count toward five-star achievements');
  assert.equal(r.valid, true);
  assert.deepEqual(r.errors, []);
  const previous = copy(catalog); previous.titles.find(t => t.number === 65).stars = 4;
  assert(validateCatalog(previous).errors.includes('FIVE_STAR_COUNT'));
  assert.throws(() => assertReady(catalog, plan), /TITLE_SPEC_NOT_APPROVED/);
});
test('every advanced title has a nonempty acyclic reveal proposal and none is approved implicitly', () => {
  assert.deepEqual(validateRevealPlan(catalog, plan), { valid: true, errors: [], count: 47 });
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
test('hidden schema specifies 15 of 22, no pre-earn visibility, and CPU/self exclusions', () => {
  assert.equal(catalog.expectedFiveStarCount, 22);
  assert.equal(catalog.hidden.requiredDistinctFiveStar, 15);
  assert.equal(catalog.hidden.visibleBeforeEarned, false);
  assert(!catalog.titles.some(t => t.id === catalog.hidden.id));
  assert.deepEqual(catalog.excludedAwardModes, ['cpu', 'selfGhost']);
});
