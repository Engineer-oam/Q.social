import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { cn } from '../lib/utils';

interface VoiceRecorderProps {
  userId: string;
  onAudioSent: (audioUrl: string) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ userId, onAudioSent, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access required for voice notes.");
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      setIsUploading(true);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    try {
      const storageRef = ref(storage, `messages/voice_notes/${userId}_${Date.now()}.webm`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      onAudioSent(url);
    } catch (error) {
      console.error("Upload failed", error);
      onCancel();
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-3 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex-1 animate-in slide-in-from-right-4">
      <div className="flex-1 flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 font-mono text-sm">{formatTime(duration)}</span>
      </div>
      
      {isUploading ? (
        <Loader2 className="w-5 h-5 text-q-text-muted animate-spin" />
      ) : (
        <>
          {!isRecording ? (
             <button onClick={startRecording} className="p-2 text-q-text-muted hover:text-white transition-colors">
               <Mic className="w-5 h-5" />
             </button>
          ) : (
             <button onClick={stopRecording} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
               <Square className="w-4 h-4" />
             </button>
          )}
          <button onClick={onCancel} className="text-sm font-medium text-q-text-muted hover:text-white ml-2">
            Cancel
          </button>
        </>
      )}
    </div>
  );
}
