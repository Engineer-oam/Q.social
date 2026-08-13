const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

// Replace the Menu button onClick to navigate to /settings
code = code.replace(
  '<button onClick={signOut} className="p-2 text-white hover:text-red-500 transition-colors">',
  '<button onClick={() => navigate(\'/settings\')} className="p-2 text-white hover:text-q-text-muted transition-colors">'
);

fs.writeFileSync('src/pages/Profile.tsx', code);
