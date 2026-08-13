import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import PostCard from '../components/PostCard';
import Stories from '../components/Stories';
import { getFeedPosts } from '../features/posts/postService';
import { Post, UserProfile } from '../types';
import { Loader2, Plus, PlusSquare, Heart, ArrowUp, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import NotificationsPanel from '../components/NotificationsPanel';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const { profile } = useAuth();
  
  const [posts, setPosts] = useState<(Post & { author?: UserProfile; reason?: string })[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const observerTarget = useRef(null);

  const fetchPosts = async (isLoadMore = false) => {
    if (profile === undefined) return;
    if (isLoadMore && !hasMore) return;
    
    if (!isLoadMore) {
      setLoading(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const currentLastDoc = isLoadMore ? lastDoc : undefined;
      const { posts: newPosts, lastDoc: newLastDoc } = await getFeedPosts(profile, 10, 'for-you', currentLastDoc);
      
      // Inject transparency reasons for "for-you"
      const enrichedPosts = newPosts.map(p => {
        let reason = undefined;
        if (profile) {
          const isFollowing = profile.following?.includes(p.userId);
          const sharedInterests = p.author?.interests?.filter(i => profile.interests?.includes(i));
          if (isFollowing) reason = `You follow @${p.author?.username}`;
          else if (sharedInterests && sharedInterests.length > 0) reason = `Because you like ${sharedInterests[0]}`;
        }
        return { ...p, reason };
      });
      
      if (isLoadMore) {
        setPosts(prev => [...prev, ...enrichedPosts]);
      } else {
        setPosts(enrichedPosts);
      }
      
      setLastDoc(newLastDoc);
      setHasMore(newPosts.length === 10);
      setNewPostsAvailable(false);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setError("Couldn't load your feed");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(false);
  }, [profile]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPosts(true);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, lastDoc]);

  const handleRefresh = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchPosts(false);
  };

  return (
    <div className="flex flex-col min-h-screen relative max-w-2xl mx-auto w-full border-x border-q-surface-border">
      
      {/* Home Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl flex flex-col pt-safe-top">
        <div className="flex items-center justify-between px-4 py-3 relative">
          {/* Create Shortcut (Left) */}
          <Link to="/create" className="p-2 -ml-2 text-q-text-muted hover:text-white transition-colors">
            <Plus className="w-7 h-7 stroke-[2.5px]" />
          </Link>

          {/* Logo (Center) */}
          <button onClick={handleRefresh} className="absolute left-1/2 -translate-x-1/2 text-2xl font-black text-white hover:text-q-primary transition-colors">
            Q
          </button>

          {/* Activity / Notifications (Right) */}
          <button 
            onClick={() => setShowNotifications(true)}
            aria-label="Notifications"
            className="relative p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-q-text-muted hover:text-white transition-colors group focus:outline-none focus:ring-2 focus:ring-q-primary rounded-full"
          >
            <Heart className="w-7 h-7 stroke-[2px] group-hover:scale-105 transition-transform group-active:scale-95" />
            {/* Unread badge */}
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 w-full flex flex-col pb-20 md:pb-0">
        {/* Stories Section */}
        <div className="border-b border-q-surface-border">
          <Stories />
        </div>

        {/* New Posts Indicator */}
        <AnimatePresence>
          {newPostsAvailable && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="sticky top-20 z-20 flex justify-center mt-4 pointer-events-none"
            >
              <button 
                onClick={handleRefresh}
                className="pointer-events-auto flex items-center space-x-2 bg-q-primary text-black px-4 py-2 rounded-full font-bold shadow-lg shadow-q-primary/20 hover:scale-105 transition-transform"
              >
                <ArrowUp className="w-4 h-4" />
                <span>New posts</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed */}
        <div className="space-y-6 p-4">
          {error ? (
            <div className="glass p-8 rounded-2xl text-center space-y-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-red-500 font-bold">!</span>
              </div>
              <h3 className="text-lg font-medium text-white">{error}</h3>
              <button onClick={() => fetchPosts(false)} className="px-6 py-2 bg-q-surface hover:bg-q-panel text-white rounded-full transition-colors">
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass p-5 rounded-2xl space-y-4 animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-q-surface" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-q-surface rounded" />
                      <div className="w-24 h-3 bg-q-surface rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-q-surface rounded" />
                    <div className="w-5/6 h-4 bg-q-surface rounded" />
                  </div>
                  <div className="w-full h-64 bg-q-surface rounded-xl" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onHide={() => setPosts(prev => prev.filter(p => p.id !== post.id))}
                />
              ))}
              
              {/* Intersection Observer Target */}
              <div ref={observerTarget} className="h-10 flex items-center justify-center w-full">
                {loadingMore && <Loader2 className="w-6 h-6 text-q-primary animate-spin" />}
                {!hasMore && posts.length > 0 && <span className="text-q-text-muted text-sm">You're all caught up!</span>}
              </div>
            </>
          ) : (
            <div className="glass p-8 rounded-2xl text-center space-y-4 mt-8 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-q-surface flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-medium text-white">Your Q is quiet.</h3>
              <p className="text-q-text-muted mb-4 max-w-sm text-center">
                Follow creators and interests to start building your feed.
              </p>
              <div className="flex flex-col space-y-2 w-full max-w-xs">
                <Link to="/explore" className="w-full py-3 bg-q-primary text-black rounded-full font-bold hover:bg-q-primary-hover transition-colors">
                  Explore creators
                </Link>
                <Link to="/explore?tab=topics" className="w-full py-3 bg-q-surface text-white rounded-full font-bold hover:bg-q-panel transition-colors">
                  Explore topics
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
        setUnreadCount={setUnreadNotifications}
      />
    </div>
  );
}
