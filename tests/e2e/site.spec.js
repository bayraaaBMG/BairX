// End-to-end browser tests (Chromium · desktop / tablet / mobile) against the local static
// server + Firebase Emulator Suite seeded by e2e/seed.js. Production Firebase is blocked at
// the network layer — any attempt to reach it fails the test.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const BANKS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'banks.json'), 'utf8')).banks;
const OWNER = { email: 'bbayraaa20@gmail.com', password: 'test-owner-pass' };
const USER = { email: 'tester@example.com', password: 'test-user-pass' };
const SHOTS = path.join(__dirname, '..', 'e2e-results', 'screens');
fs.mkdirSync(SHOTS, { recursive: true });

// Matched on the HOSTNAME only — emulator URLs carry these names in their path.
const PROD_HOSTS = /(^|\.)(firestore|identitytoolkit|securetoken|firebasestorage|firebaseinstallations|fcmregistrations)\.googleapis\.com$|cloudfunctions\.net$/;
const PROD_FIREBASE = (url) => { try { return PROD_HOSTS.test(new URL(String(url)).hostname); } catch (e) { return false; } };
// Third-party resources that may legitimately fail offline / be rate-limited; reported, not fatal.
const EXTERNAL_SOFT = /apis\.google\.com|images\.unsplash\.com|tile\.openstreetmap\.org|overpass-api|fonts\.(googleapis|gstatic)\.com|unpkg\.com/;

test.beforeEach(async ({ page }, info) => {
  const problems = { console: [], pageerror: [], prod: [], http: [], soft: [] };
  info.problems = problems;
  await page.route(PROD_FIREBASE, (route) => { problems.prod.push(route.request().url()); route.abort(); });
  page.on('console', (m) => { if (m.type() === 'error') problems.console.push(m.text()); });
  page.on('pageerror', (e) => problems.pageerror.push(String(e)));
  page.on('response', (r) => {
    const u = r.url();
    // Emulator 4xx are not failures by themselves, but record them so a console "400" can be traced.
    if (r.status() >= 400 && /127\.0\.0\.1:(8080|9099|9199|5001)\//.test(u)) {
      info.annotations.push({ type: 'emulator-' + r.status(), description: r.request().method() + ' ' + u.slice(0, 200) });
      console.log('[emulator ' + r.status() + '] ' + info.title + ' ' + r.request().method() + ' ' + u.slice(0, 200));
    }
    if (r.status() >= 400 && !u.includes(':8080') && !u.includes(':9099') && !u.includes(':9199') && !u.includes(':5001')) {
      (EXTERNAL_SOFT.test(u) ? problems.soft : problems.http).push(r.status() + ' ' + u);
    }
  });
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (PROD_FIREBASE(u)) return;
    // Firestore/Auth emulator long-poll channels are aborted on every navigation — normal.
    if (/127\.0\.0\.1:(8080|9099|9199|5001)\//.test(u) && /ERR_ABORTED/.test(r.failure()?.errorText || '')) return;
    (EXTERNAL_SOFT.test(u) ? problems.soft : problems.http).push('FAILED ' + (r.failure()?.errorText || '') + ' ' + u);
  });
  // Emulator mode (js/firebase-init.js) is switched on per tab session by ?emulator=1.
  await page.goto('/?emulator=1');
  await page.waitForFunction(() => window.BAIRX_EMULATOR === true);
});

test.afterEach(async ({}, info) => {
  const p = info.problems;
  // Known-benign console noise: blocked third-party trackers / favicon etc. are not expected here.
  // "Could not reach Cloud Firestore backend" is the SDK's 10-second emulator latency warning;
  // a real production attempt would show up in p.prod (blocked + recorded) instead.
  const ignore = (t) => /Failed to load resource: net::ERR_(INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|CONNECTION)|unsplash|openstreetmap|overpass|Could not reach Cloud Firestore backend/i.test(t);
  const consoleErrors = p.console.filter((t) => !ignore(t));
  if (p.soft.length) info.annotations.push({ type: 'external-soft-failures', description: p.soft.slice(0, 5).join(' | ') });
  expect.soft(p.prod, 'requests to PRODUCTION Firebase').toEqual([]);
  expect.soft(p.pageerror, 'uncaught page errors').toEqual([]);
  expect.soft(p.http, 'HTTP 4xx/5xx or failed same-origin requests').toEqual([]);
  expect.soft(consoleErrors, 'console errors').toEqual([]);
});

// ---------- helpers ----------
async function login(page, u) {
  await page.evaluate(() => openAuth());
  await page.fill('#authEmail', u.email);
  await page.click('#authStep1 .auth-submit-btn');
  await page.fill('#authPassword', u.password);
  await page.click('#authStep3Login .auth-submit-btn');
  await page.waitForFunction((email) => typeof currentUser !== 'undefined' && currentUser && currentUser.email === email, u.email);
  if (u === OWNER) await page.waitForFunction(() => currentUser.role === 'owner');
}
async function route(page, p) {
  await page.evaluate((x) => go(null, x), p);
  await page.waitForFunction((x) => location.pathname + location.search === x, p);
  await page.waitForSelector('#routeContent .route-loading', { state: 'detached' });
}
async function shot(page, info, name) {
  await page.screenshot({ path: path.join(SHOTS, `${info.project.name}-${name}.png`), fullPage: false });
}
async function emulatorDocs(collection) {
  const r = await fetch(`http://127.0.0.1:8080/v1/projects/bairx-fd502/databases/(default)/documents/${collection}?pageSize=300`, { headers: { Authorization: 'Bearer owner' } });
  return ((await r.json()).documents || []).map((d) => ({ id: d.name.split('/').pop(), f: d.fields || {} }));
}
async function recompute(page) {
  await login(page, OWNER);
  await page.goto('/crm?tab=sales');
  await page.waitForSelector('#salesComplex');
  await page.click('button:has-text("Статистик одоо шинэчлэх")');
  // First call after the emulator (re)loads functions is a cold start — allow for it.
  await expect(page.locator('#toast')).toContainText('Шинэчлэгдлээ', { timeout: 100000 });
}

// ---------- tests (serial: later ones rely on stats computed by the first) ----------
test.describe.configure({ mode: 'serial' });

test('1. Cloud Function (emulator) recomputes complexStats from the CRM button', async ({ page }) => {
  test.setTimeout(150000);
  await recompute(page);
  const stats = await emulatorDocs('complexStats');
  const z = stats.find((s) => s.id === 'zaisan-tolt');
  expect(z, 'complexStats/zaisan-tolt').toBeTruthy();
  expect(Number(z.f.avgPpm2.doubleValue ?? z.f.avgPpm2.integerValue)).toBeCloseTo(4.9, 3);
  expect(Number(z.f.listingCount.integerValue)).toBe(4);
  expect(Number(z.f.growth2023.doubleValue)).toBeCloseTo(0.225, 3);
  const hot = (await emulatorDocs('siteStats')).find((d) => d.id === 'hotlist');
  expect(hot.f.items.arrayValue.values.length).toBe(1);
});

test('2. Home: no bare "0", banks from banks.json, no placeholder phone', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('#banksRow .bank-pill:not(.skeleton-pill)')).toHaveCount(BANKS.length);
  await expect(page.locator('[data-bank-count]')).toHaveText(String(BANKS.length));
  await expect(page.locator('#banksRow .bp-checked').first()).toContainText('Шалгасан:');
  const zeros = await page.$$eval('.home-cat-tile-count, #heroMiniStats strong', (els) => els.filter((e) => e.offsetParent && e.textContent.trim() === '0').length);
  expect(zeros).toBe(0);
  await expect(page.locator('#homeListingsGrid .listing-card').first()).toBeVisible();
  await expect(page.locator('#userDropPhone')).toHaveText('');
  await shot(page, info, 'home');
});

test('3. Complexes list: averages, insufficient data, district filter', async ({ page }, info) => {
  await route(page, '/complexes');
  await expect(page.locator('.cx-card')).toHaveCount(3);
  await expect(page.locator('.cx-card', { hasText: 'Зайсан Тольт' })).toContainText('4.90 сая ₮/м²');
  await expect(page.locator('.cx-card', { hasText: 'Ногоон нуур' })).toContainText('өгөгдөл хүрэлцээгүй');
  await expect(page.locator('.cx-card .updated-at').first()).toContainText('Шинэчилсэн:');
  await page.selectOption('#cxDistrict', 'khan-uul');
  await expect(page.locator('.cx-card')).toHaveCount(1);
  await shot(page, info, 'complexes');
});

test('4. Complex page: KPIs, growth, recent sales, contact buttons', async ({ page }) => {
  await route(page, '/complex/zaisan-tolt');
  await expect(page.locator('.route-title')).toContainText('Зайсан Тольт');
  await expect(page.locator('.cx-kpi').nth(0)).toContainText('4.90 сая ₮/м²');
  await expect(page.locator('.cx-kpi').nth(3)).toContainText('+22.5%');
  await expect(page.locator('#routeContent .data-table tbody tr')).toHaveCount(8);
  const hrefs = await page.$$eval('.cx-contact .contact-btns a', (as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs[0]).toBe('tel:+97672119435');
  expect(hrefs[1]).toContain('viber://chat?number=%2B97672119435');
  expect(hrefs[2]).toContain('https://wa.me/97672119435');
  expect(hrefs[3]).toContain('sms:+97672119435');
  await expect(page.locator('#routeContent .home-listings-grid .listing-card')).toHaveCount(4);
  await expect(page.locator('#routeContent .home-listings-grid .badge.demo')).toHaveCount(0);
});

test('5. Hot list: ≥15% below average, reason shown, room filter', async ({ page }, info) => {
  await route(page, '/hotlist');
  await expect(page.locator('.hot-card')).toHaveCount(1);
  await expect(page.locator('.hot-badge')).toHaveText('−18%');
  await expect(page.locator('.hot-why')).toContainText('Хотхоны дунджаас 18% доогуур');
  await expect(page.locator('.method-note')).toContainText('15%');
  await shot(page, info, 'hotlist');
  await page.click('#hotRooms .chip[data-r="3"]');
  await expect(page.locator('.hot-card')).toHaveCount(0);
  await expect(page.locator('#hotGrid .home-empty-title')).toBeVisible();
});

test('6. Valuation: consent required, result = avg × area ±10%, lead saved', async ({ page }, info) => {
  const before = (await emulatorDocs('leads')).length;
  await route(page, '/valuation?c=zaisan-tolt');
  await expect(page.locator('#valComplex')).toHaveValue('zaisan-tolt');
  await page.fill('#valArea', '72');
  await page.selectOption('#valRooms', '2');
  await page.fill('#valName', 'Тест');
  await page.fill('#valPhone', '9911 2233');
  await page.click('#valSubmit');
  // The consent box is `required`: the browser itself blocks submission (native validation).
  expect(await page.locator('#valConsent').evaluate((el) => el.matches(':invalid'))).toBe(true);
  await expect(page.locator('.val-result')).toHaveCount(0);
  await page.check('#valConsent');
  await page.click('#valSubmit');
  await expect(page.locator('.val-main')).toHaveText('353 сая ₮');
  await expect(page.locator('.val-range')).toContainText('318 сая ₮ – 388 сая ₮');
  await expect(page.locator('.val-disclaimer')).toContainText('мэргэжлийн үнэлгээ биш');
  await shot(page, info, 'valuation');
  const leads = await emulatorDocs('leads');
  expect(leads.length).toBe(before + 1);
  const l = leads.find((x) => x.f.type?.stringValue === 'valuation' && x.f.phone?.stringValue === '99112233');
  expect(l.f.consent.booleanValue).toBe(true);
});

test('7. Growth table and budget-to-m² use only deal data', async ({ page }) => {
  await route(page, '/growth');
  await expect(page.locator('#routeContent tr', { hasText: 'Зайсан Тольт' })).toContainText('+22.5%');
  await expect(page.locator('#routeContent tr', { hasText: 'Олимп тауэр' })).toContainText('өгөгдөл хүрэлцээгүй');
  await route(page, '/budget?b=500');
  await expect(page.locator('#budgetTable tbody tr')).toHaveCount(1); // only complexes with ≥3 deals
  await expect(page.locator('#budgetTable tbody tr')).toContainText('102 м²');
});

test('8. Budget landing pages /b/*: real listings only, SEO meta', async ({ page }) => {
  await route(page, '/b/250-500');
  await expect(page).toHaveTitle(/250–500 сая/);
  expect(await page.getAttribute('link[rel="canonical"]', 'href')).toBe('https://bairx.vercel.app/b/250-500');
  expect(await page.getAttribute('meta[name="description"]', 'content')).toContain('250–500');
  await expect(page.locator('#routeContent .home-listings-grid .listing-card')).toHaveCount(7);
  await expect(page.locator('#routeContent .home-listings-grid .badge.demo')).toHaveCount(0);
  await route(page, '/b/r2');
  await expect(page.locator('#routeContent .home-empty-title')).toBeVisible();
  await route(page, '/b/nope');
  await expect(page.locator('.route-title')).toHaveText('Хуудас олдсонгүй');
});

test('9. Listings: "Зах зээлээс хямд" = hot-list rule; listing detail contact buttons', async ({ page }) => {
  await page.goto('/#listings');
  await page.waitForFunction(() => typeof priceData !== 'undefined' && priceData.stats.size > 0);
  await page.evaluate(() => { activeFilterToggles = ['below']; applyListingFilter(); });
  await expect(page.locator('#listingsGrid .listing-card')).toHaveCount(1);
  await expect(page.locator('#listingsGrid .badge.hot')).toContainText('−18%');
  await page.evaluate(() => openListingByFsId('test-listing-1'));
  await expect(page.locator('.ld-mi-stat-label', { hasText: 'Хотхоны дундаж 1м²' })).toBeVisible();
  await page.evaluate(() => { const l = listings.find((x) => x.firestoreId === 'test-listing-1'); revealPhone(String(l.id)); });
  const hrefs = await page.$$eval('.ld-contact-box .contact-btns a', (as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual(expect.arrayContaining(['tel:+97699112233']));
  expect(hrefs.length).toBe(4);
});

test('10. Natural-language search fills the filters', async ({ page }) => {
  await page.goto('/');
  await page.fill('#hSearchKeyword', '500 сая хүртэл 3 өрөө');
  await page.click('.hs-search-btn');
  await page.waitForFunction(() => location.hash === '#listings');
  await expect(page.locator('#fPriceMax')).toHaveValue('500');
  await expect(page.locator('#fRooms')).toHaveValue('3');
  await expect(page.locator('#filterCountLabel')).toContainText('зар олдлоо');
});

test('11. Privacy + opt-out form (consent required)', async ({ page }) => {
  await route(page, '/privacy');
  await expect(page.locator('.route-body h3')).toHaveCount(6);
  await route(page, '/optout');
  await page.fill('#ooListing', 'https://bairx.vercel.app/#listing-1');
  await page.fill('#ooName', 'Тест');
  await page.fill('#ooPhone', '88112233');
  await page.click('#ooSubmit');
  await expect(page.locator('.lead-success')).toHaveCount(0);
  await page.check('#ooConsent');
  await page.click('#ooSubmit');
  await expect(page.locator('.lead-success')).toContainText('Хүсэлт хүлээн авлаа');
});

test('12. Alerts: signed-in user saves an e-mail alert', async ({ page }) => {
  await login(page, USER);
  await route(page, '/alerts');
  await page.fill('#alBudget', '400');
  await page.selectOption('#alRooms', '2');
  await page.check('input[name="alCh"][value="email"]');
  await page.check('#alConsent');
  await page.click('#alSubmit');
  // The same test user runs on every device project, so alerts accumulate across projects.
  await expect(page.locator('#myAlerts .alert-row', { hasText: '400 сая ₮ хүртэл' }).first()).toBeVisible();
});

test('13. CRM: lead pipeline, bulk sales paste, image upload (compressed)', async ({ page }, info) => {
  await login(page, OWNER);
  await page.goto('/crm');
  await page.waitForSelector('#crmBody .admin-tabs');
  // Pick whichever status tab has leads (earlier tests/runs may have moved them).
  for (const label of ['Шинэ', 'Холбогдсон', 'Хаагдсан']) {
    if (await page.locator('.crm-row').count()) break;
    await page.click(`#crmBody .mytab:has-text("${label}")`);
    await page.waitForTimeout(800);
  }
  await expect(page.locator('.crm-row').first()).toBeVisible();
  await shot(page, info, 'crm');
  const first = page.locator('.crm-row').first();
  const cur = await first.locator('select[id^="crmStatus_"]').inputValue();
  await first.locator('select[id^="crmStatus_"]').selectOption(cur === 'contacted' ? 'closed' : 'contacted');
  await first.locator('button:has-text("Хадгалах")').click();
  await expect(page.locator('#toast')).toContainText('Хадгалагдлаа');

  await page.click('.mytab:has-text("Хэлцэл")');
  // nogoon-nuur has <3 listings, so extra deals here never change other tests' expectations.
  await page.selectOption('#salesComplex', 'nogoon-nuur');
  await page.fill('#salesPaste', '2026-10-01, 410, 70, 2\n2026-10-15\t600\t101\t3\nбуруу мөр');
  await expect(page.locator('#salesPreview')).toContainText('2 мөр зөв');
  page.once('dialog', (d) => d.accept());
  await page.click('#crmBody button:has-text("Хадгалах")');
  await expect(page.locator('#salesExisting tbody tr', { hasText: '2026-10-15' }).first()).toBeVisible();
  await expect(page.locator('#salesExisting tbody tr', { hasText: '2026-10-01' }).first()).toBeVisible();

  await page.click('.mytab:has-text("Хотхон")');
  await page.selectOption('#cxEditSel', 'zaisan-tolt');
  // 2400×1800 PNG generated in-page so the ≤1600px compression path is exercised.
  const pngB64 = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 2400; c.height = 1800; const g = c.getContext('2d'); g.fillStyle = '#1E5BFF'; g.fillRect(0, 0, 2400, 1800); return c.toDataURL('image/png').split(',')[1]; });
  await page.setInputFiles('#imgFiles', { name: 'big.png', mimeType: 'image/png', buffer: Buffer.from(pngB64, 'base64') });
  await page.click('#crmBody button:has-text("Оруулах")');
  await expect(page.locator('#imgProgress')).toContainText('1/1 зураг оруулагдлаа', { timeout: 30000 });
  const dims = await page.locator('#cxPhotosPreview img').first().evaluate((img) => new Promise((res) => { if (img.complete) res([img.naturalWidth, img.naturalHeight]); else img.onload = () => res([img.naturalWidth, img.naturalHeight]); }));
  expect(Math.max(...dims)).toBeLessThanOrEqual(1600);
});

test('14. Admin dashboard and loan calculator still work', async ({ page }) => {
  await login(page, OWNER);
  await page.goto('/#admin');
  await expect(page.locator('.admin-nav-item')).toHaveCount(7);
  // On tablet/mobile the admin nav is an off-canvas sidebar behind the menu button.
  if (await page.locator('.admin-topbar-menu-btn').isVisible()) await page.click('.admin-topbar-menu-btn');
  await page.click('.admin-nav-item:has-text("Үнэ, лид, хэлцэл")');
  await expect(page.locator('#adminSectionContent a[href="/crm"]')).toBeVisible();
  await page.goto('/#calc');
  await expect(page.locator('#bankTabs .bank-tab')).toHaveCount(BANKS.length + 1);
  const firstVerified = BANKS.findIndex((b) => b.verified && /\d/.test(b.annualRateText));
  await page.click(`#bankTabs .bank-tab[data-idx="${firstVerified}"]`);
  await expect(page.locator('#monthlyAmt')).toContainText('₮');
  await expect(page.locator('#bankInfoCard')).toContainText('Шалгасан:');
});

test('15. Add listing wizard opens for a signed-in user and requires consent', async ({ page }) => {
  await login(page, USER);
  await page.evaluate(() => openAddListing());
  await expect(page.locator('#modal.open')).toBeVisible();
  const src = await page.evaluate(() => submitListing.toString());
  expect(src).toContain("consentGiven('addConsent')");
});

test('16. Mobile/tablet chrome: bottom nav call button, mobile menu', async ({ page }, info) => {
  test.skip(info.project.name === 'desktop', 'mobile chrome only');
  await page.goto('/');
  await expect(page.locator('#mbn-call')).toBeVisible();
  await page.click('.mobile-toggle');
  await expect(page.locator('#mobileMenu a[href="/hotlist"]')).toBeVisible();
  await page.click('#mobileMenu a[href="/hotlist"]');
  await expect(page.locator('.route-title')).toContainText('хямд');
  await shot(page, info, 'mobile-hotlist');
});

test('17. PWA: service worker active with the current cache version, manifest OK', async ({ page }) => {
  await page.goto('/');
  const keys = await page.evaluate(async () => { await navigator.serviceWorker.ready; await new Promise((r) => setTimeout(r, 1500)); return caches.keys(); });
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').match(/const CACHE = '([^']+)'/)[1];
  expect(keys).toContain(sw);
  expect(keys.filter((k) => k.startsWith('bairx-') && k !== sw)).toEqual([]);
  const m = await page.request.get('/manifest.json');
  expect(m.status()).toBe(200);
});

test('18. No broken internal links (home, footer, route pages)', async ({ page }) => {
  const hrefs = new Set();
  for (const p of ['/', '/complexes', '/hotlist', '/b/250', '/market']) {
    await page.goto(p);
    // Firestore keeps a long-poll open, so "networkidle" never fires — wait for content.
    await page.waitForSelector('#routeContent .route-loading', { state: 'detached' }).catch(() => {});
    await page.waitForTimeout(1500);
    (await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href')))).forEach((h) => hrefs.add(h.split('#')[0] || '/'));
  }
  const bad = [];
  for (const h of hrefs) { const r = await page.request.get(h); if (r.status() !== 200) bad.push(r.status() + ' ' + h); }
  expect(bad).toEqual([]);
});

// ---------- Phase 1: home market block, building chart, /market, short paths ----------
test('19. Home market block: real stats, building chart, hot list, FAQ', async ({ page }, info) => {
  await page.goto('/');
  await page.waitForSelector('#homeMarket .mk-stats');
  // Building chart: only complexes whose average is usable; tallest (most expensive) first.
  const blds = page.locator('#homeMarket .sky-bld');
  await expect(blds.first()).toBeVisible();
  await expect(blds.first()).toHaveAttribute('aria-label', /Олимп тауэр.*: 6\.00 сая ₮\/м²/);
  await expect(page.locator('#homeMarket .sky-bld[href="/complex/zaisan-tolt"]')).toHaveAttribute('aria-label', /Зайсан Тольт.*: 4\.90 сая ₮\/м²/);
  const prices = await blds.evaluateAll((els) => els.map((e) => parseFloat(e.querySelector('.sky-price').textContent)));
  expect(prices).toEqual([...prices].sort((a, b) => b - a)); // expensive → cheap
  await expect(page.locator('#homeMarket .sky-bld', { hasText: 'Ногоон нуур' })).toHaveCount(0);
  // Stats strip comes from siteStats/summary written by the Cloud Function in test 1.
  const summary = (await emulatorDocs('siteStats')).find((d) => d.id === 'summary').f;
  await expect(page.locator('#homeMarket .mk-stat').nth(1).locator('strong')).toHaveText(String(summary.complexCount.integerValue));
  await expect(page.locator('#homeMarket .hot-mini')).toHaveCount(1);
  await expect(page.locator('#homeFaq .faq-item')).toHaveCount(6);
  await shot(page, info, 'home-market');
});

test('20. /market: chart, district and listing-vs-deal tables; building click opens complex', async ({ page }, info) => {
  await route(page, '/market');
  await expect(page.locator('#routeContent h1')).toHaveText('Орон сууцны зах зээл');
  await expect(page.locator('#routeContent .data-table').first()).toBeVisible();
  await expect(page.locator('#routeContent .data-table', { hasText: 'Хэлцлийн 1 м² (12 сар)' })).toContainText('Зайсан Тольт');
  await shot(page, info, 'market');
  await page.locator('#routeContent .sky-bld[href="/complex/zaisan-tolt"]').click();
  await page.waitForURL(/\/complex\/zaisan-tolt$/);
  await expect(page.locator('#routeContent h1')).toContainText('Зайсан Тольт');
});

test('21. Short paths open the existing pages and survive a refresh', async ({ page }) => {
  for (const [p, id] of [['/listings', 'listings'], ['/rent', 'rent'], ['/loan', 'calc'], ['/new-projects', 'newdev']]) {
    const r = await page.goto(p);
    expect(r.status(), p).toBe(200);
    await expect(page.locator('#' + id)).toHaveClass(/page-active/);
  }
});
