const fs = require('fs');

const authContextCode = `import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { UserProfile } from '../../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'profiles', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
      if (doc.exists()) {
        setProfile({ id: doc.id, ...doc.data() } as UserProfile);
      }
    });
    return () => unsub();
  }, [user]);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut: handleSignOut, refreshProfile: async () => { if (user) await fetchProfile(user.uid); } }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`;
fs.writeFileSync('src/features/auth/AuthContext.tsx', authContextCode);

const postServiceCode = `import { collection, addDoc, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Post, UserProfile } from '../../types';
import { getDoc, doc } from 'firebase/firestore';

export const createPost = async (userId: string, content: string, files: File[]) => {
  const mediaUrls: string[] = [];
  for (const file of files) {
    const fileRef = ref(storage, \`posts/\${userId}/\${Date.now()}_\${file.name}\`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    mediaUrls.push(url);
  }

  const postData = {
    userId,
    content,
    mediaUrls,
    createdAt: Date.now(),
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0
  };

  const docRef = await addDoc(collection(db, 'posts'), postData);
  return docRef.id;
};

export const getFeedPosts = async (currentProfile?: UserProfile | null, max: number = 20, feedType: 'for-you' | 'following' = 'for-you', lastDoc?: any) => {
  let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max));
  if (lastDoc) q = query(q, startAfter(lastDoc));

  const snapshot = await getDocs(q);
  
  let hiddenPostIds: string[] = [];
  if (currentProfile) {
    const hidesSnap = await getDocs(query(collection(db, 'hides'), where('userId', '==', currentProfile.id)));
    hiddenPostIds = hidesSnap.docs.map(d => d.data().targetId);
  }

  const posts: (Post & { author?: UserProfile })[] = [];
  for (const d of snapshot.docs) {
    if (hiddenPostIds.includes(d.id)) continue;
    const data = { id: d.id, ...d.data() } as Post;
    
    if (feedType === 'following' && currentProfile) {
      if (!currentProfile.following?.includes(data.userId) && data.userId !== currentProfile.id) {
        continue;
      }
    }
    
    let author;
    try {
      const authorDoc = await getDoc(doc(db, 'profiles', data.userId));
      if (authorDoc.exists()) author = { id: authorDoc.id, ...authorDoc.data() };
    } catch (e) {}
    
    posts.push({ ...data, author });
  }
  
  return { posts, nextOffset: snapshot.docs[snapshot.docs.length - 1] };
};

export const getReelsFeed = async (currentProfile?: UserProfile | null, max: number = 10, feedType: 'for-you' | 'following' = 'for-you', lastDoc?: any) => {
  return await getFeedPosts(currentProfile, max, feedType, lastDoc);
};

export const getTrendingTopics = async () => {
  return [
    { tag: '#QSocial', count: 120, trend: 15 },
    { tag: '#Tech', count: 85, trend: 5 }
  ];
};

export const getExplorePosts = async (currentProfile?: UserProfile | null, max: number = 20, lastDoc?: any, topic?: string) => {
  return await getFeedPosts(currentProfile, max, 'for-you', lastDoc);
};

export const getSuggestedCreators = async (currentProfile?: UserProfile | null) => {
  const snapshot = await getDocs(query(collection(db, 'profiles'), limit(10)));
  const creators: UserProfile[] = [];
  snapshot.docs.forEach(doc => {
    if (doc.id !== currentProfile?.id) creators.push({ id: doc.id, ...doc.data() } as UserProfile);
  });
  return creators.slice(0, 5);
};
`;
fs.writeFileSync('src/features/posts/postService.ts', postServiceCode);

