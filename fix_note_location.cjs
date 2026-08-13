const fs = require('fs');
let code = fs.readFileSync('src/pages/Messages.tsx', 'utf8');

code = code.replace(
  `<span className="text-xs text-q-text-muted font-medium mt-1">Your note</span>`,
  `<span className="text-xs text-q-text-muted font-medium mt-1">Your note</span>
                <span className="text-[9px] text-q-text-muted">Location off</span>`
);

fs.writeFileSync('src/pages/Messages.tsx', code);
