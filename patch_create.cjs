const fs = require('fs');
let code = fs.readFileSync('src/pages/Create.tsx', 'utf8');

code = code.replace(
  "import { addDoc, collection } from 'firebase/firestore';",
  ""
);

code = code.replace(
  /await addDoc\(collection\(db, 'lives'\), \{[\s\S]*?userId: user\.uid,[\s\S]*?\}\);/m,
  `await supabase.from('lives').insert({
        userId: user.id,
        status: 'active',
        startedAt: Date.now(),
        title: caption || \`\${profile?.displayName || 'User'}'s Live Video\`
      });`
);

code = code.replace(/import \{.*?db.*?\} from '\.\.\/lib\/firebase';/g, "");

// dynamic imports
code = code.replace(
  /const \{ ref, uploadBytes, getDownloadURL \} = await import\('firebase\/storage'\);[\s\S]*?const \{ storage \} = await import\('\.\.\/lib\/firebase'\);/m,
  `// using supabase storage in postService`
);

fs.writeFileSync('src/pages/Create.tsx', code);
