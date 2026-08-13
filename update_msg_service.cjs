const fs = require('fs');
let code = fs.readFileSync('src/features/messages/messageService.ts', 'utf8');

code = code.replace(
`export const sendMessage = async (roomId: string, senderId: string, content: string) => {
  const messageRef = collection(db, \`chatRooms/\${roomId}/messages\`);
  await addDoc(messageRef, {
    roomId,
    senderId,
    content,
    createdAt: Date.now()
  });

  // Update room last message
  const roomRef = doc(db, 'chatRooms', roomId);
  await updateDoc(roomRef, {
    lastMessage: content,
    lastMessageTime: Date.now()
  });
};`,
`import { increment } from 'firebase/firestore';

export const sendMessage = async (roomId: string, senderId: string, content: string, mediaUrl?: string) => {
  const messageRef = collection(db, \`chatRooms/\${roomId}/messages\`);
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
        unreadCountUpdates[\`unreadCount.\${p}\`] = increment(1);
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
    [\`unreadCount.\${userId}\`]: 0
  });
};`
);

fs.writeFileSync('src/features/messages/messageService.ts', code);
