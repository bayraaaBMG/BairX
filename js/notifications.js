  // ===== NOTIFICATIONS =====
  const notifications = [
    { id: 'n1', type: 'view', text: '<strong>Зайсан, Хүннү 2222</strong> зарыг өнөөдөр <strong>48 хүн</strong> үзлээ', time: '10 минутын өмнө', unread: true },
    { id: 'n2', type: 'message', text: '<strong>Болор Эстэйт</strong> таны зарын талаар асуулт илгээлээ', time: '35 минутын өмнө', unread: true },
    { id: 'n3', type: 'match', text: 'Таны хайсан нөхцөлд тохирох <strong>шинэ зар</strong> орлоо: Зайсан, 2 өрөө, 385 сая ₮', time: '1 цагийн өмнө', unread: true },
    { id: 'n4', type: 'price', text: '<strong>Яармаг хаус</strong> зарын үнэ 60 саяар буурлаа (таны хадгалсан зар)', time: '3 цагийн өмнө', unread: false },
    { id: 'n5', type: 'view', text: 'Таны <strong>Чингэлтэй 2 өрөө</strong> зар 7 хоногт 188 үзэлт авлаа', time: '5 цагийн өмнө', unread: false },
    { id: 'n6', type: 'system', text: 'Таны <strong>VIP зар</strong>-ын хугацаа 3 хоногийн дараа дуусна. Сунгах уу?', time: '8 цагийн өмнө', unread: false },
    { id: 'n7', type: 'match', text: 'Зайсан бүсэд таны төсөвт тохирох <strong>4 шинэ зар</strong> нэмэгдлээ', time: 'Өчигдөр', unread: false }
  ];

  function renderNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;
    const icons = {
      view: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
      price: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      message: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      match: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>',
      system: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    };
    list.innerHTML = notifications.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="readNotif('${n.id}', this)">
        <div class="notif-icon ${n.type}">${icons[n.type]}</div>
        <div class="notif-content">
          <div class="notif-text">${n.text}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  }

  function toggleNotif(e) {
    e.stopPropagation();
    const panel = document.getElementById('notifPanel');
    panel.classList.toggle('open');
  }

  function readNotif(id, el) {
    const n = notifications.find(x => x.id === id);
    if (n && n.unread) {
      n.unread = false;
      el.classList.remove('unread');
      updateNotifCount();
    }
  }

  function markAllRead() {
    notifications.forEach(n => n.unread = false);
    renderNotifications();
    updateNotifCount();
    showToast('Бүх мэдэгдлийг уншсан болголоо', 'success');
  }

  function updateNotifCount() {
    const unread = notifications.filter(n => n.unread).length;
    const badge = document.getElementById('notifCount');
    if (badge) {
      if (unread > 0) {
        badge.textContent = unread;
        badge.style.display = 'grid';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // Close notif panel when clicking outside
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('notifPanel');
    const trigger = e.target.closest('.notif-trigger');
    if (panel && panel.classList.contains('open') && !panel.contains(e.target) && !trigger) {
      panel.classList.remove('open');
    }
  });

  // Simulate live notification arriving
  function simulateLiveNotif() {
    const liveNotifs = [
      { type: 'view', text: 'Таны <strong>Зайсан 2 өрөө</strong> зарыг яг одоо хүн үзэж байна' },
      { type: 'message', text: '<strong>Шинэ дуудлага:</strong> Нэгэн худалдан авагч холбогдохыг хүсэж байна' },
      { type: 'match', text: 'Таны хайлтад тохирох <strong>шинэ зар</strong> дөнгөж нэмэгдлээ' }
    ];
    const random = liveNotifs[Math.floor(Math.random() * liveNotifs.length)];
    notifications.unshift({ id: 'live' + Date.now(), type: random.type, text: random.text, time: 'Дөнгөж сая', unread: true });
    renderNotifications();
    updateNotifCount();
    // Subtle toast
    showToast('Шинэ мэдэгдэл ирлээ');
  }

