  // ===== HOME SEARCH (unegui.mn-style: category tabs + one filter row + quick chips) =====
  // Keeps the tab row and the "Төрөл" select in the filter row in sync with each other —
  // either one is a valid way to pick a category, and both drive the same value.
  function setHomeCatTab(cat) {
    document.querySelectorAll('#homeCatTabs .home-cat-tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));
    const sel = document.getElementById('hSearchType');
    if (sel && sel.value !== cat) sel.value = cat;
  }

  function performSearch() {
    const activeTab = document.querySelector('#homeCatTabs .home-cat-tab.active');
    const cat = activeTab ? activeTab.dataset.cat : 'all';
    const district = document.getElementById('hSearchDistrict')?.value || 'all';
    const keyword = (document.getElementById('hSearchKeyword')?.value || '').trim();
    const priceMin = document.getElementById('hSearchPriceMin')?.value || '';
    const priceMax = document.getElementById('hSearchPriceMax')?.value || '';
    const areaMin = document.getElementById('hSearchAreaMin')?.value || '';
    const areaMax = document.getElementById('hSearchAreaMax')?.value || '';
    const chipFilters = Array.from(document.querySelectorAll('.home-chip-row .chip.active')).map(c => c.dataset.filter);

    // Sync onto the real Listings-page filter panel, then let getFilteredListings()
    // (filters-advanced.js) do the actual filtering — same pattern the category-tile
    // shortcuts elsewhere on the home page already use.
    currentCat = cat;
    document.querySelectorAll('.filter-pill[data-cat]').forEach(x => x.classList.toggle('active', x.dataset.cat === cat));

    const fDistrict = document.getElementById('fDistrict');
    if (fDistrict) fDistrict.value = district;

    searchText = keyword;
    const fSearch = document.getElementById('fSearch');
    if (fSearch) fSearch.value = keyword;

    const fPriceMin = document.getElementById('fPriceMin');
    const fPriceMax = document.getElementById('fPriceMax');
    if (fPriceMin) fPriceMin.value = priceMin;
    if (fPriceMax) fPriceMax.value = priceMax;

    const fAreaMin = document.getElementById('fAreaMin');
    const fAreaMax = document.getElementById('fAreaMax');
    if (fAreaMin) fAreaMin.value = areaMin;
    if (fAreaMax) fAreaMax.value = areaMax;

    activeFilterToggles = chipFilters;
    document.querySelectorAll('.filter-toggle').forEach(t => t.classList.toggle('active', chipFilters.includes(t.dataset.ftoggle)));

    showPage('listings');
    setTimeout(() => {
      if (typeof expandAdvancedFiltersIfActive === 'function') expandAdvancedFiltersIfActive();
      const results = getFilteredListings();
      renderListings(results);
      renderFilterTags();
      updateFilterCount();
      showToast(`${results.length} зар олдлоо`, 'success');
      scrollToSection('listings');
    }, 100);
  }

  document.querySelectorAll('.home-chip-row .chip[data-filter]').forEach(c => {
    c.addEventListener('click', () => c.classList.toggle('active'));
  });
