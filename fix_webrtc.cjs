const fs = require('fs');
let code = fs.readFileSync('src/features/messages/webrtcService.ts', 'utf8');

code = code.replace(
  "onSnapshot(this.callDocRef, (snapshot) => {",
  "this.unsubCall = onSnapshot(this.callDocRef, (snapshot) => {"
);

code = code.replace(
  "onSnapshot(answerCandidates, snapshot => {",
  "this.unsubAns = onSnapshot(answerCandidates, snapshot => {"
);

code = code.replace(
  "onSnapshot(offerCandidates, snapshot => {",
  "this.unsubOffer = onSnapshot(offerCandidates, snapshot => {"
);

code = code.replace(
  "onSnapshot(this.callDocRef, (snapshot) => {",
  "this.unsubCall2 = onSnapshot(this.callDocRef, (snapshot) => {"
);

fs.writeFileSync('src/features/messages/webrtcService.ts', code);
