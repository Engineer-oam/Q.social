const fs = require('fs');
let code = fs.readFileSync('src/pages/Messages.tsx', 'utf8');

// Add states
code = code.replace(
  `  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);`,
  `  const [myNote, setMyNote] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);`
);

// Add useEffect and handler
code = code.replace(
  `  // Subscribe to Inbox`,
  `  // Notes
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (document) => {
      if (document.exists()) {
        const data = document.data();
        setMyNote(data.statusNote || null);
      }
    });
    return () => unsub();
  }, [user]);

  const handleSaveNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    await updateDoc(doc(db, 'profiles', user.uid), {
      statusNote: noteInput.trim() || null
    });
    setIsEditingNote(false);
  };

  const handleDeleteNote = async () => {
    if (!user) return;
    await updateDoc(doc(db, 'profiles', user.uid), {
      statusNote: null
    });
    setIsEditingNote(false);
  };

  // Subscribe to Inbox`
);

// Edit Your Note visual
const oldNoteDiv = `{/* Your Note */}
              <div className="flex flex-col items-center space-y-1 relative cursor-pointer group flex-shrink-0">`;
const newNoteDiv = `{/* Your Note */}
              <div className="flex flex-col items-center space-y-1 relative cursor-pointer group flex-shrink-0" onClick={() => { setNoteInput(myNote || ''); setIsEditingNote(true); }}>`;
code = code.replace(oldNoteDiv, newNoteDiv);

const oldNoteLabel = `Make this space yours...`;
const newNoteLabel = `{myNote || 'Make this space yours...'}`;
code = code.replace(oldNoteLabel, newNoteLabel);

// Add modal for note editing
const modalUI = `
      {/* Note Editing Modal */}
      {isEditingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditingNote(false)}>
          <div className="bg-q-surface border border-q-surface-border rounded-3xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white text-center">Your note</h2>
            <form onSubmit={handleSaveNote}>
              <input
                autoFocus
                type="text"
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Make this space yours..."
                maxLength={60}
                className="w-full bg-black border border-q-surface-border text-white text-center py-3 px-4 rounded-xl outline-none focus:border-q-primary transition-all"
              />
              <div className="flex items-center justify-between mt-4 space-x-2">
                <button type="button" onClick={handleDeleteNote} className="px-4 py-2 rounded-xl text-red-500 font-medium hover:bg-q-panel transition-colors flex-1">
                  Delete
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-q-primary text-black font-medium hover:opacity-90 transition-opacity flex-1">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

code = code.replace(
  `{/* -------------------- INBOX VIEW -------------------- */}`,
  `${modalUI}
      {/* -------------------- INBOX VIEW -------------------- */}`
);

fs.writeFileSync('src/pages/Messages.tsx', code);
