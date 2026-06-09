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

