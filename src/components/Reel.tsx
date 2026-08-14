import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, UserPlus } from 'lucide-react';
import { Post, UserProfile } from '../types';
import { useAuth } from '../features/auth/AuthContext';
import { toggleInteraction, hasInteracted } from '../features/posts/interactionService';
import { doc } from 'firebase/firestore';
import { db } from '../lib/firebase';


import { cn } from '../lib/utils';
import Comments from './Comments';
import { AnimatePresence } from 'motion/react';

interface ReelProps {
  key?: React.Key;
  post: Post & { author?: UserProfile };
  isActive: boolean;
}

export default function Reel({ post, isActive }: ReelProps) {
  const { profile } = useAuth();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Find the first video URL
  const videoUrl = post.mediaUrls?.find(url => url.match(/\.(mp4|webm)$/i) || url.includes('video')) || post.mediaUrls?.[0];

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

  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      videoRef.current?.play().catch(e => console.log('Autoplay prevented', e));
    } else {
      setIsPlaying(false);
      videoRef.current?.pause();
      if (videoRef.current) {
         videoRef.current.currentTime = 0;
      }
    }
  }, [isActive]);

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play().catch(e => console.log('Play prevented', e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    const postRef = doc(db, 'posts', post.id);
await toggleInteraction('likes', post.id, profile.id, postRef);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) return;
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);
    await toggleInteraction('saves', post.id, profile.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: `Reel by ${post.author?.displayName}`,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const renderCaption = (content: string) => {
    return content.split(/(\s+)/).map((word, i) => {
      if (word.startsWith('#') || word.startsWith('@')) {
        return <span key={i} className="font-bold text-white cursor-pointer">{word}</span>;
      }
      return word;
    });
  };

  return (
    <div className="relative w-full h-full snap-center bg-black flex items-center justify-center overflow-hidden">
      {/* Video */}
      <div className="absolute inset-0 w-full h-full" onClick={togglePlay}>
        <video 
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          loop
          playsInline
        />
        {/* Play/Pause overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md">
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-white border-b-[10px] border-b-transparent ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent">
        <div className="p-4 pb-20 md:pb-6 flex items-end justify-between w-full">
          {/* Bottom Left Info */}
          <div className="flex-1 pr-12 pointer-events-auto">
            <div className="flex items-center space-x-3 mb-3">
              {post.author?.photoURL ? (
                <img src={post.author.photoURL} alt={post.author.displayName} className="w-10 h-10 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-q-surface flex items-center justify-center text-white font-bold border border-white/20">
                  {post.author?.displayName?.[0]}
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-[15px] hover:underline cursor-pointer">
                    {post.author?.displayName}
                  </span>
                  {profile?.following && !profile.following.includes(post.author?.id || '') && post.author?.id !== profile?.id && (
                    <button className="flex items-center space-x-1 px-2 py-0.5 border border-white/40 rounded-full text-xs font-bold text-white backdrop-blur-sm">
                      <UserPlus className="w-3 h-3" />
                      <span>Follow</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {post.content && (
              <p className="text-white text-sm line-clamp-3 mb-2 shadow-black drop-shadow-md">
                {renderCaption(post.content)}
              </p>
            )}
            
            {/* Audio Info (Mocked for now since not in Post schema) */}
            <div className="flex items-center space-x-2 text-white/90 text-xs mt-2 overflow-hidden">
              <span className="inline-block animate-[spin_3s_linear_infinite]">🎵</span>
              <div className="overflow-hidden whitespace-nowrap mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)">
                <span className="inline-block px-2">Original Audio - {post.author?.displayName}</span>
              </div>
            </div>
          </div>

          {/* Right Action Stack */}
          <div className="flex flex-col items-center space-y-6 pointer-events-auto mb-4">
            <button onClick={handleLike} className="flex flex-col items-center group">
              <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-md mb-1 transition-transform active:scale-90">
                <Heart className={cn("w-7 h-7 transition-colors", isLiked ? "fill-q-primary text-q-primary" : "text-white group-hover:text-q-primary")} />
              </div>
              <span className="text-white text-xs font-bold shadow-black drop-shadow-md">{likesCount}</span>
            </button>
            
            <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center group">
              <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-md mb-1 transition-transform active:scale-90">
                <MessageCircle className="w-7 h-7 text-white group-hover:text-white/80" />
              </div>
              <span className="text-white text-xs font-bold shadow-black drop-shadow-md">{post.commentsCount || 0}</span>
            </button>
            
            <button onClick={handleSave} className="flex flex-col items-center group">
              <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-md mb-1 transition-transform active:scale-90">
                <Bookmark className={cn("w-7 h-7 transition-colors", isSaved ? "fill-q-primary text-q-primary" : "text-white group-hover:text-white/80")} />
              </div>
            </button>
            
            <button onClick={handleShare} className="flex flex-col items-center group">
              <div className="w-12 h-12 bg-black/20 rounded-full flex items-center justify-center backdrop-blur-md transition-transform active:scale-90">
                <Share2 className="w-7 h-7 text-white group-hover:text-white/80" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showComments && (
          <div className="absolute inset-0 z-50 md:top-auto md:h-2/3 md:rounded-t-3xl overflow-hidden bg-black/90 pointer-events-auto">
             <Comments postId={post.id} onClose={() => setShowComments(false)} onCommentAdded={() => {}} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
