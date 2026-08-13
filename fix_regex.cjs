const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

code = code.replace(/replace\(\/\^https\?:\\\\\/\\\\\/\/i, ''\)/g, "replace(/^https?:\\/\\//i, '')");

fs.writeFileSync('src/pages/Profile.tsx', code);
