const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Add import for NotificationsPanel
code = code.replace(
  "import { cn } from '../lib/utils';",
  "import { cn } from '../lib/utils';\nimport NotificationsPanel from '../components/NotificationsPanel';"
);

// Add states
code = code.replace(
  "const [newPostsAvailable, setNewPostsAvailable] = useState(false);",
  "const [newPostsAvailable, setNewPostsAvailable] = useState(false);\n  const [showNotifications, setShowNotifications] = useState(false);\n  const [unreadNotifications, setUnreadNotifications] = useState(0);"
);

// Add the panel component at the bottom, just inside the main fragment/div
code = code.replace(
  "    </div>\n  );\n}\n",
  "      <NotificationsPanel \n        isOpen={showNotifications} \n        onClose={() => setShowNotifications(false)} \n        setUnreadCount={setUnreadNotifications}\n      />\n    </div>\n  );\n}\n"
);

fs.writeFileSync('src/pages/Home.tsx', code);
