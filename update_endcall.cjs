const fs = require('fs');
let code = fs.readFileSync('src/features/messages/webrtcService.ts', 'utf8');

code = code.replace(
  "  async endCall() {\n    if (this.peerConnection) {",
  "  async endCall() {\n    this.cleanup();\n    if (this.peerConnection) {"
);

fs.writeFileSync('src/features/messages/webrtcService.ts', code);
