import { db, storage } from "../lib/firebase";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc, startAt, endAt, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { ChatRoom, Message, UserProfile } from '../types';
import { Search, Edit, ChevronLeft, MoreVertical, Image as ImageIcon, Mic, Send, Loader2, Menu, ChevronDown, Activity, Map, Plus } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '../lib/utils';
import { getOrCreateChatRoom, sendMessage, fetchRoomUserProfiles, markChatRead, sendAudioMessage } from '../features/messages/messageService';
import VoiceRecorder from '../components/VoiceRecorder';

export default function Messages() {
  const { user, profile } = useAuth();
  
  // State for Inbox
  const [rooms, setRooms] = useState<(ChatRoom & { otherUser?: UserProfile })[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<UserProfile[]>([]);

  // State for Chat View
  const [myNote, setMyNote] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [contextMenuRoomId, setContextMenuRoomId] = useState<string | null>(null);
  const handleContextMenu = (e: React.MouseEvent, roomId: string) => {
    e.preventDefault();
    setContextMenuRoomId(roomId);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notes
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (document) => {
      if (document.exists()) {
        const data = document.data();
        setMyNote(data.statusNote || null);
      }
    });
    return () => unsub();
  }, [user]);

  const handleSaveNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    await updateDoc(doc(db, 'profiles', user.uid), {
      statusNote: noteInput.trim() || null
    });
    setIsEditingNote(false);
  };

  const handleDeleteNote = async () => {
    if (!user) return;
    await updateDoc(doc(db, 'profiles', user.uid), {
      statusNote: null
    });
    setIsEditingNote(false);
  };

  // Subscribe to Inbox
  useEffect(() => {
    if (!user) return;
    const roomsQuery = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubscribe = onSnapshot(roomsQuery, async (snapshot) => {
      const roomPromises = snapshot.docs.map(async (document) => {
        const roomData = { id: document.id, ...document.data() } as ChatRoom;
        const otherUser = await fetchRoomUserProfiles(roomData.participants, user.uid);
        return { ...roomData, otherUser: otherUser || undefined };
      });
      const resolvedRooms = await Promise.all(roomPromises);
      resolvedRooms.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      setRooms(resolvedRooms);
      setLoadingRooms(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Subscribe to Active Chat
  useEffect(() => {
    if (!activeRoomId || !user) return;
    markChatRead(activeRoomId, user.uid);
    const messagesQuery = query(
      collection(db, `chatRooms/${activeRoomId}/messages`),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      markChatRead(activeRoomId, user.uid);
    });
    return () => unsubscribe();
  }, [activeRoomId, user]);

  // Search users for new message
  useEffect(() => {
    if (!searchQuery.trim() && isSearchingUsers) {
      setUserSearchResults([]);
      return;
    }
    if (!isSearchingUsers) return;
    
    const delaySearch = setTimeout(async () => {
      try {
        const qStr = searchQuery.toLowerCase();
        const usersQ = query(
          collection(db, 'profiles'),
          orderBy('username'),
          startAt(qStr),
          endAt(qStr + '\uf8ff'),
          limit(10)
        );
        const usersSnap = await getDocs(usersQ);
        setUserSearchResults(
            usersSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as UserProfile))
                .filter(p => p.id !== user?.uid)
        );
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchQuery, isSearchingUsers, user]);

  const handleStartChat = async (otherUserId: string) => {
    if (!user) return;
    const roomId = await getOrCreateChatRoom(user.uid, otherUserId);
    setIsSearchingUsers(false);
    setSearchQuery('');
    setActiveRoomId(roomId);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeRoomId || !user) return;
    const content = newMessage;
    setNewMessage('');
    await sendMessage(activeRoomId, user.uid, content);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId || !user) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `chats/${activeRoomId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await sendMessage(activeRoomId, user.uid, '', url);
    } catch (err) {
      console.error("Failed to upload media", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAudioSent = async (audioUrl: string) => {
    if (!activeRoomId || !user) return;
    await sendAudioMessage(activeRoomId, user.uid, audioUrl);
    setShowVoiceRecorder(false);
  };

  const formatMessageTime = (ts: number) => {
    if (isToday(ts)) return format(ts, 'h:mm a');
    if (isYesterday(ts)) return 'Yesterday';
    return format(ts, 'MMM d');
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // Filter logic
  const filteredRooms = rooms.filter(room => {
    if (activeFilter === 'Primary') return true; // Primary is all main chats in this simple mock
    if (activeFilter === 'Requests') return false; // Mocking empty for now
    if (activeFilter === 'General') return false; // Mocking empty for now
    // For "All", apply local search on display name
    if (searchQuery && !isSearchingUsers) {
      const queryLower = searchQuery.toLowerCase();
      const matchName = room.otherUser?.displayName?.toLowerCase().includes(queryLower);
      const matchUsername = room.otherUser?.username?.toLowerCase().includes(queryLower);
      return matchName || matchUsername;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto w-full bg-black border-x border-q-surface-border relative">
      
      
      
      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowMap(false)}>
          <div className="bg-q-surface border border-q-surface-border rounded-3xl w-full max-w-sm p-6 space-y-4 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-q-panel rounded-full flex items-center justify-center mx-auto mb-2 border border-q-surface-border">
              <Map className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Enable Location</h2>
            <p className="text-sm text-q-text-muted">
              Allow Q to access your location to see friends on the map.
            </p>
            <div className="flex items-center justify-between mt-4 space-x-2 pt-2">
              <button type="button" onClick={() => setShowMap(false)} className="px-4 py-3 rounded-xl bg-q-panel text-white font-medium hover:bg-q-surface-border transition-colors flex-1">
                Not now
              </button>
              <button type="button" onClick={() => setShowMap(false)} className="px-4 py-3 rounded-xl bg-q-primary text-black font-medium hover:opacity-90 transition-opacity flex-1">
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editing Modal */}
      {isEditingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditingNote(false)}>
          <div className="bg-q-surface border border-q-surface-border rounded-3xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white text-center">Your note</h2>
            <form onSubmit={handleSaveNote}>
              <input
                autoFocus
                type="text"
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Make this space yours..."
                maxLength={60}
                className="w-full bg-black border border-q-surface-border text-white text-center py-3 px-4 rounded-xl outline-none focus:border-q-primary transition-all"
              />
              <div className="flex items-center justify-between mt-4 space-x-2">
                <button type="button" onClick={handleDeleteNote} className="px-4 py-2 rounded-xl text-red-500 font-medium hover:bg-q-panel transition-colors flex-1">
                  Delete
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-q-primary text-black font-medium hover:opacity-90 transition-opacity flex-1">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------- INBOX VIEW -------------------- */}
      <div className={cn("flex flex-col h-full w-full absolute inset-0 z-10 transition-transform", activeRoomId ? "-translate-x-full" : "translate-x-0")}>
        
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-q-surface-border sticky top-0 bg-black/90 backdrop-blur-xl z-20 pt-safe-top">
          <button className="text-white hover:text-q-primary -ml-2 p-2 transition-colors">
             <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-1 cursor-pointer hover:opacity-80 transition-opacity">
            <span className="font-bold text-lg text-white">{profile?.username || 'Messages'}</span>
            <ChevronDown className="w-4 h-4 text-white" />
            <span className="w-2 h-2 bg-red-500 rounded-full ml-1" />
          </div>

          <div className="flex items-center space-x-2 -mr-2">
            <button className="p-2 text-white hover:text-q-primary transition-colors">
              <Activity className="w-6 h-6" />
            </button>
            <button 
              onClick={() => {
                setIsSearchingUsers(true);
                setSearchQuery('');
              }}
              className="p-2 text-white hover:text-q-primary transition-colors"
            >
              <Edit className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-5 h-5 text-q-text-muted" />
            <input
              type="text"
              placeholder={isSearchingUsers ? "Search people on Q" : "Search or ask Q AI"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-q-surface border border-q-surface-border text-white pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-q-primary focus:bg-black transition-all"
            />
          </div>
        </div>

        {!isSearchingUsers ? (
          <>
            {/* Quick Access */}
            <div className="px-4 py-4 flex space-x-6 overflow-x-auto hide-scrollbar border-b border-q-surface-border">
              {/* Your Note */}
              <div className="flex flex-col items-center space-y-1 relative cursor-pointer group flex-shrink-0" onClick={() => { setNoteInput(myNote || ''); setIsEditingNote(true); }}>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-q-surface-border group-hover:border-q-primary transition-colors">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-q-panel flex items-center justify-center font-bold text-q-primary text-2xl">
                        {profile?.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-3 -right-8 bg-q-surface border border-q-surface-border rounded-2xl px-3 py-1.5 text-[11px] text-q-text-muted whitespace-nowrap shadow-xl font-medium z-10">
                    {myNote || 'Make this space yours...'}
                  </div>
                  <div className="absolute -bottom-1 right-0 w-6 h-6 bg-q-surface rounded-full flex items-center justify-center border-2 border-black">
                    <Plus className="w-3.5 h-3.5 text-q-text-muted" />
                  </div>
                </div>
                <span className="text-xs text-q-text-muted font-medium mt-1">Your note</span>
                <span className="text-[9px] text-q-text-muted">Location off</span>
              </div>

              {/* Map */}
              <div className="flex flex-col items-center space-y-1 cursor-pointer group flex-shrink-0" onClick={() => setShowMap(true)}>
                <div className="w-16 h-16 rounded-full bg-q-surface border border-q-surface-border flex items-center justify-center overflow-hidden group-hover:border-q-primary transition-colors relative">
                   {/* Map preview visual mock */}
                   <Map className="w-7 h-7 text-white z-10" />
                   <div className="absolute inset-0 bg-blue-500/10" />
                </div>
                <span className="text-xs text-q-text-muted font-medium mt-1">Map</span>
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 flex items-center space-x-2 overflow-x-auto hide-scrollbar border-b border-q-surface-border">
              {['All', 'Primary', 'Requests', 'General'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors border",
                    activeFilter === filter 
                      ? "bg-q-primary text-black border-q-primary" 
                      : "bg-q-surface text-q-text-muted border-q-surface-border hover:border-q-primary hover:text-white"
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingRooms ? (
                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 text-q-primary animate-spin" /></div>
              ) : filteredRooms.length > 0 ? (
                filteredRooms.map(room => {
                  const unreadCount = room.unreadCount?.[user?.uid || ''] || 0;
                  const isUnread = unreadCount > 0;
                  return (
                    <div 
                      key={room.id}
                      onClick={() => setActiveRoomId(room.id)}
                      className="relative flex items-center space-x-3 px-4 py-4 hover:bg-q-surface cursor-pointer transition-colors active:bg-q-panel"
                      onContextMenu={(e) => handleContextMenu(e, room.id)}
                    >
                      <div className="w-14 h-14 rounded-full bg-q-panel border border-q-surface-border flex items-center justify-center text-xl font-bold text-q-primary flex-shrink-0 overflow-hidden relative">
                        {room.otherUser?.photoURL ? (
                          <img src={room.otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          room.otherUser?.displayName?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      
                      {contextMenuRoomId === room.id && (
                        <div className="absolute top-12 right-4 z-50 w-48 bg-q-panel border border-q-surface-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                           <div className="flex flex-col text-sm text-white">
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Mark as unread</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Mute</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Archive</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors text-red-500" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Delete</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors text-red-500" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Report</button>
                              <button className="px-4 py-3 text-left hover:bg-q-surface transition-colors text-red-500" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }}>Block</button>
                           </div>
                        </div>
                      )}
                      
                      {/* Click outside to close */}
                      {contextMenuRoomId === room.id && (
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setContextMenuRoomId(null); }} />
                      )}
  
<div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between">
                          <span className={cn("truncate text-base", isUnread ? "font-bold text-white" : "font-medium text-white")}>
                            {room.otherUser?.displayName || 'Unknown User'}
                          </span>
                          {room.lastMessageTime && (
                            <span className={cn("text-xs ml-2 flex-shrink-0", isUnread ? "text-white font-bold" : "text-q-text-muted")}>
                              {formatMessageTime(room.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className={cn("truncate text-sm pr-2", isUnread ? "font-bold text-white" : "text-q-text-muted")}>
                            {room.lastMessage || 'Started a conversation'}
                          </span>
                          {isUnread && (
                            <span className="w-2.5 h-2.5 bg-q-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                  <div className="w-20 h-20 rounded-full border border-q-surface-border flex items-center justify-center mb-6">
                    <Edit className="w-8 h-8 text-q-text-muted" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Your inbox is quiet.</h3>
                  <p className="text-q-text-muted mb-6">Start a conversation with someone on Q.</p>
                  <button 
                    onClick={() => {
                      setIsSearchingUsers(true);
                      setSearchQuery('');
                    }}
                    className="px-6 py-3 bg-q-surface text-white hover:bg-q-panel rounded-full transition-colors border border-q-surface-border font-medium"
                  >
                    Find people
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* New Message Search Results */
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-q-surface-border flex justify-between items-center">
              <span className="text-white font-bold">Suggested</span>
              <button onClick={() => setIsSearchingUsers(false)} className="text-q-text-muted text-sm hover:text-white">Cancel</button>
            </div>
            {userSearchResults.map(u => (
              <div 
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-q-surface cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-q-panel flex items-center justify-center font-bold text-white">
                  {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : (u.displayName?.[0] || '?')}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">{u.displayName}</span>
                  <span className="text-q-text-muted text-xs">@{u.username}</span>
                </div>
              </div>
            ))}
            {searchQuery && userSearchResults.length === 0 && (
               <div className="p-4 text-center text-q-text-muted">No users found.</div>
            )}
          </div>
        )}
      </div>


      {/* -------------------- CHAT VIEW -------------------- */}
      <div className={cn("flex flex-col h-full w-full absolute inset-0 z-20 bg-black transition-transform", activeRoomId ? "translate-x-0" : "translate-x-full")}>
        {activeRoomId && (
          <>
            {/* Chat Header */}
            <div className="px-2 py-3 flex items-center justify-between border-b border-q-surface-border bg-black/90 backdrop-blur-xl sticky top-0 z-30 pt-safe-top">
              <div className="flex items-center">
                <button 
                  onClick={() => setActiveRoomId(null)}
                  className="p-2 text-white hover:bg-q-surface rounded-full transition-colors mr-1"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <div className="w-10 h-10 rounded-full bg-q-panel border border-q-surface-border flex items-center justify-center text-q-primary font-bold overflow-hidden relative">
                  {activeRoom?.otherUser?.photoURL ? (
                    <img src={activeRoom.otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    activeRoom?.otherUser?.displayName?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <div className="ml-3 flex flex-col justify-center">
                  <span className="font-bold text-white leading-tight">{activeRoom?.otherUser?.displayName}</span>
                </div>
              </div>
              <button className="p-2 text-white hover:bg-q-surface rounded-full transition-colors mr-2">
                <MoreVertical className="w-6 h-6" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === user?.uid;
                const showTime = i === 0 || msg.createdAt - messages[i-1].createdAt > 5 * 60 * 1000;
                return (
                  <div key={msg.id} className="space-y-1">
                    {showTime && (
                      <div className="text-center text-xs font-medium text-q-text-muted my-4">
                        {format(msg.createdAt, 'MMM d, h:mm a')}
                      </div>
                    )}
                    <div className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] overflow-hidden",
                        isMe 
                          ? "bg-q-primary text-black rounded-2xl rounded-tr-sm" 
                          : "bg-q-surface border border-q-surface-border text-white rounded-2xl rounded-tl-sm"
                      )}>
                        {msg.mediaUrl ? (
                          <div className="relative">
                            {msg.mediaUrl.match(/\.(mp4|webm)$/i) || msg.mediaUrl.includes('video') ? (
                              <video src={msg.mediaUrl} controls className="max-w-full max-h-64 object-contain" />
                            ) : msg.audioUrl ? (
                              <div className="p-3">
                                <div className="flex items-center space-x-2 font-medium text-sm mb-2">
                                  <Mic className="w-4 h-4" /> <span>Voice Note</span>
                                </div>
                                <audio src={msg.audioUrl} controls className="h-8 max-w-[200px]" />
                              </div>
                            ) : (
                              <img src={msg.mediaUrl} alt="Attachment" className="max-w-full max-h-64 object-cover" />
                            )}
                          </div>
                        ) : null}
                        
                        {msg.content && (
                          <div className="px-4 py-2.5 text-[15px] leading-relaxed">
                            {msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-q-surface-border bg-black pb-safe">
              {showVoiceRecorder ? (
                <VoiceRecorder 
                   userId={user!.uid} 
                   onAudioSent={handleAudioSent} 
                   onCancel={() => setShowVoiceRecorder(false)} 
                />
              ) : (
                <div className="flex items-center space-x-2 w-full">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2.5 rounded-full bg-q-surface text-white hover:bg-q-panel transition-colors flex-shrink-0"
                  >
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                  </button>
                  
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                      placeholder="Message..."
                      className="w-full bg-q-surface border border-q-surface-border rounded-full py-3 px-5 text-white outline-none focus:border-q-primary/50 transition-all placeholder:text-q-text-muted"
                    />
                  </div>

                  {newMessage.trim() ? (
                    <button 
                      onClick={() => handleSendMessage()}
                      className="p-2.5 rounded-full bg-q-primary text-black hover:opacity-90 transition-opacity flex-shrink-0"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowVoiceRecorder(true)}
                      className="p-2.5 rounded-full bg-q-surface text-white hover:bg-q-panel transition-colors flex-shrink-0"
                    >
                      <Mic className="w-6 h-6" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
