const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const additionalRules = `
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.recipientId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.actorId == request.auth.uid;
      allow update: if isAuthenticated() && resource.data.recipientId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.recipientId == request.auth.uid;
    }

    match /lives/{liveId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }
  }
}
`;

rules = rules.replace("  }\n}\n", additionalRules);

fs.writeFileSync('firestore.rules', rules);
