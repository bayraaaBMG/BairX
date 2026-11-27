  // ===== /crm — STAFF WORKSPACE =====
  // Tabs: Лидүүд (CRM pipeline) · Хэлцэл (bulk paste of sold deals) · Хотхон & зураг
  // (catalogue + bulk photo upload, compressed to ≤1600px) · Хэмжилт (lead sources, button
  // clicks, page views) · Хүсэлт (opt-out requests).
  // Staff = owner/admin/manager; agents get the Лидүүд tab with only their assigned leads.
  // Every write here is also enforced by firestore.rules / storage.rules.

  let _crmTab = 'leads';
  let _crmLeadStatus = 'new';
  let _crmAgents = null;
  const LEAD_TYPE_LABEL = { valuation: 'Үнэлгээ', alert: 'Мэдэгдэл', call: 'Залгуулах' };
  const LEAD_STATUS_LABEL = { new: 'Шинэ', contacted: 'Холбогдсон', closed: 'Хаагдсан' };

  registerRoute(/^\/crm$/, async () => {
    const t = new URLSearchParams(location.search).get('tab');
    if (t) _crmTab = t;
    return {
      title: 'Ажлын самбар — BairX',
      description: 'BairX ажилтны самбар',
      html: `<div id="crmRoot" class="crm-root"></div>`,
      after: renderCrm
    };
  });

  function crmAllowed() { return currentUser && (isStaffUser() || isAgentUser()); }

  function renderCrm() {
    const root = document.getElementById('crmRoot');
    if (!root) return;
    if (!currentUser) {
      root.innerHTML = `<div class="route-page route-narrow"><h1 class="route-title">Нэвтэрнэ үү</h1><p class="route-lead">Ажлын самбар зөвхөн ажилтан, агентад нээлттэй.</p><button class="btn btn-blue" onclick="openAuth()">Нэвтрэх</button></div>`;
      return;
    }
    if (!crmAllowed()) { root.innerHTML = render403(); return; }
    const staff = isStaffUser();
    if (!staff) _crmTab = 'leads';
    const tabs = [
      { id: 'leads', label: staff ? 'Лидүүд' : 'Миний лидүүд' },
      ...(staff ? [{ id: 'sales', label: 'Хэлцэл' }, { id: 'complexes', label: 'Хотхон & зураг' }, { id: 'metrics', label: 'Хэмжилт' }, { id: 'optout', label: 'Хүсэлт' }] : [])
    ];
    root.innerHTML = `<div class="route-head"><div class="route-eyebrow">${esc(roleLabel(isOwnerUser() ? 'owner' : currentUser.role))}</div><h1 class="route-title">Ажлын самбар</h1>
      <div class="admin-tabs">${tabs.map(t => `<button class="mytab ${_crmTab === t.id ? 'active' : ''}" onclick="setCrmTab('${t.id}')">${t.label}</button>`).join('')}</div></div>
      <div id="crmBody"><div class="admin-loading">Ачааллаж байна…</div></div>`;
    ({ leads: crmLeads, sales: crmSales, complexes: crmComplexes, metrics: crmMetrics, optout: crmOptout }[_crmTab] || crmLeads)();
  }
  function setCrmTab(t) { _crmTab = t; renderCrm(); }
  const crmBody = () => document.getElementById('crmBody');
  const tsDate = (ts) => ts?.toDate ? ts.toDate().toISOString().slice(0, 16).replace('T', ' ') : '—';

  // ---------------- Leads (CRM) ----------------
  async function crmLoadAgents() {
    if (_crmAgents || !isAdminOrOwnerUser()) return _crmAgents || [];
    try {
      const snap = await db.collection('users').where('role', '==', 'agent').get();
      _crmAgents = snap.docs.map(d => ({ uid: d.id, name: ((d.data().lastName || '') + ' ' + (d.data().firstName || '')).trim() || d.data().email || d.id }));
    } catch (e) { _crmAgents = []; }
    return _crmAgents;
  }

  async function crmLeads() {
    const el = crmBody();
    try {
      let q = db.collection('leads');
      if (!isStaffUser()) q = q.where('assignedTo', '==', currentUser.uid);
      const [snap, agents] = await Promise.all([q.limit(500).get(), crmLoadAgents()]);
      const all = snap.docs.map(d => Object.assign({ id: d.id }, d.data()))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      const counts = { new: 0, contacted: 0, closed: 0 };
      all.forEach(l => { counts[l.status || 'new'] = (counts[l.status || 'new'] || 0) + 1; });
      const items = all.filter(l => (l.status || 'new') === _crmLeadStatus);
      el.innerHTML = `<div class="admin-tabs">${Object.keys(LEAD_STATUS_LABEL).map(s => `<button class="mytab ${_crmLeadStatus === s ? 'active' : ''}" onclick="_crmLeadStatus='${s}'; crmLeads()">${LEAD_STATUS_LABEL[s]} (${counts[s] || 0})</button>`).join('')}</div>
        ${items.length ? `<div class="crm-list">${items.map(l => crmLeadRow(l, agents)).join('')}</div>` : adminEmptyState('Лид алга', 'Энэ төлөвт лид байхгүй байна.')}`;
    } catch (e) {
      console.error('crm leads failed:', e.code, e.message);
      el.innerHTML = adminErrorState('Лид татахад алдаа гарлаа.', 'crmLeads()');
    }
  }

  function crmLeadRow(l, agents) {
    const cx = l.complexId ? (priceData.complexes.get(l.complexId)?.name || l.complexId) : '';
    const details = [
      cx && 'Хотхон: ' + esc(cx),
      l.areaM2 && esc(l.areaM2) + ' м²', l.rooms && esc(l.rooms) + ' өрөө', l.floor != null && l.floor !== '' && esc(l.floor) + ' давхар',
      l.budget && 'Төсөв: ' + esc(l.budget) + ' сая ₮', l.estimate && 'Үнэлгээ: ' + esc(l.estimate) + ' сая ₮',
      l.listingRef && 'Зар: ' + esc(l.listingRef), l.note && esc(l.note)
    ].filter(Boolean).join(' · ');
    const id = l.id.replace(/[^A-Za-z0-9_-]/g, '');
    return `<div class="crm-row">
      <div class="crm-row-main">
        <div class="crm-row-top"><span class="crm-type t-${esc(String(l.type).replace(/[^a-z]/g, ''))}">${LEAD_TYPE_LABEL[l.type] || esc(l.type)}</span>
          <strong>${esc(l.name)}</strong> · <a href="tel:+976${esc(l.phone)}">${esc(l.phone)}</a>
          <span class="muted-note">${tsDate(l.createdAt)} · эх сурвалж: ${esc(l.source || 'direct')}</span></div>
        <div class="crm-row-details">${details || '—'}</div>
        <textarea class="form-textarea crm-notes" id="crmNotes_${id}" rows="2" maxlength="2000" placeholder="Тэмдэглэл">${esc(l.notes || '')}</textarea>
      </div>
      <div class="crm-row-side">
        <select class="form-input" id="crmStatus_${id}">${Object.keys(LEAD_STATUS_LABEL).map(s => `<option value="${s}" ${(l.status || 'new') === s ? 'selected' : ''}>${LEAD_STATUS_LABEL[s]}</option>`).join('')}</select>
        ${isStaffUser() && agents && agents.length ? `<select class="form-input" id="crmAssign_${id}"><option value="">Хуваарилаагүй</option>${agents.map(a => `<option value="${esc(a.uid)}" ${l.assignedTo === a.uid ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select>` : (l.assignedTo ? `<div class="muted-note">Хуваарилсан</div>` : '')}
        <button class="btn btn-blue" onclick="crmSaveLead('${id}')">Хадгалах</button>
      </div>
    </div>`;
  }

  async function crmSaveLead(id) {
    const upd = {
      status: document.getElementById('crmStatus_' + id).value,
      notes: document.getElementById('crmNotes_' + id).value.slice(0, 2000),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    const assign = document.getElementById('crmAssign_' + id);
    if (assign) upd.assignedTo = assign.value;
    try { await db.collection('leads').doc(id).update(upd); showToast('Хадгалагдлаа', 'success'); crmLeads(); }
    catch (e) { console.error(e); showToast('Хадгалахад алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : '')); }
  }

  // ---------------- Sales bulk paste (2.5) ----------------
  function complexOptionsHtml(selected) {
    return [...priceData.complexes.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map(c => `<option value="${esc(c.id)}" ${c.id === selected ? 'selected' : ''}>${esc(c.name || c.id)}</option>`).join('');
  }

  // "2026-01-15, 420, 78, 3" / tab- or semicolon-separated; price in сая ₮.
  function parseSalesPaste(text) {
    const rows = [], errors = [];
    String(text || '').split(/\r?\n/).forEach((line, i) => {
      const raw = line.trim();
      if (!raw || /^огноо/i.test(raw)) return;
      const parts = raw.split(/[\t;,]+/).map(s => s.trim()).filter(Boolean);
      const [date, price, area, rooms] = parts;
      const d = /^\d{4}[-./]\d{2}[-./]\d{2}$/.test(date || '') ? date.replace(/[./]/g, '-') : null;
      const p = BairxPricing.num(price), a = BairxPricing.num(area), r = rooms != null ? BairxPricing.parseRooms(rooms) : null;
      if (!d || !(p > 0) || !(a > 0)) { errors.push(`${i + 1}-р мөр: "${raw}"`); return; }
      rows.push({ date: d, price: p, areaM2: a, rooms: r });
    });
    return { rows, errors };
  }

  async function crmSales() {
    await loadPriceData();
    const el = crmBody();
    el.innerHTML = `<div class="crm-panel">
      <h3 class="route-h3">Зарагдсан хэлцэл олноор оруулах</h3>
      <p class="muted-note">Мөр бүрт: <code>огноо, үнэ (сая ₮), м², өрөө</code> — жишээ: <code>2026-01-15, 420, 78, 3</code>. Excel-ээс хуулж (tab-аар тусгаарлагдсан) шууд буулгаж болно. Хувийн мэдээлэл оруулахгүй.</p>
      <label class="lf-field"><span>Хотхон</span><select class="form-input" id="salesComplex" onchange="crmListSales()"><option value="">Сонгох…</option>${complexOptionsHtml()}</select></label>
      <textarea class="form-textarea" id="salesPaste" rows="8" placeholder="2026-01-15, 420, 78, 3&#10;2026-02-02, 385, 70, 2" oninput="crmPreviewSales()"></textarea>
      <div id="salesPreview" class="muted-note"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-blue" onclick="crmSaveSales()">Хадгалах</button>
        <button class="btn btn-ghost" onclick="crmRecomputeNow(this)">Статистик одоо шинэчлэх</button>
      </div>
      <div id="salesExisting" style="margin-top:20px;"></div>
    </div>`;
  }
  function crmPreviewSales() {
    const { rows, errors } = parseSalesPaste(document.getElementById('salesPaste').value);
    document.getElementById('salesPreview').innerHTML = `${rows.length} мөр зөв${errors.length ? ` · <span style="color:var(--danger)">${errors.length} алдаатай: ${errors.slice(0, 5).map(esc).join('; ')}</span>` : ''}`;
  }
  async function crmSaveSales() {
    const complexId = document.getElementById('salesComplex').value;
    if (!complexId) { showToast('Хотхоноо сонгоно уу'); return; }
    const { rows, errors } = parseSalesPaste(document.getElementById('salesPaste').value);
    if (!rows.length) { showToast('Зөв мөр алга'); return; }
    if (errors.length && !confirm(`${errors.length} алдаатай мөрийг алгасаад ${rows.length} мөрийг хадгалах уу?`)) return;
    try {
      for (let i = 0; i < rows.length; i += 400) {
        const batch = db.batch();
        rows.slice(i, i + 400).forEach(r => batch.set(db.collection('sales').doc(), Object.assign({ complexId, createdBy: currentUser.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() }, r)));
        await batch.commit();
      }
      logAdminAction('add_sales', 'complex', complexId, rows.length + ' мөр');
      showToast(rows.length + ' хэлцэл хадгалагдлаа. Статистик маргааш 03:00-д (эсвэл "одоо шинэчлэх") шинэчлэгдэнэ.', 'success');
      document.getElementById('salesPaste').value = '';
      crmPreviewSales(); crmListSales();
    } catch (e) { console.error(e); showToast('Хадгалахад алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : '')); }
  }
  async function crmListSales() {
    const complexId = document.getElementById('salesComplex').value;
    const el = document.getElementById('salesExisting');
    if (!complexId) { el.innerHTML = ''; return; }
    try {
      const snap = await db.collection('sales').where('complexId', '==', complexId).get();
      const rows = snap.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      el.innerHTML = rows.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Огноо</th><th>Үнэ</th><th>м²</th><th>Өрөө</th><th>1 м²</th><th></th></tr></thead><tbody>
        ${rows.map(r => `<tr><td>${esc(r.date)}</td><td>${r.price} сая</td><td>${r.areaM2}</td><td>${r.rooms ?? '—'}</td><td>${(r.price / r.areaM2).toFixed(2)}</td><td><button class="btn btn-ghost" onclick="crmDeleteSale('${r.id}')">Устгах</button></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="muted-note">Энэ хотхонд бүртгэлтэй хэлцэл алга.</p>';
    } catch (e) { el.innerHTML = '<p class="muted-note">Татахад алдаа гарлаа.</p>'; }
  }
  async function crmDeleteSale(id) {
    if (!confirm('Энэ хэлцлийг устгах уу?')) return;
    try { await db.collection('sales').doc(id).delete(); crmListSales(); } catch (e) { showToast('Устгахад алдаа гарлаа'); }
  }
  async function crmRecomputeNow(btn) {
    btn.disabled = true; btn.textContent = 'Шинэчилж байна…';
    try {
      await loadScriptOnce('https://www.gstatic.com/firebasejs/10.14.1/firebase-functions-compat.js');
      const fns = firebase.app().functions('asia-east2');
      if (window.BAIRX_EMULATOR && !window._bairxFnsEmu) { fns.useEmulator('127.0.0.1', 5001); window._bairxFnsEmu = true; }
      const res = await fns.httpsCallable('recomputeStatsNow')();
      showToast(`Шинэчлэгдлээ: ${res.data.complexes} хотхон, ${res.data.hot} хямд зар`, 'success');
      loadPriceData(true);
    } catch (e) {
      console.error('recompute failed:', e.code, e.message);
      showToast('Cloud Function ажиллуулж чадсангүй (deploy хийгдсэн эсэхийг шалгана уу)');
    }
    btn.disabled = false; btn.textContent = 'Статистик одоо шинэчлэх';
  }

  // ---------------- Complexes & photos (2.6) ----------------
  async function crmComplexes() {
    await loadPriceData(true);
    const el = crmBody();
    el.innerHTML = `<div class="crm-panel">
      <h3 class="route-h3">Хотхон нэмэх / засах</h3>
      <label class="lf-field"><span>Засах хотхон</span><select class="form-input" id="cxEditSel" onchange="crmFillComplex()"><option value="">+ Шинэ хотхон</option>${complexOptionsHtml()}</select></label>
      <div class="lf-grid">
        <label class="lf-field"><span>Нэр *</span><input class="form-input" id="cxName" maxlength="120" /></label>
        <label class="lf-field"><span>Дүүрэг</span><select class="form-input" id="cxDistrictSel">${districtOptions('')}</select></label>
        <label class="lf-field"><span>Хороо</span><input class="form-input" id="cxKhorooIn" type="number" min="1" max="40" /></label>
        <label class="lf-field"><span>Ашиглалтад орсон он</span><input class="form-input" id="cxYear" type="number" min="1950" max="2035" /></label>
        <label class="lf-field"><span>Давхар</span><input class="form-input" id="cxFloors" type="number" min="1" max="80" /></label>
        <label class="lf-field"><span>Борлуулалтын утас</span><input class="form-input" id="cxPhone" inputmode="numeric" maxlength="12" placeholder="Хоосон бол BairX-ийн утас" /></label>
      </div>
      <button class="btn btn-blue" onclick="crmSaveComplex()">Хадгалах</button>

      <h3 class="route-h3" style="margin-top:28px;">Зураг олноор оруулах</h3>
      <p class="muted-note">Зургийг хөтөч дээрээ 1600px хүртэл шахаад Storage-д хадгална.</p>
      <div class="lf-grid">
        <label class="lf-field"><span>Хаана</span><select class="form-input" id="imgTarget"><option value="complex">Дээр сонгосон хотхон</option><option value="listing">Зар (Firestore ID)</option></select></label>
        <label class="lf-field"><span>Зарын ID (зар сонгосон бол)</span><input class="form-input" id="imgListingId" maxlength="40" /></label>
      </div>
      <input type="file" id="imgFiles" accept="image/*" multiple />
      <div id="imgProgress" class="muted-note"></div>
      <button class="btn btn-blue" style="margin-top:8px;" onclick="crmUploadImages()">Оруулах</button>
      <div id="cxPhotosPreview" class="cx-photos" style="margin-top:14px;"></div>
    </div>`;
  }
  function crmFillComplex() {
    const id = document.getElementById('cxEditSel').value;
    const c = priceData.complexes.get(id) || {};
    document.getElementById('cxName').value = c.name || '';
    document.getElementById('cxDistrictSel').value = c.district || '';
    document.getElementById('cxKhorooIn').value = c.khoroo || '';
    document.getElementById('cxYear').value = c.yearBuilt || '';
    document.getElementById('cxFloors').value = c.floors || '';
    document.getElementById('cxPhone').value = c.phone || '';
    document.getElementById('cxPhotosPreview').innerHTML = (c.photos || []).map(p => `<img src="${esc(p)}" alt="">`).join('');
  }
  async function crmSaveComplex() {
    const name = document.getElementById('cxName').value.trim();
    if (!name) { showToast('Нэр оруулна уу'); return; }
    const id = document.getElementById('cxEditSel').value || BairxPricing.slugify(name);
    if (!id) { showToast('Нэрээс ID үүсгэж чадсангүй'); return; }
    const num = (v) => v === '' ? null : parseInt(v, 10);
    const phoneRaw = document.getElementById('cxPhone').value.trim();
    const doc = {
      id, name, district: document.getElementById('cxDistrictSel').value || '',
      khoroo: num(document.getElementById('cxKhorooIn').value), yearBuilt: num(document.getElementById('cxYear').value),
      floors: num(document.getElementById('cxFloors').value), phone: phoneRaw ? (normalizeMnPhone(phoneRaw) || '') : '',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (phoneRaw && !doc.phone) { showToast('Утас 8 оронтой байх ёстой'); return; }
    try {
      await db.collection('complexes').doc(id).set(doc, { merge: true });
      logAdminAction('save_complex', 'complex', id, name);
      showToast('Хотхон хадгалагдлаа', 'success');
      await crmComplexes();
      document.getElementById('cxEditSel').value = id; crmFillComplex();
    } catch (e) { console.error(e); showToast('Хадгалахад алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : '')); }
  }

  // Downscale so the longest side is ≤ maxPx, re-encode as JPEG. Smaller originals pass through.
  function compressImage(file, maxPx, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, (maxPx || 1600) / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(b => b ? resolve(b) : reject(new Error('encode failed')), 'image/jpeg', quality || 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')); };
      img.src = url;
    });
  }

  async function crmUploadImages() {
    const files = [...(document.getElementById('imgFiles').files || [])];
    if (!files.length) { showToast('Зураг сонгоно уу'); return; }
    const target = document.getElementById('imgTarget').value;
    const complexId = document.getElementById('cxEditSel').value;
    const listingId = document.getElementById('imgListingId').value.trim().replace(/[^A-Za-z0-9_-]/g, '');
    if (target === 'complex' && !complexId) { showToast('Эхлээд хотхоноо сонгож хадгална уу'); return; }
    if (target === 'listing' && !listingId) { showToast('Зарын Firestore ID оруулна уу'); return; }
    const prog = document.getElementById('imgProgress');
    const urls = [];
    for (let i = 0; i < files.length; i++) {
      prog.textContent = `${i + 1}/${files.length} шахаж, оруулж байна…`;
      try {
        const blob = await compressImage(files[i], 1600, 0.82);
        const path = (target === 'complex' ? `complex-images/${complexId}/` : `admin-listing-images/${listingId}/`) + Date.now() + '-' + i + '.jpg';
        const ref = storage.ref(path);
        await ref.put(blob, { contentType: 'image/jpeg' });
        urls.push(await ref.getDownloadURL());
      } catch (e) { console.error('upload failed', files[i].name, e.code || '', e.message); }
    }
    if (!urls.length) { prog.textContent = 'Оруулж чадсангүй.'; return; }
    try {
      if (target === 'complex') {
        await db.collection('complexes').doc(complexId).update({ photos: firebase.firestore.FieldValue.arrayUnion(...urls) });
        await loadPriceData(true); crmFillComplex();
      } else {
        await db.collection('listings').doc(listingId).update({ images: firebase.firestore.FieldValue.arrayUnion(...urls) });
      }
      logAdminAction('upload_images', target, target === 'complex' ? complexId : listingId, urls.length + ' зураг');
      prog.textContent = `${urls.length}/${files.length} зураг оруулагдлаа.`;
      document.getElementById('imgFiles').value = '';
    } catch (e) { console.error(e); prog.textContent = 'Зураг Storage-д орсон ч баримтад холбож чадсангүй (' + (e.code || e.message) + ').'; }
  }

  // ---------------- Metrics (3.7) ----------------
  async function crmMetrics() {
    const el = crmBody();
    const since = firebase.firestore.Timestamp.fromMillis(Date.now() - 30 * 86400000);
    try {
      const [ev, leads] = await Promise.all([
        db.collection('events').where('createdAt', '>=', since).limit(10000).get(),
        db.collection('leads').where('createdAt', '>=', since).limit(5000).get()
      ]);
      const tally = (arr, key) => arr.reduce((m, x) => { const k = x[key] || '—'; m[k] = (m[k] || 0) + 1; return m; }, {});
      const evs = ev.docs.map(d => d.data()), lds = leads.docs.map(d => d.data());
      const table = (title, obj, limit) => {
        const rows = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, limit || 15);
        return `<div class="crm-metric"><h3 class="route-h3">${title}</h3>${rows.length ? `<table class="data-table"><tbody>${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td><strong>${v}</strong></td></tr>`).join('')}</tbody></table>` : '<p class="muted-note">Өгөгдөл алга</p>'}</div>`;
      };
      el.innerHTML = `<p class="muted-note">Сүүлийн 30 хоног · ${evs.length} үйлдэл · ${lds.length} лид${ev.size >= 10000 ? ' (эхний 10,000 үйлдэл)' : ''}</p>
        <div class="crm-metrics">
          ${table('Лидийн эх сурвалж', tally(lds, 'source'))}
          ${table('Лидийн төрөл', tally(lds.map(l => ({ t: LEAD_TYPE_LABEL[l.type] || l.type })), 't'))}
          ${table('Товчны дарагдалт', tally(evs.filter(e => e.type === 'contact_click'), 'channel'))}
          ${table('Хуудасны үзэлт', tally(evs.filter(e => e.type === 'page_view'), 'page'), 20)}
          ${table('Зочны эх сурвалж (үзэлт)', tally(evs.filter(e => e.type === 'page_view'), 'source'))}
          ${table('Хайлт', tally(evs.filter(e => e.type === 'search'), 'channel'))}
        </div>`;
    } catch (e) {
      console.error('metrics failed:', e.code, e.message);
      el.innerHTML = adminErrorState('Хэмжилт татахад алдаа гарлаа.', 'crmMetrics()');
    }
  }

  // ---------------- Opt-out requests ----------------
  async function crmOptout() {
    const el = crmBody();
    try {
      const snap = await db.collection('optoutRequests').limit(300).get();
      const items = snap.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      el.innerHTML = items.length ? `<div class="crm-list">${items.map(r => `<div class="crm-row"><div class="crm-row-main">
          <div class="crm-row-top"><strong>${esc(OPTOUT_REASONS[r.reason] || r.reason)}</strong> · ${esc(r.name)} · <a href="tel:+976${esc(r.phone)}">${esc(r.phone)}</a> <span class="muted-note">${tsDate(r.createdAt)}</span></div>
          <div class="crm-row-details">${r.listingRef ? 'Зар: ' + esc(r.listingRef) + ' · ' : ''}${esc(r.note || '')}</div></div>
          <div class="crm-row-side"><span class="admin-status-pill ${r.status === 'done' ? 'status-active' : 'status-pending'}">${r.status === 'done' ? 'Шийдсэн' : r.status === 'rejected' ? 'Татгалзсан' : 'Шинэ'}</span>
          ${r.status === 'new' ? `<button class="btn btn-blue" onclick="crmOptoutStatus('${r.id}','done')">Шийдсэн</button><button class="btn btn-ghost" onclick="crmOptoutStatus('${r.id}','rejected')">Татгалзах</button>` : ''}</div></div>`).join('')}</div>`
        : adminEmptyState('Хүсэлт алга', 'Зараа хасуулах хүсэлт ирээгүй байна.');
    } catch (e) { el.innerHTML = adminErrorState('Хүсэлт татахад алдаа гарлаа.', 'crmOptout()'); }
  }
  async function crmOptoutStatus(id, status) {
    try {
      await db.collection('optoutRequests').doc(id).update({ status, handledBy: currentUser.uid, handledAt: firebase.firestore.FieldValue.serverTimestamp() });
      crmOptout();
    } catch (e) { showToast('Шинэчлэхэд алдаа гарлаа'); }
  }

  // Re-render if the user signs in/out (or their role loads) while on /crm.
  function refreshCrmIfActive() {
    if (location.pathname === '/crm' && document.getElementById('crmRoot')) renderCrm();
  }
