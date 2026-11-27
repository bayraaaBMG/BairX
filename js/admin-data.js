  // ===== PHASE 3 — STAFF TOOLS (extra /crm tabs) =====
  // Даалгавар · Хэлцэл & шимтгэл · Тайлан · Агентууд · Сэтгэгдэл · Нүүр хуудас · Импорт ·
  // Статистик. Each tab is plain UI over Firestore; firestore.rules (v3) is the real gate:
  // staff = owner/admin/manager, agents get only their own tasks/leads, the public nothing.

  const CRM_STAGES = [
    ['new', 'Шинэ хүсэлт'], ['contacted', 'Холбогдсон'], ['offered', 'Байр санал болгосон'], ['viewing', 'Үзлэг товлосон'],
    ['negotiating', 'Үнэ тохиролцож байгаа'], ['contract', 'Гэрээ'], ['won', 'Амжилттай хаасан'], ['lost', 'Цуцлагдсан']
  ];
  const STAGE_LABEL = Object.assign(Object.fromEntries(CRM_STAGES), { closed: 'Хаагдсан (хуучин)' });
  const TASK_KIND = { task: 'Даалгавар', meeting: 'Уулзалт / үзлэг', followup: 'Follow-up' };

  // ---------- CSV helpers (RFC 4180-ish; also reads tab- and semicolon-separated pastes) ----------
  function parseCsv(text) {
    const src = String(text || '').replace(/^﻿/, '');
    const first = src.split(/\r?\n/, 1)[0] || '';
    const sep = first.includes('\t') ? '\t' : (first.split(';').length > first.split(',').length ? ';' : ',');
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (q) {
        if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && src[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.map(r => r.map(c => c.trim())).filter(r => r.some(c => c !== ''));
  }
  // First row = header; keys are matched case-insensitively against the given aliases.
  function csvObjects(rows, fields) {
    if (rows.length < 2) return [];
    const head = rows[0].map(h => h.toLowerCase());
    const idx = {};
    for (const [key, aliases] of Object.entries(fields)) idx[key] = head.findIndex(h => aliases.includes(h));
    return rows.slice(1).map((r, n) => { const o = { _row: n + 2 }; for (const k in idx) o[k] = idx[k] >= 0 ? (r[idx[k]] || '') : ''; return o; });
  }
  function toCsv(rows) {
    return '﻿' + rows.map(r => r.map(v => { const s = v == null ? '' : String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');
  }
  function downloadText(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/csv;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  // .xlsx/.xls via SheetJS (loaded on demand, free CDN build); .csv/.txt read as text.
  async function readTableFile(file) {
    if (/\.xlsx?$/i.test(file.name)) {
      await loadScriptOnce('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      return parseCsv(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]], { FS: '\t', dateNF: 'yyyy-mm-dd' }));
    }
    return parseCsv(await file.text());
  }
  const numOrNull = (v) => { const x = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return Number.isFinite(x) ? x : null; };
  const isoDate = (v) => { const s = String(v || '').trim(); if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; const t = Date.parse(s); return Number.isFinite(t) ? new Date(t + 8 * 3600000).toISOString().slice(0, 10) : ''; };

  // ---------- staff list (agents + managers) for assignment selects ----------
  let _staffUsers = null;
  async function loadStaffUsers() {
    if (_staffUsers) return _staffUsers;
    try {
      const snap = await db.collection('users').where('role', 'in', ['agent', 'manager', 'admin']).get();
      _staffUsers = snap.docs.map(d => ({ uid: d.id, role: d.data().role, name: ((d.data().lastName || '') + ' ' + (d.data().firstName || '')).trim() || d.data().email || d.id }));
    } catch (e) { _staffUsers = []; }
    if (currentUser && !_staffUsers.some(u => u.uid === currentUser.uid)) _staffUsers.unshift({ uid: currentUser.uid, role: currentUser.role, name: 'Би' });
    return _staffUsers;
  }
  const staffName = (list, uid) => (list.find(u => u.uid === uid) || {}).name || (uid ? 'Хуваарилсан' : '—');

  // ===================================================================================
  // Leads export (CSV) — called from the Лидүүд tab
  async function crmExportLeads() {
    try {
      let q = db.collection('leads');
      if (!isStaffUser()) q = q.where('assignedTo', '==', currentUser.uid);
      const snap = await q.limit(5000).get();
      const rows = [['id', 'Огноо', 'Төрөл', 'Төлөв', 'Нэр', 'Утас', 'Төсөв', 'Хотхон', 'Дүүрэг', 'Өрөө', 'Талбай', 'Санхүүжилт', 'Эх сурвалж', 'Тэмдэглэл']];
      snap.docs.forEach(d => { const l = d.data(); rows.push([d.id, l.createdAt?.toDate?.().toISOString().slice(0, 10) || '', l.type, STAGE_LABEL[l.status] || l.status, l.name, l.phone, l.budget, l.complexId, l.district, l.rooms, l.areaM2 || [l.areaMin, l.areaMax].filter(Boolean).join('–'), l.financing, l.source, l.notes || l.note]); });
      downloadText('bairx-leads-' + new Date().toISOString().slice(0, 10) + '.csv', toCsv(rows));
      logAdminAction('export_leads', 'leads', 'all', rows.length - 1 + ' мөр');
    } catch (e) { console.error(e); showToast('Экспорт хийж чадсангүй'); }
  }

  // ===================================================================================
  // ДААЛГАВАР · УУЛЗАЛТ · FOLLOW-UP
  async function crmTasks() {
    const el = crmBody();
    try {
      let q = db.collection('crmTasks');
      if (!isStaffUser()) q = q.where('assignedTo', '==', currentUser.uid);
      const [snap, staff] = await Promise.all([q.limit(1000).get(), loadStaffUsers()]);
      const all = snap.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => (a.dueAt?.toMillis?.() || 0) - (b.dueAt?.toMillis?.() || 0));
      const now = Date.now(), dayEnd = new Date(); dayEnd.setHours(23, 59, 59, 999);
      const open = all.filter(t => !t.done);
      const groups = [
        ['Хугацаа хэтэрсэн', open.filter(t => t.dueAt.toMillis() < now)],
        ['Өнөөдөр', open.filter(t => t.dueAt.toMillis() >= now && t.dueAt.toMillis() <= dayEnd.getTime())],
        ['Дараагийн 14 хоног', open.filter(t => t.dueAt.toMillis() > dayEnd.getTime() && t.dueAt.toMillis() <= now + 14 * 86400000)],
        ['Хожим', open.filter(t => t.dueAt.toMillis() > now + 14 * 86400000)],
        ['Дууссан (сүүлийн 20)', all.filter(t => t.done).slice(-20).reverse()]
      ];
      const pre = new URLSearchParams(location.search).get('lead') || '';
      el.innerHTML = `<div class="crm-panel">
        <h3 class="route-h3">Шинэ даалгавар / уулзалт</h3>
        <div class="lf-grid">
          <label class="lf-field"><span>Гарчиг *</span><input class="form-input" id="tkTitle" maxlength="200" placeholder="Жнь: Зайсан 3 өрөө үзүүлэх"></label>
          <label class="lf-field"><span>Төрөл</span><select class="form-input" id="tkKind">${Object.entries(TASK_KIND).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
          <label class="lf-field"><span>Хугацаа *</span><input class="form-input" id="tkDue" type="datetime-local"></label>
          <label class="lf-field"><span>Хариуцагч</span><select class="form-input" id="tkAssign" ${isStaffUser() ? '' : 'disabled'}>${staff.map(u => `<option value="${esc(u.uid)}" ${u.uid === currentUser.uid ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>
          <label class="lf-field"><span>Лидийн ID</span><input class="form-input" id="tkLead" maxlength="40" value="${esc(pre)}"></label>
        </div>
        <label class="lf-field"><span>Тэмдэглэл</span><textarea class="form-textarea" id="tkNote" rows="2" maxlength="1000"></textarea></label>
        <button class="btn btn-blue" id="tkSave" onclick="crmSaveTask()">Нэмэх</button>
      </div>
      ${groups.map(([title, list]) => list.length ? `<h3 class="route-h3">${title} (${list.length})</h3><div class="crm-list">${list.map(t => taskRowHtml(t, staff)).join('')}</div>` : '').join('') || adminEmptyState('Даалгавар алга', 'Дээрх формоор эхний даалгавраа нэмнэ үү.')}`;
      const overdue = groups[0][1].length;
      if (overdue) showToast(overdue + ' даалгаврын хугацаа хэтэрсэн байна');
    } catch (e) { console.error('tasks failed:', e.code, e.message); el.innerHTML = adminErrorState('Даалгавар татахад алдаа гарлаа.' + (e.code === 'permission-denied' ? ' (Firestore rules v3 deploy хийгдээгүй байж болно)' : ''), 'crmTasks()'); }
  }
  function taskRowHtml(t, staff) {
    const id = t.id.replace(/[^A-Za-z0-9_-]/g, '');
    const due = t.dueAt.toDate();
    const late = !t.done && due.getTime() < Date.now();
    return `<div class="crm-row ${late ? 'is-late' : ''} ${t.done ? 'is-done' : ''}">
      <div class="crm-row-main"><div class="crm-row-top"><span class="crm-type t-${t.kind}">${TASK_KIND[t.kind] || t.kind}</span><strong>${esc(t.title)}</strong>
        <span class="muted-note">${due.toLocaleString('mn-MN', { dateStyle: 'medium', timeStyle: 'short' })} · ${esc(staffName(staff, t.assignedTo))}</span></div>
        ${t.note || t.leadId ? `<div class="crm-row-details">${t.leadId ? 'Лид: ' + esc(t.leadId) + ' · ' : ''}${esc(t.note || '')}</div>` : ''}</div>
      <div class="crm-row-side"><button class="btn ${t.done ? 'btn-ghost' : 'btn-blue'}" onclick="crmToggleTask('${id}', ${!t.done})">${t.done ? 'Буцааж нээх' : 'Дууссан'}</button>
        <button class="btn btn-ghost" onclick="crmDeleteTask('${id}')">Устгах</button></div></div>`;
  }
  async function crmSaveTask() {
    const title = document.getElementById('tkTitle').value.trim();
    const due = document.getElementById('tkDue').value;
    if (!title || !due) { showToast('Гарчиг, хугацаагаа оруулна уу'); return; }
    const doc = {
      title: title.slice(0, 200), kind: document.getElementById('tkKind').value, done: false,
      dueAt: firebase.firestore.Timestamp.fromDate(new Date(due)),
      assignedTo: isStaffUser() ? document.getElementById('tkAssign').value : currentUser.uid,
      leadId: document.getElementById('tkLead').value.trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40),
      note: document.getElementById('tkNote').value.trim().slice(0, 1000),
      createdBy: currentUser.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    document.getElementById('tkSave').disabled = true;
    try {
      await db.collection('crmTasks').add(doc);
      if (doc.leadId && doc.kind === 'followup') db.collection('leads').doc(doc.leadId).update({ nextFollowUp: doc.dueAt, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {});
      showToast('Нэмэгдлээ', 'success'); crmTasks();
    } catch (e) { console.error(e); showToast('Хадгалахад алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : '')); document.getElementById('tkSave').disabled = false; }
  }
  async function crmToggleTask(id, done) {
    try { await db.collection('crmTasks').doc(id).update({ done, doneAt: done ? firebase.firestore.FieldValue.serverTimestamp() : null }); crmTasks(); }
    catch (e) { showToast('Шинэчилж чадсангүй'); }
  }
  async function crmDeleteTask(id) {
    if (!confirm('Даалгаврыг устгах уу?')) return;
    try { await db.collection('crmTasks').doc(id).delete(); crmTasks(); } catch (e) { showToast('Устгаж чадсангүй'); }
  }

  // ===================================================================================
  // ХЭЛЦЭЛ БҮРТГЭХ (with commission) — writes to `sales`, the same staff-only collection the
  // statistics read. Only date/price/areaM2/rooms ever reach public numbers (anonymized).
  async function crmDeals() {
    await loadPriceData();
    const [staff, agents] = await Promise.all([loadStaffUsers(), typeof loadAgents === 'function' ? loadAgents() : []]);
    const el = crmBody();
    el.innerHTML = `<div class="crm-panel">
      <h3 class="route-h3">Хэлцэл бүртгэх</h3>
      <p class="muted-note">Зөвхөн бодитоор хаагдсан, баримттай хэлцлийг бүртгэнэ. Нийтэд зөвхөн сар, өрөө, талбай, ойролцоо үнэ (хувийн мэдээлэлгүй) харагдана.</p>
      <div class="lf-grid">
        <label class="lf-field"><span>Хотхон *</span><select class="form-input" id="dlComplex"><option value="">Сонгох…</option>${complexOptionsHtml()}</select></label>
        <label class="lf-field"><span>Огноо *</span><input class="form-input" id="dlDate" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
        <label class="lf-field"><span>Үнэ (сая ₮) *</span><input class="form-input" id="dlPrice" type="number" min="1" step="0.1" oninput="crmDealCommission()"></label>
        <label class="lf-field"><span>Талбай (м²) *</span><input class="form-input" id="dlArea" type="number" min="5" step="0.1"></label>
        <label class="lf-field"><span>Өрөө</span><input class="form-input" id="dlRooms" type="number" min="1" max="10"></label>
        <label class="lf-field"><span>Давхар</span><input class="form-input" id="dlFloor" type="number" min="1" max="80"></label>
        <label class="lf-field"><span>Агент (ажилтан)</span><select class="form-input" id="dlAgentUid"><option value="">—</option>${staff.map(u => `<option value="${esc(u.uid)}">${esc(u.name)}</option>`).join('')}</select></label>
        <label class="lf-field"><span>Агентын профайл</span><select class="form-input" id="dlAgentSlug"><option value="">—</option>${agents.map(a => `<option value="${esc(a.slug)}">${esc(a.name)}</option>`).join('')}</select></label>
        <label class="lf-field"><span>Тал</span><select class="form-input" id="dlSide"><option value="buyer">Худалдан авагч</option><option value="seller">Худалдагч</option><option value="both">Хоёр тал</option></select></label>
        <label class="lf-field"><span>Шимтгэл (%)</span><input class="form-input" id="dlPct" type="number" min="0" max="20" step="0.1" value="2" oninput="crmDealCommission()"></label>
        <label class="lf-field"><span>Лидийн ID</span><input class="form-input" id="dlLead" maxlength="40"></label>
      </div>
      <p id="dlCommission" class="muted-note"></p>
      <button class="btn btn-blue" id="dlSave" onclick="crmSaveDeal()">Хэлцэл хадгалах</button>
    </div>
    <div class="crm-panel"><h3 class="route-h3">Олноор оруулах</h3><p class="muted-note">CSV/Excel-ээр олон хэлцэл оруулах бол <a href="#" onclick="setCrmTab('import');return false;">Импорт</a> таб, хуучин хуулж буулгах арга <a href="#" onclick="setCrmTab('sales');return false;">Хэлцэл (paste)</a> табд.</p></div>`;
    crmDealCommission();
  }
  function crmDealCommission() {
    const p = parseFloat(document.getElementById('dlPrice')?.value), pct = parseFloat(document.getElementById('dlPct')?.value);
    const out = document.getElementById('dlCommission'); if (!out) return;
    out.textContent = p > 0 && pct >= 0 ? `Шимтгэл: ${(Math.round(p * pct) / 100).toFixed(2)} сая ₮ (${p} × ${pct}%)` : '';
  }
  async function crmSaveDeal() {
    const g = (id) => document.getElementById(id).value.trim();
    const complexId = g('dlComplex'), date = g('dlDate'), price = parseFloat(g('dlPrice')), areaM2 = parseFloat(g('dlArea'));
    if (!complexId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(price > 0) || !(areaM2 > 0)) { showToast('Хотхон, огноо, үнэ, талбайгаа бүрэн оруулна уу'); return; }
    const pct = parseFloat(g('dlPct')) || 0;
    const doc = {
      complexId, date, price, areaM2, rooms: parseInt(g('dlRooms'), 10) || null, floor: parseInt(g('dlFloor'), 10) || null,
      agentUid: g('dlAgentUid'), agentSlug: g('dlAgentSlug'), side: g('dlSide'), commissionPct: pct,
      commission: Math.round(price * pct) / 100, leadId: g('dlLead').replace(/[^A-Za-z0-9_-]/g, ''),
      createdBy: currentUser.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    document.getElementById('dlSave').disabled = true;
    try {
      const ref = await db.collection('sales').add(doc);
      if (doc.leadId) db.collection('leads').doc(doc.leadId).update({ status: 'won', updatedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {});
      logAdminAction('save_deal', 'sale', ref.id, `${complexId} ${price} сая`);
      showToast('Хэлцэл бүртгэгдлээ', 'success'); crmDeals();
    } catch (e) { console.error(e); showToast('Хадгалахад алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : '')); document.getElementById('dlSave').disabled = false; }
  }

  // ===================================================================================
  // ТАЙЛАН — sales volume & commission by month and by agent, lead funnel
  async function crmReports() {
    const el = crmBody();
    try {
      const [salesSnap, leadSnap, staff] = await Promise.all([db.collection('sales').limit(10000).get(), db.collection('leads').limit(10000).get(), loadStaffUsers()]);
      const sales = salesSnap.docs.map(d => d.data()), leads = leadSnap.docs.map(d => d.data());
      const byMonth = new Map();
      for (const s of sales) {
        const m = String(s.date || '').slice(0, 7); if (!m) continue;
        const r = byMonth.get(m) || { n: 0, vol: 0, com: 0 }; r.n++; r.vol += s.price || 0; r.com += s.commission || 0; byMonth.set(m, r);
      }
      const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 18);
      const agents = new Map();
      const bump = (uid, k, v) => { if (!uid) return; const a = agents.get(uid) || { leads: 0, won: 0, deals: 0, vol: 0, com: 0 }; a[k] += v; agents.set(uid, a); };
      for (const l of leads) { bump(l.assignedTo, 'leads', 1); if (l.status === 'won') bump(l.assignedTo, 'won', 1); }
      for (const s of sales) { bump(s.agentUid, 'deals', 1); bump(s.agentUid, 'vol', s.price || 0); bump(s.agentUid, 'com', s.commission || 0); }
      const funnel = CRM_STAGES.map(([k, label]) => [label, leads.filter(l => (l.status || 'new') === k).length]);
      const total = leads.length || 1;
      const m2 = (v) => (Math.round(v * 10) / 10).toLocaleString('en-US');
      el.innerHTML = `
        <div class="mk-stats"><div class="mk-stat"><strong>${sales.length}</strong><span>нийт хэлцэл</span></div>
          <div class="mk-stat"><strong>${m2(sales.reduce((s, x) => s + (x.price || 0), 0))}</strong><span>нийт дүн (сая ₮)</span></div>
          <div class="mk-stat"><strong>${m2(sales.reduce((s, x) => s + (x.commission || 0), 0))}</strong><span>шимтгэл (сая ₮)</span></div>
          <div class="mk-stat"><strong>${leads.length}</strong><span>нийт лид</span></div></div>
        <h3 class="route-h3">Лидийн шат</h3>
        <div class="funnel">${funnel.map(([l, n]) => `<div class="funnel-row"><span>${l}</span><div class="funnel-bar"><i style="width:${(n / total * 100).toFixed(1)}%"></i></div><strong>${n}</strong></div>`).join('')}</div>
        <h3 class="route-h3">Сараар</h3>
        ${months.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Сар</th><th>Хэлцэл</th><th>Дүн (сая ₮)</th><th>Шимтгэл (сая ₮)</th></tr></thead>
          <tbody>${months.map(([m, r]) => `<tr><td>${m}</td><td>${r.n}</td><td>${m2(r.vol)}</td><td>${m2(r.com)}</td></tr>`).join('')}</tbody></table></div>` : adminEmptyState('Хэлцэл алга', 'Хэлцэл бүртгэгдэхээр сарын тайлан гарна.')}
        <h3 class="route-h3">Агентаар</h3>
        ${agents.size ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Агент</th><th>Лид</th><th>Хаасан</th><th>Хөрвөлт</th><th>Хэлцэл</th><th>Дүн</th><th>Шимтгэл</th></tr></thead>
          <tbody>${[...agents.entries()].sort((a, b) => b[1].com - a[1].com).map(([uid, a]) => `<tr><td>${esc(staffName(staff, uid))}</td><td>${a.leads}</td><td>${a.won}</td><td>${a.leads ? Math.round(a.won / a.leads * 100) + '%' : '—'}</td><td>${a.deals}</td><td>${m2(a.vol)}</td><td>${m2(a.com)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted-note">Агентад хуваарилсан лид, хэлцэл алга.</p>'}
        <button class="btn btn-ghost" onclick="crmExportReport()">CSV татах</button>`;
      window._crmReport = { months, agents: [...agents.entries()], staff };
    } catch (e) { console.error(e); el.innerHTML = adminErrorState('Тайлан гаргахад алдаа гарлаа.', 'crmReports()'); }
  }
  function crmExportReport() {
    const r = window._crmReport; if (!r) return;
    const rows = [['Сар', 'Хэлцэл', 'Дүн (сая ₮)', 'Шимтгэл (сая ₮)'], ...r.months.map(([m, x]) => [m, x.n, x.vol, x.com]), [], ['Агент', 'Лид', 'Хаасан', 'Хэлцэл', 'Дүн', 'Шимтгэл'],
      ...r.agents.map(([uid, a]) => [staffName(r.staff, uid), a.leads, a.won, a.deals, a.vol, a.com])];
    downloadText('bairx-report-' + new Date().toISOString().slice(0, 10) + '.csv', toCsv(rows));
  }

  // ===================================================================================
  // АГЕНТУУД — public profile cards (only what staff enter here)
  async function crmAgents() {
    await loadPriceData();
    const agents = await loadAgents(true);
    const el = crmBody();
    el.innerHTML = `<div class="crm-panel">
      <h3 class="route-h3">Агентын танилцуулга</h3>
      <label class="lf-field"><span>Засах агент</span><select class="form-input" id="agSel" onchange="crmFillAgent()"><option value="">+ Шинэ агент</option>${agents.map(a => `<option value="${esc(a.slug)}">${esc(a.name)}</option>`).join('')}</select></label>
      <div class="lf-grid">
        <label class="lf-field"><span>Нэр *</span><input class="form-input" id="agName" maxlength="80"></label>
        <label class="lf-field"><span>Байгууллага</span><input class="form-input" id="agOrg" maxlength="120"></label>
        <label class="lf-field"><span>Туршлага (жил)</span><input class="form-input" id="agYears" type="number" min="0" max="60"></label>
        <label class="lf-field"><span>Хаасан хэлцэл</span><input class="form-input" id="agDeals" type="number" min="0"></label>
        <label class="lf-field"><span>Нийт гүйлгээ (сая ₮)</span><input class="form-input" id="agVolume" type="number" min="0"></label>
        <label class="lf-field"><span>Утас</span><input class="form-input" id="agPhone" inputmode="numeric" maxlength="12"></label>
        <label class="lf-field"><span>Facebook (https://…)</span><input class="form-input" id="agFb" maxlength="200"></label>
        <label class="lf-field"><span>Instagram (https://…)</span><input class="form-input" id="agIg" maxlength="200"></label>
        <label class="lf-field"><span>Viber дугаар</span><input class="form-input" id="agViber" maxlength="12"></label>
        <label class="lf-field"><span>Telegram (@нэр)</span><input class="form-input" id="agTg" maxlength="40"></label>
        <label class="lf-field"><span>Дараалал</span><input class="form-input" id="agOrder" type="number" min="0" max="99"></label>
        <label class="lf-field"><span>Идэвхтэй</span><select class="form-input" id="agActive"><option value="1">Тийм</option><option value="0">Үгүй (нуух)</option></select></label>
      </div>
      <label class="lf-field"><span>Баталгаажсан амжилт</span><input class="form-input" id="agAch" maxlength="300"></label>
      <label class="lf-field"><span>Танилцуулга</span><textarea class="form-textarea" id="agBio" rows="3" maxlength="2000"></textarea></label>
      <label class="lf-field"><span>Хариуцдаг хотхон (Ctrl дарж олныг сонгоно)</span><select class="form-input" id="agComplexes" multiple size="5">${complexOptionsHtml()}</select></label>
      <label class="lf-field"><span>Онцлох зарын Firestore ID (таслалаар)</span><input class="form-input" id="agListings" maxlength="600"></label>
      <label class="lf-field"><span>Профайл зураг</span><input type="file" id="agPhotoFile" accept="image/*"></label>
      <div id="agPhotoPrev" class="cx-photos"></div>
      <button class="btn btn-blue" id="agSave" onclick="crmSaveAgent()">Хадгалах</button>
      <p class="muted-note">Өөр хүний зураг, мэдээллийг зөвшөөрөлгүй оруулахгүй. Тоон үзүүлэлтийг баримтаар шалгасны дараа оруулна.</p>
    </div>`;
    window._crmAgentsList = agents;
  }
  function crmFillAgent() {
    const a = (window._crmAgentsList || []).find(x => x.slug === document.getElementById('agSel').value) || {};
    const set = (id, v) => { document.getElementById(id).value = v == null ? '' : v; };
    set('agName', a.name); set('agOrg', a.org); set('agYears', a.yearsExperience); set('agDeals', a.dealsClosed); set('agVolume', a.totalVolume);
    set('agPhone', a.phone); set('agFb', a.facebook); set('agIg', a.instagram); set('agViber', a.viber); set('agTg', a.telegram);
    set('agOrder', a.order); set('agActive', a.active === false ? '0' : '1'); set('agAch', a.achievements); set('agBio', a.bio);
    set('agListings', (a.featuredListingIds || []).join(', '));
    [...document.getElementById('agComplexes').options].forEach(o => { o.selected = (a.complexIds || []).includes(o.value); });
    document.getElementById('agPhotoPrev').innerHTML = a.photo ? `<img src="${esc(a.photo)}" alt="">` : '';
  }
  async function crmSaveAgent() {
    const g = (id) => document.getElementById(id).value.trim();
    const name = g('agName'); if (!name) { showToast('Нэр оруулна уу'); return; }
    const slug = g('agSel') || BairxPricing.slugify(name);
    if (!slug) { showToast('Нэрээс ID үүсгэж чадсангүй'); return; }
    const n = (id) => { const x = numOrNull(g(id)); return x == null ? null : x; };
    const phone = g('agPhone') ? normalizeMnPhone(g('agPhone')) : '';
    if (g('agPhone') && !phone) { showToast('Утас 8 оронтой байх ёстой'); return; }
    for (const id of ['agFb', 'agIg']) if (g(id) && !/^https:\/\//i.test(g(id))) { showToast('Холбоос https://-ээр эхэлнэ'); return; }
    const doc = {
      name, org: g('agOrg'), yearsExperience: n('agYears'), dealsClosed: n('agDeals'), totalVolume: n('agVolume'), phone,
      facebook: g('agFb'), instagram: g('agIg'), viber: g('agViber').replace(/\D/g, ''), telegram: g('agTg').replace(/[^@A-Za-z0-9_]/g, ''),
      order: n('agOrder'), active: g('agActive') === '1', achievements: g('agAch'), bio: g('agBio').slice(0, 2000),
      complexIds: [...document.getElementById('agComplexes').selectedOptions].map(o => o.value),
      featuredListingIds: g('agListings').split(/[\s,]+/).map(s => s.replace(/[^A-Za-z0-9_-]/g, '')).filter(Boolean).slice(0, 12),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    document.getElementById('agSave').disabled = true;
    try {
      const file = document.getElementById('agPhotoFile').files[0];
      if (file) {
        const blob = await compressImage(file, 800, 0.85);
        const ref = storage.ref(`agent-images/${slug}/${Date.now()}.jpg`);
        await ref.put(blob, { contentType: 'image/jpeg' });
        doc.photo = await ref.getDownloadURL();
      }
      await db.collection('agents').doc(slug).set(doc, { merge: true });
      logAdminAction('save_agent', 'agent', slug, name);
      showToast('Агент хадгалагдлаа', 'success');
      await crmAgents(); document.getElementById('agSel').value = slug; crmFillAgent();
    } catch (e) { console.error(e); showToast('Хадгалахад алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : '')); document.getElementById('agSave').disabled = false; }
  }

  // ===================================================================================
  // СЭТГЭГДЭЛ БАТЛАХ
  let _rvStatus = 'pending';
  async function crmReviews() {
    const el = crmBody();
    try {
      const snap = await db.collection('reviews').where('status', '==', _rvStatus).limit(300).get();
      const list = snap.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      el.innerHTML = `<div class="admin-tabs">${[['pending', 'Хүлээгдэж буй'], ['approved', 'Нийтлэгдсэн'], ['rejected', 'Татгалзсан']].map(([k, l]) => `<button class="mytab ${_rvStatus === k ? 'active' : ''}" onclick="_rvStatus='${k}';crmReviews()">${l}</button>`).join('')}</div>
        ${list.length ? `<div class="crm-list">${list.map(r => { const id = r.id.replace(/[^A-Za-z0-9_-]/g, ''); return `<div class="crm-row"><div class="crm-row-main">
          <div class="crm-row-top"><span class="rv-stars">${'★'.repeat(r.rating)}</span><strong>${esc(r.name)}</strong><span class="muted-note">${tsDate(r.createdAt)}${r.agentSlug ? ' · агент: ' + esc(r.agentSlug) : ''}</span></div>
          <div class="crm-row-details">${esc(r.text)}</div>
          <input class="form-input" id="rvReply_${id}" maxlength="500" placeholder="BairX-ийн хариу (заавал биш)" value="${esc(r.reply || '')}"></div>
          <div class="crm-row-side">${_rvStatus !== 'approved' ? `<button class="btn btn-blue" onclick="crmSetReview('${id}','approved')">Нийтлэх</button>` : ''}
          ${_rvStatus !== 'rejected' ? `<button class="btn btn-ghost" onclick="crmSetReview('${id}','rejected')">Татгалзах</button>` : ''}</div></div>`; }).join('')}</div>` : adminEmptyState('Сэтгэгдэл алга', 'Энэ төлөвт сэтгэгдэл байхгүй.')}`;
    } catch (e) { console.error(e); el.innerHTML = adminErrorState('Сэтгэгдэл татахад алдаа гарлаа.', 'crmReviews()'); }
  }
  async function crmSetReview(id, status) {
    try {
      await db.collection('reviews').doc(id).update({ status, reply: (document.getElementById('rvReply_' + id)?.value || '').trim().slice(0, 500), reviewedBy: currentUser.uid, reviewedAt: firebase.firestore.FieldValue.serverTimestamp() });
      logAdminAction('moderate_review', 'review', id, status);
      showToast(status === 'approved' ? 'Нийтлэгдлээ' : 'Татгалзлаа', 'success'); crmReviews();
    } catch (e) { console.error(e); showToast('Шинэчилж чадсангүй'); }
  }

  // ===================================================================================
  // НҮҮР ХУУДАС — section switches + BairX Select picks
  async function crmHomeConfig() {
    const el = crmBody();
    delete _siteConfigCache.home; delete _siteConfigCache.featured;
    const [cfg, feat] = await Promise.all([loadSiteConfig('home'), loadSiteConfig('featured')]);
    el.innerHTML = `<div class="crm-panel"><h3 class="route-h3">Нүүр хуудасны хэсгүүд</h3>
      <div class="cfg-grid">${Object.entries(HOME_SECTIONS).map(([k, l]) => `<label class="consent-row"><input type="checkbox" data-sec="${k}" ${homeSectionOn(cfg, k) ? 'checked' : ''}> ${l}</label>`).join('')}</div>
      <h3 class="route-h3" style="margin-top:20px;">BairX Select — онцлох зарууд</h3>
      <p class="muted-note">Идэвхтэй зарын Firestore ID-г дарааллаар нь таслалаар оруулна (дээд тал нь 24). Зар бүрийг шалгаад хадгална.</p>
      <textarea class="form-textarea" id="cfgFeatured" rows="3">${esc((feat.listingIds || []).join(', '))}</textarea>
      <div id="cfgMsg" class="muted-note"></div>
      <button class="btn btn-blue" id="cfgSave" onclick="crmSaveHomeConfig()">Хадгалах</button></div>`;
  }
  async function crmSaveHomeConfig() {
    const sections = {};
    document.querySelectorAll('.cfg-grid input[data-sec]').forEach(i => { sections[i.dataset.sec] = i.checked; });
    const ids = [...new Set(document.getElementById('cfgFeatured').value.split(/[\s,]+/).map(s => s.replace(/[^A-Za-z0-9_-]/g, '')).filter(Boolean))].slice(0, 24);
    const msg = document.getElementById('cfgMsg');
    const bad = [];
    for (const id of ids) {
      try { const d = await db.collection('listings').doc(id).get(); if (!d.exists || d.data().status !== 'active') bad.push(id); } catch (e) { bad.push(id); }
    }
    if (bad.length) { msg.textContent = 'Олдоогүй эсвэл идэвхгүй зар: ' + bad.join(', '); return; }
    try {
      await Promise.all([
        db.doc('siteConfig/home').set({ sections, updatedBy: currentUser.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }),
        db.doc('siteConfig/featured').set({ listingIds: ids, updatedBy: currentUser.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() })
      ]);
      Object.keys(_siteConfigCache).forEach(k => delete _siteConfigCache[k]);
      logAdminAction('save_home_config', 'siteConfig', 'home', ids.length + ' онцлох');
      showToast('Хадгалагдлаа', 'success');
    } catch (e) { console.error(e); showToast('Хадгалахад алдаа гарлаа' + (e.code ? ' (' + e.code + ')' : '')); }
  }

  // ===================================================================================
  // ИМПОРТ (CSV / Excel) + ДАВХАРДАЛ ИЛРҮҮЛЭХ
  const IMPORT_KINDS = {
    complexes: { label: 'Хотхон', cols: 'name, district, khoroo, yearBuilt, floors, developer, buildingType, lat, lng, address',
      fields: { name: ['name', 'нэр', 'хотхон'], district: ['district', 'дүүрэг'], khoroo: ['khoroo', 'хороо'], yearBuilt: ['yearbuilt', 'он', 'ашиглалтад орсон'], floors: ['floors', 'давхар'], developer: ['developer', 'компани'], buildingType: ['buildingtype', 'төрөл'], lat: ['lat'], lng: ['lng', 'lon'], address: ['address', 'хаяг'] } },
    sales: { label: 'Бодит хэлцэл', cols: 'complex, date, price, area, rooms, floor',
      fields: { complex: ['complex', 'complexid', 'хотхон'], date: ['date', 'огноо'], price: ['price', 'үнэ'], area: ['area', 'areaM2'.toLowerCase(), 'талбай'], rooms: ['rooms', 'өрөө'], floor: ['floor', 'давхар'] } },
    listings: { label: 'Зар (хүлээгдэж буй төлөвтэй орно)', cols: 'title, category, complex, district, price, area, rooms, floor, phone, description',
      fields: { title: ['title', 'гарчиг'], category: ['category', 'ангилал'], complex: ['complex', 'хотхон'], district: ['district', 'дүүрэг'], price: ['price', 'үнэ'], area: ['area', 'талбай'], rooms: ['rooms', 'өрөө'], floor: ['floor', 'давхар'], phone: ['phone', 'утас'], description: ['description', 'тайлбар'] } }
  };
  let _importRows = null;
  function crmImport() {
    const el = crmBody();
    el.innerHTML = `<div class="crm-panel"><h3 class="route-h3">CSV / Excel импорт</h3>
      <p class="muted-note">Зөвхөн зөвшөөрөлтэй, өөрийн эх сурвалжийн өгөгдөл оруулна. Эхний мөр нь баганын нэр байна.</p>
      <div class="lf-grid"><label class="lf-field"><span>Төрөл</span><select class="form-input" id="imKind" onchange="crmImportHint()">${Object.entries(IMPORT_KINDS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></label>
        <label class="lf-field"><span>Файл (.csv, .xlsx)</span><input type="file" id="imFile" accept=".csv,.txt,.tsv,.xlsx,.xls"></label></div>
      <p class="muted-note" id="imHint"></p>
      <button class="btn btn-ghost" onclick="crmImportPreview()">Урьдчилан харах</button>
      <div id="imPreview"></div></div>
      <div class="crm-panel"><h3 class="route-h3">Давхардсан зар илрүүлэх</h3>
      <p class="muted-note">Идэвхтэй заруудыг хотхон + талбай + давхар + өрөөгөөр (статистикт ашигладаг ижил дүрмээр) бүлэглэнэ. Нэг утастай ижил үнэтэй зарыг мөн илрүүлнэ.</p>
      <button class="btn btn-ghost" onclick="crmFindDuplicates()">Шалгах</button><div id="dupOut"></div></div>`;
    crmImportHint();
  }
  function crmImportHint() { const k = document.getElementById('imKind').value; document.getElementById('imHint').textContent = 'Баганууд: ' + IMPORT_KINDS[k].cols; }
  async function crmImportPreview() {
    const kind = document.getElementById('imKind').value, file = document.getElementById('imFile').files[0];
    const out = document.getElementById('imPreview');
    if (!file) { showToast('Файл сонгоно уу'); return; }
    await loadPriceData(true);
    let rows;
    try { rows = csvObjects(await readTableFile(file), IMPORT_KINDS[kind].fields); } catch (e) { out.innerHTML = `<p class="muted-note">Файл уншиж чадсангүй: ${esc(e.message)}</p>`; return; }
    const P = BairxPricing, seen = new Set();
    let existingKeys = new Set();
    if (kind === 'listings') {
      try { const s = await db.collection('listings').where('status', 'in', ['active', 'pending']).limit(5000).get(); existingKeys = new Set(s.docs.map(d => P.dedupeKey(P.normalizeListing(d.id, d.data())))); } catch (e) {}
    }
    const checked = rows.map(r => {
      const errs = []; let doc = null;
      if (kind === 'complexes') {
        if (!r.name) errs.push('нэр алга');
        const id = P.slugify(r.name);
        doc = { id, name: r.name.slice(0, 120), district: (r.district || '').slice(0, 40), khoroo: numOrNull(r.khoroo), yearBuilt: numOrNull(r.yearBuilt), floors: numOrNull(r.floors),
          developer: (r.developer || '').slice(0, 120), buildingType: (r.buildingType || '').slice(0, 60), lat: numOrNull(r.lat), lng: numOrNull(r.lng), address: (r.address || '').slice(0, 200) };
        if (seen.has(id)) errs.push('файлд давхардсан'); seen.add(id);
        if (priceData.complexes.has(id)) errs.push('аль хэдийн бий (шинэчлэгдэнэ)');
      } else if (kind === 'sales') {
        const complexId = resolveComplexId(r.complex), date = isoDate(r.date), price = numOrNull(r.price), areaM2 = numOrNull(r.area);
        if (!complexId) errs.push('хотхон алга'); if (!date) errs.push('огноо буруу'); if (!(price > 0)) errs.push('үнэ буруу'); if (!(areaM2 > 0)) errs.push('талбай буруу');
        if (price > 0 && areaM2 > 0 && (price / areaM2 < 0.3 || price / areaM2 > 40)) errs.push('1 м² үнэ хэвийн бус');
        if (complexId && !priceData.complexes.has(complexId)) errs.push('каталогт байхгүй хотхон');
        doc = { complexId, date, price, areaM2, rooms: numOrNull(r.rooms), floor: numOrNull(r.floor) };
        const k = [complexId, date, price, areaM2].join('|'); if (seen.has(k)) errs.push('файлд давхардсан'); seen.add(k);
      } else {
        const cat = ['apartment', 'rent', 'office', 'house', 'land'].includes(r.category) ? r.category : 'apartment';
        const price = numOrNull(r.price), area = numOrNull(r.area), phone = normalizeMnPhone(r.phone || '');
        if (!r.title) errs.push('гарчиг алга'); if (!(price > 0)) errs.push('үнэ буруу'); if (!(area > 0)) errs.push('талбай буруу'); if (!phone) errs.push('утас буруу');
        doc = { title: r.title.slice(0, 140), category: cat, cat, complex: r.complex || '', complexId: resolveComplexId(r.complex), district: r.district || '', price, area, areaM2: area,
          rooms: numOrNull(r.rooms), floor: r.floor || '', sellerPhone: phone || '', description: (r.description || '').slice(0, 3000) };
        const k = P.dedupeKey(doc);
        if (doc.complexId && (seen.has(k) || existingKeys.has(k))) errs.push('давхардсан байж магадгүй (хотхон+талбай+давхар+өрөө)');
        seen.add(k);
      }
      return { row: r._row, doc, errs: errs.filter(e => !e.startsWith('аль хэдийн')), warn: errs.filter(e => e.startsWith('аль хэдийн')) };
    });
    _importRows = { kind, checked };
    const ok = checked.filter(c => !c.errs.length);
    out.innerHTML = `<p><strong>${ok.length}</strong> мөр бэлэн · <strong>${checked.length - ok.length}</strong> мөр алдаатай (алгасна)</p>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Мөр</th><th>Утга</th><th>Шалгалт</th></tr></thead><tbody>
      ${checked.slice(0, 200).map(c => `<tr class="${c.errs.length ? 'neg' : ''}"><td>${c.row}</td><td>${esc(Object.values(c.doc || {}).filter(v => v !== '' && v != null).slice(0, 6).join(' · '))}</td><td>${esc([...c.errs, ...c.warn].join('; ') || 'OK')}</td></tr>`).join('')}</tbody></table></div>
      ${ok.length ? `<button class="btn btn-blue" id="imGo" onclick="crmImportCommit()">${ok.length} мөрийг оруулах</button>` : ''}`;
  }
  async function crmImportCommit() {
    if (!_importRows) return;
    const { kind, checked } = _importRows;
    const ok = checked.filter(c => !c.errs.length).map(c => c.doc);
    const btn = document.getElementById('imGo'); btn.disabled = true; btn.textContent = 'Оруулж байна…';
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    let done = 0;
    try {
      for (let i = 0; i < ok.length; i += 400) {
        const batch = db.batch();
        for (const d of ok.slice(i, i + 400)) {
          if (kind === 'complexes') batch.set(db.collection('complexes').doc(d.id), Object.assign({}, d, { updatedAt: ts }), { merge: true });
          else if (kind === 'sales') batch.set(db.collection('sales').doc(), Object.assign({}, d, { source: 'import', createdBy: currentUser.uid, createdAt: ts }));
          else batch.set(db.collection('listings').doc(), Object.assign({}, d, {
            ownerId: currentUser.uid, status: 'pending', listingVerified: false, reportCount: 0, viewCount: 0, source: 'import',
            sellerName: (currentUser.firstName || '') + ' ' + (currentUser.lastName || ''), images: [], img: '', features: [], priceHistory: [],
            createdAt: ts, expiresAt: Date.now() + 30 * 86400000, bumpedAt: Date.now()
          }));
        }
        await batch.commit(); done += Math.min(400, ok.length - i);
      }
      logAdminAction('import_' + kind, kind, 'csv', done + ' мөр');
      showToast(done + ' мөр оруулагдлаа' + (kind === 'listings' ? ' (батлах хүлээгдэж байна)' : ''), 'success');
      _importRows = null; document.getElementById('imPreview').innerHTML = `<p class="lead-success">${done} мөр оруулагдлаа.</p>`;
      if (kind !== 'listings') loadPriceData(true);
    } catch (e) { console.error(e); showToast(`${done} мөр орсны дараа алдаа гарлаа` + (e.code ? ' (' + e.code + ')' : '')); btn.disabled = false; }
  }
  async function crmFindDuplicates() {
    const out = document.getElementById('dupOut'); out.innerHTML = '<p class="muted-note">Шалгаж байна…</p>';
    try {
      const P = BairxPricing;
      const snap = await db.collection('listings').where('status', '==', 'active').limit(5000).get();
      const ls = snap.docs.map(d => P.normalizeListing(d.id, d.data()));
      const groups = new Map(), byPhone = new Map();
      for (const l of ls) {
        if (l.complexId && P.isStatsEligible(l)) { const k = P.dedupeKey(l); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(l); }
        const p = String(l.sellerPhone || '').replace(/\D/g, ''); if (p) { const k = p + '|' + l.price; if (!byPhone.has(k)) byPhone.set(k, []); byPhone.get(k).push(l); }
      }
      const dup = [...groups.values()].filter(g => g.length > 1), dupPhone = [...byPhone.values()].filter(g => g.length > 1);
      const rowsHtml = (list) => list.map(g => `<tr><td>${g.map(l => `<a href="/listing/${esc(l.id)}" onclick="return go(event,'/listing/${esc(l.id)}')">${esc(l.id)}</a>`).join('<br>')}</td><td>${esc(g[0].complex || g[0].complexId || '')}</td><td>${g.map(l => esc(l.price) + ' сая').join(', ')}</td></tr>`).join('');
      out.innerHTML = `<p>${ls.length} идэвхтэй зараас: <strong>${dup.length}</strong> бүлэг ижил байр, <strong>${dupPhone.length}</strong> бүлэг ижил утас+үнэ. (Статистикт ижил байрыг нэг гэж аль хэдийн тооцдог.)</p>
        ${dup.length ? `<h4>Ижил байр (хотхон+талбай+давхар+өрөө)</h4><div class="table-wrap"><table class="data-table"><thead><tr><th>Зар</th><th>Хотхон</th><th>Үнэ</th></tr></thead><tbody>${rowsHtml(dup)}</tbody></table></div>` : ''}
        ${dupPhone.length ? `<h4>Ижил утас + үнэ</h4><div class="table-wrap"><table class="data-table"><thead><tr><th>Зар</th><th>Хотхон</th><th>Үнэ</th></tr></thead><tbody>${rowsHtml(dupPhone)}</tbody></table></div>` : ''}`;
    } catch (e) { console.error(e); out.innerHTML = '<p class="muted-note">Шалгаж чадсангүй.</p>'; }
  }

  // ===================================================================================
  // СТАТИСТИК — manual recompute while Cloud Functions are not deployed (admin/owner only)
  async function crmStats() {
    const el = crmBody();
    const [summary] = await Promise.all([loadSiteStat('summary')]);
    el.innerHTML = `<div class="crm-panel"><h3 class="route-h3">Үнийн статистик шинэчлэх</h3>
      <p>Сүүлд шинэчилсэн: <strong>${esc(summary?.updatedDate || '—')}</strong> ${summary?.source ? '(' + (summary.source === 'manual' ? 'гараар' : 'Cloud Function') + ')' : ''}</p>
      <p class="muted-note">Cloud Function (өдөр бүр 03:00) deploy хийгдээгүй үед админ эндээс <strong>яг ижил томьёогоор</strong> (js/pricing.js buildAllStats) тооцоолж болно. Тооцоолол таны хөтөч дээр хийгдэж, үр дүн нь "гараар" гэсэн тэмдэгтэй, audit log-д бүртгэгдэнэ. Нийтийн хэрэглэгч статистик өөрчлөх боломжгүй (Firestore rules).</p>
      ${isAdminOrOwnerUser() ? `<button class="btn btn-blue" id="stRun" onclick="crmManualStats(false)">Урьдчилан тооцоолох</button>` : '<p class="muted-note">Зөвхөн админ/эзэмшигч ажиллуулна.</p>'}
      <button class="btn btn-ghost" onclick="crmRecomputeNow(this)">Cloud Function-оор шинэчлэх</button>
      <div id="stOut"></div></div>`;
  }
  let _manualStats = null;
  async function crmManualStats(commit) {
    const out = document.getElementById('stOut');
    const P = BairxPricing;
    try {
      if (!commit) {
        out.innerHTML = '<p class="muted-note">Өгөгдөл татаж байна…</p>';
        const [ls, ss, cx] = await Promise.all([db.collection('listings').where('status', '==', 'active').get(), db.collection('sales').get(), db.collection('complexes').get()]);
        const now = Date.now(), today = P.ubDate(now);
        _manualStats = P.buildAllStats(Object.fromEntries(cx.docs.map(d => [d.id, d.data()])), ls.docs.map(d => P.normalizeListing(d.id, d.data())), ss.docs.map(d => d.data()), now, today);
        const usable = Object.values(_manualStats.stats).filter(s => s.avgPpm2 != null && s.listingCount >= P.MIN_LISTINGS).length;
        out.innerHTML = `<p>${_manualStats.ids.length} хотхон (дундаж харуулах боломжтой: ${usable}) · ${_manualStats.summary.activeListingCount} идэвхтэй зар · ${_manualStats.summary.salesCount} хэлцэл · ${_manualStats.hotlist.items.length} хямд зар</p>
          <button class="btn btn-blue" onclick="crmManualStats(true)">Хадгалах (нийтэд харагдана)</button>`;
        return;
      }
      if (!_manualStats) return;
      const ts = firebase.firestore.FieldValue.serverTimestamp();
      const writes = _manualStats.ids.map(id => [db.collection('complexStats').doc(id), Object.assign({}, _manualStats.stats[id], { source: 'manual', updatedAt: ts })]);
      writes.push([db.doc('siteStats/hotlist'), Object.assign({}, _manualStats.hotlist, { source: 'manual', updatedAt: ts })]);
      writes.push([db.doc('siteStats/summary'), Object.assign({}, _manualStats.summary, { source: 'manual', updatedAt: ts })]);
      for (let i = 0; i < writes.length; i += 400) { const b = db.batch(); writes.slice(i, i + 400).forEach(([r, d]) => b.set(r, d)); await b.commit(); }
      // Stale stats docs (no catalogue entry, listings or deals any more) are removed.
      const existing = await db.collection('complexStats').get();
      const keep = new Set(_manualStats.ids);
      const stale = existing.docs.filter(d => !keep.has(d.id));
      for (let i = 0; i < stale.length; i += 400) { const b = db.batch(); stale.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
      logAdminAction('manual_stats', 'complexStats', 'all', `${_manualStats.ids.length} хотхон, ${_manualStats.hotlist.items.length} хямд`);
      out.innerHTML = `<p class="lead-success">Шинэчлэгдлээ: ${_manualStats.ids.length} хотхон, ${_manualStats.hotlist.items.length} хямд зар.</p>`;
      _manualStats = null; loadPriceData(true);
    } catch (e) { console.error('manual stats failed:', e.code, e.message); out.innerHTML = `<p class="muted-note">Алдаа: ${esc(e.code || e.message)}${e.code === 'permission-denied' ? ' — Firestore rules v3 deploy хийгдээгүй байна.' : ''}</p>`; }
  }

  // /crm/manager — manager overview = reports tab
  registerRoute(/^\/crm\/manager$/, async () => ({
    title: 'Менежерийн самбар — BairX', description: 'BairX борлуулалтын тайлан',
    html: `<div id="crmRoot" class="crm-root"></div>`,
    after: () => { _crmTab = 'reports'; renderCrm(); }
  }));
