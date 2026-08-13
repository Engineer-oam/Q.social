const fs = require('fs');
let code = fs.readFileSync('src/pages/Messages.tsx', 'utf8');

// Add state for map
code = code.replace(
  `  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);`,
  `  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);`
);

// Map visual click handler
code = code.replace(
  `<div className="flex flex-col items-center space-y-1 cursor-pointer group flex-shrink-0">`,
  `<div className="flex flex-col items-center space-y-1 cursor-pointer group flex-shrink-0" onClick={() => setShowMap(true)}>`
);

// Add Map modal UI
const mapModalUI = `
      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowMap(false)}>
          <div className="bg-q-surface border border-q-surface-border rounded-3xl w-full max-w-sm p-6 space-y-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-q-panel rounded-full flex items-center justify-center mx-auto mb-2 border border-q-surface-border">
              <Map className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Enable Location</h2>
            <p className="text-sm text-q-text-muted">
              Allow Q to access your location to see friends on the map.
            </p>
            <div className="flex items-center justify-between mt-4 space-x-2 pt-2">
              <button type="button" onClick={() => setShowMap(false)} className="px-4 py-3 rounded-xl bg-q-panel text-white font-medium hover:bg-q-surface-border transition-colors flex-1">
                Not now
              </button>
              <button type="button" onClick={() => setShowMap(false)} className="px-4 py-3 rounded-xl bg-q-primary text-black font-medium hover:opacity-90 transition-opacity flex-1">
                Allow
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  `{/* Note Editing Modal */}`,
  `${mapModalUI}\n      {/* Note Editing Modal */}`
);

fs.writeFileSync('src/pages/Messages.tsx', code);
