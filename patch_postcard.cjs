const fs = require('fs');
let code = fs.readFileSync('src/components/PostCard.tsx', 'utf8');

// Add delete icon to lucide-react imports if missing
if (!code.includes('Trash2')) {
  code = code.replace(
    "EyeOff, ShieldAlert, Ban, Info }",
    "EyeOff, ShieldAlert, Ban, Info, Trash2 }"
  );
}

// Add delete function
const deleteFunc = `
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
`;

if (!code.includes('handleDelete')) {
  const targetIndex = code.indexOf('const checkInteractions');
  code = code.slice(0, targetIndex) + deleteFunc + code.slice(targetIndex);
}

const deleteButton = `
                {profile?.id === post.userId && (
                  <button onClick={handleDelete} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-q-surface text-red-500 text-sm transition-colors text-left border-t border-q-surface-border">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                )}
`;

if (!code.includes('Delete Post')) {
  const insertIndex = code.indexOf('<button onClick={() => setShowMenu(false)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-q-surface text-white text-sm transition-colors text-left border-t border-q-surface-border">');
  code = code.slice(0, insertIndex) + deleteButton + code.slice(insertIndex);
}

fs.writeFileSync('src/components/PostCard.tsx', code);
