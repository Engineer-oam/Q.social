import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, EyeOff, ShieldAlert, Ban, Info, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post, UserProfile } from '../types';
import { useAuth } from '../features/auth/AuthContext';
import { toggleInteraction, hasInteracted } from '../features/posts/interactionService';
import { doc } from 'firebase/firestore';
import { db } from '../lib/firebase';


import { cn } from '../lib/utils';
import Comments from './Comments';
import { motion, AnimatePresence } from 'motion/react';

interface PostCardProps {
  key?: React.Key;
  post: Post & { author?: UserProfile; reason?: string };
  onHide?: () => void;
}

export default function PostCard({ post, onHide }: PostCardProps) {
  const { profile } = useAuth();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  
  const [isSaved, setIsSaved] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReason, setShowReason] = useState(false);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);


  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'posts', post.id));
        if (onHide) onHide();
      } catch (err) {
        console.error("Failed to delete post", err);
      }
    }
  };

  useEffect(() => {

    if (!profile) return;
    
const checkInteractions = async () => {
      const liked = await hasInteracted('likes', post.id, profile.id);
      setIsLiked(liked);
      const saved = await hasInteracted('saves', post.id, profile.id);
      setIsSaved(saved);
    };
    checkInteractions();
  }, [profile, post.id]);

  const handleLike = async () => {
    if (!profile) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    const postRef = doc(db, 'posts', post.id);
await toggleInteraction('likes', post.id, profile.id, postRef);
  };

  const handleSave = async () => {
    if (!profile) return;
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);
    await toggleInteraction('saves', post.id, profile.id);
    setShowMenu(false);
  };
  
  const handleHide = async () => {
    if (!profile) return;
    await toggleInteraction('hides', post.id, profile.id);
    if (onHide) onHide();
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author?.displayName}`,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  // Render content with # and @ linked (visual only for now)
  const renderContent = (content: string) => {
    return content.split(/(\s+)/).map((word, i) => {
      if (word.startsWith('#') || word.startsWith('@')) {
        return <span key={i} className="text-q-primary cursor-pointer hover:underline">{word}</span>;
      }
      return word;
    });
  };

  return (
    <div className="glass p-5 rounded-2xl space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between relative">
        <div className="flex items-center space-x-3 cursor-pointer group">
          {post.author?.photoURL ? (
            <img src={post.author.photoURL} alt={post.author.displayName} className="w-10 h-10 rounded-full object-cover border border-q-surface-border" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-q-primary/20 to-q-panel border border-q-surface-border flex items-center justify-center text-q-primary font-bold">
              {post.author?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <div className="font-medium text-white group-hover:underline flex items-center space-x-1">
              <span>{post.author?.displayName || 'Unknown User'}</span>
              {/* Optional verification badge could go here */}
            </div>
            <div className="text-sm text-q-text-muted">
              @{post.author?.username || 'user'} • {formatDistanceToNow(post.createdAt)} ago
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-q-text-muted hover:text-white rounded-full hover:bg-q-surface transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-2 w-56 bg-q-panel border border-q-surface-border rounded-xl shadow-2xl z-40 overflow-hidden"
              >
                <button onClick={handleSave} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-q-surface text-white text-sm transition-colors text-left">
                  <Bookmark className={cn("w-4 h-4", isSaved && "fill-current text-q-primary")} />
                  <span>{isSaved ? 'Remove from Saved' : 'Save Post'}</span>
                </button>
                <button onClick={handleHide} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-q-surface text-white text-sm transition-colors text-left border-t border-q-surface-border">
                  <EyeOff className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">Not interested</span>
                </button>
                {post.reason && (
                  <button onClick={() => { setShowReason(true); setShowMenu(false); }} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-q-surface text-white text-sm transition-colors text-left">
                    <Info className="w-4 h-4" />
                    <span>Why am I seeing this?</span>
                  </button>
                )}
                
                {profile?.id === post.userId && (
                  <button onClick={handleDelete} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-q-surface text-red-500 text-sm transition-colors text-left border-t border-q-surface-border">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Post</span>
                  </button>
                )}
<button onClick={() => setShowMenu(false)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-q-surface text-white text-sm transition-colors text-left border-t border-q-surface-border">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Report</span>
                </button>
                <button onClick={() => setShowMenu(false)} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-q-surface text-white text-sm transition-colors text-left">
                  <Ban className="w-4 h-4" />
                  <span>Block @{post.author?.username}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Reason Banner */}
      <AnimatePresence>
        {showReason && post.reason && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-q-primary/10 border border-q-primary/20 rounded-xl p-3 flex items-start space-x-3"
          >
            <Info className="w-5 h-5 text-q-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{post.reason}</p>
              <button onClick={() => setShowReason(false)} className="text-xs text-q-primary hover:underline mt-1">Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {post.content && (
        <p className="text-q-text whitespace-pre-wrap">{renderContent(post.content)}</p>
      )}

      {/* Media Carousel */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className="relative rounded-xl overflow-hidden bg-black max-h-[600px] flex items-center justify-center">
          {post.mediaUrls[activeMediaIndex].match(/\.(mp4|webm)$/i) ? (
             <video src={post.mediaUrls[activeMediaIndex]} controls className="max-w-full max-h-[600px] object-contain" />
          ) : (
             <img src={post.mediaUrls[activeMediaIndex]} alt="Post media" className="max-w-full max-h-[600px] object-contain" loading="lazy" />
          )}
          
          {post.mediaUrls.length > 1 && (
            <>
              {/* Controls */}
              <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-r from-black/50 to-transparent" onClick={() => setActiveMediaIndex(prev => prev > 0 ? prev - 1 : prev)}>
                {activeMediaIndex > 0 && <span className="text-white text-2xl font-bold drop-shadow-md">‹</span>}
              </div>
              <div className="absolute inset-y-0 right-0 w-12 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-l from-black/50 to-transparent" onClick={() => setActiveMediaIndex(prev => prev < post.mediaUrls.length - 1 ? prev + 1 : prev)}>
                {activeMediaIndex < post.mediaUrls.length - 1 && <span className="text-white text-2xl font-bold drop-shadow-md">›</span>}
              </div>
              {/* Indicator */}
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-xs font-medium text-white">
                {activeMediaIndex + 1}/{post.mediaUrls.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-6 pt-2 border-t border-q-surface-border text-q-text-muted">
        <button onClick={handleLike} className={cn("flex items-center space-x-2 transition-colors group", isLiked ? "text-q-primary" : "hover:text-q-primary")}>
          <div className={cn("p-2 rounded-full transition-colors", isLiked ? "bg-q-primary/10" : "group-hover:bg-q-primary/10")}>
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
          </div>
          <span className="text-sm font-medium">{likesCount}</span>
        </button>
        <button onClick={() => setShowComments(true)} className="flex items-center space-x-2 hover:text-white transition-colors group">
          <div className="p-2 rounded-full group-hover:bg-q-surface transition-colors">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">{post.commentsCount || 0}</span>
        </button>
        <button onClick={handleShare} className="flex items-center space-x-2 hover:text-white transition-colors group">
          <div className="p-2 rounded-full group-hover:bg-q-surface transition-colors">
            <Share2 className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">{post.sharesCount || 0}</span>
        </button>
        <div className="flex-1" />
        <button onClick={handleSave} className={cn("flex items-center space-x-2 transition-colors group", isSaved ? "text-q-primary" : "hover:text-white")}>
          <div className={cn("p-2 rounded-full transition-colors", isSaved ? "bg-q-primary/10" : "group-hover:bg-q-surface")}>
            <Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />
          </div>
        </button>
      </div>

      {/* Comments overlay (inside card for now, or could be a portal) */}
      <AnimatePresence>
        {showComments && (
           <div className="mt-4 relative h-96">
             <Comments postId={post.id} onClose={() => setShowComments(false)} onCommentAdded={() => {}} />
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
