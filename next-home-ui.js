(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/next-home-icons.json
  var require_next_home_icons = __commonJS({
    "src/next-home-icons.json"(exports, module) {
      module.exports = { home: "m3 10 9-7 9 7v11h-6v-7H9v7H3Z", online: "m4 3 6 6-3 3-6-6M20 3l-6 6 3 3 6-6M8 13l-5 8M16 13l5 8M3 17l4 3M17 20l4-3M9 10l6 6M15 10l-6 6", solo: "M5 3h11l4 4v14H5ZM8 9h8M8 13h3M14 13h2M8 17h3M14 17h2", daily: "M4 5h16v16H4ZM8 2v6M16 2v6M4 10h16m-12 5 3 3 5-5", rank: "M8 3h8v5c0 4-2 6-4 6s-4-2-4-6ZM8 5H3v2c0 3 2 4 5 4M16 5h5v2c0 3-2 4-5 4M12 14v5M7 21h10", help: "M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4M12 18h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20", account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0", chevron: "m9 5 7 7-7 7", sound: "M4 10h4l5-5v14l-5-5H4ZM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14", settings: "m9 3-1 3-3 1-2 4 2 2v3l3 2 3-1 3 2 4-2v-3l3-2-1-4-3-1-1-3ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6", more: "M4 6h16M4 12h16M4 18h16", room: "M3 4h18v16H3ZM8 4v16M11 9h6M11 13h6", cpu: "M5 5h14v14H5ZM8 8h8v8H8ZM8 2v3M12 2v3M16 2v3M8 19v3M12 19v3M16 19v3M2 8h3M2 12h3M2 16h3M19 8h3M19 12h3M19 16h3", ghost: "M5 21V10a7 7 0 0 1 14 0v11l-4-3-3 3-3-3ZM9 10v2M15 10v2", raid: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6ZM8 12h8M12 8v8", record: "M4 3h16v18H4ZM8 7h8M8 12h2M13 12h3M8 17h2M13 17h3", people: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 5 5", bounty: "M4 3h16v18l-3-1-2 1-3-1-3 1-3-1-2 1ZM12 7l1 3h3l-2 2 1 3-3-2-3 2 1-3-2-2h3Z", soundOff: "M4 10h4l5-5v14l-5-5H4ZM17 9l5 6M22 9l-5 6" };
    }
  });

  // src/title-catalog-next.json
  var require_title_catalog_next = __commonJS({
    "src/title-catalog-next.json"(exports, module) {
      module.exports = {
        schemaVersion: 1,
        source: "\u6240\u6709\u8005\u63D0\u4F9B \u5168100\u79F0\u53F7 2026-10-15",
        status: "roster-confirmed-reveal-pending",
        expectedNormalCount: 100,
        expectedFiveStarCount: 26,
        excludedAwardModes: [
          "cpu",
          "selfGhost"
        ],
        hidden: {
          id: "factor_factor",
          name: "FACTOR\xD7FACTOR",
          requiredDistinctFiveStar: 15,
          visibleBeforeEarned: false
        },
        titles: [
          {
            number: 1,
            legacyNumber: 1,
            name: "\u6681\u306E\u8987\u8005",
            condition: "\u30C7\u30A4\u30EA\u30FC\u30A4\u30FC\u30B8\u30FC\u512A\u52DD",
            stars: 5,
            id: "daily_easy_king",
            legacyId: "daily_easy_king",
            category: "\u30C7\u30A4\u30EA\u30FC"
          },
          {
            number: 2,
            legacyNumber: 2,
            name: "\u84BC\u7A79\u306E\u8987\u8005",
            condition: "\u30C7\u30A4\u30EA\u30FC\u30CE\u30FC\u30DE\u30EB\u512A\u52DD",
            stars: 5,
            id: "daily_normal_king",
            legacyId: "daily_normal_king",
            category: "\u30C7\u30A4\u30EA\u30FC"
          },
          {
            number: 3,
            legacyNumber: 3,
            name: "\u6DF1\u6DF5\u306E\u8987\u738B",
            condition: "\u30C7\u30A4\u30EA\u30FC\u30CF\u30FC\u30C9\u512A\u52DD",
            stars: 5,
            id: "daily_hard_king",
            legacyId: "daily_hard_king",
            category: "\u30C7\u30A4\u30EA\u30FC"
          },
          {
            number: 4,
            legacyNumber: 4,
            name: "\u5929\u4E0B\u7D71\u4E00",
            condition: "\u540C\u3058\u65E5\u306B\u30C7\u30A4\u30EA\u30FC\u51683\u90E8\u9580\u512A\u52DD",
            stars: 5,
            id: "daily_king",
            legacyId: "daily_king",
            category: "\u30C7\u30A4\u30EA\u30FC"
          },
          {
            number: 5,
            legacyNumber: 92,
            name: "\u958B\u6226\u306E\u72FC\u7159",
            condition: "\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226\u3092\u521D\u3081\u30661\u8A66\u5408\u5B8C\u4E86",
            stars: 1,
            id: "online_first",
            legacyId: null,
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 6,
            legacyNumber: 5,
            name: "\u59CB\u307E\u308A\u306E\u5263",
            condition: "\u521D\u3081\u3066\u5BFE\u6226\u306B\u52DD\u5229",
            stars: 1,
            id: "first",
            legacyId: "first",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 7,
            legacyNumber: 91,
            name: "\u767E\u4EBA\u65AC\u308A",
            condition: "A\u30FBB\u65B9\u5F0F\u306E\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226\u5408\u7B97\u3067\u901A\u7B97100\u52DD",
            stars: 3,
            id: "wins100_ab",
            legacyId: null,
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 8,
            legacyNumber: 7,
            name: "\u767E\u6226\u932C\u78E8",
            condition: "\u901A\u7B97100\u6226",
            stars: 2,
            id: "games100",
            legacyId: "games100",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 9,
            legacyNumber: 37,
            name: "\u4FEE\u7F85\u306E\u9053",
            condition: "\u901A\u7B97300\u6226",
            stars: 3,
            id: "games300",
            legacyId: "games300",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 10,
            legacyNumber: 6,
            name: "\u6298\u308C\u3056\u308B\u5203",
            condition: "\u901A\u7B9750\u6557",
            stars: 2,
            id: "lose50",
            legacyId: "lose50",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 11,
            legacyNumber: 8,
            name: "\u6C38\u9060\u306E\u30E9\u30A4\u30D0\u30EB",
            condition: "\u540C\u3058\u76F8\u624B\u306820\u6226",
            stars: 2,
            id: "rival20",
            legacyId: "rival20",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 12,
            legacyNumber: 9,
            name: "\u4EA4\u5DEE\u3059\u308B\u904B\u547D",
            condition: "\u7570\u306A\u308B10\u4EBA\u4EE5\u4E0A\u3068\u5BFE\u6226",
            stars: 2,
            id: "wide10",
            legacyId: "wide10",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 13,
            legacyNumber: 44,
            name: "\u4EBA\u6C17\u8005",
            condition: "\u7570\u306A\u308B30\u4EBA\u4EE5\u4E0A\u3068\u5BFE\u6226",
            stars: 3,
            id: "wide30",
            legacyId: "wide30",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 14,
            legacyNumber: 10,
            name: "\u4E8C\u5200\u6D41",
            condition: "A\u30FBB\u65B9\u5F0F\u3067\u305D\u308C\u305E\u308C10\u52DD",
            stars: 3,
            id: "dual",
            legacyId: "dual",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 15,
            legacyNumber: 93,
            name: "\u4E8C\u5200\u7686\u4F1D",
            condition: "A\u30FBB\u65B9\u5F0F\u3067\u305D\u308C\u305E\u308C\u901A\u7B9750\u52DD",
            stars: 4,
            id: "dual50",
            legacyId: null,
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 16,
            legacyNumber: 11,
            name: "\u7834\u7AF9\u306E\u5263",
            condition: "10\u9023\u52DD",
            stars: 4,
            id: "streak10",
            legacyId: "streak10",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 17,
            legacyNumber: 12,
            name: "\u5E38\u52DD\u4E0D\u6557",
            condition: "30\u9023\u52DD",
            stars: 5,
            id: "streak30",
            legacyId: "streak30",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 18,
            legacyNumber: 13,
            name: "\u5929\u4E0B\u7121\u53CC",
            condition: "50\u9023\u52DD",
            stars: 5,
            id: "streak50",
            legacyId: "streak50",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 19,
            legacyNumber: 19,
            name: "\u8D77\u6B7B\u56DE\u751F",
            condition: "\u521D\u3081\u3066\u9006\u8EE2\u52DD\u5229",
            stars: 2,
            id: "comeback",
            legacyId: "comeback",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 20,
            legacyNumber: 20,
            name: "\u904B\u547D\u306E\u53CD\u9006\u8005",
            condition: "\u9006\u8EE2\u52DD\u522910\u56DE",
            stars: 3,
            id: "comeback10",
            legacyId: "comeback10",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 21,
            legacyNumber: 51,
            name: "\u30EA\u30D9\u30F3\u30B8\u30E3\u30FC",
            condition: "\u76F4\u524D\u306E\u8A66\u5408\u3067\u8CA0\u3051\u305F\u76F8\u624B\u306B\u52DD\u5229",
            stars: 2,
            id: "revenge",
            legacyId: "revenge",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 22,
            legacyNumber: 31,
            name: "\u30B8\u30E3\u30A4\u30A2\u30F3\u30C8\u30AD\u30E9\u30FC",
            condition: "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0200\u4EE5\u4E0A\u9AD8\u3044\u76F8\u624B\u306B\u52DD\u5229",
            stars: 4,
            id: "giant",
            legacyId: "giant",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 23,
            legacyNumber: 96,
            name: "\u738B\u8005\u55B0\u3089\u3044",
            condition: "\u5BFE\u6226\u958B\u59CB\u6642\u306B\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0250\u4EE5\u4E0A\u9AD8\u3044\u76F8\u624B\u306B\u52DD\u5229",
            stars: 5,
            id: "giant250",
            legacyId: null,
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 24,
            legacyNumber: 36,
            name: "\u9006\u5883\u7121\u53CC",
            condition: "\u2605\u2605\u2605\u30CF\u30F3\u30C7\u3092\u80CC\u8CA0\u3063\u3066\u52DD\u5229",
            stars: 5,
            id: "handi",
            legacyId: "handi",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 25,
            legacyNumber: 38,
            name: "\u624D\u80FD\u958B\u82B1",
            condition: "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B01600\u5230\u9054",
            stars: 3,
            id: "master1600",
            legacyId: "master1600",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 26,
            legacyNumber: 21,
            name: "\u6570\u5F0F\u306E\u652F\u914D\u8005",
            condition: "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B01700\u5230\u9054",
            stars: 4,
            id: "master1700",
            legacyId: "master1700",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 27,
            legacyNumber: 39,
            name: "\u771F\u30FB\u56E0\u6570\u738B",
            condition: "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B01900\u5230\u9054",
            stars: 5,
            id: "master1900",
            legacyId: "master1900",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 28,
            legacyNumber: 54,
            name: "\u9EC4\u91D1\u9A0E\u58EB",
            condition: "\u30B4\u30FC\u30EB\u30C9\u30E9\u30F3\u30AF\uFF081580\uFF09\u5230\u9054",
            stars: 3,
            id: "rgold",
            legacyId: "rgold",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 29,
            legacyNumber: 55,
            name: "\u56E0\u6570\u306E\u8987\u738B",
            condition: "\u30DE\u30B9\u30BF\u30FC\u30E9\u30F3\u30AF\uFF081820\uFF09\u5230\u9054",
            stars: 5,
            id: "rmaster",
            legacyId: "rmaster",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 30,
            legacyNumber: 86,
            name: "\u521D\u7D1A\u306E\u8987\u8005",
            condition: "\u30A4\u30FC\u30B8\u30FC1730\u4EE5\u4E0A",
            stars: 4,
            id: "easy_adept",
            legacyId: "easy_adept",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 31,
            legacyNumber: 87,
            name: "\u521D\u7D1A\u306E\u8987\u738B",
            condition: "\u30A4\u30FC\u30B8\u30FC1820\u4EE5\u4E0A",
            stars: 5,
            id: "easy_master",
            legacyId: "easy_master",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 32,
            legacyNumber: 88,
            name: "\u4E2D\u7D1A\u306E\u8987\u8005",
            condition: "\u30CE\u30FC\u30DE\u30EB1730\u4EE5\u4E0A",
            stars: 4,
            id: "normal_adept",
            legacyId: "normal_adept",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 33,
            legacyNumber: 89,
            name: "\u4E2D\u7D1A\u306E\u8987\u738B",
            condition: "\u30CE\u30FC\u30DE\u30EB1820\u4EE5\u4E0A",
            stars: 5,
            id: "normal_master",
            legacyId: "normal_master",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 34,
            legacyNumber: 90,
            name: "\u53CC\u754C\u306E\u8987\u738B",
            condition: "\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB\u4E21\u65B91820\u4EE5\u4E0A",
            stars: 5,
            id: "dual_master",
            legacyId: "dual_master",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 35,
            legacyNumber: 48,
            name: "\u7D99\u7D9A\u306F\u529B\u306A\u308A",
            condition: "7\u65E5\u9023\u7D9A\u3067\u5BFE\u6226",
            stars: 2,
            id: "daily7",
            legacyId: "daily7",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 36,
            legacyNumber: 49,
            name: "\u7686\u52E4\u8CDE",
            condition: "30\u65E5\u9023\u7D9A\u3067\u5BFE\u6226",
            stars: 4,
            id: "daily30",
            legacyId: "daily30",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 37,
            legacyNumber: 56,
            name: "\u30D0\u30A6\u30F3\u30C6\u30A3\u30CF\u30F3\u30BF\u30FC",
            condition: "\u8CDE\u91D1\u9996\u3092\u521D\u3081\u3066\u6483\u7834",
            stars: 2,
            id: "bounty1",
            legacyId: "bounty1",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 38,
            legacyNumber: 57,
            name: "\u4F1D\u8AAC\u306E\u30CF\u30F3\u30BF\u30FC",
            condition: "\u8CDE\u91D1\u9996\u309210\u56DE\u6483\u7834",
            stars: 4,
            id: "bounty10",
            legacyId: "bounty10",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 39,
            legacyNumber: 58,
            name: "\u6307\u540D\u624B\u914D",
            condition: "\u81EA\u5206\u306B50\u4EE5\u4E0A\u306E\u8CDE\u91D1\u304C\u61F8\u304B\u308B\uFF087\u9023\u52DD\uFF09",
            stars: 3,
            id: "wanted",
            legacyId: "wanted",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 40,
            legacyNumber: 81,
            name: "\u8D85\u5F71\u306E\u5F81\u670D\u8005",
            condition: "\u4E71\u5165\u30CF\u30A4\u30D1\u30FC\u30B4\u30FC\u30B9\u30C8\u306B\u521D\u52DD\u5229",
            stars: 4,
            id: "hyper_slayer",
            legacyId: "hyper_slayer",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 41,
            legacyNumber: 82,
            name: "\u4E0B\u514B\u4E0A",
            condition: "1\u30E9\u30F3\u30AF\u4E0A\u306E\u4E71\u5165\u30B4\u30FC\u30B9\u30C8\u306B\u521D\u52DD\u5229",
            stars: 3,
            id: "ghost_up1",
            legacyId: "ghost_up1",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 42,
            legacyNumber: 83,
            name: "\u5927\u756A\u72C2\u308F\u305B",
            condition: "2\u30E9\u30F3\u30AF\u4E0A\u306E\u4E71\u5165\u30B4\u30FC\u30B9\u30C8\u306B\u521D\u52DD\u5229",
            stars: 5,
            id: "ghost_up2",
            legacyId: "ghost_up2",
            category: "\u30AA\u30F3\u30E9\u30A4\u30F3"
          },
          {
            number: 43,
            legacyNumber: 24,
            name: "\u96F7\u5149\u4E00\u9583",
            condition: "1\u554F\u30921\u79D2\u4EE5\u5185\u306B\u6B63\u89E3",
            stars: 4,
            id: "flash",
            legacyId: "flash",
            category: "\u6280\u8853"
          },
          {
            number: 44,
            legacyNumber: 94,
            name: "\u795E\u901F\u306E\u9818\u57DF",
            condition: "1\u8A66\u5408\u4E2D\u306B1\u79D2\u4EE5\u5185\u306E\u6B63\u89E3\u30923\u56DE",
            stars: 5,
            id: "flash3",
            legacyId: null,
            category: "\u6280\u8853"
          },
          {
            number: 45,
            legacyNumber: 14,
            name: "\u767D\u9280\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B9750\u56DE",
            stars: 3,
            id: "perfect50",
            legacyId: "perfect50",
            category: "\u6280\u8853"
          },
          {
            number: 46,
            legacyNumber: 15,
            name: "\u9EC4\u91D1\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B97100\u56DE",
            stars: 3,
            id: "perfect100",
            legacyId: "perfect100",
            category: "\u6280\u8853"
          },
          {
            number: 47,
            legacyNumber: 16,
            name: "\u767D\u91D1\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B97300\u56DE",
            stars: 4,
            id: "perfect300",
            legacyId: "perfect300",
            category: "\u6280\u8853"
          },
          {
            number: 48,
            legacyNumber: 17,
            name: "\u91D1\u525B\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B97500\u56DE",
            stars: 4,
            id: "perfect500",
            legacyId: "perfect500",
            category: "\u6280\u8853"
          },
          {
            number: 49,
            legacyNumber: 18,
            name: "\u7121\u9650\u306E\u9583\u5149",
            condition: "Perfect\u901A\u7B971000\u56DE",
            stars: 5,
            id: "perfect1000",
            legacyId: "perfect1000",
            category: "\u6280\u8853"
          },
          {
            number: 50,
            legacyNumber: 25,
            name: "\u9023\u9396\u306E\u9B54\u8853\u5E2B",
            condition: "1\u8A66\u540820\u30B3\u30F3\u30DC",
            stars: 4,
            id: "combo20",
            legacyId: "combo20",
            category: "\u6280\u8853"
          },
          {
            number: 51,
            legacyNumber: 40,
            name: "\u30B3\u30F3\u30DC\u30DE\u30B9\u30BF\u30FC",
            condition: "1\u8A66\u540830\u30B3\u30F3\u30DC",
            stars: 5,
            id: "combo30",
            legacyId: "combo30",
            category: "\u6280\u8853"
          },
          {
            number: 52,
            legacyNumber: 26,
            name: "\u5B8C\u5168\u52DD\u5229",
            condition: "B\u65B9\u5F0F\u3067\u30DF\u30B9\u30FB\u6642\u9593\u5207\u308C\u306A\u3057\u3067\u52DD\u5229",
            stars: 3,
            id: "nomiss",
            legacyId: "nomiss",
            category: "\u6280\u8853"
          },
          {
            number: 53,
            legacyNumber: 43,
            name: "\u6B63\u78BA\u7121\u6BD4",
            condition: "B\u65B9\u5F0F\u3067\u30DF\u30B9\u30FB\u6642\u9593\u5207\u308C\u306A\u3057\u306E\u52DD\u522910\u56DE",
            stars: 4,
            id: "nomiss10",
            legacyId: "nomiss10",
            category: "\u6280\u8853"
          },
          {
            number: 54,
            legacyNumber: 95,
            name: "\u767E\u767A\u767E\u4E2D",
            condition: "1\u8A66\u540810\u554F\u4EE5\u4E0A\u6B63\u89E3\u3001\u8AA4\u7B540\u30FB\u6642\u9593\u5207\u308C0\uFF08\u52DD\u6557\u4E0D\u554F\uFF09",
            stars: 4,
            id: "accuracy10",
            legacyId: null,
            category: "\u6280\u8853"
          },
          {
            number: 55,
            legacyNumber: 52,
            name: "\u51B7\u9759\u6C88\u7740",
            condition: "A\u65B9\u5F0F\u3067\u304A\u624B\u3064\u304D0\u30FB6\u554F\u4EE5\u4E0A\u6B63\u89E3\u3057\u3066\u52DD\u5229",
            stars: 3,
            id: "calm",
            legacyId: "calm",
            category: "\u6280\u8853"
          },
          {
            number: 56,
            legacyNumber: 27,
            name: "\u6B7B\u5730\u304B\u3089\u306E\u5E30\u9084",
            condition: "B\u65B9\u5F0F\u3067HP5%\u4EE5\u4E0B\u304B\u3089\u52DD\u5229",
            stars: 4,
            id: "clutch",
            legacyId: "clutch",
            category: "\u6280\u8853"
          },
          {
            number: 57,
            legacyNumber: 46,
            name: "\u4E0D\u6B7B\u9CE5",
            condition: "B\u65B9\u5F0F\u3067HP1%\u4EE5\u4E0B\u304B\u3089\u52DD\u5229",
            stars: 5,
            id: "miracle",
            legacyId: "miracle",
            category: "\u6280\u8853"
          },
          {
            number: 58,
            legacyNumber: 53,
            name: "\u7D76\u5BFE\u56DE\u907F",
            condition: "B\u65B9\u5F0F\u3067\u653B\u6483\u3092\u4E00\u5EA6\u3082\u53D7\u3051\u305A\u52DD\u5229",
            stars: 4,
            id: "flawless",
            legacyId: "flawless",
            category: "\u6280\u8853"
          },
          {
            number: 59,
            legacyNumber: 32,
            name: "\u6700\u5F8C\u306E\u751F\u5B58\u8005",
            condition: "B\u65B9\u5F0F4\u4EBA\u5BFE\u6226\u3067\u6700\u5F8C\u306E\u751F\u5B58\u8005\u3068\u3057\u3066\u52DD\u5229",
            stars: 4,
            id: "survivor",
            legacyId: "survivor",
            category: "\u6280\u8853"
          },
          {
            number: 60,
            legacyNumber: 33,
            name: "\u7D76\u5BFE\u652F\u914D",
            condition: "A\u65B9\u5F0F\u3067\u76F8\u624B\u30920\u70B9\u306B\u6291\u3048\u3066\u52DD\u5229",
            stars: 4,
            id: "shutout",
            legacyId: "shutout",
            category: "\u6280\u8853"
          },
          {
            number: 61,
            legacyNumber: 34,
            name: "\u9650\u754C\u7A81\u7834",
            condition: "Lv.9\u3067Perfect",
            stars: 4,
            id: "lv9",
            legacyId: "lv9",
            category: "\u6280\u8853"
          },
          {
            number: 62,
            legacyNumber: 85,
            name: "\u5B8C\u5168\u5236\u8987",
            condition: "Lv.1\u301C9\u3059\u3079\u3066\u3067Perfect",
            stars: 5,
            id: "alllv",
            legacyId: "alllv",
            category: "\u6280\u8853"
          },
          {
            number: 63,
            legacyNumber: 35,
            name: "\u5236\u5FA1\u4E0D\u80FD",
            condition: "A\u65B9\u5F0F\u3067\u304A\u624B\u3064\u304D\u901A\u7B97100\u56DE",
            stars: 2,
            id: "otetsuki100",
            legacyId: "otetsuki100",
            category: "\u6280\u8853"
          },
          {
            number: 64,
            legacyNumber: 50,
            name: "\u79D8\u6280\u4E71\u821E",
            condition: "1\u8A66\u5408\u3067\u5FC5\u6BBA\u6280\u30923\u56DE\u767A\u52D5",
            stars: 4,
            id: "sp3",
            legacyId: "sp3",
            category: "\u6280\u8853"
          },
          {
            number: 65,
            legacyNumber: 22,
            name: "\u52DD\u5229\u306E\u738B\u51A0",
            condition: "\u30AF\u30E9\u30B9\u5927\u4F1A\u3067\u521D\u512A\u52DD",
            stars: 5,
            id: "tour1",
            legacyId: "tour1",
            category: "\u5927\u4F1A"
          },
          {
            number: 66,
            legacyNumber: 97,
            name: "\u738B\u8005\u9632\u885B",
            condition: "\u30AF\u30E9\u30B9\u5927\u4F1A2\u5927\u4F1A\u9023\u7D9A\u512A\u52DD\uFF08\u6B20\u5834\u3067\u9023\u8987\u304C\u9014\u5207\u308C\u308B\uFF09",
            stars: 5,
            id: "tour_streak2",
            legacyId: null,
            category: "\u5927\u4F1A"
          },
          {
            number: 67,
            legacyNumber: 23,
            name: "\u4E09\u51A0\u738B",
            condition: "\u30AF\u30E9\u30B9\u5927\u4F1A\u3067\u901A\u7B973\u56DE\u512A\u52DD",
            stars: 5,
            id: "tour3",
            legacyId: "tour3",
            category: "\u5927\u4F1A"
          },
          {
            number: 68,
            legacyNumber: 45,
            name: "\u6BBF\u5802\u5165\u308A",
            condition: "\u30AF\u30E9\u30B9\u5927\u4F1A\u3067\u901A\u7B975\u56DE\u512A\u52DD",
            stars: 5,
            id: "tour10",
            legacyId: "tour10",
            category: "\u5927\u4F1A"
          },
          {
            number: 69,
            legacyNumber: 47,
            name: "\u30C0\u30FC\u30AF\u30DB\u30FC\u30B9",
            condition: "\u5927\u4F1A\u958B\u59CB\u6642\u30AF\u30E9\u30B9\u5185\u30EC\u30FC\u30C6\u30A3\u30F3\u30B011\u4F4D\u4EE5\u4E0B\u3067\u512A\u52DD",
            stars: 5,
            id: "darkhorse",
            legacyId: "darkhorse",
            category: "\u5927\u4F1A"
          },
          {
            number: 70,
            legacyNumber: 61,
            name: "\u521D\u9663",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u521D\u51FA\u6483",
            stars: 1,
            id: "wk1",
            legacyId: "wk1",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 71,
            legacyNumber: 62,
            name: "\u8A0E\u4F10\u968A",
            condition: "3\u9031\u9023\u7D9A\u3067\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u51FA\u6483",
            stars: 2,
            id: "wkst3",
            legacyId: "wkst3",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 72,
            legacyNumber: 63,
            name: "\u6B74\u6226\u306E\u52C7\u58EB",
            condition: "5\u9031\u9023\u7D9A\u3067\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u51FA\u6483",
            stars: 3,
            id: "wkst5",
            legacyId: "wkst5",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 73,
            legacyNumber: 64,
            name: "\u6226\u5834\u306E\u5B88\u8B77\u795E",
            condition: "10\u9031\u9023\u7D9A\u3067\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u51FA\u6483",
            stars: 4,
            id: "wkst10",
            legacyId: "wkst10",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 74,
            legacyNumber: 65,
            name: "\u521D\u8A0E\u4F10",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u8A0E\u4F10\u6210\u529F\u306B\u521D\u3081\u3066\u30C0\u30E1\u30FC\u30B8\u3067\u8CA2\u732E",
            stars: 2,
            id: "wkk1",
            legacyId: "wkk1",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 75,
            legacyNumber: 66,
            name: "\u8A0E\u4F10\u968A\u9577",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u8A0E\u4F10\u6210\u529F\u306B5\u56DE\u8CA2\u732E",
            stars: 3,
            id: "wkk5",
            legacyId: "wkk5",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 76,
            legacyNumber: 67,
            name: "\u7D05\u84EE\u306E\u5F13\u77E2",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u8A0E\u4F10\u6210\u529F\u306B10\u56DE\u8CA2\u732E",
            stars: 4,
            id: "wkk10",
            legacyId: "wkk10",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 77,
            legacyNumber: 68,
            name: "\u4E00\u9A0E\u5F53\u5343",
            condition: "\u9031\u9593\u30DC\u30B9\u30C0\u30E1\u30FC\u30B8\u30E9\u30F3\u30AD\u30F3\u30B01\u4F4D\u30921\u56DE",
            stars: 4,
            id: "wkace",
            legacyId: "wkace",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 78,
            legacyNumber: 69,
            name: "\u7834\u58CA\u795E",
            condition: "\u9031\u9593\u30DC\u30B9\u30C0\u30E1\u30FC\u30B8\u30E9\u30F3\u30AD\u30F3\u30B01\u4F4D\u30925\u56DE",
            stars: 5,
            id: "wkace5",
            legacyId: "wkace5",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 79,
            legacyNumber: 70,
            name: "\u4E00\u6483\u5FC5\u6BBA",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u3078\u306E1\u56DE\u306E\u51FA\u6483\u3067600\u30C0\u30E1\u30FC\u30B8",
            stars: 3,
            id: "wkone",
            legacyId: "wkone",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 80,
            legacyNumber: 71,
            name: "\u795E\u5A01\u306E\u4E00\u6483",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u3078\u306E1\u56DE\u306E\u51FA\u6483\u30671200\u30C0\u30E1\u30FC\u30B8",
            stars: 5,
            id: "wkone2",
            legacyId: "wkone2",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 81,
            legacyNumber: 72,
            name: "\u30E2\u30F3\u30B9\u30BF\u30FC\u30CF\u30F3\u30BF\u30FC",
            condition: "\u7570\u306A\u308B3\u7A2E\u985E\u306E\u30DC\u30B9\u8A0E\u4F10\u306B\u53C2\u52A0",
            stars: 3,
            id: "wkdex3",
            legacyId: "wkdex3",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 82,
            legacyNumber: 73,
            name: "\u30E2\u30F3\u30B9\u30BF\u30FC\u30DE\u30B9\u30BF\u30FC",
            condition: "\u7570\u306A\u308B6\u7A2E\u985E\u306E\u30DC\u30B9\u8A0E\u4F10\u306B\u53C2\u52A0",
            stars: 4,
            id: "wkdex6",
            legacyId: "wkdex6",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 83,
            legacyNumber: 60,
            name: "\u30D5\u30A3\u30CB\u30C3\u30B7\u30E3\u30FC",
            condition: "\u30AF\u30E9\u30B9\u5354\u529B\u30EC\u30A4\u30C9\u3067\u30DC\u30B9\u306B\u3068\u3069\u3081\u3092\u523A\u3059",
            stars: 3,
            id: "lasthit",
            legacyId: "lasthit",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 84,
            legacyNumber: 28,
            name: "\u7D76\u5BFE\u9632\u58C1",
            condition: "\u653B\u6483\u3092\u7D2F\u8A08500\u56DE\u7121\u52B9\u5316",
            stars: 3,
            id: "cancel500",
            legacyId: "cancel500",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 85,
            legacyNumber: 41,
            name: "\u96E3\u653B\u4E0D\u843D",
            condition: "\u653B\u6483\u3092\u7D2F\u8A082000\u56DE\u7121\u52B9\u5316",
            stars: 4,
            id: "cancel2000",
            legacyId: "cancel2000",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 86,
            legacyNumber: 29,
            name: "\u30C8\u30EA\u30C3\u30AF\u30B9\u30BF\u30FC",
            condition: "\u304A\u3058\u3083\u307E\u30BF\u30A4\u30EB\u3092\u901A\u7B97100\u500B\u9001\u308B",
            stars: 2,
            id: "ojama100",
            legacyId: "ojama100",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 87,
            legacyNumber: 42,
            name: "\u30C8\u30EA\u30C3\u30AF\u30DE\u30B9\u30BF\u30FC",
            condition: "\u304A\u3058\u3083\u307E\u30BF\u30A4\u30EB\u3092\u901A\u7B97500\u500B\u9001\u308B",
            stars: 3,
            id: "ojama500",
            legacyId: "ojama500",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 88,
            legacyNumber: 30,
            name: "\u5965\u7FA9\u7686\u4F1D",
            condition: "\u5FC5\u6BBA\u6280\u3092\u901A\u7B9750\u56DE\u767A\u52D5",
            stars: 3,
            id: "sp50",
            legacyId: "sp50",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 89,
            legacyNumber: 59,
            name: "\u4EFB\u52D9\u5B8C\u9042",
            condition: "7\u65E5\u9023\u7D9A\u3067\u30C7\u30A4\u30EA\u30FC\u30DF\u30C3\u30B7\u30E7\u30F3\u3092\u3059\u3079\u3066\u9054\u6210",
            stars: 3,
            id: "mis7",
            legacyId: "mis7",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 90,
            legacyNumber: 77,
            name: "\u5B9D\u63A2\u3057",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u51FA\u6483\u4E2D\u306B\u5B9D\u7BB1\u3092\u958B\u3051\u308B",
            stars: 1,
            id: "wkchest1",
            legacyId: "wkchest1",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 91,
            legacyNumber: 78,
            name: "\u30C8\u30EC\u30B8\u30E3\u30FC\u30CF\u30F3\u30BF\u30FC",
            condition: "\u5B9D\u7BB1\u3092\u901A\u7B9710\u500B\u958B\u3051\u308B",
            stars: 3,
            id: "wkchest10",
            legacyId: "wkchest10",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 92,
            legacyNumber: 79,
            name: "\u7E01\u306E\u4E0B\u306E\u529B\u6301\u3061",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u30B5\u30DD\u30FC\u30BF\u30FC\u3068\u3057\u3066\u51FA\u6483",
            stars: 1,
            id: "wksup1",
            legacyId: "wksup1",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 93,
            legacyNumber: 80,
            name: "\u5F71\u306E\u82F1\u96C4",
            condition: "\u5FDC\u63F4\u30DD\u30A4\u30F3\u30C8\u901A\u7B97100\u7372\u5F97",
            stars: 2,
            id: "wksup100",
            legacyId: "wksup100",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 94,
            legacyNumber: 99,
            name: "\u5F71\u306E\u5B88\u8B77\u795E",
            condition: "\u5FDC\u63F4\u30DD\u30A4\u30F3\u30C8\u901A\u7B97500\u7372\u5F97",
            stars: 3,
            id: "wksup500",
            legacyId: null,
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 95,
            legacyNumber: 98,
            name: "\u6226\u53CB\u306E\u7D46",
            condition: "\u4ECA\u9031\u306E\u30DC\u30B9\u3078\u306E\u51FA\u6483\u3092\u901A\u7B9720\u56DE\u5B8C\u4E86",
            stars: 3,
            id: "wk_runs20",
            legacyId: null,
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 96,
            legacyNumber: 84,
            name: "\u6012\u308A\u3092\u93AE\u3081\u3057\u8005",
            condition: "\u6012\u3063\u3066\u5C45\u5EA7\u3063\u305F\u30DC\u30B9\u306E\u8A0E\u4F10\u306B\u53C2\u52A0",
            stars: 3,
            id: "wkrage",
            legacyId: "wkrage",
            category: "\u30DC\u30B9\u30FB\u652F\u63F4"
          },
          {
            number: 97,
            legacyNumber: 74,
            name: "\u4E03\u3064\u306E\u8A3C",
            condition: "\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9\u30AB\u30FC\u30C9\u30921\u679A\u5B8C\u6210",
            stars: 1,
            id: "lb7",
            legacyId: "lb7",
            category: "\u30ED\u30B0\u30A4\u30F3"
          },
          {
            number: 98,
            legacyNumber: 100,
            name: "\u4E03\u3064\u306E\u5B9D\u5370",
            condition: "\u30ED\u30B0\u30A4\u30F3\u30DC\u30FC\u30CA\u30B9\u30AB\u30FC\u30C9\u3092\u901A\u7B977\u679A\u5B8C\u6210",
            stars: 3,
            id: "lb_cards7",
            legacyId: null,
            category: "\u30ED\u30B0\u30A4\u30F3"
          },
          {
            number: 99,
            legacyNumber: 75,
            name: "\u99B4\u67D3\u307F\u306E\u5192\u967A\u8005",
            condition: "\u901A\u7B9730\u65E5\u30ED\u30B0\u30A4\u30F3",
            stars: 2,
            id: "lb30",
            legacyId: "lb30",
            category: "\u30ED\u30B0\u30A4\u30F3"
          },
          {
            number: 100,
            legacyNumber: 76,
            name: "\u6C38\u9060\u306E\u5192\u967A\u8005",
            condition: "\u901A\u7B97100\u65E5\u30ED\u30B0\u30A4\u30F3",
            stars: 3,
            id: "lb100",
            legacyId: "lb100",
            category: "\u30ED\u30B0\u30A4\u30F3"
          }
        ],
        ownerClarifications: {
          attackNullificationMetric: "distinct-attack-events",
          legacyNullificationAmountsMustNotBecomeEventCounts: true,
          withdrawnFiveStarPromotion: 65,
          nameCorrections: {
            "66": "\u738B\u8005\u9632\u885B"
          }
        }
      };
    }
  });

  // src/title-compat-next.cjs
  var require_title_compat_next = __commonJS({
    "src/title-compat-next.cjs"(exports, module) {
      "use strict";
      var catalog2 = require_title_catalog_next();
      var ids = new Set(catalog2.titles.map((t) => t.id));
      function read({ legacyEarned = [], flags = [], equipped = null, deriveHidden = false } = {}) {
        var _a;
        const earned = /* @__PURE__ */ new Map();
        for (const id of legacyEarned) if (typeof id === "string") earned.set(id, { id, at: null, source: "legacy-evidence" });
        for (const map of flags) for (const [id, v] of Object.entries(map || {})) {
          if (v !== true && (v == null ? void 0 : v.earned) !== true) continue;
          const at = v && typeof v === "object" && Number.isFinite(v.at) && v.at > 0 ? v.at : null;
          const previous = earned.get(id);
          earned.set(id, { id, at: (_a = previous == null ? void 0 : previous.at) != null ? _a : at, source: "stored-flag", ...v && typeof v === "object" && v.dateWasUnknown === true ? { dateWasUnknown: true, dateOrigin: v.dateOrigin } : (previous == null ? void 0 : previous.dateWasUnknown) ? { dateWasUnknown: true, dateOrigin: previous.dateOrigin } : {} });
        }
        const normal = catalog2.titles.filter((t) => earned.has(t.id)), rare = normal.filter((t) => t.stars === 5).length;
        if (deriveHidden && rare >= 15 && !earned.has(catalog2.hidden.id)) earned.set(catalog2.hidden.id, { id: catalog2.hidden.id, at: null, source: "derived-five-star" });
        return { earned: Object.fromEntries(earned), normal, fiveStarCount: rare, hiddenEligible: rare >= 15, hiddenOwned: earned.has(catalog2.hidden.id), archived: [...earned.keys()].filter((id) => !ids.has(id) && id !== catalog2.hidden.id), equipped };
      }
      module.exports = { read };
    }
  });

  // src/title-inventory-ui.jsx
  var title_inventory_ui_exports = {};
  __export(title_inventory_ui_exports, {
    TITLE_PREREQ: () => TITLE_PREREQ,
    TitleCinematic: () => TitleCinematic,
    TitleEquipControl: () => TitleEquipControl,
    TitleEquipCurrent: () => TitleEquipCurrent,
    TitleInventory: () => TitleInventory
  });
  function TitleCinematic({ muted = false, reducedMotion = false, onFinish = () => {
  } }) {
    const [sound, setSound] = React.useState(!muted), finished = React.useRef(false);
    const audio = React.useRef(null), done = () => {
      if (finished.current) return;
      finished.current = true;
      onFinish();
    };
    React.useEffect(() => {
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        var _a;
        document.body.style.overflow = old;
        (_a = audio.current) == null ? void 0 : _a.close().catch(() => {
        });
      };
    }, []);
    React.useEffect(() => {
      var _a;
      if (!sound) {
        (_a = audio.current) == null ? void 0 : _a.close().catch(() => {
        });
        audio.current = null;
        return;
      }
      try {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return;
        const c = new C();
        audio.current = c;
        const gain = c.createGain();
        gain.gain.value = 0.035;
        gain.connect(c.destination);
        for (const [f, i] of [[220, 0], [330, 1], [440, 2], [660, 3]]) {
          const o = c.createOscillator();
          o.type = "sine";
          o.frequency.value = f;
          o.connect(gain);
          o.start(c.currentTime + i * 0.2);
          o.stop(c.currentTime + i * 0.2 + 0.3);
        }
      } catch (e) {
      }
      return () => {
        var _a2;
        (_a2 = audio.current) == null ? void 0 : _a2.close().catch(() => {
        });
        audio.current = null;
      };
    }, [sound]);
    const ref = React.useRef(null);
    React.useEffect(() => {
      var _a;
      (_a = ref.current) == null ? void 0 : _a.showModal();
      return () => {
        var _a2;
        return (_a2 = ref.current) == null ? void 0 : _a2.close();
      };
    }, []);
    return /* @__PURE__ */ React.createElement("dialog", { ref, className: "next-title-cinematic " + (reducedMotion ? "reduced" : ""), "aria-label": "\u79F0\u53F7\u7372\u5F97\u6F14\u51FA", onCancel: (e) => {
      e.preventDefault();
      done();
    } }, /* @__PURE__ */ React.createElement("div", { className: "next-title-particles", "aria-hidden": "true" }, Array.from({ length: 18 }, (_, i) => /* @__PURE__ */ React.createElement("i", { key: i, style: { "--i": i } }))), /* @__PURE__ */ React.createElement("div", { className: "next-title-emblem", "aria-hidden": "true" }, "\xD7"), /* @__PURE__ */ React.createElement("div", { className: "next-title-slash", "aria-hidden": "true" }), /* @__PURE__ */ React.createElement("div", { className: "next-title-reveal" }, /* @__PURE__ */ React.createElement("p", null, "\u7279\u5225\u79F0\u53F7\u3092\u7372\u5F97"), /* @__PURE__ */ React.createElement("img", { src: "ui-next/logo-official.png", alt: "FACTOR\xD7FACTOR" }), /* @__PURE__ */ React.createElement("strong", null, "FACTOR\xD7FACTOR")), /* @__PURE__ */ React.createElement("div", { className: "next-title-controls" }, /* @__PURE__ */ React.createElement("button", { onClick: () => setSound((x) => !x), "aria-pressed": sound }, "\u97F3\u58F0", sound ? "ON" : "OFF"), /* @__PURE__ */ React.createElement("button", { autoFocus: true, onClick: done }, reducedMotion ? "\u9589\u3058\u308B" : "\u30B9\u30AD\u30C3\u30D7\u30FB\u9589\u3058\u308B")));
  }
  function TitleEquipControl({ equip, id, name, earned }) {
    var _a;
    const route = equip.routeOf(id, earned), on = equip.isEquipped(id), st = ((_a = equip.status) == null ? void 0 : _a.id) === id ? equip.status : null, reason = equip.reasonOf(id, earned);
    const busy = equip.busy, compat2 = equip.compatId === id;
    return /* @__PURE__ */ React.createElement("div", { className: "next-title-equip", "data-title-equip": id, "data-equip-state": on ? "on" : route ? "off" : "disabled" }, on && /* @__PURE__ */ React.createElement("span", { className: "next-title-equipped", "data-equipped": true }, "\u2714 \u88C5\u5099\u4E2D"), route && !on && /* @__PURE__ */ React.createElement("button", { type: "button", className: "next-title-equip-btn", disabled: busy, onClick: () => equip.onEquip(id), "aria-label": name + "\u3092\u88C5\u5099\u3059\u308B" }, "\u88C5\u5099\u3059\u308B"), route && on && /* @__PURE__ */ React.createElement("button", { type: "button", className: "next-title-equip-btn off", disabled: busy, onClick: () => equip.onUnequip(id), "aria-label": name + "\u3092\u306F\u305A\u3059" }, "\u306F\u305A\u3059"), !route && /* @__PURE__ */ React.createElement("button", { type: "button", className: "next-title-equip-btn", disabled: true, "aria-label": name + "\u3092\u88C5\u5099\u3059\u308B", "aria-describedby": "equip-why-" + id }, "\u88C5\u5099\u3059\u308B"), reason && /* @__PURE__ */ React.createElement("span", { className: "next-title-equip-why", id: "equip-why-" + id }, reason), compat2 && /* @__PURE__ */ React.createElement("span", { className: "next-title-equip-why", "data-rating-title-note": true }, "\u5F93\u6765\u306E\u30E9\u30F3\u30AD\u30F3\u30B0\u79F0\u53F7\u3092\u8868\u793A\u4E2D\u3067\u3059\u3002\u306F\u305A\u3059\u3001\u307E\u305F\u306F\u5225\u306E\u79F0\u53F7\u3092\u88C5\u5099\u3059\u308B\u3068\u3001\u7D71\u4E00\u306E\u88C5\u5099\u67A0\u306E\u8A2D\u5B9A\u306B\u5207\u308A\u66FF\u308F\u308A\u307E\u3059\u3002"), st && /* @__PURE__ */ React.createElement("span", { className: "next-title-equip-status " + st.state, role: st.state === "failed" ? "alert" : "status", "data-equip-status": st.state }, st.state === "saving" ? st.slow ? "\u4FDD\u5B58\u4E2D\u2026\uFF08\u901A\u4FE1\u304C\u9045\u308C\u3066\u3044\u307E\u3059\u3002\u305D\u306E\u307E\u307E\u304A\u5F85\u3061\u304F\u3060\u3055\u3044\uFF09" : "\u4FDD\u5B58\u4E2D\u2026" : st.message));
  }
  function TitleEquipCurrent({ equip }) {
    const cur = equip.current, listed = (id) => id === catalog.hidden.id || catalog.titles.some((t) => t.id === id);
    const stx = equip.status && !listed(equip.status.id) ? equip.status : null;
    const statusEl = stx && /* @__PURE__ */ React.createElement("span", { className: "next-title-equip-status " + stx.state, role: stx.state === "failed" ? "alert" : "status", "data-equip-status": stx.state }, stx.state === "saving" ? "\u4FDD\u5B58\u4E2D\u2026" : stx.message);
    if (!cur) return statusEl ? /* @__PURE__ */ React.createElement("div", { className: "next-title-equip-current", "data-equip-current-result": true }, statusEl) : null;
    return /* @__PURE__ */ React.createElement("div", { className: "next-title-equip-current", "data-equip-current": cur.id }, /* @__PURE__ */ React.createElement("span", null, "\u73FE\u5728\u306E\u88C5\u5099\uFF1A\u3008", cur.label, "\u3009", !cur.inCatalog && cur.label !== "\u8868\u793A\u3067\u304D\u306A\u3044\u79F0\u53F7" && "\uFF08\u5F93\u6765\u306E\u79F0\u53F7\uFF09"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "next-title-equip-btn off", disabled: equip.busy || !equip.real, onClick: () => equip.onUnequip(cur.id), "aria-label": "\u88C5\u5099\u4E2D\u306E\u79F0\u53F7\u3092\u306F\u305A\u3059" }, "\u306F\u305A\u3059"), statusEl);
  }
  function TitleDetail({ t, earnedMap = {}, earned, equipped, iconOf, equip, readOnly, onClose, onScene, hidden }) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      const d = ref.current;
      if (d && !d.open) d.showModal();
      return () => {
        try {
          d && d.open && d.close();
        } catch (e) {
        }
      };
    }, []);
    const isHidden = !!hidden, name = isHidden ? catalog.hidden.name : t.name, stars = isHidden ? 5 : t.stars, id = isHidden ? catalog.hidden.id : t.id;
    const cond = isHidden ? earned ? `\u901A\u5E38\u79F0\u53F7\u306E\u3046\u3061 ${catalog.hidden.requiredDistinctFiveStar} \u7A2E\u985E\u306E\u26055\u3092\u96C6\u3081\u308B` : "" : condVisible(t, earnedMap) ? t.condition : "\uFF1F\uFF1F\uFF1F";
    return /* @__PURE__ */ React.createElement("dialog", { ref, className: "tc-sheet", "data-title-detail": id, "aria-label": name + "\u306E\u8A73\u7D30", onCancel: (e) => {
      e.preventDefault();
      onClose();
    }, onClick: (e) => {
      if (e.target === ref.current) onClose();
    } }, /* @__PURE__ */ React.createElement("div", { className: "tc-sheet-body" }, /* @__PURE__ */ React.createElement("div", { className: "tc-sheet-icon", "aria-hidden": "true", "data-rarity": stars }, earned ? iconOf(id) : "\u{1F512}"), /* @__PURE__ */ React.createElement("h4", null, name), /* @__PURE__ */ React.createElement("p", { className: "tc-sheet-stars", "aria-label": `${stars}\u3064\u661F` }, /* @__PURE__ */ React.createElement("span", { "data-rarity": stars }, "\u2605".repeat(stars)), " ", /* @__PURE__ */ React.createElement("small", null, RARITY[stars])), /* @__PURE__ */ React.createElement("p", { className: "tc-sheet-state", "data-state": earned ? "earned" : "locked" }, earned ? earned.at ? `\u53D6\u5F97\u6E08\u307F \u30FB ${new Date(earned.at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" }) + (earned.dateWasUnknown ? "\uFF08\u78BA\u8A8D\u65E5\u30FB\u53D6\u5F97\u65E5\u4E0D\u660E\uFF09" : "")}` : "\u53D6\u5F97\u6E08\u307F \u30FB \u53D6\u5F97\u65E5\u672A\u8A18\u9332" : "\u672A\u53D6\u5F97", equipped === id ? " \u30FB \u88C5\u5099\u4E2D" : ""), /* @__PURE__ */ React.createElement("dl", null, /* @__PURE__ */ React.createElement("dt", null, "\u53D6\u5F97\u6761\u4EF6"), /* @__PURE__ */ React.createElement("dd", null, cond || "\uFF1F\uFF1F\uFF1F"), !isHidden && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("dt", null, "\u5206\u985E"), /* @__PURE__ */ React.createElement("dd", null, t.category))), !readOnly && equip && earned && /* @__PURE__ */ React.createElement(TitleEquipControl, { equip, id, name, earned: true }), !readOnly && equip && !earned && /* @__PURE__ */ React.createElement("p", { className: "tc-sheet-note" }, "\u672A\u53D6\u5F97\u306E\u305F\u3081\u88C5\u5099\u3067\u304D\u307E\u305B\u3093"), isHidden && earned && /* @__PURE__ */ React.createElement("button", { type: "button", className: "tc-sheet-sub", onClick: onScene }, "\u7372\u5F97\u6F14\u51FA\u3092\u518D\u8996\u8074"), /* @__PURE__ */ React.createElement("button", { type: "button", className: "tc-sheet-close", onClick: onClose }, "\u3068\u3058\u308B")));
  }
  function TitleInventory({ earnedIds = [], flags = [], equipped, accountKey, muted = true, presentationStore = null, equip = null, readOnly = false, iconOf = () => catalog.hidden.icon || "\u{1F3C5}" }) {
    var _a;
    const state = compat.read({ legacyEarned: earnedIds, flags, equipped, deriveHidden: true }), [filter, setFilter] = React.useState("all"), [scene, setScene] = React.useState(false), [open, setOpen] = React.useState(null);
    const [presentationError, setPresentationError] = React.useState("");
    const presentationKey = accountKey ? "fxf_title_presentation_v1:" + accountKey : null;
    React.useEffect(() => {
      if (readOnly || !state.hiddenOwned || !presentationKey) return;
      let active = true;
      if (presentationStore) {
        (presentationStore.claimAutomatic ? presentationStore.claimAutomatic() : presentationStore.seen().then((seen) => !seen)).then((claimed) => {
          if (active && claimed) setScene(true);
        }).catch(() => {
          if (active) setPresentationError("\u6F14\u51FA\u306E\u95B2\u89A7\u72B6\u6CC1\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3002\u518D\u8996\u8074\u306F\u5229\u7528\u3067\u304D\u307E\u3059\u3002");
        });
      } else {
        let seen = false;
        try {
          seen = localStorage.getItem(presentationKey) === "seen";
        } catch (e) {
        }
        if (!seen) setScene(true);
      }
      return () => {
        active = false;
      };
    }, [readOnly, state.hiddenOwned, presentationKey, presentationStore]);
    const closeScene = () => {
      setScene(false);
      if (presentationStore) {
        presentationStore.acknowledge().then(() => setPresentationError("")).catch(() => setPresentationError("\u95B2\u89A7\u72B6\u6CC1\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u518D\u8996\u8074\u5F8C\u306B\u518D\u8A66\u884C\u3057\u307E\u3059\u3002"));
        return;
      }
      if (presentationKey) try {
        localStorage.setItem(presentationKey, "seen");
      } catch (e) {
      }
    };
    const total = 100 + (state.hiddenOwned ? 1 : 0), got = state.normal.length + (state.hiddenOwned ? 1 : 0), pct = Math.round(got * 100 / total);
    const shown = catalog.titles.filter((t) => filter === "all" || filter === "earned" === !!state.earned[t.id]);
    const openT = open === "__hidden" ? null : catalog.titles.find((t) => t.id === open);
    const card = (t, earned, hidden) => {
      const id = hidden ? catalog.hidden.id : t.id, name = hidden ? catalog.hidden.name : t.name, stars = hidden ? 5 : t.stars;
      return /* @__PURE__ */ React.createElement("li", { key: id }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "tc-card", "data-title-id": id, "data-state": earned ? "earned" : "locked", "data-rarity": stars, "data-equipped": equipped === id ? "true" : "false", "aria-label": `${name}\u3001${stars}\u3064\u661F\u3001${earned ? "\u53D6\u5F97\u6E08\u307F" : "\u672A\u53D6\u5F97"}${equipped === id ? "\u3001\u88C5\u5099\u4E2D" : ""}`, onClick: () => setOpen(hidden ? "__hidden" : id) }, equipped === id && /* @__PURE__ */ React.createElement("span", { className: "tc-ribbon", "data-equipped": true }, "\u88C5\u5099\u4E2D"), /* @__PURE__ */ React.createElement("span", { className: "tc-icon", "aria-hidden": "true" }, earned ? iconOf(id) : "\u{1F512}"), /* @__PURE__ */ React.createElement("strong", { className: "tc-name" }, name), /* @__PURE__ */ React.createElement("span", { className: "tc-stars", "aria-hidden": "true" }, "\u2605".repeat(stars))));
    };
    return /* @__PURE__ */ React.createElement("section", { className: "next-title-inventory tc", "data-title-inventory": true }, /* @__PURE__ */ React.createElement("header", { className: "tc-head" }, /* @__PURE__ */ React.createElement("h3", null, "\u79F0\u53F7\u30FB\u5B9F\u7E3E"), /* @__PURE__ */ React.createElement("p", { className: "tc-count", "data-title-count": true }, /* @__PURE__ */ React.createElement("b", null, got), " / ", total, /* @__PURE__ */ React.createElement("span", null, "\u3000\u9054\u6210\u7387 ", pct, "%")), /* @__PURE__ */ React.createElement("div", { className: "tc-bar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": total, "aria-valuenow": got, "aria-label": "\u79F0\u53F7\u306E\u7372\u5F97\u6570" }, /* @__PURE__ */ React.createElement("i", { style: { width: pct + "%" } }))), !readOnly && equip && /* @__PURE__ */ React.createElement(TitleEquipCurrent, { equip }), /* @__PURE__ */ React.createElement("div", { role: "group", "aria-label": "\u79F0\u53F7\u306E\u7D5E\u308A\u8FBC\u307F", className: "tc-filter" }, [["all", "\u3059\u3079\u3066"], ["earned", "\u53D6\u5F97\u6E08\u307F"], ["locked", "\u672A\u53D6\u5F97"]].map(([id, label]) => /* @__PURE__ */ React.createElement("button", { type: "button", key: id, "aria-pressed": filter === id, onClick: () => setFilter(id) }, label))), /* @__PURE__ */ React.createElement("ol", { className: "tc-grid" }, shown.map((t) => card(t, state.earned[t.id], false)), state.hiddenOwned && filter !== "locked" && card(null, true, true)), /* @__PURE__ */ React.createElement("p", { className: "tc-note" }, "\u26054\u301C5\u306E\u672A\u53D6\u5F97\u306E\u6761\u4EF6\u306F\u300C\uFF1F\uFF1F\uFF1F\u300D\u3068\u8868\u793A\u3057\u307E\u3059\u3002"), presentationError && state.hiddenOwned && /* @__PURE__ */ React.createElement("p", { role: "alert" }, presentationError), open && (open === "__hidden" ? state.hiddenOwned : openT) && /* @__PURE__ */ React.createElement(TitleDetail, { t: openT, earnedMap: state.earned, hidden: open === "__hidden", earned: open === "__hidden" ? state.earned[catalog.hidden.id] : state.earned[open], equipped, iconOf, equip, readOnly, onClose: () => setOpen(null), onScene: () => {
      setOpen(null);
      setScene(true);
    } }), scene && state.hiddenOwned && /* @__PURE__ */ React.createElement(TitleCinematic, { muted, reducedMotion: (_a = window.matchMedia) == null ? void 0 : _a.call(window, "(prefers-reduced-motion: reduce)").matches, onFinish: closeScene }));
  }
  var catalog, compat, RARITY, TITLE_PREREQ, condVisible;
  var init_title_inventory_ui = __esm({
    "src/title-inventory-ui.jsx"() {
      catalog = require_title_catalog_next();
      compat = require_title_compat_next();
      RARITY = ["", "\u3075\u3064\u3046", "\u307E\u3042\u307E\u3042", "\u3081\u305A\u3089\u3057\u3044", "\u30EC\u30A2", "\u3068\u304F\u3079\u3064"];
      TITLE_PREREQ = { streak30: ["streak10"], streak50: ["streak30"], giant250: ["giant"], master1700: ["master1600"], master1900: ["master1700"], easy_master: ["easy_adept"], normal_master: ["normal_adept"], dual_master: ["easy_master", "normal_master"], perfect300: ["perfect100"], perfect500: ["perfect300"], perfect1000: ["perfect500"], combo30: ["combo20"], miracle: ["clutch"], alllv: ["lv9"], tour3: ["tour1"], tour10: ["tour3"], wkace5: ["wkace"], wkone2: ["wkone"], wkst10: ["wkst5"], wkk10: ["wkk5"], wkdex6: ["wkdex3"], cancel2000: ["cancel500"], dual50: ["dual"], nomiss10: ["nomiss"], bounty10: ["bounty1"], daily30: ["daily7"], ghost_up2: ["ghost_up1"] };
      condVisible = (t, earnedMap) => t.stars <= 3 || !!earnedMap[t.id] || (TITLE_PREREQ[t.id] || []).every((x) => !!earnedMap[x]) && !!TITLE_PREREQ[t.id];
    }
  });

  // src/profile-read.cjs
  var require_profile_read = __commonJS({
    "src/profile-read.cjs"(exports, module) {
      "use strict";
      function number(value) {
        if (typeof value === "string") {
          if (!/^\s*\d+(?:\.\d+)?\s*$/.test(value)) return null;
          value = Number(value);
        }
        return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
      }
      function record(source) {
        const r = source || {}, w = number(r.w), l = number(r.l), d = number(r.d), stored = number(r.games);
        const games = stored !== null ? stored : [w, l, d].every((x) => x !== null) ? w + l + d : null;
        return { games, w, l, d, winRate: games > 0 && w !== null && w <= games ? 100 * w / games : null };
      }
      function read(stats, profile) {
        const st = stats || {}, wk = st.wk || {};
        return {
          exp: number(st.exp),
          legacy: record(st),
          modes: Object.fromEntries(["A", "B", "C"].map((m) => [m, record(st[m])])),
          rated: Object.fromEntries(["easy", "normal"].map((d) => [d, record(profile == null ? void 0 : profile[d])])),
          ghosts: Object.fromEntries(["easy", "normal"].map((d) => {
            var _a;
            return [d, record((_a = profile == null ? void 0 : profile[d]) == null ? void 0 : _a.ghost)];
          })),
          metrics: ((m) => {
            if (m.maxStreak !== null || number(st.streak) !== null) m.maxStreak = Math.max(m.maxStreak || 0, number(st.streak) || 0);
            return m;
          })(Object.fromEntries(["maxStreak", "perfects", "comebacks", "tourWins", "bestMs", "maxCombo"].map((k) => [k, number(st[k])]))),
          // Ver.6.3: the profile shows the best of what is certified and the current run (titles read stats.maxStreak, not this)
          weekly: Object.fromEntries(["weeks", "kills", "best", "maxStreak"].map((k) => [k, number(wk[k])]))
        };
      }
      module.exports = { number, record, read };
    }
  });

  // src/title-cutover-next.cjs
  var require_title_cutover_next = __commonJS({
    "src/title-cutover-next.cjs"(exports, module) {
      "use strict";
      var C = require_title_compat_next();
      var copy = (x) => JSON.parse(JSON.stringify(x));
      function validate(s, account) {
        if ((s == null ? void 0 : s.version) !== 1 || s.source !== "legacy-cutover-v1" || s.account !== account || !s.migrationId || !Number.isSafeInteger(s.capturedAt) || s.capturedAt <= 0 || !s.earned || typeof s.earned !== "object" || Array.isArray(s.earned)) throw Error("INVALID_TITLE_CUTOVER");
        for (const [id, r] of Object.entries(s.earned)) if (!id || r.id !== id || r.at != null && (!Number.isFinite(r.at) || r.at <= 0)) throw Error("INVALID_TITLE_CUTOVER");
        return s;
      }
      function freeze(existing, { account, migrationId, capturedAt, legacyEarned = [], flags = [], equipped = null } = {}) {
        if (existing) {
          validate(existing, account);
          if (existing.migrationId !== migrationId) throw Error("TITLE_MIGRATION_CONFLICT");
          return copy(existing);
        }
        const c = C.read({ legacyEarned, flags, equipped });
        return validate({ version: 1, source: "legacy-cutover-v1", account, migrationId, capturedAt, earned: c.earned, equipped }, account);
      }
      function read(snapshot, account) {
        const s = validate(snapshot, account);
        return C.read({ flags: [Object.fromEntries(Object.entries(s.earned).map(([id, r]) => [id, { earned: true, at: r.at }]))], equipped: s.equipped });
      }
      module.exports = { freeze, read, validate };
    }
  });

  // src/title-client-next.cjs
  var require_title_client_next = __commonJS({
    "src/title-client-next.cjs"(exports, module) {
      "use strict";
      var catalog2 = require_title_catalog_next();
      var Cut = require_title_cutover_next();
      var Compat = require_title_compat_next();
      var ROOT = "games/factor/titleNextV1";
      var MIGRATION_ID = "v6-client-1";
      var known = new Set(catalog2.titles.map((t) => t.id));
      var stamp = () => ({ ".sv": "timestamp" });
      var peak = (p, d) => {
        var _a;
        const v = (_a = p == null ? void 0 : p[d]) == null ? void 0 : _a.maxRating;
        return typeof v === "number" && Number.isFinite(v) ? v : null;
      };
      var RATE_RULES = {
        easy_adept: (p) => peak(p, "easy") !== null && peak(p, "easy") >= 1730,
        easy_master: (p) => peak(p, "easy") !== null && peak(p, "easy") >= 1820,
        normal_adept: (p) => peak(p, "normal") !== null && peak(p, "normal") >= 1730,
        normal_master: (p) => peak(p, "normal") !== null && peak(p, "normal") >= 1820,
        dual_master: (p) => peak(p, "easy") !== null && peak(p, "normal") !== null && peak(p, "easy") >= 1820 && peak(p, "normal") >= 1820
      };
      var JUDGES = { ...RATE_RULES };
      function legacyIds({ badgeIds = [], flags = [] } = {}) {
        const out = new Set(badgeIds.filter((id) => typeof id === "string" && id));
        for (const map of flags) for (const [id, v] of Object.entries(map || {})) if (v === true || (v == null ? void 0 : v.earned) === true) out.add(id);
        return [...out];
      }
      function judge(facts) {
        const out = [];
        for (const [id, rule] of Object.entries(JUDGES)) if (known.has(id) && rule(facts.sparkProfile)) out.push(id);
        return out;
      }
      function plan({ account, snapshot, awards, legacy = [], equipped = null, facts = {}, canFreeze = true }) {
        const held = /* @__PURE__ */ new Set([...Object.keys((snapshot == null ? void 0 : snapshot.earned) || {}), ...Object.entries(awards || {}).filter(([, v]) => (v == null ? void 0 : v.earned) === true).map(([id]) => id)]);
        const out = { snapshot: null, add: {} };
        if (!snapshot) {
          for (const id of legacy) held.add(id);
          if (canFreeze) {
            const frozen = Cut.freeze(null, { account, migrationId: MIGRATION_ID, capturedAt: 1, legacyEarned: legacy, equipped });
            out.snapshot = { ...frozen, capturedAt: stamp() };
          }
        }
        for (const id of judge(facts)) if (!held.has(id)) out.add[id] = { earned: true, at: stamp(), source: "client-judged-v1" };
        return out;
      }
      var isEmpty = (v) => v == null || typeof v === "object" && !Object.keys(v).length;
      async function sync({ db, account, computeBadgeIds = () => [] }) {
        const key = account == null ? void 0 : account.key;
        if (!key) return { status: "skipped", reason: "guest", added: [], awards: {} };
        const g = (p2) => db.ref(`games/factor/${p2}`).get().then((s) => s.val());
        const sRef = db.ref(`${ROOT}/snapshots/${key}`), aRef = db.ref(`${ROOT}/awards/${key}`);
        let stats, daily, sparkProfile, snap0, awards0, acctName, connected;
        try {
          [stats, daily, sparkProfile, snap0, awards0, acctName] = await Promise.all([g(`accounts/${key}/stats`), g(`dailyV2/titles/${key}`), g(`onlineSparkV1/profiles/${key}`), sRef.get().then((s) => s.val()), aRef.get().then((s) => s.val()), g(`accounts/${key}/name`)]);
        } catch (e) {
          return { status: "failed", error: "READ_FAILED", added: [], awards: {} };
        }
        try {
          connected = (await db.ref(".info/connected").get()).val();
        } catch (e) {
          connected = void 0;
        }
        if (connected === false) return { status: "deferred", reason: "OFFLINE", added: [], awards: awards0 || {}, snapshot: snap0 || null };
        let snapshot = snap0, awards = awards0 || {}, canFreeze = true, freezeDeferred = null;
        if (!snapshot) {
          if (acctName == null) {
            canFreeze = false;
            freezeDeferred = "ACCOUNT_UNCONFIRMED";
          } else if (isEmpty(stats)) {
            canFreeze = false;
            freezeDeferred = "STATS_EMPTY";
          }
        }
        const legacy = legacyIds({ badgeIds: computeBadgeIds(stats || {}), flags: [daily, stats == null ? void 0 : stats.ghostTitles, sparkProfile == null ? void 0 : sparkProfile.badges] });
        const p = plan({ account: key, snapshot, awards, legacy, equipped: (stats == null ? void 0 : stats.nick) || null, facts: { sparkProfile }, canFreeze });
        let snapshotError = null;
        if (p.snapshot) {
          try {
            await sRef.set(p.snapshot);
          } catch (e) {
          }
          try {
            snapshot = (await sRef.get()).val();
          } catch (e) {
            snapshot = null;
          }
          if (!snapshot) snapshotError = "SNAPSHOT_UNAVAILABLE";
        }
        const added = [], failed = [];
        for (const [id, record] of Object.entries(p.add)) {
          try {
            await aRef.child(id).set(record);
            added.push(id);
          } catch (e) {
            let exists = false;
            try {
              exists = (await aRef.child(id).get()).exists();
            } catch (_) {
            }
            if (!exists) failed.push(id);
          }
        }
        try {
          awards = (await aRef.get()).val() || {};
        } catch (e) {
        }
        const error = snapshotError || (failed.length ? "AWARD_NOT_SAVED" : null);
        return { status: error ? "failed" : "ok", ...error ? { error } : {}, ...failed.length ? { failed } : {}, ...freezeDeferred ? { freezeDeferred } : {}, snapshot: snapshot || null, awards, added, frozen: !!(p.snapshot && snapshot && !snapshotError) };
      }
      function view({ snapshot, awards, equipped = null }) {
        var _a;
        const retained = Object.fromEntries(Object.entries((snapshot == null ? void 0 : snapshot.earned) || {}).map(([id, r]) => [id, { earned: true, at: r.at }]));
        return Compat.read({ flags: [retained, awards || {}], equipped: (_a = equipped != null ? equipped : snapshot == null ? void 0 : snapshot.equipped) != null ? _a : null });
      }
      module.exports = { ROOT, MIGRATION_ID, JUDGES, RATE_RULES, legacyIds, judge, plan, sync, view };
    }
  });

  // src/title-labels-next.cjs
  var require_title_labels_next = __commonJS({
    "src/title-labels-next.cjs"(exports, module) {
      "use strict";
      var catalog2 = require_title_catalog_next();
      var COMMON_ICON = "\u{1F3C5}";
      var byId = new Map(catalog2.titles.map((t) => [t.id, t]));
      function of(id) {
        const t = byId.get(id);
        if (t) return { id, icon: t.icon || COMMON_ICON, label: t.name, source: "catalog" };
        if (id === catalog2.hidden.id) return { id, icon: catalog2.hidden.icon || COMMON_ICON, label: catalog2.hidden.name, source: "hidden" };
        return null;
      }
      function resolve(id, legacy) {
        const c = of(id);
        if (c) return { id, icon: legacy && legacy.icon || c.icon, label: c.label, source: c.source };
        return legacy ? { id, icon: legacy.icon, label: legacy.label, source: "legacy" } : null;
      }
      var equippableIds = () => [...catalog2.titles.map((t) => t.id), catalog2.hidden.id];
      module.exports = { of, resolve, COMMON_ICON, equippableIds, hiddenId: catalog2.hidden.id };
    }
  });

  // src/title-equip-next.cjs
  var require_title_equip_next = __commonJS({
    "src/title-equip-next.cjs"(exports, module) {
      "use strict";
      var labels = require_title_labels_next();
      var known = new Set(labels.equippableIds());
      function route(id, { earned }) {
        return known.has(id) && earned.has(id) ? "nick" : null;
      }
      function reason(id, { real, earned, routeOf }) {
        if (!real) return "\u30B2\u30B9\u30C8\u306F\u79F0\u53F7\u3092\u88C5\u5099\u3067\u304D\u307E\u305B\u3093";
        if (!earned) return "\u672A\u53D6\u5F97\u306E\u305F\u3081\u88C5\u5099\u3067\u304D\u307E\u305B\u3093";
        if (!routeOf) return "\u3053\u306E\u79F0\u53F7\u306F\u73FE\u5728\u306E\u88C5\u5099\u6A5F\u80FD\u306B\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u305B\u3093";
        return "";
      }
      function confirm(id, { fresh, complete, memory }) {
        if (!known.has(id)) return false;
        if (fresh && fresh.has(id)) return true;
        if (complete) return false;
        return memory.has(id);
      }
      var SLOW_MS = 6e3;
      module.exports = { route, reason, confirm, SLOW_MS };
    }
  });

  // src/next-navigation.cjs
  var require_next_navigation = __commonJS({
    "src/next-navigation.cjs"(exports, module) {
      "use strict";
      var returnPages = /* @__PURE__ */ new Set(["home", "solo", "battle", "daily", "learn", "rankings", "ranking-solo", "ranking-daily", "ranking-rating"]);
      function active(page) {
        return page.startsWith("ranking") ? "rank" : { battle: "online", profile: "account" }[page] || page;
      }
      function target(key) {
        return { online: "battle", rank: "rankings", boss: "raidw", help: "solo" }[key] || key;
      }
      function back(argument) {
        return returnPages.has(argument == null ? void 0 : argument.from) ? { page: argument.from, arg: argument.fromArg || null } : { page: "home", arg: null };
      }
      module.exports = { active, target, back };
    }
  });

  // src/title-display-next.cjs
  var require_title_display_next = __commonJS({
    "src/title-display-next.cjs"(exports, module) {
      "use strict";
      function resolve({ nick, title }, { valid }) {
        if (typeof nick === "string") {
          if (nick === "") return { state: "cleared", id: null };
          return valid(nick) ? { state: "nick", id: nick } : { state: "unresolved", id: null };
        }
        if (nick !== void 0 && nick !== null) return { state: "unresolved", id: null };
        if (typeof title === "string" && title !== "" && valid(title)) return { state: "compat", id: title };
        return { state: "none", id: null };
      }
      var shownId = (d) => d.state === "nick" || d.state === "compat" ? d.id : null;
      module.exports = { resolve, shownId };
    }
  });

  // src/title-keep-next.cjs
  var require_title_keep_next = __commonJS({
    "src/title-keep-next.cjs"(exports, module) {
      "use strict";
      var isObjLocal = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
      var LEGACY_TESTS = Object.freeze({
        handi: (st) => (st.handiWins || 0) >= 1,
        streak10: (st) => (st.maxStreak || 0) >= 10,
        streak30: (st) => (st.maxStreak || 0) >= 30,
        streak50: (st) => (st.maxStreak || 0) >= 50,
        mis7: (st) => (st.misDays || 0) >= 7,
        cancel500: (st) => (st.cancelTotal || 0) >= 500,
        cancel2000: (st) => (st.cancelTotal || 0) >= 2e3,
        darkhorse: (st) => (st.darkHorse || 0) >= 1,
        // Ver.6.0 release adjustment: titles whose NEW acquisition is suspended (deferred) keep their legacy holders through tk.
        dual: (st) => ((isObjLocal(st.A) ? st.A.w : 0) || 0) >= 10 && ((isObjLocal(st.B) ? st.B.w : 0) || 0) >= 10,
        rgold: (st) => (st.maxRating || 0) >= 1580,
        master1600: (st) => (st.maxRating || 0) >= 1600,
        master1700: (st) => (st.maxRating || 0) >= 1700,
        rmaster: (st) => (st.maxRating || 0) >= 1820,
        master1900: (st) => (st.maxRating || 0) >= 1900
      });
      var KEEP_IDS = Object.freeze(Object.keys(LEGACY_TESTS));
      var DARKHORSE_ROSTER_NOTE = "reserved: teacher roster";
      var isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
      var count = (x) => typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0;
      var isHeld = (v) => v === 1 || v === true;
      function validKeep(tk) {
        if (!isObj(tk) || tk.v !== 1) return false;
        if (tk.ids === void 0) return true;
        return isObj(tk.ids) && Object.keys(tk.ids).every((id) => KEEP_IDS.includes(id) && isHeld(tk.ids[id]));
      }
      var validBase = (b) => isObj(b) && ["games", "Aw", "Bw"].every((k) => typeof b[k] === "number" && Number.isFinite(b[k]) && b[k] >= 0);
      var validTv2 = (t) => isObj(t) && t.v === 1 && t.since !== void 0 && validBase(t.base);
      function legacyIds(stats) {
        const st = isObj(stats) ? stats : {};
        return KEEP_IDS.filter((id) => LEGACY_TESTS[id](st));
      }
      var keptIds = (stats) => isObj(stats) && validKeep(stats.tk) ? Object.keys(stats.tk.ids || {}).filter((id) => isHeld(stats.tk.ids[id])) : [];
      var isFrozen = (stats) => isObj(stats) && validKeep(stats.tk);
      function held(stats, id) {
        if (!KEEP_IDS.includes(id)) return false;
        const st = isObj(stats) ? stats : {};
        return LEGACY_TESTS[id](st) || keptIds(st).includes(id);
      }
      function ensureKeep(s, stamp) {
        const out = { tk: false, tv2: false };
        if (!isObj(s)) return out;
        if (!validKeep(s.tk)) {
          const ids = {};
          for (const id of legacyIds(s)) ids[id] = 1;
          s.tk = Object.keys(ids).length ? { v: 1, at: stamp, ids } : { v: 1, at: stamp };
          out.tk = true;
        }
        const base = { games: count(s.games), Aw: count(isObj(s.A) ? s.A.w : 0), Bw: count(isObj(s.B) ? s.B.w : 0) };
        if (!validTv2(s.tv2)) {
          if (isObj(s.tv2) && s.tv2.v === 1) {
            if (s.tv2.since === void 0) s.tv2.since = stamp;
            if (!validBase(s.tv2.base)) s.tv2.base = base;
          } else {
            s.tv2 = { v: 1, since: stamp, base };
          }
          out.tv2 = true;
        }
        return out;
      }
      var SAFE_CODE = /^[A-Za-z0-9_.:-]{1,40}$/;
      var codeOf = (e) => {
        const c = e && (e.code || e.name);
        return typeof c === "string" && SAFE_CODE.test(c) ? c : "unknown";
      };
      async function freezeOnLogin({ db, key, stamp, timeoutMs = 15e3 }) {
        if (!db || typeof key !== "string" || !key) return { status: "failed", code: "bad-args" };
        const ref = db.ref(`games/factor/accounts/${key}/stats`);
        let value;
        try {
          value = (await ref.get()).val();
        } catch (e) {
          return { status: "read-failed", code: codeOf(e) };
        }
        if (!isObj(value) || !Object.keys(value).length) return { status: "empty" };
        if (validKeep(value.tk) && validTv2(value.tv2)) return { status: "present" };
        let timer;
        try {
          const run = ref.transaction((s) => {
            if (!isObj(s) || !Object.keys(s).length) return s;
            ensureKeep(s, stamp);
            return s;
          });
          const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "timeout" })), timeoutMs);
          });
          const r = await Promise.race([run, timeout]);
          const after = r && r.committed && r.snapshot && typeof r.snapshot.val === "function" ? r.snapshot.val() : null;
          if (!isObj(after)) return { status: "failed", code: "not-committed" };
          if (!(validKeep(after.tk) && validTv2(after.tv2))) return { status: "failed", code: "not-created" };
          return { status: "frozen" };
        } catch (e) {
          return { status: "failed", code: codeOf(e) };
        } finally {
          clearTimeout(timer);
        }
      }
      module.exports = { DARKHORSE_ROSTER_NOTE, LEGACY_TESTS, KEEP_IDS, validKeep, validTv2, legacyIds, keptIds, isFrozen, held, ensureKeep, freezeOnLogin, codeOf };
    }
  });

  // src/streak-next.cjs
  var require_streak_next = __commonJS({
    "src/streak-next.cjs"(exports, module) {
      "use strict";
      var LEDGER_MAX = 64;
      var WINDOW_MS = 5e3;
      var isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
      var num = (x) => typeof x === "number" && Number.isFinite(x) ? x : null;
      var safeId = (id) => typeof id === "string" && id ? id.replace(/[.#$\[\]\/\s]/g, "_").slice(0, 80) : "";
      var validEntry = (e) => isObj(e) && safeId(e.id) && num(e.t) !== null && e.t > 0 && ["w", "l", "d"].includes(e.o) && ["r", "s"].includes(e.s);
      function ordered(l) {
        return Object.keys(l).map((id) => ({ id, ...l[id] })).sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      }
      var goodLedger = (l) => isObj(l) && Object.values(l).every((x) => isObj(x) && num(x.t) !== null && ["w", "l", "d"].includes(x.o) && ["r", "s"].includes(x.s));
      function replay(n0, list) {
        let n = n0, max = 0;
        for (const e of list) {
          n = e.r ? 0 : e.o === "w" ? n + 1 : 0;
          if (n > max) max = n;
        }
        return { n, max };
      }
      function applyResult(s, entry) {
        if (!isObj(s) || !validEntry(entry)) return { status: "invalid", recorded: false };
        const id = safeId(entry.id);
        let sk = s.sk;
        if (!isObj(sk) || sk.v !== 1 || !goodLedger(sk.l === void 0 ? {} : sk.l) || num(sk.n0 === void 0 ? 0 : sk.n0) === null) {
          sk = { v: 1, n: 0, best: isObj(s.sk) && num(s.sk.best) !== null && s.sk.best >= 0 ? s.sk.best : 0, n0: 0, l: {} };
        }
        const l = { ...sk.l || {} };
        if (l[id]) return { status: "duplicate", recorded: false };
        const list = ordered(l);
        let status = "applied";
        if (list.length >= LEDGER_MAX && entry.t < list[0].t) {
          s.sk = { ...sk, l, n: 0 };
          return { status: "restart", recorded: false };
        }
        const e = { t: entry.t, o: entry.o, s: entry.s };
        for (const x of list) {
          if (x.s !== e.s && Math.abs(x.t - e.t) <= WINDOW_MS && x.o !== e.o) {
            l[x.id] = { t: x.t, o: x.o, s: x.s, r: 1 };
            e.r = 1;
            status = "restart";
          }
        }
        l[id] = e;
        let all = ordered(l), n0 = num(sk.n0) === null ? 0 : sk.n0;
        while (all.length > LEDGER_MAX) {
          const old = all.shift();
          n0 = old.r ? 0 : old.o === "w" ? n0 + 1 : 0;
          delete l[old.id];
        }
        const { n, max } = replay(n0, all);
        const newest = all.length && all[all.length - 1].id === id;
        s.sk = { v: 1, n, best: Math.max(num(sk.best) || 0, newest ? max : 0), n0, l };
        return { status, recorded: true };
      }
      var bestOf = (s) => isObj(s) && isObj(s.sk) && num(s.sk.best) !== null ? s.sk.best : 0;
      module.exports = { LEDGER_MAX, WINDOW_MS, safeId, validEntry, applyResult, bestOf, replay, ordered };
    }
  });

  // src/stats-order-next.cjs
  var require_stats_order_next = __commonJS({
    "src/stats-order-next.cjs"(exports, module) {
      "use strict";
      var isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
      var num = (x) => typeof x === "number" && Number.isFinite(x) ? x : null;
      var DAY_WINDOW = 60;
      var canon = (d) => typeof d === "string" ? d.replace(/^(\d+)-(\d+)-(\d+)$/, (m, y, mo, da) => `${y}-${mo.padStart(2, "0")}-${da.padStart(2, "0")}`) : "";
      var DAYMS = 864e5;
      var ms = (d) => Date.parse(d + "T00:00:00Z");
      var fmt = (t) => new Date(t).toISOString().slice(0, 10);
      var addDays = (d, n) => fmt(ms(d) + n * DAYMS);
      var validDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(ms(d));
      function runsOf(dl) {
        const days = Object.keys(dl.d).sort(), runs = [];
        for (const d of days) {
          const r = runs[runs.length - 1];
          if (r && addDays(r.end, 1) === d) {
            r.end = d;
            r.len++;
          } else runs.push({ start: d, end: d, len: 1 });
        }
        if (runs.length && dl.pre > 0) runs[0].len += dl.pre;
        return runs;
      }
      function dayStep(s, dayIn) {
        const day = canon(dayIn);
        if (!isObj(s) || !validDay(day)) return false;
        let dl = s.dl;
        if (!(isObj(dl) && isObj(dl.d) && num(dl.pre) !== null && Object.keys(dl.d).every(validDay))) {
          const last = canon(s.lastDay), n = Math.max(0, Math.floor(num(s.dayStreak) || 0)), d2 = {};
          if (validDay(last) && n > 0) {
            const keep = Math.min(n, DAY_WINDOW);
            for (let i = 0; i < keep; i++) d2[addDays(last, -i)] = 2;
            dl = { d: d2, pre: n - keep };
          } else dl = { d: {}, pre: 0 };
        }
        const d = { ...dl.d };
        let pre = dl.pre;
        const days = Object.keys(d).sort(), oldest = days[0], newestOld = days[days.length - 1];
        if (d[day]) return false;
        const newest = newestOld && newestOld > day ? newestOld : day;
        if (day < addDays(newest, -(DAY_WINDOW - 1))) return false;
        if (oldest && day < oldest && pre > 0) return false;
        d[day] = 1;
        for (let ks = Object.keys(d).sort(); ks.length && ks[0] < addDays(newest, -(DAY_WINDOW - 1)); ks = Object.keys(d).sort()) {
          const e = ks[0];
          delete d[e];
          pre = ks[1] && ks[1] === addDays(e, 1) ? pre + 1 : 0;
        }
        const next = { d, pre }, runs = runsOf(next), lastRun = runs[runs.length - 1];
        s.dl = next;
        s.lastDay = lastRun.end;
        s.dayStreak = lastRun.len;
        s.maxDayStreak = Math.max(num(s.maxDayStreak) || 0, ...runs.map((r) => r.len));
        return true;
      }
      function currentDayStreak(s, today) {
        const last = canon(s && s.lastDay), t = canon(today);
        if (!validDay(last) || !validDay(t)) return 0;
        return last === t || last === addDays(t, -1) ? num(s.dayStreak) || 0 : 0;
      }
      module.exports = { DAY_WINDOW, dayStep, currentDayStreak, canon };
    }
  });

  // src/match-log-next.cjs
  var require_match_log_next = __commonJS({
    "src/match-log-next.cjs"(exports, module) {
      "use strict";
      var CAP = 64;
      var OPEN_MAX = 24;
      var PL_MAX = 24;
      var STABLE_MS = 1e4;
      var CONC_S = 3;
      var isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
      var num = (x) => typeof x === "number" && Number.isFinite(x) ? x : null;
      var OUT = ["w", "l", "d"];
      var KINDS = ["r", "g", "s"];
      var safeId = (id) => {
        if (typeof id !== "string" || !id) return "";
        let s = id.replace(/[.#$\[\]\/\s]/g, "_");
        if (s.length > 24) s = s.slice(0, 14) + "~" + (hash(s) >>> 0).toString(36).slice(0, 8);
        return s;
      };
      function hash(s) {
        let h = 2166136261;
        for (let i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return h;
      }
      var enc = (k) => encodeURIComponent(String(k)).replace(/[,|=]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
      var dec = (k) => {
        try {
          return decodeURIComponent(k);
        } catch (_) {
          return k;
        }
      };
      function format(e) {
        const v = (e.v || []).map((x) => enc(x.k) + (x.o ? "=" + x.o : "")).join(",");
        return e.n.toString(36) + "|" + e.k + e.r + (e.f || "") + "|" + v + "|" + Math.max(0, Math.floor(e.s || 0)).toString(36);
      }
      function parse(id, str) {
        if (typeof str !== "string") return null;
        const p = str.split("|");
        if (p.length < 3) return null;
        const n = parseInt(p[0], 36), m = /^([rgs])([owldxb])([uLq]?)$/.exec(p[1]);
        if (!Number.isFinite(n) || !m) return null;
        const v = p[2] ? p[2].split(",").map((t) => {
          const i = t.indexOf("=");
          return i < 0 ? { k: dec(t) } : { k: dec(t.slice(0, i)), o: t.slice(i + 1) };
        }) : [];
        const sec = p[3] === void 0 ? NaN : parseInt(p[3], 36);
        return { id, n, k: m[1], r: m[2], f: Number.isFinite(sec) ? m[3] : m[3] || "u", v, s: Number.isFinite(sec) ? sec : 0 };
      }
      var entries = (ml) => Object.keys(ml.e).map((id) => parse(id, ml.e[id])).filter(Boolean).sort((a, b) => a.s - b.s || a.n - b.n);
      var headS = (ml) => Math.max(num(ml.f.hs) || 0, ...Object.keys(ml.e).map((id) => {
        const e = parse(id, ml.e[id]);
        return e ? e.s : 0;
      }));
      function weakFlags(list, now) {
        const w = list.map((e) => !!e.f);
        list.forEach((e, i) => {
          if (!w[i] && num(now) !== null && now - (e.s + 1) * 1e3 < STABLE_MS) w[i] = true;
        });
        let p = -1;
        list.forEach((e, i) => {
          if (e.f) return;
          if (p >= 0 && e.s - list[p].s < CONC_S) {
            w[i] = true;
            w[p] = true;
          }
          p = i;
        });
        return w;
      }
      var goodMl = (ml) => isObj(ml) && ml.v === 1 && isObj(ml.e) && num(ml.n) !== null && isObj(ml.f) && isObj(ml.ev);
      var inLegacy = (k) => k === "r" || k === "g";
      var inOfficial = (k) => k === "r" || k === "s";
      var inRevenge = (k) => k === "r" || k === "g";
      function consume(st, e, mx, weak) {
        if (e.r === "x") {
          st.lp = Math.max(0, Math.floor(Number(e.v[0] && e.v[0].k) || 0));
          st.lc = 0;
          st.oc = 0;
          st.pl.clear();
          return;
        }
        if (e.r === "b") {
          if (inLegacy(e.k)) st.lc = 0;
          if (inOfficial(e.k)) st.oc = 0;
          if (inRevenge(e.k)) {
            if (e.v.length) e.v.forEach((x) => st.pl.delete(x.k));
            else st.pl.clear();
          }
          return;
        }
        if (e.r === "o") {
          if (inLegacy(e.k)) st.lc = 0;
          if (inOfficial(e.k)) st.oc = 0;
          if (inRevenge(e.k)) e.v.forEach((x) => st.pl.delete(x.k));
          return;
        }
        const proven = !weak, late = e.f === "L";
        if (inLegacy(e.k)) {
          if (!late) st.lp = e.r === "w" ? st.lp + 1 : e.r === "l" ? 0 : st.lp;
          if (proven) {
            st.lc = e.r === "w" ? st.lc + 1 : e.r === "l" ? 0 : st.lc;
            if (mx && st.lc > mx.lg) mx.lg = st.lc;
          } else st.lc = 0;
        }
        if (inOfficial(e.k)) {
          if (proven) {
            st.oc = e.r === "w" ? st.oc + 1 : 0;
            if (mx && st.oc > mx.og) mx.og = st.oc;
          } else st.oc = 0;
        }
        if (inRevenge(e.k)) {
          for (const x of e.v) {
            if (!proven || !OUT.includes(x.o)) {
              st.pl.delete(x.k);
              continue;
            }
            if (x.o === "w" && st.pl.has(x.k)) st.rc++;
            if (x.o === "l") {
              st.pl.add(x.k);
            } else st.pl.delete(x.k);
          }
          if (st.pl.size > PL_MAX) {
            const first = st.pl.values().next().value;
            st.pl.delete(first);
          }
        }
      }
      var foldState = (ml) => ({ lp: Math.max(0, num(ml.f.lp) || 0), lc: Math.max(0, num(ml.f.lc) || 0), oc: Math.max(0, num(ml.f.oc) || 0), pl: new Set(Array.isArray(ml.f.pl) ? ml.f.pl : []), rc: Math.max(0, num(ml.f.rc) || 0) });
      function derive(ml, now = Infinity) {
        const st = foldState(ml), mx = { lg: st.lc, og: st.oc }, list = entries(ml), weak = weakFlags(list, now);
        list.forEach((e, i) => consume(st, e, mx, weak[i]));
        return { progress: { streak: st.lp }, evidence: { lg: mx.lg, og: mx.og, rv: st.rc }, pending: [...st.pl] };
      }
      var digestOf = (s) => [s.games, s.sg, s.streak, s.maxStreak, s.revenges, s.sk && s.sk.n, s.sk && s.sk.best].map((x) => num(x) === null ? 0 : x).join(",");
      function fresh(s) {
        return { v: 1, n: 0, e: {}, f: { lp: Math.max(0, num(s.streak) || 0), lc: 0, oc: 0, pl: [], rc: 0, hs: 0 }, ev: { lg: 0, og: 0, rv: 0 }, d: "" };
      }
      function begin(s) {
        if (!isObj(s)) return { status: "invalid" };
        if (!goodMl(s.ml)) {
          s.ml = fresh(s);
          s.ml.d = digestOf(s);
          return { status: "created" };
        }
        if (s.ml.d !== digestOf(s)) {
          const ml = s.ml, gid = "gap" + (ml.n + 1).toString(36);
          ml.e = { ...ml.e, [gid]: format({ n: ++ml.n, k: "r", r: "x", f: "", s: headS(ml), v: [{ k: String(Math.max(0, num(s.streak) || 0)) }] }) };
          compact(ml);
          ml.d = digestOf(s);
          return { status: "gap" };
        }
        return { status: "ok" };
      }
      function compact(ml) {
        const list = entries(ml);
        if (list.length <= CAP) return;
        const st = foldState(ml), ob = Array.isArray(ml.f.ob) ? ml.f.ob.slice() : [], e2 = { ...ml.e }, weak = weakFlags(list, Infinity);
        let hs = num(ml.f.hs) || 0;
        for (const [i, e] of list.slice(0, list.length - CAP).entries()) {
          consume(st, e, null, weak[i]);
          hs = Math.max(hs, e.s);
          if (e.r === "o") ob.push(e.id + "|" + e.k + "|" + e.v.map((x) => enc(x.k)).join(","));
          delete e2[e.id];
        }
        ml.e = e2;
        ml.f = { lp: st.lp, lc: st.lc, oc: st.oc, pl: [...st.pl], rc: st.rc, hs, ...ob.length ? { ob } : {} };
      }
      var unresolved = (ml) => Object.values(ml.e).filter((x) => /^[^|]*\|[rgs]o/.test(x)).length + (Array.isArray(ml.f.ob) ? ml.f.ob.length : 0);
      var has = (s, id) => {
        const key = safeId(id);
        return !!(isObj(s) && goodMl(s.ml) && key && (s.ml.e[key] || orphanIndex(s.ml, key) >= 0));
      };
      var orphanIndex = (ml, id) => Array.isArray(ml.f.ob) ? ml.f.ob.findIndex((x) => x.split("|")[0] === id) : -1;
      function open(s, { id, kind, opponents = [], startAt, now }) {
        if (!isObj(s) || !KINDS.includes(kind)) return { status: "invalid" };
        const key = safeId(id);
        if (!key) return { status: "invalid" };
        begin(s);
        const ml = s.ml;
        if (ml.e[key] || orphanIndex(ml, key) >= 0) return { status: "exists" };
        const sec = num(startAt) !== null ? Math.floor(startAt / 1e3) : 0;
        if (unresolved(ml) >= OPEN_MAX) {
          const bid = "b-" + key;
          if (!ml.e[bid]) {
            ml.e = { ...ml.e, [bid]: format({ n: ++ml.n, k: kind, r: "b", f: "", s: sec > 0 ? sec : headS(ml), v: opponents.filter(Boolean).map((k) => ({ k })) }) };
            compact(ml);
          }
          return { status: "full" };
        }
        const timely = sec > 0 && num(now) !== null && now <= startAt;
        ml.e = { ...ml.e, [key]: format({ n: ++ml.n, k: kind, r: "o", f: timely ? "q" : "u", s: timely ? sec : Math.max(sec, headS(ml)), v: opponents.filter(Boolean).map((k) => ({ k })) }) };
        compact(ml);
        return { status: timely ? "opened" : "opened-late" };
      }
      function prove(s, { id, now }) {
        const key = safeId(id);
        if (!isObj(s) || !key || !goodMl(s.ml)) return { status: "invalid" };
        const ml = s.ml, cur = ml.e[key] && parse(key, ml.e[key]);
        if (!cur) return { status: "none" };
        if (cur.f !== "q") return { status: "unchanged" };
        const ok = num(now) !== null && now <= cur.s * 1e3 - 500;
        ml.e = { ...ml.e, [key]: format(ok ? { ...cur, f: "" } : { ...cur, f: "u", s: Math.max(cur.s, headS(ml)) }) };
        return { status: ok ? "proven" : "demoted" };
      }
      function settle(s, { id, kind, outcome, opponents = [], late = false }) {
        if (!isObj(s) || !KINDS.includes(kind) || !OUT.includes(outcome)) return { status: "invalid" };
        const key = safeId(id);
        if (!key) return { status: "invalid" };
        if (!goodMl(s.ml)) begin(s);
        const ml = s.ml, v = opponents.filter((x) => x && x.key).map((x) => ({ k: x.key, o: OUT.includes(x.o) ? x.o : void 0 }));
        const cur = ml.e[key] && parse(key, ml.e[key]);
        if (cur) {
          if (cur.r !== "o") return { status: "duplicate" };
          ml.e = { ...ml.e, [key]: format({ ...cur, r: outcome, v }) };
          return { status: "resolved" };
        }
        const oi = orphanIndex(ml, key);
        if (oi >= 0) {
          ml.f = { ...ml.f, ob: ml.f.ob.filter((_, i) => i !== oi) };
          if (!ml.f.ob.length) delete ml.f.ob;
        }
        ml.e = { ...ml.e, [key]: format({ n: ++ml.n, k: kind, r: outcome, f: late || oi >= 0 ? "L" : "u", s: headS(ml), v }) };
        compact(ml);
        return { status: oi >= 0 ? "orphan" : "appended" };
      }
      function voidOpen(s, { id }) {
        const key = safeId(id);
        if (!isObj(s) || !key || !goodMl(s.ml)) return { status: "invalid" };
        const ml = s.ml, cur = ml.e[key] && parse(key, ml.e[key]);
        if (cur && cur.r === "o") {
          const e2 = { ...ml.e };
          delete e2[key];
          ml.e = e2;
          return { status: "voided" };
        }
        const oi = orphanIndex(ml, key);
        if (oi >= 0) {
          ml.f = { ...ml.f, ob: ml.f.ob.filter((_, i) => i !== oi) };
          if (!ml.f.ob.length) delete ml.f.ob;
          return { status: "voided" };
        }
        return { status: "none" };
      }
      function finish(s, { best0 = 0, now } = {}) {
        if (!isObj(s) || !goodMl(s.ml)) return { status: "invalid" };
        const ml = s.ml, d = derive(ml, num(now) === null ? Infinity : now);
        s.streak = d.progress.streak;
        if (d.evidence.lg > (num(s.maxStreak) || 0)) s.maxStreak = d.evidence.lg;
        const og = Math.max(num(best0) || 0, d.evidence.og);
        if (isObj(s.sk)) s.sk.best = og;
        else if (og > 0) s.sk = { v: 1, n: 0, best: og, n0: 0, l: {} };
        const addRv = Math.max(0, d.evidence.rv - (num(ml.ev.rv) || 0));
        if (addRv) s.revenges = (num(s.revenges) || 0) + addRv;
        ml.ev = { lg: Math.max(num(ml.ev.lg) || 0, d.evidence.lg), og: Math.max(num(ml.ev.og) || 0, d.evidence.og), rv: Math.max(num(ml.ev.rv) || 0, d.evidence.rv) };
        ml.d = digestOf(s);
        return { status: "ok", ...d };
      }
      module.exports = { CAP, OPEN_MAX, PL_MAX, safeId, format, parse, entries, derive, digestOf, begin, open, prove, has, settle, voidOpen, finish, STABLE_MS, CONC_S, headS, compact, unresolved, goodMl };
    }
  });

  // src/next-ui.jsx
  function Frame({ sidebar, mobileHeader, title, hideTitle = false, actions, children, bottomNav }) {
    const heading = React.useRef(null);
    React.useEffect(() => {
      var _a;
      (_a = heading.current) == null ? void 0 : _a.focus({ preventScroll: true });
    }, [title]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "app-shell" }, sidebar, /* @__PURE__ */ React.createElement("div", { className: "page-shell" }, mobileHeader, /* @__PURE__ */ React.createElement("header", { className: "page-header", "data-title-hidden": hideTitle ? "" : void 0 }, /* @__PURE__ */ React.createElement("h1", { ref: heading, tabIndex: -1 }, title), actions), children, /* @__PURE__ */ React.createElement("footer", { className: "page-footer" }, /* @__PURE__ */ React.createElement("span", null, "FACTOR \xD7 FACTOR"), /* @__PURE__ */ React.createElement("span", null, "\u5148\u751F\u5C02\u7528\u6A5F\u80FD\u306F\u6A29\u9650\u78BA\u8A8D\u5F8C\u306B\u8868\u793A")))), bottomNav);
  }
  function Panel({ title, children, aside, ...props }) {
    return /* @__PURE__ */ React.createElement("section", { className: "next-panel", ...props }, /* @__PURE__ */ React.createElement("div", { className: "next-section-heading" }, /* @__PURE__ */ React.createElement("h2", null, title), aside), children);
  }
  function Stat({ label, value, note, ...props }) {
    return /* @__PURE__ */ React.createElement("div", { className: "next-stat", ...props }, /* @__PURE__ */ React.createElement("dt", null, label), /* @__PURE__ */ React.createElement("dd", null, value != null ? value : "\u672A\u8A18\u9332"), note && /* @__PURE__ */ React.createElement("small", null, note));
  }
  function MetricGrid({ children }) {
    return /* @__PURE__ */ React.createElement("dl", { className: "next-metrics" }, children);
  }
  function BackButton({ onClick, children = "\u623B\u308B" }) {
    return /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick }, children);
  }

  // src/next-lobby-ui.jsx
  var icons = require_next_home_icons();
  function Icon({ name }) {
    return /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: icons[name] || icons.online }));
  }
  function Choices({ label, items, value, onChange }) {
    return /* @__PURE__ */ React.createElement("fieldset", { className: "next-choices" }, /* @__PURE__ */ React.createElement("legend", null, label), /* @__PURE__ */ React.createElement("div", null, items.map(([id, name]) => /* @__PURE__ */ React.createElement("button", { key: id, "aria-pressed": value === id, onClick: () => onChange(id) }, name))));
  }
  function createLobby(H) {
    const { DIFFICULTY_CONFIG, CPU_LEVELS } = H;
    return function Lobby({ fb, acct, who, err, onQuick, quickPending, quickMessage, quickError, onConfigRetry, ratedEnabled, onRatedStats, onCreate, onJoin, onPractice, onGhosts, onProfile, onNavigate, onExit, code, setCode, pc, setPc, onPlayers, onBounty, bountyCount, onVs, teacherArea, currentRatings }) {
      var _a, _b;
      const ready = !!fb.ready;
      return /* @__PURE__ */ React.createElement("main", { className: "next-lobby", "data-next-lobby": true }, !ready && /* @__PURE__ */ React.createElement("p", { className: "next-note", role: "status" }, fb.err || "\u30B5\u30FC\u30D0\u30FC\u306B\u63A5\u7D9A\u3057\u3066\u3044\u307E\u3059\u2026", " CPU\u7DF4\u7FD2\u306F\u901A\u4FE1\u306A\u3057\u3067\u904A\u3079\u307E\u3059\u3002"), err && /* @__PURE__ */ React.createElement("p", { className: "next-error", role: "alert" }, err), /* @__PURE__ */ React.createElement("section", { className: "next-quick" }, /* @__PURE__ */ React.createElement(Icon, { name: "online" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", null, "\u30E9\u30F3\u30C0\u30E0\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u5BFE\u6226"), /* @__PURE__ */ React.createElement("p", null, "\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB\u3002\u30DE\u30C3\u30C1\u30F3\u30B0\u5F8C\u306BA\u30FB\u65B0B\u65B9\u5F0F\u3092\u9078\u629E\u3002"), !quickPending && !ratedEnabled && /* @__PURE__ */ React.createElement("p", null, "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u5BFE\u6226\u306F\u73FE\u5728\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u30EB\u30FC\u30E0\u5BFE\u6226\u30FBCPU\u7DF4\u7FD2\u3092\u5229\u7528\u3067\u304D\u307E\u3059\u3002"), quickMessage && /* @__PURE__ */ React.createElement("p", { role: quickError ? "alert" : "status" }, quickMessage)), /* @__PURE__ */ React.createElement("button", { className: "next-primary", disabled: !ready || quickPending || !ratedEnabled, onClick: onQuick }, "\u3059\u3050\u904A\u3076\uFF08\u30E9\u30F3\u30C0\u30E0\u5BFE\u6226\uFF09"), quickError && /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick: onConfigRetry }, "\u8A2D\u5B9A\u3092\u518D\u8A66\u884C")), currentRatings && /* @__PURE__ */ React.createElement(Panel, { title: "\u73FE\u5728\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0", className: "next-panel next-lobby-ratings" }, currentRatings), /* @__PURE__ */ React.createElement("div", { className: "next-lobby-grid" }, /* @__PURE__ */ React.createElement(Panel, { title: "4\u6841\u30EB\u30FC\u30E0\u5BFE\u6226" }, /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u53CB\u3060\u3061\u3068\u5BFE\u6226\u3002\u65B9\u5F0F\u3092\u9078\u3093\u3067\u90E8\u5C4B\u3092\u4F5C\u308A\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { className: "next-mode-links" }, [["A", "A\u65B9\u5F0F", "\u5148\u306B\u6B63\u89E3\u3057\u3066\u5F97\u70B9"], ["B", "\u65B0B\u65B9\u5F0F", "\u6642\u9593\u5236\n\u5F97\u70B9\u3068\u59A8\u5BB3"], ...((_a = window.FXF_FEATURES) == null ? void 0 : _a.cMode) ? [["C", "C\u65B9\u5F0F", "2\u5BFE2\u306E\u30C1\u30FC\u30E0\u6226"]] : []].map(([mode, label, note]) => /* @__PURE__ */ React.createElement("button", { key: mode, disabled: !ready, onClick: () => onCreate(false, mode) }, /* @__PURE__ */ React.createElement("strong", null, label), /* @__PURE__ */ React.createElement("small", { style: { whiteSpace: "pre-line" } }, note)))), /* @__PURE__ */ React.createElement("button", { className: "next-secondary", disabled: !ready, onClick: () => onCreate(false) }, "\u90E8\u5C4B\u3092\u4F5C\u308B\uFF08\u30DB\u30B9\u30C8\uFF09"), /* @__PURE__ */ React.createElement("label", { className: "next-code-label", htmlFor: "next-room-code" }, "\u90E8\u5C4B\u30B3\u30FC\u30C94\u6841"), /* @__PURE__ */ React.createElement("div", { className: "next-room-join" }, /* @__PURE__ */ React.createElement("input", { id: "next-room-code", value: code, onChange: (e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4)), placeholder: "\u90E8\u5C4B\u30B3\u30FC\u30C94\u6841", inputMode: "numeric", maxLength: 4 }), /* @__PURE__ */ React.createElement("button", { className: "next-secondary", disabled: !ready, onClick: () => onJoin(code, false) }, "\u53C2\u52A0"), /* @__PURE__ */ React.createElement("button", { className: "next-secondary", disabled: !ready, onClick: () => onJoin(code, true) }, "\u89B3\u6226")), /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u30AF\u30E9\u30B9\u5927\u4F1A\u3082\u540C\u3058\u30B3\u30FC\u30C9\u304B\u3089\u53C2\u52A0\u3067\u304D\u307E\u3059\u3002")), /* @__PURE__ */ React.createElement(Panel, { title: "CPU\u7DF4\u7FD2" }, /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u516C\u5F0F\u30EC\u30FC\u30C8\u30FB\u5BFE\u4EBA\u6226\u7E3E\u306B\u306F\u53CD\u6620\u3055\u308C\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement(Choices, { label: "\u65B9\u5F0F", items: [["A", "A\u65B9\u5F0F"], ["B", "\u65B0B\u65B9\u5F0F"], ...((_b = window.FXF_FEATURES) == null ? void 0 : _b.cMode) ? [["C", "C 2\u5BFE2"]] : []], value: pc.mode, onChange: (mode) => setPc({ mode }) }), /* @__PURE__ */ React.createElement(Choices, { label: "\u96E3\u6613\u5EA6", items: ["easy", "normal"].map((d) => [d, DIFFICULTY_CONFIG[d].label]), value: pc.diff, onChange: (diff) => setPc({ diff }) }), /* @__PURE__ */ React.createElement(Choices, { label: "CPU\u306E\u5F37\u3055", items: Object.entries(CPU_LEVELS).map(([id, c]) => [id, c.label]), value: pc.lv, onChange: (lv) => setPc({ lv }) }), pc.mode === "C" ? /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u3042\u306A\u305F\uFF0B\u5473\u65B9CPU \u5BFE \u76F8\u624BCPU2\u4EBA\u3002\u4F53\u529B\u306F\u30C1\u30FC\u30E0\u3067\u5171\u6709\u3002") : /* @__PURE__ */ React.createElement(Choices, { label: "CPU\u306E\u4EBA\u6570", items: [[1, "1\u4EBA"], [2, "2\u4EBA"], [3, "3\u4EBA"]], value: pc.n, onChange: (n) => setPc({ n }) }), /* @__PURE__ */ React.createElement("button", { className: "next-secondary", onClick: () => onPractice(pc) }, "CPU\u3068\u7DF4\u7FD2\u30B9\u30BF\u30FC\u30C8")), /* @__PURE__ */ React.createElement(Panel, { title: "\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226" }, /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u901A\u5E38\u30B4\u30FC\u30B9\u30C8\u3068\u30E9\u30F3\u30AD\u30F3\u30B0TOP10\u5BFE\u8C61\u306E\u30CF\u30A4\u30D1\u30FC\u30B4\u30FC\u30B9\u30C8\u3092\u9078\u3079\u307E\u3059\u3002\u81EA\u5DF1\u5BFE\u6226\u306F\u7121\u5831\u916C\u306E\u7DF4\u7FD2\u3067\u3059\u3002"), /* @__PURE__ */ React.createElement("button", { className: "next-secondary", disabled: !ready || !ratedEnabled, onClick: onGhosts }, /* @__PURE__ */ React.createElement(Icon, { name: "ghost" }), "\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226"), acct && /* @__PURE__ */ React.createElement("button", { className: "next-secondary", onClick: onProfile }, /* @__PURE__ */ React.createElement(Icon, { name: "account" }), "\u81EA\u5206\u306E\u30B4\u30FC\u30B9\u30C8\u30FB\u6210\u7E3E"), /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u81EA\u5206\u306E\u30B4\u30FC\u30B9\u30C8\u306F\u6210\u7E3E\u306E\u300C\u79F0\u53F7\u306E\u88C5\u5099\u30FB\u8A73\u7D30\u8A18\u9332\u300D\u304B\u3089\u3002\u8A18\u9332\u304C\u306A\u3051\u308C\u3070\u958B\u59CB\u3067\u304D\u307E\u305B\u3093\u3002")), /* @__PURE__ */ React.createElement(Panel, { title: "\u5354\u529B\u30FB\u30D7\u30EC\u30A4\u30E4\u30FC" }, /* @__PURE__ */ React.createElement("div", { className: "next-link-list" }, /* @__PURE__ */ React.createElement("button", { className: "next-secondary", onClick: () => onNavigate("boss") }, /* @__PURE__ */ React.createElement(Icon, { name: "raid" }), "\u4ECA\u9031\u306E\u30DC\u30B9"), /* @__PURE__ */ React.createElement("button", { className: "next-secondary", disabled: !ready, onClick: () => onCreate("fraid") }, /* @__PURE__ */ React.createElement(Icon, { name: "people" }), "\u30D5\u30EC\u30F3\u30C9\u30EC\u30A4\u30C9\u3092\u958B\u304F\uFF081\u301C4\u4EBA\u3067\u5354\u529B\uFF09"), /* @__PURE__ */ React.createElement("button", { className: "next-secondary", onClick: onPlayers }, /* @__PURE__ */ React.createElement(Icon, { name: "people" }), "\u307F\u3093\u306A\u306E\u6210\u7E3E"), /* @__PURE__ */ React.createElement("button", { className: "next-secondary", onClick: onBounty }, /* @__PURE__ */ React.createElement(Icon, { name: "bounty" }), "\u8CDE\u91D1\u9996\u30EA\u30B9\u30C8", bountyCount ? `\uFF08${bountyCount}\u4EBA\uFF09` : ""), /* @__PURE__ */ React.createElement("button", { className: "next-secondary", disabled: !onRatedStats, onClick: onRatedStats }, /* @__PURE__ */ React.createElement(Icon, { name: "rank" }), "\u30AA\u30F3\u30E9\u30A4\u30F3\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0"), onVs && /* @__PURE__ */ React.createElement("button", { className: "next-secondary", onClick: onVs }, "\u76F8\u624B\u3054\u3068\u306E\u6210\u7E3E")))), teacherArea && /* @__PURE__ */ React.createElement("section", { className: "next-admin", "aria-label": "\u958B\u50AC\u6A29\u9650\u3068\u5148\u751F\u6A5F\u80FD" }, teacherArea));
    };
  }

  // src/next-profile-ui.jsx
  init_title_inventory_ui();
  var model = require_profile_read();
  var titles = require_title_catalog_next();
  var TitleClient = require_title_client_next();
  var TitleEquip = require_title_equip_next();
  var TitleCompat = require_title_compat_next();
  function createProfile(H) {
    const { RatingDisplay, RatingHistory, levelOf, isReal, useDailyTitles, useFbValue, useFbReady, weekKey, now, nickOf, badgesOf, activeAchievements, skinCatalog, GhostHistory, PlayerView, GhostBattlePanel } = H;
    const integer = (n) => n === null || n === void 0 ? "\u672A\u8A18\u9332" : n.toLocaleString("ja-JP");
    function Record({ label, value }) {
      return /* @__PURE__ */ React.createElement(Panel, { title: label }, /* @__PURE__ */ React.createElement(MetricGrid, null, /* @__PURE__ */ React.createElement(Stat, { label: "\u5BFE\u6226\u6570", value: integer(value.games) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u52DD\u5229", value: integer(value.w) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u6557\u5317", value: integer(value.l) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u5F15\u304D\u5206\u3051", value: integer(value.d) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u52DD\u7387", value: value.winRate === null ? "\u672A\u8A18\u9332" : value.winRate.toFixed(1) + "%" })));
    }
    return function Profile({ acct, stats, profile, onBack, onWardrobe }) {
      var _a, _b, _c, _d, _e, _f, _g;
      const [muted] = H.useGameMute();
      const fb = useFbReady(), real = isReal(acct), daily = useDailyTitles(real ? acct.key : null);
      const mine = useFbValue(fb.ready && real ? `raidw/${weekKey(now())}/dmg/${acct.key}` : null);
      const authority = fb.ready && real && ((_a = window.NextAuthority) == null ? void 0 : _a.enabled(H.FB.db, window.location)), authorityAwards = useFbValue(authority ? `titleNextV1/awards/${acct.key}` : null), authoritySnapshot = useFbValue(authority ? `titleNextV1/snapshots/${acct.key}` : null);
      const data = model.read(stats, profile), L = data.exp === null ? null : levelOf(data.exp);
      const [tab, setTab] = React.useState("summary"), [gv, setGv] = React.useState(false);
      const [clientTitles, setClientTitles] = React.useState(null), [titleSaveFailed, setTitleSaveFailed] = React.useState(false);
      React.useEffect(() => {
        if (!real || !fb.ready || authority || !H.FB.db) return;
        let live = true, timer = 0;
        const run = (retry) => TitleClient.sync({ db: H.FB.db, account: acct, computeBadgeIds: (st) => badgesOf(st).map((b) => b.id) }).then((r) => {
          if (!live) return;
          if (r && (r.snapshot || Object.keys(r.awards || {}).length)) setClientTitles(r);
          setTitleSaveFailed((r == null ? void 0 : r.status) === "failed");
          if ((r == null ? void 0 : r.status) === "deferred" && r.reason === "OFFLINE" && retry) timer = setTimeout(() => run(false), 4e3);
        }).catch(() => {
          if (live) setTitleSaveFailed(true);
        });
        run(true);
        return () => {
          live = false;
          clearTimeout(timer);
        };
      }, [real, acct.key, fb.ready, authority, (_b = profile == null ? void 0 : profile.easy) == null ? void 0 : _b.maxRating, (_c = profile == null ? void 0 : profile.normal) == null ? void 0 : _c.maxRating]);
      const presentationStore = React.useMemo(() => {
        var _a2;
        return real && ((_a2 = window.TitlePresentationNext) == null ? void 0 : _a2.enabled(H.FB.db, window.location)) ? window.TitlePresentationNext.create({ db: H.FB.db, account: acct }) : null;
      }, [real, acct.key, fb.ready]);
      const earned = /* @__PURE__ */ new Map();
      const visible = new Set(activeAchievements().map((b) => b.id));
      for (const b of badgesOf({ ...stats || {}, dailyTitles: daily })) if (visible.has(b.id)) earned.set(b.id, b.label);
      for (const flags of [profile == null ? void 0 : profile.badges, daily]) for (const [id, value] of Object.entries(flags || {})) if (value === true) earned.set(id, ((_d = titles.titles.find((t) => t.id === id)) == null ? void 0 : _d.name) || ((_e = nickOf(id)) == null ? void 0 : _e.label) || id);
      for (const [id] of earned) {
        const t = titles.titles.find((t2) => t2.id === id);
        if (t) earned.set(id, t.name);
      }
      const invIds = authority ? [] : [...earned.keys()], invFlags = authority ? [Object.fromEntries(Object.entries((authoritySnapshot == null ? void 0 : authoritySnapshot.earned) || {}).map(([id, r]) => [id, { earned: true, at: r.at }])), authorityAwards] : [profile == null ? void 0 : profile.badges, ...clientTitles ? [Object.fromEntries(Object.entries(((_f = clientTitles.snapshot) == null ? void 0 : _f.earned) || {}).map(([id, r]) => [id, { earned: true, at: r.at }])), clientTitles.awards] : []];
      const ffFlag = (stats == null ? void 0 : stats.ff) && stats.ff.v === 1 ? { factor_factor: { earned: true, at: Number.isFinite(stats.ff.at) && stats.ff.at > 0 ? stats.ff.at : void 0 } } : {};
      const invFlagsFF = [...invFlags, ffFlag];
      const hiddenNow = TitleCompat.read({ legacyEarned: invIds, flags: invFlagsFF, deriveHidden: true }).hiddenOwned && !TitleCompat.read({ legacyEarned: invIds, flags: invFlagsFF }).hiddenOwned;
      React.useEffect(() => {
        if (!hiddenNow || authority || !real || !fb.ready || !H.FB.db || !stats || !Object.keys(stats).length || stats.ff) return;
        H.FB.db.ref(`games/factor/accounts/${acct.key}/stats/ff`).transaction((old) => old || { v: 1, at: { ".sv": "timestamp" } }).catch(() => {
        });
      }, [hiddenNow, real, fb.ready, acct.key, !!(stats == null ? void 0 : stats.ff), !!(stats && Object.keys(stats).length)]);
      const memEarned = new Set(Object.keys(TitleCompat.read({ legacyEarned: invIds, flags: invFlagsFF, deriveHidden: true }).earned));
      const [eqNick, setEqNick] = React.useState(stats == null ? void 0 : stats.nick), [eqStatus, setEqStatus] = React.useState(null), eqBusy = React.useRef(false), eqSlow = React.useRef(0), memRef = React.useRef(memEarned), [, setEqBusyTick] = React.useState(0);
      memRef.current = memEarned;
      const titleValid = (id) => {
        var _a2;
        return !!(nickOf(id) || ((_a2 = window.TitleLabelsNext) == null ? void 0 : _a2.of(id)));
      }, disp = window.TitleDisplayNext.resolve({ nick: eqNick, title: profile == null ? void 0 : profile.title }, { valid: titleValid }), shown = window.TitleDisplayNext.shownId(disp);
      React.useEffect(() => {
        if (!eqBusy.current) setEqNick(stats == null ? void 0 : stats.nick);
      }, [stats == null ? void 0 : stats.nick]);
      React.useEffect(() => () => clearTimeout(eqSlow.current), []);
      const canEquip = !!(real && H.equipNick);
      const routeOf = (id, isEarned) => canEquip ? TitleEquip.route(id, { earned: isEarned ? /* @__PURE__ */ new Set([id]) : /* @__PURE__ */ new Set() }) : null;
      const freshEarned = async () => {
        const db = H.FB.db, base = "games/factor/", read = async (path) => {
          try {
            return { ok: true, value: (await db.ref(base + path).get()).val() };
          } catch (e) {
            return { ok: false };
          }
        };
        const [st, dl, pb, aw, sn] = await Promise.all([read("accounts/" + acct.key + "/stats"), read("dailyV2/titles/" + acct.key), read("onlineSparkV1/profiles/" + acct.key + "/badges"), read("titleNextV1/awards/" + acct.key), read("titleNextV1/snapshots/" + acct.key + "/earned")]);
        const ids = /* @__PURE__ */ new Set();
        if (st.ok) {
          for (const b of badgesOf({ ...st.value || {}, dailyTitles: dl.ok ? dl.value || {} : {} })) if (visible.has(b.id)) ids.add(b.id);
        }
        for (const r of [dl, pb]) if (r.ok) {
          for (const [id, v] of Object.entries(r.value || {})) if (v === true || (v == null ? void 0 : v.earned) === true) ids.add(id);
        }
        if (aw.ok) {
          for (const [id, v] of Object.entries(aw.value || {})) if ((v == null ? void 0 : v.earned) === true) ids.add(id);
        }
        if (sn.ok) for (const id of Object.keys(sn.value || {})) ids.add(id);
        return { fresh: ids, complete: st.ok && dl.ok && pb.ok && aw.ok && sn.ok };
      };
      const doEquip = async (id, clear) => {
        if (!canEquip || eqBusy.current || !clear && !memRef.current.has(id)) return;
        eqBusy.current = true;
        setEqStatus({ id, state: "saving", slow: false });
        clearTimeout(eqSlow.current);
        eqSlow.current = setTimeout(() => setEqStatus((s) => s && s.id === id && s.state === "saving" ? { ...s, slow: true } : s), TitleEquip.SLOW_MS);
        try {
          if (!clear) {
            const f = await freshEarned();
            if (!TitleEquip.confirm(id, { fresh: f.fresh, complete: f.complete, memory: memRef.current })) throw Object.assign(new Error("NOT_EARNED"), { notEarned: true });
          }
          await H.equipNick(acct.key, clear ? "" : id);
          setEqNick(clear ? "" : id);
          setEqStatus({ id, state: "saved", message: clear ? "\u79F0\u53F7\u3092\u306F\u305A\u3057\u307E\u3057\u305F" : "\u79F0\u53F7\u3092\u88C5\u5099\u3057\u307E\u3057\u305F" });
        } catch (e) {
          setEqStatus({ id, state: "failed", message: e && e.notEarned ? "\u53D6\u5F97\u72B6\u6CC1\u3092\u78BA\u8A8D\u3067\u304D\u306A\u304B\u3063\u305F\u305F\u3081\u88C5\u5099\u3057\u307E\u305B\u3093\u3067\u3057\u305F\uFF08\u88C5\u5099\u306F\u5909\u66F4\u3055\u308C\u3066\u3044\u307E\u305B\u3093\uFF09" : "\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u901A\u4FE1\u72B6\u614B\u3092\u3054\u78BA\u8A8D\u306E\u3046\u3048\u3001\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\uFF08\u88C5\u5099\u306F\u5909\u66F4\u3055\u308C\u3066\u3044\u307E\u305B\u3093\uFF09" });
        } finally {
          eqBusy.current = false;
          clearTimeout(eqSlow.current);
          setEqBusyTick((x) => x + 1);
        }
      };
      const labelOf = (id) => {
        var _a2;
        return ((_a2 = window.TitleLabelsNext ? window.TitleLabelsNext.resolve(id, nickOf(id)) : nickOf(id)) == null ? void 0 : _a2.label) || id;
      };
      const equipUi = H.equipNick ? {
        routeOf,
        isEquipped: (id) => shown === id,
        status: eqStatus,
        busy: eqBusy.current,
        real,
        compatId: disp.state === "compat" ? disp.id : null,
        current: shown ? { id: shown, label: labelOf(shown), inCatalog: !!((_g = window.TitleLabelsNext) == null ? void 0 : _g.of(shown)) } : disp.state === "unresolved" ? { id: eqNick, label: "\u8868\u793A\u3067\u304D\u306A\u3044\u79F0\u53F7", inCatalog: false } : null,
        reasonOf: (id, isEarned) => TitleEquip.reason(id, { real, earned: isEarned, routeOf: routeOf(id, isEarned) }),
        onEquip: (id) => doEquip(id, false),
        onUnequip: (id) => doEquip(id, true)
      } : null;
      const equipped = [shown].filter(Boolean).map((id) => ({ id, name: labelOf(id) + (disp.state === "compat" ? "\uFF08\u30E9\u30F3\u30AD\u30F3\u30B0\u79F0\u53F7\uFF09" : "") }));
      const iconOf = (id) => {
        var _a2, _b2;
        return ((_b2 = (_a2 = window.TitleLabelsNext) == null ? void 0 : _a2.resolve(id, nickOf(id))) == null ? void 0 : _b2.icon) || "\u{1F3C5}";
      };
      const skin = stats == null ? void 0 : stats.skin;
      return /* @__PURE__ */ React.createElement("main", { className: "next-profile", "data-next-profile": true }, /* @__PURE__ */ React.createElement("div", { className: "next-toolbar" }, /* @__PURE__ */ React.createElement(BackButton, { onClick: onBack }), /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick: onWardrobe }, "\u304D\u305B\u304B\u3048"), real && GhostBattlePanel && /* @__PURE__ */ React.createElement("button", { className: "small-button", "data-open-ghost": true, onClick: () => setGv(true) }, "\u30B4\u30FC\u30B9\u30C8\u5BFE\u6226")), !real && /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u30B2\u30B9\u30C8\u306E\u7D4C\u9A13\u5024\u30FB\u88C5\u5099\u306F\u3053\u306E\u7AEF\u672B\u306E\u8A18\u9332\u3067\u3059\u3002\u30AA\u30F3\u30E9\u30A4\u30F3\u6226\u7E3E\u306F\u8A18\u9332\u3055\u308C\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement(Panel, { title: acct.name, aside: /* @__PURE__ */ React.createElement("span", { className: "next-level" }, L ? `Lv.${L.lv}` : "\u30EC\u30D9\u30EB\u672A\u8A18\u9332") }, /* @__PURE__ */ React.createElement("div", { className: "next-equipped" }, "\u88C5\u5099\u4E2D\u79F0\u53F7\uFF1A", equipped.length ? equipped.map((x) => /* @__PURE__ */ React.createElement("span", { key: x.id }, x.name)) : "\u672A\u8A2D\u5B9A", /* @__PURE__ */ React.createElement("button", { type: "button", className: "small-button", "data-open-titles": true, onClick: () => setTab("rewards") }, "\u79F0\u53F7\u30FB\u5B9F\u7E3E\u3092\u958B\u304F")), /* @__PURE__ */ React.createElement(MetricGrid, null, /* @__PURE__ */ React.createElement(Stat, { label: "\u7D2F\u7A4DEXP", value: integer(data.exp) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u6B21\u306E\u30EC\u30D9\u30EB", value: L ? `${L.cur} / ${L.need} EXP` : "\u672A\u8A18\u9332" }), /* @__PURE__ */ React.createElement(Stat, { label: "\u6B74\u4EE3\u6700\u9AD8\u30EC\u30FC\u30C8", value: real ? RatingDisplay.format(RatingHistory.highest(profile, stats)) : "\u2015", "data-highest-rating": true }))), /* @__PURE__ */ React.createElement("div", { className: "next-profile-tabs", role: "tablist", "aria-label": "\u6210\u7E3E\u306E\u7A2E\u985E" }, [["summary", "\u6982\u8981"], ["records", "\u5BFE\u6226\u8A18\u9332"], ["rewards", "\u79F0\u53F7\u30FB\u5B9F\u7E3E"]].map(([id, label]) => /* @__PURE__ */ React.createElement("button", { key: id, role: "tab", "aria-selected": tab === id, "aria-controls": "profile-" + id, id: "profile-tab-" + id, onClick: () => setTab(id), onKeyDown: (e) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          const tabs = [...e.currentTarget.parentNode.querySelectorAll("[role=tab]")];
          const index = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (tabs.indexOf(e.currentTarget) + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
          tabs[index].focus();
          tabs[index].click();
        }
      } }, label))), /* @__PURE__ */ React.createElement("div", { role: "tabpanel", id: "profile-" + tab, "aria-labelledby": "profile-tab-" + tab }, tab === "summary" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "next-profile-columns" }, ["easy", "normal"].map((d) => {
        const r = real ? profile === null && d === "normal" ? { value: null, note: "\u672A\u8A18\u9332" } : RatingDisplay.current(profile, stats, d) : { value: null, note: "" };
        return /* @__PURE__ */ React.createElement(Panel, { key: d, title: d === "easy" ? "\u30A4\u30FC\u30B8\u30FC" : "\u30CE\u30FC\u30DE\u30EB" }, /* @__PURE__ */ React.createElement(MetricGrid, null, /* @__PURE__ */ React.createElement(Stat, { label: "\u73FE\u5728\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0", value: RatingDisplay.format(r.value), note: r.note }), /* @__PURE__ */ React.createElement(Stat, { label: "\u6B74\u4EE3\u6700\u9AD8\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0", value: real ? RatingDisplay.format(RatingHistory.highest(profile, stats, [d])) : "\u2015" })));
      })), /* @__PURE__ */ React.createElement(Panel, { title: "\u4FDD\u5B58\u6E08\u307F\u306E\u6210\u7E3E" }, /* @__PURE__ */ React.createElement(MetricGrid, null, [["maxStreak", "\u6700\u9AD8\u9023\u52DD"], ["perfects", "Perfect"], ["comebacks", "\u9006\u8EE2\u52DD\u3061"], ["tourWins", "\u5927\u4F1A\u512A\u52DD"], ["bestMs", "\u6700\u901F\u6B63\u89E3"], ["maxCombo", "\u6700\u5927\u30B3\u30F3\u30DC"]].map(([key, label]) => /* @__PURE__ */ React.createElement(Stat, { key, label, value: key === "bestMs" && data.metrics[key] !== null ? (data.metrics[key] / 1e3).toFixed(2) + "\u79D2" : integer(data.metrics[key]) }))), /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u5404\u7D2F\u7A4D\u5024\u306F\u65E2\u5B58\u306E\u4FDD\u5B58\u8A18\u9332\u3067\u3059\u3002\u4FDD\u5B58\u4E16\u4EE3\u306E\u7570\u306A\u308B\u5BFE\u6226\u6570\u3092\u8DB3\u3057\u5408\u308F\u305B\u307E\u305B\u3093\u3002")), /* @__PURE__ */ React.createElement(Panel, { title: "\u9031\u9593\u30DC\u30B9\u306E\u53C2\u52A0\u30FB\u8CA2\u732E" }, /* @__PURE__ */ React.createElement(MetricGrid, null, [["weeks", "\u53C2\u52A0\u9031\u6570"], ["kills", "\u8A0E\u4F10\u8CA2\u732E"], ["best", "\u904E\u53BB\u6700\u9AD8\u30C0\u30E1\u30FC\u30B8"], ["maxStreak", "\u6700\u9AD8\u9023\u7D9A\u53C2\u52A0\u9031"]].map(([key, label]) => /* @__PURE__ */ React.createElement(Stat, { key, label, value: integer(data.weekly[key]) })), /* @__PURE__ */ React.createElement(Stat, { label: "\u4ECA\u9031\u306E\u30C0\u30E1\u30FC\u30B8", value: integer(model.number(mine == null ? void 0 : mine.d)) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u4ECA\u9031\u306E\u51FA\u6483\u8A18\u9332", value: integer(model.number(mine == null ? void 0 : mine.s)), note: "\u5B8C\u8D70\u56DE\u6570\u3068\u306F\u5225\u306E\u8A18\u9332\u3067\u3059" })))), tab === "records" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u6226\u3068\u5F93\u6765\u306E\u8A18\u9332\u306F\u3001\u540C\u3058\u8A66\u5408\u3092\u542B\u3080\u53EF\u80FD\u6027\u304C\u3042\u308B\u305F\u3081\u5225\u3005\u306B\u8868\u793A\u3057\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { className: "next-profile-columns" }, ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(Record, { key: d, label: (d === "easy" ? "\u30A4\u30FC\u30B8\u30FC" : "\u30CE\u30FC\u30DE\u30EB") + "\u30FB\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u5BFE\u6226", value: data.rated[d] }))), /* @__PURE__ */ React.createElement(Record, { label: "\u5F93\u6765\u306E\u5BFE\u6226\u8A18\u9332\uFF08\u4FDD\u5B58\u6E08\u307F\u901A\u7B97\uFF09", value: data.legacy }), /* @__PURE__ */ React.createElement("div", { className: "next-profile-columns" }, ["A", "B", "C"].map((m) => /* @__PURE__ */ React.createElement(Record, { key: m, label: m + "\u65B9\u5F0F\uFF08\u5F93\u6765\u306E\u4FDD\u5B58\u8A18\u9332\uFF09", value: data.modes[m] }))), /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "B\u65B9\u5F0F\u306F\u5171\u6709\u3059\u308Bstats.B\u3092\u4E00\u5EA6\u3060\u3051\u8868\u793A\u3057\u3066\u3044\u307E\u3059\u3002\u6B20\u640D\u3057\u305F\u52DD\u6557\u306F0\u3068\u4EEE\u5B9A\u3057\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("div", { className: "next-profile-columns" }, ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(Record, { key: d, label: (d === "easy" ? "\u30A4\u30FC\u30B8\u30FC" : "\u30CE\u30FC\u30DE\u30EB") + "\u30FB\u30B4\u30FC\u30B9\u30C8\uFF0FBOT\u8A18\u9332", value: data.ghosts[d] }))), real && GhostHistory && /* @__PURE__ */ React.createElement(GhostHistory, { acct: { key: acct.key, name: acct.name }, stats: stats || {} })), tab === "rewards" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Panel, { title: "\u79F0\u53F7\u30FB\u5B9F\u7E3E" }, titleSaveFailed && /* @__PURE__ */ React.createElement("p", { role: "status", className: "next-note", "data-title-save-failed": true }, "\u65B0\u79F0\u53F7\u306E\u4FDD\u5B58\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u901A\u4FE1\u72B6\u614B\u3092\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002"), /* @__PURE__ */ React.createElement(TitleInventory, { presentationStore, accountKey: acct.key, muted, earnedIds: invIds, flags: invFlagsFF, equipped: shown, equip: equipUi, iconOf })), /* @__PURE__ */ React.createElement(Panel, { title: "\u304D\u305B\u304B\u3048\u88C5\u5099" }, /* @__PURE__ */ React.createElement(MetricGrid, null, [["tile", "\u30BF\u30A4\u30EB"], ["bg", "\u80CC\u666F"], ["fx", "\u30A8\u30D5\u30A7\u30AF\u30C8"]].map(([key, label]) => {
        const id = skin == null ? void 0 : skin[key], item = skinCatalog[key].find((x) => x.id === id);
        return /* @__PURE__ */ React.createElement(Stat, { key, label, value: id ? (item == null ? void 0 : item.name) || id : "\u672A\u8A18\u9332" });
      }))))), gv && GhostBattlePanel && /* @__PURE__ */ React.createElement(GhostBattlePanel, { acctKey: acct.key, onClose: () => setGv(false) }));
    };
  }

  // src/ranking-kit.jsx
  var ranking_kit_exports = {};
  __export(ranking_kit_exports, {
    ListState: () => ListState,
    RankList: () => RankList,
    RankRow: () => RankRow,
    RankingHead: () => RankingHead,
    Segmented: () => Segmented
  });
  function RankingHead({ title, note }) {
    return /* @__PURE__ */ React.createElement("header", { className: "rk-head" }, /* @__PURE__ */ React.createElement("h2", null, title), note && /* @__PURE__ */ React.createElement("p", null, note));
  }
  function Segmented({ label, items, value, onChange, className = "" }) {
    return /* @__PURE__ */ React.createElement("div", { className: "rk-seg " + className, role: "group", "aria-label": label }, items.map(([id, text]) => /* @__PURE__ */ React.createElement("button", { key: id, type: "button", "aria-pressed": value === id, onClick: () => onChange(id) }, text)));
  }
  function ListState({ status, message, detail, onRetry, retryLabel = "\u21BB \u66F4\u65B0" }) {
    if (status === "ok") return null;
    const text = message || (status === "loading" ? "\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026" : status === "error" ? "\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u901A\u4FE1\u74B0\u5883\u3092\u78BA\u8A8D\u3057\u3066\u3082\u3046\u4E00\u5EA6\u8A66\u3057\u3066\u306D\u3002" : "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093");
    return /* @__PURE__ */ React.createElement("div", { className: "rk-state rk-" + status, role: status === "error" ? "alert" : "status" }, /* @__PURE__ */ React.createElement("p", null, text), detail && /* @__PURE__ */ React.createElement("small", null, "(", detail, ")"), onRetry && status !== "loading" && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: onRetry }, retryLabel));
  }
  function RankRow({ rank, name, value, unit = "", sub, extra, self = false, onName }) {
    const top = rank >= 1 && rank <= 3;
    return /* @__PURE__ */ React.createElement("li", { className: "rk-row" + (self ? " rk-self" : "") + (top ? " rk-top rk-top" + rank : ""), "data-rank": rank, "aria-current": self ? "true" : void 0 }, /* @__PURE__ */ React.createElement("span", { className: "rk-no", "aria-label": rank + "\u4F4D" }, rank), /* @__PURE__ */ React.createElement("span", { className: "rk-main" }, onName ? /* @__PURE__ */ React.createElement("button", { type: "button", className: "rk-name", onClick: onName }, name) : /* @__PURE__ */ React.createElement("strong", { className: "rk-name" }, name), self && /* @__PURE__ */ React.createElement("em", { className: "rk-me" }, "\u3042\u306A\u305F"), extra && /* @__PURE__ */ React.createElement("span", { className: "rk-extra" }, extra), sub && /* @__PURE__ */ React.createElement("small", null, sub)), /* @__PURE__ */ React.createElement("span", { className: "rk-val" }, /* @__PURE__ */ React.createElement("b", null, value), unit && /* @__PURE__ */ React.createElement("i", null, unit)));
  }
  function RankList({ children, label }) {
    return /* @__PURE__ */ React.createElement("ol", { className: "rk-list", "aria-label": label }, children);
  }

  // src/solo-ranking-ui.jsx
  function SoloRanking({ gas, netStatus, netError, best, total, local, storageOk, onReload, diffs, defaultDiff, tab, onTab, selfName }) {
    const [diff, setDiff] = React.useState(defaultDiff || "normal");
    const tabs = [...gas ? [["best", "\u307F\u3093\u306A\u306E\u30D9\u30B9\u30C8"], ["total", "\u307F\u3093\u306A\u306E\u7DCF\u5F97\u70B9"]] : [], ["local", "\u3053\u306E\u7AEF\u672B TOP3"]];
    const cfg = diffs[diff] || {};
    const net = tab === "best" ? best : total;
    const rows = (net == null ? void 0 : net[diff]) || [];
    const status = tab === "local" ? "ok" : netStatus === "loading" || netStatus === "idle" ? "loading" : netStatus === "error" ? "error" : rows.length ? "ok" : "empty";
    const self = (name) => !!selfName && name === selfName;
    return /* @__PURE__ */ React.createElement("div", { className: "rk-solo", "data-ranking": "solo" }, /* @__PURE__ */ React.createElement(RankingHead, { title: "\u30BD\u30ED\u30E9\u30F3\u30AD\u30F3\u30B0", note: tab === "best" ? "\u307F\u3093\u306A\u306E\u30E9\u30F3\u30AD\u30F3\u30B0\uFF08\u5168\u671F\u9593\uFF09" : tab === "total" ? "\u3053\u308C\u307E\u3067\u306E\u5168\u30D7\u30EC\u30A4\u306E\u5408\u8A08\u70B9\u6570\u30E9\u30F3\u30AD\u30F3\u30B0\uFF08\u30D7\u30EC\u30A4\u56DE\u6570\u30FB\u5E73\u5747\u70B9\u3064\u304D\uFF09" : "\u3053\u306E\u7AEF\u672B\u306E\u8A18\u9332" }), /* @__PURE__ */ React.createElement(Segmented, { label: "\u30E9\u30F3\u30AD\u30F3\u30B0\u306E\u7A2E\u985E", items: tabs, value: tab, onChange: onTab }), tab !== "local" && /* @__PURE__ */ React.createElement("div", { className: "rk-bar" }, /* @__PURE__ */ React.createElement(Segmented, { label: "\u96E3\u6613\u5EA6", items: Object.entries(diffs).map(([id, c]) => [id, c.label]), value: diff, onChange: setDiff }), /* @__PURE__ */ React.createElement("button", { type: "button", className: "rk-reload", onClick: onReload }, "\u21BB \u66F4\u65B0")), tab !== "local" && /* @__PURE__ */ React.createElement(ListState, { status, detail: netError, message: status === "empty" ? tab === "best" ? "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u5168\u56FD1\u4F4D\u3092\u76EE\u6307\u305D\u3046\uFF01" : "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u30D7\u30EC\u30A4\u3057\u3066\u6700\u521D\u306E1\u4F4D\u3092\u76EE\u6307\u305D\u3046\uFF01" : status === "error" ? "\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u901A\u4FE1\u74B0\u5883\u3092\u78BA\u8A8D\u3057\u3066\u300C\u21BB \u66F4\u65B0\u300D\u3092\u62BC\u3057\u3066\u306D\u3002" : void 0 }), tab === "best" && status === "ok" && /* @__PURE__ */ React.createElement(RankList, { label: cfg.label + " TOP20" }, rows.map((r, i) => /* @__PURE__ */ React.createElement(RankRow, { key: i, rank: r.rank, name: r.name, value: r.score, unit: "\u70B9", sub: r.caught + "\u7D44", self: self(r.name) }))), tab === "total" && status === "ok" && /* @__PURE__ */ React.createElement(RankList, { label: cfg.label + " \u7DCF\u5408TOP20" }, rows.map((r, i) => /* @__PURE__ */ React.createElement(RankRow, { key: i, rank: r.rank, name: r.name, value: r.totalScore, unit: "\u70B9", sub: r.playCount + "\u56DE\u30D7\u30EC\u30A4\u30FB\u5E73\u5747" + r.avgScore + "\u70B9\u30FB\u8A08" + r.totalCaught + "\u7D44", self: self(r.name) }))), tab !== "local" && status === "ok" && /* @__PURE__ */ React.createElement("p", { className: "rk-foot" }, cfg.label, " TOP20"), tab === "local" && /* @__PURE__ */ React.createElement(React.Fragment, null, !storageOk && /* @__PURE__ */ React.createElement("p", { className: "rk-warn" }, "\u26A0\uFE0F \u3053\u306E\u74B0\u5883\u3067\u306F\u30E9\u30F3\u30AD\u30F3\u30B0\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\uFF08\u30D6\u30E9\u30A6\u30B6\u306E\u8A2D\u5B9A\u3067\u30B5\u30A4\u30C8\u30C7\u30FC\u30BF\u306E\u4FDD\u5B58\u304C\u30D6\u30ED\u30C3\u30AF\u3055\u308C\u3066\u3044\u307E\u3059\uFF09"), local.length === 0 ? /* @__PURE__ */ React.createElement(ListState, { status: "empty", message: "\u307E\u3060\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u6700\u521D\u306E1\u4F4D\u3092\u76EE\u6307\u305D\u3046\uFF01" }) : /* @__PURE__ */ React.createElement(RankList, { label: "\u3053\u306E\u7AEF\u672B TOP3" }, local.map((r, i) => {
      var _a;
      return /* @__PURE__ */ React.createElement(RankRow, { key: i, rank: r.rank, name: r.name, value: r.score, unit: "\u70B9", sub: (((_a = diffs[r.difficulty]) == null ? void 0 : _a.label) || "") + "\u30FB" + r.caught + "\u7D44", self: self(r.name) });
    }))));
  }

  // src/next-home-ui.jsx
  var navigation = require_next_navigation();
  window.NextNavigation = navigation;
  window.TitleLabelsNext = require_title_labels_next();
  window.TitleDisplayNext = require_title_display_next();
  window.TitleKeepNext = require_title_keep_next();
  window.StreakNext = require_streak_next();
  window.StatsOrderNext = require_stats_order_next();
  window.MatchLogNext = require_match_log_next();
  window.TitleInventoryUI = (init_title_inventory_ui(), __toCommonJS(title_inventory_ui_exports));
  window.NextRanking = { ...ranking_kit_exports, SoloRanking };
  var icons2 = require_next_home_icons();
  window.NextHomeFactory = (H) => {
    const { useState, useEffect, useRef } = React;
    const { FB, useFbReady, weekKey, now, weeklyInfo, bossForm, suriImg, useRatingHistoryProfile, RatingDisplay, levelOf, isReal, loadGuest, nickOf, Wardrobe, useFbValue, useGameMute, LoginBonus, syncSkin } = H;
    const Profile = createProfile(H);
    const Icon2 = ({ name }) => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: icons2[name] || icons2.home }));
    function useBoss(enabled) {
      const fb = useFbReady(), [tick, setTick] = useState(0), [retry, setRetry] = useState(0), [data, setData] = useState(null);
      useEffect(() => {
        if (!enabled) return;
        const t = setInterval(() => setTick((x) => x + 1), 1e3);
        return () => clearInterval(t);
      }, [enabled]);
      const wk = weekKey(now());
      useEffect(() => {
        var _a;
        if (!fb.ready || !enabled) return;
        let active = true;
        const vals = {}, done = /* @__PURE__ */ new Set(), subs = [];
        setData({ wk, status: "loading" });
        if ((_a = window.NextAuthority) == null ? void 0 : _a.enabled(FB.db, window.location)) {
          const r = FB.db.ref(`games/factor/nextAuthorityV1/weekly/${wk}/public`), f = (s) => {
            if (active) {
              const v = s.val();
              setData((v == null ? void 0 : v.enabled) ? { wk, status: "authority", authority: v } : { wk, status: "preparing" });
            }
          };
          r.on("value", f, (e) => {
            if (active) setData({ wk, status: "error" });
          });
          return () => {
            active = false;
            r.off("value", f);
          };
        }
        for (const key of ["meta", "dmg"]) {
          const ref = FB.db.ref(`games/factor/raidw/${wk}/${key}`);
          const f = (s) => {
            if (!active) return;
            vals[key] = s.val();
            done.add(key);
            if (done.size === 2) setData({ wk, status: vals.meta ? "ready" : "preparing", ...vals });
          };
          ref.on("value", f, (e) => {
            if (active) {
              active = false;
              setData({ wk, status: (e == null ? void 0 : e.code) === "PERMISSION_DENIED" ? "denied" : "error" });
            }
          });
          subs.push([ref, f]);
        }
        return () => {
          active = false;
          subs.forEach(([r, f]) => r.off("value", f));
        };
      }, [fb.ready, wk, retry, enabled]);
      if (fb.err) return { status: "error", retry: () => setRetry((x) => x + 1) };
      if (!fb.ready || (data == null ? void 0 : data.wk) !== wk) return { status: "loading" };
      if (data.status === "authority") {
        const v = data.authority, base = weeklyInfo(wk, {}, v.meta, {}), info2 = { ...base, hp: v.hp, hpMax: v.hpMax, dead: !!v.kill, revived: !!v.revived };
        return { status: "ready", info: info2, boss: bossForm(info2.boss, info2.revived) };
      }
      if (data.status !== "ready") return { ...data, retry: () => setRetry((x) => x + 1) };
      const info = weeklyInfo(wk, data.dmg, data.meta);
      if (!Number.isFinite(info.hp) || !Number.isFinite(info.hpMax) || info.hpMax <= 0) return { status: "error", retry: () => setRetry((x) => x + 1) };
      return { status: "ready", info, boss: bossForm(info.boss, info.revived) };
    }
    function Home({ acct, onGo, onLogout, page = "home", children }) {
      var _a, _b, _c, _d, _e;
      const boss = useBoss(page === "home"), fb = useFbReady(), st = useFbValue(fb.ready && isReal(acct) ? `accounts/${acct.key}/stats` : null);
      const profile = useRatingHistoryProfile(isReal(acct) ? acct.key : null), L = levelOf(((_a = isReal(acct) ? st : loadGuest()) == null ? void 0 : _a.exp) || 0);
      const titleValid = (id) => {
        var _a2;
        return !!(nickOf(id) || ((_a2 = window.TitleLabelsNext) == null ? void 0 : _a2.of(id)));
      }, D = window.TitleDisplayNext, shownTitle = D ? D.shownId(D.resolve({ nick: st == null ? void 0 : st.nick, title: profile == null ? void 0 : profile.title }, { valid: titleValid })) : (st == null ? void 0 : st.nick) || null, homeTitle = shownTitle ? (_b = window.TitleLabelsNext ? window.TitleLabelsNext.resolve(shownTitle, nickOf(shownTitle)) : nickOf(shownTitle)) == null ? void 0 : _b.label : null;
      const [panel, setPanel] = useState(null), dialog = useRef(null), [muted, setMuted] = useGameMute(), skinAccount = useRef(null);
      useEffect(() => {
        if ((st == null ? void 0 : st.skin) && isReal(acct) && skinAccount.current !== acct.key) {
          skinAccount.current = acct.key;
          syncSkin(st.skin);
        }
      }, [st, acct.key]);
      useEffect(() => {
        var _a2, _b2;
        if (panel === "menu" || panel === "settings") (_a2 = dialog.current) == null ? void 0 : _a2.showModal();
        else (_b2 = dialog.current) == null ? void 0 : _b2.close();
      }, [panel]);
      const go = (key) => {
        setPanel(null);
        onGo(key);
      };
      const nav = [["home", "\u30DB\u30FC\u30E0"], ["account", "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB"], ["online", "\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226"], ["solo", "\u30BD\u30ED\u30E2\u30FC\u30C9"], ["daily", "\u30C7\u30A4\u30EA\u30FC\u30DF\u30C3\u30B7\u30E7\u30F3"], ["rank", "\u30E9\u30F3\u30AD\u30F3\u30B0"], ["help", "\u3042\u305D\u3073\u304B\u305F"]];
      const navButton = (key, label) => /* @__PURE__ */ React.createElement("button", { key, className: "nav-item " + (key === navigation.active(page) ? "selected" : ""), "aria-current": key === navigation.active(page) ? "page" : void 0, onClick: () => go(key === "account" ? "profile" : key) }, /* @__PURE__ */ React.createElement(Icon2, { name: key }), /* @__PURE__ */ React.createElement("span", null, label), /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }));
      const ver = window.FactorVersion && window.FactorVersion.number ? "Ver." + window.FactorVersion.number : "";
      const brand = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("img", { src: "ui-next/logo-official.png", alt: "FACTOR \xD7 FACTOR", width: "1774", height: "887" }), ver && /* @__PURE__ */ React.createElement("span", { className: "brand-ver", "data-home-version": true }, ver));
      const hp = boss.info ? Math.max(0, boss.info.hp) : null, max = (_c = boss.info) == null ? void 0 : _c.hpMax, pct = max ? Math.min(100, hp / max * 100) : 0;
      const statusText = { loading: "HP\u60C5\u5831\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026", preparing: "\u6B21\u306E\u30DC\u30B9\u3092\u6E96\u5099\u4E2D", error: "HP\u60C5\u5831\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093", denied: "HP\u60C5\u5831\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\uFF08\u6A29\u9650\u4E0D\u8DB3\uFF09" }[boss.status];
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("link", { rel: "stylesheet", href: "ui-next/home.css" }), /* @__PURE__ */ React.createElement("link", { rel: "stylesheet", href: "ui-next/ranking.css" }), /* @__PURE__ */ React.createElement("div", { className: "next-home", "data-next-home": true }, acct && page === "home" && /* @__PURE__ */ React.createElement(LoginBonus, { acct }), /* @__PURE__ */ React.createElement(Frame, { sidebar: /* @__PURE__ */ React.createElement("aside", { className: "sidebar" }, /* @__PURE__ */ React.createElement("button", { className: "brand-slot", onClick: () => go("home"), "aria-label": "\u30DB\u30FC\u30E0\u3078" }, brand), /* @__PURE__ */ React.createElement("div", { className: "side-divider" }), /* @__PURE__ */ React.createElement("nav", { "aria-label": "PC\u30E1\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC" }, nav.map(([k, n]) => navButton(k, n))), /* @__PURE__ */ React.createElement("div", { className: "sidebar-account" }, /* @__PURE__ */ React.createElement(Icon2, { name: "account" }), /* @__PURE__ */ React.createElement("button", { onClick: () => go("profile") }, acct.name, /* @__PURE__ */ React.createElement("small", null, "Lv.", L.lv)))), mobileHeader: /* @__PURE__ */ React.createElement("header", { className: "mobile-top" }, /* @__PURE__ */ React.createElement("button", { className: "mobile-brand", onClick: () => go("home"), "aria-label": "\u30DB\u30FC\u30E0\u3078" }, brand), /* @__PURE__ */ React.createElement("div", { className: "header-tools" }, /* @__PURE__ */ React.createElement("button", { "aria-label": muted ? "\u97F3\u58F0\u3092\u30AA\u30F3" : "\u97F3\u58F0\u3092\u30AA\u30D5", "aria-pressed": !muted, title: muted ? "\u97F3\u58F0\u30AA\u30D5\uFF08\u62BC\u3059\u3068\u30AA\u30F3\uFF09" : "\u97F3\u58F0\u30AA\u30F3\uFF08\u62BC\u3059\u3068\u30AA\u30D5\uFF09", "data-sound-toggle": muted ? "off" : "on", onClick: () => {
        setMuted(!muted);
        setTimeout(() => {
          try {
            H.uiSnd && H.uiSnd("ok");
          } catch (e) {
          }
        }, 0);
      } }, /* @__PURE__ */ React.createElement(Icon2, { name: muted ? "soundOff" : "sound" })), /* @__PURE__ */ React.createElement("button", { "aria-label": "\u8A2D\u5B9A", onClick: () => setPanel("settings") }, /* @__PURE__ */ React.createElement(Icon2, { name: "settings" })))), hideTitle: page === "home" || page === "battle" || !["profile", "solo", "daily", "help"].includes(page), title: page === "home" ? "\u30DB\u30FC\u30E0" : page === "profile" ? "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u30FB\u6210\u7E3E" : { battle: "\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226", solo: "\u30BD\u30ED\u30E2\u30FC\u30C9", daily: "\u30C7\u30A4\u30EA\u30FC\u30DF\u30C3\u30B7\u30E7\u30F3", help: "\u3042\u305D\u3073\u304B\u305F" }[page] || "\u30E9\u30F3\u30AD\u30F3\u30B0", actions: /* @__PURE__ */ React.createElement("button", { className: "pc-settings", onClick: () => setPanel("settings"), "aria-label": "\u8A2D\u5B9A" }, /* @__PURE__ */ React.createElement(Icon2, { name: "settings" })), bottomNav: /* @__PURE__ */ React.createElement("nav", { className: "bottom-nav", "aria-label": "\u30B9\u30DE\u30DB\u30E1\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC" }, [["home", "\u30DB\u30FC\u30E0"], ["online", "\u5BFE\u6226"], ["solo", "\u30BD\u30ED"], ["rank", "\u9806\u4F4D"]].map(([k, n]) => navButton(k, n)), /* @__PURE__ */ React.createElement("button", { className: "nav-item " + (page === "profile" ? "selected" : ""), "aria-current": page === "profile" ? "page" : void 0, "aria-label": "\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F", "aria-expanded": panel === "menu", onClick: () => setPanel("menu") }, /* @__PURE__ */ React.createElement(Icon2, { name: "more" }), /* @__PURE__ */ React.createElement("span", null, "\u30E1\u30CB\u30E5\u30FC"))) }, page === "home" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "   ", /* @__PURE__ */ React.createElement("div", { className: "account-row" }, /* @__PURE__ */ React.createElement("button", { className: "account-main", onClick: () => go("profile") }, /* @__PURE__ */ React.createElement("span", { className: "avatar" }, /* @__PURE__ */ React.createElement(Icon2, { name: "account" })), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("small", null, homeTitle || "\u88C5\u5099\u4E2D\u306E\u79F0\u53F7\u306A\u3057"), /* @__PURE__ */ React.createElement("strong", null, acct.name), /* @__PURE__ */ React.createElement("span", { className: "level" }, "Lv. ", /* @__PURE__ */ React.createElement("b", null, L.lv), /* @__PURE__ */ React.createElement("span", { className: "xp" }, /* @__PURE__ */ React.createElement("i", { style: { width: `${L.cur / L.need * 100}%` } }))))), /* @__PURE__ */ React.createElement("div", { className: "ratings" }, ["easy", "normal"].map((d) => {
        const r = RatingDisplay.current(profile, st, d);
        return /* @__PURE__ */ React.createElement("div", { key: d }, /* @__PURE__ */ React.createElement("small", null, d === "easy" ? "\u30A4\u30FC\u30B8\u30FC" : "\u30CE\u30FC\u30DE\u30EB"), /* @__PURE__ */ React.createElement("strong", null, isReal(acct) ? RatingDisplay.format(r.value) : "\u2015"));
      })), /* @__PURE__ */ React.createElement("button", { className: "account-link", onClick: () => go("profile") }, "\u6210\u7E3E\u78BA\u8A8D ", /* @__PURE__ */ React.createElement(Icon2, { name: "chevron" }))), /* @__PURE__ */ React.createElement("main", null, /* @__PURE__ */ React.createElement("div", { className: "home-content" }, /* @__PURE__ */ React.createElement("div", { className: "home-actions" }, [["online", "\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226", ["\u3059\u3050\u904A\u3076\u30FB\u30EB\u30FC\u30E0", "\u30B4\u30FC\u30B9\u30C8\u30FB\u30EC\u30A4\u30C9"], "\u5BFE\u6226\u30ED\u30D3\u30FC\u3078"], ["solo", "\u30BD\u30ED\u30E2\u30FC\u30C9", ["\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB", "\u30CF\u30FC\u30C9"], "\u96E3\u6613\u5EA6\u3092\u9078\u3076"]].map(([k, n, desc, foot]) => /* @__PURE__ */ React.createElement("button", { key: k, className: "action-card " + k, "aria-label": k === "online" ? "\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226\u30FBCPU\u7DF4\u7FD2" : void 0, onClick: () => go(k) }, /* @__PURE__ */ React.createElement("span", { className: "action-icon" }, /* @__PURE__ */ React.createElement(Icon2, { name: k })), /* @__PURE__ */ React.createElement("span", { className: "surface-lines" }), /* @__PURE__ */ React.createElement("span", { className: "action-text" }, /* @__PURE__ */ React.createElement("strong", null, n), /* @__PURE__ */ React.createElement("small", null, desc.map((t) => /* @__PURE__ */ React.createElement("span", { key: t }, t)))), /* @__PURE__ */ React.createElement("span", { className: "action-foot" }, foot, /* @__PURE__ */ React.createElement(Icon2, { name: "chevron" }))))), /* @__PURE__ */ React.createElement("section", { className: "boss-stage", "aria-label": "\u4ECA\u9031\u306E\u30DC\u30B9" }, /* @__PURE__ */ React.createElement("div", { className: "boss-label" }, /* @__PURE__ */ React.createElement("span", { className: "status-dot" }), "\u4ECA\u9031\u306E\u30DC\u30B9"), /* @__PURE__ */ React.createElement("div", { className: "boss-art" }, /* @__PURE__ */ React.createElement("div", { className: "boss-orbit" }), boss.boss && /* @__PURE__ */ React.createElement("img", { key: boss.boss.id, src: suriImg(boss.boss.id), alt: boss.boss.name, width: "512", height: "512", onError: (e) => {
        e.currentTarget.hidden = true;
      } })), /* @__PURE__ */ React.createElement("div", { className: "boss-hp", "aria-live": "polite" }, statusText ? /* @__PURE__ */ React.createElement("p", { role: ["error", "denied"].includes(boss.status) ? "alert" : "status" }, statusText, boss.retry && ["error", "denied"].includes(boss.status) && /* @__PURE__ */ React.createElement("button", { onClick: boss.retry }, "\u518D\u8A66\u884C")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "hp-numbers" }, /* @__PURE__ */ React.createElement("span", null, "HP ", /* @__PURE__ */ React.createElement("b", null, hp.toLocaleString("ja-JP")), " / ", max.toLocaleString("ja-JP")), /* @__PURE__ */ React.createElement("strong", null, boss.info.dead ? "\u8A0E\u4F10\u6E08\u307F" : `${pct.toFixed(1)}%`)), /* @__PURE__ */ React.createElement("div", { className: "hp-track", role: "progressbar", "aria-label": "\u4ECA\u9031\u306E\u30DC\u30B9\u306E\u6B8B\u308AHP", "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": hp }, /* @__PURE__ */ React.createElement("i", { style: { width: `${pct}%` } })))), /* @__PURE__ */ React.createElement("div", { className: "boss-details" }, /* @__PURE__ */ React.createElement("h2", null, ((_d = boss.boss) == null ? void 0 : _d.name) || "\u4ECA\u9031\u306E\u30DC\u30B9"), /* @__PURE__ */ React.createElement("button", { className: "small-button", "aria-label": "\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u6311\u3080", onClick: () => go("boss") }, "\u30DC\u30B9\u306B\u6311\u3080 ", /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u2192"))))), /* @__PURE__ */ React.createElement("div", { className: "home-support" }, /* @__PURE__ */ React.createElement("button", { className: "mission-strip", onClick: () => go("daily") }, /* @__PURE__ */ React.createElement(Icon2, { name: "daily" }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, "\u30C7\u30A4\u30EA\u30FC\u30DF\u30C3\u30B7\u30E7\u30F3"), /* @__PURE__ */ React.createElement("small", null, "\u4ECA\u65E5\u306E\u30DF\u30C3\u30B7\u30E7\u30F3\u30FB\u30C7\u30A4\u30EA\u30FC\u30C1\u30E3\u30EC\u30F3\u30B8")), /* @__PURE__ */ React.createElement(Icon2, { name: "chevron" })), [["rank", "\u30E9\u30F3\u30AD\u30F3\u30B0"], ["help", "\u3042\u305D\u3073\u304B\u305F"]].map(([k, n]) => /* @__PURE__ */ React.createElement("button", { className: "support-link", key: k, onClick: () => go(k) }, /* @__PURE__ */ React.createElement(Icon2, { name: k }), /* @__PURE__ */ React.createElement("strong", null, n), /* @__PURE__ */ React.createElement(Icon2, { name: "chevron" })))))) : page === "profile" ? /* @__PURE__ */ React.createElement(Profile, { acct, stats: isReal(acct) ? st : loadGuest(), profile, onBack: () => go("back"), onWardrobe: () => setPanel("wardrobe") }) : ["battle", "solo", "daily", "help"].includes(page) ? /* @__PURE__ */ React.createElement("div", { className: "next-route-content" }, children) : /* @__PURE__ */ React.createElement("main", { className: "ranking-content", "data-hub": page === "rankings" ? "" : void 0 }, page !== "rankings" && /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick: () => go("rank") }, "\u30E9\u30F3\u30AD\u30F3\u30B0\u7DCF\u5408\u3078\u623B\u308B"), page === "rankings" ? /* @__PURE__ */ React.createElement("div", { className: "ranking-grid" }, [["solo", "\u30BD\u30ED\u30E9\u30F3\u30AD\u30F3\u30B0", "\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB\u30FB\u30CF\u30FC\u30C9", "solo"], ["daily", "\u30C7\u30A4\u30EA\u30FC\u30E9\u30F3\u30AD\u30F3\u30B0", "\u4ECA\u65E5\u30FB\u6628\u65E5\u306E\u90E8\u9580\u5225\u30E9\u30F3\u30AD\u30F3\u30B0", "daily"], ["rating", "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30E9\u30F3\u30AD\u30F3\u30B0", "\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB", "online"]].map(([k, label, note, icon]) => /* @__PURE__ */ React.createElement("button", { key: k, className: "ranking-entry", onClick: () => go("ranking-" + k) }, /* @__PURE__ */ React.createElement("span", { className: "ranking-icon" }, /* @__PURE__ */ React.createElement(Icon2, { name: icon })), /* @__PURE__ */ React.createElement("strong", null, label), /* @__PURE__ */ React.createElement("small", null, note), /* @__PURE__ */ React.createElement(Icon2, { name: "chevron" })))) : /* @__PURE__ */ React.createElement("section", { className: "ranking-view", "aria-label": "\u30E9\u30F3\u30AD\u30F3\u30B0\u8868\u793A" }, children))), /* @__PURE__ */ React.createElement("dialog", { ref: dialog, className: "home-menu", "aria-label": panel === "settings" ? "\u8A2D\u5B9A" : "\u30E1\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC", onCancel: () => setPanel(null) }, /* @__PURE__ */ React.createElement("div", { className: "sheet-title" }, /* @__PURE__ */ React.createElement("h2", null, panel === "settings" ? "\u8A2D\u5B9A" : "\u30E1\u30CB\u30E5\u30FC"), /* @__PURE__ */ React.createElement("button", { onClick: () => setPanel(null), "aria-label": "\u9589\u3058\u308B" }, "\xD7")), panel === "settings" ? /* @__PURE__ */ React.createElement("nav", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setMuted(!muted) }, "\u97F3\u58F0\uFF1A", muted ? "\u30AA\u30D5" : "\u30AA\u30F3"), /* @__PURE__ */ React.createElement("button", { onClick: () => setPanel("wardrobe") }, "\u304D\u305B\u304B\u3048"), /* @__PURE__ */ React.createElement("button", { onClick: onLogout }, isReal(acct) ? "\u30ED\u30B0\u30A2\u30A6\u30C8" : "\u767B\u9332\u30FB\u30ED\u30B0\u30A4\u30F3")) : /* @__PURE__ */ React.createElement("nav", null, nav.map(([k, n]) => navButton(k, n)), /* @__PURE__ */ React.createElement("button", { className: "nav-item", onClick: () => go("learn") }, "\u5B66\u3073\u306E\u90E8\u5C4B")))), panel === "wardrobe" && /* @__PURE__ */ React.createElement(Wardrobe, { appearance: "next", acct, st: st || loadGuest(), exp: ((_e = isReal(acct) ? st : loadGuest()) == null ? void 0 : _e.exp) || 0, onClose: () => setPanel(null) }));
    }
    Home.Lobby = createLobby(H);
    return Home;
  };
})();
