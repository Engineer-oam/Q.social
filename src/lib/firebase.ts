import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "composite-spanner-fskkt",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:440888873486:web:c6f236659670f948dd225f",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDhqLDVm51E0d5oN4VlJMhDymlupfnCpow",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "composite-spanner-fskkt.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "composite-spanner-fskkt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "440888873486",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: browserLocalPersistence, popupRedirectResolver: browserPopupRedirectResolver });

const dbId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-60e46831-dbc8-48ef-8ed2-30738ddd3d03";
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, dbId === "(default)" ? undefined : dbId);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
