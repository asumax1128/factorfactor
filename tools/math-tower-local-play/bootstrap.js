// LOCAL MOCK ONLY. This performs no real authentication or Firebase operations.
(function () {
  const prefix = "math-tower-local-v1:";
  const originalGet = Storage.prototype.getItem;
  const originalSet = Storage.prototype.setItem;
  const originalRemove = Storage.prototype.removeItem;
  Storage.prototype.getItem = function (k) {
    return originalGet.call(this, this === localStorage ? prefix + k : k);
  };
  Storage.prototype.setItem = function (k, v) {
    return originalSet.call(this, this === localStorage ? prefix + k : k, v);
  };
  Storage.prototype.removeItem = function (k) {
    return originalRemove.call(this, this === localStorage ? prefix + k : k);
  };
  sessionStorage.setItem("mockuid", "teacher-uid");
  localStorage.setItem(
    "fxf_battle_account_v1",
    JSON.stringify({ key: "ateacher", name: "開発者（モック先生）" }),
  );
  localStorage.setItem("fxf_no_lb", "1");
  let progress;
  try {
    progress = JSON.parse(localStorage.getItem("progress") || "null");
  } catch (_) {
    throw Error(
      "試遊保存を読み込めません。ブラウザの保存設定を確認してください。",
    );
  }
  const tree = {
    games: {
      factor: {
        teachers: { ateacher: { name: "Local developer" } },
        logins: { ateacher: { "teacher-uid": "mock" } },
        mathTowerV2: {
          access: { ateacher: { enabled: true, role: "teacher" } },
          content: { ateacher: { chapter1: window.__privateChapter } },
          trialProgress: progress ? { ateacher: progress } : {},
        },
      },
    },
  };
  window.__fbGet = async () => tree;
  window.__fbOp = async (op) => {
    if (op.path === "games/factor/mathTowerV2/trialProgress/ateacher") {
      // Persist before acknowledgement; quota errors are displayed by the game.
      localStorage.setItem("progress", JSON.stringify(op.v));
    }
  };
  window.fetch = async () =>
    new Response(
      JSON.stringify({ allRecords: [], easy: [], normal: [], hard: [] }),
      { headers: { "Content-Type": "application/json" } },
    );
  // All remaining outbound transports are blocked by connect-src 'none'.
  location.hash = "math-tower";
})();
