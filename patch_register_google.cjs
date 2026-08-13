const fs = require('fs');
let code = fs.readFileSync('src/pages/Register.tsx', 'utf8');

// Add imports
code = code.replace(
  "import { createUserWithEmailAndPassword } from 'firebase/auth';",
  "import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';"
);

code = code.replace(
  "import { doc, setDoc } from 'firebase/firestore';",
  "import { doc, getDoc, setDoc } from 'firebase/firestore';"
);

// Add state for google loading
code = code.replace(
  "const [loading, setLoading] = useState(false);",
  "const [loading, setLoading] = useState(false);\n  const [googleLoading, setGoogleLoading] = useState(false);"
);

// Add handleGoogleSignIn
const googleSignInFn = `
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      const profileRef = doc(db, 'profiles', result.user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          email: result.user.email,
          username: result.user.email?.split('@')[0].replace(/[^a-z0-9_]/g, '') || \`user_\${result.user.uid.slice(0,5)}\`,
          displayName: result.user.displayName || 'Anonymous User',
          photoURL: result.user.photoURL || null,
          bio: null,
          country: null,
          createdAt: Date.now(),
          followersCount: 0,
          followingCount: 0,
          isOnboarded: false
        });
      }
      
      await refreshProfile(result.user);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Google Sign-In failed.';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Google Sign-In is not enabled. Please enable Google provider in Firebase Console under Authentication > Sign-in method.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Popup blocked by browser. Please allow popups for this site.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in cancelled by user.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not authorized for Google Sign-In. Please add it to Firebase Console > Authentication > Settings > Authorized domains.';
      }
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };
`;

code = code.replace("const handleRegister = async (e: React.FormEvent) => {", googleSignInFn + "\n  const handleRegister = async (e: React.FormEvent) => {");

// Add Google button UI
const googleBtnHtml = `          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center space-x-2 border border-q-surface-border mb-4"
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
          
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-q-surface-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-q-panel text-q-text-muted">Or register with email</span>
            </div>
          </div>`;

code = code.replace(
  /\{error && \([\s\S]*?<\/div>\s*\)\}/,
  (match) => match + "\n\n" + googleBtnHtml
);

fs.writeFileSync('src/pages/Register.tsx', code);
