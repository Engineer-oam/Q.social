const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

code = code.replace(/\\`/g, '`');

fs.writeFileSync('src/pages/Profile.tsx', code);
