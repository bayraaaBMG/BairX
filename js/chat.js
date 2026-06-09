  // ===== CHAT SYSTEM =====
  const chatConversations = [
    {
      id: 'c1', name: 'Болор Эстэйт', role: 'agent', avatar: 'Б', avatarColor: '#1E5BFF',
      online: true, unread: 2,
      property: { id: 1, img: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&q=80', title: 'Зайсан, Хүннү 2222', price: '412 сая ₮' },
      messages: [
        { sent: false, text: 'Сайн байна уу! Зайсан дахь 2 өрөө байрны талаар сонирхож байна уу?', time: '14:20' },
        { sent: true, text: 'Тийм ээ, сонирхож байна. Үзэх боломжтой юу?', time: '14:22' },
        { sent: false, text: 'Мэдээж. Маргааш орой 18:00 цагт тохирох уу? Эсвэл амралтын өдөр ч болно.', time: '14:23' },
        { sent: false, text: 'Байр одоо хоосон тул хүссэн үедээ үзэж болно шүү.', time: '14:23' }
      ]
    },
    {
      id: 'c2', name: 'Мөнхбат (эзэн)', role: 'owner', avatar: 'М', avatarColor: '#00D4AA',
      online: false, unread: 0,
      property: { id: 3, img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&q=80', title: 'Яармаг, хаус', price: '920 сая ₮' },
      messages: [
        { sent: true, text: 'Сайн байна уу, Яармаг дахь хаусны үнэ хэлэлцэх боломжтой юу?', time: 'Өчигдөр' },
        { sent: false, text: 'Сайн байна уу. Бага зэрэг боломжтой, ярилцъя. Та биечлэн үзсэн үү?', time: 'Өчигдөр' }
      ]
    },
    {
      id: 'c3', name: 'МАК Констракшн', role: 'company', avatar: 'МАК', avatarColor: '#FFB81C',
      online: true, unread: 0,
      property: { id: 4, img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&q=80', title: 'Чингэлтэй шинэ төсөл', price: '248 сая ₮' },
      messages: [
        { sent: false, text: 'Шинэ төслийн талаар сонирхсонд баярлалаа! Урьдчилгаа 30%, үлдсэнийг барилгын явцад төлнө.', time: '2 хоногийн өмнө' }
      ]
    }
  ];

  let activeChatId = 'c1';

  function openChat(propertyId) {
    // If opened from a listing, find or create conversation
    if (propertyId) {
      const existing = chatConversations.find(c => c.property && c.property.id === propertyId);
      if (existing) activeChatId = existing.id;
    }
    document.getElementById('modalContent').className = 'modal chat-modal';
    renderChat();
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    // Mark as read
    const conv = chatConversations.find(c => c.id === activeChatId);
    if (conv) { conv.unread = 0; updateChatCount(); }
  }

  function renderChat() {
    const conv = chatConversations.find(c => c.id === activeChatId);
    const roleLabels = { agent: 'Агент', owner: 'Эзэн', company: 'Компани' };
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()" style="z-index:20;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="chat-layout">
        <div class="chat-list" id="chatListPanel">
          <div class="chat-list-head"><h3>Зурвас</h3></div>
          <div class="chat-list-items">
            ${chatConversations.map(c => `
              <div class="chat-list-item ${c.id === activeChatId ? 'active' : ''}" onclick="switchChat('${c.id}')">
                <div class="chat-avatar" style="background:${c.avatarColor};">${c.avatar}</div>
                <div class="chat-list-info">
                  <div class="chat-list-name">${c.name}</div>
                  <div class="chat-list-preview">${c.messages[c.messages.length-1].text}</div>
                </div>
                <div class="chat-list-time">${c.messages[c.messages.length-1].time}</div>
                ${c.unread > 0 ? `<div class="chat-unread-badge">${c.unread}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="chat-main">
          <div class="chat-header">
            <button class="chat-back-mobile" onclick="document.getElementById('chatListPanel').classList.remove('hidden-mobile')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div class="chat-avatar" style="background:${conv.avatarColor}; width:38px; height:38px; font-size:14px;">${conv.avatar}</div>
            <div class="chat-header-info">
              <div class="chat-header-name">${conv.name} <span class="post-badge-role ${conv.role}">${roleLabels[conv.role]}</span></div>
              <div class="chat-header-status">${conv.online ? 'Онлайн' : 'Офлайн'}</div>
            </div>
          </div>
          ${conv.property ? `
            <div class="chat-property-ref" onclick="closeModal(); setTimeout(() => openListing(${conv.property.id}), 300)">
              <img src="${conv.property.img}" alt="" />
              <div class="chat-property-ref-info">
                <div class="chat-property-ref-title">${conv.property.title}</div>
                <div class="chat-property-ref-price">${conv.property.price}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ` : ''}
          <div class="chat-messages" id="chatMessages">
            ${conv.messages.map(m => `
              <div class="chat-msg ${m.sent ? 'sent' : 'received'}">
                <div>
                  <div class="chat-bubble">${m.text}</div>
                  <div class="chat-msg-time">${m.time}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="chat-quick-replies">
            <button class="chat-quick-reply" onclick="sendQuickReply('Үзэх боломжтой юу?')">Үзэх боломжтой юу?</button>
            <button class="chat-quick-reply" onclick="sendQuickReply('Үнэ хэлэлцэх үү?')">Үнэ хэлэлцэх үү?</button>
            <button class="chat-quick-reply" onclick="sendQuickReply('Зээлд хамрагдах уу?')">Зээлд хамрагдах уу?</button>
          </div>
          <div class="chat-input-bar">
            <input type="text" class="chat-input" id="chatInput" placeholder="Зурвас бичих..." onkeydown="if(event.key==='Enter') sendChatMessage()" />
            <button class="chat-send" onclick="sendChatMessage()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
    scrollChatBottom();
  }

  function switchChat(id) {
    activeChatId = id;
    const conv = chatConversations.find(c => c.id === id);
    if (conv) conv.unread = 0;
    renderChat();
    updateChatCount();
    // Mobile: hide list to show conversation
    if (window.innerWidth <= 640) {
      const panel = document.getElementById('chatListPanel');
      if (panel) panel.classList.add('hidden-mobile');
    }
  }

  function scrollChatBottom() {
    const el = document.getElementById('chatMessages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    const conv = chatConversations.find(c => c.id === activeChatId);
    const now = new Date();
    const time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
    conv.messages.push({ sent: true, text, time });
    input.value = '';
    renderChat();
    // Simulate reply after 1.5s
    setTimeout(() => {
      const replies = [
        'Тийм ээ, мэдээж. Хэзээ тохиромжтой вэ?',
        'Сайн асуулт байна. Тодорхой ярилцъя.',
        'Болно. Утсаар холбогдвол илүү дэлгэрэнгүй ярих боломжтой.',
        'За, ойлголоо. Танд тохирох цагаа хэлээрэй.'
      ];
      conv.messages.push({ sent: false, text: replies[Math.floor(Math.random()*replies.length)], time });
      if (document.getElementById('modalContent').classList.contains('chat-modal')) renderChat();
    }, 1500);
  }

  function sendQuickReply(text) {
    document.getElementById('chatInput').value = text;
    sendChatMessage();
  }

  function updateChatCount() {
    const total = chatConversations.reduce((s, c) => s + c.unread, 0);
    const badge = document.getElementById('chatCount');
    if (badge) {
      if (total > 0) { badge.textContent = total; badge.style.display = 'grid'; }
      else badge.style.display = 'none';
    }
  }

