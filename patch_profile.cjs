const fs = require('fs');
let code = fs.readFileSync('src/pages/Profile.tsx', 'utf8');

const targetStr = `          {/* Right: Actions */}
          <div className="flex items-center space-x-2 -mr-2">
            <button className="p-2 text-white hover:text-q-primary transition-colors">
              <AtSign className="w-6 h-6" />
            </button>
            <button onClick={signOut} className="p-2 text-white hover:text-red-500 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>`;

const newStr = `          {/* Right: Actions */}
          <div className="flex items-center space-x-2 -mr-2">
            <button onClick={signOut} className="p-2 text-white hover:text-red-500 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('src/pages/Profile.tsx', code);
