const fs = require('fs');
let code = fs.readFileSync('src/features/profile/profileService.ts', 'utf8');

code = code.replace(
  "import { db, storage } from '../../lib/firebase';",
  "import { supabase } from '../../lib/supabase';"
);
code = code.replace(
  "import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';",
  ""
);
code = code.replace(
  "import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';",
  ""
);

code = code.replace(
  /export const isUsernameAvailable = async \(username: string, currentUserId: string\): Promise<boolean> => \{[\s\S]*?\};/m,
  `export const isUsernameAvailable = async (username: string, currentUserId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username);
    
  if (error || !data || data.length === 0) return true;
  
  if (data.length === 1 && data[0].id === currentUserId) {
    return true;
  }
  
  return false;
};`
);

code = code.replace(
  /export const uploadProfilePicture = async \(userId: string, file: File\): Promise<string> => \{[\s\S]*?\};/m,
  `export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  const filePath = \`\${userId}/avatar_\${Date.now()}\`;
  const { error } = await supabase.storage
    .from('profiles')
    .upload(filePath, file);
    
  if (error) throw error;
  
  const { data } = supabase.storage.from('profiles').getPublicUrl(filePath);
  return data.publicUrl;
};`
);

code = code.replace(
  /export const updateProfile = async \(userId: string, data: Partial<UserProfile>\): Promise<void> => \{[\s\S]*?\};/m,
  `export const updateProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId);
    
  if (error) throw error;
};`
);

fs.writeFileSync('src/features/profile/profileService.ts', code);
