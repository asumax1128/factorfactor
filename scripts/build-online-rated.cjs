const { buildSync } = require("esbuild");
require("./build-online-spark.cjs");
buildSync({
  entryPoints: ["src/online-rated-ui.jsx"],
  outfile: "online-rated-ui.js",
  target: "es2019",
  format: "iife",
});
