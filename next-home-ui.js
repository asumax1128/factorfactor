(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

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
          metrics: Object.fromEntries(["maxStreak", "perfects", "comebacks", "tourWins", "bestMs", "maxCombo"].map((k) => [k, number(st[k])])),
          weekly: Object.fromEntries(["weeks", "kills", "best", "maxStreak"].map((k) => [k, number(wk[k])]))
        };
      }
      module.exports = { number, record, read };
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
            condition: "\u51686\u7A2E\u985E\u306E\u30DC\u30B9\u8A0E\u4F10\u306B\u53C2\u52A0",
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

  // src/next-home-icons.json
  var require_next_home_icons = __commonJS({
    "src/next-home-icons.json"(exports, module) {
      module.exports = { home: "m3 10 9-7 9 7v11h-6v-7H9v7H3Z", online: "m4 3 6 6-3 3-6-6M20 3l-6 6 3 3 6-6M8 13l-5 8M16 13l5 8M3 17l4 3M17 20l4-3M9 10l6 6M15 10l-6 6", solo: "M5 3h11l4 4v14H5ZM8 9h8M8 13h3M14 13h2M8 17h3M14 17h2", daily: "M4 5h16v16H4ZM8 2v6M16 2v6M4 10h16m-12 5 3 3 5-5", rank: "M8 3h8v5c0 4-2 6-4 6s-4-2-4-6ZM8 5H3v2c0 3 2 4 5 4M16 5h5v2c0 3-2 4-5 4M12 14v5M7 21h10", help: "M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4M12 18h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20", account: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0", chevron: "m9 5 7 7-7 7", sound: "M4 10h4l5-5v14l-5-5H4ZM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14", settings: "m9 3-1 3-3 1-2 4 2 2v3l3 2 3-1 3 2 4-2v-3l3-2-1-4-3-1-1-3ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6", more: "M4 6h16M4 12h16M4 18h16", room: "M3 4h18v16H3ZM8 4v16M11 9h6M11 13h6", cpu: "M5 5h14v14H5ZM8 8h8v8H8ZM8 2v3M12 2v3M16 2v3M8 19v3M12 19v3M16 19v3M2 8h3M2 12h3M2 16h3M19 8h3M19 12h3M19 16h3", ghost: "M5 21V10a7 7 0 0 1 14 0v11l-4-3-3 3-3-3ZM9 10v2M15 10v2", raid: "m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6ZM8 12h8M12 8v8", record: "M4 3h16v18H4ZM8 7h8M8 12h2M13 12h3M8 17h2M13 17h3", people: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 5 5", bounty: "M4 3h16v18l-3-1-2 1-3-1-3 1-3-1-2 1ZM12 7l1 3h3l-2 2 1 3-3-2-3 2 1-3-2-2h3Z" };
    }
  });

  // src/next-ui.jsx
  function Frame({ sidebar, mobileHeader, title, actions, children, bottomNav }) {
    const heading = React.useRef(null);
    React.useEffect(() => {
      var _a;
      (_a = heading.current) == null ? void 0 : _a.focus({ preventScroll: true });
    }, [title]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "app-shell" }, sidebar, /* @__PURE__ */ React.createElement("div", { className: "page-shell" }, mobileHeader, /* @__PURE__ */ React.createElement("header", { className: "page-header" }, /* @__PURE__ */ React.createElement("h1", { ref: heading, tabIndex: -1 }, title), actions), children, /* @__PURE__ */ React.createElement("footer", { className: "page-footer" }, /* @__PURE__ */ React.createElement("span", null, "FACTOR \xD7 FACTOR"), /* @__PURE__ */ React.createElement("span", null, "\u5148\u751F\u5C02\u7528\u6A5F\u80FD\u306F\u6A29\u9650\u78BA\u8A8D\u5F8C\u306B\u8868\u793A")))), bottomNav);
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

  // src/next-profile-ui.jsx
  var model = require_profile_read();
  var titles = require_title_catalog_next();
  function createProfile(H) {
    const { RatingDisplay, RatingHistory, levelOf, isReal, useDailyTitles, useFbValue, useFbReady, weekKey, now, nickOf, badgesOf, activeAchievements, skinCatalog } = H;
    const integer = (n) => n === null || n === void 0 ? "\u672A\u8A18\u9332" : n.toLocaleString("ja-JP");
    function Record({ label, value }) {
      return /* @__PURE__ */ React.createElement(Panel, { title: label }, /* @__PURE__ */ React.createElement(MetricGrid, null, /* @__PURE__ */ React.createElement(Stat, { label: "\u5BFE\u6226\u6570", value: integer(value.games) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u52DD\u5229", value: integer(value.w) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u6557\u5317", value: integer(value.l) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u5F15\u304D\u5206\u3051", value: integer(value.d) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u52DD\u7387", value: value.winRate === null ? "\u672A\u8A18\u9332" : value.winRate.toFixed(1) + "%" })));
    }
    return function Profile({ acct, stats, profile, onBack, onLegacy, onWardrobe }) {
      var _a, _b;
      const fb = useFbReady(), real = isReal(acct), daily = useDailyTitles(real ? acct.key : null);
      const mine = useFbValue(fb.ready && real ? `raidw/${weekKey(now())}/dmg/${acct.key}` : null);
      const data = model.read(stats, profile), L = data.exp === null ? null : levelOf(data.exp);
      const [tab, setTab] = React.useState("summary");
      const earned = /* @__PURE__ */ new Map();
      const visible = new Set(activeAchievements().map((b) => b.id));
      for (const b of badgesOf(stats || {})) if (visible.has(b.id)) earned.set(b.id, b.label);
      for (const flags of [profile == null ? void 0 : profile.badges, daily]) for (const [id, value] of Object.entries(flags || {})) if (value === true) earned.set(id, ((_a = titles.titles.find((t) => t.id === id)) == null ? void 0 : _a.name) || ((_b = nickOf(id)) == null ? void 0 : _b.label) || id);
      for (const [id] of earned) {
        const t = titles.titles.find((t2) => t2.id === id);
        if (t) earned.set(id, t.name);
      }
      const equipped = [stats == null ? void 0 : stats.nick, profile == null ? void 0 : profile.title].filter(Boolean).map((id) => {
        var _a2, _b2;
        return { id, name: ((_a2 = titles.titles.find((t) => t.id === id)) == null ? void 0 : _a2.name) || ((_b2 = nickOf(id)) == null ? void 0 : _b2.label) || id };
      });
      const skin = stats == null ? void 0 : stats.skin;
      return /* @__PURE__ */ React.createElement("main", { className: "next-profile", "data-next-profile": true }, /* @__PURE__ */ React.createElement("div", { className: "next-toolbar" }, /* @__PURE__ */ React.createElement(BackButton, { onClick: onBack }), /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick: onWardrobe }, "\u304D\u305B\u304B\u3048"), /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick: onLegacy }, "\u79F0\u53F7\u306E\u88C5\u5099\u30FB\u8A73\u7D30\u8A18\u9332")), !real && /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u30B2\u30B9\u30C8\u306E\u7D4C\u9A13\u5024\u30FB\u88C5\u5099\u306F\u3053\u306E\u7AEF\u672B\u306E\u8A18\u9332\u3067\u3059\u3002\u30AA\u30F3\u30E9\u30A4\u30F3\u6226\u7E3E\u306F\u8A18\u9332\u3055\u308C\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement(Panel, { title: acct.name, aside: /* @__PURE__ */ React.createElement("span", { className: "next-level" }, L ? `Lv.${L.lv}` : "\u30EC\u30D9\u30EB\u672A\u8A18\u9332") }, /* @__PURE__ */ React.createElement("div", { className: "next-equipped" }, "\u88C5\u5099\u4E2D\u79F0\u53F7\uFF1A", equipped.length ? equipped.map((x) => /* @__PURE__ */ React.createElement("span", { key: x.id }, x.name)) : "\u672A\u8A2D\u5B9A"), /* @__PURE__ */ React.createElement(MetricGrid, null, /* @__PURE__ */ React.createElement(Stat, { label: "\u7D2F\u7A4DEXP", value: integer(data.exp) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u6B21\u306E\u30EC\u30D9\u30EB", value: L ? `${L.cur} / ${L.need} EXP` : "\u672A\u8A18\u9332" }), /* @__PURE__ */ React.createElement(Stat, { label: "\u6B74\u4EE3\u6700\u9AD8\u30EC\u30FC\u30C8", value: real ? RatingDisplay.format(RatingHistory.highest(profile, stats)) : "\u2015", "data-highest-rating": true }))), /* @__PURE__ */ React.createElement("div", { className: "next-profile-tabs", role: "tablist", "aria-label": "\u6210\u7E3E\u306E\u7A2E\u985E" }, [["summary", "\u6982\u8981"], ["records", "\u5BFE\u6226\u8A18\u9332"], ["rewards", "\u79F0\u53F7\u30FB\u88C5\u5099"]].map(([id, label]) => /* @__PURE__ */ React.createElement("button", { key: id, role: "tab", "aria-selected": tab === id, "aria-controls": "profile-" + id, id: "profile-tab-" + id, onClick: () => setTab(id), onKeyDown: (e) => {
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
      })), /* @__PURE__ */ React.createElement(Panel, { title: "\u4FDD\u5B58\u6E08\u307F\u306E\u6210\u7E3E" }, /* @__PURE__ */ React.createElement(MetricGrid, null, [["maxStreak", "\u6700\u9AD8\u9023\u52DD"], ["perfects", "Perfect"], ["comebacks", "\u9006\u8EE2\u52DD\u3061"], ["tourWins", "\u5927\u4F1A\u512A\u52DD"], ["bestMs", "\u6700\u901F\u6B63\u89E3"], ["maxCombo", "\u6700\u5927\u30B3\u30F3\u30DC"]].map(([key, label]) => /* @__PURE__ */ React.createElement(Stat, { key, label, value: key === "bestMs" && data.metrics[key] !== null ? (data.metrics[key] / 1e3).toFixed(2) + "\u79D2" : integer(data.metrics[key]) }))), /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u5404\u7D2F\u7A4D\u5024\u306F\u65E2\u5B58\u306E\u4FDD\u5B58\u8A18\u9332\u3067\u3059\u3002\u4FDD\u5B58\u4E16\u4EE3\u306E\u7570\u306A\u308B\u5BFE\u6226\u6570\u3092\u8DB3\u3057\u5408\u308F\u305B\u307E\u305B\u3093\u3002")), /* @__PURE__ */ React.createElement(Panel, { title: "\u9031\u9593\u30DC\u30B9\u306E\u53C2\u52A0\u30FB\u8CA2\u732E" }, /* @__PURE__ */ React.createElement(MetricGrid, null, [["weeks", "\u53C2\u52A0\u9031\u6570"], ["kills", "\u8A0E\u4F10\u8CA2\u732E"], ["best", "\u904E\u53BB\u6700\u9AD8\u30C0\u30E1\u30FC\u30B8"], ["maxStreak", "\u6700\u9AD8\u9023\u7D9A\u53C2\u52A0\u9031"]].map(([key, label]) => /* @__PURE__ */ React.createElement(Stat, { key, label, value: integer(data.weekly[key]) })), /* @__PURE__ */ React.createElement(Stat, { label: "\u4ECA\u9031\u306E\u30C0\u30E1\u30FC\u30B8", value: integer(model.number(mine == null ? void 0 : mine.d)) }), /* @__PURE__ */ React.createElement(Stat, { label: "\u4ECA\u9031\u306E\u51FA\u6483\u8A18\u9332", value: integer(model.number(mine == null ? void 0 : mine.s)), note: "\u5B8C\u8D70\u56DE\u6570\u3068\u306F\u5225\u306E\u8A18\u9332\u3067\u3059" })))), tab === "records" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u6226\u3068\u5F93\u6765\u306E\u8A18\u9332\u306F\u3001\u540C\u3058\u8A66\u5408\u3092\u542B\u3080\u53EF\u80FD\u6027\u304C\u3042\u308B\u305F\u3081\u5225\u3005\u306B\u8868\u793A\u3057\u307E\u3059\u3002"), /* @__PURE__ */ React.createElement("div", { className: "next-profile-columns" }, ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(Record, { key: d, label: (d === "easy" ? "\u30A4\u30FC\u30B8\u30FC" : "\u30CE\u30FC\u30DE\u30EB") + "\u30FB\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u5BFE\u6226", value: data.rated[d] }))), /* @__PURE__ */ React.createElement(Record, { label: "\u5F93\u6765\u306E\u5BFE\u6226\u8A18\u9332\uFF08\u4FDD\u5B58\u6E08\u307F\u901A\u7B97\uFF09", value: data.legacy }), /* @__PURE__ */ React.createElement("div", { className: "next-profile-columns" }, ["A", "B", "C"].map((m) => /* @__PURE__ */ React.createElement(Record, { key: m, label: m + "\u65B9\u5F0F\uFF08\u5F93\u6765\u306E\u4FDD\u5B58\u8A18\u9332\uFF09", value: data.modes[m] }))), /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "B\u65B9\u5F0F\u306F\u5171\u6709\u3059\u308Bstats.B\u3092\u4E00\u5EA6\u3060\u3051\u8868\u793A\u3057\u3066\u3044\u307E\u3059\u3002\u6B20\u640D\u3057\u305F\u52DD\u6557\u306F0\u3068\u4EEE\u5B9A\u3057\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("div", { className: "next-profile-columns" }, ["easy", "normal"].map((d) => /* @__PURE__ */ React.createElement(Record, { key: d, label: (d === "easy" ? "\u30A4\u30FC\u30B8\u30FC" : "\u30CE\u30FC\u30DE\u30EB") + "\u30FB\u30B4\u30FC\u30B9\u30C8\uFF0FBOT\u8A18\u9332", value: data.ghosts[d] })))), tab === "rewards" && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Panel, { title: "\u53D6\u5F97\u79F0\u53F7" }, /* @__PURE__ */ React.createElement("ul", { className: "next-title-list" }, [...earned].map(([id, name]) => /* @__PURE__ */ React.createElement("li", { key: id }, name))), !earned.size && /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u78BA\u8A8D\u3067\u304D\u308B\u53D6\u5F97\u79F0\u53F7\u306F\u3042\u308A\u307E\u305B\u3093\u3002"), /* @__PURE__ */ React.createElement("p", { className: "next-note" }, "\u65E2\u5B58\u306E\u53D6\u5F97\u6839\u62E0\u3067\u78BA\u8A8D\u3067\u304D\u308B\u79F0\u53F7\u3092\u8868\u793A\u3057\u307E\u3059\u3002\u672A\u627F\u8A8D\u306E\u516C\u958B\u6761\u4EF6\u3084\u65B0\u3057\u3044\u53D6\u5F97\u5224\u5B9A\u306F\u9069\u7528\u3057\u307E\u305B\u3093\u3002")), /* @__PURE__ */ React.createElement(Panel, { title: "\u304D\u305B\u304B\u3048\u88C5\u5099" }, /* @__PURE__ */ React.createElement(MetricGrid, null, [["tile", "\u30BF\u30A4\u30EB"], ["bg", "\u80CC\u666F"], ["fx", "\u30A8\u30D5\u30A7\u30AF\u30C8"]].map(([key, label]) => {
        const id = skin == null ? void 0 : skin[key], item = skinCatalog[key].find((x) => x.id === id);
        return /* @__PURE__ */ React.createElement(Stat, { key, label, value: id ? (item == null ? void 0 : item.name) || id : "\u672A\u8A18\u9332" });
      }))))));
    };
  }

  // src/next-home-ui.jsx
  var navigation = require_next_navigation();
  window.NextNavigation = navigation;
  var icons = require_next_home_icons();
  window.NextHomeFactory = (H) => {
    const { useState, useEffect, useRef } = React;
    const { FB, useFbReady, weekKey, now, weeklyInfo, bossForm, suriImg, useRatingHistoryProfile, RatingDisplay, levelOf, isReal, loadGuest, nickOf, PlayerProfile, Wardrobe, useFbValue, useGameMute, LoginBonus, syncSkin } = H;
    const Profile = createProfile(H);
    const Icon = ({ name }) => /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: icons[name] || icons.home }));
    function useBoss(enabled) {
      const fb = useFbReady(), [tick, setTick] = useState(0), [retry, setRetry] = useState(0), [data, setData] = useState(null);
      useEffect(() => {
        if (!enabled) return;
        const t = setInterval(() => setTick((x) => x + 1), 1e3);
        return () => clearInterval(t);
      }, [enabled]);
      const wk = weekKey(now());
      useEffect(() => {
        if (!fb.ready || !enabled) return;
        let active = true;
        const vals = {}, done = /* @__PURE__ */ new Set(), subs = [];
        setData({ wk, status: "loading" });
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
      if (data.status !== "ready") return { ...data, retry: () => setRetry((x) => x + 1) };
      const info = weeklyInfo(wk, data.dmg, data.meta);
      if (!Number.isFinite(info.hp) || !Number.isFinite(info.hpMax) || info.hpMax <= 0) return { status: "error", retry: () => setRetry((x) => x + 1) };
      return { status: "ready", info, boss: bossForm(info.boss, info.revived) };
    }
    function Home({ acct, onGo, onLogout, page = "home", children }) {
      var _a, _b, _c, _d, _e;
      const boss = useBoss(page === "home"), fb = useFbReady(), st = useFbValue(fb.ready && isReal(acct) ? `accounts/${acct.key}/stats` : null);
      const profile = useRatingHistoryProfile(isReal(acct) ? acct.key : null), L = levelOf(((_a = isReal(acct) ? st : loadGuest()) == null ? void 0 : _a.exp) || 0);
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
      const navButton = (key, label) => /* @__PURE__ */ React.createElement("button", { key, className: "nav-item " + (key === navigation.active(page) ? "selected" : ""), "aria-current": key === navigation.active(page) ? "page" : void 0, onClick: () => go(key === "account" ? "profile" : key) }, /* @__PURE__ */ React.createElement(Icon, { name: key }), /* @__PURE__ */ React.createElement("span", null, label), /* @__PURE__ */ React.createElement("i", { "aria-hidden": "true" }));
      const brand = /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("img", { src: "ui-next/logo-official.png", alt: "FACTOR \xD7 FACTOR", width: "1774", height: "887" }));
      const hp = boss.info ? Math.max(0, boss.info.hp) : null, max = (_b = boss.info) == null ? void 0 : _b.hpMax, pct = max ? Math.min(100, hp / max * 100) : 0;
      const statusText = { loading: "HP\u60C5\u5831\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026", preparing: "\u6B21\u306E\u30DC\u30B9\u3092\u6E96\u5099\u4E2D", error: "HP\u60C5\u5831\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093", denied: "HP\u60C5\u5831\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\uFF08\u6A29\u9650\u4E0D\u8DB3\uFF09" }[boss.status];
      return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("link", { rel: "stylesheet", href: "ui-next/home.css" }), /* @__PURE__ */ React.createElement("div", { className: "next-home", "data-next-home": true }, acct && page === "home" && /* @__PURE__ */ React.createElement(LoginBonus, { acct }), /* @__PURE__ */ React.createElement(Frame, { sidebar: /* @__PURE__ */ React.createElement("aside", { className: "sidebar" }, /* @__PURE__ */ React.createElement("button", { className: "brand-slot", onClick: () => go("home"), "aria-label": "\u30DB\u30FC\u30E0\u3078" }, brand), /* @__PURE__ */ React.createElement("div", { className: "side-divider" }), /* @__PURE__ */ React.createElement("nav", { "aria-label": "PC\u30E1\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC" }, nav.map(([k, n]) => navButton(k, n))), /* @__PURE__ */ React.createElement("div", { className: "sidebar-account" }, /* @__PURE__ */ React.createElement(Icon, { name: "account" }), /* @__PURE__ */ React.createElement("button", { onClick: () => go("profile") }, acct.name, /* @__PURE__ */ React.createElement("small", null, "Lv.", L.lv)))), mobileHeader: /* @__PURE__ */ React.createElement("header", { className: "mobile-top" }, /* @__PURE__ */ React.createElement("button", { className: "mobile-brand", onClick: () => go("home"), "aria-label": "\u30DB\u30FC\u30E0\u3078" }, brand), /* @__PURE__ */ React.createElement("div", { className: "header-tools" }, /* @__PURE__ */ React.createElement("button", { "aria-label": muted ? "\u97F3\u58F0\u3092\u30AA\u30F3" : "\u97F3\u58F0\u3092\u30AA\u30D5", onClick: () => setMuted(!muted) }, /* @__PURE__ */ React.createElement(Icon, { name: "sound" })), /* @__PURE__ */ React.createElement("button", { "aria-label": "\u8A2D\u5B9A", onClick: () => setPanel("settings") }, /* @__PURE__ */ React.createElement(Icon, { name: "settings" })))), title: page === "home" ? "\u30DB\u30FC\u30E0" : page === "profile" ? "\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u30FB\u6210\u7E3E" : "\u30E9\u30F3\u30AD\u30F3\u30B0", actions: /* @__PURE__ */ React.createElement("button", { className: "pc-settings", onClick: () => setPanel("settings"), "aria-label": "\u8A2D\u5B9A" }, /* @__PURE__ */ React.createElement(Icon, { name: "settings" })), bottomNav: /* @__PURE__ */ React.createElement("nav", { className: "bottom-nav", "aria-label": "\u30B9\u30DE\u30DB\u30E1\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC" }, [["home", "\u30DB\u30FC\u30E0"], ["online", "\u5BFE\u6226"], ["solo", "\u30BD\u30ED"], ["rank", "\u9806\u4F4D"]].map(([k, n]) => navButton(k, n)), /* @__PURE__ */ React.createElement("button", { className: "nav-item " + (page === "profile" ? "selected" : ""), "aria-current": page === "profile" ? "page" : void 0, "aria-label": "\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F", "aria-expanded": panel === "menu", onClick: () => setPanel("menu") }, /* @__PURE__ */ React.createElement(Icon, { name: "more" }), /* @__PURE__ */ React.createElement("span", null, "\u30E1\u30CB\u30E5\u30FC"))) }, page === "home" ? /* @__PURE__ */ React.createElement(React.Fragment, null, "   ", /* @__PURE__ */ React.createElement("div", { className: "account-row" }, /* @__PURE__ */ React.createElement("button", { className: "account-main", onClick: () => go("profile") }, /* @__PURE__ */ React.createElement("span", { className: "avatar" }, /* @__PURE__ */ React.createElement(Icon, { name: "account" })), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("small", null, ((_c = nickOf(st == null ? void 0 : st.nick)) == null ? void 0 : _c.label) || "\u88C5\u5099\u4E2D\u306E\u79F0\u53F7\u306A\u3057"), /* @__PURE__ */ React.createElement("strong", null, acct.name), /* @__PURE__ */ React.createElement("span", { className: "level" }, "Lv. ", /* @__PURE__ */ React.createElement("b", null, L.lv), /* @__PURE__ */ React.createElement("span", { className: "xp" }, /* @__PURE__ */ React.createElement("i", { style: { width: `${L.cur / L.need * 100}%` } }))))), /* @__PURE__ */ React.createElement("div", { className: "ratings" }, ["easy", "normal"].map((d) => {
        const r = RatingDisplay.current(profile, st, d);
        return /* @__PURE__ */ React.createElement("div", { key: d }, /* @__PURE__ */ React.createElement("small", null, d === "easy" ? "\u30A4\u30FC\u30B8\u30FC" : "\u30CE\u30FC\u30DE\u30EB"), /* @__PURE__ */ React.createElement("strong", null, isReal(acct) ? RatingDisplay.format(r.value) : "\u2015"));
      })), /* @__PURE__ */ React.createElement("button", { className: "account-link", onClick: () => go("profile") }, "\u6210\u7E3E\u78BA\u8A8D ", /* @__PURE__ */ React.createElement(Icon, { name: "chevron" }))), /* @__PURE__ */ React.createElement("main", null, /* @__PURE__ */ React.createElement("div", { className: "home-content" }, /* @__PURE__ */ React.createElement("div", { className: "home-actions" }, [["online", "\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226", ["\u3059\u3050\u904A\u3076\u30FB\u30EB\u30FC\u30E0", "\u30B4\u30FC\u30B9\u30C8\u30FB\u30EC\u30A4\u30C9"], "\u5BFE\u6226\u30ED\u30D3\u30FC\u3078"], ["solo", "\u30BD\u30ED\u30E2\u30FC\u30C9", ["\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB", "\u30CF\u30FC\u30C9"], "\u96E3\u6613\u5EA6\u3092\u9078\u3076"]].map(([k, n, desc, foot]) => /* @__PURE__ */ React.createElement("button", { key: k, className: "action-card " + k, "aria-label": k === "online" ? "\u30AA\u30F3\u30E9\u30A4\u30F3\u5BFE\u6226\u30FBCPU\u7DF4\u7FD2" : void 0, onClick: () => go(k) }, /* @__PURE__ */ React.createElement("span", { className: "action-icon" }, /* @__PURE__ */ React.createElement(Icon, { name: k })), /* @__PURE__ */ React.createElement("span", { className: "surface-lines" }), /* @__PURE__ */ React.createElement("span", { className: "action-text" }, /* @__PURE__ */ React.createElement("strong", null, n), /* @__PURE__ */ React.createElement("small", null, desc.map((t) => /* @__PURE__ */ React.createElement("span", { key: t }, t)))), /* @__PURE__ */ React.createElement("span", { className: "action-foot" }, foot, /* @__PURE__ */ React.createElement(Icon, { name: "chevron" }))))), /* @__PURE__ */ React.createElement("section", { className: "boss-stage", "aria-label": "\u4ECA\u9031\u306E\u30DC\u30B9" }, /* @__PURE__ */ React.createElement("div", { className: "boss-label" }, /* @__PURE__ */ React.createElement("span", { className: "status-dot" }), "\u4ECA\u9031\u306E\u30DC\u30B9"), /* @__PURE__ */ React.createElement("div", { className: "boss-art" }, /* @__PURE__ */ React.createElement("div", { className: "boss-orbit" }), boss.boss && /* @__PURE__ */ React.createElement("img", { key: boss.boss.id, src: suriImg(boss.boss.id), alt: boss.boss.name, width: "512", height: "512", onError: (e) => {
        e.currentTarget.hidden = true;
      } })), /* @__PURE__ */ React.createElement("div", { className: "boss-hp", "aria-live": "polite" }, statusText ? /* @__PURE__ */ React.createElement("p", { role: ["error", "denied"].includes(boss.status) ? "alert" : "status" }, statusText, boss.retry && ["error", "denied"].includes(boss.status) && /* @__PURE__ */ React.createElement("button", { onClick: boss.retry }, "\u518D\u8A66\u884C")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "hp-numbers" }, /* @__PURE__ */ React.createElement("span", null, "HP ", /* @__PURE__ */ React.createElement("b", null, hp.toLocaleString("ja-JP")), " / ", max.toLocaleString("ja-JP")), /* @__PURE__ */ React.createElement("strong", null, boss.info.dead ? "\u8A0E\u4F10\u6E08\u307F" : `${pct.toFixed(1)}%`)), /* @__PURE__ */ React.createElement("div", { className: "hp-track", role: "progressbar", "aria-label": "\u4ECA\u9031\u306E\u30DC\u30B9\u306E\u6B8B\u308AHP", "aria-valuemin": 0, "aria-valuemax": max, "aria-valuenow": hp }, /* @__PURE__ */ React.createElement("i", { style: { width: `${pct}%` } })))), /* @__PURE__ */ React.createElement("div", { className: "boss-details" }, /* @__PURE__ */ React.createElement("h2", null, ((_d = boss.boss) == null ? void 0 : _d.name) || "\u4ECA\u9031\u306E\u30DC\u30B9"), /* @__PURE__ */ React.createElement("button", { className: "small-button", "aria-label": "\u4ECA\u9031\u306E\u30DC\u30B9\u306B\u6311\u3080", onClick: () => go("boss") }, "\u30DC\u30B9\u306B\u6311\u3080 ", /* @__PURE__ */ React.createElement("span", { "aria-hidden": "true" }, "\u2192"))))), /* @__PURE__ */ React.createElement("div", { className: "home-support" }, /* @__PURE__ */ React.createElement("button", { className: "mission-strip", onClick: () => go("daily") }, /* @__PURE__ */ React.createElement(Icon, { name: "daily" }), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, "\u30C7\u30A4\u30EA\u30FC\u30DF\u30C3\u30B7\u30E7\u30F3"), /* @__PURE__ */ React.createElement("small", null, "\u4ECA\u65E5\u306E\u30DF\u30C3\u30B7\u30E7\u30F3\u30FB\u30C7\u30A4\u30EA\u30FC\u30C1\u30E3\u30EC\u30F3\u30B8")), /* @__PURE__ */ React.createElement(Icon, { name: "chevron" })), [["rank", "\u30E9\u30F3\u30AD\u30F3\u30B0"], ["help", "\u3042\u305D\u3073\u304B\u305F"]].map(([k, n]) => /* @__PURE__ */ React.createElement("button", { className: "support-link", key: k, onClick: () => go(k) }, /* @__PURE__ */ React.createElement(Icon, { name: k }), /* @__PURE__ */ React.createElement("strong", null, n), /* @__PURE__ */ React.createElement(Icon, { name: "chevron" })))))) : page === "profile" ? /* @__PURE__ */ React.createElement(Profile, { acct, stats: isReal(acct) ? st : loadGuest(), profile, onBack: () => go("back"), onLegacy: () => setPanel("profile"), onWardrobe: () => setPanel("wardrobe") }) : /* @__PURE__ */ React.createElement("main", { className: "ranking-content" }, /* @__PURE__ */ React.createElement("button", { className: "small-button", onClick: () => go(page === "rankings" ? "home" : "rank") }, page === "rankings" ? "\u30DB\u30FC\u30E0\u3078\u623B\u308B" : "\u30E9\u30F3\u30AD\u30F3\u30B0\u7DCF\u5408\u3078\u623B\u308B"), page === "rankings" ? /* @__PURE__ */ React.createElement("div", { className: "ranking-grid" }, [["solo", "\u30BD\u30ED\u30E9\u30F3\u30AD\u30F3\u30B0", "\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB\u30FB\u30CF\u30FC\u30C9", "solo"], ["daily", "\u30C7\u30A4\u30EA\u30FC\u30E9\u30F3\u30AD\u30F3\u30B0", "\u4ECA\u65E5\u30FB\u6628\u65E5\u306E\u90E8\u9580\u5225\u30E9\u30F3\u30AD\u30F3\u30B0", "daily"], ["rating", "\u30EC\u30FC\u30C6\u30A3\u30F3\u30B0\u30E9\u30F3\u30AD\u30F3\u30B0", "\u30A4\u30FC\u30B8\u30FC\u30FB\u30CE\u30FC\u30DE\u30EB", "online"]].map(([k, label, note, icon]) => /* @__PURE__ */ React.createElement("button", { key: k, className: "ranking-entry", onClick: () => go("ranking-" + k) }, /* @__PURE__ */ React.createElement("span", { className: "ranking-icon" }, /* @__PURE__ */ React.createElement(Icon, { name: icon })), /* @__PURE__ */ React.createElement("strong", null, label), /* @__PURE__ */ React.createElement("small", null, note), /* @__PURE__ */ React.createElement(Icon, { name: "chevron" })))) : /* @__PURE__ */ React.createElement("section", { className: "ranking-view", "aria-label": "\u30E9\u30F3\u30AD\u30F3\u30B0\u8868\u793A" }, children))), /* @__PURE__ */ React.createElement("dialog", { ref: dialog, className: "home-menu", "aria-label": panel === "settings" ? "\u8A2D\u5B9A" : "\u30E1\u30A4\u30F3\u30E1\u30CB\u30E5\u30FC", onCancel: () => setPanel(null) }, /* @__PURE__ */ React.createElement("div", { className: "sheet-title" }, /* @__PURE__ */ React.createElement("h2", null, panel === "settings" ? "\u8A2D\u5B9A" : "\u30E1\u30CB\u30E5\u30FC"), /* @__PURE__ */ React.createElement("button", { onClick: () => setPanel(null), "aria-label": "\u9589\u3058\u308B" }, "\xD7")), panel === "settings" ? /* @__PURE__ */ React.createElement("nav", null, /* @__PURE__ */ React.createElement("button", { onClick: () => setMuted(!muted) }, "\u97F3\u58F0\uFF1A", muted ? "\u30AA\u30D5" : "\u30AA\u30F3"), /* @__PURE__ */ React.createElement("button", { onClick: () => setPanel("wardrobe") }, "\u304D\u305B\u304B\u3048"), /* @__PURE__ */ React.createElement("button", { onClick: onLogout }, isReal(acct) ? "\u30ED\u30B0\u30A2\u30A6\u30C8" : "\u767B\u9332\u30FB\u30ED\u30B0\u30A4\u30F3")) : /* @__PURE__ */ React.createElement("nav", null, nav.map(([k, n]) => navButton(k, n)), /* @__PURE__ */ React.createElement("button", { className: "nav-item", onClick: () => go("learn") }, "\u5B66\u3073\u306E\u90E8\u5C4B")))), panel === "profile" && /* @__PURE__ */ React.createElement(PlayerProfile, { name: acct.name, st: st || loadGuest() || {}, nameOf: {}, me: true, acctKey: isReal(acct) ? acct.key : null, onClose: () => setPanel(null) }), panel === "wardrobe" && /* @__PURE__ */ React.createElement(Wardrobe, { acct, st: st || loadGuest(), exp: ((_e = isReal(acct) ? st : loadGuest()) == null ? void 0 : _e.exp) || 0, onClose: () => setPanel(null) }));
    }
    return Home;
  };
})();
