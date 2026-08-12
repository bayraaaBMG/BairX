
  // ===== UTILITIES =====
  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  // Great-circle distance between two lat/lng points, in kilometers (Haversine formula).
  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  // Always computed live from current price/area (never a stale stored snapshot), so it
  // stays correct even for listings loaded from Firestore without a pre-computed field,
  // and updates automatically the instant price or area changes.
  function pricePerSqmText(l) {
    if (!l || l.cat === 'rent' || typeof l.price !== 'number' || !l.area) return '';
    const perSqm = (l.price * 1000000) / l.area;
    if (!isFinite(perSqm) || perSqm <= 0) return '';
    return fmt(perSqm) + ' ₮/м²';
  }
  function fmtPrice(p) {
    if (p >= 1000) return (p/1000).toFixed(1) + ' тэрбум ₮';
    return p + ' сая ₮';
  }

  // Дүүргийн ойролцоогоор зах зээлийн дундаж м² үнэ (сая ₮/м²) — нэг эх сурвалж,
  // Add-listing-ий үнийн зөвлөмж болон Property Score хоёулаа үүнийг ашиглана.
  const DISTRICT_MARKET_AVG = {
    'khan-uul': 5.2, 'sukhbaatar': 5.8, 'chingeltei': 4.0, 'bayanzurkh': 3.8,
    'bayangol': 3.5, 'songinokhairkhan': 3.2, 'nalaikh': 1.8,
    'bagakhangai': 2.0, 'baganuur': 2.0
  };

  // ===== PROPERTY VALUATION (real comparable-sales analysis, not a hardcoded lookup) =====
  // This used to just read l.tag.type — which every user-submitted listing sets to 'new'
  // and never 'below'/'above', so the "verdict" was silently meaningless for every real
  // listing on the platform and only ever worked for hand-authored demo data. It now
  // finds actual comparable listings from the live `listings` array and computes a real
  // median ₮/м², narrowing the comparison as far as it can (same хотхон, then district +
  // similar size, then district, then city-wide) and openly reporting how many
  // comparables it found and how that narrowing affected confidence. If there simply
  // isn't enough real data to compare against, it says so instead of guessing.
  function computeValuation(l) {
    if (!l || l.cat === 'rent' || typeof l.price !== 'number' || !l.area) {
      return { available: false, reason: 'not-applicable' };
    }
    const subjectPerSqm = (l.price * 1000000) / l.area;

    const pool = (typeof listings !== 'undefined' ? listings : [])
      .filter(x => x.id !== l.id && x.cat === l.cat && !x._inactive && x.cat !== 'rent'
        && typeof x.price === 'number' && x.area)
      .map(x => ({ l: x, perSqm: (x.price * 1000000) / x.area }))
      .filter(x => isFinite(x.perSqm) && x.perSqm > 0);

    function median(arr) {
      const vals = arr.map(a => a.perSqm).sort((a, b) => a - b);
      const mid = Math.floor(vals.length / 2);
      return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
    }

    let tier, comps;
    if (l.complex) {
      comps = pool.filter(a => a.l.district === l.district && a.l.complex === l.complex);
      tier = 'complex';
    }
    if (!comps || comps.length < 3) {
      comps = pool.filter(a => a.l.district === l.district && Math.abs(a.l.area - l.area) / l.area <= 0.3);
      tier = 'district-similar';
    }
    if (comps.length < 3) {
      comps = pool.filter(a => a.l.district === l.district);
      tier = 'district';
    }
    if (comps.length < 3) {
      comps = pool;
      tier = 'city';
    }

    if (comps.length < 2) {
      return { available: false, reason: 'insufficient-data', sampleSize: comps.length };
    }

    const marketPerSqm = median(comps);
    const diffPct = (subjectPerSqm - marketPerSqm) / marketPerSqm;
    let verdict, color;
    if (diffPct <= -0.08) { verdict = 'Сонирхолтой санал'; color = '#009878'; }
    else if (diffPct <= 0.08) { verdict = 'Зах зээлийн үнэ'; color = '#1E5BFF'; }
    else { verdict = 'Зах зээлээс дээгүүр'; color = '#FF4757'; }

    let confidence;
    if ((tier === 'complex' && comps.length >= 3) || (tier !== 'city' && comps.length >= 8)) confidence = 'high';
    else if (comps.length >= 5) confidence = 'medium';
    else confidence = 'low';

    const basisText = {
      complex: `тухайн хотхон дахь ${comps.length} зартай`,
      'district-similar': `дүүргийн ижил хэмжээний ${comps.length} зартай`,
      district: `дүүргийн ${comps.length} зартай`,
      city: `хотын хэмжээний ${comps.length} зартай (дүүрэгт хангалттай харьцуулах зар олдсонгүй)`
    }[tier];

    return {
      available: true, verdict, color, confidence, tier, basisText,
      sampleSize: comps.length, subjectPerSqm, marketPerSqm, diffPct
    };
  }

  // Thin wrapper kept for callers (compare table) that only need a verdict + color and
  // don't need the full comparable breakdown; falls back to a neutral "not enough data"
  // state instead of fabricating a verdict when computeValuation() can't find comparables.
  function aiVerdictFor(l) {
    const v = computeValuation(l);
    if (!v.available) return { verdict: 'Мэдээлэл хүрэлцэхгүй', color: 'var(--ink-3)' };
    return { verdict: v.verdict, color: v.color };
  }

  // A transparent 0-100 composite score computed purely from the listing's own data —
  // not a machine-learned model, just a documented rule-based blend of price fairness,
  // verification/trust signals, feature completeness, and photo coverage.
  function propertyScore(l) {
    let score = 50;
    // Prefer the real comparable-based diff; only fall back to the coarse district
    // average if there truly aren't enough comparable listings to analyze yet.
    const val = computeValuation(l);
    const diffPct = val.available ? val.diffPct : (() => {
      const perSqm = (l.cat !== 'rent' && l.area && typeof l.price === 'number') ? (l.price * 1000000) / l.area : null;
      if (!perSqm) return null;
      const avg = (DISTRICT_MARKET_AVG[l.district] || 4.0) * 1000000;
      return (perSqm - avg) / avg;
    })();
    if (diffPct != null) {
      if (diffPct <= -0.05) score += 20;
      else if (diffPct <= 0.05) score += 10;
      else if (diffPct <= 0.15) score += 0;
      else score -= 10;
    }
    if (l.sellerVerified) score += 8;
    if (Array.isArray(l.badges) && l.badges.includes('verified')) score += 7;
    const feats = ['parking', 'elevator', 'balcony', 'furnished', 'loan'];
    const haveFeats = feats.filter(f => Array.isArray(l.features) && l.features.includes(f)).length;
    score += haveFeats * 4;
    const photoCount = (l.images && l.images.length) || (l._gallery && l._gallery.length) || (l.img ? 1 : 0);
    if (photoCount >= 5) score += 10; else if (photoCount >= 2) score += 5;
    const infoFields = [l.buildingType, l.heating, l.insulation, l.condition];
    score += infoFields.filter(Boolean).length * 2.5;
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (type === 'success' ? ' success' : '');
    setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ===== PAGE ROUTER =====
  function showPage(id) {
    const target = id || 'home';
    document.querySelectorAll('section').forEach(s => s.classList.remove('page-active'));
    if (target === 'home') {
      ['home', 'banks', 'home-portal', 'features'].forEach(function(sid) {
        const el = document.getElementById(sid);
        if (el) el.classList.add('page-active');
      });
      if (history.pushState) history.pushState(null, '', location.pathname);
    } else {
      const el = document.getElementById(target);
      if (el) {
        el.classList.add('page-active');
        if (history.pushState) history.pushState(null, '', '#' + target);
      }
    }
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-links a[onclick*="'${target}'"]`);
    if (activeLink) activeLink.classList.add('active');
    window.scrollTo(0, 0);
    if (target === 'dashboard' && typeof renderDashboard === 'function') renderDashboard();
  }

  function scrollToSection(id) {
    showPage(id);
  }

  function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
  }

  // ===== EXTRA LISTING METADATA (gallery + map coords) =====
  const listingExtras = {
    1: { coords: { x: 62, y: 70 }, gallery: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80', 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=900&q=80', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=900&q=80', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80'] },
    2: { coords: { x: 48, y: 45 }, gallery: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80', 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=900&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=900&q=80'] },
    3: { coords: { x: 70, y: 80 }, gallery: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=900&q=80', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80', 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=900&q=80', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=900&q=80'] },
    4: { coords: { x: 40, y: 35 }, gallery: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80'] },
    5: { coords: { x: 50, y: 40 }, gallery: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=80', 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=900&q=80'] },
    6: { coords: { x: 85, y: 55 }, gallery: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80'] }
  };

  // ===== SELLER DATA (phone, name, type per listing) =====
  const sellerData = {
    1:  { phone: '9911-2233', name: 'Бат-Эрдэнэ Г.', type: 'Хувь хүн' },
    2:  { phone: '8822-3344', name: 'Сарнай Д.', type: 'Агент' },
    3:  { phone: '9933-4455', name: 'Болд О.', type: 'Хувь хүн' },
    4:  { phone: '8844-5566', name: 'Nominchimeg Б.', type: 'Агент' },
    5:  { phone: '9955-6677', name: 'Гантулга Н.', type: 'Агент' },
    6:  { phone: '8866-7788', name: 'Цэгмид Л.', type: 'Хувь хүн' },
    7:  { phone: '9977-8899', name: 'Өлзий Р.', type: 'Хувь хүн' },
    8:  { phone: '8888-9900', name: 'Мөнх-Эрдэнэ Б.', type: 'Агент' },
    9:  { phone: '9900-1122', name: 'Энхжин С.', type: 'Хувь хүн' },
    10: { phone: '8811-2244', name: 'Дэлгэрмаа Ч.', type: 'Агент' },
    11: { phone: '9922-3355', name: 'Анхбаяр Г.', type: 'Хувь хүн' },
    12: { phone: '8833-4466', name: 'Баярсайхан Д.', type: 'Агент' },
    13: { phone: '9944-5577', name: 'Буяннэмэх О.', type: 'Хувь хүн' },
    14: { phone: '8855-6688', name: 'Солонго Б.', type: 'Агент' },
    15: { phone: '9966-7799', name: 'Батцэцэг Л.', type: 'Хувь хүн' },
    16: { phone: '8877-8800', name: 'Ариунаа Н.', type: 'Агент' },
    17: { phone: '9988-9911', name: 'Зандан Р.', type: 'Хувь хүн' },
    18: { phone: '8899-0022', name: 'Мөнхтуяа С.', type: 'Агент' },
    19: { phone: '9900-1133', name: 'Отгонбаяр Ч.', type: 'Хувь хүн' },
    20: { phone: '8811-3344', name: 'Дорж-Одсүрэн Г.', type: 'Агент' },
    21: { phone: '9922-4455', name: 'Энхтуяа Б.', type: 'Хувь хүн' },
    22: { phone: '8833-5566', name: 'Нарантуяа Д.', type: 'Агент' },
    23: { phone: '9944-6677', name: 'Батмөнх О.', type: 'Хувь хүн' },
    24: { phone: '8855-7788', name: 'Гэрэлмаа Н.', type: 'Агент' },
    25: { phone: '9966-8899', name: 'Тэгшбаяр Л.', type: 'Хувь хүн' },
    26: { phone: '8877-9900', name: 'Нандинцэцэг Р.', type: 'Агент' },
    27: { phone: '9988-0011', name: 'Баатар Б.', type: 'Хувь хүн' },
    28: { phone: '8800-1122', name: 'Оюунаа С.', type: 'Агент' },
    29: { phone: '9911-2233', name: 'Лхагва Ч.', type: 'Хувь хүн' },
    30: { phone: '8822-3355', name: 'Мөнхбат Г.', type: 'Агент' },
    31: { phone: '9933-4466', name: 'Энхбат Д.', type: 'Хувь хүн' },
    32: { phone: '8844-5577', name: 'Цэцэгмаа О.', type: 'Агент' },
    33: { phone: '9955-6688', name: 'Ганбат Н.', type: 'Хувь хүн' },
    34: { phone: '8866-7799', name: 'Ундрах Б.', type: 'Агент' },
    35: { phone: '9977-8800', name: 'Сэрээнэнэ Л.', type: 'Хувь хүн' },
    36: { phone: '8888-9911', name: 'Болормаа Р.', type: 'Агент' },
    37: { phone: '9900-0022', name: 'Дагиймаа С.', type: 'Хувь хүн' },
    38: { phone: '8811-1133', name: 'Мэдэгмаа Ч.', type: 'Агент' },
    39: { phone: '9922-2244', name: 'Пунцагдулам Г.', type: 'Хувь хүн' },
    40: { phone: '8833-3355', name: 'Отгонсүрэн Д.', type: 'Агент' }
  };

