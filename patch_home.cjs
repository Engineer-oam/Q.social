const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Update import
code = code.replace(
  "import { Loader2, Plus, Heart, ArrowUp, Send } from 'lucide-react';",
  "import { Loader2, Plus, PlusSquare, Heart, ArrowUp, Send } from 'lucide-react';"
);

const targetHeader = `{/* Home Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl flex flex-col pt-safe-top">
        <div className="flex items-center justify-between px-4 py-3 relative">
          {/* Logo (Left) */}
          <button onClick={handleRefresh} className="text-2xl font-black text-white hover:text-q-primary transition-colors">
            Q
          </button>

          {/* Activity / Notifications (Right) */}
          <button 
            onClick={() => setShowNotifications(true)}
            aria-label="Notifications"
            className="relative p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-q-text-muted hover:text-white transition-colors group focus:outline-none focus:ring-2 focus:ring-q-primary rounded-full"
          >
            <Heart className="w-7 h-7 stroke-[2px] group-hover:scale-105 transition-transform group-active:scale-95" />
            {/* Unread badge */}
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>`;

const newHeader = `{/* Home Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl flex flex-col pt-safe-top">
        <div className="flex items-center justify-between px-4 py-3 relative">
          {/* Create Shortcut (Left) */}
          <Link to="/create" className="p-2 -ml-2 text-q-text-muted hover:text-white transition-colors">
            <PlusSquare className="w-7 h-7 stroke-[2px]" />
          </Link>

          {/* Logo (Center) */}
          <button onClick={handleRefresh} className="absolute left-1/2 -translate-x-1/2 text-2xl font-black text-white hover:text-q-primary transition-colors">
            Q
          </button>

          {/* Activity / Notifications (Right) */}
          <button 
            onClick={() => setShowNotifications(true)}
            aria-label="Notifications"
            className="relative p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-q-text-muted hover:text-white transition-colors group focus:outline-none focus:ring-2 focus:ring-q-primary rounded-full"
          >
            <Heart className="w-7 h-7 stroke-[2px] group-hover:scale-105 transition-transform group-active:scale-95" />
            {/* Unread badge */}
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>`;

code = code.replace(targetHeader, newHeader);
fs.writeFileSync('src/pages/Home.tsx', code);
