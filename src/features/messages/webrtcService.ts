import { collection, doc, addDoc, updateDoc, onSnapshot, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const configuration = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
};

export class WebRTCService {
  public unsubs: (() => void)[] = [];
  public cleanup() { 
    this.unsubs.forEach(u => u()); 
    this.unsubs = [];
    if (this.unsubCall) this.unsubCall();
    if (this.unsubAns) this.unsubAns();
    if (this.unsubOffer) this.unsubOffer();
  }
  public unsubCall?: () => void;
  public unsubAns?: () => void;
  public unsubOffer?: () => void;
  public peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private roomId: string = '';
  private callDocRef: any = null;
  private onRemoteStreamCb: ((stream: MediaStream) => void) | null = null;
  private onEndCallCb: (() => void) | null = null;

  constructor(roomId: string, onRemoteStream: (stream: MediaStream) => void, onEndCall: () => void) {
    this.roomId = roomId;
    this.onRemoteStreamCb = onRemoteStream;
    this.onEndCallCb = onEndCall;
    this.remoteStream = new MediaStream();
  }

  async initialize(localStream: MediaStream) {
    this.localStream = localStream;
    this.peerConnection = new RTCPeerConnection(configuration);

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach(track => {
      this.peerConnection?.addTrack(track, localStream);
    });

    // Pull tracks from peer connection, add to remote stream
    this.peerConnection.ontrack = event => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream?.addTrack(track);
      });
      if (this.onRemoteStreamCb && this.remoteStream) {
        this.onRemoteStreamCb(this.remoteStream);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (
        this.peerConnection?.iceConnectionState === 'disconnected' ||
        this.peerConnection?.iceConnectionState === 'failed' ||
        this.peerConnection?.iceConnectionState === 'closed'
      ) {
        this.endCall();
      }
    };
  }

  async createOffer(callId: string) {
    if (!this.peerConnection) return;

    this.callDocRef = doc(db, `chatRooms/${this.roomId}/calls`, callId);
    const offerCandidates = collection(this.callDocRef, 'callerCandidates');
    const answerCandidates = collection(this.callDocRef, 'calleeCandidates');

    // Get candidates for caller, save to db
    this.peerConnection.onicecandidate = event => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };

    // Create offer
    const offerDescription = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(this.callDocRef, { offer, active: true });

    // Listen for remote answer
    this.unsubCall = onSnapshot(this.callDocRef, (snapshot) => {
      const data = snapshot.data();
      if (!this.peerConnection?.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        this.peerConnection.setRemoteDescription(answerDescription);
      }
      if (data && data.active === false) {
        this.endCall();
      }
    });

    // When answered, add candidate to peer connection
    this.unsubAns = onSnapshot(answerCandidates, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          this.peerConnection?.addIceCandidate(candidate);
        }
      });
    });
  }

  async answerCall(callId: string) {
    if (!this.peerConnection) return;
    
    this.callDocRef = doc(db, `chatRooms/${this.roomId}/calls`, callId);
    const offerCandidates = collection(this.callDocRef, 'callerCandidates');
    const answerCandidates = collection(this.callDocRef, 'calleeCandidates');

    this.peerConnection.onicecandidate = event => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };

    const callData = (await getDoc(this.callDocRef)).data() as any;
    if (!callData?.offer) return;

    const offerDescription = callData.offer;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(this.callDocRef, { answer });

    this.unsubOffer = onSnapshot(offerCandidates, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          this.peerConnection?.addIceCandidate(candidate);
        }
      });
    });

    // Listen for call end
    this.unsubCall = onSnapshot(this.callDocRef, (snapshot) => {
      const data = snapshot.data();
      if (data && data.active === false) {
        this.endCall();
      }
    });
  }

  async endCall() {
    this.cleanup();
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.callDocRef) {
      try {
        await updateDoc(this.callDocRef, { active: false });
      } catch (e) {
        // Doc might be deleted or we don't have permission, ignore
      }
      this.callDocRef = null;
    }

    if (this.onEndCallCb) {
      this.onEndCallCb();
    }
  }
}
