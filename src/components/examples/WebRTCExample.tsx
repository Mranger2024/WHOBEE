/**
 * Example: Using WebRTC with TURN Server Support
 * 
 * This file demonstrates how to use the new WebRTC configuration
 * with automatic TURN server support in your components.
 */

import { useState, useEffect, useRef } from 'react';
import { createPeerConnection, testWebRTCConnectivity } from '@/lib/webrtc-config';

export function ExampleWebRTCComponent() {
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    const [connectionState, setConnectionState] = useState<string>('new');
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // Initialize peer connection with TURN support
    useEffect(() => {
        async function initializePeerConnection() {
            try {
                // Create peer connection with automatic ICE server configuration
                const pc = await createPeerConnection();

                // Monitor connection state
                pc.onconnectionstatechange = () => {
                    setConnectionState(pc.connectionState);
                };

                // Handle incoming tracks
                pc.ontrack = (event) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                // Handle ICE candidates
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        // Send candidate to remote peer via your signaling mechanism
                        // e.g., sendIceCandidate(channel, remotePeerId, event.candidate);
                        console.log('ICE candidate:', event.candidate);
                    }
                };

                setPeerConnection(pc);
            } catch (error) {
                console.error('Failed to initialize peer connection:', error);
            }
        }

        initializePeerConnection();

        return () => {
            peerConnection?.close();
        };
    }, []);

    // Get local media stream
    async function startLocalStream() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Add tracks to peer connection
            stream.getTracks().forEach(track => {
                peerConnection?.addTrack(track, stream);
            });
        } catch (error) {
            console.error('Failed to get local stream:', error);
        }
    }

    // Create and send offer
    async function createOffer() {
        if (!peerConnection) return;

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // Send offer to remote peer via your signaling mechanism
            // e.g., sendOffer(channel, remotePeerId, offer);
            console.log('Offer created:', offer);
        } catch (error) {
            console.error('Failed to create offer:', error);
        }
    }

    // Handle incoming offer
    async function handleOffer(offer: RTCSessionDescriptionInit) {
        if (!peerConnection) return;

        try {
            await peerConnection.setRemoteDescription(offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            // Send answer to remote peer
            // e.g., sendAnswer(channel, remotePeerId, answer);
            console.log('Answer created:', answer);
        } catch (error) {
            console.error('Failed to handle offer:', error);
        }
    }

    // Handle incoming answer
    async function handleAnswer(answer: RTCSessionDescriptionInit) {
        if (!peerConnection) return;

        try {
            await peerConnection.setRemoteDescription(answer);
        } catch (error) {
            console.error('Failed to handle answer:', error);
        }
    }

    // Handle incoming ICE candidate
    async function handleIceCandidate(candidate: RTCIceCandidateInit) {
        if (!peerConnection) return;

        try {
            await peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error('Failed to add ICE candidate:', error);
        }
    }

    // Test connectivity
    async function testConnectivity() {
        const result = await testWebRTCConnectivity();
        console.log('Connectivity test:', result);
        alert(`STUN: ${result.stunWorking ? '✅' : '❌'}, TURN: ${result.turnWorking ? '✅' : '❌'}`);
    }

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">WebRTC with TURN Support</h2>

            <div className="mb-4">
                <p>Connection State: <strong>{connectionState}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <h3 className="font-semibold mb-2">Local Video</h3>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full bg-black rounded"
                    />
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Remote Video</h3>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full bg-black rounded"
                    />
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={startLocalStream}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Start Camera
                </button>

                <button
                    onClick={createOffer}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Create Offer
                </button>

                <button
                    onClick={testConnectivity}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                    Test Connectivity
                </button>
            </div>
        </div>
    );
}

/**
 * ALTERNATIVE: Manual Configuration
 * 
 * If you prefer to configure the peer connection manually:
 */

export async function manualPeerConnectionSetup() {
    // Fetch ICE servers
    const response = await fetch('/api/webrtc/ice-servers');
    const { iceServers } = await response.json();

    // Create peer connection with fetched servers
    const pc = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 10
    });

    // Add your event handlers
    pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);

        if (pc.connectionState === 'failed') {
            // Attempt ICE restart on failure
            pc.restartIce();
        }
    };

    return pc;
}
