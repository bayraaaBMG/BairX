  // ===== SAVED SEARCHES =====
  async function saveCurrentSearch() {
    if (!currentUser) { showToast('Хайлт хадгалахын тулд нэвтэрнэ үү'); openAuth(); return; }
    const district = document.getElementById('fDistrict')?.value || 'all';
    const priceMin = document.getElementById('fPriceMin')?.value || '';
    const priceMax = document.getElementById('fPriceMax')?.value || '';
    const areaMin = document.getElementById('fAreaMin')?.value || '';
    const areaMax = document.getElementById('fAreaMax')?.value || '';
    const rooms = document.getElementById('fRooms')?.value || 'all';
    const keyword = (searchText || document.getElementById('fSearch')?.value || '').trim();
    const hasFilter = district !== 'all' || priceMin || priceMax || areaMin || areaMax || rooms !== 'all' || keyword || currentCat !== 'all' || activeFilterToggles.length > 0;
    if (!hasFilter) { showToast('Эхлээд хайлтын нөхцөл тохируулна уу'); return; }
    const districtLabels = {'khan-uul':'Хан-Уул','sukhbaatar':'Сүхбаатар','chingeltei':'Чингэлтэй','bayanzurkh':'Баянзүрх','bayangol':'Баянгол','songinokhairkhan':'Сонгинохайрхан','nalaikh':'Налайх'};
    const catLabels = {apartment:'Орон сууц',house:'Хаус',land:'Газар',office:'Оффис',rent:'Түрээс',all:'Бүгд'};
    const parts = [];
    if (keyword) parts.push('"' + keyword + '"');
    if (currentCat !== 'all') parts.push(catLabels[currentCat] || currentCat);
    if (district !== 'all') parts.push(districtLabels[district] || district);
    if (rooms !== 'all') parts.push(rooms + ' өрөө');
    if (priceMin || priceMax) parts.push((priceMin || '0') + '–' + (priceMax || '∞') + ' сая');
    const label = parts.length > 0 ? parts.join(' · ') : 'Хайлт';
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <div style="padding:32px 28px;">
        <span class="al-eyebrow">Хайлт хадгалах</span>
        <div class="al-title" style="margin-bottom:6px;">Хайлтыг хадгалах</div>
        <div style="font-size:13px;color:var(--ink-3);margin-bottom:20px;">${label}</div>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:14px;background:var(--paper-2);border-radius:12px;margin-bottom:20px;">
          <input type="checkbox" id="saveSearchEmail" style="width:16px;height:16px;accent-color:var(--primary);" />
          <div>
            <div style="font-weight:700;font-size:14px;">И-мэйлээр мэдэгдэл авах</div>
            <div style="font-size:12px;color:var(--ink-3);">Шинэ зар орвол ${currentUser.email} руу илгээнэ</div>
          </div>
        </label>
        <button class="btn btn-blue btn-lg" style="width:100%;justify-content:center;" onclick="confirmSaveSearch(${JSON.stringify({ district, priceMin, priceMax, areaMin, areaMax, rooms, keyword, category: currentCat, toggles: activeFilterToggles, label }).replace(/"/g, '&quot;')})">
          Хадгалах
        </button>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  async function confirmSaveSearch(filters) {
    const emailNotify = document.getElementById('saveSearchEmail')?.checked || false;
    try {
      await db.collection('savedSearches').add({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        ...filters,
        emailNotify,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      closeModal();
      showToast('Хайлт хадгалагдлаа', 'success');
    } catch(e) {
      showToast('Хадгалахад алдаа гарлаа');
    }
  }

  async function openSavedSearches() {
    if (!currentUser) { showToast('Нэвтэрнэ үү'); openAuth(); return; }
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      <div style="padding:32px 28px;">
        <span class="al-eyebrow">Миний хайлтууд</span>
        <div class="al-title" style="margin-bottom:20px;">Хадгалсан хайлтууд</div>
        <div id="savedSearchList" style="display:grid;gap:12px;">
          <div style="text-align:center;padding:40px;color:var(--ink-3);">Ачааллаж байна…</div>
        </div>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    try {
      const snap = await db.collection('savedSearches').where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc').limit(20).get();
      const list = document.getElementById('savedSearchList');
      if (!list) return;
      if (snap.empty) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ink-3);">Хадгалсан хайлт алга байна</div>';
        return;
      }
      list.innerHTML = snap.docs.map(doc => {
        const d = doc.data();
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--line);border-radius:12px;cursor:pointer;" onclick="applySavedSearch(${JSON.stringify(d).replace(/"/g, '&quot;')})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:14px;">${d.label || 'Хайлт'}</div>
              <div style="font-size:11px;color:var(--ink-3);">${d.emailNotify ? '📧 и-мэйл мэдэгдэлтэй' : 'Мэдэгдэлгүй'}</div>
            </div>
            <button onclick="event.stopPropagation();deleteSavedSearch('${doc.id}',this.closest('div[style]'))" style="background:none;border:none;cursor:pointer;color:var(--danger);padding:4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        `;
      }).join('');
    } catch(e) {
      const list = document.getElementById('savedSearchList');
      if (list) list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--danger);">Татахад алдаа гарлаа</div>';
    }
  }

  function applySavedSearch(d) {
    if (d.district && document.getElementById('fDistrict')) document.getElementById('fDistrict').value = d.district;
    if (d.priceMin && document.getElementById('fPriceMin')) document.getElementById('fPriceMin').value = d.priceMin;
    if (d.priceMax && document.getElementById('fPriceMax')) document.getElementById('fPriceMax').value = d.priceMax;
    if (d.areaMin && document.getElementById('fAreaMin')) document.getElementById('fAreaMin').value = d.areaMin;
    if (d.areaMax && document.getElementById('fAreaMax')) document.getElementById('fAreaMax').value = d.areaMax;
    if (d.rooms && document.getElementById('fRooms')) document.getElementById('fRooms').value = d.rooms;
    if (d.keyword) { searchText = d.keyword; const f = document.getElementById('fSearch'); if(f) f.value = d.keyword; }
    if (d.category) { currentCat = d.category; document.querySelectorAll('.filter-pill[data-cat]').forEach(x => x.classList.toggle('active', x.dataset.cat === d.category)); }
    if (d.toggles) {
      activeFilterToggles = d.toggles;
      document.querySelectorAll('.filter-toggle').forEach(t => t.classList.toggle('active', activeFilterToggles.includes(t.dataset.ftoggle)));
    }
    closeModal();
    applyFilters();
    showPage('listings');
    showToast('Хайлт ачааллагдлаа', 'success');
  }

  async function deleteSavedSearch(docId, el) {
    try {
      await db.collection('savedSearches').doc(docId).delete();
      if (el) el.remove();
      showToast('Хайлт устгагдлаа');
    } catch(e) { showToast('Устгахад алдаа гарлаа'); }
  }

