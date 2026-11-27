  // ===== FIREBASE INIT =====
  const firebaseConfig = {
    apiKey: "AIzaSyBdCxMJWmdO9BLuSPLJrkigQTqKfmvZvYw",
    authDomain: "bairx-fd502.firebaseapp.com",
    projectId: "bairx-fd502",
    storageBucket: "bairx-fd502.firebasestorage.app",
    messagingSenderId: "459958506902",
    appId: "1:459958506902:web:4032ffe101a40e7d49b9b7"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  const storage = firebase.storage();

  // Local testing only: on localhost/127.0.0.1 with ?emulator=1 (remembered for the tab
  // session), every Firebase call goes to the local Emulator Suite instead of production —
  // browser tests (tests/e2e) never read or write the real bairx-fd502 data. On any other
  // hostname this block never runs.
  (function () {
    const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!local) return;
    const q = new URLSearchParams(location.search).get('emulator');
    if (q === '1') sessionStorage.setItem('bairxEmulator', '1');
    if (q === '0') sessionStorage.removeItem('bairxEmulator');
    if (sessionStorage.getItem('bairxEmulator') !== '1') return;
    db.useEmulator('127.0.0.1', 8080);
    auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true });
    storage.useEmulator('127.0.0.1', 9199);
    window.BAIRX_EMULATOR = true;
  })();

