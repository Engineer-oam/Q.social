import React, { useState, useRef } from 'react';
import { Image, Video, X, Loader2 } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { createPost } from '../features/posts/postService';
import { cn } from '../lib/utils';

export default function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
  const { profile, user } = useAuth();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).filter((f: File) => f.type.startsWith('image/') || f.type.startsWith('video/'));
      setFiles(prev => [...prev, ...selected].slice(0, 4)); // Max 4 files
    }
  };

  const handlePost = async () => {
    if ((!content.trim() && files.length === 0) || !user) return;
    
    setLoading(true);
    try {
      await createPost(user.uid, content, files);
      setContent('');
      setFiles([]);
      onPostCreated();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="glass p-4 rounded-2xl flex flex-col space-y-4">
      <div className="flex space-x-4">
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-q-surface-border flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-q-primary/20 to-q-panel border border-q-surface-border flex-shrink-0 flex items-center justify-center text-q-primary font-bold">
            {profile?.displayName?.[0]?.toUpperCase() || 'Q'}
          </div>
        )}
        <div className="flex-1">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?" 
            className="w-full bg-transparent border-none text-white focus:outline-none placeholder-q-text-muted mt-2 text-lg resize-none min-h-[60px]"
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-2 ml-16">
          {files.map((file, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden bg-q-panel aspect-video border border-q-surface-border">
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="Upload preview" className="w-full h-full object-cover" />
              ) : (
                <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
              )}
              <button 
                onClick={() => removeFile(i)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors backdrop-blur-md opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between ml-16 pt-2 border-t border-q-surface-border">
        <div className="flex items-center space-x-2 text-q-primary">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-q-primary/10 transition-colors"
          >
            <Image className="w-5 h-5" />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-q-primary/10 transition-colors"
          >
            <Video className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect}
            className="hidden" 
            multiple 
            accept="image/*,video/*"
          />
        </div>
        
        <button
          onClick={handlePost}
          disabled={loading || (!content.trim() && files.length === 0)}
          className={cn(
            "py-2 px-6 rounded-full font-medium transition-all flex items-center justify-center space-x-2",
            loading || (!content.trim() && files.length === 0) 
              ? "bg-q-panel text-q-text-muted cursor-not-allowed" 
              : "bg-q-primary text-black hover:bg-q-primary-hover shadow-lg shadow-q-primary/20"
          )}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Post</span>}
        </button>
      </div>
    </div>
  );
}
