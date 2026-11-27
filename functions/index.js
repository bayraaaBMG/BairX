/* BairX Cloud Functions
 *
 *  dailyComplexStats   — scheduled, once a day 03:00 Asia/Ulaanbaatar. Recomputes every
 *                        complexStats/{complexId} doc, siteStats/hotlist and siteStats/summary
 *                        from listings + sales, using ONLY the formulas in pricing.js
 *                        (a copy of ../js/pricing.js made at deploy time — see firebase.json).
 *  recomputeStatsNow   — callable, staff only: same job on demand (Admin → "Одоо шинэчлэх").
 *  onListingActivated  — Firestore trigger: when a listing becomes status=='active', match it
 *                        against alerts + saved searches and notify (in-app, Web Push, e-mail).
 *
 * Requires the Firebase Blaze plan (scheduled functions). Set a budget alert in the Google
 * Cloud console before deploying — see docs/DEPLOY.md.
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { setGlobalOptions, logger } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const P = require('./pricing.js');

admin.initializeApp();
const db = admin.firestore();
const { FieldValue } = require('firebase-admin/firestore');

setGlobalOptions({ region: 'asia-east2', maxInstances: 2, memory: '512MiB' });

const SITE_URL = 'https://bairx.vercel.app';
const OWNER_EMAIL = 'bbayraaa20@gmail.com';
const STAFF_ROLES = ['owner', 'admin', 'manager'];

// Calendar date in Ulaanbaatar (UTC+8), "YYYY-MM-DD" — what the UI prints as "Шинэчилсэн".
function ubDate(ms) {
  return new Date((ms == null ? Date.now() : ms) + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

function listingFromDoc(doc) { return P.normalizeListing(doc.id, doc.data()); }

async function commitInChunks(writes) {
  for (let i = 0; i < writes.length; i += 400) {
    const batch = db.batch();
    writes.slice(i, i + 400).forEach(w => batch.set(w.ref, w.data, w.opts || {}));
    await batch.commit();
  }
}

async function recomputeAll() {
  const started = Date.now();
  const [listSnap, salesSnap, cxSnap] = await Promise.all([
    db.collection('listings').where('status', '==', 'active').get(),
    db.collection('sales').get(),
    db.collection('complexes').get()
  ]);

  // Same pure builder the admin "manual recompute" uses (js/pricing.js buildAllStats).
  const complexes = Object.fromEntries(cxSnap.docs.map(d => [d.id, d.data()]));
  const allListings = listSnap.docs.map(listingFromDoc);
  const sales = salesSnap.docs.map(d => d.data());
  const today = ubDate(started);
  const built = P.buildAllStats(complexes, allListings, sales, started, today);
  const ids = new Set(built.ids);
  const hot = built.hotlist.items;
  const writes = [];
  for (const id of built.ids) {
    writes.push({ ref: db.collection('complexStats').doc(id), data: Object.assign({}, built.stats[id], { source: 'function', updatedAt: FieldValue.serverTimestamp() }) });
  }
  writes.push({ ref: db.doc('siteStats/hotlist'), data: Object.assign({}, built.hotlist, { updatedAt: FieldValue.serverTimestamp() }) });
  writes.push({ ref: db.doc('siteStats/summary'), data: Object.assign({}, built.summary, {
    source: 'function', updatedAt: FieldValue.serverTimestamp(), tookMs: Date.now() - started
  }) });

  // Complexes that no longer have a catalogue entry, active listings or sales: delete their
  // old stats doc so a frozen average/"Шинэчилсэн" date never stays live on the site.
  const existing = await db.collection('complexStats').listDocuments();
  const stale = existing.filter(ref => !ids.has(ref.id));
  for (let i = 0; i < stale.length; i += 400) {
    const batch = db.batch();
    stale.slice(i, i + 400).forEach(ref => batch.delete(ref));
    await batch.commit();
  }

  await commitInChunks(writes);
  logger.info('complexStats recomputed', { complexes: ids.size, listings: allListings.length, sales: salesSnap.size, hot: hot.length });
  return { complexes: ids.size, listings: allListings.length, sales: salesSnap.size, hot: hot.length, updatedDate: today };
}

exports.dailyComplexStats = onSchedule({ schedule: 'every day 03:00', timeZone: 'Asia/Ulaanbaatar', timeoutSeconds: 300 }, async () => {
  await recomputeAll();
});

async function isStaffUid(uid, email, emailVerified) {
  if (email && emailVerified === true && email === OWNER_EMAIL) return true;
  const snap = await db.doc('users/' + uid).get();
  return STAFF_ROLES.includes(snap.exists ? (snap.data().role || 'user') : 'user');
}

exports.recomputeStatsNow = onCall({ timeoutSeconds: 300 }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Нэвтэрнэ үү');
  if (!(await isStaffUid(req.auth.uid, req.auth.token.email, req.auth.token.email_verified))) throw new HttpsError('permission-denied', 'Зөвхөн админ');
  return recomputeAll();
});

// ---------------------------------------------------------------------------------------
// Alerts: a listing that just became active is matched against
//   - alerts/{id}         { userId, budgetMax, rooms, complexId?, channel, onlyHot }
//   - savedSearches/{id}  (the existing "Дагасан хайлт"; channels: ['inapp','push','email'])
// and each match gets one in-app notification (deduplicated) plus push/e-mail per channel.
// E-mail is queued in the `mail` collection, the format the official "Trigger Email"
// Firebase extension consumes — install that extension (SMTP/SendGrid) to actually send.
// Telegram is the second-phase channel and is not sent yet.
// ---------------------------------------------------------------------------------------
function alertMatches(l, a, hotInfo) {
  // Alerts are about sale apartments ("шинэ хямд зар"); rentals/houses/land never match.
  if (!P.isStatsEligible(l)) return false;
  if (a.budgetMax != null && Number(l.price) > Number(a.budgetMax)) return false;
  if (a.rooms != null && a.rooms !== '' && a.rooms !== 'all') {
    const r = P.parseRooms(l.rooms), want = parseInt(a.rooms, 10);
    if (r == null || (want >= 4 ? r < 4 : r !== want)) return false;
  }
  if (a.complexId && a.complexId !== l.complexId) return false;
  if (a.onlyHot !== false && !hotInfo) return false;
  return true;
}

function savedSearchMatches(l, s) {
  const cat = l.category || l.cat;
  if (cat === 'rent' && s.category !== 'rent') return false;
  if (s.category && s.category !== 'all' && cat !== s.category) return false;
  if (s.district && s.district !== 'all' && l.district !== s.district) return false;
  if (s.rooms && s.rooms !== 'all') {
    const r = P.parseRooms(l.rooms), want = parseInt(s.rooms, 10);
    if (r == null || (want === 4 ? r < 4 : r !== want)) return false;
  }
  const price = Number(l.price);
  if (cat !== 'rent' && (price < (parseFloat(s.priceMin) || 0) || price > (parseFloat(s.priceMax) || Infinity))) return false;
  const area = Number(l.area);
  if (area < (parseFloat(s.areaMin) || 0) || area > (parseFloat(s.areaMax) || Infinity)) return false;
  if (s.keyword) {
    const hay = [l.title, l.loc, l.district, String(l.rooms), String(l.price)].join(' ').toLowerCase();
    if (!String(s.keyword).toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false;
  }
  return true;
}

async function notifyUser(uid, channels, n) {
  // In-app (deduplicated on user + listing + source doc, same shape js/notifications.js writes)
  const dup = await db.collection('notifications').where('userId', '==', uid)
    .where('listingFsId', '==', n.listingFsId).where('sourceId', '==', n.sourceId).limit(1).get();
  if (!dup.empty) return;
  await db.collection('notifications').add({
    userId: uid, type: n.type, text: n.html, listingFsId: n.listingFsId, sourceId: n.sourceId,
    savedSearchId: n.type === 'match' ? n.sourceId : null,
    read: false, createdAt: FieldValue.serverTimestamp()
  });
  const link = SITE_URL + '/?l=' + encodeURIComponent(n.listingFsId);
  if (channels.includes('push')) {
    const tokSnap = await db.collection('pushTokens').where('userId', '==', uid).get();
    const tokens = tokSnap.docs.map(d => d.data().token).filter(Boolean);
    if (tokens.length) {
      const res = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: n.title, body: n.text },
        data: { link },   // sw.js reads data.link (no Firebase SDK in the worker)
        webpush: { fcmOptions: { link }, notification: { icon: SITE_URL + '/icon-192.png' } }
      });
      // Drop tokens FCM says are dead so we don't keep paying for them.
      res.responses.forEach((r, i) => {
        if (!r.success && /registration-token-not-registered|invalid-argument/.test(r.error?.code || '')) {
          tokSnap.docs[i].ref.delete().catch(() => {});
        }
      });
    }
  }
  if (channels.includes('email')) {
    let email = null;
    try { email = (await admin.auth().getUser(uid)).email; } catch (e) {}
    if (email) {
      await db.collection('mail').add({
        to: email,
        message: { subject: n.title, html: `<p>${n.html}</p><p><a href="${link}">Зарыг үзэх →</a></p><p style="color:#888;font-size:12px">Мэдэгдлээ BairX → Миний самбар → Хадгалсан хайлт хэсгээс зогсоож болно.</p>` },
        createdAt: FieldValue.serverTimestamp()
      });
    }
  }
}

exports.onListingActivated = onDocumentWritten('listings/{listingId}', async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const afterSnap = event.data.after;
  if (!afterSnap.exists) return;
  const after = afterSnap.data();
  if (after.status !== 'active' || (before && before.status === 'active')) return;

  const l = listingFromDoc(afterSnap);
  let hotInfo = null;
  if (l.complexId) {
    const st = await db.doc('complexStats/' + l.complexId).get();
    if (st.exists && st.data().avgPpm2 != null && st.data().listingCount >= P.MIN_LISTINGS && P.isHot(l, st.data().avgPpm2)) {
      hotInfo = { discountPct: P.discountPct(P.listingPpm2(l), st.data().avgPpm2), complexName: st.data().name };
    }
  }
  const priceText = Number(l.price) >= 1000 ? (Number(l.price) / 1000).toFixed(2) + ' тэрбум ₮' : Math.round(l.price) + ' сая ₮';
  const esc = (s) => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const [alertSnap, searchSnap] = await Promise.all([
    db.collection('alerts').get(),
    db.collection('savedSearches').get()
  ]);
  const jobs = [];
  for (const doc of alertSnap.docs) {
    const a = doc.data();
    if (a.userId === l.ownerId || a.active === false || !alertMatches(l, a, hotInfo)) continue;
    const reason = hotInfo ? ` — хотхоны дунджаас ${hotInfo.discountPct}% хямд` : '';
    jobs.push(notifyUser(a.userId, [a.channel], {
      type: 'alert', sourceId: doc.id, listingFsId: l.id,
      title: 'Шинэ хямд зар', text: `${l.title} · ${priceText}${reason}`,
      html: `Таны мэдэгдэлд тохирох шинэ зар: <strong>${esc(l.title)}</strong>, ${priceText}${esc(reason)}`
    }));
  }
  for (const doc of searchSnap.docs) {
    const s = doc.data();
    if (s.userId === l.ownerId || !savedSearchMatches(l, s)) continue;
    jobs.push(notifyUser(s.userId, Array.isArray(s.channels) ? s.channels : ['inapp'], {
      type: 'match', sourceId: doc.id, listingFsId: l.id,
      title: 'Хайлтад тохирох шинэ зар', text: `${l.title} · ${priceText}`,
      html: `"<strong>${esc(s.label || 'Хайлт')}</strong>" хайлтад тохирох шинэ зар орлоо: <strong>${esc(l.title)}</strong>, ${priceText}`
    }));
  }
  const results = await Promise.allSettled(jobs);
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length) logger.error('some alert notifications failed', { failed: failed.length, first: String(failed[0].reason) });
});

