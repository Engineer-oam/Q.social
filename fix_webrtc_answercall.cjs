const fs = require('fs');
let code = fs.readFileSync('src/features/messages/webrtcService.ts', 'utf8');

code = code.replace(
  "    // Listen for call end\n    onSnapshot(this.callDocRef, (snapshot) => {",
  "    // Listen for call end\n    this.unsubCall = onSnapshot(this.callDocRef, (snapshot) => {"
);

fs.writeFileSync('src/features/messages/webrtcService.ts', code);
