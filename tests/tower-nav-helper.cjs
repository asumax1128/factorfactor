// New-home path to the math tower: solo card -> 数学の塔 tile under the solo hub (shown only for a seeded teacher/access tree).
// The tower itself is still checked by each caller; this only replaces the old home button.
async function openTower(p) {
  await p.locator(".action-card.solo").click(); await p.locator('[data-solo-hub]').waitFor();
  const tile = p.getByRole("button", { name: /数学の塔/ }).first();
  await tile.waitFor({ state: "visible", timeout: 15000 });
  await tile.click();
}
module.exports = { openTower };
