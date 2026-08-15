  // ===== ADMIN — SCAM PROTECTION + LISTING MODERATION DASHBOARD =====
  // There is no backend/Cloud Functions in this app, so "admin" is purely a `role` field
  // on the user's own Firestore profile doc (see firestore.rules' isAdmin()) — it can only
  // ever be set to 'admin' by hand in the Firebase Console, never through the app itself.
  // This page's own currentUser.role check below is just UX (redirect a non-admin away
  // from a page with nothing on it); the real access control is the Firestore rules that
  // deny `reports` reads and listing status/listingVerified/rejectionReason writes (and now
  // deletes) to non-admins.
  let _adminLoading = false;
  let _adminTab = 'flagged';
  const ADMIN_TABS = [
    { id: 'flagged', label: 'Сэжигтэй' },
    { id: 'pending', label: 'Хянагдаж буй' },
    { id: 'active', label: 'Идэвхтэй' },
    { id: 'expired', label: 'Хугацаа дууссан' },
    { id: 'sold', label: 'Зарагдсан/Түрээслэгдсэн' },
    { id: 'rejected', label: 'Буцаагдсан' }
  ];

  async function renderAdminDashboard(tab) {
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
    _adminTab = tab || _adminTab;
    el.innerHTML = `
      <div class="admin-summary-row" id="adminSummaryRow" style="display:none;"></div>
      <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;">
        ${ADMIN_TABS.map(t => `<button class="mytab ${t.id === _adminTab ? 'active' : ''}" onclick="renderAdminDashboard('${t.id}')">${esc(t.label)}</button>`).join('')}
      </div>
      <div id="adminTabContent"><div style="text-align:center;padding:60px;color:var(--ink-3);">Ачааллаж байна…</div></div>
    `;
    if (_adminTab === 'flagged') {
      await renderAdminFlaggedTab();
    } else if (_adminTab === 'sold') {
      await renderAdminStatusTab(['sold', 'rented'], 'Зарагдсан/Түрээслэгдсэн зар алга байна.');
    } else {
      await renderAdminStatusTab([_adminTab], 'Энэ төлөвтэй зар алга байна.');
    }
  }

  // ===== FLAGGED TAB (reported + price-anomaly review — original admin dashboard) =====
  async function renderAdminFlaggedTab() {
    if (_adminLoading) return;
    _adminLoading = true;
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
    renderAdminFlaggedList(items, Object.keys(reportsByListing).length, anomalies.length);
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

  function renderAdminFlaggedList(items, reportedCount, anomalyCount) {
    const summaryEl = document.getElementById('adminSummaryRow');
    const el = document.getElementById('adminTabContent');
    if (!el) return;
    if (summaryEl) {
      summaryEl.style.display = 'flex';
      summaryEl.innerHTML = `
        <div class="admin-summary-stat"><div class="num">${items.length}</div><div class="label">Сэжигтэй зар</div></div>
        <div class="admin-summary-stat"><div class="num">${reportedCount}</div><div class="label">Мэдээлэгдсэн зар</div></div>
        <div class="admin-summary-stat"><div class="num">${anomalyCount}</div><div class="label">Огцом хямд үнэтэй зар</div></div>
      `;
    }
    if (items.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--ink-3);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35;margin:0 auto 12px;"><polyline points="20 6 9 17 4 12"/></svg>
          <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:700;color:var(--ink);margin-bottom:6px;">Сэжигтэй зар алга</div>
          <div style="font-size:13px;">Одоогоор мэдээлэгдсэн болон үнийн хэвийн бус зар олдсонгүй.</div>
        </div>
      `;
      return;
    }
    el.innerHTML = items.map(item => adminFlagCard(item)).join('');
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
            <button class="btn btn-ghost" style="color:var(--danger);border-color:var(--danger);" onclick="adminArchiveListing('${l.firestoreId}')">Архивлах</button>
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
      renderAdminDashboard(_adminTab);
      renderListings(getFilteredListings()); renderHomeListings();
    } catch(e) {
      console.error('adminVerifyListing failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }

  async function adminDismissReports(fsId, reportIds) {
    try {
      await Promise.all(reportIds.map(id => db.collection('reports').doc(id).update({ status: 'resolved' })));
      showToast('Мэдээллүүдийг хаалаа', 'success');
      renderAdminDashboard(_adminTab);
    } catch(e) {
      console.error('adminDismissReports failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }

  // ===== STATUS TABS (Pending / Active / Expired / Sold-Rented / Rejected) =====
  // Fetched straight from Firestore rather than the local `listings` array, since that
  // array only ever holds the current visitor's OWN listings plus whatever's publicly
  // active — an admin needs to see every user's listing in every status.
  async function adminFetchListingsByStatus(statuses) {
    try {
      const results = [];
      for (const st of statuses) {
        const snap = await db.collection('listings').where('status', '==', st).get();
        snap.forEach(doc => results.push(Object.assign({ fsId: doc.id }, doc.data())));
      }
      return results;
    } catch(e) {
      console.error('adminFetchListingsByStatus failed:', e.code, e.message);
      return [];
    }
  }

  async function renderAdminStatusTab(statuses, emptyMsg) {
    const summaryEl = document.getElementById('adminSummaryRow');
    if (summaryEl) summaryEl.style.display = 'none';
    const el = document.getElementById('adminTabContent');
    if (!el) return;
    const items = await adminFetchListingsByStatus(statuses);
    if (items.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:60px 20px;color:var(--ink-3);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.35;margin:0 auto 12px;"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>
          <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:700;color:var(--ink);margin-bottom:6px;">Хоосон байна</div>
          <div style="font-size:13px;">${esc(emptyMsg)}</div>
        </div>
      `;
      return;
    }
    el.innerHTML = items.map(d => adminListingCard(d)).join('');
  }

  function adminListingCard(d) {
    const status = d.status || 'active';
    const img = d.img || (d.images && d.images[0]) || '';
    let actions;
    if (status === 'pending') {
      actions = `
        <button class="btn btn-blue" onclick="adminApproveListing('${d.fsId}')">Батлах</button>
        <button class="btn btn-ghost" style="color:var(--danger);border-color:var(--danger);" onclick="adminRejectListing('${d.fsId}')">Татгалзах</button>
        <button class="btn btn-ghost" onclick="adminDeleteListing('${d.fsId}')">Устгах</button>
      `;
    } else if (status === 'rejected') {
      actions = `
        <button class="btn btn-blue" onclick="adminApproveListing('${d.fsId}')">Батлах</button>
        <button class="btn btn-ghost" onclick="adminDeleteListing('${d.fsId}')">Устгах</button>
      `;
    } else if (status === 'active') {
      actions = `
        <button class="btn btn-ghost" style="color:var(--danger);border-color:var(--danger);" onclick="adminArchiveListing('${d.fsId}')">Архивлах</button>
        <button class="btn btn-ghost" onclick="adminDeleteListing('${d.fsId}')">Устгах</button>
        ${d.ownerId ? `<button class="btn btn-ghost" onclick="adminBlockUser('${d.ownerId}')">Хэрэглэгч блоклох</button>` : ''}
      `;
    } else {
      // expired, sold, rented
      actions = `<button class="btn btn-ghost" onclick="adminDeleteListing('${d.fsId}')">Устгах</button>`;
    }
    return `
      <div class="admin-flag-card">
        <img class="admin-flag-img" src="${esc(img)}" alt="" onerror="this.style.display='none';" />
        <div style="flex:1;min-width:0;">
          <div class="admin-flag-title">${esc(d.title || '')}</div>
          <div class="admin-flag-meta">${esc(d.loc || '')} · ${fmtPrice(d.price || 0)} · ${esc(d.sellerName || 'Тодорхойгүй')} (${esc(d.sellerPhone || '—')})</div>
          ${status === 'rejected' && d.rejectionReason ? `<div style="font-size:12px;color:var(--danger);margin:2px 0 10px;">Татгалзсан шалтгаан: ${esc(d.rejectionReason)}</div>` : ''}
          <div class="admin-flag-actions">${actions}</div>
        </div>
      </div>
    `;
  }

  async function adminApproveListing(fsId) {
    try {
      await db.collection('listings').doc(fsId).update({ status: 'active', listingVerified: true, rejectionReason: '' });
      const l = listings.find(x => x.firestoreId === fsId);
      if (l) { l.status = 'active'; l._inactive = false; l._expired = false; l.listingVerified = true; l.rejectionReason = ''; }
      showToast('Зар батлагдлаа', 'success');
      renderAdminDashboard(_adminTab);
      renderListings(getFilteredListings()); renderHomeListings();
    } catch(e) {
      console.error('adminApproveListing failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }

  async function adminRejectListing(fsId) {
    const reason = prompt('Татгалзах шалтгаан (эзэмшигчид харагдана):');
    if (reason === null) return; // cancelled
    try {
      await db.collection('listings').doc(fsId).update({ status: 'rejected', rejectionReason: reason || '' });
      const l = listings.find(x => x.firestoreId === fsId);
      if (l) { l.status = 'rejected'; l._inactive = true; l.rejectionReason = reason || ''; }
      showToast('Зар татгалзагдлаа', 'success');
      renderAdminDashboard(_adminTab);
      renderListings(getFilteredListings()); renderHomeListings();
    } catch(e) {
      console.error('adminRejectListing failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }

  // "Архивлах" files an active (or flagged) listing under Expired — same status a listing
  // reaches on its own after 30 days, just admin-triggered. Never a hard delete.
  async function adminArchiveListing(fsId) {
    if (!confirm('Энэ зарыг архивлах уу? Нийтэд харагдахгүй болно.')) return;
    try {
      await db.collection('listings').doc(fsId).update({ status: 'expired' });
      const l = listings.find(x => x.firestoreId === fsId);
      if (l) { l.status = 'expired'; l._inactive = true; l._expired = true; }
      showToast('Зар архивлагдлаа', 'success');
      renderAdminDashboard(_adminTab);
      renderListings(getFilteredListings()); renderHomeListings();
    } catch(e) {
      console.error('adminArchiveListing failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }

  async function adminDeleteListing(fsId) {
    if (!confirm('Энэ зарыг бүрмөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй.')) return;
    try {
      await db.collection('listings').doc(fsId).delete();
      const idx = listings.findIndex(x => x.firestoreId === fsId);
      if (idx > -1) listings.splice(idx, 1);
      showToast('Зар устгагдлаа', 'success');
      renderAdminDashboard(_adminTab);
      renderListings(getFilteredListings()); renderHomeListings();
    } catch(e) {
      console.error('adminDeleteListing failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }

  async function adminBlockUser(uid) {
    if (!uid) return;
    if (!confirm('Энэ хэрэглэгчийг блоклох уу? Цаашид шинэ зар нэмэх, зараа засах боломжгүй болно.')) return;
    try {
      await db.collection('users').doc(uid).set({ blocked: true }, { merge: true });
      showToast('Хэрэглэгч блоклогдлоо', 'success');
    } catch(e) {
      console.error('adminBlockUser failed:', e.code, e.message);
      showToast('Алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : ''));
    }
  }
