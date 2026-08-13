import React, { useEffect, useState, useRef } from 'react';
import { Search as SearchIcon, X, Loader2, Play } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { getExplorePosts } from '../features/posts/postService';
import { Post, UserProfile } from '../types';
import { collection, query, where, getDocs, orderBy, limit, startAt, endAt } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import Reel from '../components/Reel';
import { AnimatePresence, motion } from 'motion/react';

export default function Search() {
  const { profile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Discovery Feed State
  const [discoverPosts, setDiscoverPosts] = useState<(Post & { author?: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search Results State
  const [searchResults, setSearchResults] = useState<(Post & { author?: UserProfile })[]>([]);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // View State for full screen overlays
  const [selectedPost, setSelectedPost] = useState<(Post & { author?: UserProfile }) | null>(null);
  
  useEffect(() => {
    const fetchDiscovery = async () => {
      setLoading(true);
      try {
        const { posts } = await getExplorePosts(profile, 30);
        // Filter out posts without media for the discovery grid
        const mediaPosts = posts.filter(p => p.mediaUrls && p.mediaUrls.length > 0);
        setDiscoverPosts(mediaPosts);
      } catch (err) {
        console.error("Failed to load discovery", err);
        setError("Failed to load discovery feed.");
      } finally {
        setLoading(false);
      }
    };
    fetchDiscovery();
  }, [profile]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      setUserResults([]);
      return;
    }
    
    const delaySearch = setTimeout(async () => {
      setIsSearching(true);
      setSearchLoading(true);
      
      try {
        const qStr = searchQuery.toLowerCase();
        
        // Search users (simple prefix search on username)
        const usersQ = query(
          collection(db, 'profiles'),
          orderBy('username'),
          startAt(qStr),
          endAt(qStr + '\uf8ff'),
          limit(5)
        );
        
        const usersSnap = await getDocs(usersQ);
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
        setUserResults(users);
        
        // Search posts (by checking content client side for now, or hashtag if starts with #)
        // Since Firestore doesn't support full text search natively without extensions, 
        // we will fetch recent posts and filter them, or just use hashtags if applicable.
        const postsQ = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
        const postsSnap = await getDocs(postsQ);
        const posts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        
        const filteredPosts = posts.filter(p => p.content?.toLowerCase().includes(qStr));
        
        // attach authors for search results
        const postsWithAuthors = await Promise.all(filteredPosts.slice(0, 10).map(async (p) => {
            let author;
            const authorDoc = await getDocs(query(collection(db, 'profiles'), where('__name__', '==', p.userId)));
            if (!authorDoc.empty) {
                author = { id: authorDoc.docs[0].id, ...authorDoc.docs[0].data() } as UserProfile;
            }
            return { ...p, author };
        }));
        
        setSearchResults(postsWithAuthors);
        
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setSearchLoading(false);
      }
      
    }, 500); // debounce
    
    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const isVideo = (url?: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm)$/i) || url.includes('video');
  };

  const handlePostClick = (post: Post & { author?: UserProfile }) => {
    setSelectedPost(post);
  };

  return (
    <div className="flex flex-col min-h-screen relative max-w-2xl mx-auto w-full border-x border-q-surface-border bg-black">
      
      {/* Search Header */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-q-surface-border flex flex-col pt-safe-top">
        <div className="px-4 py-3">
          <div className="relative flex items-center">
            <SearchIcon className={cn("absolute left-3 w-5 h-5 transition-colors", searchQuery || isSearching ? "text-q-primary" : "text-q-text-muted")} />
            <input
              type="text"
              placeholder="Search Q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearching(true)}
              className="w-full bg-q-surface border border-q-surface-border text-white pl-10 pr-10 py-2.5 rounded-xl outline-none focus:border-q-primary focus:bg-black transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-q-text-muted hover:text-white rounded-full bg-q-surface hover:bg-q-panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col pb-20 md:pb-0 overflow-y-auto">
        {isSearching && searchQuery ? (
          <div className="p-4 space-y-6">
            {searchLoading ? (
               <div className="flex justify-center p-8">
                 <Loader2 className="w-6 h-6 text-q-primary animate-spin" />
               </div>
            ) : (
               <>
                 {/* Users Results */}
                 {userResults.length > 0 && (
                   <div>
                     <h3 className="text-white font-bold mb-3 px-2">People</h3>
                     <div className="space-y-3">
                       {userResults.map(user => (
                         <Link key={user.id} to={`/profile/${user.id}`} className="flex items-center space-x-3 p-2 hover:bg-q-surface rounded-xl transition-colors">
                           {user.photoURL ? (
                             <img src={user.photoURL} alt={user.username} className="w-12 h-12 rounded-full object-cover border border-q-surface-border" />
                           ) : (
                             <div className="w-12 h-12 rounded-full bg-q-surface flex items-center justify-center text-white font-bold border border-q-surface-border">
                               {user.displayName?.[0] || '?'}
                             </div>
                           )}
                           <div className="flex flex-col">
                             <span className="text-white font-bold text-sm">{user.displayName}</span>
                             <span className="text-q-text-muted text-xs">@{user.username}</span>
                           </div>
                         </Link>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 {/* Posts Results */}
                 {searchResults.length > 0 && (
                   <div>
                     <h3 className="text-white font-bold mb-3 px-2">Posts</h3>
                     <div className="space-y-4">
                       {searchResults.map(post => (
                         <div key={post.id} className="border border-q-surface-border rounded-xl overflow-hidden">
                            <PostCard post={post} />
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 {userResults.length === 0 && searchResults.length === 0 && (
                    <div className="text-center py-12 text-q-text-muted">
                        No results found for "{searchQuery}"
                    </div>
                 )}
               </>
            )}
          </div>
        ) : (
          /* Discovery FYP Grid */
          <div className="p-1">
             {loading ? (
                <div className="flex justify-center p-8">
                 <Loader2 className="w-6 h-6 text-q-primary animate-spin" />
               </div>
             ) : error ? (
                <div className="text-center p-8 text-q-text-muted">{error}</div>
             ) : discoverPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                    {discoverPosts.map((post) => {
                        const hasVideo = isVideo(post.mediaUrls?.[0]);
                        return (
                            <div 
                                key={post.id} 
                                onClick={() => handlePostClick(post)}
                                className="relative aspect-[3/4] bg-q-surface cursor-pointer group overflow-hidden"
                            >
                                {hasVideo ? (
                                    <>
                                        <video 
                                            src={post.mediaUrls?.[0]} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            muted
                                            playsInline
                                        />
                                        <div className="absolute top-2 right-2 text-white drop-shadow-md">
                                            <Play className="w-4 h-4 fill-white" />
                                        </div>
                                    </>
                                ) : (
                                    <img 
                                        src={post.mediaUrls?.[0]} 
                                        alt="Post" 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                )}
                                
                                {/* Engagement overlay on hover (desktop) or always visible minimal stat */}
                                <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-white text-xs font-bold drop-shadow-md">
                                    {hasVideo ? '▶' : '♡'} {hasVideo ? (post.likesCount * 3 + 124).toLocaleString() : post.likesCount.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
             ) : (
                <div className="glass p-8 rounded-2xl text-center space-y-4 m-4 flex flex-col items-center border border-q-surface-border">
                    <div className="w-16 h-16 rounded-full bg-q-surface flex items-center justify-center">
                        <SearchIcon className="w-8 h-8 text-q-text-muted" />
                    </div>
                    <h3 className="text-lg font-medium text-white">Nothing to discover yet.</h3>
                    <p className="text-q-text-muted mb-4 max-w-sm text-center">
                        New posts and Reels will appear here as Q grows.
                    </p>
                    <div className="flex space-x-3 w-full max-w-xs mt-4">
                        <button className="flex-1 py-2.5 rounded-full bg-q-surface text-white font-medium hover:bg-q-panel transition-colors border border-q-surface-border text-sm">
                            Explore creators
                        </button>
                        <button className="flex-1 py-2.5 rounded-full bg-q-surface text-white font-medium hover:bg-q-panel transition-colors border border-q-surface-border text-sm">
                            Explore topics
                        </button>
                    </div>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Full Screen Post Viewer Modal */}
      <AnimatePresence>
          {selectedPost && (
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-50 bg-black flex flex-col"
              >
                  {/* Header */}
                  <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent pt-safe-top">
                      <button 
                        onClick={() => setSelectedPost(null)}
                        className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                      >
                          <X className="w-6 h-6" />
                      </button>
                      <span className="text-white font-bold drop-shadow-md">
                          {isVideo(selectedPost.mediaUrls?.[0]) ? 'Reel' : 'Post'}
                      </span>
                      <div className="w-10"></div> {/* Spacer for balance */}
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto h-full w-full">
                      {isVideo(selectedPost.mediaUrls?.[0]) ? (
                          <div className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-auto hide-scrollbar bg-black">
                              <div className="h-full w-full snap-start relative">
                                  <Reel post={selectedPost} isActive={true} />
                              </div>
                          </div>
                      ) : (
                          <div className="min-h-full flex flex-col items-center justify-center pt-20 pb-20">
                              <div className="w-full max-w-xl">
                                  <PostCard post={selectedPost} />
                              </div>
                          </div>
                      )}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
