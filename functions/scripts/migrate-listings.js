#!/usr/bin/env node
/* Migrates existing listings/{id} docs to the price-data schema:
 *   complexId, mlsId, areaM2, pricePerM2, floorNum, source, priceHistory[], status
 * and (with --create-complexes) creates a complexes/{complexId} doc for every complex name
 * found on a listing that has no catalogue entry yet.
 *
 * DRY RUN by default — prints what it would change and writes nothing.
 *
 *   cd functions && npm install
 *   set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json   (PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="...")
 *   npm run migrate                                   # dry run
 *   npm run migrate:apply                             # write listings
 *   node scripts/migrate-listings.js --apply --create-complexes
 *
 * Idempotent: a field that already has a value is never overwritten, so it is safe to re-run.
 */
const admin = require('firebase-admin');
const P = require('../pricing.js'); // copied from ../js/pricing.js by `npm run copy-shared`

const APPLY = process.argv.includes('--apply');
const CREATE_COMPLEXES = process.argv.includes('--create-complexes');

admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'bairx-fd502' });
const db = admin.firestore();

function isoDate(ts) {
  const ms = P.toMs(ts);
  return ms ? new Date(ms).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function patchFor(id, d) {
  const patch = {};
  const complexName = d.complex || d.buildingName || '';
  const category = d.category || d.cat || 'apartment';
  if (!d.complexId && complexName) patch.complexId = P.slugify(complexName);
  if (!d.mlsId) patch.mlsId = 'BX-' + id.slice(0, 8).toUpperCase();
  if (d.areaM2 == null && P.num(d.area) != null) patch.areaM2 = P.num(d.area);
  if (d.pricePerM2 == null && category !== 'rent') {
    const ppm = P.pricePerM2(d.price, d.areaM2 != null ? d.areaM2 : d.area);
    if (ppm != null) patch.pricePerM2 = P.round(ppm, 4);
  }
  if (d.floorNum == null) {
    const f = P.parseFloorNum(d.floor);
    if (f != null) patch.floorNum = f;
  }
  if (!d.source) patch.source = 'user';
  if (!Array.isArray(d.priceHistory) && P.num(d.price) != null) {
    patch.priceHistory = [{ price: P.num(d.price), at: isoDate(d.createdAt) }];
  }
  if (!d.status) patch.status = 'pending'; // never auto-publish an unreviewed legacy doc
  return patch;
}

(async () => {
  const snap = await db.collection('listings').get();
  console.log(`${snap.size} listings · mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);
  const complexesSeen = new Map();
  let changed = 0;
  let batch = db.batch(), inBatch = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    const patch = patchFor(doc.id, d);
    const cid = patch.complexId || d.complexId;
    if (cid && !complexesSeen.has(cid)) complexesSeen.set(cid, { name: d.complex || d.buildingName || cid, district: d.district || '', khoroo: d.khoroo || null });
    if (!Object.keys(patch).length) continue;
    changed++;
    console.log(doc.id, JSON.stringify(patch));
    if (APPLY) {
      batch.update(doc.ref, patch);
      if (++inBatch === 400) { await batch.commit(); batch = db.batch(); inBatch = 0; }
    }
  }
  if (APPLY && inBatch) await batch.commit();
  console.log(`${changed} listings ${APPLY ? 'updated' : 'would be updated'}`);

  if (CREATE_COMPLEXES) {
    let created = 0;
    for (const [id, c] of complexesSeen) {
      const ref = db.collection('complexes').doc(id);
      if ((await ref.get()).exists) continue;
      created++;
      console.log('complex', id, JSON.stringify(c));
      if (APPLY) await ref.set(Object.assign({ id, photos: [], yearBuilt: null, floors: null, createdAt: admin.firestore.FieldValue.serverTimestamp() }, c));
    }
    console.log(`${created} complexes ${APPLY ? 'created' : 'would be created'}`);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
