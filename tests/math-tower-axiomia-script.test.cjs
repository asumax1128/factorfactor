// The game data must be exactly the approved scripts: nothing missing, nothing twice, nothing reordered, nothing reworded.
// This test reads the Markdown with its own small reader (not the converter's) and compares it with the committed game file.
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const part = JSON.parse(fs.readFileSync(path.join(root, "math-tower/axiomia-part1.json"), "utf8"));
const md = (f) => fs.readFileSync(path.join(root, "docs/axiomia/story", f), "utf8").split("\n");
const FILES = {
  "00_prologue.md": [/^## Scene 1｜/, /^## 脚本レビュー/],
  "01_layer_01.md": [/^## 第一幕｜/, /^## シナリオ品質確認/],
};
const lineOf = (x) => (Array.isArray(x) ? { who: x[0], text: x[1], opts: x[2] || {}, src: x[3] } : x);
const allEvents = [...part.prologue.events, ...part.layers.flatMap((l) => l.events)];
const bySrc = new Map();
for (const ev of allEvents)
  for (const raw of ev.lines) {
    const l = lineOf(raw),
      [file, no] = l.src.split(":");
    const key = file + ":" + no;
    assert(!bySrc.has(key), "a script line is used twice: " + key);
    bySrc.set(key, { ...l, ev: ev.id });
  }

test("every dialogue and narration line of the approved scripts is in the game data, once, with its speaker, unchanged", () => {
  let dialogue = 0,
    narration = 0,
    cards = 0;
  for (const [file, [start, end]] of Object.entries(FILES)) {
    const L = md(file),
      a = L.findIndex((x) => start.test(x)),
      b = L.findIndex((x) => end.test(x));
    assert(a >= 0 && b > a, file + " body markers");
    let inBox = false;
    for (let i = a; i < b; i++) {
      const s = L[i],
        src = `${file}:${i + 1}`;
      let m;
      if (/^<box\b/.test(s)) {
        inBox = true;
        const got = bySrc.get(src);
        assert(got, "card is in the data: " + src);
        assert.equal(got.opts.kind === "card" || got.opts.kind === "note", true);
        const items = [];
        for (let j = i + 1; !/^<\/box>/.test(L[j]); j++) {
          const it = L[j].match(/^\s*<(title|text|caption)\b[^>]*>(.*)<\/\1>\s*$/);
          if (it && it[1] !== "caption") items.push(it[2]);
        }
        if (got.opts.kind === "card") assert.deepEqual(got.opts.card.map((c) => c.t), items, "card texts " + src);
        else assert.deepEqual([got.text], items.slice(0, 1), "note text " + src);
        cards++;
      } else if (/^<\/box>/.test(s)) inBox = false;
      else if (inBox) continue;
      else if ((m = s.match(/^\*\*(.+?)\*\*「(.*)」\s*$/))) {
        const got = bySrc.get(src);
        assert(got, "dialogue is in the data: " + src + " " + s);
        assert.equal(got.text, m[2], "wording " + src);
        if (m[1] === "主人公") assert.equal(got.who, "hero", "speaker " + src);
        else assert.equal(got.opts.name, m[1], "speaker label " + src);
        dialogue++;
      } else if ((m = s.match(/^\*\*([^*]+)\*\*\s*$/))) {
        // an emphasised standalone line (the "to be continued" line at the end of a layer)
        const got = bySrc.get(src);
        assert(got, "emphasised line is in the data: " + src + " " + s);
        assert.equal(got.text, m[1]);
        assert.deepEqual(got.opts.card.map((c) => c.t), [m[1]]);
        cards++;
      } else if ((m = s.match(/^\*(?!\*)(.+)\*\s*$/))) {
        const got = bySrc.get(src);
        assert(got, "narration is in the data: " + src);
        assert.equal(got.who, "narr");
        assert.equal(got.text, m[1], "wording " + src);
        narration++;
      }
    }
  }
  assert.equal(dialogue, 113 + 269, "dialogue lines of prologue + layer 1");
  assert.equal(narration, 67 + 75, "narration lines of prologue + layer 1");
  assert(cards >= 5);
});

test("the data holds nothing but script lines and the headings shown as cards; order follows the script", () => {
  const bodyLines = new Set();
  for (const [file, [start, end]] of Object.entries(FILES)) {
    const L = md(file),
      a = L.findIndex((x) => start.test(x)),
      b = L.findIndex((x) => end.test(x));
    for (let i = a; i < b; i++) bodyLines.add(`${file}:${i + 1}`);
  }
  for (const [src, l] of bySrc) {
    assert(bodyLines.has(src), "line comes from the script body: " + src);
    const [file, no] = src.split(":"),
      s = md(file)[no - 1];
    if (l.opts.kind === "card" && /^#{1,6} /.test(s)) {
      // a heading shown as a location card: its words are the heading's words
      assert.equal(l.opts.card.map((c) => c.t).join("｜"), s.replace(/^#+ /, ""), "heading card " + src);
    }
  }
  // game order == script order: within a file the source line numbers only go up
  for (const file of Object.keys(FILES)) {
    const order = allEvents.flatMap((ev) => ev.lines.map(lineOf)).filter((l) => l.src.startsWith(file + ":")).map((l) => Number(l.src.split(":")[1]));
    assert.deepEqual(order, [...order].sort((x, y) => x - y), file + " order");
  }
});

test("every non-empty script body line is placed, or listed as a skipped stage direction (nothing disappears silently)", () => {
  const skipped = new Set(part.source.skipped.map((x) => x.src));
  for (const [file, [start, end]] of Object.entries(FILES)) {
    const L = md(file),
      a = L.findIndex((x) => start.test(x)),
      b = L.findIndex((x) => end.test(x));
    let box = false;
    for (let i = a; i < b; i++) {
      const s = L[i],
        src = `${file}:${i + 1}`;
      if (!s.trim() || /^---+\s*$/.test(s)) continue;
      if (/^<box\b/.test(s)) box = true;
      if (box) {
        // interior of a card: the card line itself is placed; a caption is a production note and listed
        if (/<caption\b/.test(s)) assert(skipped.has(src), "caption listed: " + src);
        if (/^<\/box>/.test(s)) box = false;
        continue;
      }
      assert(bySrc.has(src) || skipped.has(src), "line neither placed nor listed: " + src + " " + s);
    }
  }
  // what is skipped is only stage directions, structural sub headings and production captions
  for (const x of part.source.skipped) assert(/^(stage direction|structural heading \(not displayed\)|caption \(production note\)|heading \(the card below carries the same words\))$/.test(x.why), x.why);
  // the skipped stage directions are the script's own "背景：" / "主要地点" / sub-title lines
  for (const x of part.source.skipped.filter((y) => y.why === "stage direction"))
    assert(/^(背景：|主要地点|事件解決演出|第1層エピローグ)/.test(x.text), "unexpected stage direction: " + x.text);
});

test("the committed game file is what the converter produces from the scripts; the scripts are unchanged since", () => {
  const { build, serialize } = require("../scripts/build-axiomia.cjs");
  assert.equal(fs.readFileSync(path.join(root, "math-tower/axiomia-part1.json"), "utf8"), serialize(build()));
  for (const f of part.source.files) {
    const text = fs.readFileSync(path.join(root, f.file), "utf8");
    assert.equal(crypto.createHash("sha256").update(text).digest("hex"), f.sha256, f.file + " changed after the game data was built");
  }
});

test("scenario structure: ids, flow, backgrounds, pictures, names", () => {
  const ids = allEvents.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "unique event ids");
  assert.deepEqual(part.prologue.events.map((e) => e.id), ["AX1-L00-S1", "AX1-L00-S2", "AX1-L00-S3", "AX1-L00-S4", "AX1-L00-S5"]);
  const L1 = part.layers[0];
  assert.equal(L1.layer, 1);
  for (const f of [1, 2, 3, 4, 5]) {
    assert.deepEqual(L1.flow.pre[f], [`AX1-L01-P${f}-pre`]);
    assert.equal(L1.flow.post[f][0], `AX1-L01-P${f}-post`);
  }
  assert.deepEqual(L1.flow.post[5], ["AX1-L01-P5-post", "AX1-L01-clear", "AX1-L01-fragment", "AX1-L01-gate"]);
  for (const id of [...Object.values(L1.flow.pre).flat(), ...Object.values(L1.flow.post).flat()]) assert(ids.includes(id), "flow id exists " + id);
  assert.deepEqual(L1.floors, { 1: "count_rabbit", 2: "zero_slime", 3: "twin_fox", 4: "abs_wolf", 5: "nul" });
  for (const ev of allEvents) {
    assert(ev.src.file && ev.src.from <= ev.src.to);
    if (ev.bg) assert(part.backgrounds[ev.bg], "background exists: " + ev.bg);
    for (const raw of ev.lines) {
      const l = lineOf(raw);
      if (l.opts.bg) assert(part.backgrounds[l.opts.bg], "background exists: " + l.opts.bg);
      if (l.who !== "narr" && l.who !== "hero") assert(part.characters[l.who], "speaker exists: " + l.who);
    }
  }
  for (const b of Object.values(L1.battleBg)) assert(part.backgrounds[b]);
  // Every picture the data points to is a real file; the adopted artwork is byte-identical to chapter one's.
  const chapter1 = require("../math-tower/chapter1.json");
  for (const [id, c] of Object.entries(part.characters))
    if (c.image) {
      const file = fs.readFileSync(path.join(root, c.image));
      assert.equal("data:image/webp;base64," + file.toString("base64"), chapter1.characters[id].image, "artwork unchanged: " + id);
    }
  assert.equal("data:image/webp;base64," + fs.readFileSync(path.join(root, part.backgrounds.classroom.image)).toString("base64"), chapter1.backgrounds.classroom.image);
  // Placeholders are flagged as such and carry no image.
  for (const [id, b] of Object.entries(part.backgrounds)) assert.equal(!!b.placeholder, !b.image, "placeholder flag: " + id);
  // Reveal timing of the slime's name, the fragment and the notes follow the approved texts.
  const clear = allEvents.find((e) => e.id === "AX1-L01-clear").lines.map(lineOf);
  assert.equal(clear.filter((l) => l.opts.reveal === "zero_slime").length, 1);
  assert.equal(clear.find((l) => l.opts.reveal === "zero_slime").text, "ぼくの名前は……ゼロ・スライム！");
  assert.equal(L1.fragment.quote, "何もないことを知る者は、すべての始まりを知る。");
  assert.deepEqual(L1.notes.map((n) => n.floor), [1, 2, 3, 4]);
  assert.equal(JSON.stringify(part.policy), JSON.stringify(require("../math-tower-policy.json")));
  // {playerName}: used exactly where the script writes it; no hard-coded name
  const used = allEvents.flatMap((e) => e.lines.map(lineOf)).filter((l) => l.text.includes("{playerName}"));
  assert.equal(used.length, 1);
  assert.match(used[0].text, /久しいな、\{playerName\}。/);
  assert.equal(used[0].opts.name, "ヌル");
});

test("the hero is never drawn; unknown speakers get the portrait of who they turn out to be", () => {
  assert.equal(part.characters.hero, undefined);
  const wolf = allEvents.flatMap((e) => e.lines.map(lineOf)).filter((l) => l.opts.name === "？？？");
  assert.deepEqual(wolf.map((l) => l.who), ["count_rabbit", "abs_wolf", "nul"]);
});

test("the scripts of the later layers are present and well formed for the converter's reader (layers 2-9 parse)", () => {
  const { tokenize, readScript } = require("../scripts/build-axiomia.cjs");
  for (let n = 2; n <= 9; n++) {
    const file = `0${n}_layer_0${n}.md`.replace("00", "0");
    const f = fs.readdirSync(path.join(root, "docs/axiomia/story")).find((x) => x.startsWith(String(n).padStart(2, "0") + "_layer"));
    assert(f, "layer " + n + " script exists: " + file);
    const script = readScript(f),
      a = script.lines.findIndex((x) => /^#{1,2} 第一幕｜/.test(x)),
      b = script.lines.findIndex((x, i) => i > a && /^#{1,2} (シナリオ品質確認|脚本の確認事項|詳細脚本の確認|ディレクターへの確認|シナリオ確認)/.test(x));
    assert(a > 0 && b > a, f + " body markers");
    const toks = tokenize(script, a + 1, b + 1);
    assert(toks.filter((t) => t.t === "dlg").length > 100, f + " has dialogue");
  }
});
