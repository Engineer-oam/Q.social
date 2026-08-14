import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Settings, Mic, MicOff, RefreshCcw, Image as ImageIcon, Zap, ZapOff, Check, Edit3, Type, Play, Grid, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../features/auth/AuthContext';
import { createPost } from '../features/posts/postService';
import { createStory } from '../features/stories/storyService';
import { addDoc, collection } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '../lib/utils';



type CreateMode = 'POST' | 'STORY' | 'REEL' | 'LIVE';

export default function Create() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<CreateMode>('STORY');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMuted, setIsMuted] = useState(false);
  const [flash, setFlash] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [liveStarted, setLiveStarted] = useState(false);
  const [liveViewers, setLiveViewers] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editor states
  const [caption, setCaption] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode, mode]);

  const startCamera = async () => {
    stopCamera();
    if (mode === 'POST' && selectedFile) return; // Don't need camera if picking from gallery for post

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported in this browser.");
      }

      let mediaStream;
      try {
        // Try requested facing mode and audio
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true
        });
      } catch (e) {
        // Fallback: any video camera + audio
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
        } catch (e2) {
          // Fallback: video only
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
        }
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setHasPermission(true);
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleCapture = () => {
    if (mode === 'LIVE') {
      if (!liveStarted) {
        startLive();
      } else {
        endLive();
      }
      return;
    }

    if (mode === 'REEL' || (mode === 'STORY' && isRecording)) {
      // In a real app we'd handle video recording here
      // For this implementation we'll focus on photo capture for simplicity, 
      // or rely on gallery upload for video.
      alert("Hold to record coming soon. Use gallery for video.");
      return;
    }

    // Capture photo
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    startCamera();
  };

  const handlePublish = async () => {
    if (!user || (!selectedFile && !caption && mode !== 'LIVE')) return;
    setIsPublishing(true);
    
    try {
      
      if (mode === 'POST') {
        const files = selectedFile ? [selectedFile] : [];
        await createPost(user.uid, caption, files);
        navigate('/home');
      } else if (mode === 'REEL' && selectedFile) {

        await createPost(user.uid, caption, [selectedFile]); // Reels are posts with video
        navigate('/reels');
      } else if (mode === 'STORY' && selectedFile) {
        // We need to upload first to get URL for storyService
        // But storyService expects URL, wait, createStory takes mediaUrl.
        // We'll use createPost for now as it handles upload and we can adapt it.
        // Actually, let's adapt createPost to just do the upload if we need to.
        // Or better, let's just make a POST with #story ? No, use a custom upload inline here.
        // For brevity in this instruction, we will use createPost but perhaps we should implement the storage upload for story.
        // using supabase storage in postService
        
        const storageRef = ref(storage, `stories/${user.uid}/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        const url = await getDownloadURL(storageRef);
        
        const mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';
        await createStory(user.uid, url, mediaType);
        navigate('/home');
      }
    } catch (error: any) {
      console.error("Publish error", error);
      alert('Failed to publish media. Please ensure Firebase Storage is enabled in your Firebase Console (test mode).');
    } finally {
      setIsPublishing(false);
    }
  };

  const startLive = async () => {
    if (!user) return;
    setLiveStarted(true);
    try {
      await addDoc(collection(db, 'lives'), {
        userId: user.uid,
        status: 'active',
        startedAt: Date.now(),
        title: caption || `${profile?.displayName || 'User'}'s Live Video`
      });
      // Mock viewer increment
      setInterval(() => setLiveViewers(v => v + Math.floor(Math.random() * 3)), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const endLive = () => {
    setLiveStarted(false);
    navigate('/home');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col h-[100dvh] overflow-hidden text-white">
      
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex justify-between items-center p-4 pt-safe-top">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        {!previewUrl && (
          <div className="flex space-x-3">
            <button onClick={() => setFlash(!flash)} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
              {flash ? <Zap className="w-5 h-5 text-yellow-400" /> : <ZapOff className="w-5 h-5" />}
            </button>
            <button onClick={toggleMute} className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
              {isMuted ? <MicOff className="w-5 h-5 text-red-500" /> : <Mic className="w-5 h-5" />}
            </button>
            <button className="p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      
      {/* Main View Area */}
      <div className="flex-1 relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        
        {/* Left Side Tools (Only on camera) */}
        {!previewUrl && hasPermission && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col space-y-6 z-20">
            <button className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
              <Type className="w-6 h-6 drop-shadow-md" />
            </button>
            <button className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
              <span className="text-xl font-bold font-serif leading-none drop-shadow-md">∞</span>
            </button>
            <button className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
              <Grid className="w-6 h-6 drop-shadow-md" />
            </button>
            <button className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
              <ChevronDown className="w-6 h-6 drop-shadow-md" />
            </button>
          </div>
        )}
        
        {!previewUrl ? (
          <>
            {hasPermission === false ? (
              <div className="text-center p-8">
                <p className="text-q-text-muted mb-4">Camera access denied.</p>
                <button onClick={startCamera} className="px-4 py-2 bg-q-primary text-black rounded-lg font-bold">
                  Retry Permissions
                </button>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={cn(
                  "w-full h-full object-cover transition-transform duration-300",
                  facingMode === 'user' ? "scale-x-[-1]" : ""
                )}
              />
            )}
            
            {/* Live overlay */}
            {mode === 'LIVE' && liveStarted && (
              <div className="absolute top-20 left-4 bg-red-600 px-3 py-1 rounded-md font-bold text-sm flex items-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                LIVE {liveViewers > 0 && `• ${liveViewers}`}
              </div>
            )}
          </>
        ) : (
          /* Editor / Preview Mode */
          <div className="w-full h-full relative flex flex-col">
            {selectedFile?.type.startsWith('video') ? (
              <video src={previewUrl} className="w-full h-full object-contain bg-black" controls autoPlay loop />
            ) : (
              <img src={previewUrl} className="w-full h-full object-contain bg-black" alt="Preview" />
            )}
            
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-20">
              <input 
                type="text" 
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full bg-white/10 text-white placeholder:text-white/50 border border-white/20 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-q-primary transition-colors backdrop-blur-md"
              />
              <div className="flex space-x-3">
                <button onClick={clearSelection} className="flex-1 py-3.5 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 py-3.5 rounded-xl font-bold bg-q-primary text-black hover:bg-q-primary-hover transition-colors flex items-center justify-center shadow-lg shadow-q-primary/20 disabled:opacity-50"
                >
                  {isPublishing ? "Publishing..." : "Share"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls (Only show when not in preview) */}
      {!previewUrl && (
        <div className="absolute bottom-0 inset-x-0 pb-safe pb-8 pt-12 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center">
          
          {/* Mode Selector */}
          {!liveStarted && (
            <div className="flex space-x-6 mb-8 overflow-x-auto px-4 w-full justify-center hide-scrollbar">
              {(['POST', 'STORY', 'REEL', 'LIVE'] as CreateMode[]).map(m => (
                <button 
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "text-sm font-bold tracking-wider transition-all",
                    mode === m ? "text-white scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/50 hover:text-white/80"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between w-full px-10">
            {/* Gallery Button */}
            {!liveStarted ? (
              <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-xl border-2 border-white/20 overflow-hidden relative group bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                 <ImageIcon className="w-6 h-6 text-white/70" />
              </button>
            ) : (
              <div className="w-12 h-12" />
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*" 
              onChange={handleFileSelect} 
            />

            {/* Shutter Button */}
            <button 
              onClick={handleCapture}
              className={cn(
                "w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all transform active:scale-95",
                mode === 'LIVE' 
                  ? (liveStarted ? "border-red-500 bg-red-500/20" : "border-white bg-white/20") 
                  : (mode === 'REEL' ? "border-red-500" : "border-white")
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-full transition-all",
                mode === 'LIVE'
                  ? (liveStarted ? "bg-red-500 rounded-sm w-8 h-8" : "bg-red-500")
                  : (mode === 'REEL' ? "bg-red-500" : "bg-white")
              )} />
            </button>

            {/* Flip Camera Button */}
            {!liveStarted ? (
              <button onClick={toggleCamera} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <RefreshCcw className="w-6 h-6 text-white" />
              </button>
            ) : (
              <div className="w-12 h-12" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
