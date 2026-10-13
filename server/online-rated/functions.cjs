// Server-only entry. No credentials in source. Deployment remains manual/gated.
// Firebase's WebSocket client ignores NO_PROXY. This branch is exclusively
// for the hardcoded, loopback-only demo emulator; production retains its proxy.
if (
  process.env.GCLOUD_PROJECT === "demo-factorfactor-tower" &&
  process.env.FIREBASE_DATABASE_EMULATOR_HOST === "127.0.0.1:9000" &&
  process.env.FIREBASE_AUTH_EMULATOR_HOST === "127.0.0.1:9099"
) {
  delete process.env.HTTP_PROXY;
  delete process.env.http_proxy;
}
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getDatabase } = require("firebase-admin/database");
const { createService } = require("./service.cjs");
if (
  process.env.GCLOUD_PROJECT !== "demo-factorfactor-tower" &&
  (process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIREBASE_DATABASE_EMULATOR_HOST)
)
  throw Error("Production cannot use emulator authentication or data");
initializeApp({
  databaseURL:
    process.env.GCLOUD_PROJECT === "demo-factorfactor-tower"
      ? "https://demo-factorfactor-tower.firebaseio.com"
      : "https://asumath-games-default-rtdb.asia-southeast1.firebasedatabase.app",
});
const service = createService({
  db: getDatabase(),
  verifyToken: (token) => getAuth().verifyIdToken(token, true),
});
exports.onlineRated = onRequest(
  {
    region: "asia-southeast1",
    maxInstances: 2,
    concurrency: 20,
    cors: ["https://asumax1128.github.io"],
  },
  async (req, res) => {
    if (req.method !== "POST")
      return res.status(405).json({ error: "POST_REQUIRED" });
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
    if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });
    try {
      res.set("Cache-Control", "no-store");
      res.json(await service(token, req.body));
    } catch (e) {
      res.status(400).json({
        error: /^[A-Z_]+$/.test(e.message) ? e.message : "REQUEST_REJECTED",
      });
    }
  },
);
