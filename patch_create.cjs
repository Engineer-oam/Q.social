const fs = require('fs');
let code = fs.readFileSync('src/pages/Create.tsx', 'utf8');

// Modify handlePublish to allow text posts
code = code.replace(
  "if (!user || (!selectedFile && mode !== 'LIVE')) return;",
  "if (!user || (!selectedFile && !caption && mode !== 'LIVE')) return;"
);

// If selectedFile is missing but we have caption for POST mode
const postModeReplacement = `
      if (mode === 'POST') {
        const files = selectedFile ? [selectedFile] : [];
        await createPost(user.uid, caption, files);
        navigate('/home');
      } else if (mode === 'REEL' && selectedFile) {
`;

code = code.replace(
  /if \(mode === 'POST' && selectedFile\) \{\s*await createPost\(user\.uid, caption, \[selectedFile\]\);\s*navigate\('\/home'\);\s*\} else if \(mode === 'REEL' && selectedFile\) \{/,
  postModeReplacement
);

fs.writeFileSync('src/pages/Create.tsx', code);
