const fs = require('fs');

let code = fs.readFileSync('src/components/profile/EditProfileModal.tsx', 'utf8');
code = code.replace(
  /import \{\s*updateProfile,\s*uploadProfilePicture,\s*isUsernameAvailable,\s*validateUsernameRules,\s*canChangeUsername\s*\} from '\.\.\/\.\.\/features\/profile\/profileService';/,
  "import { updateProfile } from '../../features/profile/profileService';"
);
fs.writeFileSync('src/components/profile/EditProfileModal.tsx', code);
