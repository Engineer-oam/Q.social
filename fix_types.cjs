const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

// Undo the sed change
code = code.replace(/  createdAt: number;\n  mediaUrl\?: string;\n  readBy\?: string\[\];/g, '  createdAt: number;');
// Add it back only to Message
code = code.replace(/export interface Message {[\s\S]*?}/, (match) => {
  return match.replace('  createdAt: number;', '  createdAt: number;\n  mediaUrl?: string;\n  readBy?: string[];');
});

fs.writeFileSync('src/types/index.ts', code);
