import React, { useEffect, useRef, useState } from 'react';
import { WebRTCService } from '../features/messages/webrtcService';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface VideoCallProps {
  roomId: string;
  callId: string;
  isCaller: boolean;
  onEndCall: () => void;
  withVideo?: boolean;
}

export default function VideoCall({ roomId, callId, isCaller, onEndCall, withVideo = true }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [webrtcService, setWebrtcService] = useState<WebRTCService | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(!withVideo);

  useEffect(() => {
    let service: WebRTCService;
    let localStream: MediaStream;

    const startCall = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
          video: withVideo, 
          audio: true 
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        service = new WebRTCService(roomId, (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        }, () => {
          onEndCall();
        });

        await service.initialize(localStream);
        setWebrtcService(service);

        if (isCaller) {
          await service.createOffer(callId);
        } else {
          await service.answerCall(callId);
        }
      } catch (error) {
        console.error("Error starting call:", error);
        onEndCall(); // Cleanup if permission denied
      }
    };

    startCall();

    return () => {
      if (service) {
        service.endCall();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [roomId, callId, isCaller, withVideo]);

  const toggleMic = () => {
    if (webrtcService?.peerConnection) {
      const audioTrack = webrtcService.peerConnection.getSenders().find(s => s.track?.kind === 'audio')?.track;
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (webrtcService?.peerConnection) {
      const videoTrack = webrtcService.peerConnection.getSenders().find(s => s.track?.kind === 'video')?.track;
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-4xl aspect-video bg-q-surface rounded-2xl overflow-hidden shadow-2xl shadow-q-primary/10 border border-q-surface-border">
        {/* Remote Video (Full Screen inside container) */}
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        {!remoteVideoRef.current?.srcObject && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-q-text-muted animate-pulse">Connecting...</span>
          </div>
        )}
        
        {/* Local Video (PiP) */}
        <div className="absolute top-4 right-4 w-32 md:w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-q-surface-border">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-q-panel/80 backdrop-blur-md p-3 rounded-full border border-q-surface-border">
          <button 
            onClick={toggleMic}
            className={`p-3 rounded-full transition-colors ${micMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-q-surface text-white hover:bg-white/10'}`}
          >
            {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          {withVideo && (
            <button 
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-colors ${videoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-q-surface text-white hover:bg-white/10'}`}
            >
              {videoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={() => {
              webrtcService?.endCall();
              onEndCall();
            }}
            className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
