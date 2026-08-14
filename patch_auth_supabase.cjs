const fs = require('fs');

// --- AuthContext.tsx ---
let authContext = fs.readFileSync('src/features/auth/AuthContext.tsx', 'utf8');

authContext = authContext.replace(
  "import { User, onAuthStateChanged, signOut } from 'firebase/auth';",
  "import { User } from '@supabase/supabase-js';"
);
authContext = authContext.replace(
  "import { doc, getDoc, setDoc } from 'firebase/firestore';",
  ""
);
authContext = authContext.replace(
  "import { auth, db } from '../../lib/firebase';",
  "import { supabase } from '../../lib/supabase';"
);

authContext = authContext.replace(
  /const refreshProfile = async \(currentUser = user\) => \{[\s\S]*?\};/m,
  `const refreshProfile = async (currentUser = user) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setProfile(data as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };`
);

authContext = authContext.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/m,
  `useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        await refreshProfile(session.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      await refreshProfile(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);`
);

authContext = authContext.replace(
  /const handleSignOut = async \(\) => \{[\s\S]*?setUser\(null\);\s*setProfile\(null\);\s*\};/m,
  `const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };`
);

// Fix `.uid` to `.id` in currentUser references just in case (Firebase is uid, Supabase is id)
// Wait, the new refreshProfile uses currentUser.id, let's verify if I missed any.
// Ah, the argument currentUser was used in refreshProfile. The old AuthContext.tsx had:
// const docRef = doc(db, 'profiles', currentUser.uid);

fs.writeFileSync('src/features/auth/AuthContext.tsx', authContext);

// --- Login.tsx ---
let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');

login = login.replace(
  "import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';",
  ""
);
login = login.replace(
  "import { doc, getDoc, setDoc } from 'firebase/firestore';",
  ""
);
login = login.replace(
  "import { auth, db } from '../lib/firebase';",
  "import { supabase } from '../lib/supabase';"
);

login = login.replace(
  /const handleGoogleSignIn = async \(\) => \{[\s\S]*?\}\s*catch[\s\S]*?finally[\s\S]*?\}\s*\};\s*/m,
  `const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };
`
);

login = login.replace(
  /const handleResetPassword = async \(\) => \{[\s\S]*?\}\s*catch[\s\S]*?finally[\s\S]*?\}\s*\};\s*/m,
  `const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setLoading(true);
    setError('');
    setResetMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: \`\${window.location.origin}/reset-password\`,
      });
      if (error) throw error;
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };
`
);

login = login.replace(
  /const handleLogin = async \(e: React\.FormEvent\) => \{[\s\S]*?\}\s*catch[\s\S]*?finally[\s\S]*?\}\s*\};\s*/m,
  `const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
        
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };
`
);

fs.writeFileSync('src/pages/Login.tsx', login);


// --- Register.tsx ---
let register = fs.readFileSync('src/pages/Register.tsx', 'utf8');

register = register.replace(
  "import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';",
  ""
);
register = register.replace(
  "import { doc, getDoc, setDoc } from 'firebase/firestore';",
  ""
);
register = register.replace(
  "import { auth, db } from '../lib/firebase';",
  "import { supabase } from '../lib/supabase';"
);

register = register.replace(
  /const handleGoogleSignIn = async \(\) => \{[\s\S]*?\}\s*catch[\s\S]*?finally[\s\S]*?\}\s*\};\s*/m,
  `const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };
`
);

register = register.replace(
  /const handleRegister = async \(e: React\.FormEvent\) => \{[\s\S]*?\}\s*catch[\s\S]*?finally[\s\S]*?\}\s*\};\s*/m,
  `const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Initialize profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
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
          
        if (profileError) throw profileError;
      }

      await refreshProfile(authData.user);
      navigate('/onboarding');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };
`
);

fs.writeFileSync('src/pages/Register.tsx', register);
