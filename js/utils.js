
  // ===== UTILITIES =====
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function fmtPrice(p) {
    if (p >= 1000) return (p/1000).toFixed(1) + ' тэрбум ₮';
    return p + ' сая ₮';
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

