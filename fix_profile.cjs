const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

code = code.replace(
  "\\`avatars/\\${user.uid}_\\${Date.now()}\\`",
  "\`avatars/\\${user.uid}_\\${Date.now()}\`"
);

code = code.replace(
  "\\`https://\\${window.location.host}/user/\\${realProfile.username}\\`",
  "\`https://\\${window.location.host}/user/\\${realProfile.username}\`"
);

code = code.replace(
  "navigate(\\`/post/\\${post.id}\\`)",
  "navigate(\`/post/\\${post.id}\`)"
);

fs.writeFileSync('src/pages/Profile.tsx', code);
