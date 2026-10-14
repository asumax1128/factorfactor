// Opt-in development timings: no UID, account key, name, token, PIN or payload.
let enabled =
  typeof location !== "undefined" &&
  new URLSearchParams(location.search).has("onlinePerf");
const events = [];
const clock = () =>
  typeof performance === "undefined" ? Date.now() : performance.now();
function mark(kind, detail = {}) {
  if (!enabled) return;
  events.push({ kind, t: clock(), ...detail });
  if (events.length > 600) events.shift();
}
function instrument(db) {
  if (!enabled) return db;
  return {
    ref: (path) => {
      const wrappers = new Map();
      const r = db.ref(path),
        scope = /\/matches\//.test(path)
          ? "match"
          : /\/profiles/.test(path)
            ? "profile"
            : "other";
      return new Proxy(r, {
        get: (o, k) => {
          if (k === "get")
            return async () => {
              const t = clock();
              mark("read-start", { scope });
              const s = await o.get();
              mark("read-end", {
                scope,
                ms: clock() - t,
                applicationBytes: new TextEncoder().encode(
                  JSON.stringify(s.val()),
                ).byteLength,
              });
              return s;
            };
          if (k === "transaction")
            return async (fn, ...rest) => {
              const t = clock();
              mark("write-start", { scope });
              const v = await o.transaction(fn, ...rest);
              mark("write-end", {
                scope,
                ms: clock() - t,
                applicationBytes: new TextEncoder().encode(
                  JSON.stringify(v.snapshot?.val() ?? null),
                ).byteLength,
              });
              return v;
            };
          if (k === "on")
            return (ev, fn, ...rest) => {
              mark("listener-add", { scope });
              const wrapped = (s) => {
                mark("sync-event", { scope });
                fn(s);
              };
              wrappers.set(fn, wrapped);
              return o.on(ev, wrapped, ...rest);
            };
          if (k === "off")
            return (ev, fn) => {
              o.off(ev, wrappers.get(fn) || fn);
              wrappers.delete(fn);
            };
          return typeof o[k] === "function" ? o[k].bind(o) : o[k];
        },
      });
    },
  };
}
module.exports = {
  mark,
  instrument,
  clock,
  events,
  setEnabled: (v) => {
    enabled = !!v;
    events.length = 0;
  },
};
