const fs = require("node:fs"),
  path = require("node:path"),
  esbuild = require("esbuild");
require("./build-rated-engine.cjs");
const source = fs.readFileSync("server/online-rated/engine-source.js", "utf8");
const completion =
  "({makeBank,createBEngine,scoreA,problemForA,getJudgment,polyEqual,multiply,DIFFICULTY_CONFIG,qStartA,A_LOCK_MS,A_NEXT_DELAY,QUESTION_TIMEOUT_MS,ratingDelta,BADGES,buildReverseQuestion,withSeed,REVERSE_STAGE_CHANCE,REVERSE_STAGE_MIN_CORRECT,REVERSE_STAGE_POINTS,LEVEL_POINTS});";
if (!source.includes(completion))
  throw Error("Engine completion changed; review required");
const body = source.replace(completion, "return " + completion);
esbuild
  .build({
    stdin: {
      contents:
        'window.OnlineSpark = require("./src/online-spark-client.cjs");window.EventHost = require("./src/event-host-client.cjs");window.DailyV2 = require("./src/daily-client.cjs");window.RoomB2 = require("./src/room-b2-client.cjs");window.FriendRaidNext = require("./src/friend-raid-next.cjs");window.TitlePresentationNext = require("./src/title-presentation-next.cjs");window.TournamentB2 = require("./src/tournament-b2.cjs");window.NextAuthority = require("./src/authority-client-next.cjs");window.WeeklyRunNext = require("./src/weekly-run-next.cjs");window.LocalB2Bots = require("./src/local-b2-bots.cjs");',
      resolveDir: process.cwd(),
    },
    outfile: "online-spark.js",
    bundle: true,
    format: "iife",
    target: "es2019",
    plugins: [
      {
        name: "browser-math-engine",
        setup(build) {
          build.onLoad(
            { filter: /server\/online-rated\/engine\.cjs$/ },
            (args) => {
              const original = fs.readFileSync(args.path, "utf8");
              const at = original.indexOf("const clone =");
              if (at < 0) throw Error("Engine wrapper changed");
              return {
                contents:
                  'const makeRuntime=new Function("Math","Date","fref","TSV","fbNow",' +
                  JSON.stringify(body) +
                  ");const script={runInNewContext:c=>makeRuntime(c.Math,c.Date,c.fref,c.TSV,c.fbNow)};\n" +
                  original.slice(at),
                loader: "js",
                resolveDir: path.dirname(args.path),
              };
            },
          );
          build.onLoad(
            { filter: /server\/online-rated\/core\.cjs$/ },
            (args) => {
              const original = fs.readFileSync(args.path, "utf8");
              return {
                contents: original.replace(
                  'const crypto = require("node:crypto"),\n  Engine = require("./engine.cjs");',
                  'const Engine = require("./engine.cjs");',
                ),
                loader: "js",
                resolveDir: path.dirname(args.path),
              };
            },
          );
        },
      },
    ],
  })
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
