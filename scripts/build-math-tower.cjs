const path = require("node:path");
const esbuild = require("esbuild");
esbuild.buildSync({
  entryPoints: [path.join(__dirname, "../src/math-tower-ui.jsx")],
  outfile: path.join(__dirname, "../math-tower-ui.js"),
  bundle: false,
  target: "es2020",
  format: "iife",
  legalComments: "inline",
});
// Ver.6.17: the AXIOMIA scripts (docs/axiomia/story) -> math-tower/axiomia-part1.json
const fs = require("node:fs");
const axiomia = require("./build-axiomia.cjs");
fs.writeFileSync(axiomia.OUT, axiomia.serialize(axiomia.build()));
