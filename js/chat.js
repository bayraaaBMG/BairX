  // ===== REAL CHAT SYSTEM (Firestore-backed) =====
  // Every listing — demo or user-submitted — has an ownerId (demo listings get a stable
  // synthetic 'demo-{id}'), so chatting works identically everywhere; a demo seller just
  // never happens to write back.
  // Schema: chats/{listingKey_uidA_uidB} { listingKey, listingTitle, listingImg,
  //   participants: [uid, uid], participantNames: {uid: name}, lastMessage, lastMessageAt,
  //   unread: {uid: count} } and chats/{id}/messages/{msgId} { senderId, text, createdAt }
  let myChats = [];
  let activeChatId = null;
  let _chatListUnsub = null;
  let _chatMsgUnsub = null;

  function subscribeMyChats() {
    if (_chatListUnsub) { _chatListUnsub(); _chatListUnsub = null; }
    if (!currentUser) { myChats = []; updateChatCount(); return; }
    _chatListUnsub = db.collection('chats').where('participants', 'array-contains', currentUser.uid)
      .onSnapshot(snap => {
        myChats = snap.docs.map(d => Object.assign({ id: d.id }, d.data()))
          .sort((a, b) => (b.lastMessageAt?.toMillis?.() || 0) - (a.lastMessageAt?.toMillis?.() || 0));
        updateChatCount();
        if (document.getElementById('chatListItems')) renderChatListPanel();
      }, () => {});
  }

  function unsubscribeActiveChat() {
    if (_chatMsgUnsub) { _chatMsgUnsub(); _chatMsgUnsub = null; }
  }

  async function getOrCreateChat(l) {
    if (!currentUser || !l.ownerId || l.ownerId === currentUser.uid) return null;
    const listingKey = l.firestoreId ? ('fs-' + l.firestoreId) : ('local-' + l.id);
    const chatId = listingKey + '_' + [currentUser.uid, l.ownerId].sort().join('_');
    const ref = db.collection('chats').doc(chatId);
    try {
      const snap = await ref.get();
      const chatData = {
        listingKey, listingTitle: l.title, listingImg: l.img,
        participants: [currentUser.uid, l.ownerId],
        participantNames: { [currentUser.uid]: currentUser.name, [l.ownerId]: sellerData[l.id]?.name || 'Хэрэглэгч' },
        lastMessage: '', unread: { [currentUser.uid]: 0, [l.ownerId]: 0 }
      };
      if (!snap.exists) {
        await ref.set(Object.assign({}, chatData, { lastMessageAt: firebase.firestore.FieldValue.serverTimestamp() }));
      }
      if (!myChats.some(c => c.id === chatId)) myChats.unshift(Object.assign({ id: chatId }, chatData));
      return chatId;
    } catch(e) {
      showToast('Чат нээхэд алдаа гарлаа');
      return null;
    }
  }

  async function openChat(listingLocalId) {
    if (!currentUser) { showToast('Чат ашиглахын тулд нэвтэрнэ үү'); openAuth(); return; }
    document.getElementById('modalContent').className = 'modal chat-modal';
    let targetChatId = null;
    if (listingLocalId) {
      const l = listings.find(x => x.id === listingLocalId);
      if (l) targetChatId = await getOrCreateChat(l);
    }
    if (!targetChatId) targetChatId = myChats[0]?.id || null;
    renderChatShell();
    document.getElementById('modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    if (targetChatId) openChatThread(targetChatId);
  }

  function renderChatShell() {
    document.getElementById('modalContent').innerHTML = `
      <button class="modal-close" onclick="closeModal()" style="z-index:20;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="chat-layout">
        <div class="chat-list" id="chatListPanel">
          <div class="chat-list-head"><h3>Зурвас</h3></div>
          <div class="chat-list-items" id="chatListItems"></div>
        </div>
        <div class="chat-main" id="chatMainPane">
          <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--ink-3);font-size:14px;padding:40px;text-align:center;">Зүүн талаас харилцагчаа сонгоно уу, эсвэл зарын дэлгэрэнгүй хуудаснаас "Чат бичих" товч дарж шинэ зурвас эхлүүлээрэй.</div>
        </div>
      </div>
    `;
    renderChatListPanel();
  }

  function renderChatListPanel() {
    const el = document.getElementById('chatListItems');
    if (!el) return;
    if (myChats.length === 0) {
      el.innerHTML = `<div style="padding:24px;color:var(--ink-3);font-size:13px;text-align:center;">Одоогоор зурвас байхгүй байна.</div>`;
      return;
    }
    el.innerHTML = myChats.map(c => {
      const otherUid = c.participants.find(p => p !== currentUser.uid);
      const otherName = c.participantNames?.[otherUid] || 'Хэрэглэгч';
      const unread = c.unread?.[currentUser.uid] || 0;
      return `
        <div class="chat-list-item ${c.id === activeChatId ? 'active' : ''}" onclick="switchRealChat('${c.id}')">
          <div class="chat-avatar" style="background:#1E5BFF;">${esc(otherName[0] || 'Х')}</div>
          <div class="chat-list-info">
            <div class="chat-list-name">${esc(otherName)}</div>
            <div class="chat-list-preview">${esc(c.lastMessage || c.listingTitle || '')}</div>
          </div>
          ${unread > 0 ? `<div class="chat-unread-badge">${unread}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function switchRealChat(chatId) {
    openChatThread(chatId);
    renderChatListPanel();
  }

  function openChatThread(chatId, starterText) {
    activeChatId = chatId;
    unsubscribeActiveChat();
    renderChatMainShell(chatId, starterText);
    _chatMsgUnsub = db.collection('chats').doc(chatId).collection('messages').orderBy('createdAt', 'asc')
      .onSnapshot(snap => renderChatMessages(snap.docs.map(d => d.data())), () => {});
    db.collection('chats').doc(chatId).update({ ['unread.' + currentUser.uid]: 0 }).catch(() => {});
    // On mobile the list panel covers the whole modal (absolute-positioned) — whenever a
    // specific thread is opened, whether from the list or straight from a listing page,
    // switch to showing that conversation instead of leaving the list on top of it.
    if (window.innerWidth <= 640) {
      const panel = document.getElementById('chatListPanel');
      if (panel) panel.classList.add('hidden-mobile');
    }
  }

  function renderChatMainShell(chatId, starterText) {
    const chat = myChats.find(c => c.id === chatId);
    const pane = document.getElementById('chatMainPane');
    if (!chat || !pane) return;
    const otherUid = chat.participants.find(p => p !== currentUser.uid);
    const otherName = chat.participantNames?.[otherUid] || 'Хэрэглэгч';
    pane.innerHTML = `
      <div class="chat-header">
        <button class="chat-back-mobile" onclick="document.getElementById('chatListPanel').classList.remove('hidden-mobile')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="chat-avatar" style="background:#1E5BFF; width:38px; height:38px; font-size:14px;">${esc(otherName[0] || 'Х')}</div>
        <div class="chat-header-info">
          <div class="chat-header-name">${esc(otherName)}</div>
        </div>
      </div>
      ${chat.listingKey ? `
        <div class="chat-property-ref" onclick="openChatListingRef('${chat.listingKey}')">
          <img src="${esc(chat.listingImg || '')}" alt="" />
          <div class="chat-property-ref-info">
            <div class="chat-property-ref-title">${esc(chat.listingTitle || '')}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      ` : ''}
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-bar">
        <input type="text" class="chat-input" id="chatInput" placeholder="Зурвас бичих..." value="${esc(starterText || '')}" onkeydown="if(event.key==='Enter') sendRealChatMessage()" />
        <button class="chat-send" onclick="sendRealChatMessage()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    `;
    if (starterText) {
      const inputEl = document.getElementById('chatInput');
      if (inputEl) { inputEl.focus(); inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length); }
    }
  }

  function openChatListingRef(listingKey) {
    closeModal();
    setTimeout(() => {
      let ll = null;
      if (listingKey.startsWith('fs-')) ll = listings.find(x => x.firestoreId === listingKey.slice(3));
      else if (listingKey.startsWith('local-')) ll = listings.find(x => x.id === parseInt(listingKey.slice(6), 10));
      if (ll) openListing(ll.id);
    }, 300);
  }

  function renderChatMessages(msgs) {
    const el = document.getElementById('chatMessages');
    if (!el) return;
    el.innerHTML = msgs.map(m => `
      <div class="chat-msg ${m.senderId === currentUser.uid ? 'sent' : 'received'}">
        <div><div class="chat-bubble">${esc(m.text)}</div></div>
      </div>
    `).join('');
    el.scrollTop = el.scrollHeight;
  }

  async function sendRealChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input?.value.trim();
    if (!text || !activeChatId) return;
    input.value = '';
    const chat = myChats.find(c => c.id === activeChatId);
    const otherUid = chat?.participants.find(p => p !== currentUser.uid);
    try {
      await db.collection('chats').doc(activeChatId).collection('messages').add({
        senderId: currentUser.uid, text, createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      const update = { lastMessage: text, lastMessageAt: firebase.firestore.FieldValue.serverTimestamp() };
      if (otherUid) update['unread.' + otherUid] = firebase.firestore.FieldValue.increment(1);
      await db.collection('chats').doc(activeChatId).update(update);
    } catch(e) {
      showToast('Зурвас илгээхэд алдаа гарлаа');
    }
  }

  function updateChatCount() {
    const badge = document.getElementById('chatCount');
    if (!badge) return;
    const totalUnread = currentUser ? myChats.reduce((s, c) => s + (c.unread?.[currentUser.uid] || 0), 0) : 0;
    if (totalUnread > 0) { badge.textContent = totalUnread; badge.style.display = 'grid'; }
    else badge.style.display = 'none';
  }
