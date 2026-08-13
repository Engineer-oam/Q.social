const fs = require('fs');
let code = fs.readFileSync('src/features/stories/storyService.ts', 'utf8');

code = code.replace(
  "where('createdAt', '>', yesterday)",
  "where('expiresAt', '>', Date.now())"
);

fs.writeFileSync('src/features/stories/storyService.ts', code);
