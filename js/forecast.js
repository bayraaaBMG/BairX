  // ===== COMPARE =====
  let compareList = [];

  function toggleCompare(id, btn) {
    const idx = compareList.indexOf(id);
    if (idx > -1) {
      compareList.splice(idx, 1);
      btn.classList.remove('active');
    } else {
      if (compareList.length >= 3) {
        showToast('Хамгийн ихдээ 3 байр харьцуулна');
        return;
      }
      compareList.push(id);
      btn.classList.add('active');
    }
    updateCompareBar();
  }

  function updateCompareBar() {
    const bar = document.getElementById('compareBar');
    const items = document.getElementById('compareBarItems');
    const btn = document.getElementById('compareBtn');
    const hint = document.getElementById('compareHint');

    if (compareList.length === 0) {
      bar.classList.remove('show');
      return;
    }
    bar.classList.add('show');
    items.innerHTML = compareList.map(id => {
      const l = listings.find(x => x.id === id);
      return `
        <div class="compare-bar-item">
          <img src="${l.img}" alt="" />
          <div class="compare-bar-item-info">
            <div class="compare-bar-item-title">${l.title.slice(0, 20)}${l.title.length > 20 ? '...' : ''}</div>
            <div class="compare-bar-item-price">${fmtPrice(l.price)}</div>
          </div>
          <button class="compare-bar-remove" onclick="removeFromCompare(${id})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      `;
    }).join('');

    if (compareList.length >= 2) {
      btn.disabled = false;
      btn.style.opacity = '1';
      hint.textContent = `${compareList.length} байр сонгосон`;
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      hint.textContent = 'Дор хаяж 2 байр сонгоно уу';
    }
  }

  function removeFromCompare(id) {
    compareList = compareList.filter(x => x !== id);
    // Update card button state
    document.querySelectorAll('.listing-compare').forEach(b => {
      if (b.getAttribute('onclick').includes(`toggleCompare(${id},`)) b.classList.remove('active');
    });
    updateCompareBar();
  }

  function clearCompare() {
    compareList = [];
    document.querySelectorAll('.listing-compare').forEach(b => b.classList.remove('active'));
    updateCompareBar();
  }

  function openCompareModal() {
    const props = compareList.map(id => listings.find(x => x.id === id));
    // Determine best values
    const minPrice = Math.min(...props.map(p => p.price));
    const minPricePerSqm = Math.min(...props.filter(p => typeof p.pricePerSqm === 'number').map(p => p.pricePerSqm));
    const maxArea = Math.max(...props.map(p => p.area));

    const rows = [
      { label: 'Үнэ', get: p => fmtPrice(p.price), best: p => p.price === minPrice },
      { label: 'м² үнэ', get: p => typeof p.pricePerSqm === 'number' ? p.pricePerSqm + ' сая ₮' : '—', best: p => p.pricePerSqm === minPricePerSqm },
      { label: 'Талбай', get: p => p.area + ' м²', best: p => p.area === maxArea },
      { label: 'Өрөө', get: p => p.rooms, best: () => false },
      { label: 'Давхар', get: p => p.floor, best: () => false },
      { label: 'Он', get: p => p.year, best: () => false },
      { label: 'Зээл', get: p => p.loanType, best: () => false },
      { label: 'Сар бүр', get: p => typeof p.monthly === 'number' ? p.monthly.toFixed(2) + ' сая ₮' : p.monthly, best: () => false },
      { label: 'Барьцаа', get: p => p.collateral || '—', best: p => p.collateral && p.collateral.includes('Барьцаагүй') },
      { label: 'Засвар', get: p => p.condition || '—', best: () => false },
      { label: 'Дулаалга', get: p => p.insulation || '—', best: () => false },
      { label: 'Үнэлгээ', get: p => p.tag.text, best: p => p.tag.type === 'below' }
    ];

    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div style="padding:32px 24px;">
        <span class="al-eyebrow">Харьцуулалт</span>
        <div class="al-title" style="margin-bottom:20px;">${props.length} байрны харьцуулалт</div>
        <div style="overflow-x:auto;">
          <table class="compare-table-modal">
            <thead>
              <tr>
                <th class="row-label"></th>
                ${props.map(p => `
                  <th class="compare-prop-head">
                    <img class="compare-prop-img" src="${p.img}" alt="" />
                    <div class="compare-prop-title">${p.title}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `
                <tr>
                  <td class="row-label">${row.label}</td>
                  ${props.map(p => `<td class="${row.best(p) ? 'compare-cell-best' : ''}">${row.get(p)}</td>`).join('')}
                </tr>
              `).join('')}
              <tr>
                <td class="row-label"></td>
                ${props.map(p => `<td><button class="btn btn-blue" style="width:100%; justify-content:center; font-size:12px; padding:8px;" onclick="closeModal(); setTimeout(() => openListing(${p.id}), 300)">Үзэх</button></td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:16px; font-size:12px; color:var(--ink-3); line-height:1.5;">✓ тэмдэг нь тухайн үзүүлэлтээр хамгийн сайн сонголтыг харуулна (хямд үнэ, том талбай, барьцаагүй гэх мэт).</div>
      </div>
    `;
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

