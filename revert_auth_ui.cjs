const fs = require('fs');

let loginCode = fs.readFileSync('src/pages/Login.tsx', 'utf8');
loginCode = loginCode.replace(/import \{ supabase \} from '\.\.\/lib\/supabase';/, "import { auth, googleProvider } from '../lib/firebase';\nimport { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';");
loginCode = loginCode.replace(
  /const \{ error \} = await supabase\.auth\.signInWithPassword\(\{[\s\S]*?\}\);/m,
  "await signInWithEmailAndPassword(auth, email, password);"
);
loginCode = loginCode.replace(
  /const \{ error \} = await supabase\.auth\.signInWithOAuth\(\{[\s\S]*?\}\);/m,
  "await signInWithPopup(auth, googleProvider);"
);
fs.writeFileSync('src/pages/Login.tsx', loginCode);

let registerCode = fs.readFileSync('src/pages/Register.tsx', 'utf8');
registerCode = registerCode.replace(/import \{ supabase \} from '\.\.\/lib\/supabase';/, "import { auth, db, googleProvider } from '../lib/firebase';\nimport { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';\nimport { doc, setDoc, getDoc } from 'firebase/firestore';");
registerCode = registerCode.replace(
  /const \{ data, error \} = await supabase\.auth\.signUp\(\{[\s\S]*?\}\);[\s\S]*?if \(error\) throw error;/m,
  `const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'profiles', user.uid), {
        email: user.email,
        username,
        displayName: username,
        createdAt: Date.now(),
        followersCount: 0,
        followingCount: 0,
        isOnboarded: false
      });`
);
registerCode = registerCode.replace(
  /const \{ data, error \} = await supabase\.auth\.signInWithOAuth\(\{[\s\S]*?\}\);[\s\S]*?if \(error\) throw error;/m,
  `const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'profiles', user.uid), {
          email: user.email,
          username: user.email?.split('@')[0] || 'user_' + Math.floor(Math.random() * 10000),
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: Date.now(),
          followersCount: 0,
          followingCount: 0,
          isOnboarded: false
        });
      }`
);
fs.writeFileSync('src/pages/Register.tsx', registerCode);
