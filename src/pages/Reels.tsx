import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getReelsFeed } from '../features/posts/postService';
import { Post, UserProfile } from '../types';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import Reel from '../components/Reel';
import { Link } from 'react-router-dom';

export default function Reels() {
  const { profile } = useAuth();
  
  const [feedType, setFeedType] = useState<'for-you' | 'following'>('for-you');
  const [reels, setReels] = useState<(Post & { author?: UserProfile })[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchReels = async (isLoadMore = false, type = feedType) => {
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
      const { posts: newReels, lastDoc: newLastDoc } = await getReelsFeed(profile, 5, type, currentLastDoc);
      
      if (isLoadMore) {
        setReels(prev => [...prev, ...newReels]);
      } else {
        setReels(newReels);
        setActiveIndex(0);
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      }
      
      setLastDoc(newLastDoc);
      setHasMore(newReels.length === 5);
    } catch (error) {
      console.error('Failed to fetch reels:', error);
      setError("Couldn't load reels");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReels(false, feedType);
  }, [profile, feedType]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = scrollContainerRef.current;
    
    // Determine active index
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }

    // Load more when near bottom
    if (scrollHeight - scrollTop - clientHeight < clientHeight && hasMore && !loading && !loadingMore) {
      fetchReels(true);
    }
  };

  return (
    <div className="relative w-full h-full md:h-screen md:max-w-[450px] md:mx-auto bg-black overflow-hidden flex flex-col">
      {/* Overlay Header */}
      <div className="absolute top-0 inset-x-0 z-30 pt-safe-top">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/create" className="p-2 -ml-2 text-white hover:text-q-primary transition-colors drop-shadow-md rounded-full hover:bg-white/10">
            <Plus className="w-6 h-6 stroke-[2px]" />
          </Link>
          <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-full text-sm font-medium border border-white/10 shadow-black drop-shadow-lg">
            <button 
              onClick={() => setFeedType('for-you')}
              className={cn("px-4 py-1.5 rounded-full transition-all text-white", feedType === 'for-you' ? "bg-white/20 shadow-sm" : "opacity-60 hover:opacity-100")}
            >
              For You
            </button>
            <button 
              onClick={() => setFeedType('following')}
              className={cn("px-4 py-1.5 rounded-full transition-all text-white", feedType === 'following' ? "bg-white/20 shadow-sm" : "opacity-60 hover:opacity-100")}
            >
              Following
            </button>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Reels Scroll Container */}
      {error ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-white flex-col">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <span className="text-red-500 font-bold">!</span>
          </div>
          <p>{error}</p>
          <button onClick={() => fetchReels(false, feedType)} className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center text-white bg-q-surface">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : reels.length > 0 ? (
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative"
        >
          {reels.map((reel, index) => (
            <Reel key={reel.id} post={reel} isActive={index === activeIndex} />
          ))}
          {loadingMore && (
            <div className="w-full h-screen snap-center flex items-center justify-center bg-black">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white bg-q-surface">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
            <span className="text-4xl opacity-50">🎬</span>
          </div>
          <h3 className="text-xl font-bold mb-2">No Reels {feedType === 'following' ? 'from your network' : ''} yet.</h3>
          <p className="text-white/60 mb-8 max-w-xs">
             Discover short-form videos from creators you follow, or explore trending content.
          </p>
          <Link to="/explore" className="px-8 py-3 bg-q-primary text-black rounded-full font-bold hover:scale-105 transition-transform">
            Explore creators
          </Link>
        </div>
      )}
    </div>
  );
}
