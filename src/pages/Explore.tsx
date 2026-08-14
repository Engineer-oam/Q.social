import { db } from "../lib/firebase";
import React, { useEffect, useState, useRef } from 'react';
import { Search as SearchIcon, Filter, ArrowUp, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { getTrendingTopics, getExplorePosts, getSuggestedCreators } from '../features/posts/postService';
import { Post, UserProfile } from '../types';
import PostCard from '../components/PostCard';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';


const TOPICS = ['All', 'Technology', 'Business', 'Design', 'Architecture', 'Science', 'Music', 'Sports', 'Gaming', 'Travel'];

export default function Explore() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  
  const [activeTopic, setActiveTopic] = useState('All');
  const [trending, setTrending] = useState<{tag: string, count: number, trend: number}[]>([]);
  const [creators, setCreators] = useState<UserProfile[]>([]);
  
  const [posts, setPosts] = useState<(Post & { author?: UserProfile; reason?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const observerTarget = useRef(null);
  const [isFollowingMap, setIsFollowingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchDiscoveryData = async () => {
      try {
        const [trendingData, creatorsData] = await Promise.all([
          getTrendingTopics(),
          getSuggestedCreators(profile)
        ]);
        setTrending(trendingData);
        setCreators(creatorsData);
        
        const initialFollowMap: Record<string, boolean> = {};
        creatorsData.forEach(c => {
          initialFollowMap[c.id] = profile?.following?.includes(c.id) || false;
        });
        setIsFollowingMap(initialFollowMap);
      } catch (e) {
        console.error("Failed to fetch discovery components", e);
      }
    };
    fetchDiscoveryData();
  }, [profile]);

  const fetchPosts = async (isLoadMore = false, topic = activeTopic) => {
    if (isLoadMore && !hasMore) return;
    
    if (!isLoadMore) {
      setLoading(true);
      setError(null);
      setPosts([]);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const currentOffset = isLoadMore ? offset : 0;
      const { posts: newPosts, nextOffset: newOffset } = await getExplorePosts(profile, 10, currentOffset, topic);
      
      if (isLoadMore) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      
      setOffset(newOffset);
      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Failed to fetch explore posts:', error);
      setError("Couldn't load discovery content");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(false, activeTopic);
  }, [profile, activeTopic]);

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
  }, [hasMore, loading, loadingMore, offset, activeTopic]);

  const handleTopicClick = (topic: string) => {
    if (topic === activeTopic) return;
    setActiveTopic(topic);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFollow = async (userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const currentlyFollowing = isFollowingMap[userId] || false;
    
    // Optimistic update
    setIsFollowingMap(prev => ({...prev, [userId]: !currentlyFollowing}));
    
    try {
      const profileRef = doc(db, 'profiles', profile.id);
      await updateDoc(profileRef, {
        following: currentlyFollowing ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowingMap(prev => ({...prev, [userId]: currentlyFollowing}));
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative max-w-2xl mx-auto w-full border-x border-q-surface-border bg-black">
      
      {/* Explore Header (Sticky) */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-q-surface-border flex flex-col pt-safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-white">Explore</h1>
          <div className="flex items-center space-x-3">
            <Link to="/search" className="p-2 text-q-text-muted hover:text-white rounded-full hover:bg-q-surface transition-colors">
              <SearchIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        {/* Topic Categories */}
        <div className="px-4 pb-3 overflow-x-auto hide-scrollbar flex items-center space-x-2">
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => handleTopicClick(topic)}
              className={cn(
                "px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors border",
                activeTopic === topic 
                  ? "bg-q-primary text-black border-q-primary" 
                  : "bg-q-surface text-q-text-muted border-q-surface-border hover:border-q-primary hover:text-white"
              )}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col pb-20 md:pb-0">
        
        {/* Search Bar Shortcut */}
        <div className="px-4 py-4">
          <button 
            onClick={() => navigate('/search')}
            className="w-full bg-q-surface border border-q-surface-border rounded-full py-3 px-4 flex items-center text-q-text-muted hover:bg-q-surface/80 hover:border-q-primary transition-all"
          >
            <SearchIcon className="w-5 h-5 mr-3" />
            <span>Search Q</span>
          </button>
        </div>

        {/* Trending Section */}
        {trending.length > 0 && activeTopic === 'All' && (
          <div className="px-4 py-4 border-b border-q-surface-border">
            <h2 className="text-lg font-bold text-white mb-4">Trending on Q</h2>
            <div className="grid grid-cols-2 gap-4">
              {trending.map((trend, i) => (
                <div key={i} className="flex flex-col p-3 bg-q-surface rounded-xl border border-q-surface-border">
                  <span className="text-q-primary font-bold">{trend.tag}</span>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-q-text-muted">
                      {(trend.count * 1234).toLocaleString()} posts
                    </span>
                    <span className="text-xs text-green-400 flex items-center">
                      <ArrowUp className="w-3 h-3 mr-0.5" />
                      {trend.trend}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Creators to Discover */}
        {creators.length > 0 && activeTopic === 'All' && (
          <div className="py-4 border-b border-q-surface-border">
            <h2 className="text-lg font-bold text-white mb-4 px-4">Creators to discover</h2>
            <div className="flex overflow-x-auto hide-scrollbar px-4 space-x-4 pb-2">
              {creators.map(creator => (
                <Link to={`/profile/${creator.id}`} key={creator.id} className="min-w-[140px] w-[140px] bg-q-surface rounded-xl p-4 flex flex-col items-center text-center border border-q-surface-border hover:border-q-primary transition-colors snap-center shrink-0">
                  {creator.photoURL ? (
                    <img src={creator.photoURL} alt={creator.displayName} className="w-16 h-16 rounded-full object-cover mb-3" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-q-panel flex items-center justify-center text-white text-xl font-bold mb-3">
                      {creator.displayName?.[0] || '?'}
                    </div>
                  )}
                  <span className="font-bold text-white text-sm line-clamp-1 w-full">{creator.displayName}</span>
                  <span className="text-xs text-q-text-muted mb-3 w-full line-clamp-1">@{creator.username}</span>
                  
                  <button 
                    onClick={(e) => toggleFollow(creator.id, e)}
                    className={cn(
                      "w-full py-1.5 rounded-full text-xs font-bold transition-colors",
                      isFollowingMap[creator.id]
                        ? "bg-q-panel text-white border border-q-surface-border"
                        : "bg-q-primary text-black"
                    )}
                  >
                    {isFollowingMap[creator.id] ? 'Following' : 'Follow'}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Discovery Content */}
        <div className="p-4 space-y-6">
          <h2 className="text-lg font-bold text-white px-2">Discover</h2>
          
          {error ? (
            <div className="glass p-8 rounded-2xl text-center space-y-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <span className="text-red-500 font-bold">!</span>
              </div>
              <h3 className="text-lg font-medium text-white">{error}</h3>
              <button onClick={() => fetchPosts(false, activeTopic)} className="px-6 py-2 bg-q-surface hover:bg-q-panel text-white rounded-full transition-colors">
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
              
              <div ref={observerTarget} className="h-10 flex items-center justify-center w-full">
                {loadingMore && <Loader2 className="w-6 h-6 text-q-primary animate-spin" />}
                {!hasMore && posts.length > 0 && <span className="text-q-text-muted text-sm">No more content to discover</span>}
              </div>
            </>
          ) : (
             <div className="glass p-8 rounded-2xl text-center space-y-4 mt-4 flex flex-col items-center border border-q-surface-border">
              <div className="w-16 h-16 rounded-full bg-q-surface flex items-center justify-center">
                <SearchIcon className="w-8 h-8 text-q-text-muted" />
              </div>
              <h3 className="text-lg font-medium text-white">Nothing to discover yet.</h3>
              <p className="text-q-text-muted mb-4 max-w-sm text-center">
                New creators and topics will appear here as Q grows.
              </p>
              <button 
                onClick={() => fetchPosts(false, activeTopic)}
                className="px-6 py-2 bg-q-primary text-black font-bold rounded-full transition-colors"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
