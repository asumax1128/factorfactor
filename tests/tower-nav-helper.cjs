// New-home path to the math tower (Ver.6.9): solo hub -> AXIOMIA card (= the existing math tower, teacher/access accounts only).
// The tower itself still checks access; the card only opens the gate that starts it.
async function openTower(p) {
  await p.locator(".action-card.solo").click(); await p.locator('[data-solo-hub]').waitFor();
  const card = p.locator('[data-solo-mode=axiomia]');
  await card.waitFor({ state: "visible", timeout: 15000 });
  await card.click();
}
module.exports = { openTower };
