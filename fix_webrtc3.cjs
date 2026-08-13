const fs = require('fs');
let code = fs.readFileSync('src/features/messages/webrtcService.ts', 'utf8');

code = code.replace(/this\.unsubCall = onSnapshot/g, 'this.unsubs.push(onSnapshot');
code = code.replace(/this\.unsubAns = onSnapshot/g, 'this.unsubs.push(onSnapshot');
code = code.replace(/this\.unsubOffer = onSnapshot/g, 'this.unsubs.push(onSnapshot');

// the closing parentheses needed because I wrapped onSnapshot in this.unsubs.push()
// Actually, this regex approach is terrible.
// Let me just replace the lines.
