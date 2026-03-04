class PeerService {
  public peer: RTCPeerConnection | null = null;
  private onIceCandidateCallback: ((candidate: RTCIceCandidate) => void) | null = null;
  private onConnectionStateChangeCallback: ((state: RTCPeerConnectionState) => void) | null = null;
  private onIceConnectionStateChangeCallback: ((state: RTCIceConnectionState) => void) | null = null;
  private onTrackCallback: ((event: RTCTrackEvent) => void) | null = null;
  private onNegotiationNeededCallback: (() => void) | null = null;

  // WebRTC Race Condition fix: Queue ICE candidates until Remote Description is set
  private iceCandidateQueue: RTCIceCandidateInit[] = [];

  constructor() {
    if (typeof window === 'undefined') return;
    this.createPeerConnection();
  }

  // Setters for callbacks
  setOnConnectionStateChange(callback: (state: RTCPeerConnectionState) => void) {
    this.onConnectionStateChangeCallback = callback;
  }

  setOnIceConnectionStateChange(callback: (state: RTCIceConnectionState) => void) {
    this.onIceConnectionStateChangeCallback = callback;
  }

  setOnTrack(callback: (event: RTCTrackEvent) => void) {
    this.onTrackCallback = callback;
  }

  setOnNegotiationNeeded(callback: () => void) {
    this.onNegotiationNeededCallback = callback;
  }

  async createPeerConnection() {
    if (this.peer) {
      console.log('Closing existing peer connection');
      this.peer.close();
    }

    console.log('Creating new peer connection with TURN support');

    // Fetch dynamic ICE servers (includes TURN if configured)
    let iceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:global.stun.twilio.com:3478" },
      { urls: "stun:stun.1.google.com:19302" },
      { urls: "stun:stun.2.google.com:19302" },
      { urls: "stun:stun.3.google.com:19302" },
      { urls: "stun:stun.4.google.com:19302" },
    ];

    try {
      const response = await fetch('/api/webrtc/ice-servers');
      if (response.ok) {
        const data = await response.json();
        iceServers = data.iceServers;
        console.log('Using dynamic ICE servers:', iceServers);
      } else {
        console.warn('Failed to fetch ICE servers, using fallback STUN servers');
      }
    } catch (error) {
      console.error('Error fetching ICE servers:', error);
      console.warn('Using fallback STUN servers');
    }

    this.peer = new RTCPeerConnection({
      iceServers,
      // Use max-bundle for better performance and compatibility
      bundlePolicy: 'max-bundle',
      // Configure RTC settings for better compatibility
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 2,
      // Allow all candidates including localhost for local testing
      iceTransportPolicy: 'all'
    });

    // Add connection state change handlers
    this.peer.onconnectionstatechange = () => {
      console.log('Peer connection state changed:', this.peer?.connectionState);
      if (this.onConnectionStateChangeCallback && this.peer) {
        this.onConnectionStateChangeCallback(this.peer.connectionState);
      }

      // Attempt ICE restart on failure
      if (this.peer?.connectionState === 'failed') {
        console.log('Connection failed, attempting ICE restart');
        this.peer.restartIce();
      }
    };

    this.peer.oniceconnectionstatechange = () => {
      console.log('ICE connection state changed:', this.peer?.iceConnectionState);
      if (this.onIceConnectionStateChangeCallback && this.peer) {
        this.onIceConnectionStateChangeCallback(this.peer.iceConnectionState);
      }
    };

    this.peer.onicegatheringstatechange = () => {
      console.log('ICE gathering state changed:', this.peer?.iceGatheringState);
    };

    this.peer.onsignalingstatechange = () => {
      console.log('Signaling state changed:', this.peer?.signalingState);
    };

    this.peer.onicecandidateerror = (event) => {
      console.error('ICE candidate error:', event);
    };

    // Handle ICE candidates
    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate);
        if (this.onIceCandidateCallback) {
          this.onIceCandidateCallback(event.candidate);
        }
      } else {
        console.log('All ICE candidates have been sent');
      }
    };

    // Handle incoming tracks (remote stream)
    this.peer.ontrack = (event) => {
      if (this.onTrackCallback) {
        this.onTrackCallback(event);
      }
    };

    // Handle negotiation needed
    this.peer.onnegotiationneeded = () => {
      if (this.onNegotiationNeededCallback) {
        this.onNegotiationNeededCallback();
      }
    };
  }

  resetConnection() {
    this.iceCandidateQueue = [];
    this.createPeerConnection();
  }

  // Helper function to flush the ICE queue
  private async flushIceQueue() {
    if (this.iceCandidateQueue.length > 0) {
      console.log(`Flushing ${this.iceCandidateQueue.length} queued ICE candidates...`);
      for (const candidate of this.iceCandidateQueue) {
        try {
          await this.peer?.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding queued ICE candidate', e);
        }
      }
      this.iceCandidateQueue = [];
    }
  }

  async getAnswer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | undefined> {
    if (this.peer) {
      console.log('Setting remote description (offer):', offer);
      await this.peer.setRemoteDescription(offer);

      // Flush any ICE candidates that arrived before the offer was set
      await this.flushIceQueue();

      console.log('Remote description set! Creating answer...');
      const ans = await this.peer.createAnswer();
      await this.peer.setLocalDescription(new RTCSessionDescription(ans));
      console.log('Answer created and local description set');
      return ans;
    }
  }

  async setLocalDescription(ans: RTCSessionDescriptionInit): Promise<void> {
    if (this.peer) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
      // Flush any ICE candidates that arrived before the answer was set
      await this.flushIceQueue();
    }
  }

  async getOffer(): Promise<RTCSessionDescriptionInit | undefined> {
    if (this.peer) {
      console.log('Creating offer...');
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(new RTCSessionDescription(offer));
      console.log('Offer created and local description set');
      return offer;
    }
  }

  // Set callback for when ICE candidates are generated
  setOnIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    this.onIceCandidateCallback = callback;
  }

  // Add remote ICE candidate
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.peer && candidate) {
      // If the remote description isn't set yet, the browser will throw an InvalidStateError
      // We must queue the candidate until the signaling state changes.
      if (!this.peer.remoteDescription) {
        console.log('Remote description not set yet. Queueing ICE candidate.');
        this.iceCandidateQueue.push(candidate);
        return;
      }

      try {
        await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Added remote ICE candidate:', candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }
}

// Export a singleton instance
export default new PeerService();
