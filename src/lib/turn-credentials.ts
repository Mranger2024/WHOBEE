/**
 * WebRTC TURN Server Configuration
 * 
 * This module provides utilities for obtaining ICE servers (STUN/TURN)
 * for WebRTC connections. It supports multiple providers with fallback.
 */

// Free STUN server configuration (fallback - no TURN relay overhead)
// These allow direct P2P which is much faster than a shared TURN relay.
// For symmetric NAT users (~20%), add your own TURN server via TURN_SERVER_URL env var.
const FREE_TURN_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
];

/**
 * Get Twilio TURN credentials (recommended for production)
 * Requires TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables
 */
export async function getTwilioTurnCredentials() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        console.warn('Twilio credentials not configured, using free TURN servers');
        return null;
    }

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Twilio API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            iceServers: data.ice_servers,
            ttl: data.ttl
        };
    } catch (error) {
        console.error('Failed to get Twilio TURN credentials:', error);
        return null;
    }
}

/**
 * Get Xirsys TURN credentials (alternative provider)
 * Requires XIRSYS_USERNAME, XIRSYS_PASSWORD, and XIRSYS_CHANNEL environment variables
 */
export async function getXirsysTurnCredentials() {
    const username = process.env.XIRSYS_USERNAME;
    const password = process.env.XIRSYS_PASSWORD;
    const channel = process.env.XIRSYS_CHANNEL || 'default';

    if (!username || !password) {
        console.warn('Xirsys credentials not configured');
        return null;
    }

    try {
        const response = await fetch(`https://global.xirsys.net/_turn/${channel}`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Xirsys API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            iceServers: data.v.iceServers,
            ttl: 86400 // 24 hours
        };
    } catch (error) {
        console.error('Failed to get Xirsys TURN credentials:', error);
        return null;
    }
}

/**
 * Get self-hosted TURN server configuration
 * Requires TURN_SERVER_URL, TURN_USERNAME, and TURN_PASSWORD environment variables
 */
export function getSelfHostedTurnConfig() {
    const turnUrl = process.env.TURN_SERVER_URL;
    const username = process.env.TURN_USERNAME;
    const password = process.env.TURN_PASSWORD;

    if (!turnUrl || !username || !password) {
        return null;
    }

    return {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            {
                urls: turnUrl,
                username,
                credential: password
            }
        ],
        ttl: 86400
    };
}

/**
 * Get ICE servers with automatic provider selection
 * Tries providers in order: Twilio -> Xirsys -> Self-hosted -> Free
 */
export async function getICEServers() {
    // Try Twilio first (best quality, recommended for production)
    const twilioConfig = await getTwilioTurnCredentials();
    if (twilioConfig) {
        console.log('Using Twilio TURN servers');
        return twilioConfig;
    }

    // Try Xirsys
    const xirsysConfig = await getXirsysTurnCredentials();
    if (xirsysConfig) {
        console.log('Using Xirsys TURN servers');
        return xirsysConfig;
    }

    // Try self-hosted
    const selfHostedConfig = getSelfHostedTurnConfig();
    if (selfHostedConfig) {
        console.log('Using self-hosted TURN server');
        return selfHostedConfig;
    }

    // Fallback to free servers
    console.log('Using free TURN servers (not recommended for production)');
    return {
        iceServers: FREE_TURN_SERVERS,
        ttl: 3600
    };
}

/**
 * Test if a TURN server is working
 */
export async function testTurnServer(iceServer: RTCIceServer): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            const pc = new RTCPeerConnection({
                iceServers: [iceServer]
            });

            pc.createDataChannel('test');

            pc.createOffer().then(offer => {
                pc.setLocalDescription(offer);
            });

            let relayFound = false;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    const candidate = event.candidate.candidate;

                    // Check if this is a relay (TURN) candidate
                    if (candidate.includes('typ relay')) {
                        console.log('✅ TURN server is working!');
                        relayFound = true;
                        pc.close();
                        resolve(true);
                    }
                }
            };

            // Timeout after 5 seconds
            setTimeout(() => {
                if (!relayFound) {
                    console.log('❌ TURN server not responding');
                    pc.close();
                    resolve(false);
                }
            }, 5000);
        } catch (error) {
            console.error('Error testing TURN server:', error);
            resolve(false);
        }
    });
}
