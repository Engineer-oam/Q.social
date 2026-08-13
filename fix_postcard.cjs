const fs = require('fs');
let code = fs.readFileSync('src/components/PostCard.tsx', 'utf8');

// Replace the injected handleDelete block
const badBlock = `  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'posts', post.id));
        if (onHide) onHide();
      } catch (err) {
        console.error("Failed to delete post", err);
      }
    }
  };
`;

code = code.replace(badBlock, "");

// Now add it BEFORE the useEffect
const goodBlock = `
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'posts', post.id));
        if (onHide) onHide();
      } catch (err) {
        console.error("Failed to delete post", err);
      }
    }
  };

  useEffect(() => {
`;

code = code.replace("  useEffect(() => {", goodBlock);

fs.writeFileSync('src/components/PostCard.tsx', code);
