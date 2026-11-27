// Firestore security-rules tests for every collection added in the growth sprint.
// Needs the Firestore emulator (Java 11+):   cd tests && npm install && npm run test:rules
const test = require('node:test');
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, collection, serverTimestamp } = require('firebase/firestore');

const OWNER_EMAIL = 'bbayraaa20@gmail.com';
let env;

test.before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-bairx',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 }
  });
});
test.after(async () => { await env.cleanup(); });
test.beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/adminUid'), { role: 'admin' });
    await setDoc(doc(db, 'users/managerUid'), { role: 'manager' });
    await setDoc(doc(db, 'users/agentUid'), { role: 'agent' });
    await setDoc(doc(db, 'users/userUid'), { role: 'user' });
    await setDoc(doc(db, 'leads/lead1'), { type: 'valuation', phone: '99112233', name: 'Бат', consent: true, status: 'new', assignedTo: 'agentUid' });
    await setDoc(doc(db, 'leads/lead2'), { type: 'call', phone: '88112233', name: 'Сараа', consent: true, status: 'new' });
    await setDoc(doc(db, 'sales/s1'), { complexId: 'zaisan', date: '2026-01-10', price: 400, areaM2: 80, rooms: 3 });
    await setDoc(doc(db, 'complexStats/zaisan'), { avgPpm2: 5 });
    await setDoc(doc(db, 'optoutRequests/o1'), { name: 'Бат', phone: '99112233', status: 'new' });
    await setDoc(doc(db, 'events/e1'), { type: 'page_view' });
    await setDoc(doc(db, 'alerts/a1'), { userId: 'userUid', channel: 'push', budgetMax: 500 });
  });
});

const anon = () => env.unauthenticatedContext().firestore();
const as = (uid, email) => env.authenticatedContext(uid, email ? { email } : {}).firestore();
const validLead = (o) => Object.assign({ type: 'valuation', phone: '99112233', name: 'Бат', consent: true, status: 'new', source: 'direct', createdAt: serverTimestamp() }, o);

// ---------- leads ----------
test('leads: the public can NOT read leads (get or list)', async () => {
  await assertFails(getDoc(doc(anon(), 'leads/lead1')));
  await assertFails(getDocs(collection(anon(), 'leads')));
});
test('leads: a signed-in regular user can NOT read leads', async () => {
  await assertFails(getDoc(doc(as('userUid'), 'leads/lead1')));
  await assertFails(getDocs(collection(as('userUid'), 'leads')));
});
test('leads: the public CAN create a valid lead with consent', async () => {
  await assertSucceeds(addDoc(collection(anon(), 'leads'), validLead()));
  await assertSucceeds(addDoc(collection(anon(), 'leads'), validLead({ type: 'alert', budget: 500 })));
});
test('leads: create is rejected without consent, bad phone, bad type or extra fields', async () => {
  await assertFails(addDoc(collection(anon(), 'leads'), validLead({ consent: false })));
  const noConsent = validLead(); delete noConsent.consent;
  await assertFails(addDoc(collection(anon(), 'leads'), noConsent));
  await assertFails(addDoc(collection(anon(), 'leads'), validLead({ phone: '123' })));
  await assertFails(addDoc(collection(anon(), 'leads'), validLead({ type: 'spam' })));
  await assertFails(addDoc(collection(anon(), 'leads'), validLead({ status: 'closed' })));
  await assertFails(addDoc(collection(anon(), 'leads'), validLead({ assignedTo: 'agentUid' })));
  await assertFails(addDoc(collection(anon(), 'leads'), validLead({ uid: 'someoneElse' })));
});
test('leads: the public can NOT update or delete a lead', async () => {
  await assertFails(updateDoc(doc(anon(), 'leads/lead1'), { status: 'closed' }));
  await assertFails(deleteDoc(doc(anon(), 'leads/lead1')));
});
test('leads: admin & manager read all; agent reads only assigned', async () => {
  await assertSucceeds(getDocs(collection(as('adminUid'), 'leads')));
  await assertSucceeds(getDocs(collection(as('managerUid'), 'leads')));
  await assertSucceeds(getDocs(collection(as('ownerUid', OWNER_EMAIL), 'leads')));
  await assertSucceeds(getDoc(doc(as('agentUid'), 'leads/lead1')));
  await assertFails(getDoc(doc(as('agentUid'), 'leads/lead2')));
});
test('leads: CRM update — status/notes only, contact details immutable', async () => {
  await assertSucceeds(updateDoc(doc(as('managerUid'), 'leads/lead2'), { status: 'contacted', notes: 'Залгасан' }));
  await assertFails(updateDoc(doc(as('managerUid'), 'leads/lead2'), { phone: '11111111' }));
  await assertFails(updateDoc(doc(as('managerUid'), 'leads/lead2'), { status: 'won' }));
  await assertSucceeds(updateDoc(doc(as('agentUid'), 'leads/lead1'), { status: 'closed' }));
  await assertFails(updateDoc(doc(as('agentUid'), 'leads/lead1'), { assignedTo: 'userUid' }));
});

// ---------- sales ----------
test('sales: only staff can read or write', async () => {
  await assertFails(getDoc(doc(anon(), 'sales/s1')));
  await assertFails(getDocs(collection(as('userUid'), 'sales')));
  await assertSucceeds(getDocs(collection(as('adminUid'), 'sales')));
  await assertFails(addDoc(collection(as('userUid'), 'sales'), { complexId: 'zaisan', date: '2026-01-01', price: 1, areaM2: 1 }));
  await assertSucceeds(addDoc(collection(as('adminUid'), 'sales'), { complexId: 'zaisan', date: '2026-01-01', price: 400, areaM2: 80, rooms: 3 }));
  await assertFails(addDoc(collection(as('adminUid'), 'sales'), { complexId: 'zaisan', date: '01/02/2026', price: 400, areaM2: 80 }));
});

// ---------- complexStats / siteStats / complexes ----------
test('complexStats & siteStats: public read, nobody writes from a client', async () => {
  await assertSucceeds(getDoc(doc(anon(), 'complexStats/zaisan')));
  await assertFails(setDoc(doc(anon(), 'complexStats/zaisan'), { avgPpm2: 1 }));
  await assertFails(setDoc(doc(as('adminUid'), 'complexStats/zaisan'), { avgPpm2: 1 }));
  await assertSucceeds(getDoc(doc(anon(), 'siteStats/hotlist')));
  await assertFails(setDoc(doc(as('ownerUid', OWNER_EMAIL), 'siteStats/hotlist'), { items: [] }));
});
test('complexes: public read, staff write', async () => {
  await assertSucceeds(getDocs(collection(anon(), 'complexes')));
  await assertFails(setDoc(doc(as('userUid'), 'complexes/x'), { name: 'X' }));
  await assertSucceeds(setDoc(doc(as('managerUid'), 'complexes/x'), { name: 'Зайсан Тольт', district: 'khan-uul' }));
});

// ---------- alerts ----------
test('alerts: owner-only', async () => {
  await assertSucceeds(getDoc(doc(as('userUid'), 'alerts/a1')));
  await assertFails(getDoc(doc(as('agentUid'), 'alerts/a1')));
  await assertFails(getDoc(doc(anon(), 'alerts/a1')));
  await assertSucceeds(addDoc(collection(as('userUid'), 'alerts'), { userId: 'userUid', channel: 'email', budgetMax: 300, rooms: 2 }));
  await assertFails(addDoc(collection(as('userUid'), 'alerts'), { userId: 'agentUid', channel: 'email' }));
  await assertFails(addDoc(collection(as('userUid'), 'alerts'), { userId: 'userUid', channel: 'sms' }));
});

// ---------- events ----------
test('events: anonymous create only, staff read', async () => {
  const ev = { type: 'contact_click', channel: 'tel', page: 'listing', listingRef: 'abc', complexId: '', source: 'direct', createdAt: serverTimestamp() };
  await assertSucceeds(addDoc(collection(anon(), 'events'), ev));
  await assertFails(addDoc(collection(anon(), 'events'), Object.assign({}, ev, { phone: '99112233' })));
  await assertFails(getDocs(collection(anon(), 'events')));
  await assertSucceeds(getDocs(collection(as('adminUid'), 'events')));
});

// ---------- optoutRequests ----------
test('optoutRequests: public create with consent, staff read', async () => {
  const req = { listingRef: 'x', reason: 'not_mine', name: 'Бат', phone: '99112233', note: '', consent: true, status: 'new', source: 'direct', createdAt: serverTimestamp() };
  await assertSucceeds(addDoc(collection(anon(), 'optoutRequests'), req));
  await assertFails(addDoc(collection(anon(), 'optoutRequests'), Object.assign({}, req, { consent: false })));
  await assertFails(getDoc(doc(anon(), 'optoutRequests/o1')));
  await assertSucceeds(getDoc(doc(as('managerUid'), 'optoutRequests/o1')));
});

// ---------- review fixes ----------
test('users: a blocked user can NOT delete (and so recreate) their profile', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'users/blockedUid'), { role: 'user', blocked: true }));
  await assertFails(deleteDoc(doc(as('blockedUid'), 'users/blockedUid')));
});
test('listings: an active listing cannot change price/complex without going back to pending', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'listings/l1'), { ownerId: 'userUid', status: 'active', price: 500, area: 100, complexId: 'zaisan', reportCount: 0 }));
  await assertFails(updateDoc(doc(as('userUid'), 'listings/l1'), { price: 1 }));
  await assertFails(updateDoc(doc(as('userUid'), 'listings/l1'), { complexId: 'other' }));
  await assertSucceeds(updateDoc(doc(as('userUid'), 'listings/l1'), { price: 450, status: 'pending' }));
});
test('listings: complexId must be a slug', async () => {
  const base = { ownerId: 'userUid', status: 'pending', listingVerified: false, price: 1, area: 1 };
  await assertSucceeds(addDoc(collection(as('userUid'), 'listings'), Object.assign({ complexId: 'zaisan-tolt' }, base)));
  await assertFails(addDoc(collection(as('userUid'), 'listings'), Object.assign({ complexId: "x'-alert(1)-'" }, base)));
});
test('leads: optional fields are type-checked', async () => {
  await assertFails(addDoc(collection(anon(), 'leads'), validLead({ areaM2: '<img src=x onerror=alert(1)>' })));
  await assertSucceeds(addDoc(collection(anon(), 'leads'), validLead({ areaM2: 72, rooms: 3, estimate: 360 })));
});
test('leads: a signed-in user can read/delete only the leads they submitted', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'leads/mine'), { type: 'valuation', phone: '99112233', name: 'Б', consent: true, status: 'new', uid: 'userUid' }));
  await assertSucceeds(getDoc(doc(as('userUid'), 'leads/mine')));
  await assertFails(getDoc(doc(as('userUid'), 'leads/lead1')));
  await assertSucceeds(deleteDoc(doc(as('userUid'), 'leads/mine')));
});

test('users: a phone-auth user (token without email) can create their own profile as role user', async () => {
  const phoneDb = env.authenticatedContext('phoneUid', { phone_number: '+97699112233' }).firestore();
  await assertSucceeds(setDoc(doc(phoneDb, 'users/phoneUid'), { uid: 'phoneUid', firstName: 'Хэрэглэгч', role: 'user' }));
  await assertFails(setDoc(doc(phoneDb, 'users/phoneUid2'), { uid: 'phoneUid2', role: 'user' }));
});

// ---------- users self-delete ----------
test('users: a user can delete their own profile, never someone else\'s or the owner\'s', async () => {
  await assertSucceeds(deleteDoc(doc(as('userUid'), 'users/userUid')));
  await assertFails(deleteDoc(doc(as('userUid'), 'users/adminUid')));
  await env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'users/ownerUid'), { role: 'owner' }));
  await assertFails(deleteDoc(doc(as('ownerUid', OWNER_EMAIL), 'users/ownerUid')));
});
