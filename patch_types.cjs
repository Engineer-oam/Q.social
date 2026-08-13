const fs = require('fs');
let code = fs.readFileSync('src/types/index.ts', 'utf8');

code = code.replace(
  '  website?: string | null;',
  `  website?: string | null;
  pronouns?: string | null;
  gender?: string | null;
  profileType?: 'Private' | 'Public' | 'Professional';
  category?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  aiCreator?: boolean;
  showProfileOnSearch?: boolean;
  usernameLastChanged?: number | null;
  links?: { title: string, url: string }[];
  banners?: string[];`
);

fs.writeFileSync('src/types/index.ts', code);
