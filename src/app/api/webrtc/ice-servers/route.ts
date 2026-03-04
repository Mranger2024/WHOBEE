import { NextResponse } from 'next/server';
import { getICEServers } from '@/lib/turn-credentials';

/**
 * GET /api/webrtc/ice-servers
 * 
 * Returns ICE server configuration (STUN/TURN) for WebRTC connections.
 * Automatically selects the best available provider.
 * 
 * Response format:
 * {
 *   iceServers: RTCIceServer[],
 *   ttl: number (seconds until credentials expire)
 * }
 */
export async function GET() {
    try {
        const config = await getICEServers();

        return NextResponse.json(config, {
            headers: {
                'Cache-Control': `public, max-age=${Math.floor(config.ttl / 2)}`,
            }
        });
    } catch (error) {
        console.error('Error getting ICE servers:', error);

        // Return fallback configuration on error
        return NextResponse.json({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            ttl: 3600
        }, {
            status: 200 // Still return 200 with fallback
        });
    }
}
