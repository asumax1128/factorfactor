const { buildSync } = require("esbuild");
require("./build-online-spark.cjs");
require("./audit-rewards.cjs");
require("./build-weekly-authority.cjs");
buildSync({
  entryPoints: ["src/online-rated-ui.jsx"],
  outfile: "online-rated-ui.js",
  target: "es2019",
  format: "iife",
});
buildSync({entryPoints:['src/daily-ui.jsx'],outfile:'daily-ui.js',target:'es2019',format:'iife'});
buildSync({entryPoints:['src/room-b2-ui.jsx'],outfile:'room-b2-ui.js',target:'es2019',format:'iife'});

buildSync({entryPoints:['src/next-home-ui.jsx'],bundle:true,outfile:'next-home-ui.js',target:'es2019',format:'iife'});

buildSync({entryPoints:['src/next-results-ui.jsx'],bundle:true,outfile:'next-results-ui.js',target:'es2019',format:'iife'});
