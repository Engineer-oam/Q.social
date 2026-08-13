const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Add import
if (!code.includes('EditProfileModal')) {
  code = code.replace(
    "import { useNavigate, useParams } from 'react-router-dom';",
    "import { useNavigate, useParams } from 'react-router-dom';\nimport EditProfileModal from '../components/profile/EditProfileModal';"
  );
}

// Remove old state
code = code.replace(/const \[editForm, setEditForm\] = useState\(\{[\s\S]*?\}\);/g, "");

// Remove old handleEditClick contents and set isEditing to true
code = code.replace(
  /const handleEditClick = \(\) => \{[\s\S]*?setIsEditing\(true\);\n  \};/g,
  "const handleEditClick = () => setIsEditing(true);"
);

// Remove handleSaveProfile
code = code.replace(/const handleSaveProfile = async \(\) => \{[\s\S]*?setIsSaving\(false\);\n    \}\n  \};/g, "");

// Replace the JSX for EDIT PROFILE MODAL
const targetModalRegex = /\{\/\* EDIT PROFILE MODAL \*\/\}[\s\S]*?\{\/\* END EDIT PROFILE MODAL \*\/\}|\{\/\* EDIT PROFILE MODAL \*\/\}[\s\S]*?\)\}/;
code = code.replace(targetModalRegex, "{/* EDIT PROFILE MODAL */}\n      {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}\n      {/* END EDIT PROFILE MODAL */}");

fs.writeFileSync('src/pages/Profile.tsx', code);
