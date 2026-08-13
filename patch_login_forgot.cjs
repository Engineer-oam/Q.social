const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// 1. Add sendPasswordResetEmail to imports
code = code.replace(
  "import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';",
  "import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';"
);

// 2. Add state for forgot password
code = code.replace(
  "const [error, setError] = useState('');",
  "const [error, setError] = useState('');\n  const [isResetting, setIsResetting] = useState(false);\n  const [resetMessage, setResetMessage] = useState('');"
);

// 3. Add handleResetPassword function
const handleResetFn = `
  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }
    setLoading(true);
    setError('');
    setResetMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };
`;
code = code.replace("const handleLogin = async (e: React.FormEvent) => {", handleResetFn + "\n  const handleLogin = async (e: React.FormEvent) => {");

// 4. Update the Password UI to include "Forgot password?" link
const passInputHTML = `          <div className="space-y-1">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-medium text-q-text-muted">Password</label>
              <button 
                type="button" 
                onClick={handleResetPassword}
                className="text-xs text-q-primary hover:text-q-primary-hover font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-q-panel border border-q-surface-border rounded-xl text-white focus:outline-none focus:border-q-primary/50 transition-colors"
              placeholder="••••••••"
            />
          </div>`;
          
code = code.replace(
  /<div className="space-y-1">\s*<label className="text-sm font-medium text-q-text-muted ml-1">Password<\/label>\s*<input[\s\S]*?placeholder="••••••••"\s*\/>\s*<\/div>/m,
  passInputHTML
);

// 5. Add success message UI
code = code.replace(
  "{error && (",
  `{resetMessage && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
              {resetMessage}
            </div>
          )}
          {error && (`
);

fs.writeFileSync('src/pages/Login.tsx', code);
