/* AXIOMIA part 1: approved scripts (docs/axiomia/story/*.md) -> game data (math-tower/axiomia-part1.json).
 *
 * The scripts are the source of truth. This converter changes no wording: every dialogue line, narration line and card
 * in the script body becomes exactly one game line carrying its origin ("file:line"). Anything it cannot place is an
 * error (nothing is dropped silently); stage directions that are not story text are listed in source.skipped.
 * Staging that the scripts leave to the implementation (backgrounds, effects) is explicit data in this file.
 *
 *   node scripts/build-axiomia.cjs          write math-tower/axiomia-part1.json
 *   node scripts/build-axiomia.cjs --check  fail when the committed file is not what the scripts produce
 */
"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, ".."),
  STORY = "docs/axiomia/story",
  OUT = path.join(root, "math-tower/axiomia-part1.json");

/* ------------------------------------------------------------------ script reader */
const BOX_ITEM = /^\s*<(title|text|caption)\b([^>]*)>(.*)<\/\1>\s*$/;
const DIALOGUE = /^\*\*(.+?)\*\*「(.*)」\s*$/;
const SPEAKER_ONLY = /^\*\*(.+?)\*\*\s*$/;
const BODY_ONLY = /^「(.*)」\s*$/;
const NARRATION = /^\*(?!\*)(.+)\*\s*$/;
const TAG = /^<(text|badge)\b[^>]*>(.*)<\/\1>\s*$/;

function readScript(file) {
  const text = fs.readFileSync(path.join(root, STORY, file), "utf8");
  return { file, text, sha256: crypto.createHash("sha256").update(text).digest("hex"), lines: text.split("\n") };
}

/** Tokens of the body lines [from, to) (1-based). Unknown shapes throw. */
function tokenize(script, from, to) {
  const out = [],
    L = script.lines;
  for (let i = from - 1; i < to - 1; i++) {
    const s = L[i],
      line = i + 1;
    if (!s.trim() || /^---+\s*$/.test(s)) continue;
    let m;
    if (s.trim() === "\\[") {
      // display mathematics (layers 3-9): a line of TeX between \[ and \]
      let j = i + 1;
      const tex = [];
      for (; j < L.length && L[j].trim() !== "\\]"; j++) tex.push(L[j].trim());
      out.push({ t: "math", text: tex.join(" "), line });
      i = j;
    } else if ((m = s.match(/^(#{1,6}) (.+?)\s*$/))) {
      out.push({ t: "h", level: m[1].length, text: m[2], line });
    } else if (/^<box\b/.test(s)) {
      const parts = [];
      let j = i + 1;
      for (; j < L.length && !/^<\/box>/.test(L[j]); j++) {
        if (!L[j].trim()) continue;
        const b = L[j].match(BOX_ITEM);
        if (!b) throw Error(`${script.file}:${j + 1}: unknown box content: ${L[j]}`);
        const size = (b[2].match(/size="(\w+)"/) || [])[1] || "md";
        parts.push({ tag: b[1], size, text: b[3], line: j + 1 });
      }
      out.push({ t: "box", parts, line });
      i = j;
    } else if ((m = s.match(TAG))) {
      out.push({ t: "meta", tag: m[1], text: m[2], line });
    } else if ((m = s.match(/^> \*\*(.+)\*\*\s*$/))) {
      out.push({ t: "bold", text: m[1], line }); // a quoted, emphasised line (a saying / inscription)
    } else if ((m = s.match(DIALOGUE))) {
      out.push({ t: "dlg", who: m[1], text: m[2], line });
    } else if ((m = s.match(SPEAKER_ONLY))) {
      let j = i + 1;
      while (j < L.length && !L[j].trim()) j++;
      const b = L[j] && L[j].match(BODY_ONLY);
      if (b) {
        out.push({ t: "dlg", who: m[1], text: b[1], line: j + 1 });
        i = j;
      } else if (/^(戦闘開始|最終ボス戦開始)/.test(m[1])) out.push({ t: "cue", text: m[1], line });
      else out.push({ t: "bold", text: m[1], line }); // an emphasised closing line such as "…へ続く。"
    } else if ((m = s.match(NARRATION))) {
      out.push({ t: "narr", text: m[1], line });
    } else if (script.plainIsNarration) {
      out.push({ t: "narr", text: s.trim(), line });
    } else throw Error(`${script.file}:${line}: unknown line shape: ${s}`);
  }
  for (const k of out)
    if ((k.t === "dlg" || k.t === "narr") && /[*<>]/.test(k.text))
      throw Error(`${script.file}:${k.line}: markup left inside text: ${k.text}`);
  return out;
}

/* ------------------------------------------------------------------ staging data (the scripts do not carry it) */
// Speaker label in the script -> character id. Labels are shown exactly as written (name override on each line).
const SPEAKERS = {
  主人公: "hero",
  謎の声: "voice",
  コーデックスの声: "voice",
  カウント・ラビット: "count_rabbit",
  スライム: "zero_slime",
  ゼロ・スライム: "zero_slime",
  プラス: "plus",
  マイナス: "minus",
  "プラス＆マイナス": "twin_fox",
  アブソリュート・ウルフ: "abs_wolf",
  ヌル: "nul",
};
const UNKNOWN = "？？？"; // the speaker is the next named non-narrator speaker of the same scene
// "背景：" labels written in the scripts -> background ids
const BG_LABELS = {
  夕暮れの高校教室: "classroom",
  光が差し込む教室: "classroom-light",
  教室に広がる幾何学の光: "classroom-geo",
  星空のような空間: "starfield",
  第1層の街の入口: "l1-gate",
};
// Backgrounds. Only classroom is an adopted illustration; the others are neutral placeholders (CSS) to be replaced by
// setting `image` (and removing `placeholder`) when the official backgrounds arrive.
const BACKGROUNDS = {
  classroom: { name: "BG-P01 夕暮れの教室", image: "img/axiomia/bg/classroom.webp", focus: "62% 50%" },
  "classroom-light": {
    name: "夕暮れの教室（光が差し込む）",
    image: "img/axiomia/bg/classroom.webp",
    focus: "62% 50%",
    overlay: "radial-gradient(ellipse at 50% 62%,#fff1b866,#09133366 72%)",
  },
  "classroom-geo": {
    name: "夕暮れの教室（幾何学の光）",
    image: "img/axiomia/bg/classroom.webp",
    focus: "62% 50%",
    overlay:
      "repeating-conic-gradient(from 0deg at 50% 58%,#7cc8ff2e 0 9deg,#0000 9deg 18deg),linear-gradient(#09133377,#091333aa)",
  },
  starfield: {
    name: "星空のような空間（仮）",
    placeholder: true,
    css: "radial-gradient(circle at 18% 28%,#fff 0 1px,#0000 2px),radial-gradient(circle at 72% 58%,#cfe8ff 0 1px,#0000 2px),radial-gradient(circle at 44% 82%,#fff 0 1px,#0000 2px),radial-gradient(circle at 86% 16%,#fff 0 1px,#0000 2px),linear-gradient(180deg,#040820,#10245e)",
    size: "170px 170px,230px 230px,150px 150px,210px 210px,cover",
  },
  "starfield-dim": {
    name: "星空のような空間・暗転（仮）",
    placeholder: true,
    css: "radial-gradient(circle at 50% 50%,#2b2f55 0,#05060f 70%)",
  },
  "l1-gate": { name: "第1層 街の入口（仮）", placeholder: true, css: "linear-gradient(180deg,#27406b,#8fa8c8 55%,#e5ecf5)" },
  "l1-market": { name: "第1層 計数市場（仮）", placeholder: true, css: "linear-gradient(180deg,#5a4a2a,#c79a45 60%,#f1d79a)" },
  "l1-pool": { name: "第1層 空の水晶池（仮）", placeholder: true, css: "linear-gradient(180deg,#0d3550,#2c8fb5 60%,#bfe9f6)" },
  "l1-crossroad": { name: "第1層 正負の分岐路（仮）", placeholder: true, css: "linear-gradient(90deg,#8a3b1f,#3a3f66 50%,#25408a)" },
  "l1-hill": { name: "第1層 絶対値の丘（仮）", placeholder: true, css: "linear-gradient(180deg,#2c4a5e,#4f8a63 62%,#a7cf8d)" },
  "l1-garden": { name: "第1層 始原の封印庭園（仮）", placeholder: true, css: "linear-gradient(180deg,#1b1233,#4b3a7a 58%,#9d8ad1)" },
  "l1-plaza": { name: "第1層 ゼロの広場（仮）", placeholder: true, css: "linear-gradient(180deg,#223a58,#6ea7c9 60%,#e9f6ff)" },
  "l1-north-gate": { name: "第1層 街の北端・界門（仮）", placeholder: true, css: "linear-gradient(180deg,#14284a,#5d7fb3 60%,#f2e6bd)" },
};
// Staging of single lines: matched by the exact script text within one event; each entry must match exactly once.
const STAGE = {
  "AX1-L00-S2": [
    ["さっきまで何もなかった机の上に、一冊の古い書物が置かれている。", { fx: "book" }],
    ["触れる直前、書物がひとりでに開いた。", { fx: "bookopen" }],
    ["ページから幾何学模様の光が浮かび上がる。", { fx: "particles" }],
    ["CODEX AXIOMA", { fx: "fadein" }],
  ],
  "AX1-L00-S3": [
    ["ねえ。君は、この本なの？", { fx: "book" }],
    ["書物のページに、小さな街の光景が映し出される。", { fx: "bookopen" }],
    ["書物が、ひときわ明るく輝く。", { fx: "particles" }],
  ],
  "AX1-L00-S4": [
    ["教室の床に、幾何学模様の光が広がる。", { bg: "classroom-geo" }],
    ["窓の外の景色が、光の粒になって消える。", { fx: "particles" }],
    ["気がつくと、主人公は星空のような空間に立っていた。", { bg: "starfield", fx: "white" }],
    ["足元に、白銀の光が広がる。", { fx: "white" }],
  ],
  "AX1-L00-S5": [
    ["光が消える。", { fx: "white" }],
    ["画面がゆっくりと暗転する。", { fx: "black" }],
    ["第1層「ゼロの消えた街」", { fx: "fadein" }],
  ],
  "AX1-L01-P1-post": [["市場の帳簿に、消えていた数字の一部が淡く浮かび上がる。", { fx: "particles" }]],
  "AX1-L01-P2-post": [
    ["池の目盛りに、小さな光が戻る。", { fx: "fadein" }],
    ["水晶池から、街の分岐路へ向かう水路に光が流れ始める。", { fx: "particles" }],
  ],
  "AX1-L01-P3-post": [["中央の水晶標識に、ゼロを示す光が一瞬浮かぶ。", { fx: "fadein" }]],
  "AX1-L01-P4-post": [
    ["丘に刻まれた数直線が、明るく輝き始める。", { fx: "fadein" }],
    ["庭園へ続く道の封印が、静かに解ける。", { fx: "particles" }],
  ],
  "AX1-L01-P5-pre": [["黒い結晶が輝き、庭園全体に数式の光が広がる。", { fx: "particles" }]],
  "AX1-L01-P5-post": [
    ["黒い結晶が砕け、円環から白銀の光があふれ出す。", { fx: "white" }],
    ["庭園の水晶の花が、次々と色を取り戻していく。", { fx: "particles" }],
  ],
  "AX1-L01-clear": [
    ["庭園の円環から放たれた光が、街全体へ広がっていく。", { fx: "white" }],
    ["計数市場の帳簿に、正しい数字が戻る。", { bg: "l1-market" }],
    ["水晶池の目盛りが輝き、小さなスライムが顔を上げる。", { bg: "l1-pool" }],
    ["その体に、ゼロを表す光が宿る。", { fx: "fadein" }],
    ["ぼくの名前は……ゼロ・スライム！", { reveal: "zero_slime" }],
    ["正負の分岐路では、中央の標識が輝く。", { bg: "l1-crossroad" }],
    ["絶対値の丘では、すべての道標が正常に戻る。", { bg: "l1-hill" }],
    ["そして、ゼロの広場。", { bg: "l1-plaza" }],
  ],
  "AX1-L01-fragment": [
    ["書物がひとりでに開く。", { fx: "bookopen" }],
    ["欠けた円環の紋章に、小さな光の断片が現れる。", { fx: "emblem" }],
    ["「何もないことを知る者は、すべての始まりを知る。」", { fx: "fadein" }],
  ],
  "AX1-L01-gate": [
    ["白銀の光が主人公を包み込む。", { fx: "white" }],
    ["第1層「ゼロの消えた街」踏破", { fx: "fadein" }],
    ["暗転。", { fx: "black" }],
  ],
};
// A first line shown after a sub heading that is not itself displayed.
const AFTER_HEADING = { "AX1-L00-S4": { 幻視の終わり: { bg: "starfield-dim", fx: "black" } } };
// Cards that sit on the notebook page (prologue scene 1) instead of being a title card.
const NOTE_BOXES = { "AX1-L00-S1": ["数は、世界をつなぐ。"] };
const EVENT_FLAGS = {
  "AX1-L00-S1": { notebook: true },
  "AX1-L00-S2": { bookScene: true },
  "AX1-L00-S3": { bookScene: true },
};

/* ------------------------------------------------------------------ event building */
const skipped = [];
function skip(script, tok, why) {
  skipped.push({ src: `${script.file}:${tok.line}`, why, text: tok.t === "box" ? tok.parts.map((p) => p.text).join(" / ") : tok.text });
}
const SIZE = { xs: "xs", sm: "sm", md: "md", lg: "lg", xl: "xl", "2xl": "xl" };
function headingCard(h) {
  const [left, ...rest] = h.text.split("｜");
  return rest.length
    ? { text: rest.join("｜"), opts: { kind: "card", card: [{ s: "xs", t: left }, { s: "lg", t: rest.join("｜") }] } }
    : { text: h.text, opts: { kind: "card", card: [{ s: "lg", t: h.text }] } };
}
function boxCard(box, script) {
  const parts = box.parts.filter((p) => p.tag !== "caption");
  for (const p of box.parts) if (p.tag === "caption") skip(script, { line: p.line, text: p.text }, "caption (production note)");
  const title = parts.find((p) => p.tag === "title") || parts[0];
  return { text: title.text, opts: { kind: "card", card: parts.map((p) => ({ s: SIZE[p.size] || "md", t: p.text })) } };
}

/** tokens of one event -> { lines, bg } */
function buildLines(script, id, tokens, ctx) {
  const stage = (STAGE[id] || []).map(([text, opts]) => ({ text, opts, used: 0 }));
  const lines = [];
  let bg = null,
    pendingHeading = null;
  const push = (who, text, opts, src) => {
    let o = { ...(opts || {}) };
    if (pendingHeading) {
      o = { ...pendingHeading, ...o };
      pendingHeading = null;
    }
    for (const st of stage) if (st.text === text) { st.used++; o = { ...o, ...st.opts }; }
    lines.push([who, text, Object.keys(o).length ? o : null, src]);
  };
  tokens.forEach((tok, idx) => {
    const src = `${script.file}:${tok.line}`;
    if (tok.t === "dlg") {
      let label = tok.who,
        who = SPEAKERS[label];
      if (label === UNKNOWN) {
        const next = tokens.slice(idx + 1).find((x) => x.t === "dlg" && x.who !== UNKNOWN && !["主人公", "謎の声", "コーデックスの声"].includes(x.who));
        if (!next) throw Error(`${src}: cannot place the speaker ${UNKNOWN}`);
        who = SPEAKERS[next.who];
      }
      if (!who) throw Error(`${src}: unmapped speaker ${label}`);
      push(who, tok.text, who === "hero" ? null : { name: label }, src);
    } else if (tok.t === "narr") push("narr", tok.text, null, src);
    else if (tok.t === "bold") push("narr", tok.text, { kind: "card", card: [{ s: "md", t: tok.text }] }, src);
    else if (tok.t === "math") push("narr", tok.text, { kind: "math", tex: true }, src);
    else if (tok.t === "box") {
      const first = tok.parts.find((p) => p.tag === "title") || tok.parts[0];
      if ((NOTE_BOXES[id] || []).includes(first.text)) push("narr", first.text, { kind: "note", fx: "noteglow" }, src);
      else {
        const c = boxCard(tok, script);
        push("narr", c.text, c.opts, src);
      }
    } else if (tok.t === "h") {
      const after = (AFTER_HEADING[id] || {})[tok.text];
      if (after) pendingHeading = after;
      skip(script, tok, "structural heading (not displayed)");
    } else if (tok.t === "meta") {
      const b = tok.text.match(/^背景：(.+?)／登場：/);
      if (b) {
        if (!BG_LABELS[b[1]]) throw Error(`${src}: unmapped background label ${b[1]}`);
        bg = BG_LABELS[b[1]];
      }
      skip(script, tok, "stage direction");
    } else if (tok.t === "cue") skip(script, tok, "cue");
    else throw Error(`${src}: unhandled token ${tok.t}`);
  });
  for (const st of stage) if (st.used !== 1) throw Error(`${id}: staging "${st.text}" matched ${st.used} times (expected 1)`);
  return { lines, bg };
}

function event(script, id, title, tokens, extra = {}, lead = null) {
  const toks = tokens.filter((t) => !(lead && t === lead));
  const { lines, bg } = buildLines(script, id, toks, {});
  if (lead) {
    const c = headingCard(lead);
    lines.unshift(["narr", c.text, { ...c.opts, ...(extra.cardFx ? { fx: extra.cardFx } : {}) }, `${script.file}:${lead.line}`]);
  }
  const { cardFx, ...rest } = extra;
  const from = Math.min(...[lead, ...toks].filter(Boolean).map((t) => t.line)),
    to = Math.max(...[lead, ...toks].filter(Boolean).map((t) => (t.t === "box" ? t.parts[t.parts.length - 1].line : t.line)));
  return { id, title, ...(EVENT_FLAGS[id] || {}), ...(bg ? { bg } : {}), ...rest, src: { file: script.file, from, to }, lines };
}

/* ------------------------------------------------------------------ the files */
function bodyRange(script, startRe, endRe) {
  const find = (re) => script.lines.findIndex((l) => re.test(l));
  const a = find(startRe),
    b = find(endRe);
  if (a < 0 || b < 0) throw Error(`${script.file}: body markers not found`);
  return [a + 1, b + 1];
}
const ROMAN = ["", "一", "二", "三", "四", "五"];

function buildPrologue() {
  const script = readScript("00_prologue.md"),
    [from, to] = bodyRange(script, /^## Scene 1｜/, /^## 脚本レビュー/),
    toks = tokenize(script, from, to);
  const scenes = [];
  for (const tok of toks) {
    if (tok.t === "h" && tok.level === 2 && /^Scene \d+｜/.test(tok.text)) scenes.push({ h: tok, toks: [] });
    else if (!scenes.length) throw Error("prologue: text before Scene 1");
    else scenes[scenes.length - 1].toks.push(tok);
  }
  if (scenes.length !== 5) throw Error("prologue must have 5 scenes, found " + scenes.length);
  const events = scenes.map((s, i) => {
    const n = i + 1,
      id = "AX1-L00-S" + n;
    return event(script, id, "プロローグ ｜ " + s.h.text.split("｜")[1], s.toks, { cardFx: n === 1 ? "fadein" : undefined }, s.h);
  });
  return { script, events };
}

/** Layer 1..9 style file: five acts, then the clear / fragment / gate sections. */
function buildLayer(layer, file, names) {
  const script = readScript(file),
    [from, to] = bodyRange(script, /^## 第一幕｜/, /^## シナリオ品質確認/),
    toks = tokenize(script, from, to);
  const sections = [];
  for (const tok of toks) {
    if (tok.t === "h" && tok.level === 2) sections.push({ h: tok, toks: [] });
    else if (!sections.length) throw Error(file + ": text before the first act");
    else sections[sections.length - 1].toks.push(tok);
  }
  const L = String(layer).padStart(2, "0");
  const events = [],
    flow = { pre: {}, post: {} },
    battleBg = {};
  const acts = sections.filter((s) => /^第[一二三四五]幕｜/.test(s.h.text));
  if (acts.length !== 5) throw Error(file + ": expected 5 acts, found " + acts.length);
  acts.forEach((a, i) => {
    const n = i + 1,
      cut = a.toks.findIndex((t) => t.t === "h" && /(戦闘後|ボス戦後)/.test(t.text));
    if (cut < 0) throw Error(`${file}: act ${n} has no post-battle heading`);
    const pre = a.toks.slice(0, cut),
      post = a.toks.slice(cut);
    const preEv = event(script, `AX1-L${L}-P${n}-pre`, `${names.title} ${n}地点 ${a.h.text.split("｜")[1]}`, pre, {}, a.h);
    const postEv = event(script, `AX1-L${L}-P${n}-post`, `${n}地点 戦闘後`, post);
    if (!preEv.bg) preEv.bg = names.actBg[i];
    if (!postEv.bg) postEv.bg = names.actBg[i];
    events.push(preEv, postEv);
    flow.pre[n] = [preEv.id];
    flow.post[n] = [postEv.id];
    battleBg[n] = names.actBg[i];
  });
  const special = (re, id, title, bg, lead) => {
    const s = sections.find((x) => re.test(x.h.text));
    if (!s) throw Error(`${file}: section ${re} not found`);
    if (!lead) skip(script, s.h, "heading (the card below carries the same words)");
    const ev = event(script, id, title, s.toks, {}, lead ? s.h : null);
    ev.bg = ev.bg || bg;
    events.push(ev);
    return ev;
  };
  const clear = special(/^第\d+層クリア後｜/, `AX1-L${L}-clear`, `${names.title} クリア後`, names.clearBg, true);
  const frag = special(/^第.の断片｜/, `AX1-L${L}-fragment`, `第${names.fragmentNo}の断片`, names.clearBg, false);
  const gate = special(/^終幕｜/, `AX1-L${L}-gate`, `${names.title} 界門`, names.gateBg, true);
  flow.post[5] = [...flow.post[5], clear.id, frag.id, gate.id];
  return { script, events, flow, battleBg };
}

/* ------------------------------------------------------------------ assembly */
const LAYER_NAMES = {
  1: {
    file: "01_layer_01.md",
    title: "ゼロの消えた街",
    fragmentNo: "一",
    actBg: ["l1-market", "l1-pool", "l1-crossroad", "l1-hill", "l1-garden"],
    clearBg: "l1-garden",
    gateBg: "l1-north-gate",
  },
};

function build() {
  skipped.length = 0;
  const chapter1 = JSON.parse(fs.readFileSync(path.join(root, "math-tower/chapter1.json"), "utf8"));
  const prologue = buildPrologue();
  const layer1 = buildLayer(1, LAYER_NAMES[1].file, LAYER_NAMES[1]);
  // Characters of the adopted illustrations: the same artwork as chapter one, stored as files (byte-identical).
  const characters = {};
  for (const [id, c] of Object.entries(chapter1.characters)) {
    const { image, floor, ...rest } = c;
    characters[id] = { ...rest, ...(image ? { image: `img/axiomia/chars/${id}.webp` } : {}), ...(floor ? { floor } : {}) };
  }
  const frag = { ...chapter1.fragment };
  const quote = layer1.script.lines.find((l) => /<title size="lg" textAlign="center">「何もないことを知る者/.test(l));
  if (!quote || !quote.includes("「" + frag.quote + "」")) throw Error("fragment quote differs from the script");
  const content = {
    part: 1,
    version: 1,
    title: "AXIOMIA 第1部",
    note: "Generated by scripts/build-axiomia.cjs from docs/axiomia/story. Public game material; teacher access is enforced in the game, not by hiding this file.",
    policy: chapter1.policy,
    characters,
    backgrounds: BACKGROUNDS,
    monsters: chapter1.monsters,
    prologue: { events: prologue.events },
    layers: [
      {
        layer: 1,
        title: LAYER_NAMES[1].title,
        floors: chapter1.floors,
        battleBg: layer1.battleBg,
        notes: chapter1.notes.filter((n) => !n.fragment),
        fragment: frag,
        flow: layer1.flow,
        events: layer1.events,
      },
    ],
    source: {
      files: [prologue.script, layer1.script].map((s) => ({ file: `${STORY}/${s.file}`, sha256: s.sha256, lines: s.lines.length })),
      skipped: skipped.slice(),
    },
  };
  return content;
}

const serialize = (c) => JSON.stringify(c) + "\n";
module.exports = { build, serialize, tokenize, readScript, OUT, STORY, buildLayer, buildPrologue, LAYER_NAMES };

if (require.main === module) {
  const next = serialize(build());
  if (process.argv.includes("--check")) {
    if (!fs.existsSync(OUT) || fs.readFileSync(OUT, "utf8") !== next) {
      console.error("math-tower/axiomia-part1.json is not what docs/axiomia/story produces. Run: node scripts/build-axiomia.cjs");
      process.exit(1);
    }
    console.log("axiomia-part1.json is up to date");
  } else {
    fs.writeFileSync(OUT, next);
    console.log("wrote", path.relative(root, OUT), next.length, "bytes");
  }
}
