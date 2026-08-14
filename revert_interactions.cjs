const fs = require('fs');

const interactionServiceCode = `import { collection, addDoc, deleteDoc, doc, getDocs, query, where, writeBatch, increment, serverTimestamp, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Comment, Interaction } from '../../types';

export const toggleInteraction = async (
  collectionName: 'likes' | 'saves' | 'hides',
  targetId: string, 
  userId: string,
  postRef?: any
) => {
  const q = query(
    collection(db, collectionName),
    where('targetId', '==', targetId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);

  if (snapshot.empty) {
    const newRef = doc(collection(db, collectionName));
    batch.set(newRef, {
      targetId,
      userId,
      createdAt: Date.now()
    });
    if (postRef && collectionName === 'likes') {
      batch.update(postRef, { likesCount: increment(1) });
    }
    await batch.commit();
    return true;
  } else {
    snapshot.docs.forEach(d => batch.delete(d.ref));
    if (postRef && collectionName === 'likes') {
      batch.update(postRef, { likesCount: increment(-1) });
    }
    await batch.commit();
    return false;
  }
};

export const hasInteracted = async (
  collectionName: 'likes' | 'saves' | 'hides',
  targetId: string,
  userId: string
) => {
  const q = query(
    collection(db, collectionName),
    where('targetId', '==', targetId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const getComments = async (postId: string, lastDoc?: any) => {
  let q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  return await getDocs(q);
};

export const addComment = async (postId: string, userId: string, content: string) => {
  const batch = writeBatch(db);
  const commentRef = doc(collection(db, 'comments'));
  
  batch.set(commentRef, {
    postId,
    userId,
    content,
    createdAt: Date.now(),
    likesCount: 0
  });

  const postRef = doc(db, 'posts', postId);
  batch.update(postRef, { commentsCount: increment(1) });
  await batch.commit();
  return commentRef.id;
};

export const deleteComment = async (commentId: string, postId: string) => {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'comments', commentId));
  batch.update(doc(db, 'posts', postId), { commentsCount: increment(-1) });
  await batch.commit();
};
`;
fs.writeFileSync('src/features/posts/interactionService.ts', interactionServiceCode);
