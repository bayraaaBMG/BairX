// Storage security-rules tests (emulator). Storage rules read roles cross-service from the
// Firestore emulator, so both run together: npm run test:rules
const test = require('node:test');
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, setDoc } = require('firebase/firestore');
const { ref, uploadBytes, getBytes, deleteObject } = require('firebase/storage');

const OWNER_EMAIL = 'bbayraaa20@gmail.com';
let env;
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const img = { contentType: 'image/jpeg' };

test.before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-bairx',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: fs.readFileSync(path.join(__dirname, '..', 'storage.rules'), 'utf8'), host: '127.0.0.1', port: 9199 }
  });
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/adminUid'), { role: 'admin' });
    await setDoc(doc(db, 'users/managerUid'), { role: 'manager' });
    await setDoc(doc(db, 'users/userUid'), { role: 'user' });
    await uploadBytes(ref(ctx.storage(), 'listing-images/userUid/existing.jpg'), png, img);
  });
});
test.after(async () => { await env.cleanup(); });

// The Storage emulator's cross-service firestore.get() (used by isStaff()) intermittently
// fails under load; positive staff assertions retry up to 3 times. Denials never retry.
async function succeedsWithRetry(fn) {
  let last;
  for (let i = 0; i < 3; i++) { try { return await assertSucceeds(fn()); } catch (e) { last = e; await new Promise(r => setTimeout(r, 300)); } }
  throw last;
}
const st = (uid, token) => (uid ? env.authenticatedContext(uid, token || {}) : env.unauthenticatedContext()).storage();

test('listing-images: owner uploads into own folder only, images only', async () => {
  await assertSucceeds(uploadBytes(ref(st('userUid'), 'listing-images/userUid/a.jpg'), png, img));
  await assertFails(uploadBytes(ref(st('userUid'), 'listing-images/adminUid/a.jpg'), png, img));
  await assertFails(uploadBytes(ref(st(null), 'listing-images/userUid/b.jpg'), png, img));
  await assertFails(uploadBytes(ref(st('userUid'), 'listing-images/userUid/c.txt'), png, { contentType: 'text/plain' }));
});
test('listing-images: public read, only the owner deletes', async () => {
  await assertSucceeds(getBytes(ref(st(null), 'listing-images/userUid/existing.jpg')));
  await assertFails(deleteObject(ref(st('adminUid'), 'listing-images/userUid/existing.jpg')));
});
test('complex-images: staff upload, public read, users cannot write', async () => {
  await succeedsWithRetry(() => uploadBytes(ref(st('adminUid'), 'complex-images/zaisan/1.jpg'), png, img));
  await succeedsWithRetry(() => uploadBytes(ref(st('managerUid'), 'complex-images/zaisan/2.jpg'), png, img));
  await assertSucceeds(uploadBytes(ref(st('ownerUid', { email: OWNER_EMAIL, email_verified: true }), 'complex-images/zaisan/3.jpg'), png, img));
  await assertFails(uploadBytes(ref(st('ownerUid2', { email: OWNER_EMAIL, email_verified: false }), 'complex-images/zaisan/4.jpg'), png, img));
  await assertFails(uploadBytes(ref(st('userUid'), 'complex-images/zaisan/5.jpg'), png, img));
  await assertSucceeds(getBytes(ref(st(null), 'complex-images/zaisan/1.jpg')));
});
test('admin-listing-images: staff only', async () => {
  await succeedsWithRetry(() => uploadBytes(ref(st('adminUid'), 'admin-listing-images/L1/1.jpg'), png, img));
  await assertFails(uploadBytes(ref(st('userUid'), 'admin-listing-images/L1/2.jpg'), png, img));
});
test('everything else is closed', async () => {
  await assertFails(uploadBytes(ref(st('adminUid'), 'random/x.jpg'), png, img));
  await assertFails(getBytes(ref(st(null), 'random/x.jpg')));
});
