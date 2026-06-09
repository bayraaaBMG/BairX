  // ===== SEARCH =====
  function performSearch() {
    const type = document.getElementById('searchType').value;
    const loc = document.getElementById('searchLocation').value;
    const rooms = document.getElementById('searchRooms').value;
    const min = parseFloat(document.getElementById('priceMin').value) || 0;
    const max = parseFloat(document.getElementById('priceMax').value) || Infinity;
    const heroQ = (document.getElementById('heroSearch')?.value || '').trim();

    // Hero хайлтыг доорх filter panel-тай синк хийнэ
    if (document.getElementById('fDistrict')) document.getElementById('fDistrict').value = loc;
    if (document.getElementById('fRooms')) document.getElementById('fRooms').value = rooms;
    if (document.getElementById('fPriceMin')) document.getElementById('fPriceMin').value = min > 0 ? min : '';
    if (document.getElementById('fPriceMax')) document.getElementById('fPriceMax').value = max < Infinity ? max : '';
    if (heroQ) {
      searchText = heroQ;
      if (document.getElementById('fSearch')) document.getElementById('fSearch').value = heroQ;
    }

    // Category filter pill-ийг синк хийнэ
    if (type !== 'all') {
      currentCat = type;
      document.querySelectorAll('.filter-pill[data-cat]').forEach(x => {
        x.classList.toggle('active', x.dataset.cat === type);
      });
    }

    // Let getFilteredListings() handle all filtering + sorting via the synced filter panel
    const results = getFilteredListings();

    renderListings(results);
    updateFilterCount();
    showToast(`${results.length} үр дүн олдлоо`, 'success');
    setTimeout(() => scrollToSection('listings'), 400);
  }

