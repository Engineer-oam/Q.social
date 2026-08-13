const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

code = code.replace(
`          {/* Search */}
          <Link to="/search" className={cn("p-2 transition-all", location.pathname.startsWith("/search") ? "text-q-primary" : "text-q-text-muted hover:text-white")}>
            <Search className={cn("w-7 h-7 transition-transform active:scale-95", location.pathname.startsWith("/search") ? "stroke-[2.5px]" : "stroke-[2px]")} />
          </Link>`,
`          {/* Messages */}
          <Link to="/messages" className={cn("p-2 transition-all relative", location.pathname.startsWith("/messages") ? "text-q-primary" : "text-q-text-muted hover:text-white")}>
            <MessageSquare className={cn("w-7 h-7 transition-transform active:scale-95", location.pathname.startsWith("/messages") ? "stroke-[2.5px]" : "stroke-[2px]")} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-q-primary text-black text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>`
);

fs.writeFileSync('src/components/layout/Layout.tsx', code);
