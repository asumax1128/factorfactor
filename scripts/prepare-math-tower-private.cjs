/* Offline packaging only. Output must be outside the public checkout. No uploads. */
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const [sourceArg, outputArg] = process.argv.slice(2);
if (!sourceArg || !outputArg)
  throw Error(
    "Usage: node scripts/prepare-math-tower-private.cjs SOURCE_DIRECTORY OUTPUT_JSON_OUTSIDE_CHECKOUT",
  );
const source = fs.realpathSync(sourceArg),
  output = path.resolve(outputArg);
fs.mkdirSync(path.dirname(output), { recursive: true });
const resolved = path.join(
  fs.realpathSync(path.dirname(output)),
  path.basename(output),
);
if (resolved === root || resolved.startsWith(root + path.sep))
  throw Error("Private output must be outside checkout");
const ctx = { window: {} };
vm.runInNewContext(
  fs.readFileSync(path.join(source, "suri-data.js"), "utf8"),
  ctx,
);
const old = ctx.window.SURI_DATA;
const ids = [
  "count_rabbit",
  "zero_slime",
  "plus",
  "minus",
  "twin_fox",
  "abs_wolf",
  "nul",
  "voice",
];
const assets = [];
function image(relative) {
  if (!relative) return null;
  const p = fs.realpathSync(path.join(source, relative));
  if (!p.startsWith(source + path.sep)) throw Error("Asset escapes source");
  const bytes = fs.readFileSync(p);
  assets.push({
    path: relative,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  });
  return "data:image/webp;base64," + bytes.toString("base64");
}
const characters = Object.fromEntries(
  ids.map((id) => [
    id,
    { ...old.characters[id], image: image(old.characters[id].image) },
  ]),
);
const backgrounds = Object.fromEntries(
  [
    "classroom",
    "tower",
    ...Array.from({ length: 5 }, (_, i) => "f0" + (i + 1)),
  ].map((id) => [
    id,
    { ...old.backgrounds[id], image: image(old.backgrounds[id].image) },
  ]),
);
const content = {
  chapter: 1,
  version: 1,
  title: old.chapters[0].title,
  policy: JSON.parse(
    fs.readFileSync(path.join(root, "math-tower-policy.json")),
  ),
  characters,
  backgrounds,
  floors: Object.fromEntries(
    Object.entries(old.floors).filter(([f]) => Number(f) <= 5),
  ),
  events: old.events
    .filter((e) => e.floor <= 5)
    .map((e) => ({
      ...e,
      title: (e.title || "").replaceAll("数理の塔", "数学の塔"),
    })),
  notes: old.notes.filter((n) => n.floor <= 5),
  fragment: old.fragments[0],
  monsters: Object.fromEntries(
    ids.filter((id) => old.monsters[id]).map((id) => [id, old.monsters[id]]),
  ),
};
fs.writeFileSync(resolved, JSON.stringify(content), {
  flag: "wx",
  mode: 0o600,
});
fs.writeFileSync(
  resolved + ".manifest.json",
  JSON.stringify(
    { sourceFiles: assets, chapter: 1, policy: content.policy.id },
    null,
    2,
  ),
  { flag: "wx", mode: 0o600 },
);
console.log(
  "Prepared private chapter-one content; " +
    assets.length +
    " images; NOT uploaded.",
);
