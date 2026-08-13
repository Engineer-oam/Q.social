export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string | null;
  bio: string | null;
  country: string | null;
  website?: string | null;
  statusNote?: string | null;
  createdAt: number;
  followersCount: number;
  followingCount: number;
  isOnboarded: boolean;
  interests?: string[];
  following?: string[];
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrls: string[];
  createdAt: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  author?: UserProfile;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: number;
  expiresAt: number;
  author?: UserProfile;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: number;
  likesCount: number;
  author?: UserProfile;
}

export interface Interaction {
  id: string;
  targetId: string; // postId or commentId
  userId: string;
  createdAt: number;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount?: Record<string, number>;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  audioUrl?: string;
  isSystemMessage?: boolean;
  createdAt: number;
  mediaUrl?: string;
  readBy?: string[];
}
