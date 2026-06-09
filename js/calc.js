  // ===== CALCULATOR =====
  // Бодит зах зээлийн хүү: ХАСН-ы 8% хязгаарлагдмал тул бараг ижил, бусад зээлд бага зэрэг хэлбэлзэлтэй
  const banks = [
    { name: 'Хаан Банк', short: 'ХБ', color: '#0066B3', rateAdj: 0, note: 'Стандарт нөхцөл' },
    { name: 'Худалдаа Хөгжлийн', short: 'ХХБ', color: '#003F87', rateAdj: 0, note: 'Урт хугацаа дэмжсэн' },
    { name: 'Голомт Банк', short: 'ГБ', color: '#E31E24', rateAdj: 0.1, note: 'Хурдан шийдвэр' },
    { name: 'Төрийн Банк', short: 'ТБ', color: '#FFB81C', rateAdj: 0.2, dark: true, note: 'Төрийн ажилтанд хөнгөлөлттэй' },
    { name: 'Хас Банк', short: 'ХА', color: '#00A651', rateAdj: 0.5, note: 'Залуу гэр бүлд хөнгөлөлттэй' }
  ];

  let currentRate = 14.4;
  let currentLoanName = 'Энгийн ипотек 14.4%';

  function calculate() {
    const price = parseInt(document.getElementById('priceSlider').value);
    const downPct = parseInt(document.getElementById('downSlider').value);
    const income = parseInt(document.getElementById('incomeSlider').value);
    const term = parseInt(document.getElementById('termSlider').value);

    const downAmt = Math.round(price * downPct / 100);
    const loanAmt = price - downAmt;

    // Update slider value displays
    document.getElementById('priceVal').textContent = price >= 1000 ? (price/1000).toFixed(2) + ' тэрбум ₮' : price + ' сая ₮';
    document.getElementById('downVal').textContent = downAmt + ' сая ₮ (' + downPct + '%)';
    document.getElementById('incomeVal').textContent = fmt(income * 1000) + ' ₮';
    document.getElementById('termVal').textContent = term + ' жил';

    // ===== AUTO: Required income calculation =====
    // Calculate required income for THIS price (assuming 50% DTI ratio)
    if (currentRate > 0) {
      const r = currentRate / 100 / 12;
      const n = term * 12;
      const reqMonthly = (loanAmt * 1000000 * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const reqIncome = reqMonthly / 0.5; // 50% DTI

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
    dtiEl.className = 'small-result-amount ' + (dti < 35 ? 'green' : dti < 50 ? 'warn' : '');
    document.getElementById('loanAmt').textContent = loanAmt + ' сая ₮';

    // Bank list with adjusted rates
    const bankResults = banks.map(b => {
      const r = (currentRate + b.rateAdj) / 100 / 12;
      const m = (loanAmt * 1000000 * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
      return { ...b, rate: currentRate + b.rateAdj, monthly: m };
    }).sort((a, b) => a.monthly - b.monthly);

    document.getElementById('bestBankTitle').textContent = `${bankResults[0].name} — хамгийн ашигтай`;
    document.getElementById('applyBtnText').textContent = `${bankResults[0].name}-ны зээлд хүсэлт гаргах`;

    document.getElementById('bankList').innerHTML = bankResults.map((b, i) => `
      <div class="bank-row${i === 0 ? ' best' : ''}">
        <div class="bank-name">
          <div class="bank-logo" style="background:${b.color};${b.dark ? 'color:#0A1628;' : ''}">${b.short}</div>
          ${b.name}
        </div>
        <div class="bank-rate">${b.rate.toFixed(1)}%</div>
        <div class="bank-monthly">${fmt(b.monthly)} ₮</div>
        <div>${i === 0 ? '<span class="best-tag">★ Хамгийн сайн</span>' : ''}</div>
      </div>
    `).join('');

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

    // Max 50% of income for loan, minus other debts
    const maxMonthly = (income * 0.5) - otherDebt;

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
      if (c.classList.contains('active')) {
        showToast('Шүүлт нэмэгдлээ: ' + filterNames[filter]);
      }
    });
  });

  // ESC to close modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

