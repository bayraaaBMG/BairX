// Seeds the LOCAL Firebase Emulator Suite (never production) with clearly-labelled test data
// for the browser tests. Refuses to run unless the emulator env vars are set, i.e. only
// inside `firebase emulators:exec`.
const PROJECT = process.env.GCLOUD_PROJECT || 'bairx-fd502';
const FS = process.env.FIRESTORE_EMULATOR_HOST;
const AUTH = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (!FS || !AUTH) { console.error('Refusing to seed: emulator hosts not set (run inside firebase emulators:exec).'); process.exit(1); }

const OWNER = { email: 'bbayraaa20@gmail.com', password: 'test-owner-pass', name: 'Тест Эзэмшигч' };
const USER = { email: 'tester@example.com', password: 'test-user-pass', name: 'Тест Хэрэглэгч' };

function val(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(val) } };
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, val(x)])) } };
  return { stringValue: String(v) };
}
async function put(path, data) {
  const url = `http://${FS}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`;
  const r = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, val(v)])) }) });
  if (!r.ok) throw new Error(path + ' ' + r.status + ' ' + await r.text());
}
async function signUp(u) {
  const r = await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: u.email, password: u.password, displayName: u.name, returnSecureToken: true }) });
  const j = await r.json();
  if (!j.localId) throw new Error('signUp ' + JSON.stringify(j));
  await fetch(`http://${AUTH}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ localId: j.localId, emailVerified: true }) });
  return j.localId;
}

const day = 86400000, now = Date.now();
const ago = (d) => new Date(now - d * day).toISOString().slice(0, 10);

(async () => {
  // Start from an empty emulator every run (emulator-only reset endpoints).
  await fetch(`http://${FS}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
  await fetch(`http://${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
  const ownerUid = await signUp(OWNER);
  const userUid = await signUp(USER);
  await put('users/' + ownerUid, { uid: ownerUid, firstName: 'Тест', lastName: 'Эзэмшигч', email: OWNER.email, role: 'owner' });
  await put('users/' + userUid, { uid: userUid, firstName: 'Тест', lastName: 'Хэрэглэгч', email: USER.email, role: 'user' });

  const complexes = [
    { id: 'zaisan-tolt', name: 'Зайсан Тольт (ТЕСТ)', district: 'khan-uul', khoroo: 15, yearBuilt: 2022, floors: 18 },
    { id: 'olimp-tauer', name: 'Олимп тауэр (ТЕСТ)', district: 'sukhbaatar', khoroo: 1, yearBuilt: 2020, floors: 22 },
    { id: 'nogoon-nuur', name: 'Ногоон нуур (ТЕСТ)', district: 'bayangol', khoroo: 19 }
  ];
  for (const c of complexes) await put('complexes/' + c.id, Object.assign({ photos: [] }, c));

  // [complexId, price сая, area, rooms, floor]  — zaisan-tolt avg ≈ 4.9, the 4.0 one is "hot"
  const L = [
    ['zaisan-tolt', 500, 100, 3, '9/18'], ['zaisan-tolt', 364, 70, 2, '4/18'], ['zaisan-tolt', 324, 60, 2, '6/18'],
    ['zaisan-tolt', 288, 72, 2, '11/18'],
    ['olimp-tauer', 606, 101, 3, '14/22'], ['olimp-tauer', 420, 70, 2, '7/22'], ['olimp-tauer', 330, 55, 1, '3/22'],
    ['nogoon-nuur', 255, 60, 2, '6/12']
  ];
  let i = 0;
  for (const [complexId, price, area, rooms, floor] of L) {
    i++;
    await put('listings/test-listing-' + i, {
      ownerId: 'test-seller', category: 'apartment', propertyType: 'apartment', status: 'active',
      title: `ТЕСТ зар ${i} — ${rooms} өрөө`, loc: 'Тест байршил', district: complexes.find(c => c.id === complexId).district,
      complex: complexes.find(c => c.id === complexId).name, complexId, price, area, areaM2: area, rooms, floor,
      pricePerM2: Math.round(price / area * 10000) / 10000, source: 'user', mlsId: 'BX-TEST' + i,
      priceHistory: [{ price, at: ago(30) }], sellerName: 'Тест борлуулагч', sellerPhone: '99112233', sellerType: 'Агент',
      images: [], img: '', features: [], description: 'Emulator-ийн тест зар', listingVerified: true, reportCount: 0,
      viewCount: 0, createdAt: new Date(now - i * 3600000), expiresAt: now + 30 * day, bumpedAt: now - i
    });
  }

  // Sales (staff-only collection). zaisan-tolt has ≥3 deals in each period → growth shown.
  const S = [
    ['zaisan-tolt', '2023-03-10', 400, 100, 3], ['zaisan-tolt', '2023-06-15', 280, 70, 2], ['zaisan-tolt', '2023-10-01', 200, 50, 1],
    ['zaisan-tolt', ago(400), 450, 100, 3], ['zaisan-tolt', ago(500), 315, 70, 2], ['zaisan-tolt', ago(600), 225, 50, 1],
    ['zaisan-tolt', ago(20), 490, 100, 3], ['zaisan-tolt', ago(90), 343, 70, 2], ['zaisan-tolt', ago(200), 245, 50, 1],
    ['olimp-tauer', ago(30), 580, 100, 3], ['olimp-tauer', ago(60), 400, 70, 2]
  ];
  let j = 0;
  for (const [complexId, date, price, areaM2, rooms] of S) await put('sales/test-sale-' + (++j), { complexId, date, price, areaM2, rooms });

  console.log(JSON.stringify({ seeded: true, ownerUid, userUid, complexes: complexes.length, listings: L.length, sales: S.length }));
})().catch(e => { console.error(e); process.exit(1); });
