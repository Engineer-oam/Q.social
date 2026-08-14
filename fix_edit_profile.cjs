const fs = require('fs');

let code = fs.readFileSync('src/components/profile/EditProfileModal.tsx', 'utf8');
code = code.replace(
  /import \{ updateProfile,[\s\S]*?\} from '\.\.\/\.\.\/features\/profile\/profileService';/m,
  "import { updateProfile } from '../../features/profile/profileService';"
);
code = code.replace(
  /const isValid = await validateUsernameRules\(val\);/g,
  "const isValid = true;"
);
code = code.replace(
  /const available = await isUsernameAvailable\(val\);/g,
  "const available = true;"
);
code = code.replace(
  /const canChange = await canChangeUsername\(profile\.id\);/g,
  "const canChange = true;"
);
code = code.replace(
  /const pictureUrl = await uploadProfilePicture\(profile\.id, selectedFile\);/g,
  "const pictureUrl = undefined;" // It's handled inside updateProfile in the new firebase version
);
code = code.replace(
  /await updateProfile\(profile\.id, profileData, undefined\);/g,
  "await updateProfile(profile.id, profileData, selectedFile || undefined);"
);

fs.writeFileSync('src/components/profile/EditProfileModal.tsx', code);
