import React, { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { getStories, createStory } from '../features/stories/storyService';
import { Story, UserProfile } from '../types';
import { Plus, X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Stories() {
  const { user, profile } = useAuth();
  const [stories, setStories] = useState<(Story & { author?: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const fetchS = async () => {
      try {
        const data = await getStories(profile.id, profile.following || []);
        setStories(data);
      } catch (err) {
        console.error("Failed to load stories", err);
      } finally {
        setLoading(false);
      }
    };
    fetchS();
  }, [profile]);

  // Group stories by user
  const groupedStories: Record<string, typeof stories> = {};
  stories.forEach(s => {
    if (!groupedStories[s.userId]) groupedStories[s.userId] = [];
    groupedStories[s.userId].push(s);
  });
  
  // Get an array of the latest story per user for the ring preview
  const storyPreviews = Object.values(groupedStories).map(userStories => userStories[0]);
  
  // Ensure current user is always first if they have a story, otherwise add a mock for 'add story'
  const hasOwnStory = storyPreviews.find(s => s.userId === profile?.id);

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    setIsUploading(true);
    try {
      // Direct upload for MVP (could move to storageService)
      const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../lib/firebase');
      
      const sRef = storageRef(storage, `stories/${profile.id}/${Date.now()}_${file.name}`);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      
      await createStory(profile.id, url, file.type.startsWith('video/') ? 'video' : 'image');
      
      // Refresh
      const data = await getStories(profile.id, profile.following || []);
      setStories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex space-x-4 p-4 overflow-x-auto hide-scrollbar">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex flex-col items-center space-y-2 flex-shrink-0 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-q-surface border border-q-surface-border" />
            <div className="w-12 h-3 bg-q-surface rounded" />
          </div>
        ))}
      </div>
    );
  }

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <div className="w-full relative">
      <div className="flex space-x-4 p-4 overflow-x-auto hide-scrollbar">
        {/* Own Story Add/Preview */}
        <div className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer relative group">
          <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-q-surface-border to-q-surface-border group-hover:from-q-primary group-hover:to-purple-500 transition-all relative">
            <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="You" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-full bg-q-surface flex items-center justify-center text-xl font-bold text-q-text-muted">
                  {profile?.displayName?.[0]}
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
            </div>
            
            <label className="absolute bottom-0 right-0 w-5 h-5 bg-q-primary rounded-full flex items-center justify-center border-2 border-black cursor-pointer shadow-lg">
              <Plus className="w-3 h-3 text-black" />
              <input type="file" className="hidden" accept="image/*,video/*" onChange={handleAddStory} disabled={isUploading} />
            </label>
          </div>
          <span className="text-xs text-q-text-muted font-medium">Your Story</span>
        </div>

        {/* Other Users' Stories */}
        {storyPreviews.filter(s => s.userId !== profile?.id).map((story, idx) => (
          <div 
            key={story.id} 
            className="flex flex-col items-center space-y-1 flex-shrink-0 cursor-pointer group"
            onClick={() => setActiveStoryIndex(stories.findIndex(s => s.id === story.id))}
          >
            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-q-primary to-purple-500">
              <div className="w-full h-full rounded-full bg-black overflow-hidden border-2 border-black">
                {story.author?.photoURL ? (
                  <img src={story.author.photoURL} alt={story.author.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-q-surface flex items-center justify-center text-xl font-bold text-white">
                    {story.author?.displayName?.[0]}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-white font-medium max-w-[64px] truncate">
              {story.author?.displayName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center"
          >
            <button 
              onClick={() => setActiveStoryIndex(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            
            <div className="relative w-full max-w-md h-[80vh] bg-black rounded-xl overflow-hidden flex flex-col">
              {/* Progress Bar */}
              <div className="absolute top-0 inset-x-0 p-2 flex space-x-1 z-20">
                <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                    onAnimationComplete={() => {
                      if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
                        setActiveStoryIndex(activeStoryIndex + 1);
                      } else {
                        setActiveStoryIndex(null);
                      }
                    }}
                    className="h-full bg-white"
                  />
                </div>
              </div>
              
              {/* Header */}
              <div className="absolute top-0 inset-x-0 p-4 pt-6 flex items-center space-x-2 z-20 bg-gradient-to-b from-black/50 to-transparent">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                   {activeStory.author?.photoURL ? (
                    <img src={activeStory.author.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-q-surface flex items-center justify-center text-sm font-bold text-white">
                      {activeStory.author?.displayName?.[0]}
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold text-white shadow-black drop-shadow-md">{activeStory.author?.displayName}</span>
              </div>
              
              {/* Media */}
              <div 
                className="flex-1 w-full h-full relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  if (x < rect.width / 2) {
                    if (activeStoryIndex !== null && activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
                  } else {
                    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) setActiveStoryIndex(activeStoryIndex + 1);
                    else setActiveStoryIndex(null);
                  }
                }}
              >
                {activeStory.mediaType === 'video' ? (
                  <video src={activeStory.mediaUrl} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={activeStory.mediaUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
