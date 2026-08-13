const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

// 1. Desktop Nav: Change MessageSquare to Send for Messages
code = code.replace(
  `<NavLink to="/messages" icon={MessageSquare} label="Messages" badge={unreadCount} />`,
  `<NavLink to="/messages" icon={Send} label="Messages" badge={unreadCount} />`
);

// 2. Mobile Header: Remove duplicate Messages icon from header so it's only in bottom nav
code = code.replace(
  `<div className="flex items-center space-x-4">
              <Link to="/messages" className="text-q-text-muted hover:text-white transition-colors relative">
                <MessageSquare className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-q-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/settings" className="text-q-text-muted hover:text-white transition-colors">
                <Settings className="w-6 h-6" />
              </Link>
            </div>`,
  `<div className="flex items-center space-x-4">
              <Link to="/settings" className="text-q-text-muted hover:text-white transition-colors">
                <Settings className="w-6 h-6" />
              </Link>
            </div>`
);

// 3. Mobile Bottom Nav: Completely rewrite to strictly contain exactly 5 items
const bottomNavRegex = /<nav className="md:hidden flex items-center justify-around px-2 py-3 border-t border-q-surface-border glass z-20 absolute bottom-0 w-full pb-safe">[\s\S]*?<\/nav>/;
const newBottomNav = `<nav className="md:hidden flex items-center justify-around px-2 py-3 border-t border-q-surface-border glass z-20 absolute bottom-0 w-full pb-safe">
          {/* Home */}
          <Link to="/home" className={cn("p-2 transition-all", location.pathname.startsWith("/home") ? "text-q-primary" : "text-q-text-muted hover:text-white")}>
            <Home className={cn("w-7 h-7 transition-transform active:scale-95", location.pathname.startsWith("/home") ? "stroke-[2.5px]" : "stroke-[2px]")} />
          </Link>
          
          {/* Reels */}
          <Link to="/reels" className={cn("p-2 transition-all", location.pathname.startsWith("/reels") ? "text-q-primary" : "text-q-text-muted hover:text-white")}>
            <Clapperboard className={cn("w-7 h-7 transition-transform active:scale-95", location.pathname.startsWith("/reels") ? "stroke-[2.5px]" : "stroke-[2px]")} />
          </Link>

          {/* Messages */}
          <Link to="/messages" className={cn("p-2 transition-all relative", location.pathname.startsWith("/messages") ? "text-q-primary" : "text-q-text-muted hover:text-white")}>
            <Send className={cn("w-7 h-7 transition-transform active:scale-95", location.pathname.startsWith("/messages") ? "stroke-[2.5px]" : "stroke-[2px]")} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black" />
            )}
          </Link>

          {/* Search */}
          <Link to="/search" className={cn("p-2 transition-all", location.pathname.startsWith("/search") ? "text-q-primary" : "text-q-text-muted hover:text-white")}>
            <Search className={cn("w-7 h-7 transition-transform active:scale-95", location.pathname.startsWith("/search") ? "stroke-[2.5px]" : "stroke-[2px]")} />
          </Link>

          {/* Profile */}
          <Link to="/profile" className="p-2 transition-all relative">
            <div className={cn(
              "w-7 h-7 rounded-full overflow-hidden border-2 transition-all active:scale-95",
              location.pathname.startsWith("/profile") ? "border-q-primary" : "border-transparent"
            )}>
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-q-surface flex items-center justify-center text-white text-xs font-bold">
                  {profile?.displayName?.[0] || <User className="w-4 h-4" />}
                </div>
              )}
            </div>
            {/* Keeping the red dot placeholder for profile as requested */}
            <span className="absolute top-1.5 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black hidden" />
          </Link>
        </nav>`;

code = code.replace(bottomNavRegex, newBottomNav);

fs.writeFileSync('src/components/layout/Layout.tsx', code);
