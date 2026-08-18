  // ===== DEMOGRAPHICS =====
  // Per-district single-household % and per-age-bracket buyer % used to live here as
  // hardcoded, invented numbers (no real source ever existed for either breakdown) — removed
  // along with the two cards in index.html that displayed them (#singleDistList/#ageDistList
  // no longer exist). The two real, ҮСХ-2024-sourced stats above them (31.4% ганц бие өрх,
  // 28.4 нас дундаж гэрлэх нас) are untouched and rendered directly in the HTML, not by this
  // function. Left as a no-op rather than removing the function/call site, since init.js
  // still calls renderDemographics() and other code isn't otherwise touched this pass.
  function renderDemographics() {}

  // ===== EVENT LISTENERS for new modules =====
  // Rent tabs
  document.querySelectorAll('.rent-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.rent-tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      renderRentListings(t.dataset.rentType);
    });
  });

  // Buy vs Rent sliders
  ['cmpPrice', 'cmpRent', 'cmpDown', 'cmpRate', 'cmpSave', 'cmpYears', 'cmpGrowth'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateCompare);
  });

