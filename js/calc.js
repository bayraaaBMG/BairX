  // ===== CALCULATOR =====
  // Суурь хүү (currentRate, доор) Монголбанкны нийтлэдэг арилжааны банкуудын орон сууцны
  // ипотекийн зээлийн жигнэсэн дундаж хүүний тайланд (stat.mongolbank.mn/finance, 2026 оны
  // 4-р сарын мэдээллээр) үндэслэсэн ойролцоо тоо. Энэ статистикийн хуудас JavaScript-аар
  // рендерлэгддэг тул script-ээр шинэчилж чадаагүй — 2026-08-13-нд дахин шалгахыг оролдоход
  // ч шинэ мэдээлэл олдоогүй тул огноог UI дээр тодорхой харуулж байна (доорх сануулга).
  //
  // ЭХ СУРВАЛЖ: банкны жагсаалт кодод hardcode хийгдэхгүй — /data/banks.json-оос ачаална.
  // Банк бүрийн хүү/нөхцөл ЗӨВХӨН тухайн банкны албан ёсны вэбсайтаас шалгасан утга
  // (verified: true) эсвэл "Тодорхойгүй" (verified: false); checkedAt нь сүүлд шалгасан огноо.
  // Банк нэмэх/хасах, хүү шинэчлэхдээ зөвхөн тэр JSON файлыг засна — нүүрний банкны мөр,
  // тооцоолуурын таб, "N банк" гэсэн тоо бүгд тэндээс автоматаар үүснэ.
  let banks = [];
  let banksMeta = { updatedAt: null };
  let _banksLoaded = false;

  async function loadBanks() {
    try {
      const res = await fetch("/data/banks.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      banks = Array.isArray(json.banks) ? json.banks : [];
      banksMeta = { updatedAt: json.updatedAt || null };
    } catch (e) {
      console.error("loadBanks failed:", e.message);
      banks = [];
    }
    _banksLoaded = true;
    renderBankTabs();
    if (banks.length) selectBank(currentBankIdx >= banks.length ? 0 : currentBankIdx);
    else selectBank(-1);
    renderBanksStrip();
    document.querySelectorAll("[data-bank-count]").forEach(el => { el.textContent = banks.length; });
  }

  function bankCheckedText(b) {
    return b && b.checkedAt ? "Шалгасан: " + b.checkedAt : "Шалгаагүй";
  }

  // Нүүр хуудасны "Банк" мөр — banks.json-оос үүснэ (өмнө нь index.html-д гараар 8 ширхэг бичигдсэн байсан).
  function renderBanksStrip() {
    const row = document.getElementById("banksRow");
    if (!row) return;
    if (!banks.length) { row.innerHTML = "<div class=\"banks-empty\">Банкны мэдээлэл ачаалж чадсангүй.</div>"; return; }
    row.innerHTML = banks.map(b => {
      const rate = b.verified && b.annualRateText ? b.annualRateText.split("(")[0].trim() : "Хүү тодорхойгүй";
      return `<a class="bank-pill" href="${esc(b.sourceUrl)}" target="_blank" rel="noopener noreferrer" title="${esc(b.name + " — " + b.productName)}">
        <div class="bp-logo" style="background:${b.color};${b.dark ? "color:#0A1628;" : ""}">${esc(b.short)}</div>
        <div class="bp-text"><div class="bp-name">${esc(b.name)}</div>
        <div class="bp-rate">${esc(rate)}</div>
        <div class="bp-checked">${esc(bankCheckedText(b))}</div></div>
      </a>`;
    }).join("");
  }

  // Derived purely from the verified text fields above at render/select time — never a
  // second, separately-maintained copy of a number that could drift out of sync with the
  // audited source string. Returns null whenever the underlying field is itself
  // "Тодорхойгүй" (or the bank overall unverified), so callers can tell "known" from
  // "unknown" instead of silently defaulting to something invented.
  function parseBankRateRange(bank) {
    if (!bank.verified) return null;
    const text = bank.annualRateText.split('(')[0]; // drop a "(бодит өртөг ...)" parenthetical
    const nums = text.match(/\d+(\.\d+)?/g);
    if (!nums || !nums.length) return null;
    const vals = nums.map(Number);
    return { min: Math.min.apply(null, vals), max: Math.max.apply(null, vals) };
  }
  function parseBankDownMinPct(bank) {
    if (!bank.verified) return null;
    const m = bank.downPaymentText.match(/(\d+)\s*%/);
    return m ? parseInt(m[1], 10) : null;
  }
  function parseBankMaxTermMonths(bank) {
    if (!bank.verified) return null;
    const m = bank.loanTermText.match(/(\d+)\s*сар/);
    return m ? parseInt(m[1], 10) : null;
  }

  let currentRate = null;       // null = selected bank's rate is unverified — never fabricated
  let currentLoanName = '';     // used in the loan-cap notice sentence + Afford section's detail text
  let currentLoanCap = null;    // сая ₮ — some 6% programs are capped by the program's own limit
  let currentBankIdx = 0;       // index into `banks`, or -1 for the synthetic "Бэлэн мөнгө" tab
  let currentBankDisplayName = '';

  // Сайт даяар ганц стандарт орлогын дарамтын (DTI) аюулгүй дээд хязгаар — Afford (Чадварын
  // үнэлгээ, #afford) хэсэг үүнийг ашигладаг. Энэ тооцоолуур өөрөө DTI-г харуулахгүй болсон
  // ч (Zary.mn-ийн жишээ шиг Үнэ→Банк→Төлбөр урсгалыг холихгүйн тулд) SAFE_DTI тогтмол хэвээр
  // — өөр газар зөрчилдсөн 4 тоо байсныг нэгтгэсэн шийдвэр хэвээр хадгалагдана.
  const SAFE_DTI = 40;

  // ===== BANK TABS =====
  function renderBankTabs() {
    const el = document.getElementById('bankTabs');
    if (!el) return;
    el.innerHTML = banks.map((b, i) => `
      <button type="button" class="bank-tab${i === currentBankIdx ? ' active' : ''}" data-idx="${i}" onclick="selectBank(${i})">
        <div class="bank-logo" style="width:24px;height:24px;font-size:10px;background:${b.color};${b.dark ? 'color:#0A1628;' : ''}">${esc(b.short)}</div>
        <span class="bank-tab-text"><span class="bank-tab-name">${esc(b.name)}</span>
        <span class="bank-tab-rate">${b.verified && b.annualRateText ? esc(b.annualRateText.split("(")[0].trim()) : "Хүү тодорхойгүй"} · ${esc(bankCheckedText(b))}</span></span>
      </button>
    `).join('') + `
      <button type="button" class="bank-tab${currentBankIdx === -1 ? ' active' : ''}" data-idx="-1" onclick="selectBank(-1)">
        <div class="bank-logo" style="width:24px;height:24px;font-size:10px;background:#5B6B85;">БМ</div>
        <span class="bank-tab-name">Бэлэн мөнгө</span>
      </button>
    `;
  }

  function renderBankInfoCard(bank) {
    const el = document.getElementById('bankInfoCard');
    if (!el) return;
    if (!bank) {
      el.innerHTML = `
        <div class="bank-info-head">
          <div class="bank-logo" style="background:#5B6B85;">БМ</div>
          <div style="flex:1;min-width:0;"><div class="bank-info-name">Бэлэн мөнгөөр</div><div class="bank-info-product">Зээлгүй шууд худалдан авалт</div></div>
        </div>
      `;
      return;
    }
    const verifiedBadge = bank.verified
      ? `<span class="bank-info-verified">✓ Шалгасан: ${esc(bank.checkedAt || "—")}</span>`
      : `<span class="bank-info-unverified">Шалгаагүй</span>`;
    el.innerHTML = `
      <div class="bank-info-head">
        <div class="bank-logo" style="background:${bank.color};${bank.dark ? 'color:#0A1628;' : ''}">${esc(bank.short)}</div>
        <div style="flex:1;min-width:0;"><div class="bank-info-name">${esc(bank.name)}</div><div class="bank-info-product">${esc(bank.productName)}</div></div>
        ${verifiedBadge}
      </div>
      <div class="bank-info-grid">
        <div><div class="bank-info-item-label">Жилийн хүү</div><div class="bank-info-item-value">${bank.verified ? esc(bank.annualRateText) : 'Тодорхойгүй'}</div></div>
        <div><div class="bank-info-item-label">Урьдчилгаа</div><div class="bank-info-item-value">${esc(bank.downPaymentText)}</div></div>
        <div><div class="bank-info-item-label">Хугацаа</div><div class="bank-info-item-value">${esc(bank.loanTermText)}</div></div>
        <div><div class="bank-info-item-label">Нэмэлт нөхцөл</div><div class="bank-info-item-value" style="font-size:11.5px;font-weight:500;">${esc(bank.feeText)}</div></div>
        <div style="grid-column:1/-1;"><div class="bank-info-item-label">Холбоо барих утас</div><div class="bank-info-item-value">${bank.phone ? esc(bank.phone) : 'Тодорхойгүй'}</div></div>
      </div>
      <a class="bank-info-source" href="${esc(bank.sourceUrl)}" target="_blank" rel="noopener">Банкны албан ёсны хуудас →</a>
    `;
  }

  function selectBank(idx) {
    currentBankIdx = idx;
    document.querySelectorAll('.bank-tab').forEach(t => t.classList.toggle('active', parseInt(t.dataset.idx, 10) === idx));

    const rateRow = document.getElementById('rateRow');
    const rateSlider = document.getElementById('rateSlider');
    const rateUnverifiedNotice = document.getElementById('rateUnverifiedNotice');
    const downSlider = document.getElementById('downSlider');
    const termSlider = document.getElementById('termSlider');

    if (idx === -1) {
      currentRate = 0;
      currentLoanName = 'Бэлэн мөнгөөр';
      currentLoanCap = null;
      currentBankDisplayName = 'Бэлэн мөнгө';
      rateRow.style.display = 'none';
      rateUnverifiedNotice.style.display = 'none';
      downSlider.min = 10;
      termSlider.max = 30;
      document.getElementById('downMinMark').textContent = '10%';
      document.getElementById('termMaxMark').textContent = '30 жил';
      renderBankInfoCard(null);
      calculate();
      return;
    }

    const bank = banks[idx];
    const rateRange = parseBankRateRange(bank);
    const downMin = parseBankDownMinPct(bank);
    const maxTermMo = parseBankMaxTermMonths(bank);
    currentBankDisplayName = bank.name;
    currentLoanName = bank.name + ' — ' + bank.productName;

    if (rateRange) {
      currentRate = rateRange.min;
      currentLoanCap = bank.cap || null;
      rateRow.style.display = '';
      rateUnverifiedNotice.style.display = 'none';
      rateSlider.min = rateRange.min;
      rateSlider.max = rateRange.max;
      rateSlider.value = rateRange.min;
      rateSlider.disabled = rateRange.min === rateRange.max;
      document.getElementById('rateMinMark').textContent = rateRange.min + '%';
      document.getElementById('rateMaxMark').textContent = rateRange.max + '%';
    } else {
      currentRate = null;
      currentLoanCap = null;
      rateRow.style.display = 'none';
      rateUnverifiedNotice.style.display = 'block';
      rateUnverifiedNotice.innerHTML = `${esc(bank.name)}-ны хүүг банкны албан ёсны эх сурвалжаас тодорхойгүй байгаа тул тооцоолол хийгдэхгүй байна. <a href="${esc(bank.sourceUrl)}" target="_blank" rel="noopener" style="color:var(--primary);">Банкны хуудас руу очих →</a>`;
    }

    downSlider.min = downMin || 10;
    if (parseInt(downSlider.value, 10) < downSlider.min) downSlider.value = downSlider.min;
    document.getElementById('downMinMark').textContent = downSlider.min + '%';

    const maxTermYears = maxTermMo ? Math.round(maxTermMo / 12) : 30;
    termSlider.max = maxTermYears;
    if (parseInt(termSlider.value, 10) > maxTermYears) termSlider.value = maxTermYears;
    document.getElementById('termMaxMark').textContent = maxTermYears + ' жил';

    renderBankInfoCard(bank);
    calculate();
  }

  // ===== PROPERTY PRICE — ₮-denominated input kept in sync with the сая-₮ range slider.
  // The slider (#priceSlider) stays the single source of truth so Listing Detail's
  // ldOpenFullCalc(price) keeps working unmodified — it only ever sets the slider's value
  // and calls calculate(). =====
  function syncPriceInputFromSlider(priceM) {
    const input = document.getElementById('priceInput');
    if (input && document.activeElement !== input) input.value = fmt(priceM * 1000000);
  }
  function handlePriceInputChange() {
    const input = document.getElementById('priceInput');
    const raw = parseInt(String(input.value).replace(/[^\d]/g, ''), 10) || 0;
    const priceM = Math.max(80, Math.min(2000, Math.round(raw / 1000000)));
    document.getElementById('priceSlider').value = priceM;
    calculate();
  }

  function calculate() {
    const price = parseInt(document.getElementById('priceSlider').value); // сая ₮
    syncPriceInputFromSlider(price);

    const downPct = parseInt(document.getElementById('downSlider').value);
    const term = parseInt(document.getElementById('termSlider').value);

    const downAmt = Math.round(price * downPct / 100);
    const neededLoan = price - downAmt;
    // Some loan products (e.g. the 6% government-backed program) are capped by the program's own
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

    document.getElementById('downVal').textContent = downPct + '% · ' + fmt(downAmt * 1000000) + '₮';
    document.getElementById('termVal').textContent = (term * 12) + ' сар (' + term + ' жил)';
    document.getElementById('monthlyBankName').textContent = currentBankDisplayName;

    const breakdownWrap = document.getElementById('breakdownWrap');
    const summaryRows = document.getElementById('summaryRows');
    const explainEl = document.getElementById('calcExplain');

    if (currentRate === null) {
      // Selected bank's rate is unverified — never fabricate a monthly payment for it.
      document.getElementById('monthlyAmt').textContent = 'Тодорхойгүй';
      breakdownWrap.style.display = 'none';
      summaryRows.style.display = 'none';
      explainEl.innerHTML = `<div class="calc-explain-step"><span>Сонгосон банкны хүү одоогоор баталгаажаагүй тул тооцоолол хийгдэхгүй байна. Банкны албан ёсны эх сурвалжаас лавлана уу.</span></div>`;
      return;
    }
    breakdownWrap.style.display = '';
    summaryRows.style.display = '';

    const rateText = (Math.round(currentRate * 10) / 10).toString().replace(/\.0$/, '') + '%';
    document.getElementById('rateVal').textContent = rateText;

    if (currentRate === 0) {
      document.getElementById('monthlyAmt').textContent = '0 ₮';
      document.getElementById('loanAmt').textContent = '0₮';
      document.getElementById('totalInterest').textContent = '0₮';
      document.getElementById('totalPay').textContent = fmt(price * 1000000) + '₮';
      document.getElementById('breakdownPrincipal').style.width = '100%';
      document.getElementById('breakdownInterest').style.width = '0%';
      explainEl.innerHTML = `<div class="calc-explain-step"><span class="calc-explain-num">1</span><span><strong>${fmt(price * 1000000)}₮</strong> үнэтэй байрыг бэлэн мөнгөөр, зээлгүйгээр худалдан авна.</span></div>`;
      const earlyEl = document.querySelector('.early-payoff');
      if (earlyEl) { earlyEl.style.opacity = '0.4'; earlyEl.style.pointerEvents = 'none'; }
      return;
    } else {
      const earlyEl = document.querySelector('.early-payoff');
      if (earlyEl) { earlyEl.style.opacity = '1'; earlyEl.style.pointerEvents = 'auto'; }
    }

    const monthlyRate = currentRate / 100 / 12;
    const months = term * 12;
    const monthly = (loanAmt * 1000000 * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPay = monthly * months;
    const totalInterest = totalPay - loanAmt * 1000000;

    document.getElementById('monthlyAmt').textContent = fmt(monthly) + ' ₮';
    document.getElementById('loanAmt').textContent = fmt(loanAmt * 1000000) + '₮';
    document.getElementById('totalInterest').textContent = fmt(totalInterest) + '₮';
    document.getElementById('totalPay').textContent = fmt(totalPay) + '₮';

    const principalPct = (loanAmt * 1000000 / totalPay) * 100;
    document.getElementById('breakdownPrincipal').style.width = principalPct + '%';
    document.getElementById('breakdownInterest').style.width = (100 - principalPct) + '%';

    // Auto-generated from the same values just computed above — never a second, separately
    // hand-written copy of the numbers that could drift out of sync with them.
    explainEl.innerHTML = `
      <div class="calc-explain-step"><span class="calc-explain-num">1</span><span><strong>${fmt(price * 1000000)}₮</strong>-ийн <strong>${downPct}%</strong> буюу <strong>${fmt(downAmt * 1000000)}₮</strong> урьдчилгаа төлж, үлдсэн <strong>${fmt(loanAmt * 1000000)}₮</strong>-г <strong>${rateText}</strong> хүүтэй зээлнэ.</span></div>
      <div class="calc-explain-step"><span class="calc-explain-num">2</span><span>Сар бүр <strong>${fmt(monthly)} ₮</strong> төлж, <strong>${term} жил</strong> үргэлжилнэ. Нийт <strong>${fmt(totalPay)}₮</strong> төлөхөөс <strong>${fmt(totalInterest)}₮</strong> нь хүү.</span></div>
    `;

    calculateEarlyPayoff(loanAmt * 1000000, monthlyRate, monthly, months);
  }

  // ===== EARLY PAYOFF SIMULATOR (unchanged) =====
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

  // ===== AFFORDABILITY (unchanged section, #afford — not part of this redesign) =====
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

    // Uses the same loan rate currently selected in the calculator above, falling back to the
    // market-average rate only when the selected bank's own rate is unverified (currentRate
    // null) — a bank tab with no verified rate shouldn't silently zero out this section's
    // math (null/100/12 would otherwise coerce to a 0%-rate/cash-like result here).
    const rate = (currentRate === null) ? 17.5 : currentRate;
    const r = rate / 100 / 12;
    const n = 240;
    const maxLoan = r === 0 ? adjMonthly * n : adjMonthly * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));

    const maxPriceLow = (maxLoan + down) / 1000000;
    const maxPriceHigh = maxPriceLow * 1.12;

    document.getElementById('affResultAmt').textContent = `${Math.round(maxPriceLow)} — ${Math.round(maxPriceHigh)} сая ₮`;
    const affDetailEl = document.getElementById('affResultDetail');
    if (affDetailEl) affDetailEl.textContent = `${rate}% хүү (${currentLoanName}, дээрх тооцоолуурын сонголт), 20 жилийн хугацаатай. Орлогын ${SAFE_DTI}% хүртэл сар бүрийн төлбөр гэж тооцов.`;
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

    if (maxPriceLow >= 400) advice = `Таны нөхцөл хангалттай сайн! ${Math.round(maxPriceLow)}-${Math.round(maxPriceHigh)} сая ₮ үнийн хязгаарт тохирох заруудыг Listings хэсгээс үнэ, талбай, байршлаар шүүж үзээрэй.`;
    else if (maxPriceLow >= 200) advice = `Сайн сонголтууд бий. ${Math.round(maxPriceLow)} сая ₮-н орчмын байрыг Listings хэсгээс хайж үзээрэй.`;
    else if (maxPriceLow >= 100) advice = `Эхэлж буй хүний хувьд сайн боломж. Байршлын сонголтыг тухайн үеийн бодит зарын үнэ, дэд бүтэц, замын нөхцөлтэй харьцуулж сонгоорой.`;
    else advice = `Илүү их урьдчилгаа төлбөр, эсвэл хадгаламжтай болсны дараа хайх нь зүйтэй.`;
    document.getElementById('affAdvice').textContent = advice;

    showToast('Үнэлгээ амжилттай хийгдлээ', 'success');
  }

  // ===== INIT + EVENT LISTENERS =====
  renderBankTabs();
  loadBanks();

  const priceInputEl = document.getElementById('priceInput');
  if (priceInputEl) priceInputEl.addEventListener('input', handlePriceInputChange);

  ['priceSlider', 'downSlider', 'termSlider', 'extraSlider'].forEach(id => {
    document.getElementById(id).addEventListener('input', calculate);
  });
  document.getElementById('rateSlider').addEventListener('input', () => {
    currentRate = parseFloat(document.getElementById('rateSlider').value);
    calculate();
  });

  // Two independent .filter-pill[data-cat] surfaces exist on the Listings page now (the
  // top category tabs and the sidebar's "Үл хөдлөхийн төрөл" list) — sync every element
  // sharing the clicked data-cat, not just the one actually clicked, the same pattern
  // already used everywhere else this state is set (home.js, search.js, saved-searches.js).
  document.querySelectorAll('.filter-pill[data-cat]').forEach(t => {
    t.addEventListener('click', () => {
      currentCat = t.dataset.cat;
      document.querySelectorAll('.filter-pill[data-cat]').forEach(x => x.classList.toggle('active', x.dataset.cat === currentCat));
      applyListingFilter();
    });
  });

  // The old hero's quick-filter chips (instant-apply, one navigate-to-Listings per
  // click) were replaced by the new home search bar's chip row (index.html) — those
  // now just mark themselves active/inactive and only take effect once "Хайх" is
  // pressed, via performSearch() in search.js.

  // ESC to close modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
