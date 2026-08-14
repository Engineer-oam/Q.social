const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const config = require('./firebase-applet-config.json');
admin.initializeApp({ projectId: config.projectId });
getFirestore(config.firestoreDatabaseId).collection('profiles').limit(1).get()
  .then(snap => console.log('Docs:', snap.size))
  .catch(e => console.log('Error:', e.message));
