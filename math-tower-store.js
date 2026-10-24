/* Use the existing compat Auth/RTDB instance; never change auth persistence. */
(function (root) {
  "use strict";
  const BASE = "games/factor/mathTowerV2";
  function account(acct) {
    if (!acct || acct.guest || !/^a[0-9a-z_]+$/.test(acct.key || ""))
      throw Error("先生アカウントでログインしてください");
    return acct.key;
  }
  async function access(db, uid, acct) {
    const key = account(acct);
    if (!db || !uid) throw Error("認証を確認できません");
    // The private grant read verifies logins/{key}/{auth.uid} and teacher status in rules.
    const grant = (await db.ref(`${BASE}/access/${key}`).get()).val();
    if (!grant || grant.enabled !== true || grant.role !== "teacher")
      throw Error("このアカウントには試遊権限がありません");
    return key;
  }
  async function load(db, uid, acct) {
    const key = await access(db, uid, acct);
    // Materials are public by explicit approval. Access to trial data still
    // requires RTDB grant/teacher/UID verification, including after download.
    let content;
    if (root.MathTowerContentUrl) {
      const response = await root.fetch(root.MathTowerContentUrl, {
        cache: "no-cache",
      });
      if (!response.ok) throw Error("素材を読み込めませんでした");
      content = await response.json();
      await access(db, uid, acct);
    } else {
      content = (await db.ref(`${BASE}/content/${key}/chapter1`).get()).val();
    }
    // The old chapter-one file, or AXIOMIA part 1 (layers). Anything else is not played.
    if (
      !content ||
      content.version !== 1 ||
      (content.chapter !== 1 && content.part !== 1)
    )
      throw Error("コンテンツが準備されていません");
    const value = (await db.ref(`${BASE}/trialProgress/${key}`).get()).val();
    const progress = root.MathTowerRules.migrate(value);
    return { key, content, progress };
  }
  function conflict() {
    const e = Error(
      "保存先の記録が更新されています。最新の記録を読み込んでください",
    );
    e.code = "TOWER_CONFLICT";
    return e;
  }
  async function save(db, uid, acct, progress) {
    const key = await access(db, uid, acct);
    const ref = db.ref(`${BASE}/trialProgress/${key}`);
    // get() without an active listener can leave the transaction's local cache
    // empty even after reading an existing record. Keep the query registered
    // until the transaction completes, and never publish optimistic writes.
    const keep = () => {};
    ref.on("value", keep, () => {});
    try {
      const latest = (await ref.get()).val();
      if ((latest ? latest.revision : 0) !== progress.revision)
        throw conflict();
      const result = await ref.transaction(
        (current) => {
          const rev = current ? current.revision : 0;
          if (rev !== progress.revision) return undefined;
          return { ...progress, revision: rev + 1 };
        },
        undefined,
        false,
      );
      if (!result.committed) throw conflict();
      const confirmed = result.snapshot.val();
      if (!confirmed || confirmed.revision !== progress.revision + 1)
        throw Error(
          "保存の完了を確認できません。最新の記録を読み込んでください",
        );
      return { ...progress, revision: confirmed.revision };
    } finally {
      ref.off("value", keep);
    }
  }
  // One writer per mounted trial screen. Changes are applied to the latest
  // local state at execution, not to an old snapshot captured at enqueue time.
  function createWriter({ read, write, commit, busy, live = () => true }) {
    let tail = Promise.resolve(),
      count = 0,
      failure = null,
      acknowledged = null;
    return {
      reset(progress) {
        if (count) throw Error("保存処理の終了を待ってください");
        acknowledged = JSON.stringify(progress);
        failure = null;
      },
      isBusy: () => count > 0,
      idle: () => tail,
      enqueue(change, retry = false) {
        if (!count && retry && failure && failure.code !== "TOWER_CONFLICT")
          failure = null;
        count++;
        busy(true);
        const job = tail
          .then(async () => {
            if (!live()) throw Error("画面が閉じられました");
            if (failure) throw failure;
            const base = root.MathTowerRules.copy(read());
            const next = change(base);
            if (JSON.stringify(next) === acknowledged) return base;
            const saved = await write(next);
            if (live()) {
              commit(saved);
              acknowledged = JSON.stringify(saved);
            }
            return saved;
          })
          .catch((e) => {
            failure = e;
            throw e;
          })
          .finally(() => {
            count--;
            if (live()) busy(count > 0);
          });
        tail = job.catch(() => {});
        return job;
      },
    };
  }
  root.MathTowerStore = { BASE, access, load, save, createWriter };
})(window);
