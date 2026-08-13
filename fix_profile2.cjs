const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const regex = /\{\/\* EDIT PROFILE MODAL \*\/\}[\s\S]*?\}\);[\s]*\}/;
code = code.replace(regex, "{/* EDIT PROFILE MODAL */}\n      {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}\n    </div>\n  );\n}");

fs.writeFileSync('src/pages/Profile.tsx', code);
