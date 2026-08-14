import { db } from "../../lib/firebase";
import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Compass, Search, PlusSquare, User, MessageSquare, Settings, Clapperboard, Send } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../features/auth/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { ChatRoom } from '../../types';

export default function Layout() {
  const location = useLocation();
  const { profile, user } = useAuth();
  
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'chatRooms'), where('participants', 'array-contains', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      let unread = 0;
      snap.forEach(doc => {
        const data = doc.data() as ChatRoom;
        if (data.unreadCount && data.unreadCount[user.uid] > 0) {
          unread += 1; // Count rooms with unread messages
        }
      });
      setUnreadCount(unread);
    });
    return () => unsub();
  }, [user]);

  const isHome = location.pathname === '/home';
  const isReels = location.pathname === '/reels';

  const isMessages = location.pathname === '/messages';

  const NavLink = ({ to, icon: Icon, label, hiddenMobile = false, badge = 0 }: { to: string, icon: any, label: string, hiddenMobile?: boolean, badge?: number }) => {
    const isActive = location.pathname.startsWith(to);
    return (
      <Link 
        to={to} 
        className={cn(
          "flex items-center md:space-x-4 p-3 md:p-3 rounded-xl transition-all group",
          isActive ? "text-q-primary md:bg-q-primary/10" : "text-q-text-muted hover:text-white md:hover:bg-q-surface",
          hiddenMobile ? "hidden md:flex" : "flex"
        )}
      >
        <div className="relative">
          <Icon className={cn("w-6 h-6 md:w-5 md:h-5 transition-transform group-hover:scale-110", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-q-primary text-black text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <span className="hidden md:inline font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-black flex text-q-text">
      {/* Sidebar navigation for desktop */}
      <nav className="hidden md:flex flex-col w-64 border-r border-q-surface-border bg-black/50 p-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-q-panel to-q-surface border border-q-surface-border flex items-center justify-center shadow-lg mb-8">
          <span className="text-2xl font-black text-white">Q</span>
        </div>
        <div className="space-y-2">
          <NavLink to="/home" icon={Home} label="Home" />
          <NavLink to="/explore" icon={Compass} label="Explore" />
          <NavLink to="/search" icon={Search} label="Search" />
          <NavLink to="/reels" icon={Clapperboard} label="Reels" />
          <NavLink to="/messages" icon={Send} label="Messages" badge={unreadCount} />
          <NavLink to="/profile" icon={User} label="Profile" />
          <NavLink to="/settings" icon={Settings} label="Settings" />
        </div>
        
        <div className="mt-auto">
          <Link to="/create" className="flex items-center justify-center space-x-2 w-full py-3 bg-q-primary text-black hover:bg-q-primary-hover rounded-xl font-medium transition-all shadow-lg shadow-q-primary/20">
            <PlusSquare className="w-5 h-5" />
            <span>Create</span>
          </Link>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
          <Outlet />
        </div>
        
        {/* Mobile bottom nav */}
        <nav className="md:hidden flex items-center justify-around px-2 py-3 border-t border-q-surface-border glass z-20 absolute bottom-0 w-full pb-safe">
          {/* Home */}
          <Link to="/home" className={cn("p-2 transition-all", location.pathname.startsWith("/home") ? "text-q-primary" : "text-q-text-muted hover:text-white")}>
            <Home className={cn("w-7 h-7 transition-transform active:scale-95", location.pathname.startsWith("/home") ? "stroke-[2.5px]" : "stroke-[2px]")} />
          </Link>
          
          {/* Reels */}
          <Link to="/reels" className={cn("p-2 transition-all", location.pathname.startsWith("/reels") ? "text-q-primary" : "text-q-text-muted hover:text-white")}>
            <Clapperboard className={cn("w-7 h-7 transition-transform active:scale-95", location.pathname.startsWith("/reels") ? "stroke-[2.5px]" : "stroke-[2px]")} />
          </Link>

          {/* Message */}
          <Link to="/messages" className={cn("p-2 transition-all relative", location.pathname.startsWith("/messages") ? "text-q-primary" : "text-q-text-muted hover:text-white")}>
            <Send className={cn("w-7 h-7 transition-transform active:scale-95", location.pathname.startsWith("/messages") ? "stroke-[2.5px]" : "stroke-[2px]")} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
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
        </nav>
      </main>
    </div>
  );
}
