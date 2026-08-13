import { db, storage } from '../../lib/firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile } from '../../types';

export const isUsernameAvailable = async (username: string, currentUserId: string): Promise<boolean> => {
  const q = query(collection(db, 'profiles'), where('username', '==', username));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) return true;
  
  // If there's a document but it's the current user's, it's fine.
  if (querySnapshot.size === 1 && querySnapshot.docs[0].id === currentUserId) {
    return true;
  }
  
  return false;
};

export const validateUsernameRules = (username: string): { valid: boolean; message: string } => {
  if (username.length < 3) return { valid: false, message: 'Username must be at least 3 characters' };
  if (username.length > 20) return { valid: false, message: 'Username must be less than 20 characters' };
  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return { valid: false, message: 'Only letters, numbers, periods and underscores allowed' };
  }
  return { valid: true, message: 'Username is valid' };
};

export const canChangeUsername = (lastChangedTime?: number | null): { canChange: boolean; daysLeft: number } => {
  if (!lastChangedTime) return { canChange: true, daysLeft: 0 };
  
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const timeSinceLastChange = Date.now() - lastChangedTime;
  
  if (timeSinceLastChange >= sevenDaysInMs) {
    return { canChange: true, daysLeft: 0 };
  }
  
  const daysLeft = Math.ceil((sevenDaysInMs - timeSinceLastChange) / (1000 * 60 * 60 * 24));
  return { canChange: false, daysLeft };
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `profiles/${userId}/avatar_${Date.now()}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const updateProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  const docRef = doc(db, 'profiles', userId);
  await updateDoc(docRef, data);
};
