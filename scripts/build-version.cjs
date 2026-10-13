const fs = require("node:fs");
const v = JSON.parse(fs.readFileSync("version.json", "utf8"));
if (
  !Number.isInteger(v.major) ||
  !Number.isInteger(v.minor) ||
  v.major < 1 ||
  v.minor < 0
)
  throw Error("Invalid release version");
const number = `${v.major}.${v.minor}`;
fs.writeFileSync(
  "game-version.js",
  "/* Generated from version.json. */\nwindow.FactorVersion = Object.freeze(" +
    JSON.stringify({ ...v, number, label: `Ver. ${number}` }) +
    ");\n",
);
