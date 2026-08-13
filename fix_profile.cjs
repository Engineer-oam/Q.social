const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const startIdx = code.indexOf('{/* EDIT PROFILE MODAL */}');
const endIdx = code.indexOf(')}', startIdx) + 2; // Find the closing )}

if (startIdx !== -1 && endIdx !== -1) {
  code = code.slice(0, startIdx) + 
         "{/* EDIT PROFILE MODAL */}\n      {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}" + 
         code.slice(endIdx);
}

fs.writeFileSync('src/pages/Profile.tsx', code);
