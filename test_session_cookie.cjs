const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const config = require('./firebase-applet-config.json');
admin.initializeApp({ projectId: config.projectId });
getAuth().createSessionCookie('fake-token', { expiresIn: 3600000 })
  .then(() => console.log('Success'))
  .catch(e => console.log('Error:', e.message));
