const fs = require('fs');

let postCard = fs.readFileSync('src/components/PostCard.tsx', 'utf8');
if (!postCard.includes("import { doc } from 'firebase/firestore';")) {
  postCard = postCard.replace(/import \{ toggleInteraction, hasInteracted \} from '\.\.\/features\/posts\/interactionService';/, "import { toggleInteraction, hasInteracted } from '../features/posts/interactionService';\nimport { doc } from 'firebase/firestore';\nimport { db } from '../lib/firebase';");
}
postCard = postCard.replace(/await toggleInteraction\('likes', post\.id, profile\.id, true\);/g, "const postRef = doc(db, 'posts', post.id);\nawait toggleInteraction('likes', post.id, profile.id, postRef);");
fs.writeFileSync('src/components/PostCard.tsx', postCard);

let reel = fs.readFileSync('src/components/Reel.tsx', 'utf8');
if (!reel.includes("import { doc } from 'firebase/firestore';")) {
  reel = reel.replace(/import \{ toggleInteraction, hasInteracted \} from '\.\.\/features\/posts\/interactionService';/, "import { toggleInteraction, hasInteracted } from '../features/posts/interactionService';\nimport { doc } from 'firebase/firestore';\nimport { db } from '../lib/firebase';");
}
reel = reel.replace(/await toggleInteraction\('likes', post\.id, profile\.id, true\);/g, "const postRef = doc(db, 'posts', post.id);\nawait toggleInteraction('likes', post.id, profile.id, postRef);");
fs.writeFileSync('src/components/Reel.tsx', reel);

let create = fs.readFileSync('src/pages/Create.tsx', 'utf8');
if (!create.includes("addDoc")) {
  create = create.replace(/import \{ createStory \} from '\.\.\/features\/stories\/storyService';/, "import { createStory } from '../features/stories/storyService';\nimport { addDoc, collection } from 'firebase/firestore';\nimport { db } from '../lib/firebase';");
}
create = create.replace(/await supabase\.from\('lives'\)\.insert\(\{[\s\S]*?\}\);/m, `await addDoc(collection(db, 'lives'), {
        userId: user.uid,
        status: 'active',
        startedAt: Date.now(),
        title: caption || \`\${profile?.displayName || 'User'}'s Live Video\`
      });`);
fs.writeFileSync('src/pages/Create.tsx', create);
