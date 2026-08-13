const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

code = code.replace(/CheckShield/g, 'ShieldCheck');

fs.writeFileSync('src/pages/Settings.tsx', code);
