import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "composite-spanner-fskkt",
  appId: "1:440888873486:web:c6f236659670f948dd225f",
  apiKey: "AIzaSyDhqLDVm51E0d5oN4VlJMhDymlupfnCpow",
  authDomain: "composite-spanner-fskkt.firebaseapp.com",
  storageBucket: "composite-spanner-fskkt.firebasestorage.app",
  messagingSenderId: "440888873486",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "ai-studio-60e46831-dbc8-48ef-8ed2-30738ddd3d03");
export const storage = getStorage(app);
