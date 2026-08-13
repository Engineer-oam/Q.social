const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// 1. Import deleteUser
code = code.replace(
  "import { deleteDoc, doc } from 'firebase/firestore';",
  "import { deleteDoc, doc } from 'firebase/firestore';\nimport { deleteUser } from 'firebase/auth';"
);

// 2. Add state for the delete modal
code = code.replace(
  "const [showEditProfile, setShowEditProfile] = useState(false);",
  "const [showEditProfile, setShowEditProfile] = useState(false);\n  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);"
);

// 3. Update handleAction
code = code.replace(
  /} else if \(action === 'delete_account'\) \{[\s\S]*?\} else \{/,
  `} else if (action === 'delete_account') {
      setShowDeleteConfirm(true);
    } else {`
);

// 4. Add the delete function and modal JSX
const deleteModalJSX = `
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-q-panel border border-q-surface-border rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
            <p className="text-q-text-muted text-sm mb-6">
              This action is permanent and cannot be undone. All your posts, comments, likes, and followers will be permanently deleted.
            </p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={async () => {
                  try {
                    if (user) {
                      await deleteDoc(doc(db, 'profiles', user.uid));
                      await deleteUser(user);
                    }
                  } catch (e: any) {
                    // Re-auth is often required for deleteUser
                    if (e.code === 'auth/requires-recent-login') {
                      alert('You must log in again before deleting your account.');
                      await signOut();
                    } else {
                      alert('Failed to delete account.');
                    }
                  }
                }} 
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                Delete my account
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="w-full py-3 bg-q-surface hover:bg-q-surface-border text-white font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
`;

const insertIndex = code.indexOf('{showEditProfile &&');
if (insertIndex !== -1) {
  code = code.slice(0, insertIndex) + deleteModalJSX + code.slice(insertIndex);
}

fs.writeFileSync('src/pages/Settings.tsx', code);
