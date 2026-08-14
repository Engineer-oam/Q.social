const fs = require('fs');
let code = fs.readFileSync('src/components/Reel.tsx', 'utf8');

code = code.replace(
  "import { doc } from 'firebase/firestore';",
  ""
);

code = code.replace(
  /const postRef = doc\(.*?db, 'posts', post\.id\);\s*await toggleInteraction\('likes', post\.id, profile\.id, postRef\);/m,
  "await toggleInteraction('likes', post.id, profile.id, true);"
);

code = code.replace(
  /const postRef = doc\(.*?supabase, 'posts', post\.id\);\s*await toggleInteraction\('likes', post\.id, profile\.id, postRef\);/m,
  "await toggleInteraction('likes', post.id, profile.id, true);"
);

code = code.replace(
  /const postRef = doc\(.*?\);\s*await toggleInteraction\('likes', post\.id, profile\.id, postRef\);/m,
  "await toggleInteraction('likes', post.id, profile.id, true);"
);

fs.writeFileSync('src/components/Reel.tsx', code);
