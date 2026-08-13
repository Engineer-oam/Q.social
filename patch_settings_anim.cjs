const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

code = code.replace(
  '<div className="fixed inset-0 z-50 bg-black flex flex-col pt-safe-top overflow-hidden">',
  '<div className="fixed inset-0 z-50 bg-black flex flex-col pt-safe-top overflow-hidden animate-in slide-in-from-right-full duration-300">'
);

fs.writeFileSync('src/pages/Settings.tsx', code);
