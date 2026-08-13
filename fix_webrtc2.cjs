const fs = require('fs');
let code = fs.readFileSync('src/features/messages/webrtcService.ts', 'utf8');

code = code.replace(/this\.unsubCall = this\.unsubs\.push/g, 'this.unsubs.push');
code = code.replace(/this\.unsubAns = this\.unsubs\.push/g, 'this.unsubs.push');
code = code.replace(/this\.unsubOffer = this\.unsubs\.push/g, 'this.unsubs.push');
code = code.replace(/this\.unsubCall = onSnapshot/g, 'this.unsubs.push(onSnapshot');
code = code.replace(/this\.unsubAns = onSnapshot/g, 'this.unsubs.push(onSnapshot');
code = code.replace(/this\.unsubOffer = onSnapshot/g, 'this.unsubs.push(onSnapshot');

// Make sure the end parentheses are matched. Wait, I replaced `onSnapshot(` with `this.unsubs.push(onSnapshot(`.
// For `this.unsubs.push(onSnapshot(this.callDocRef, (snapshot) => {`, there is a closing `});` at the end of the callback which needs an extra `)` for `push()`.
// This is too fragile to regex. Let's just checkout the file and modify it correctly.
