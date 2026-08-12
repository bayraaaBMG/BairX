  // ===== ADMIN — SCAM PROTECTION DASHBOARD =====
  // There is no backend/Cloud Functions in this app, so "admin" is purely a `role` field
  // on the user's own Firestore profile doc (see firestore.rules' isAdmin()) — it can only
  // ever be set to 'admin' by hand in the Firebase Console, never through the app itself.
  // This page's own currentUser.role check below is just UX (redirect a non-admin away
  // from a page with nothing on it); the real access control is the Firestore rule that
  // denies `reports` reads and listing status/listingVerified writes to non-admins.
  let _adminLoading = false;

  async function renderAdminDashboard() {
    const el = document.getElementById('adminContent');
    if (!el) return;
    if (!currentUser || currentUser.role !== 'admin') {
      el.innerHTML = `
        <div style="text-align:center;padding:80px 20px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="1.5" style="opacity:0.4;margin:0 auto 16px;"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          <div style="font-family:'Fraunces',serif;font-size:20px;font-weight:700;margin-bottom:8px;">Хандах эрхгүй</div>
          <div style="color:var(--ink-3);font-size:14px;">Энэ хуудас зөвхөн админ эрхтэй хэрэглэгчид зориулагдсан.</div>
        </div>
      `;
      return;
    }
    if (_adminLoading) return;
    _adminLoading = true;
    el.innerHTML = `<div style="text-align:center;padding:60px;color:var(--ink-3);">Ачааллаж байна…</div>`;

    const reportsByListing = await fetchPendingReportsGrouped();
    const anomalies = computePriceAnomalies();

    const flagged = {};
    Object.keys(reportsByListing).forEach(fsId => {
      const group = reportsByListing[fsId];
      const l = listings.find(x => x.firestoreId === fsId);
      if (!l) return; // listing was deleted since the report was filed
      flagged[fsId] = flagged[fsId] || { l, reasons: [], reportIds: [] };
      flagged[fsId].reasons.push(...group.reasons.map(r => 'Мэдээлэгдсэн: ' + r));
      flagged[fsId].reportIds = group.reportIds;
    });
    anomalies.forEach(({ l, val }) => {
      if (!l.firestoreId) return;
      flagged[l.firestoreId] = flagged[l.firestoreId] || { l, reasons: [], reportIds: [] };
      flagged[l.firestoreId].reasons.push(
        `Зах зээлийн дундаж үнээс ${Math.abs(Math.round(val.diffPct * 100))}% хямд (${val.basisText})`
      );
    });

    const items = Object.values(flagged).sort((a, b) => b.reasons.length - a.reasons.length);
    _adminLoading = false;
    renderAdminList(items, Object.keys(reportsByListing).length, anomalies.length);
  }

  async function fetchPendingReportsGrouped() {
    try {
      const snap = await db.collection('reports').where('status', '==', 'pending').get();
      const map = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        const key = d.listingFsId;
        if (!key) return; // reports filed before listingFsId existed can't be matched reliably
        map[key] = map[key] || { reasons: [], reportIds: [] };
        map[key].reasons.push(d.reason);
        map[key].reportIds.push(doc.id);
      });
      return map;
    } catch(e) {
      console.error('fetchPendingReportsGrouped failed:', e.code, e.message);
      return {};
    }
  }

  // Real comparable-sales analysis (computeValuation, utils.js) — flags listings priced
  // far enough below genuine comparable listings that it's worth a human look, not a
  // fabricated "AI fraud score". Ignored when there isn't enough comparable data to trust
  // (confidence 'low'), so a listing never gets flagged from a thin sample.
  function computePriceAnomalies() {
    return listings
      .filter(l => l.userSubmitted && !l._inactive && l.cat !== 'rent' && l.firestoreId)
      .map(l => ({ l, val: computeValuation(l) }))
      .filter(x => x.val.available && x.val.confidence !== 'low' && x.val.diffPct <= -0.35)
      .sort((a, b) => a.val.diffPct - b.val.diffPct);
  }

  function renderAdminList(items, reportedCount, anomalyCount) {
    const el = document.getElementById('adminContent');
    if (!el) return;
    const summary = `
      <div class="admin-summary-row">
        <div class="admin-summary-stat"><div class="num">${items.length}</div><div class="label">Сэжигтэй зар</div></div>
        <div class="admin-summary-stat"><div class="num">${reportedCount}</div><div class="label">Мэдээлэгдсэн зар</div></div>
        <div class="admin-summary-stat"><div class="num">${anomalyCount}</div><div class="label">Огцом хямд үнэтэй зар</div></div>
      </div>
    `;
    if (items.length === 0) {
      el.innerHTML = summary + `
        <div style="text-align:center;padding:60px 20px;color:var(--ink-3);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35;margin:0 auto 12px;"><polyline points="20 6 9 17 4 12"/></svg>
          <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:700;color:var(--ink);margin-bottom:6px;">Сэжигтэй зар алга</div>
          <div style="font-size:13px;">Одоогоор мэдээлэгдсэн болон үнийн хэвийн бус зар олдсонгүй.</div>
        </div>
      `;
      return;
    }
    el.innerHTML = summary + items.map(item => adminFlagCard(item)).join('');
  }

  function adminFlagCard({ l, reasons, reportIds }) {
    const seller = sellerData[l.id] || {};
    const ownerVerified = !!l.sellerVerified;
    const phoneOk = !!l.phoneVerified;
    const listingOk = !!l.listingVerified;
    const pill = (on, label) => `<span class="verify-pill ${on ? 'on' : 'off'}">${on ? '✓' : '○'} ${label}</span>`;
    return `
      <div class="admin-flag-card">
        <img class="admin-flag-img" src="${esc(l.img || '')}" alt="" onerror="this.style.display='none';" />
        <div style="flex:1;min-width:0;">
          <div class="admin-flag-title">${esc(l.title)}</div>
          <div class="admin-flag-meta">${esc(l.loc)} · ${fmtPrice(l.price)} · Эзэмшигч: ${esc(seller.name || 'Тодорхойгүй')} (${esc(seller.phone || '—')})</div>
          <div class="verify-status-row" style="margin:0 0 10px;">
            ${pill(ownerVerified, 'Эзэмшигч')}${pill(phoneOk, 'Утас')}${pill(listingOk, 'Зар')}
          </div>
          <ul class="admin-flag-reasons">
            ${reasons.map(r => `<li>${esc(r)}</li>`).join('')}
          </ul>
          <div class="admin-flag-actions">
            <button class="btn btn-blue" onclick="adminVerifyListing('${l.firestoreId}')">Баталгаажуулах</button>
            <button class="btn btn-ghost" style="color:var(--danger);border-color:var(--danger);" onclick="adminDeactivateListing('${l.firestoreId}')">Идэвхгүй болгох</button>
            ${reportIds && reportIds.length ? `<button class="btn btn-ghost" onclick="adminDismissReports('${l.firestoreId}', ${JSON.stringify(reportIds).replace(/"/g, '&quot;')})">Мэдээллийг хаах</button>` : ''}
            <button class="btn btn-ghost" onclick="showPage('listings'); setTimeout(()=>openListing(${l.id}), 150)">Дэлгэрэнгүй</button>
          </div>
        </div>
      </div>
    `;
  }

  async function adminVerifyListing(fsId) {
    try {
      await db.collection('listings').doc(fsId).update({ listingVerified: true });
      const l = listings.find(x => x.firestoreId === fsId);
      if (l) l.listingVerified = true;
      showToast('Зар баталгаажлаа', 'success');
      renderAdminDashboard();
      renderListings(getFilteredListings()); renderHomeListings();
    } catch(e) {
      console.error('adminVerifyListing failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }

  async function adminDeactivateListing(fsId) {
    if (!confirm('Энэ зарыг идэвхгүй болгох уу?')) return;
    try {
      await db.collection('listings').doc(fsId).update({ status: 'inactive' });
      const l = listings.find(x => x.firestoreId === fsId);
      if (l) l._inactive = true;
      showToast('Зар идэвхгүй боллоо', 'success');
      renderAdminDashboard();
      renderListings(getFilteredListings()); renderHomeListings();
    } catch(e) {
      console.error('adminDeactivateListing failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }

  async function adminDismissReports(fsId, reportIds) {
    try {
      await Promise.all(reportIds.map(id => db.collection('reports').doc(id).update({ status: 'resolved' })));
      showToast('Мэдээллүүдийг хаалаа', 'success');
      renderAdminDashboard();
    } catch(e) {
      console.error('adminDismissReports failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }
