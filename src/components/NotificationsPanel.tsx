import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, MessageCircle, UserPlus, Bell } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  actorId: string;
  actorName: string;
  actorPhotoUrl?: string;
  postId?: string;
  postImageUrl?: string;
  text?: string;
  read: boolean;
  createdAt: number;
}

export default function NotificationsPanel({ 
  isOpen, 
  onClose,
  setUnreadCount
}: { 
  isOpen: boolean; 
  onClose: () => void;
  setUnreadCount: (count: number) => void;
}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Subscribe to notifications
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const notifs: Notification[] = [];
      let unread = 0;
      snap.forEach(doc => {
        const data = doc.data() as Notification;
        notifs.push({ ...data, id: doc.id });
        if (!data.read) unread++;
      });
      setNotifications(notifs);
      setUnreadCount(unread);
      setLoading(false);
    }, (err) => {
      console.error("Failed to fetch notifications:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [user, setUnreadCount]);

  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      // Mark as read
      const unreadNotifs = notifications.filter(n => !n.read);
      if (unreadNotifs.length > 0) {
        const markAsRead = async () => {
          const batch = writeBatch(db);
          unreadNotifs.forEach(n => {
            const ref = doc(db, 'notifications', n.id);
            batch.update(ref, { read: true });
          });
          try {
            await batch.commit();
          } catch (e) {
            console.error("Failed to mark notifications as read", e);
          }
        };
        markAsRead();
      }
    }
  }, [isOpen, notifications]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-q-panel border-l border-q-surface-border shadow-2xl z-50 flex flex-col pt-safe-top"
          >
            <div className="flex items-center justify-between p-4 border-b border-q-surface-border">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notifications
              </h2>
              <button 
                onClick={onClose}
                aria-label="Close notifications"
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-q-surface rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-safe">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-q-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-q-surface flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-q-text-muted" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No notifications yet</h3>
                  <p className="text-q-text-muted">When someone interacts with you, you'll see it here.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 p-4 border-b border-q-surface-border/50 hover:bg-q-surface transition-colors",
                        !notif.read && "bg-q-primary/5"
                      )}
                    >
                      <Link to={`/profile/${notif.actorId}`} onClick={onClose}>
                        <div className="relative">
                          {notif.actorPhotoUrl ? (
                            <img src={notif.actorPhotoUrl} alt={notif.actorName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-q-surface flex items-center justify-center font-bold text-white border border-q-surface-border">
                              {notif.actorName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-q-panel rounded-full flex items-center justify-center">
                            {notif.type === 'like' && <Heart className="w-3 h-3 text-red-500 fill-red-500" />}
                            {notif.type === 'comment' && <MessageCircle className="w-3 h-3 text-blue-500 fill-blue-500" />}
                            {notif.type === 'follow' && <UserPlus className="w-3 h-3 text-q-primary" />}
                            {notif.type === 'system' && <Bell className="w-3 h-3 text-yellow-500" />}
                          </div>
                        </div>
                      </Link>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-q-text">
                          <Link to={`/profile/${notif.actorId}`} onClick={onClose} className="font-bold text-white hover:underline mr-1">
                            {notif.actorName}
                          </Link>
                          {notif.type === 'like' && 'liked your post.'}
                          {notif.type === 'comment' && `commented: "${notif.text}"`}
                          {notif.type === 'follow' && 'started following you.'}
                          {notif.type === 'system' && notif.text}
                        </p>
                        <span className="text-xs text-q-text-muted mt-1 block">
                          {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                        </span>
                      </div>

                      {notif.postId && (
                        <Link to={`/post/${notif.postId}`} onClick={onClose} className="shrink-0">
                          {notif.postImageUrl ? (
                            <img src={notif.postImageUrl} alt="Post" className="w-10 h-10 rounded object-cover border border-q-surface-border" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-q-surface" />
                          )}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
