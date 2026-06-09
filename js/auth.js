  // ===== AUTH SYSTEM =====
  let currentUser = null;
  let authCurrentEmail = '';

  // onAuthStateChanged — page load болгонд Firebase session сэргээнэ
  auth.onAuthStateChanged(async (fbUser) => {
    if (fbUser) {
      try {
        const snap = await db.collection('users').doc(fbUser.uid).get();
        const data = snap.data() || {};
        const firstName = data.firstName || fbUser.displayName?.split(' ')[0] || 'Хэрэглэгч';
        const lastName = data.lastName || fbUser.displayName?.split(' ').slice(1).join(' ') || '';
        currentUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          emailVerified: fbUser.emailVerified,
          name: firstName,
          lastName,
          letter: firstName[0] || 'Х',
          isGoogle: fbUser.providerData.some(p => p.providerId === 'google.com')
        };
        updateNavLoggedIn();

        // Email verify banner
        const banner = document.getElementById('emailVerifyBanner');
        if (banner) {
          if (!fbUser.emailVerified && !currentUser.isGoogle) {
            banner.style.display = 'flex';
          } else {
            banner.style.display = 'none';
          }
        }

        // Favorites-г Firestore-с татах
        try {
          const fsnap = await db.collection('favorites').where('userId', '==', fbUser.uid).get();
          const fsIds = [];
          fsnap.forEach(doc => { const d = doc.data(); if (d.listingId != null) fsIds.push(d.listingId); });
          if (fsIds.length > 0) {
            fsIds.forEach(id => { if (!favorites.includes(id)) favorites.push(id); });
            try { localStorage.setItem('bairxFavorites', JSON.stringify(favorites)); } catch(e) {}
            updateFavCount();
          }
        } catch(e) {}

        // Firestore-с хэрэглэгчийн зарнуудыг татаж авна
        try {
          const lsnap = await db.collection('listings').where('ownerId', '==', fbUser.uid).get();
          lsnap.forEach(doc => {
            if (listings.some(l => l.firestoreId === doc.id)) return;
            const d = doc.data();
            const numId = listings.reduce((m, l) => l.id > m ? l.id : m, 0) + 1;
            const entry = {
              id: numId, firestoreId: doc.id,
              cat: d.category || 'apartment', title: d.title, loc: d.loc,
              district: d.district, price: d.price, area: d.area, rooms: d.rooms,
              floor: d.floor, year: d.year,
              img: (d.images && d.images[0]) || d.img || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
              tag: { type: 'new', text: 'Шинэ зар' }, badges: d.badges || ['user'],
              loanType: 'Тохиролцоно', monthly: 0,
              userSubmitted: true, _inactive: d.status === 'inactive'
            };
            listings.push(entry);
            if (d.images && d.images.length > 0) listingExtras[numId] = { coords: { x: 50, y: 50 }, gallery: d.images };
            sellerData[numId] = { phone: d.sellerPhone || '', name: d.sellerName || 'Хэрэглэгч', type: d.sellerType || 'Хувь хүн' };
          });
          renderMyListings(); renderHomeListings(); renderListings(getFilteredListings());
        } catch(e) {}
      } catch(e) {
        currentUser = null;
      }
    } else {
      currentUser = null;
      const loginBtn = document.getElementById('loginBtn');
      const userAvatarWrap = document.getElementById('userAvatarWrap');
      const userAvatar = document.getElementById('userAvatar');
      if (loginBtn) loginBtn.style.display = '';
      if (userAvatar) userAvatar.style.display = 'none';
      if (userAvatarWrap) userAvatarWrap.style.display = 'none';
      const banner = document.getElementById('emailVerifyBanner');
      if (banner) banner.style.display = 'none';
    }
  });

  let verifyEmailCooldown = false;
  async function sendVerificationEmail() {
    if (!auth.currentUser) { showToast('Эхлээд нэвтэрнэ үү'); return; }
    if (verifyEmailCooldown) { showToast('Хэтэрхий олон удаа илгээлээ. Түр хүлээнэ үү.'); return; }
    try {
      await auth.currentUser.sendEmailVerification();
      verifyEmailCooldown = true;
      setTimeout(() => { verifyEmailCooldown = false; }, 60000);
      const btn = document.getElementById('sendVerifyBtn');
      if (btn) { btn.textContent = 'Илгээгдлээ ✓'; btn.disabled = true; setTimeout(() => { btn.textContent = 'Дахин илгээх'; btn.disabled = false; }, 60000); }
      showToast('Баталгаажуулах линк ' + (currentUser?.email || '') + ' рүү илгээгдлээ', 'success');
    } catch(e) {
      showToast('И-мэйл илгээхэд алдаа гарлаа');
    }
  }

  function openAuth() {
    goToAuthStep(1);
    document.getElementById('authModal').classList.add('open');
    setTimeout(() => document.getElementById('authEmail')?.focus(), 200);
  }

  function closeAuth() {
    document.getElementById('authModal').classList.remove('open');
  }

  function goToAuthStep(step) {
    ['authStep1','authStep3Login','authStep3Register','authStepForgot'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const map = { 1:'authStep1', '3login':'authStep3Login', '3register':'authStep3Register', 'forgot':'authStepForgot' };
    const target = document.getElementById(map[step]);
    if (target) { target.style.display = 'flex'; target.style.animation = 'none'; void target.offsetWidth; target.style.animation = ''; }
  }

  async function submitEmail() {
    const email = (document.getElementById('authEmail')?.value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Зөв имэйл хаяг оруулна уу'); return; }
    authCurrentEmail = email;
    try {
      const methods = await auth.fetchSignInMethodsForEmail(email);
      if (methods.length > 0) {
        const el = document.getElementById('loginEmailDisplay');
        if (el) el.textContent = email;
        goToAuthStep('3login');
        setTimeout(() => document.getElementById('authPassword')?.focus(), 100);
      } else {
        const el = document.getElementById('regEmailDisplay');
        if (el) el.textContent = email;
        goToAuthStep('3register');
        setTimeout(() => document.getElementById('authLastName')?.focus(), 100);
      }
    } catch(e) {
      showToast('Алдаа гарлаа. Дахин оролдоно уу.');
    }
  }

  async function loginWithEmail() {
    const pw = document.getElementById('authPassword')?.value;
    if (!pw) { showToast('Нууц үг оруулна уу'); return; }
    try {
      await auth.signInWithEmailAndPassword(authCurrentEmail, pw);
      closeAuth();
      showToast('Тавтай морилно уу!', 'success');
    } catch(e) {
      const msgs = {
        'auth/wrong-password': 'Нууц үг буруу байна',
        'auth/invalid-credential': 'Нууц үг буруу байна',
        'auth/too-many-requests': 'Хэт олон оролдлого. Түр хүлээнэ үү.',
        'auth/user-disabled': 'Энэ бүртгэл хаагдсан байна'
      };
      showToast(msgs[e.code] || 'Нэвтрэхэд алдаа гарлаа');
    }
  }

  async function createAccount() {
    const lastName = (document.getElementById('authLastName')?.value || '').trim();
    const firstName = (document.getElementById('authFirstName')?.value || '').trim();
    const pw = document.getElementById('authNewPassword')?.value || '';
    const pw2 = document.getElementById('authNewPassword2')?.value || '';
    if (!lastName || !firstName) { showToast('Овог нэрээ оруулна уу'); return; }
    if (pw.length < 6) { showToast('Нууц үг хамгийн багадаа 6 тэмдэгт байна'); return; }
    if (pw !== pw2) { showToast('Нууц үгнүүд таарахгүй байна'); return; }
    try {
      const cred = await auth.createUserWithEmailAndPassword(authCurrentEmail, pw);
      await cred.user.updateProfile({ displayName: firstName + ' ' + lastName });
      await db.collection('users').doc(cred.user.uid).set({
        uid: cred.user.uid,
        firstName,
        lastName,
        email: authCurrentEmail,
        role: 'user',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      closeAuth();
      showToast(`Бүртгэл амжилттай! Тавтай морилно уу, ${firstName}!`, 'success');
    } catch(e) {
      const msgs = {
        'auth/email-already-in-use': 'Энэ имэйл аль хэдийн бүртгэлтэй байна',
        'auth/weak-password': 'Нууц үг хэтэрхий энгийн байна'
      };
      showToast(msgs[e.code] || 'Бүртгэл үүсгэхэд алдаа гарлаа');
    }
  }

  async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await auth.signInWithPopup(provider);
      const fbUser = result.user;
      const userDoc = await db.collection('users').doc(fbUser.uid).get();
      if (!userDoc.exists) {
        const parts = (fbUser.displayName || 'Хэрэглэгч').split(' ');
        await db.collection('users').doc(fbUser.uid).set({
          uid: fbUser.uid,
          firstName: parts[0] || 'Хэрэглэгч',
          lastName: parts.slice(1).join(' ') || '',
          email: fbUser.email,
          role: 'user',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      closeAuth();
      showToast('Google-ээр нэвтэрлээ. Тавтай морилно уу!', 'success');
    } catch(e) {
      if (e.code !== 'auth/popup-closed-by-user') showToast('Google нэвтрэхэд алдаа гарлаа');
    }
  }

  function startForgotPassword() {
    if (!authCurrentEmail) { showToast('Эхлээд имэйл хаягаа оруулна уу'); goToAuthStep(1); return; }
    const el = document.getElementById('forgotEmailDisplay');
    if (el) el.textContent = authCurrentEmail;
    goToAuthStep('forgot');
  }

  async function sendPasswordReset() {
    try {
      await auth.sendPasswordResetEmail(authCurrentEmail);
      closeAuth();
      showToast('Нууц үг сэргээх линк имэйлд илгээгдлээ', 'success');
    } catch(e) {
      showToast('Имэйл илгээхэд алдаа гарлаа');
    }
  }

  function updateNavLoggedIn() {
    const loginBtn = document.getElementById('loginBtn');
    const userAvatar = document.getElementById('userAvatar');
    const userAvatarWrap = document.getElementById('userAvatarWrap');
    const userDropName = document.getElementById('userDropName');
    const userDropPhone = document.getElementById('userDropPhone');
    if (loginBtn) loginBtn.style.display = 'none';
    if (userAvatarWrap) userAvatarWrap.style.display = '';
    if (userAvatar) {
      userAvatar.style.display = 'grid';
      const letterEl = document.getElementById('userAvLetter');
      if (letterEl) letterEl.textContent = currentUser.letter;
    }
    if (userDropName) userDropName.textContent = (currentUser.lastName ? currentUser.lastName + ' ' : '') + currentUser.name;
    if (userDropPhone) userDropPhone.textContent = currentUser.isGoogle ? 'Google хэрэглэгч' : (currentUser.email || '');
  }

  function toggleUserMenu(e) {
    if (e) e.stopPropagation();
    const dd = document.getElementById('userDropdown');
    if (dd) dd.classList.toggle('open');
  }

  async function logout() {
    try {
      await auth.signOut();
      const dd = document.getElementById('userDropdown');
      if (dd) dd.classList.remove('open');
      showToast('Амжилттай гарлаа');
    } catch(e) {}
  }

  document.addEventListener('click', (e) => {
    const dd = document.getElementById('userDropdown');
    const av = document.getElementById('userAvatar');
    if (dd && av && !av.contains(e.target) && !dd.contains(e.target)) dd.classList.remove('open');
  });

