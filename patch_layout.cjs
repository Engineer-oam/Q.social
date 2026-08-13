const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

const targetStr = `{/* Mobile Header */}
        {!isHome && !isReels && !isMessages && (
          <header className="md:hidden flex items-center justify-between p-4 border-b border-q-surface-border glass z-20 absolute top-0 w-full pt-safe-top"> 
            <span className="text-xl font-black text-white">Q</span>
            <div className="flex items-center space-x-4">
              <Link to="/settings" className="text-q-text-muted hover:text-white transition-colors">
                <Settings className="w-6 h-6" />
              </Link>
            </div>
          </header>
        )}
        
        <div className={cn("flex-1 overflow-y-auto w-full pb-20 md:pb-0", (!isHome && !isReels && !isMessages) ? "md:pt-0 pt-16" : "")}>`;

const newStr = `<div className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/components/layout/Layout.tsx', code);
