// Reference: factorfactor-dev 0dd2f14 tests/mockfb2.js. Test double only; emulator verifies actual rules.
// テスト専用：Firebase compat API の最小限の偽物。データ本体は Node 側（__fbOp / __fbGet）にある。
(function () {
  const TSV = { ".sv": "timestamp" };
  let tree = {};
  const listeners = []; // {path, fn, last}
  const split = (p) => p.split("/").filter(Boolean);
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  function norm(v) {
    if (v === null || v === undefined) return null;
    if (Array.isArray(v)) {
      const o = {};
      v.forEach((x, i) => {
        const n = norm(x);
        if (n !== null) o[i] = n;
      });
      return Object.keys(o).length ? o : null;
    }
    if (isObj(v)) {
      if (v[".sv"] === "timestamp") return Date.now();
      const o = {};
      Object.entries(v).forEach(([k, x]) => {
        const n = norm(x);
        if (n !== null) o[k] = n;
      });
      return Object.keys(o).length ? o : null;
    }
    return v;
  }
  function out(v) {
    if (!isObj(v)) return v;
    const keys = Object.keys(v);
    if (
      keys.length &&
      keys.every((k) => /^\d+$/.test(k)) &&
      Math.max(...keys.map(Number)) < keys.length * 2
    ) {
      const a = [];
      keys.forEach((k) => (a[+k] = out(v[k])));
      return a;
    }
    const o = {};
    keys.forEach((k) => (o[k] = out(v[k])));
    return o;
  }
  function getAt(t, path) {
    let c = t;
    for (const k of split(path)) {
      if (!isObj(c)) return null;
      c = c[k];
      if (c === undefined) return null;
    }
    return c === undefined ? null : c;
  }
  function setAt(t, path, v) {
    const ks = split(path);
    if (!ks.length) return v === null ? {} : v;
    let c = t;
    const stack = [];
    for (let i = 0; i < ks.length - 1; i++) {
      if (!isObj(c[ks[i]])) c[ks[i]] = {};
      stack.push([c, ks[i]]);
      c = c[ks[i]];
    }
    const last = ks[ks.length - 1];
    if (v === null) delete c[last];
    else c[last] = v;
    for (let i = stack.length - 1; i >= 0; i--) {
      const [p, k] = stack[i];
      if (isObj(p[k]) && !Object.keys(p[k]).length) delete p[k];
    }
    return t;
  }
  function applyOp(op) {
    if (op.kind === "set") tree = setAt(tree, op.path, op.v);
    else if (op.kind === "update")
      Object.entries(op.v).forEach(([k, v]) => {
        tree = setAt(tree, op.path + "/" + k, v);
      });
    fire();
  }
  function fire() {
    listeners.slice().forEach((l) => {
      if (!authorized(l.path)) {
        if (l.cancel) l.cancel(Error("PERMISSION_DENIED"));
        return;
      }
      const v = JSON.stringify(getAt(tree, l.path));
      if (v !== l.last) {
        l.last = v;
        try {
          l.fn(snap(l.path));
        } catch (e) {
          console.error(e);
        }
      }
    });
  }
  window.__fbApply = applyOp;
  function snap(path) {
    const raw = getAt(tree, path);
    const v = raw == null ? null : out(JSON.parse(JSON.stringify(raw)));
    return { val: () => v, exists: () => v !== null, key: split(path).pop(),forEach(fn){for(const [key,value]of Object.entries(v||{}))if(fn({key,val:()=>value})===true)break;} };
  }
  const send = async (op) => {
    await window.__fbOp(op);
    applyOp(op);
  };
  function authorized(path) {
    if (!path.startsWith("games/factor/mathTowerV2/")) return true;
    const key = split(path)[4];
    return !!(
      getAt(tree, "games/factor/logins/" + key + "/" + uid) &&
      getAt(tree, "games/factor/teachers/" + key)
    );
  }
  let transactionQueue = Promise.resolve();
  function ref(path) {
    path = split(path).join("/");
    return {
      _p: path,
      child(p){return ref(path+'/'+p)},
      orderByChild(field){return {limitToFirst(n){return {async get(){const s=await ref(path).get();const rows=Object.entries(s.val()||{}).sort((a,b)=>String(a[1][field]).localeCompare(String(b[1][field]))).slice(0,n);return {val:()=>Object.fromEntries(rows),forEach(fn){for(const[key,value]of rows)if(fn({key,val:()=>value})===true)break}}}}}}},
      on(ev, fn, cancel) {
        if (path === ".info/serverTimeOffset") {
          setTimeout(() => fn({ val: () => 0 }), 0);
          return fn;
        }
        if (path === ".info/connected") {
          setTimeout(() => fn({ val: () => true }), 0);
          return fn;
        }
        const l = { path, fn, cancel, last: undefined };
        listeners.push(l);
        setTimeout(() => {
          l.last = JSON.stringify(getAt(tree, path));
          fn(snap(path));
        }, 0);
        return fn;
      },
      off(ev, fn) {
        const i = listeners.findIndex((l) => l.path === path && l.fn === fn);
        if (i >= 0) listeners.splice(i, 1);
      },
      get() {
        return authorized(path)
          ? Promise.resolve(snap(path))
          : Promise.reject(Error("PERMISSION_DENIED"));
      },
      set(v) {
        return send({ kind: "set", path, v: norm(v) });
      },
      update(o) {
        const n = {};
        Object.entries(o).forEach(([k, v]) => (n[k] = norm(v)));
        return send({ kind: "update", path, v: n });
      },
      remove() {
        return send({ kind: "set", path, v: null });
      },
      push(v) {
        const id =
          "-p" +
          Date.now().toString(36) +
          Math.random().toString(36).slice(2, 8);
        const r = ref(path + "/" + id);
        const pr = v === undefined ? Promise.resolve() : r.set(v);
        pr.key = id;
        pr.then = pr.then.bind(pr);
        return Object.assign(pr, { key: id });
      },
      transaction(fn) {
        const task = transactionQueue.then(async () => {
          const cur = snap(path).val(), nv = fn(cur);
          if (nv === undefined) return { committed: false };
          await send({ kind: "set", path, v: norm(nv) });
          return { committed: true, snapshot: snap(path) };
        });
        transactionQueue = task.catch(() => {});
        return task;
      },
      onDisconnect() {
        return { remove() {}, cancel() {} };
      },
    };
  }
  let uid;
  try {
    uid = sessionStorage.getItem("mockuid");
    if (!uid) {
      uid = "u" + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem("mockuid", uid);
    }
  } catch (e) {
    uid = "u" + Math.random().toString(36).slice(2, 10);
  }
  window.firebase = {
    initializeApp() {},
    database: Object.assign(() => ({ ref }), {
      ServerValue: { TIMESTAMP: TSV },
    }),
    auth: () => ({
      onAuthStateChanged(cb) {
        setTimeout(() => cb({ uid }), 10);
      },
      signInAnonymously() {
        return Promise.resolve();
      },
    }),
  };
  window.__fbUid = uid;
  window.__fbGet().then((t) => {
    tree = t || {};
    fire();
  });
})();
