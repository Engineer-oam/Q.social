const fs = require('fs');

const files = [
  'src/pages/Onboarding.tsx',
  'src/pages/Settings.tsx',
  'src/pages/Messages.tsx',
  'src/pages/Create.tsx',
  'src/pages/Explore.tsx',
  'src/pages/Profile.tsx',
  'src/pages/Search.tsx',
  'src/components/layout/Layout.tsx',
  'src/components/VoiceRecorder.tsx',
  'src/components/Comments.tsx',
  'src/components/Stories.tsx',
  'src/components/PostCard.tsx',
  'src/components/Reel.tsx',
  'src/components/NotificationsPanel.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace auth, db imports with supabase
  code = code.replace(/import \{.*?auth.*?db.*?\} from '(\.\.\/)*lib\/firebase';/g, "import { supabase } from '$1lib/supabase';");
  code = code.replace(/import \{.*?db.*?\} from '(\.\.\/)*lib\/firebase';/g, "import { supabase } from '$1lib/supabase';");
  
  fs.writeFileSync(file, code);
}
