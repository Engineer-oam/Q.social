const admin = require('firebase-admin');
const config = require('./firebase-applet-config.json');
admin.initializeApp({ projectId: config.projectId });
console.log("App initialized.");
