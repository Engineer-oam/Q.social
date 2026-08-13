import { collection, addDoc, query, orderBy, getDocs, limit, serverTimestamp, doc, getDoc, startAfter, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Post, UserProfile } from '../../types';

export const createPost = async (userId: string, content: string, files: File[]) => {
  const mediaUrls: string[] = [];
  
  // Upload files to storage
  for (const file of files) {
    const storageRef = ref(storage, `posts/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    mediaUrls.push(url);
  }

  // Create post document
  const postRef = await addDoc(collection(db, 'posts'), {
    userId,
    content,
    mediaUrls,
    createdAt: Date.now(), // Use client timestamp for immediate sorting, or serverTimestamp() 
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0
  });

  return postRef.id;
};

export const getFeedPosts = async (currentProfile?: UserProfile | null, max: number = 20, feedType: 'for-you' | 'following' = 'for-you', lastDoc?: any) => {
  let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max));
  if (lastDoc) {
    q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(max));
  }
  
  const snapshot = await getDocs(q);
  
  // Get hides for the current user
  let hiddenPostIds: string[] = [];
  if (currentProfile) {
    const hidesQ = query(collection(db, 'hides'), where('userId', '==', currentProfile.id));
    const hidesSnap = await getDocs(hidesQ);
    hiddenPostIds = hidesSnap.docs.map(d => d.data().targetId);
  }

  const posts: (Post & { author?: UserProfile })[] = [];
  
  for (const document of snapshot.docs) {
    if (hiddenPostIds.includes(document.id)) continue;
    
    const postData = { id: document.id, ...document.data() } as Post;
    
    if (feedType === 'following' && currentProfile) {
      if (!currentProfile.following?.includes(postData.userId) && postData.userId !== currentProfile.id) {
        continue; // Skip if not following and not own post
      }
    }
    
    // Fetch author data
    let author: UserProfile | undefined;
    try {
      const authorDoc = await getDoc(doc(db, 'profiles', postData.userId));
      if (authorDoc.exists()) {
        author = { id: authorDoc.id, ...authorDoc.data() } as UserProfile;
      }
    } catch (e) {
      console.error("Failed to fetch author", e);
    }
    
    posts.push({ ...postData, author });
  }
  
  // Custom sorting: Followed Users first, then Interest Matches, then Chronological
  if (currentProfile && feedType === 'for-you') {
    posts.sort((a, b) => {
      const aIsFollowing = currentProfile.following?.includes(a.userId);
      const bIsFollowing = currentProfile.following?.includes(b.userId);
      
      // 1. Prioritize followed accounts
      if (aIsFollowing && !bIsFollowing) return -1;
      if (!aIsFollowing && bIsFollowing) return 1;
      
      // 2. Prioritize interest overlaps
      const myInterests = currentProfile.interests || [];
      const aInterests = a.author?.interests || [];
      const bInterests = b.author?.interests || [];
      
      const aHasInterest = aInterests.some(i => myInterests.includes(i));
      const bHasInterest = bInterests.some(i => myInterests.includes(i));
      
      if (aHasInterest && !bHasInterest) return -1;
      if (!aHasInterest && bHasInterest) return 1;
      
      return b.createdAt - a.createdAt;
    });
  }
  
  return { posts, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
};

export const getReelsFeed = async (currentProfile?: UserProfile | null, max: number = 10, feedType: 'for-you' | 'following' = 'for-you', lastDoc?: any) => {
  // Fetch a larger batch since we are filtering client-side for videos
  let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
  if (lastDoc) {
    q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(50));
  }
  
  const snapshot = await getDocs(q);
  
  let hiddenPostIds: string[] = [];
  if (currentProfile) {
    const hidesQ = query(collection(db, 'hides'), where('userId', '==', currentProfile.id));
    const hidesSnap = await getDocs(hidesQ);
    hiddenPostIds = hidesSnap.docs.map(d => d.data().targetId);
  }

  const posts: (Post & { author?: UserProfile })[] = [];
  
  for (const document of snapshot.docs) {
    if (posts.length >= max) break;
    if (hiddenPostIds.includes(document.id)) continue;
    
    const postData = { id: document.id, ...document.data() } as Post;
    
    // Check if post contains a video (this determines if it is a "Reel" for this context)
    const isVideo = postData.mediaUrls?.some(url => url.match(/\.(mp4|webm)$/i) || url.includes('video'));
    if (!isVideo) continue;
    
    if (feedType === 'following' && currentProfile) {
      if (!currentProfile.following?.includes(postData.userId) && postData.userId !== currentProfile.id) {
        continue;
      }
    }
    
    let author: UserProfile | undefined;
    try {
      const authorDoc = await getDoc(doc(db, 'profiles', postData.userId));
      if (authorDoc.exists()) {
        author = { id: authorDoc.id, ...authorDoc.data() } as UserProfile;
      }
    } catch (e) {
      console.error("Failed to fetch author", e);
    }
    
    posts.push({ ...postData, author });
  }
  
  if (currentProfile && feedType === 'for-you') {
    posts.sort((a, b) => {
      const aIsFollowing = currentProfile.following?.includes(a.userId);
      const bIsFollowing = currentProfile.following?.includes(b.userId);
      
      if (aIsFollowing && !bIsFollowing) return -1;
      if (!aIsFollowing && bIsFollowing) return 1;
      
      const myInterests = currentProfile.interests || [];
      const aInterests = a.author?.interests || [];
      const bInterests = b.author?.interests || [];
      
      const aHasInterest = aInterests.some(i => myInterests.includes(i));
      const bHasInterest = bInterests.some(i => myInterests.includes(i));
      
      if (aHasInterest && !bHasInterest) return -1;
      if (!aHasInterest && bHasInterest) return 1;
      
      return b.createdAt - a.createdAt;
    });
  }
  
  return { posts, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
};

export const getTrendingTopics = async () => {
  // Simple trending logic: fetch recent posts and aggregate hashtags
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
  const snapshot = await getDocs(q);
  
  const tagCounts: Record<string, number> = {};
  
  snapshot.docs.forEach(doc => {
    const post = doc.data() as Post;
    if (post.content) {
      const tags = post.content.match(/#[\w]+/g) || [];
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count, trend: Math.floor(Math.random() * 20) + 1 })) // Mock trend % for UI
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

export const getExplorePosts = async (currentProfile?: UserProfile | null, max: number = 20, lastDoc?: any, topic?: string) => {
  let q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max));
  if (lastDoc) {
    q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(max));
  }
  
  const snapshot = await getDocs(q);
  
  let hiddenPostIds: string[] = [];
  if (currentProfile) {
    const hidesQ = query(collection(db, 'hides'), where('userId', '==', currentProfile.id));
    const hidesSnap = await getDocs(hidesQ);
    hiddenPostIds = hidesSnap.docs.map(d => d.data().targetId);
  }

  const posts: (Post & { author?: UserProfile; reason?: string })[] = [];
  
  for (const document of snapshot.docs) {
    if (hiddenPostIds.includes(document.id)) continue;
    
    const postData = { id: document.id, ...document.data() } as Post;
    
    // If topic is selected, filter by topic (hashtag)
    if (topic && topic !== 'All') {
        const hasTopic = postData.content.toLowerCase().includes(topic.toLowerCase());
        if (!hasTopic) continue;
    }

    let author: UserProfile | undefined;
    try {
      const authorDoc = await getDoc(doc(db, 'profiles', postData.userId));
      if (authorDoc.exists()) {
        author = { id: authorDoc.id, ...authorDoc.data() } as UserProfile;
      }
    } catch (e) {
      console.error("Failed to fetch author", e);
    }
    
    // Generate a reason for explore
    let reason = '';
    if (currentProfile) {
        const isFollowing = currentProfile.following?.includes(postData.userId);
        if (isFollowing) {
            continue; // Skip following in explore by default to show NEW content
        }
        
        const sharedInterests = author?.interests?.filter(i => currentProfile.interests?.includes(i));
        if (sharedInterests && sharedInterests.length > 0) {
            reason = `Based on your interest in ${sharedInterests[0]}`;
        } else if (postData.likesCount > 5) {
            reason = `Popular on Q`;
        } else {
            reason = `Suggested for you`;
        }
    }
    
    posts.push({ ...postData, author, reason });
  }
  
  return { posts, lastDoc: snapshot.docs[snapshot.docs.length - 1] };
};

export const getSuggestedCreators = async (currentProfile?: UserProfile | null) => {
  let q = query(collection(db, 'profiles'), limit(10));
  const snapshot = await getDocs(q);
  
  const creators: UserProfile[] = [];
  snapshot.docs.forEach(doc => {
    const profile = { id: doc.id, ...doc.data() } as UserProfile;
    // Don't suggest yourself or people you already follow
    if (currentProfile) {
      if (profile.id === currentProfile.id) return;
      if (currentProfile.following?.includes(profile.id)) return;
    }
    creators.push(profile);
  });
  
  return creators.slice(0, 5);
};
