// Reuse the existing mathematical and A/B engines without copying a dev game.
const fs = require("node:fs"),
  path = require("node:path");
const Babel = require("@babel/standalone");
const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
const src = html.match(
  /<script type="text\/plain" id="app-source">([\s\S]*?)<\/script>/,
)[1];
const seeds = [
  "makeBank",
  "createBEngine",
  "scoreA",
  "problemForA",
  "getJudgment",
  "polyEqual",
  "multiply",
  "DIFFICULTY_CONFIG",
  "qStartA",
  "A_LOCK_MS",
  "A_NEXT_DELAY",
  "QUESTION_TIMEOUT_MS",
  "ratingDelta",
  "BADGES",
  "buildReverseQuestion",
  "withSeed",
  "REVERSE_STAGE_CHANCE",
  "REVERSE_STAGE_MIN_CORRECT",
  "REVERSE_STAGE_POINTS",
  "LEVEL_POINTS",
];
const injected = new Set(["fref", "TSV", "fbNow"]);
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
            const binding = p.scope.getBinding(name);
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
const out = path.join(__dirname, "../server/online-rated/engine-source.js");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, result);
console.log("Server A/B engine extracted:", result.length, "bytes");
