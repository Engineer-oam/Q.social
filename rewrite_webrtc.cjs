const fs = require('fs');
let code = fs.readFileSync('src/features/messages/webrtcService.ts', 'utf8');

code = code.replace(/this\.unsubs\.push\(onSnapshot\(/g, 'onSnapshot(');
// also remove the push definition
code = code.replace('export class WebRTCService {\\n  public unsubs: (() => void)[] = [];\\n  public cleanup() { this.unsubs.forEach(u => u()); this.unsubs = []; }', 'export class WebRTCService {');

fs.writeFileSync('src/features/messages/webrtcService.ts', code);
