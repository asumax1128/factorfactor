/* =====================================================================
   FACTOR×FACTOR ボスの絵とキャラクターの定義
   ・images：今週のボス・クラス協力レイド・フレンドレイド・ボス図鑑・ホームで表示するボスの絵（ボスのID → 画像の場所）。
     ボス15体と復活形態2件（maou2・king2）。画像を差しかえるときはここの場所を書きかえる。
   ・characters：キャラクターの表示用の定義（絵が未登録のときの絵文字など）。
   ・ゲーム本体（index.html）が先にこのファイルを読みます。読めなくてもゲームは動きます（ボスは絵文字で表示）。
   Ver.6.27：旧「数理の塔」の章・会話・断片・魔物図鑑などのデータは削除し、このファイルは images と characters だけにした。
   ===================================================================== */
window.SURI_DATA = {
  version: 1,

  characters: {
    count_rabbit: {"floor":1,"trueName":"カウント・ラビット","placeholder":"🐰","image":null,"facePosition":"50% 28%","faceScale":2,"color":"#E9C46A"},
    zero_slime: {"floor":2,"trueName":"ゼロ・スライム","displayNameBeforeReveal":"？？？","displayNameAfterReveal":"ゼロ・スライム","revealKey":"zero_slime","placeholder":"💧","image":null,"facePosition":"50% 30%","faceScale":2,"color":"#7DD3FC"},
    plus: {"floor":3,"trueName":"プラス","placeholder":"🦊","image":null,"facePosition":"50% 28%","faceScale":2,"color":"#F97316"},
    minus: {"floor":3,"trueName":"マイナス","placeholder":"🦊","placeholderFilter":"hue-rotate(220deg) saturate(.8)","image":null,"facePosition":"50% 28%","faceScale":2,"color":"#7C6CF0"},
    twin_fox: {"floor":3,"trueName":"プラスとマイナス","placeholder":"🦊","image":null,"unit":["plus","minus"],"facePosition":"50% 35%","faceScale":1.5,"color":"#C084FC"},
    abs_wolf: {"floor":4,"trueName":"アブソリュート・ウルフ","placeholder":"🐺","image":null,"facePosition":"50% 25%","faceScale":2,"color":"#94A3B8"},
    nul: {"floor":5,"trueName":"零の番人ヌル","short":"ヌル","placeholder":"🦁","image":null,"facePosition":"50% 25%","faceScale":2,"color":"#A78BFA"},
    voice: {"trueName":"謎の声","placeholder":"📖","image":null,"noPortrait":true,"color":"#F3D27A"},
  },

  images: {
    dragon: "img/monsters/dragon.webp",
    kraken: "img/monsters/kraken.webp",
    golem: "img/monsters/golem.webp",
    maou: "img/monsters/maou.webp",
    slime: "img/monsters/slime.webp",
    robot: "img/monsters/robot.webp",
    abs: "img/monsters/abs.webp",
    balance: "img/monsters/balance.webp",
    mod: "img/monsters/mod.webp",
    wave: "img/monsters/wave.webp",
    chimera: "img/monsters/chimera.webp",
    prime: "img/monsters/prime.webp",
    sim: "img/monsters/sim.webp",
    mirror: "img/monsters/mirror.webp",
    king: "img/monsters/king.webp",
    maou2: "img/monsters/maou2.webp",
    king2: "img/monsters/king2.webp",
  },
};
