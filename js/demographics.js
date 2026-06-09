  // ===== DEMOGRAPHICS =====
  function renderDemographics() {
    // Single person distribution by district
    const singleDist = [
      { name: 'Сүхбаатар', value: 38.5 },
      { name: 'Хан-Уул', value: 35.2 },
      { name: 'Чингэлтэй', value: 32.1 },
      { name: 'Баянзүрх', value: 28.7 },
      { name: 'Баянгол', value: 26.4 },
      { name: 'СХД', value: 22.8 }
    ];
    const maxVal = Math.max(...singleDist.map(d => d.value));
    document.getElementById('singleDistList').innerHTML = singleDist.map(d => `
      <div class="district-row">
        <div class="district-name">${d.name}</div>
        <div class="district-bar-wrap">
          <div class="district-bar" style="width:${(d.value / maxVal) * 100}%;"></div>
        </div>
        <div class="district-value">${d.value}%</div>
      </div>
    `).join('');

    // Age distribution of buyers
    const ages = [
      { range: '20-24', pct: 4.2 },
      { range: '25-29', pct: 21.3 },
      { range: '30-34', pct: 28.7 },
      { range: '35-39', pct: 17.4 },
      { range: '40-49', pct: 15.8 },
      { range: '50+', pct: 12.6 }
    ];
    const maxPct = Math.max(...ages.map(a => a.pct));
    document.getElementById('ageDistList').innerHTML = ages.map(a => `
      <div class="age-row">
        <div class="age-label">${a.range}</div>
        <div class="age-bar-wrap">
          <div class="age-bar" style="width:${(a.pct / maxPct) * 100}%;">${a.pct >= 10 ? a.pct + '%' : ''}</div>
        </div>
        <div class="age-pct">${a.pct}%</div>
      </div>
    `).join('');
  }

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

