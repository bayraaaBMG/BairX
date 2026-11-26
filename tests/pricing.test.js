// Unit tests for js/pricing.js — run with:  cd tests && npm run test:unit
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/pricing.js');

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);
const apt = (o) => Object.assign({ category: 'apartment', status: 'active', complexId: 'zaisan-tolt' }, o);

test('pricePerM2 = price / areaM2', () => {
  near(P.pricePerM2(500, 100), 5);
  near(P.pricePerM2('380', '72'), 380 / 72);
  assert.equal(P.pricePerM2(500, 0), null);
  assert.equal(P.pricePerM2(0, 50), null);
  assert.equal(P.pricePerM2(null, 50), null);
});

test('parseFloorNum / parseRooms', () => {
  assert.equal(P.parseFloorNum('14/22'), 14);
  assert.equal(P.parseFloorNum(5), 5);
  assert.equal(P.parseFloorNum('0.06 га'), null);
  assert.equal(P.parseRooms(3), 3);
  assert.equal(P.parseRooms('2 өрөө'), 2);
  assert.equal(P.parseRooms('Б'), null);
});

test('slugify transliterates Mongolian Cyrillic', () => {
  assert.equal(P.slugify('Зайсан Тольт'), 'zaisan-tolt');
  assert.equal(P.slugify('Хүннү 2222'), 'khunnu-2222');
  assert.equal(P.slugify('  Олимп тауэр! '), 'olimp-tauer');
});

test('avgPpm2 merges duplicates (same complex + area + floor + rooms)', () => {
  // The same flat posted by 3 agents at 5.0, 5.2, 5.4 counts ONCE (mean 5.2),
  // plus one other flat at 4.0 → (5.2 + 4.0) / 2 = 4.6, not (5+5.2+5.4+4)/4 = 4.9.
  const list = [
    apt({ price: 500, area: 100, floor: '9/18', rooms: 3 }),
    apt({ price: 520, area: 100.3, floor: '9/18', rooms: 3 }),
    apt({ price: 540, area: 99.8, floor: 9, rooms: '3' }),
    apt({ price: 280, area: 70, floor: '4/18', rooms: 2 })
  ];
  near(P.avgPpm2(list), 4.6, 0.01); // areas 100 / 100.3 / 99.8 round to the same 100 м²
  const dd = P.dedupeListings(list);
  assert.equal(dd.length, 2);
  assert.equal(dd.find(x => x.duplicateCount === 3).duplicateCount, 3);
});

test('avgPpm2 ignores rentals, inactive listings and non-apartments', () => {
  const list = [
    apt({ price: 500, area: 100, floor: 1, rooms: 3 }),
    apt({ price: 2.5, area: 90, floor: 2, rooms: 3, category: 'rent' }),
    apt({ price: 900, area: 100, floor: 3, rooms: 3, status: 'sold' }),
    apt({ price: 780, area: 240, floor: 0, rooms: 4, category: 'house' })
  ];
  near(P.avgPpm2(list), 5);
  assert.equal(P.avgPpm2([]), null);
});

test('hot list: pricePerM2 <= avgPpm2 * 0.85', () => {
  const avg = 5;
  assert.equal(P.isHot({ price: 425, area: 100 }, avg), true);   // exactly 15% below
  assert.equal(P.isHot({ price: 400, area: 100 }, avg), true);   // 20% below
  assert.equal(P.isHot({ price: 430, area: 100 }, avg), false);  // 14% below
  assert.equal(P.isHot({ price: 400, area: 100 }, null), false); // no average → never hot
  assert.equal(P.discountPct(4, 5), 20);
  assert.equal(P.discountPct(4.25, 5), 15);
});

test('valuation = avgPpm2 × area, ±10%', () => {
  const v = P.valuation(5, 72);
  assert.deepEqual(v, { estimate: 360, low: 324, high: 396 });
  assert.equal(P.valuation(null, 72), null);
  assert.equal(P.valuation(5, 0), null);
});

test('m2ForBudget = budget / avgPpm2', () => {
  assert.equal(P.m2ForBudget(500, 5), 100);
  assert.equal(P.m2ForBudget(250, 4.6), 54.3);
  assert.equal(P.m2ForBudget(250, null), null);
});

test('growth = (current − base) / base', () => {
  near(P.growth(6, 5), 0.2);
  near(P.growth(4.5, 5), -0.1);
  assert.equal(P.growth(6, null), null);
  assert.equal(P.growth(null, 5), null);
});

test('computeComplexStats: sales-based growth needs ≥3 deals per period', () => {
  const now = Date.UTC(2026, 10, 26);
  const day = 86400000;
  const sales = [
    // 2023: avg 4.0
    { date: '2023-03-01', price: 400, areaM2: 100 },
    { date: '2023-06-01', price: 280, areaM2: 70 },
    { date: '2023-09-01', price: 200, areaM2: 50 },
    // previous 12 months (12-24 months ago): avg 4.5
    { date: new Date(now - 400 * day).toISOString(), price: 450, areaM2: 100 },
    { date: new Date(now - 500 * day).toISOString(), price: 450, areaM2: 100 },
    { date: new Date(now - 600 * day).toISOString(), price: 450, areaM2: 100 },
    // last 12 months: avg 5.0
    { date: new Date(now - 10 * day).toISOString(), price: 500, areaM2: 100 },
    { date: new Date(now - 100 * day).toISOString(), price: 350, areaM2: 70 },
    { date: new Date(now - 200 * day).toISOString(), price: 250, areaM2: 50 }
  ];
  const listings = [apt({ price: 520, area: 100, floor: 3, rooms: 3 }), apt({ price: 260, area: 50, floor: 2, rooms: 1 })];
  const s = P.computeComplexStats(listings, sales, now);
  near(s.avgPpm2, 5.2);
  assert.equal(s.listingCount, 2);
  assert.equal(s.sales12m, 3);
  assert.equal(s.salesCount, 9);
  near(s.growth2023, 0.25);          // (5.0 − 4.0) / 4.0
  near(s.growth1y, 0.5 / 4.5, 1e-4); // (5.0 − 4.5) / 4.5
  assert.equal(s.dataSufficient, true);

  const thin = P.computeComplexStats(listings, sales.slice(6, 8), now); // only 2 recent deals
  assert.equal(thin.growth2023, null);
  assert.equal(thin.growth1y, null);
  assert.equal(thin.dataSufficient, false);
});

test('budget slugs', () => {
  assert.deepEqual(P.parseBudgetSlug('250-500'), { slug: '250-500', kind: 'sale', min: 250, max: 500, label: '250–500 сая ₮-ийн байр' });
  assert.equal(P.parseBudgetSlug('r2').kind, 'rent');
  assert.equal(P.parseBudgetSlug('999'), null);
  const b = P.parseBudgetSlug('1000');
  assert.equal(P.inBudget(1200, b), true);
  assert.equal(P.inBudget(900, b), false);
  assert.equal(P.inBudget(250, P.parseBudgetSlug('250')), true);
});

test('natural-language query parser', () => {
  assert.deepEqual(P.parseNaturalQuery('500 сая хүртэл 3 өрөө Зайсан'), { maxPrice: 500, rooms: 3, text: 'зайсан' });
  assert.deepEqual(P.parseNaturalQuery('1.2 тэрбум хүртэлх 4 өрөө байр Хан-Уул'), { maxPrice: 1200, rooms: 4, district: 'khan-uul' });
  assert.deepEqual(P.parseNaturalQuery('300-500 сая 2 өрөө'), { minPrice: 300, maxPrice: 500, rooms: 2 });
  assert.deepEqual(P.parseNaturalQuery('түрээс 2 өрөө Баянгол 3 сая хүртэл'), { kind: 'rent', maxPrice: 3, rooms: 2, district: 'bayangol' });
  assert.deepEqual(P.parseNaturalQuery('300 саяас дээш Сүхбаатар'), { minPrice: 300, district: 'sukhbaatar' });
});
