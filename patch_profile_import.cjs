const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

code = code.replace(
  "  Menu, ChevronDown, AtSign, Grid, Clapperboard, ",
  "  Menu, ChevronDown, Grid, Clapperboard, "
);

fs.writeFileSync('src/pages/Profile.tsx', code);
