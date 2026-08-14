const fs = require('fs');

let registerCode = fs.readFileSync('src/pages/Register.tsx', 'utf8');

registerCode = registerCode.replace(
  /const \{ error \} = await supabase\.auth\.signInWithOAuth\(\{[\s\S]*?\}\);[\s\S]*?if \(error\) throw error;/m,
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

registerCode = registerCode.replace(
  /const \{ data: authData, error: authError \} = await supabase\.auth\.signUp\(\{[\s\S]*?\}\);[\s\S]*?if \(authError\) throw authError;[\s\S]*?if \(authData\.user\) \{[\s\S]*?const \{ error: profileError \} = await supabase[\s\S]*?\}\);[\s\S]*?if \(profileError\) throw profileError;[\s\S]*?\}[\s\S]*?await refreshProfile\(authData\.user\);/m,
  `const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, 'profiles', user.uid), {
        email: user.email,
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        displayName: name,
        photoURL: null,
        bio: null,
        country: null,
        createdAt: Date.now(),
        followersCount: 0,
        followingCount: 0,
        isOnboarded: false
      });
      await refreshProfile();`
);

fs.writeFileSync('src/pages/Register.tsx', registerCode);
