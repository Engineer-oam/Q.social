const fs = require('fs');
let code = fs.readFileSync('src/features/messages/webrtcService.ts', 'utf8');

code = code.replace(/this\.unsubs\.push\(onSnapshot\(/g, 'onSnapshot(');
code = code.replace(/this\.unsubs\.push\(onSnapshot\(/g, 'onSnapshot(');

fs.writeFileSync('src/features/messages/webrtcService.ts', code);
