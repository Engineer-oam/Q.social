const fs = require('fs');

let loginCode = fs.readFileSync('src/pages/Login.tsx', 'utf8');

if (!loginCode.includes('sendPasswordResetEmail')) {
  loginCode = loginCode.replace(
    /import \{ signInWithEmailAndPassword, signInWithPopup \} from 'firebase\/auth';/,
    "import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';"
  );
}

loginCode = loginCode.replace(
  /const \{ error \} = await supabase\.auth\.resetPasswordForEmail\([\s\S]*?\}\);/m,
  "await sendPasswordResetEmail(auth, email);"
);

fs.writeFileSync('src/pages/Login.tsx', loginCode);
