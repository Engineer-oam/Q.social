const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

code = code.replace(
  '<PlusSquare className="w-7 h-7 stroke-[2px]" />',
  '<Plus className="w-7 h-7 stroke-[2.5px]" />'
);

fs.writeFileSync('src/pages/Home.tsx', code);
