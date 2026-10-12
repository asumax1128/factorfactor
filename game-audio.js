/* Shared local audio preference. No account/game records are changed. */
(function (root) {
  "use strict";
  const KEY = "fxf_game_mute_v1",
    listeners = new Set(),
    outputs = new Map(),
    menus = new Map();
  let muted = false,
    menuMuted = false;
  try {
    muted = root.localStorage.getItem(KEY) === "1";
  } catch (_) {}
  try {
    menuMuted = root.localStorage.getItem("fxf_ui_mute_v1") === "1";
  } catch (_) {}
  function sync() {
    try {
      root.Tone.getDestination().mute = muted;
    } catch (_) {}
    for (const [context, gain] of menus) {
      try {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(menuMuted ? 0 : 1, context.currentTime);
      } catch (_) {}
    }
    for (const [context, gain] of outputs) {
      try {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(muted ? 0 : 1, context.currentTime);
      } catch (_) {}
    }
  }
  function update(v, persist) {
    muted = !!v;
    if (persist) {
      try {
        root.localStorage.setItem(KEY, muted ? "1" : "0");
      } catch (_) {}
    }
    sync();
    for (const fn of listeners) fn(muted);
  }
  function resume() {
    // Called synchronously by the user's unmute gesture (important on Safari).
    try {
      root.Tone.start().catch(() => {});
    } catch (_) {}
  }
  root.GameAudio = {
    isMuted: () => muted,
    setMuted(v) {
      update(v, true);
      if (!muted) resume();
    },
    sync,
    setMenuMuted(v) {
      menuMuted = !!v;
      sync();
      if (!menuMuted && !muted) resume();
    },
    menuOutput(context) {
      if (!menus.has(context)) {
        const gain = context.createGain();
        gain.gain.value = menuMuted ? 0 : 1;
        gain.connect(root.GameAudio.output(context));
        menus.set(context, gain);
      }
      return menus.get(context);
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(muted);
      return () => listeners.delete(fn);
    },
    output(context) {
      if (!outputs.has(context)) {
        const gain = context.createGain();
        gain.gain.value = muted ? 0 : 1;
        gain.connect(context.destination);
        outputs.set(context, gain);
      }
      return outputs.get(context);
    },
  };
  root.addEventListener("storage", (e) => {
    if (e.key === KEY) update(e.newValue === "1", false);
    else if (e.key === "fxf_ui_mute_v1")
      root.GameAudio.setMenuMuted(e.newValue === "1");
  });
  sync();
})(window);
