  // ===== ADVANCED FILTER =====
  let activeFilterToggles = [];

  document.querySelectorAll('.filter-toggle').forEach(t => {
    t.addEventListener('click', () => {
      t.classList.toggle('active');
      const f = t.dataset.ftoggle;
      if (t.classList.contains('active')) {
        if (!activeFilterToggles.includes(f)) activeFilterToggles.push(f);
      } else {
        activeFilterToggles = activeFilterToggles.filter(x => x !== f);
      }
      updateFilterCount();
    });
  });

  function getFilteredListings() {
    let results = listings.filter(l => !l._inactive);
    const district = document.getElementById('fDistrict')?.value || 'all';
    const priceMin = parseFloat(document.getElementById('fPriceMin')?.value) || 0;
    const priceMax = parseFloat(document.getElementById('fPriceMax')?.value) || Infinity;
    const areaMin = parseFloat(document.getElementById('fAreaMin')?.value) || 0;
    const areaMax = parseFloat(document.getElementById('fAreaMax')?.value) || Infinity;
    const rooms = document.getElementById('fRooms')?.value || 'all';
    const yearMin = parseInt(document.getElementById('fYearMin')?.value) || 0;
    const yearMax = parseInt(document.getElementById('fYearMax')?.value) || 9999;
    const floorMin = parseInt(document.getElementById('fFloorMin')?.value) || 0;
    const floorMax = parseInt(document.getElementById('fFloorMax')?.value) || 9999;
    const q = (searchText || (document.getElementById('fSearch')?.value) || '').trim().toLowerCase();

    if (q) {
      results = results.filter(l => {
        const catMap = { apartment: 'орон сууц байр', house: 'хаус хувийн', land: 'газар', office: 'оффис', rent: 'түрээс' };
        const haystack = [l.title, l.loc, l.district, catMap[l.cat] || l.cat, String(l.rooms), String(l.price), l.description || ''].join(' ').toLowerCase();
        return q.split(/\s+/).every(word => haystack.includes(word));
      });
    }

    if (district !== 'all') results = results.filter(l => l.district === district);
    results = results.filter(l => l.cat === 'rent' || (l.price >= priceMin && l.price <= priceMax));
    results = results.filter(l => l.area >= areaMin && l.area <= areaMax);
    if (rooms !== 'all') {
      const r = parseInt(rooms);
      results = results.filter(l => typeof l.rooms === 'number' && (r === 4 ? l.rooms >= 4 : l.rooms === r));
    }
    // Year filter
    if (yearMin > 0 || yearMax < 9999) {
      results = results.filter(l => !l.year || (l.year >= yearMin && l.year <= yearMax));
    }
    // Floor filter (extract floor number from floor string like "8/16")
    if (floorMin > 0 || floorMax < 9999) {
      results = results.filter(l => {
        const f = parseInt(String(l.floor).split('/')[0]);
        return isNaN(f) || (f >= floorMin && f <= floorMax);
      });
    }
    // Toggles
    if (activeFilterToggles.includes('new')) results = results.filter(l => l.badges.includes('new'));
    if (activeFilterToggles.includes('verified')) results = results.filter(l => l.badges.includes('verified'));
    if (activeFilterToggles.includes('below')) results = results.filter(l => l.tag && l.tag.type === 'below');
    if (activeFilterToggles.includes('loan')) results = results.filter(l => l.loanType && !l.loanType.includes('Бэлэн'));
    if (activeFilterToggles.includes('parking')) results = results.filter(l => l.parking && !l.parking.includes('Байхгүй') && !l.parking.includes('Хамаарахгүй'));
    if (activeFilterToggles.includes('furnished')) results = results.filter(l =>
      (l.condition && l.condition.toLowerCase().includes('тавилга')) ||
      (Array.isArray(l.features) && l.features.some(f => f.toLowerCase().includes('тавилга')))
    );
    if (activeFilterToggles.includes('vip')) results = results.filter(l => l.badges && l.badges.includes('vip'));
    if (activeFilterToggles.includes('withphoto')) results = results.filter(l =>
      (Array.isArray(l.images) && l.images.length > 0) ||
      (Array.isArray(l._gallery) && l._gallery.length > 0) ||
      (l.img && l.img.startsWith('http'))
    );

    // Category filter still applies
    if (currentCat !== 'all') results = results.filter(l => l.cat === currentCat);

    // Apply sort
    if (currentSort === 'price-asc') results.sort((a, b) => a.price - b.price);
    else if (currentSort === 'price-desc') results.sort((a, b) => b.price - a.price);
    else if (currentSort === 'area-desc') results.sort((a, b) => b.area - a.area);
    else if (currentSort === 'vip-first') results.sort((a, b) => {
      const av = a.badges && a.badges.includes('vip') ? 1 : 0;
      const bv = b.badges && b.badges.includes('vip') ? 1 : 0;
      return bv - av || b.id - a.id;
    });
    else if (currentSort === 'date-asc') results.sort((a, b) => a.id - b.id);
    else results.sort((a, b) => b.id - a.id); // default: newest first

    return results;
  }

  function setSorting(val) {
    currentSort = val;
    applyListingFilter();
  }

  function updateFilterCount() {
    const count = getFilteredListings().length;
    const el = document.getElementById('filterCount');
    if (el) el.textContent = count;
  }

  function updateCatPillCounts() {
    ['all', 'apartment', 'house', 'land', 'office', 'rent'].forEach(function(cat) {
      const el = document.getElementById('cnt-' + cat);
      if (el) el.textContent = cat === 'all' ? listings.length : listings.filter(function(l) { return l.cat === cat; }).length;
    });
    const tlc = document.getElementById('totalListingCount');
    if (tlc) tlc.textContent = listings.length;
  }

  function applyFilters() {
    const results = getFilteredListings();
    renderListings(results);
    renderFilterTags();
    updateFilterCount();
    if (mapViewOn) renderMiniMap(results);
    showToast(`${results.length} зар олдлоо`, 'success');
  }

  function searchByDistrict(district) {
    if (document.getElementById('fDistrict')) document.getElementById('fDistrict').value = district;
    // Reset category to all
    currentCat = 'all';
    document.querySelectorAll('.filter-pill[data-cat]').forEach(x => x.classList.toggle('active', x.dataset.cat === 'all'));
    const results = getFilteredListings();
    renderListings(results);
    updateFilterCount();
    scrollToSection('listings');
    showToast(`${results.length} зар олдлоо`, 'success');
  }

  function resetFilters() {
    ['fDistrict'].forEach(id => { const el=document.getElementById(id); if(el)el.value='all'; });
    ['fRooms'].forEach(id => { const el=document.getElementById(id); if(el)el.value='all'; });
    ['fPriceMin','fPriceMax','fAreaMin','fAreaMax','fYearMin','fYearMax','fFloorMin','fFloorMax'].forEach(id => { const el=document.getElementById(id); if(el)el.value=''; });
    const fSearch = document.getElementById('fSearch');
    if (fSearch) fSearch.value = '';
    searchText = '';
    document.querySelectorAll('.filter-toggle').forEach(t => t.classList.remove('active'));
    activeFilterToggles = [];
    currentCat = 'all';
    document.querySelectorAll('.filter-pill[data-cat]').forEach(x => x.classList.toggle('active', x.dataset.cat === 'all'));
    const sel = document.getElementById('sortSelect');
    if (sel) sel.value = 'default';
    currentSort = 'default';
    renderListings(getFilteredListings());
    renderFilterTags();
    updateFilterCount();
    showToast('Шүүлтүүр цэвэрлэгдлээ');
  }

