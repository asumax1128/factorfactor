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
