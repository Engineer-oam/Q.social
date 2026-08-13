const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadString } = require('firebase/storage');

const firebaseConfig = {
  projectId: "composite-spanner-fskkt",
  appId: "1:440888873486:web:c6f236659670f948dd225f",
  apiKey: "AIzaSyDhqLDVm51E0d5oN4VlJMhDymlupfnCpow",
  authDomain: "composite-spanner-fskkt.firebaseapp.com",
  storageBucket: "composite-spanner-fskkt.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const storageRef = ref(storage, 'test.txt');
uploadString(storageRef, 'test').then(() => {
  console.log('Upload successful');
}).catch((error) => {
  console.error('Upload failed:', error.message);
});
