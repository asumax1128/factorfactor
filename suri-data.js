/* =====================================================================
   FACTOR×FACTOR ボスの絵の定義
   ・images：今週のボス・クラス協力レイド・フレンドレイド・ボス図鑑・ホームで表示するボスの絵（ボスのID → 画像の場所）。
     ボス15体と復活形態2件（maou2・king2）。画像を差しかえるときはここの場所を書きかえる。
   ・ゲーム本体（index.html）が先にこのファイルを読みます。読めなくてもゲームは動きます（ボスは絵文字で表示）。
   Ver.6.27：旧「数理の塔」の章・会話・断片・魔物図鑑などのデータは削除し、このファイルは images と characters だけにした。
   Ver.6.28：characters（AXIOMIA の登場人物の定義。ボスのIDと一致する項目がなく使われていなかった）を削除し、images だけにした。
   ===================================================================== */
window.SURI_DATA = {
  version: 1,

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
