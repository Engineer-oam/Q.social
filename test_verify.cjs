const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const config = require('./firebase-applet-config.json');
admin.initializeApp({ projectId: config.projectId });
getAuth().verifyIdToken('fake-token')
  .then(() => console.log('Success'))
  .catch(e => console.log('Error:', e.message));
