const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace(
  /\} catch \(err: any\) \{\s*console\.error\(err\);\s*setError\(err\.message \|\| 'Google Sign-In failed\.'\);\s*\}/,
  `} catch (err: any) {
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
    }`
);

fs.writeFileSync('src/pages/Login.tsx', code);
