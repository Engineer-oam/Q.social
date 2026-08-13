const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

code = code.replace(
  `  country: string | null;`,
  `  country: string | null;\n  website?: string | null;\n  statusNote?: string | null;`
);

fs.writeFileSync('src/types/index.ts', code);
