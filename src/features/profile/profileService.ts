import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

export const validateUsernameRules = (username: string) => {
  if (username.length < 3) return { valid: false, message: 'Username too short' };
  if (!/^[a-zA-Z0-9_.]+$/.test(username)) return { valid: false, message: 'Invalid characters' };
  return { valid: true, message: '' };
};

export const isUsernameAvailable = async (username: string, userId: string) => {
  const q = query(collection(db, 'profiles'), where('username', '==', username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return true;
  return snapshot.docs.every((d) => d.id === userId);
};

export const canChangeUsername = (lastChanged?: number | null) => {
  if (!lastChanged) return { canChange: true, daysLeft: 0 };
  const daysSince = (Date.now() - lastChanged) / (1000 * 60 * 60 * 24);
  const canChange = daysSince >= 7;
  return { canChange, daysLeft: canChange ? 0 : Math.ceil(7 - daysSince) };
};

export const uploadProfilePicture = async (userId: string, photoFile: File) => {
  const fileRef = ref(storage, `profiles/${userId}/${Date.now()}_${photoFile.name}`);
  await uploadBytes(fileRef, photoFile);
  return await getDownloadURL(fileRef);
};

export const updateProfile = async (userId: string, data: any, photoFile?: File) => {

  let photoURL = data.photoURL;

  if (photoFile) {
    const fileRef = ref(storage, `profiles/${userId}/${Date.now()}_${photoFile.name}`);
    await uploadBytes(fileRef, photoFile);
    photoURL = await getDownloadURL(fileRef);
  }

  const updateData = { ...data };
  if (photoURL !== undefined) {
    updateData.photoURL = photoURL;
  }

  await updateDoc(doc(db, 'profiles', userId), updateData);
};
