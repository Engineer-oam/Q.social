const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

code = code.replace(
`<Link to="/settings" className="text-q-text-muted hover:text-white transition-colors">
              <Settings className="w-6 h-6" />
            </Link>`,
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
            </div>`
);
fs.writeFileSync('src/components/layout/Layout.tsx', code);
