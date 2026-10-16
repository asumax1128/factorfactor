// Reuse the existing mathematical and A/B engines without copying a dev game.
const fs = require("node:fs"),
  path = require("node:path");
const Babel = require("@babel/standalone");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const src = html.match(
  /<script type="text\/plain" id="app-source">([\s\S]*?)<\/script>/,
)[1];
const seeds = ['buildBoard','multiply','polyEqual','getJudgment','raidDamage','weeklyInfo','wkCtrOf','wkWeakOf','ctrOf','RAID_CTR_GUARD','RAID_FAMS','partOfLv','useBossGim','chestRoll','wkSession','hashSeed','addOjama','devAward','weekKey','wkBonus','BOSSES','weeklyBoss','WK_RULES'];
const injected = new Set(['useRef','FX','rectC','qs']);
let result;
Babel.transform(src, {
  presets: ["react"],
  code: false,
  plugins: [
    () => ({
      visitor: {
        Program(p) {
          const selected = new Map(),
            queue = [...seeds];
          while (queue.length) {
            const name = queue.pop();
            if (selected.has(name) || injected.has(name)) continue;
            let binding = p.scope.getBinding(name);
            if(!binding&&name==='devAward')p.traverse({VariableDeclarator(v){if(v.node.id.name===name)binding=v.scope.getBinding(name)}});
            if (!binding) throw Error("Missing engine dependency: " + name);
            const b = binding.path;
            if (!b.isFunctionDeclaration() && !b.isVariableDeclarator())
              throw Error("Unsupported binding " + name);
            selected.set(name, b);
            const collect = (r) => {
              const target = r.scope.getBinding(r.node.name);
              if (
                target &&
                target.scope === p.scope &&
                !selected.has(r.node.name)
              )
                queue.push(r.node.name);
            };
            if (b.isReferencedIdentifier()) collect(b);
            b.traverse({ ReferencedIdentifier: collect });
          }
          const defs = [...selected.values()]
            .sort((a, b) => a.node.start - b.node.start)
            .map((b) =>
              b.isVariableDeclarator()
                ? "let " + src.slice(b.node.start, b.node.end) + ";"
                : src.slice(b.node.start, b.node.end),
            );
          result =
            "// GENERATED from main index.html; do not edit. Server-only.\n" +
            defs.join("\n") +
            "\n({" +
            seeds.join(",") +
            "});\n";
          if (/(?:React\.|document\.|localStorage\.|Tone\.)/.test(result))
            throw Error("Browser dependency in server engine");
        },
      },
    }),
  ],
});
const out = path.join(__dirname, "../server/next-authority/weekly-source.js");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, result);
console.log("Weekly authority rules extracted:", result.length, "bytes");
