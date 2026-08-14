const fs = require('fs');

const profileServiceCode = `import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

export const updateProfile = async (userId: string, data: any, photoFile?: File) => {
  let photoURL = data.photoURL;

  if (photoFile) {
    const fileRef = ref(storage, \`profiles/\${userId}/\${Date.now()}_\${photoFile.name}\`);
    await uploadBytes(fileRef, photoFile);
    photoURL = await getDownloadURL(fileRef);
  }

  const updateData = { ...data };
  if (photoURL !== undefined) {
    updateData.photoURL = photoURL;
  }

  await updateDoc(doc(db, 'profiles', userId), updateData);
};
`;
fs.writeFileSync('src/features/profile/profileService.ts', profileServiceCode);
