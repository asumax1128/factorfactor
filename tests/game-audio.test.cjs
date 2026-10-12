const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
function make(saved = {}) {
  const values = { ...saved },
    handlers = {},
    dest = { mute: false };
  const window = {
    Tone: { getDestination: () => dest },
    localStorage: {
      getItem: (k) => values[k] || null,
      setItem: (k, v) => {
        values[k] = v;
      },
    },
    addEventListener: (e, fn) => {
      handlers[e] = fn;
    },
  };
  vm.runInNewContext(
    fs.readFileSync(require.resolve("../game-audio.js"), "utf8"),
    { window },
  );
  const context = {
    currentTime: 3,
    destination: {},
    createGain: () => ({
      gain: {
        value: 1,
        cancelScheduledValues() {},
        setValueAtTime(v) {
          this.value = v;
        },
      },
      connect() {},
    }),
  };
  return { A: window.GameAudio, context, dest, values, handlers };
}
test("persisted global OFF applies before any voice or Web Audio output is created", () => {
  const t = make({ fxf_game_mute_v1: "1" });
  assert.equal(t.dest.mute, true);
  assert.equal(t.A.output(t.context).gain.value, 0);
  assert.equal(t.A.menuOutput(t.context).gain.value, 1);
  t.A.setMuted(false);
  assert.equal(t.dest.mute, false);
  assert.equal(t.A.output(t.context).gain.value, 1);
  assert.equal(t.values.fxf_game_mute_v1, "0");
});
test("global mute silences existing outputs; menu-only mute remains independent", () => {
  const t = make(),
    out = t.A.output(t.context),
    menu = t.A.menuOutput(t.context);
  t.A.setMenuMuted(true);
  assert.equal(menu.gain.value, 0);
  assert.equal(out.gain.value, 1);
  assert.equal(t.dest.mute, false);
  t.A.setMuted(true);
  assert.equal(out.gain.value, 0);
  assert.equal(t.dest.mute, true);
  t.A.setMenuMuted(false);
  assert.equal(out.gain.value, 0);
  assert.equal(menu.gain.value, 1);
  assert.equal(t.dest.mute, true);
});
test("all subscribers and storage-restored preferences stay in sync without starting voices", () => {
  const t = make(),
    seen = [];
  const off = t.A.subscribe((v) => seen.push(v));
  t.A.setMuted(true);
  t.handlers.storage({ key: "fxf_game_mute_v1", newValue: "0" });
  assert.deepEqual(seen, [false, true, false]);
  off();
  t.A.setMuted(true);
  assert.deepEqual(seen, [false, true, false]);
});
