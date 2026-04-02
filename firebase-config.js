// firebase-config.js (ESM module)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";


// 1) En Firebase Console:
// - Authentication > Sign-in method > habilitar Email/Password
// - Firestore Database > Create database
// - Project settings > Your apps > Web app > copiar config
const firebaseConfig = {
  apiKey: "AIzaSyBVse9QUAmHX90vgl5acOa1Uw_cXHFxbqs",
  authDomain: "adwork-and.firebaseapp.com",
  projectId: "adwork-and",
  storageBucket: "adwork-and.firebasestorage.app",
  messagingSenderId: "459699554560",
  appId: "1:459699554560:web:d67f8988b3e50a5b2ecbe5"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
