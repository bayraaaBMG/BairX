  // ===== CALCULATOR =====
  // Суурь хүү (currentRate, доор) Монголбанкны нийтэлсэн шинээр олгосон орон сууцны
  // ипотекийн зээлийн системийн дундаж хүүнд (17.5%, 2026 оны 4-р сарын байдлаар) үндэслэсэн.
  // Эх сурвалж: mongolbank.mn статистик. Банк тус бүрийн rateAdj нь ХАРЬЦАНГУЙ, ойролцоо
  // байршил үзүүлэх зорилготой — яг одоогийн бодит хүүг тухайн банкны сайтаас (url) шалгана уу.
  const banks = [
    { name: 'Хаан Банк', short: 'ХБ', color: '#0066B3', rateAdj: 0, note: 'Стандарт нөхцөл', url: 'https://www.khanbank.com/personal/product/detail/personal-6-mortgage-loan/' },
    { name: 'Худалдаа Хөгжлийн', short: 'ХХБ', color: '#003F87', rateAdj: 0, note: 'Урт хугацаа дэмжсэн', url: 'https://www.tdbm.mn/en/retail/loans/oron-suutsnii-zeel' },
    { name: 'Голомт Банк', short: 'ГБ', color: '#E31E24', rateAdj: 0.1, note: 'Хурдан шийдвэр', url: 'https://www.golomtbank.com/retail/loans/786' },
    { name: 'Төрийн Банк', short: 'ТБ', color: '#FFB81C', rateAdj: 0.2, dark: true, note: 'Төрийн ажилтанд хөнгөлөлттэй', url: 'https://www.statebank.mn/product/813' },
    { name: 'Хас Банк', short: 'ХА', color: '#00A651', rateAdj: 0.5, note: 'Залуу гэр бүлд хөнгөлөлттэй', url: 'https://xacbank.mn/mortgage' },
    { name: 'Капитрон', short: 'КБ', color: '#7B2CBF', rateAdj: 0.6, note: 'Уян хатан нөхцөл', url: 'https://www.capitronbank.mn/c/%D0%BE%D1%80%D0%BE%D0%BD-%D1%81%D1%83%D1%83%D1%86%D0%BD%D1%8B-%D0%B7%D1%8D%D1%8D%D0%BB' },
    { name: 'Богд Банк', short: 'ББ', color: '#0A1628', rateAdj: 0.6, note: 'Стандарт нөхцөл', url: 'https://www.bogdbank.com/personal/product/23' },
    { name: 'Ариг Банк', short: 'АБ', color: '#FF6B35', rateAdj: 1.1, note: 'Стандарт нөхцөл', url: 'https://loan.arigbank.mn/' }
  ];

  let currentRate = 17.5;
  let currentLoanName = 'Энгийн ипотек 17.5%';
  let currentLoanCap = null; // сая ₮ — зарим зээлийн төрөл (жиш. ХАСН 8%/ШНХС) улсын хөтөлбөрийн хэмжээгээр хязгаарлагддаг
  let bestBankUrl = null;

  // Сайт даяар ганц стандарт орлогын дарамтын (DTI) аюулгүй дээд хязгаар — энэ тооцоолуур,
  // стресс тест, шаардлагатай орлогын тооцоо, "хамгийн ашигтай" зээлийн санал бүгд үүнийг
  // л ашиглана. Өмнө нь 40%/45%/47.7%/50% гэсэн 4 өөр тоо газар бүрт зөрүүтэй байсан.
  const SAFE_DTI = 40;

  function applyToBestBank() {
    if (bestBankUrl) window.open(bestBankUrl, '_blank', 'noopener');
    else showToast('Зарын эзэнтэй холбогдоно уу');
  }

  function calculate() {
    const price = parseInt(document.getElementById('priceSlider').value);
    const downPct = parseInt(document.getElementById('downSlider').value);
    const income = parseInt(document.getElementById('incomeSlider').value);
    const term = parseInt(document.getElementById('termSlider').value);

    const downAmt = Math.round(price * downPct / 100);
    const neededLoan = price - downAmt;
    // Some loan products (e.g. ХАСН 8% / ШНХС) are capped by the government program's own
    // limit, not by what the buyer needs — if the needed amount exceeds that cap, only the
    // capped amount is actually financed; the rest is a real gap the buyer must cover from
    // savings or a second loan, so it's surfaced explicitly rather than silently shown as
    // if the whole purchase were financed at that rate.
    const capShortfall = (currentLoanCap && neededLoan > currentLoanCap) ? neededLoan - currentLoanCap : 0;
    const loanAmt = capShortfall > 0 ? currentLoanCap : neededLoan;

    const capNotice = document.getElementById('loanCapNotice');
    if (capNotice) {
      if (capShortfall > 0) {
        document.getElementById('loanCapNoticeText').textContent =
          `Танд ${fmt(neededLoan)} сая ₮ санхүүжилт хэрэгтэй, гэвч "${currentLoanName}" дээд тал нь ${fmt(currentLoanCap)} сая ₮ хүртэл олгодог тул үлдэгдэл ~${fmt(capShortfall)} сая ₮-ийг өөр эх үүсвэрээс (бэлэн мөнгө/нэмэлт зээл) бүрдүүлэх шаардлагатай.`;
        capNotice.style.display = 'flex';
      } else {
        capNotice.style.display = 'none';
      }
    }

    // Update slider value displays
    document.getElementById('priceVal').textContent = price >= 1000 ? (price/1000).toFixed(2) + ' тэрбум ₮' : price + ' сая ₮';
    document.getElementById('downVal').textContent = downAmt + ' сая ₮ (' + downPct + '%)';
    document.getElementById('incomeVal').textContent = fmt(income * 1000) + ' ₮';
    document.getElementById('termVal').textContent = term + ' жил';

    // ===== AUTO: Required income calculation =====
    // Calculate required income for THIS price at the site-wide safe DTI threshold
    if (currentRate > 0) {
      const r = currentRate / 100 / 12;
      const n = term * 12;
      const reqMonthly = (loanAmt * 1000000 * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const reqIncome = reqMonthly / (SAFE_DTI / 100);

      const reqIncomeEl = document.getElementById('requiredIncome');
      const incomeHintEl = document.getElementById('incomeHint');
      const autoCard = document.querySelector('.auto-card');

      reqIncomeEl.textContent = '~ ' + fmt(reqIncome) + ' ₮';

      // Compare with user's actual income
      const userIncome = income * 1000;
      const incomeRatio = userIncome / reqIncome;

      if (incomeRatio >= 1.2) {
        autoCard.classList.remove('warn');
        incomeHintEl.innerHTML = `Таны орлого <strong>${(incomeRatio * 100).toFixed(0)}%</strong> хангалттай. Эрсдэлгүй сонголт.`;
      } else if (incomeRatio >= 1) {
        autoCard.classList.remove('warn');
        incomeHintEl.innerHTML = `Таны орлого <strong>яг таарч</strong> байна. Орлогын ${((reqMonthly / userIncome) * 100).toFixed(0)}% нь зээлийн төлбөрт зарцуулагдана.`;
      } else if (incomeRatio >= 0.8) {
        autoCard.classList.add('warn');
        incomeHintEl.innerHTML = `Таны орлого <strong>${((1 - incomeRatio) * 100).toFixed(0)}%-р дутаж</strong> байна. Урьдчилгаа нэмэх эсвэл хямд байр сонгох нь зүйтэй.`;
      } else {
        autoCard.classList.add('warn');
        incomeHintEl.innerHTML = `Орлого <strong>хангалтгүй</strong>. Энэ үнэтэй байр авахад сард <strong>${fmt(reqIncome)} ₮</strong> орлого хэрэгтэй.`;
      }
    } else {
      // Cash purchase
      document.getElementById('requiredIncome').textContent = price + ' сая ₮ бэлэн мөнгө';
      document.getElementById('incomeHint').textContent = 'Бэлэн мөнгөөр худалдан авахад зээл шаардлагагүй';
      document.querySelector('.auto-card').classList.remove('warn');
    }

    if (currentRate === 0) {
      // Cash purchase
      document.getElementById('monthlyAmt').textContent = '0';
      document.getElementById('totalPay').textContent = price + ' сая ₮';
      document.getElementById('totalInterest').textContent = '0 ₮';
      document.getElementById('dti').textContent = '0%';
      document.getElementById('loanAmt').textContent = '0 ₮';
      document.getElementById('bestBankTitle').textContent = 'Бэлэн мөнгөөр';
      document.getElementById('applyBtnText').textContent = 'Зарын эзэнтэй холбогдох';
      bestBankUrl = null;
      document.getElementById('bankList').innerHTML = '<div style="text-align:center; color:rgba(255,255,255,0.5); padding:20px; font-size:13px;">Бэлэн мөнгөөр худалдан авахад зээл шаардахгүй</div>';
      // Hide early payoff for cash
      document.querySelector('.early-payoff').style.opacity = '0.4';
      document.querySelector('.early-payoff').style.pointerEvents = 'none';
      return;
    } else {
      document.querySelector('.early-payoff').style.opacity = '1';
      document.querySelector('.early-payoff').style.pointerEvents = 'auto';
    }

    const monthlyRate = currentRate / 100 / 12;
    const months = term * 12;
    const monthly = (loanAmt * 1000000 * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPay = monthly * months;
    const totalInterest = totalPay - loanAmt * 1000000;
    const dti = (monthly / (income * 1000)) * 100;

    document.getElementById('monthlyAmt').textContent = fmt(monthly);
    document.getElementById('totalPay').textContent = (totalPay / 1000000).toFixed(1) + ' сая ₮';
    document.getElementById('totalInterest').textContent = (totalInterest / 1000000).toFixed(1) + ' сая ₮';
    const dtiEl = document.getElementById('dti');
    dtiEl.textContent = dti.toFixed(1) + '%';
    dtiEl.className = 'small-result-amount ' + (dti < SAFE_DTI ? 'green' : dti < 50 ? 'warn' : 'danger');
    document.getElementById('loanAmt').textContent = loanAmt + ' сая ₮';

    // Bank list with adjusted rates
    const bankResults = banks.map(b => {
      const r = (currentRate + b.rateAdj) / 100 / 12;
      const m = (loanAmt * 1000000 * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
      return { ...b, rate: currentRate + b.rateAdj, monthly: m };
    }).sort((a, b) => a.monthly - b.monthly);

    // The cheapest monthly payment isn't automatically "the best deal" if it still eats
    // more than the site-wide safe DTI threshold — flag that instead of calling it
    // "хамгийн ашигтай" so the label never contradicts the DTI shown right above it.
    const bestDti = (bankResults[0].monthly / (income * 1000)) * 100;
    const bestIsRisky = bestDti > SAFE_DTI;
    if (bestIsRisky) {
      document.getElementById('bestBankTitle').innerHTML = `${esc(bankResults[0].name)} — <span style="color:var(--warning);">⚠ орлогын дарамт өндөр (${bestDti.toFixed(0)}%)</span>`;
    } else {
      document.getElementById('bestBankTitle').textContent = `${bankResults[0].name} — хамгийн ашигтай`;
    }
    document.getElementById('applyBtnText').textContent = `${bankResults[0].name}-ны зээлд хүсэлт гаргах`;
    bestBankUrl = bankResults[0].url;

    document.getElementById('bankList').innerHTML = bankResults.map((b, i) => `
      <div class="bank-row${i === 0 ? ' best' : ''}" onclick="window.open('${b.url}', '_blank', 'noopener')" style="cursor:pointer;" title="${esc(b.name)} — банкны хуудас руу очих">
        <div class="bank-name">
          <div class="bank-logo" style="background:${b.color};${b.dark ? 'color:#0A1628;' : ''}">${b.short}</div>
          ${b.name}
        </div>
        <div class="bank-rate">~${b.rate.toFixed(1)}%</div>
        <div class="bank-monthly">${fmt(b.monthly)} ₮</div>
        <div>${i === 0 ? (bestIsRisky ? '<span class="best-tag" style="background:var(--warning);">⚠ Дарамт өндөр</span>' : '<span class="best-tag">★ Хамгийн сайн</span>') : ''}</div>
      </div>
    `).join('') + '<div style="text-align:center;font-size:11px;color:rgba(255,255,255,0.45);margin-top:12px;">Ойролцоо тооцоолол — яг одоогийн хүүг тухайн банкны хуудаснаас (дарж орох) шалгана уу</div>';

    // Update early payoff calculation
    calculateEarlyPayoff(loanAmt * 1000000, monthlyRate, monthly, months);
  }

  // ===== EARLY PAYOFF SIMULATOR =====
  function calculateEarlyPayoff(principal, monthlyRate, baseMonthly, baseMonths) {
    const extraK = parseInt(document.getElementById('extraSlider').value); // in thousands
    const extra = extraK * 1000;

    document.getElementById('extraVal').textContent = extra === 0 ? '0 ₮' : '+ ' + fmt(extra) + ' ₮';

    if (extra === 0) {
      document.getElementById('savedInterest').textContent = '0 ₮';
      document.getElementById('savedTime').textContent = '0 сар';
      document.getElementById('earlySummary').innerHTML = 'Сар бүр илүү дүн төлвөл хэдий хэмжээний хүү хэмнэх, хэдэн жилээр зээлийн хугацаа богиносохыг харуулна. <strong>Slider-ийг хөдөлгөж туршаарай!</strong>';
      return;
    }

    // Simulate amortization with extra payments
    const newMonthly = baseMonthly + extra;
    let balance = principal;
    let months = 0;
    let totalInterestPaid = 0;
    const maxMonths = baseMonths * 2; // safety limit

    while (balance > 0 && months < maxMonths) {
      const interestThisMonth = balance * monthlyRate;
      const principalThisMonth = newMonthly - interestThisMonth;

      if (principalThisMonth <= 0) break; // safety

      totalInterestPaid += interestThisMonth;

      if (balance <= principalThisMonth) {
        // Last payment
        totalInterestPaid -= interestThisMonth;
        const finalInterest = balance * monthlyRate;
        totalInterestPaid += finalInterest;
        months += 1;
        balance = 0;
      } else {
        balance -= principalThisMonth;
        months += 1;
      }
    }

    const baseTotalInterest = (baseMonthly * baseMonths) - principal;
    const savedInterest = baseTotalInterest - totalInterestPaid;
    const savedMonths = baseMonths - months;

    const savedYears = Math.floor(savedMonths / 12);
    const savedMonthsRemainder = savedMonths % 12;
    const newYears = Math.floor(months / 12);
    const newMonthsRemainder = months % 12;

    const formatTime = (y, m) => {
      if (y === 0 && m === 0) return '0 сар';
      if (y === 0) return m + ' сар';
      if (m === 0) return y + ' жил';
      return y + ' жил ' + m + ' сар';
    };

    document.getElementById('savedInterest').textContent = (savedInterest / 1000000).toFixed(1) + ' сая ₮';
    document.getElementById('savedTime').textContent = formatTime(savedYears, savedMonthsRemainder);

    document.getElementById('earlySummary').innerHTML = `
      Сар бүр <strong>${fmt(extra)} ₮</strong> илүү төлвөл, та зээлээсээ
      <strong style="color:var(--accent);">${formatTime(newYears, newMonthsRemainder)}-нд</strong> бүрэн салах ба нийт
      <strong style="color:var(--accent);">${(savedInterest / 1000000).toFixed(1)} сая ₮</strong> хүү хэмнэнэ.
      <br><span style="font-size:12px; color:rgba(255,255,255,0.6); display:inline-block; margin-top:6px;">
      ${baseMonths} сар → ${months} сар (${formatTime(savedYears, savedMonthsRemainder)} богиносно)
      </span>
    `;
  }

  // ===== AFFORDABILITY =====
  function calculateAfford() {
    const income = parseInt(document.getElementById('affIncome').value) || 0;
    const down = parseInt(document.getElementById('affDown').value) || 0;
    const history = document.getElementById('affHistory').value;
    const otherDebt = parseInt(document.getElementById('affOther').value) || 0;

    // Same site-wide safe DTI threshold as calculate() above, minus other debts
    const maxMonthly = (income * SAFE_DTI / 100) - otherDebt;

    // Adjust for credit history
    const historyMult = history === 'A' ? 1.0 : history === 'B' ? 0.9 : history === 'C' ? 0.75 : 0.6;
    const adjMonthly = maxMonthly * historyMult;

    // Calc max loan with 8%, 20 years
    const r = 0.08 / 12;
    const n = 240;
    const maxLoan = adjMonthly * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));

    const maxPriceLow = (maxLoan + down) / 1000000;
    const maxPriceHigh = maxPriceLow * 1.12;

    document.getElementById('affResultAmt').textContent = `${Math.round(maxPriceLow)} — ${Math.round(maxPriceHigh)} сая ₮`;
    const affDetailEl = document.getElementById('affResultDetail');
    if (affDetailEl) affDetailEl.textContent = `8% зээл, 20 жилийн хугацаатай. Орлогын ${SAFE_DTI}% хүртэл сар бүрийн төлбөр гэж тооцов.`;
    document.getElementById('affMaxLoan').textContent = `${Math.round(maxLoan / 1000000)} сая ₮`;
    document.getElementById('affMonthly').textContent = `${(adjMonthly / 1000000).toFixed(2)} сая ₮`;
    document.getElementById('affDownDisp').textContent = `${Math.round(down / 1000000)} сая ₮`;

    let risk, riskColor, advice;
    const downPct = (down / (maxPriceLow * 1000000)) * 100;
    if (downPct >= 30 && history === 'A') { risk = 'Бага'; riskColor = 'var(--accent)'; }
    else if (downPct >= 20) { risk = 'Дунд'; riskColor = 'var(--warning)'; }
    else { risk = 'Өндөр'; riskColor = 'var(--danger)'; }
    document.getElementById('affRisk').textContent = risk;
    document.getElementById('affRisk').style.color = riskColor;

    if (maxPriceLow >= 400) advice = `Таны нөхцөл хангалттай сайн! ${Math.round(maxPriceLow)}-${Math.round(maxPriceHigh)} сая ₮ үнийн хязгаарт Зайсан, Сүхбаатар дүүргийн сонголтууд тохиромжтой.`;
    else if (maxPriceLow >= 200) advice = `Сайн сонголтууд бий. Чингэлтэй, Хан-Уул дүүргүүдээс ${Math.round(maxPriceLow)} сая ₮-н орчмын байр сонгоно уу.`;
    else if (maxPriceLow >= 100) advice = `Эхэлж буй хүний хувьд сайн боломж. Шинэ барилгууд эсвэл алслагдсан дүүргээс хайхад илүү сонголт байна.`;
    else advice = `Илүү их урьдчилгаа төлбөр, эсвэл хадгаламжтай болсны дараа хайх нь зүйтэй.`;
    document.getElementById('affAdvice').textContent = advice;

    showToast('Үнэлгээ амжилттай хийгдлээ', 'success');
  }

  // ===== EVENT LISTENERS =====
  ['priceSlider', 'downSlider', 'incomeSlider', 'termSlider', 'extraSlider'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculate);
  });

  document.querySelectorAll('.loan-type').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.loan-type').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      currentRate = parseFloat(t.dataset.rate);
      currentLoanName = t.dataset.name;
      currentLoanCap = t.dataset.cap ? parseFloat(t.dataset.cap) : null;
      calculate();
    });
  });

  document.querySelectorAll('.search-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.search-tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const labels = { buy: 'Хайх', rent: 'Түрээс хайх', sell: 'Үнэлгээ авах' };
      document.getElementById('searchBtnText').textContent = labels[t.dataset.tab];
    });
  });

  document.querySelectorAll('.filter-pill[data-cat]').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill[data-cat]').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      currentCat = t.dataset.cat;
      applyListingFilter();
    });
  });

  document.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      c.classList.toggle('active');
      const filter = c.dataset.filter;
      const filterNames = {
        'loan8': '8% зээлтэй зарууд',
        'new': 'Шинэ барилгын зарууд',
        'furnished': 'Тавилгатай зарууд',
        'garage': 'Гараажтай зарууд',
        'below': 'Ашигтай үнэтэй зарууд'
      };
      // Map hero quick-filter chips onto the real filter-toggle keys used by getFilteredListings()
      const toggleMap = { loan8: 'loan', new: 'new', furnished: 'furnished', garage: 'parking', below: 'below' };
      const ftoggle = toggleMap[filter];
      const active = c.classList.contains('active');
      if (ftoggle) {
        if (active) {
          if (!activeFilterToggles.includes(ftoggle)) activeFilterToggles.push(ftoggle);
        } else {
          activeFilterToggles = activeFilterToggles.filter(x => x !== ftoggle);
        }
        document.querySelectorAll(`.filter-toggle[data-ftoggle="${ftoggle}"]`).forEach(t => t.classList.toggle('active', active));
      }
      if (active) {
        showToast('Шүүлт нэмэгдлээ: ' + filterNames[filter]);
        showPage('listings');
        applyListingFilter();
      } else {
        showToast('Шүүлт хасагдлаа: ' + filterNames[filter]);
        updateFilterCount();
      }
    });
  });

  // ESC to close modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

