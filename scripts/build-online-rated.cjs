const { buildSync } = require("esbuild");
require("./build-rated-engine.cjs");
buildSync({
  entryPoints: ["src/online-rated-ui.jsx"],
  outfile: "online-rated-ui.js",
  target: "es2019",
  format: "iife",
});
