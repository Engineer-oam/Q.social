const fs = require('fs');
let code = fs.readFileSync('src/pages/Messages.tsx', 'utf8');

const longPressCode = `
  const [contextMenuRoomId, setContextMenuRoomId] = useState<string | null>(null);
  const handleContextMenu = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    setContextMenuRoomId(roomId);
  };
`;

if (!code.includes('handleContextMenu')) {
  code = code.replace(
    `const messagesEndRef = useRef<HTMLDivElement>(null);`,
    `const messagesEndRef = useRef<HTMLDivElement>(null);\n${longPressCode}`
  );
  
  // Add context menu UI
  const contextMenuUI = `
                      {contextMenuRoomId === room.id && (
                        <div className="absolute top-12 right-4 z-50 w-48 bg-q-panel border border-q-surface-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                           <div className="flex flex-col text-sm text-white">
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Mark as unread</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Mute</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Archive</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors text-red-500" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Delete</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors text-red-500" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Report</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors text-red-500" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Block</button>
                           </div>
                        </div>
                      )}
                      
                      {/* Click outside to close */}
                      {contextMenuRoomId === room.id && (
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }} />
                      )}
  `;

  code = code.replace(
    `className="flex items-center space-x-3 px-4 py-4 hover:bg-q-surface cursor-pointer transition-colors active:bg-q-panel"`,
    `className="relative flex items-center space-x-3 px-4 py-4 hover:bg-q-surface cursor-pointer transition-colors active:bg-q-panel"
                      onContextMenu={(e) => handleContextMenu(e, room.id)}`
  );
  
  code = code.replace(
    `<div className="flex-1 min-w-0 flex flex-col justify-center">`,
    `${contextMenuUI}\n<div className="flex-1 min-w-0 flex flex-col justify-center">`
  );

  fs.writeFileSync('src/pages/Messages.tsx', code);
}
