import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getFeedPosts } from '../features/posts/postService';
import { Post, UserProfile } from '../types';
import { 
  MapPin, Link as LinkIcon, Loader2, Plus, 
  Menu, ChevronDown, Grid, Clapperboard, 
  Bookmark, Video, X, Camera 
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import EditProfileModal from '../components/profile/EditProfileModal';
import PostCard from '../components/PostCard';
import { cn } from '../lib/utils';
import { db, storage } from '../lib/firebase';
import { doc, updateDoc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Profile() {
  const { profile, user, signOut } = useAuth();
  const { id, username } = useParams();
  const isOtherUser = !!(id || username);
  
  // Real-time profile state
  const [realProfile, setRealProfile] = useState<UserProfile | null>(profile || null);
  const [posts, setPosts] = useState<(Post & { author?: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPost, setSelectedPost] = useState<Post & { author?: UserProfile } | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const navigate = useNavigate();

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time profile updates
  useEffect(() => {
    if (!user) return;
    
    let unsub: () => void;
    let isMounted = true;

    if (isOtherUser) {
      if (id) {
        unsub = onSnapshot(doc(db, 'profiles', id), (doc) => {
          if (doc.exists() && isMounted) {
            setRealProfile({ id: doc.id, ...doc.data() } as UserProfile);
          }
        });
      } else if (username) {
        const fetchByUsername = async () => {
          const q = query(collection(db, 'profiles'), where('username', '==', username));
          const snapshot = await getDocs(q);
          if (!snapshot.empty && isMounted) {
            const docId = snapshot.docs[0].id;
            unsub = onSnapshot(doc(db, 'profiles', docId), (d) => {
              if (d.exists() && isMounted) {
                setRealProfile({ id: d.id, ...d.data() } as UserProfile);
              }
            });
          }
        };
        fetchByUsername();
      }
    } else {
      unsub = onSnapshot(doc(db, 'profiles', user.uid), (doc) => {
        if (doc.exists() && isMounted) {
          setRealProfile({ id: doc.id, ...doc.data() } as UserProfile);
        }
      });
    }

    return () => {
      isMounted = false;
      if (unsub) unsub();
    };
  }, [user, id, username, isOtherUser]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!realProfile) return;
      try {
        const data = await getFeedPosts(realProfile, 100);
        // Filter for this profile's posts
        setPosts(data.posts.filter(p => p.userId === realProfile.id));
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    if (user && realProfile) fetchPosts();
  }, [user]);

  if (!realProfile || !user) return null;

  // Derive contents
  const gridPosts = posts.filter(p => !p.mediaUrls || p.mediaUrls.length === 0 || !p.mediaUrls[0].match(/\.(mp4|webm|mov)$/i));
  const gridReels = posts.filter(p => p.mediaUrls && p.mediaUrls.length > 0 && p.mediaUrls[0].match(/\.(mp4|webm|mov)$/i));
  const gridSaved: any[] = []; // Placeholder for saved content

  const handleEditClick = () => setIsEditing(true);

  

  

  const handleShareProfile = async () => {
    const url = `https://\${window.location.host}/user/\${realProfile.username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `\${realProfile.displayName} on Q`,
          url: url
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Profile link copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white pb-safe overflow-y-auto">
      
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-xl border-b border-q-surface-border pt-safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Create */}
          <button onClick={() => navigate('/create')} className="p-2 -ml-2 text-white hover:text-q-primary transition-colors">
            <Plus className="w-6 h-6 stroke-[2px]" />
          </button>
          
          {/* Center: Username */}
          <div className="flex items-center space-x-1 cursor-pointer">
            <span className="font-bold text-lg">{realProfile.username}</span>
            <ChevronDown className="w-4 h-4 text-q-text-muted" />
            <span className="w-2 h-2 bg-red-500 rounded-full ml-1" />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 -mr-2">
            <button onClick={() => navigate('/settings')} className="p-2 text-white hover:text-q-text-muted transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* PROFILE SUMMARY */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-q-surface-border overflow-hidden bg-q-panel flex items-center justify-center font-bold text-2xl text-q-primary">
              {realProfile.photoURL ? (
                <img src={realProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                realProfile.displayName?.[0]?.toUpperCase()
              )}
            </div>
            {/* Story Add Badge */}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-q-primary rounded-full border-2 border-black flex items-center justify-center cursor-pointer">
              <Plus className="w-4 h-4 text-black stroke-[3px]" />
            </div>
          </div>

          <div className="flex-1 flex justify-around ml-6">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{posts.length}</span>
              <span className="text-xs text-q-text-muted">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{realProfile.followersCount || 0}</span>
              <span className="text-xs text-q-text-muted">Followers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold">{realProfile.followingCount || 0}</span>
              <span className="text-xs text-q-text-muted">Following</span>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-4 space-y-1">
          <h2 className="font-bold text-sm">{realProfile.displayName}</h2>
          {realProfile.bio && (
            <p className="text-sm text-q-text-muted whitespace-pre-wrap">{realProfile.bio}</p>
          )}
          {realProfile.website && (
            <a href={realProfile.website} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-sm text-q-primary mt-1 hover:underline">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{realProfile.website.replace(/^https?:\/\//i, '')}</span>
            </a>
          )}
          {realProfile.country && (
            <div className="flex items-center space-x-1 text-sm text-q-text-muted mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{realProfile.country}</span>
            </div>
          )}
        </div>

        {/* Profile Actions */}
        <div className="flex items-center space-x-2 mt-5">
          {(!isOtherUser || realProfile.id === user.uid) ? (
            <>
              <button onClick={handleEditClick} className="flex-1 py-1.5 bg-q-surface hover:bg-q-panel border border-q-surface-border rounded-lg text-sm font-bold transition-colors">
                Edit Profile
              </button>
              <button onClick={handleShareProfile} className="flex-1 py-1.5 bg-q-surface hover:bg-q-panel border border-q-surface-border rounded-lg text-sm font-bold transition-colors">
                Share Profile
              </button>
            </>
          ) : (
            <>
              <button className="flex-1 py-1.5 bg-q-primary text-black rounded-lg text-sm font-bold transition-colors">
                Follow
              </button>
              <button className="flex-1 py-1.5 bg-q-surface hover:bg-q-panel border border-q-surface-border rounded-lg text-sm font-bold transition-colors">
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* HIGHLIGHTS */}
      <div className="px-4 py-2 border-b border-q-surface-border">
        <div className="flex items-center space-x-4 overflow-x-auto hide-scrollbar">
          <div className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer">
            <div className="w-16 h-16 rounded-full border border-q-surface-border flex items-center justify-center bg-black hover:bg-q-surface transition-colors">
              <Plus className="w-8 h-8 text-white stroke-[1px]" />
            </div>
            <span className="text-xs text-white">New</span>
          </div>
          {/* Additional highlights would go here */}
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center justify-around border-b border-q-surface-border sticky top-[56px] bg-black z-20">
        <button 
          onClick={() => setActiveTab('posts')}
          className={cn("flex-1 py-3 flex justify-center border-b-2 transition-colors", activeTab === 'posts' ? "border-white text-white" : "border-transparent text-q-text-muted")}
        >
          <Grid className={cn("w-6 h-6", activeTab === 'posts' ? "stroke-[2px]" : "stroke-[1.5px]")} />
        </button>
        <button 
          onClick={() => setActiveTab('reels')}
          className={cn("flex-1 py-3 flex justify-center border-b-2 transition-colors", activeTab === 'reels' ? "border-white text-white" : "border-transparent text-q-text-muted")}
        >
          <Clapperboard className={cn("w-6 h-6", activeTab === 'reels' ? "stroke-[2px]" : "stroke-[1.5px]")} />
        </button>
        <button 
          onClick={() => setActiveTab('saved')}
          className={cn("flex-1 py-3 flex justify-center border-b-2 transition-colors", activeTab === 'saved' ? "border-white text-white" : "border-transparent text-q-text-muted")}
        >
          <Bookmark className={cn("w-6 h-6", activeTab === 'saved' ? "stroke-[2px]" : "stroke-[1.5px]")} />
        </button>
      </div>

      {/* CONTENT GRID */}
      <div className="min-h-[300px]">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 text-q-primary animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'posts' && (
              gridPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5">
                  {gridPosts.map(post => (
                    <div key={post.id} className="aspect-square bg-q-surface relative overflow-hidden group cursor-pointer" onClick={() => navigate(`/post/\${post.id}`)}>
                      <img src={post.mediaUrls[0]} alt="Post" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No posts yet</h3>
                  <p className="text-q-text-muted mb-4 text-sm max-w-[200px]">Share your first photo, video, or thought.</p>
                  <button onClick={() => navigate('/create')} className="text-q-primary font-bold text-sm">Create Post</button>
                </div>
              )
            )}
            
            {activeTab === 'reels' && (
              gridReels.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5">
                  {gridReels.map(post => (
                    <div key={post.id} className="aspect-[9/16] bg-q-surface relative overflow-hidden group cursor-pointer" onClick={() => setSelectedPost(post)}>
                      <video src={post.mediaUrls[0]} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                      <div className="absolute top-2 right-2 text-white drop-shadow-md">
                        <Video className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center mb-4">
                    <Clapperboard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">No reels yet</h3>
                  <p className="text-q-text-muted mb-4 text-sm max-w-[200px]">Create your first short video.</p>
                  <button onClick={() => navigate('/create')} className="text-q-primary font-bold text-sm">Create Reel</button>
                </div>
              )
            )}

            {activeTab === 'saved' && (
              gridSaved.length > 0 ? (
                <div className="grid grid-cols-3 gap-0.5">
                  {/* Saved posts map here */}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center mb-4">
                    <Bookmark className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Save</h3>
                  <p className="text-q-text-muted mb-4 text-sm max-w-[220px]">Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.</p>
                </div>
              )
            )}
          </>
        )}
      </div>

      
      {/* POST DETAIL MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col pt-safe-top overflow-y-auto">
          <div className="sticky top-0 z-10 p-4 bg-black/90 backdrop-blur flex justify-start">
            <button onClick={() => setSelectedPost(null)} className="text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="max-w-xl mx-auto w-full pb-20">
            <PostCard 
              post={selectedPost} 
              onHide={() => {
                setSelectedPost(null);
                setPosts(prev => prev.filter(p => p.id !== selectedPost.id));
              }} 
            />
          </div>
        </div>
      )}
{/* EDIT PROFILE MODAL */}
      {isEditing && <EditProfileModal onClose={() => setIsEditing(false)} />}
    </div>
  );
}
