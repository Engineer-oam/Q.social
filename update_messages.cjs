const fs = require('fs');
let code = fs.readFileSync('src/pages/Messages.tsx', 'utf8');

// 1. Update imports to include new icons
code = code.replace(
  `import { Search, Edit, ChevronLeft, MoreVertical, Image as ImageIcon, Mic, Send, Loader2 } from 'lucide-react';`,
  `import { Search, Edit, ChevronLeft, MoreVertical, Image as ImageIcon, Mic, Send, Loader2, Menu, ChevronDown, Activity, Map, Plus } from 'lucide-react';`
);

// 2. Add profile to useAuth destructured assignment
code = code.replace(
  `const { user } = useAuth();`,
  `const { user, profile } = useAuth();`
);

// 3. Update activeFilter default to 'All'
// Actually it's already 'All', but let's change the filter options later.

// 4. Update the Header UI
const oldHeader = `{/* Header */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-q-surface-border sticky top-0 bg-black/90 backdrop-blur-xl z-20 pt-safe-top">
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <button 
            onClick={() => {
              setIsSearchingUsers(true);
              setSearchQuery('');
            }}
            className="p-2 -mr-2 text-white hover:text-q-primary transition-colors"
          >
            <Edit className="w-6 h-6 stroke-[2px]" />
          </button>
        </div>`;

const newHeader = `{/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-q-surface-border sticky top-0 bg-black/90 backdrop-blur-xl z-20 pt-safe-top">
          <button className="text-white hover:text-q-primary -ml-2 p-2 transition-colors">
             <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-1 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="font-bold text-lg text-white">{profile?.username || 'Messages'}</span>
            <ChevronDown className="w-4 h-4 text-white" />
            <span className="w-2 h-2 bg-red-500 rounded-full ml-1" />
          </div>

          <div className="flex items-center space-x-2 -mr-2">
            <button className="p-2 text-white hover:text-q-primary transition-colors">
              <Activity className="w-6 h-6" />
            </button>
            <button 
              onClick={() => {
                setIsSearchingUsers(true);
                setSearchQuery('');
              }}
              className="p-2 text-white hover:text-q-primary transition-colors"
            >
              <Edit className="w-6 h-6" />
            </button>
          </div>
        </div>`;

code = code.replace(oldHeader, newHeader);

// 5. Update Search UI
const oldSearch = `placeholder={isSearchingUsers ? "Search people on Q" : "Search messages"}`;
const newSearch = `placeholder={isSearchingUsers ? "Search people on Q" : "Search or ask Q AI"}`;
code = code.replace(oldSearch, newSearch);

// 6. Update Filters & Add Quick Access
const oldFilters = `{/* Filters */}
            <div className="px-4 py-3 flex items-center space-x-2 overflow-x-auto hide-scrollbar border-b border-q-surface-border">
              {['All', 'Unread', 'Requests', 'Groups'].map(filter => (`;

const newFilters = `{/* Quick Access */}
            <div className="px-4 py-4 flex space-x-6 overflow-x-auto hide-scrollbar border-b border-q-surface-border">
              {/* Your Note */}
              <div className="flex flex-col items-center space-y-1 relative cursor-pointer group flex-shrink-0">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-q-surface-border group-hover:border-q-primary transition-colors">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-q-panel flex items-center justify-center font-bold text-q-primary text-2xl">
                        {profile?.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-3 -right-8 bg-q-surface border border-q-surface-border rounded-2xl px-3 py-1.5 text-[11px] text-q-text-muted whitespace-nowrap shadow-xl font-medium z-10">
                    Make this space yours...
                  </div>
                  <div className="absolute -bottom-1 right-0 w-6 h-6 bg-q-surface rounded-full flex items-center justify-center border-2 border-black">
                    <Plus className="w-3.5 h-3.5 text-q-text-muted" />
                  </div>
                </div>
                <span className="text-xs text-q-text-muted font-medium mt-1">Your note</span>
              </div>

              {/* Map */}
              <div className="flex flex-col items-center space-y-1 cursor-pointer group flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-q-surface border border-q-surface-border flex items-center justify-center overflow-hidden group-hover:border-q-primary transition-colors relative">
                   {/* Map preview visual mock */}
                   <Map className="w-7 h-7 text-white z-10" />
                   <div className="absolute inset-0 bg-blue-500/10" />
                </div>
                <span className="text-xs text-q-text-muted font-medium mt-1">Map</span>
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 flex items-center space-x-2 overflow-x-auto hide-scrollbar border-b border-q-surface-border">
              {['All', 'Primary', 'Requests', 'General'].map(filter => (`;

code = code.replace(oldFilters, newFilters);

// 7. Update Filter logic
const oldFilterLogic = `const filteredRooms = rooms.filter(room => {
    if (activeFilter === 'Unread') return room.unreadCount?.[user?.uid || ''] > 0;
    if (activeFilter === 'Requests') return false; // Mocking empty for now
    if (activeFilter === 'Groups') return room.participants.length > 2;
    // For "All", apply local search on display name
    if (searchQuery && !isSearchingUsers) {`;
    
const newFilterLogic = `const filteredRooms = rooms.filter(room => {
    if (activeFilter === 'Primary') return true; // Primary is all main chats in this simple mock
    if (activeFilter === 'Requests') return false; // Mocking empty for now
    if (activeFilter === 'General') return false; // Mocking empty for now
    // For "All", apply local search on display name
    if (searchQuery && !isSearchingUsers) {`;

code = code.replace(oldFilterLogic, newFilterLogic);

// 8. Empty state text
code = code.replace(
  `<h3 className="text-xl font-bold text-white mb-2">No messages yet.</h3>
                  <p className="text-q-text-muted mb-6">Start a conversation with someone on Q.</p>`,
  `<h3 className="text-xl font-bold text-white mb-2">Your inbox is quiet.</h3>
                  <p className="text-q-text-muted mb-6">Start a conversation with someone on Q.</p>`
);
code = code.replace(
  `Start a conversation
                  </button>`,
  `Find people
                  </button>`
);

fs.writeFileSync('src/pages/Messages.tsx', code);
