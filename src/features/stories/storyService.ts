import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Story, UserProfile } from '../../types';

export const getStories = async (currentUserId: string, following: string[]) => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const yesterday = Date.now() - ONE_DAY_MS;

  // We can fetch our own stories and followed users' stories
  const userIdsToFetch = [currentUserId, ...following];
  
  // Firestore limit for 'in' is 10. For production scale, we'd fetch differently or chunk.
  // For MVP, we'll chunk arrays of 10.
  const chunks = [];
  for (let i = 0; i < userIdsToFetch.length; i += 10) {
    chunks.push(userIdsToFetch.slice(i, i + 10));
  }

  let allStories: (Story & { author?: UserProfile })[] = [];
  
  // Need to get authors too
  const authorCache: Record<string, UserProfile> = {};

  for (const chunk of chunks) {
    const q = query(
      collection(db, 'stories'),
      where('userId', 'in', chunk),
      where('expiresAt', '>', Date.now()),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    
    for (const doc of snapshot.docs) {
      const data = doc.data() as Story;
      
      // Fetch author if not cached
      if (!authorCache[data.userId]) {
        const authorQ = query(collection(db, 'profiles'), where('id', '==', data.userId));
        const authorSnap = await getDocs(authorQ);
        if (!authorSnap.empty) {
          authorCache[data.userId] = { id: authorSnap.docs[0].id, ...authorSnap.docs[0].data() } as UserProfile;
        }
      }
      
      allStories.push({
        id: doc.id,
        ...data,
        author: authorCache[data.userId]
      });
    }
  }
  
  return allStories;
};

export const createStory = async (userId: string, mediaUrl: string, mediaType: 'image' | 'video') => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  await addDoc(collection(db, 'stories'), {
    userId,
    mediaUrl,
    mediaType,
    createdAt: Date.now(),
    expiresAt: Date.now() + ONE_DAY_MS
  });
};
