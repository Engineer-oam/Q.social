import { collection, addDoc, query, orderBy, onSnapshot, getDocs, where, serverTimestamp, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ChatRoom, Message, UserProfile } from '../../types';

export const getOrCreateChatRoom = async (currentUserId: string, otherUserId: string) => {
  const roomsRef = collection(db, 'chatRooms');
  const q = query(roomsRef, where('participants', 'array-contains', currentUserId));
  const snapshot = await getDocs(q);

  let existingRoom: ChatRoom | null = null;
  
  for (const doc of snapshot.docs) {
    const data = doc.data() as ChatRoom;
    if (data.participants.includes(otherUserId) && data.participants.length === 2) {
      existingRoom = { id: doc.id, ...data };
      break;
    }
  }

  if (existingRoom) {
    return existingRoom.id;
  }

  // Create new room
  const newRoomRef = await addDoc(roomsRef, {
    participants: [currentUserId, otherUserId],
    lastMessage: '',
    lastMessageTime: Date.now(),
  });
  
  return newRoomRef.id;
};

import { increment } from 'firebase/firestore';

export const sendMessage = async (roomId: string, senderId: string, content: string, mediaUrl?: string) => {
  const messageRef = collection(db, `chatRooms/${roomId}/messages`);
  await addDoc(messageRef, {
    roomId,
    senderId,
    content,
    ...(mediaUrl ? { mediaUrl } : {}),
    readBy: [senderId],
    createdAt: Date.now()
  });

  // Fetch current room to update unread counts
  const roomRef = doc(db, 'chatRooms', roomId);
  const roomDoc = await getDoc(roomRef);
  
  if (roomDoc.exists()) {
    const data = roomDoc.data();
    const participants = data.participants || [];
    
    // Create an object incrementing unread for everyone except sender
    const unreadCountUpdates: any = {};
    for (const p of participants) {
      if (p !== senderId) {
        unreadCountUpdates[`unreadCount.${p}`] = increment(1);
      }
    }
    
    await updateDoc(roomRef, {
      lastMessage: content || (mediaUrl ? 'Attachment' : 'Message'),
      lastMessageTime: Date.now(),
      ...unreadCountUpdates
    });
  }
};

export const markChatRead = async (roomId: string, userId: string) => {
  const roomRef = doc(db, 'chatRooms', roomId);
  await updateDoc(roomRef, {
    [`unreadCount.${userId}`]: 0
  });
};

export const sendAudioMessage = async (roomId: string, senderId: string, audioUrl: string) => {
  const messageRef = collection(db, `chatRooms/${roomId}/messages`);
  await addDoc(messageRef, {
    roomId,
    senderId,
    content: '🎤 Voice Note',
    audioUrl,
    createdAt: Date.now()
  });

  const roomRef = doc(db, 'chatRooms', roomId);
  await updateDoc(roomRef, {
    lastMessage: '🎤 Voice Note',
    lastMessageTime: Date.now()
  });
};

export const notifyCallStarted = async (roomId: string, senderId: string, type: 'video' | 'audio', callId: string) => {
  const messageRef = collection(db, `chatRooms/${roomId}/messages`);
  await addDoc(messageRef, {
    roomId,
    senderId,
    content: `Started a ${type} call`,
    isSystemMessage: true,
    createdAt: Date.now()
  });
  
  const roomRef = doc(db, 'chatRooms', roomId);
  await updateDoc(roomRef, {
    lastMessage: `📞 ${type} call`,
    lastMessageTime: Date.now()
  });
};

export const fetchAllUsers = async (currentUserId: string): Promise<UserProfile[]> => {
  // Simple fetch of profiles to allow starting chats
  const profilesRef = collection(db, 'profiles');
  const snapshot = await getDocs(profilesRef);
  
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
    .filter(profile => profile.id !== currentUserId && profile.isOnboarded);
};

export const fetchRoomUserProfiles = async (roomParticipants: string[], currentUserId: string): Promise<UserProfile | null> => {
  const otherUserId = roomParticipants.find(id => id !== currentUserId);
  if (!otherUserId) return null;

  try {
    const userDoc = await getDoc(doc(db, 'profiles', otherUserId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    }
  } catch (error) {
    console.error("Error fetching room user profile:", error);
  }
  return null;
};
