/**
 * WebRTC Configuration Helper
 * 
 * Provides utilities for configuring WebRTC peer connections with
 * dynamic ICE server configuration (STUN/TURN).
 */

export interface WebRTCConfig {
    iceServers: RTCIceServer[];
    iceCandidatePoolSize?: number;
    iceTransportPolicy?: RTCIceTransportPolicy;
    bundlePolicy?: RTCBundlePolicy;
    rtcpMuxPolicy?: RTCRtcpMuxPolicy;
}

/**
 * Fetch ICE servers from the API
 */
async function fetchICEServers(): Promise<RTCIceServer[]> {
    try {
        const response = await fetch('/api/webrtc/ice-servers');

        if (!response.ok) {
            throw new Error(`Failed to fetch ICE servers: ${response.status}`);
        }

        const data = await response.json();
        return data.iceServers;
    } catch (error) {
        console.error('Error fetching ICE servers:', error);

        // Fallback to public STUN servers
        return [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ];
    }
}

/**
 * Get complete WebRTC configuration with dynamic ICE servers
 * 
 * @param options - Optional configuration overrides
 * @returns Promise<RTCConfiguration>
 */
export async function getWebRTCConfig(options?: Partial<WebRTCConfig>): Promise<RTCConfiguration> {
    const iceServers = await fetchICEServers();

    return {
        iceServers,
        iceCandidatePoolSize: options?.iceCandidatePoolSize ?? 10,
        iceTransportPolicy: options?.iceTransportPolicy ?? 'all',
        bundlePolicy: options?.bundlePolicy ?? 'balanced',
        rtcpMuxPolicy: options?.rtcpMuxPolicy ?? 'require',
    };
}

/**
 * Create a peer connection with automatic configuration
 * 
 * @param options - Optional configuration overrides
 * @returns Promise<RTCPeerConnection>
 */
export async function createPeerConnection(options?: Partial<WebRTCConfig>): Promise<RTCPeerConnection> {
    const config = await getWebRTCConfig(options);
    const pc = new RTCPeerConnection(config);

    // Add connection state monitoring
    pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);

        switch (pc.connectionState) {
            case 'connected':
                console.log('✅ WebRTC connection established');
                break;
            case 'disconnected':
                console.log('⚠️ WebRTC connection disconnected');
                break;
            case 'failed':
                console.log('❌ WebRTC connection failed, attempting ICE restart');
                pc.restartIce();
                break;
            case 'closed':
                console.log('WebRTC connection closed');
                break;
        }
    };

    // ICE connection state monitoring
    pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
    };

    // ICE gathering state monitoring
    pc.onicegatheringstatechange = () => {
        console.log('ICE gathering state:', pc.iceGatheringState);
    };

    return pc;
}

/**
 * Test WebRTC connectivity
 * Creates a test peer connection to verify STUN/TURN servers are working
 */
export async function testWebRTCConnectivity(): Promise<{
    stunWorking: boolean;
    turnWorking: boolean;
    candidates: string[];
}> {
    const config = await getWebRTCConfig();
    const pc = new RTCPeerConnection(config);

    return new Promise((resolve) => {
        const candidates: string[] = [];
        let stunWorking = false;
        let turnWorking = false;

        pc.createDataChannel('test');

        pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                const candidate = event.candidate.candidate;
                candidates.push(candidate);

                // Check for STUN (srflx = server reflexive)
                if (candidate.includes('typ srflx')) {
                    stunWorking = true;
                }

                // Check for TURN (relay)
                if (candidate.includes('typ relay')) {
                    turnWorking = true;
                }
            } else {
                // ICE gathering complete
                pc.close();
                resolve({ stunWorking, turnWorking, candidates });
            }
        };

        // Timeout after 10 seconds
        setTimeout(() => {
            pc.close();
            resolve({ stunWorking, turnWorking, candidates });
        }, 10000);
    });
}

/**
 * Get connection statistics
 */
export async function getConnectionStats(pc: RTCPeerConnection): Promise<any> {
    const stats = await pc.getStats();
    const result: any = {
        candidates: [],
        selectedPair: null,
        bandwidth: {},
    };

    stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            result.selectedPair = report;
        }

        if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
            result.candidates.push({
                type: report.type,
                candidateType: report.candidateType,
                protocol: report.protocol,
                address: report.address,
                port: report.port,
            });
        }

        if (report.type === 'inbound-rtp') {
            result.bandwidth.inbound = {
                bytesReceived: report.bytesReceived,
                packetsReceived: report.packetsReceived,
                packetsLost: report.packetsLost,
            };
        }

        if (report.type === 'outbound-rtp') {
            result.bandwidth.outbound = {
                bytesSent: report.bytesSent,
                packetsSent: report.packetsSent,
            };
        }
    });

    return result;
}
