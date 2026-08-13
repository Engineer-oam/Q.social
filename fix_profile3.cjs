const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const startIdx = code.indexOf('{/* EDIT PROFILE MODAL */}');
if (startIdx !== -1) {
  code = code.substring(0, startIdx) + "{/* EDIT PROFILE MODAL */}\n      {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}\n    </div>\n  );\n}\n";
  fs.writeFileSync('src/pages/Profile.tsx', code);
}
