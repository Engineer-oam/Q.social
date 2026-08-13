const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const regex = /const handleSaveProfile[\s\S]*?finally \{\s*setIsSaving\(false\);\s*\}\s*\};/;
code = code.replace(regex, "");

fs.writeFileSync('src/pages/Profile.tsx', code);
