/* ===== PRICING FORMULAS — single source of truth =====
 * Used in three places, so it must stay dependency-free:
 *   - browser (index.html loads it as a plain script → window.BairxPricing)
 *   - Cloud Functions (functions/ copies this file at deploy time — see firebase.json predeploy)
 *   - unit tests (tests/pricing.test.js, `npm test`)
 *
 * Units: every price is in сая ₮ (million MNT), area in м², so pricePerM2 is сая ₮/м².
 * Rent prices are сая ₮/сар and are never mixed into sale statistics.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.BairxPricing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const HOT_THRESHOLD = 0.85;        // hot list: pricePerM2 <= avgPpm2 * 0.85
  const VALUATION_SPREAD = 0.10;     // valuation range: ±10%
  const MIN_SALES = 3;               // fewer deals than this → "өгөгдөл хүрэлцээгүй"
  const MIN_LISTINGS = 3;            // an average built on fewer unique listings isn't shown/used
  const DAY_MS = 24 * 60 * 60 * 1000;

  function num(v) {
    const n = typeof v === 'string' ? parseFloat(v.replace(/[^\d.\-]/g, '')) : Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function round(v, digits) {
    if (v == null || !Number.isFinite(v)) return null;
    const p = Math.pow(10, digits == null ? 3 : digits);
    return Math.round(v * p) / p;
  }
  function mean(values) {
    const v = values.filter(x => Number.isFinite(x));
    if (!v.length) return null;
    return v.reduce((a, b) => a + b, 0) / v.length;
  }
  function median(values) {
    const v = values.filter(x => Number.isFinite(x)).sort((a, b) => a - b);
    if (!v.length) return null;
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  }

  // pricePerM2 = price / areaM2
  function pricePerM2(price, areaM2) {
    const p = num(price), a = num(areaM2);
    if (p == null || a == null || p <= 0 || a <= 0) return null;
    return p / a;
  }

  // "14/22" → 14, "3" → 3, 5 → 5. Non-numeric floors ("0.06 га", "Эзэмшил") → null.
  function parseFloorNum(floor) {
    if (typeof floor === 'number') return Number.isFinite(floor) ? Math.trunc(floor) : null;
    const m = String(floor == null ? '' : floor).match(/^\s*(-?\d+)\s*(\/\s*\d+)?\s*$/);
    return m ? parseInt(m[1], 10) : null;
  }

  function parseRooms(rooms) {
    if (typeof rooms === 'number') return Number.isFinite(rooms) ? rooms : null;
    const m = String(rooms == null ? '' : rooms).match(/^\s*(\d+)\s*(өрөө)?\s*$/);
    return m ? parseInt(m[1], 10) : null;
  }

  // ---- Complex id (slug) ----
  const TRANSLIT = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z','и':'i','й':'i','к':'k','л':'l','м':'m','н':'n',
    'о':'o','ө':'u','п':'p','р':'r','с':'s','т':'t','у':'u','ү':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'sh',
    'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'
  };
  function slugify(name) {
    return String(name || '').toLowerCase().trim()
      .split('').map(c => (TRANSLIT[c] != null ? TRANSLIT[c] : c)).join('')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  }

  // ---- Duplicate detection ----
  // The same flat posted by several agents counts once: same complex + same area (rounded to
  // the nearest м²) + same floor + same room count.
  function dedupeKey(l) {
    const area = num(l.areaM2 != null ? l.areaM2 : l.area);
    return [
      l.complexId || '',
      area != null ? Math.round(area) : '',
      parseFloorNum(l.floor),
      parseRooms(l.rooms)
    ].join('|');
  }

  // Groups duplicates and returns one representative per physical flat. Its pricePerM2 is
  // the mean of the group's prices, so neither the cheapest nor the priciest agent "wins".
  function dedupeListings(list) {
    const groups = new Map();
    for (const l of list) {
      const k = dedupeKey(l);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(l);
    }
    const out = [];
    for (const g of groups.values()) {
      const ppms = g.map(listingPpm2).filter(v => v != null);
      out.push(Object.assign({}, g[0], { pricePerM2: mean(ppms), duplicateCount: g.length }));
    }
    return out;
  }

  // Always recomputed from price/area when both exist — a stored pricePerM2 field is written
  // by the listing's own owner and is never trusted over the numbers it's derived from.
  function listingPpm2(l) {
    const computed = pricePerM2(l.price, l.areaM2 != null ? l.areaM2 : l.area);
    if (computed != null) return computed;
    const stored = num(l.pricePerM2);
    return stored != null && stored > 0 ? stored : null;
  }

  // Only sale apartments in an active state feed the complex average.
  function isStatsEligible(l) {
    const cat = l.category || l.cat;
    return (cat === 'apartment') && (l.status || 'active') === 'active' && listingPpm2(l) != null;
  }

  // avgPpm2 = mean(pricePerM2 of active listings), duplicates merged first.
  function avgPpm2(listings) {
    const eligible = (listings || []).filter(isStatsEligible);
    if (!eligible.length) return null;
    return mean(dedupeListings(eligible).map(l => l.pricePerM2));
  }

  function toMs(d) {
    if (d == null) return null;
    if (typeof d === 'number') return d;
    if (d instanceof Date) return d.getTime();
    if (typeof d.toMillis === 'function') return d.toMillis();
    const t = Date.parse(d);
    return Number.isFinite(t) ? t : null;
  }

  function salePpm2(s) { return pricePerM2(s.price, s.areaM2); }

  function salesBetween(sales, fromMs, toMs_) {
    return (sales || []).filter(s => {
      const t = toMs(s.date);
      return t != null && t >= fromMs && t < toMs_ && salePpm2(s) != null;
    });
  }

  // growth = (current − base) / base. null when either side is missing.
  function growth(current, base) {
    if (current == null || base == null || base <= 0) return null;
    return (current - base) / base;
  }

  // All of a complex's statistics. Sale-based figures (sales12m average, growth) are only
  // filled in when each period has at least MIN_SALES deals — otherwise null, which the UI
  // renders as "өгөгдөл хүрэлцээгүй" rather than a number built on one or two deals.
  function computeComplexStats(listings, sales, nowMs) {
    const now = nowMs == null ? Date.now() : nowMs;
    const yearAgo = now - 365 * DAY_MS;
    const twoYearsAgo = now - 730 * DAY_MS;
    const y2023from = Date.UTC(2023, 0, 1), y2023to = Date.UTC(2024, 0, 1);

    const eligible = (listings || []).filter(isStatsEligible);
    const unique = eligible.length ? dedupeListings(eligible) : [];
    const last12 = salesBetween(sales, yearAgo, now + 1);
    const prev12 = salesBetween(sales, twoYearsAgo, yearAgo);
    const in2023 = salesBetween(sales, y2023from, y2023to);
    const allSales = salesBetween(sales, 0, now + 1);

    const avg = (arr) => arr.length >= MIN_SALES ? mean(arr.map(salePpm2)) : null;
    const sold12Avg = avg(last12);
    const sold2023Avg = avg(in2023);
    const soldPrevAvg = avg(prev12);

    return {
      avgPpm2: round(unique.length ? mean(unique.map(l => l.pricePerM2)) : null, 4),
      listingCount: unique.length,
      rawListingCount: eligible.length,
      sales12m: last12.length,
      salesCount: allSales.length,
      soldAvgPpm2_12m: round(sold12Avg, 4),
      soldAvgPpm2_2023: round(sold2023Avg, 4),
      growth2023: round(growth(sold12Avg, sold2023Avg), 4),
      growth1y: round(growth(sold12Avg, soldPrevAvg), 4),
      dataSufficient: allSales.length >= MIN_SALES
    };
  }

  // ---- Hot list ----
  function isHot(listing, complexAvgPpm2) {
    const p = listingPpm2(listing);
    if (p == null || complexAvgPpm2 == null || complexAvgPpm2 <= 0) return false;
    return p <= complexAvgPpm2 * HOT_THRESHOLD;
  }
  // How many % below the complex average (positive number = cheaper).
  function discountPct(listingPpm, complexAvgPpm2) {
    if (listingPpm == null || complexAvgPpm2 == null || complexAvgPpm2 <= 0) return null;
    return Math.round((1 - listingPpm / complexAvgPpm2) * 100);
  }

  // ---- Valuation: avgPpm2 × area, ±10% ----
  function valuation(complexAvgPpm2, areaM2) {
    const a = num(areaM2);
    if (complexAvgPpm2 == null || complexAvgPpm2 <= 0 || a == null || a <= 0) return null;
    const estimate = complexAvgPpm2 * a;
    return {
      estimate: round(estimate, 1),
      low: round(estimate * (1 - VALUATION_SPREAD), 1),
      high: round(estimate * (1 + VALUATION_SPREAD), 1)
    };
  }

  // ---- Budget → м²: budget / avgPpm2 ----
  function m2ForBudget(budget, complexAvgPpm2) {
    const b = num(budget);
    if (b == null || b <= 0 || complexAvgPpm2 == null || complexAvgPpm2 <= 0) return null;
    return round(b / complexAvgPpm2, 1);
  }

  // ---- Budget landing slugs: /b/250, /b/250-500, /b/500-1000, /b/1000, /b/r2, /b/r2-4, /b/r4 ----
  const BUDGET_SLUGS = {
    '250':      { kind: 'sale', min: null, max: 250,  label: '250 сая ₮ хүртэлх байр' },
    '250-500':  { kind: 'sale', min: 250,  max: 500,  label: '250–500 сая ₮-ийн байр' },
    '500-1000': { kind: 'sale', min: 500,  max: 1000, label: '500 сая – 1 тэрбум ₮-ийн байр' },
    '1000':     { kind: 'sale', min: 1000, max: null, label: '1 тэрбум ₮-өөс дээш байр' },
    'r2':       { kind: 'rent', min: null, max: 2,    label: 'Сарын 2 сая ₮ хүртэлх түрээс' },
    'r2-4':     { kind: 'rent', min: 2,    max: 4,    label: 'Сарын 2–4 сая ₮-ийн түрээс' },
    'r4':       { kind: 'rent', min: 4,    max: null, label: 'Сарын 4 сая ₮-өөс дээш түрээс' }
  };
  function parseBudgetSlug(slug) {
    const s = BUDGET_SLUGS[String(slug || '').toLowerCase()];
    return s ? Object.assign({ slug: String(slug).toLowerCase() }, s) : null;
  }
  function inBudget(price, b) {
    const p = num(price);
    if (p == null || !b) return false;
    if (b.min != null && p < b.min) return false;
    if (b.max != null && p > b.max) return false;
    return true;
  }

  // ---- Natural-language search (rule-based parser) ----
  // "500 сая хүртэл 3 өрөө Зайсан" → { maxPrice: 500, rooms: 3, text: 'зайсан' }
  const DISTRICTS = {
    'хан-уул': 'khan-uul', 'хан уул': 'khan-uul', 'сүхбаатар': 'sukhbaatar', 'баянгол': 'bayangol',
    'баянзүрх': 'bayanzurkh', 'чингэлтэй': 'chingeltei', 'сонгинохайрхан': 'songinokhairkhan',
    'налайх': 'nalaikh', 'багануур': 'baganuur', 'багахангай': 'bagakhangai'
  };
  function parseNaturalQuery(text) {
    let q = ' ' + String(text || '').toLowerCase().replace(/[,;]+/g, ' ').replace(/\s+/g, ' ') + ' ';
    const out = {};
    const unit = (u) => /тэрбум|тэр/.test(u || '') ? 1000 : 1;
    const consume = (re, fn) => { const m = q.match(re); if (m) { fn(m); q = q.replace(m[0], ' '); } };

    if (/түрээс/.test(q)) { out.kind = 'rent'; q = q.replace(/түрээсийн|түрээслэх|түрээс/g, ' '); }
    // range: "300-500 сая", "300 - 500 сая"
    consume(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(сая|тэрбум|тэр)\S*/, m => {
      out.minPrice = parseFloat(m[1].replace(',', '.')) * unit(m[3]);
      out.maxPrice = parseFloat(m[2].replace(',', '.')) * unit(m[3]);
    });
    // max: "500 сая хүртэл", "1.2 тэрбум хүртэлх", "500 саяас доош"
    consume(/(\d+(?:[.,]\d+)?)\s*(сая|тэрбум|тэр)\S*\s*(хүртэл\S*|доош|бага)/, m => {
      out.maxPrice = parseFloat(m[1].replace(',', '.')) * unit(m[2]);
    });
    // min: "300 саяас дээш"
    consume(/(\d+(?:[.,]\d+)?)\s*(сая|тэрбум|тэр)\S*\s*(дээш|илүү|их)/, m => {
      out.minPrice = parseFloat(m[1].replace(',', '.')) * unit(m[2]);
    });
    // bare price "500 сая" → treat as an upper bound
    consume(/(\d+(?:[.,]\d+)?)\s*(сая|тэрбум|тэр)\S*/, m => {
      if (out.maxPrice == null) out.maxPrice = parseFloat(m[1].replace(',', '.')) * unit(m[2]);
    });
    consume(/(\d+)\s*(өрөө|өрөөтэй|ш өрөө)/, m => { out.rooms = parseInt(m[1], 10); });
    consume(/(\d+(?:[.,]\d+)?)\s*(м2|м²|мкв|кв)/, m => { out.minArea = parseFloat(m[1].replace(',', '.')); });
    for (const name of Object.keys(DISTRICTS)) {
      if (q.includes(name)) { out.district = DISTRICTS[name]; q = q.replace(new RegExp(name + '\\S*'), ' '); break; }
    }
    // NB: \b is ASCII-only in JS regexes, so Cyrillic word edges are matched with \s/^/$.
    const rest = q.replace(/(^|\s)(байр|орон сууц|зарна|авна|хайж байна|хямд)(?=\s|$)/g, ' ').replace(/\s+/g, ' ').trim();
    if (rest) out.text = rest;
    return out;
  }

  return {
    HOT_THRESHOLD, VALUATION_SPREAD, MIN_SALES, MIN_LISTINGS, BUDGET_SLUGS,
    num, round, mean, median, pricePerM2, parseFloorNum, parseRooms, slugify,
    dedupeKey, dedupeListings, listingPpm2, isStatsEligible, avgPpm2,
    growth, computeComplexStats, isHot, discountPct, valuation, m2ForBudget,
    parseBudgetSlug, inBudget, parseNaturalQuery, toMs
  };
});
