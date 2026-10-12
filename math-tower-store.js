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
      if (!response.ok) throw Error("第1章の素材を読み込めませんでした");
      content = await response.json();
      await access(db, uid, acct);
    } else {
      content = (await db.ref(`${BASE}/content/${key}/chapter1`).get()).val();
    }
    if (!content || content.chapter !== 1 || content.version !== 1)
      throw Error("第1章のコンテンツが準備されていません");
    const value = (await db.ref(`${BASE}/trialProgress/${key}`).get()).val();
    const fresh = root.MathTowerRules.fresh();
    const progress = { ...fresh, ...(value || {}) };
    for (const k of [
      "read",
      "reveal",
      "seen",
      "kills",
      "notes",
      "newInfo",
      "history",
    ])
      progress[k] = progress[k] || {};
    progress.difficulties = Object.fromEntries(
      Object.entries(fresh.difficulties).map(([d, x]) => [
        d,
        {
          ...x,
          ...((value && value.difficulties && value.difficulties[d]) || {}),
          records:
            (value &&
              value.difficulties &&
              value.difficulties[d] &&
              value.difficulties[d].records) ||
            {},
        },
      ]),
    );
    return { key, content, progress };
  }
  async function save(db, uid, acct, progress) {
    const key = await access(db, uid, acct);
    const ref = db.ref(`${BASE}/trialProgress/${key}`);
    const result = await ref.transaction((current) => {
      const rev = current ? current.revision : 0;
      if (rev !== progress.revision) return undefined;
      return { ...progress, revision: rev + 1 };
    });
    if (!result.committed)
      throw Error(
        "別の端末で記録が更新されました。保存せず再読み込みしてください",
      );
    return { ...progress, revision: progress.revision + 1 };
  }
  root.MathTowerStore = { BASE, access, load, save };
})(window);
