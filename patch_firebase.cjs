const fs = require('fs');
let code = fs.readFileSync('src/lib/firebase.ts', 'utf8');

code = code.replace(
  "import { getFirestore } from 'firebase/firestore';",
  "import { getFirestore, initializeFirestore } from 'firebase/firestore';"
);

code = code.replace(
  'export const db = getFirestore(app, "ai-studio-60e46831-dbc8-48ef-8ed2-30738ddd3d03");',
  'export const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "ai-studio-60e46831-dbc8-48ef-8ed2-30738ddd3d03");'
);

fs.writeFileSync('src/lib/firebase.ts', code);
