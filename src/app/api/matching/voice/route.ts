import { NextRequest, NextResponse } from 'next/server';
import { MatchingQueue, redis } from '@/lib/redis';
import { VoiceSessionManager } from '@/lib/session';

export async function POST(request: NextRequest) {
    console.log('=== Voice Matching API Called ===');
    try {
        const { userId } = await request.json();
        console.log('User ID:', userId);

        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        await redis.setex(`user_ip:${userId}`, 86400, ip);

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        console.log('Creating MatchingQueue...');
        const queue = new MatchingQueue('voice');
        console.log('Creating VoiceSessionManager...');
        const sessionManager = new VoiceSessionManager();
        console.log('Managers created successfully');

        // Add to queue
        console.log('Adding user to queue...');
        await queue.addToQueue(userId);
        await queue.cleanupOldEntries();

        // Try to find match
        const matchedUserId = await queue.getMatch(userId);

        if (matchedUserId) {
            // Remove both from queue
            await queue.removeFromQueue(userId);


            // Create session
            const session = await sessionManager.createSession(userId, matchedUserId);

            // Publish to Centrifugo HTTP API directly (server-side)
            const CENTRIFUGO_API_URL = process.env.CENTRIFUGO_API_URL || 'http://localhost:8000/api';
            const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY || '';

            // Notify both users via their personal channels
            await fetch(CENTRIFUGO_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `apikey ${CENTRIFUGO_API_KEY}`
                },
                body: JSON.stringify({
                    method: 'publish',
                    params: {
                        channel: `user_${userId}`,
                        data: {
                            type: 'voice-match-found',
                            sessionId: session.sessionId,
                            partnerId: matchedUserId
                        }
                    }
                })
            });

            await fetch(CENTRIFUGO_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `apikey ${CENTRIFUGO_API_KEY}`
                },
                body: JSON.stringify({
                    method: 'publish',
                    params: {
                        channel: `user_${matchedUserId}`,
                        data: {
                            type: 'voice-match-found',
                            sessionId: session.sessionId,
                            partnerId: userId
                        }
                    }
                })
            });

            return NextResponse.json({
                matched: true,
                sessionId: session.sessionId,
                partnerId: matchedUserId
            });
        } else {
            const queueSize = await queue.getQueueSize();
            return NextResponse.json({
                matched: false,
                waiting: true,
                queueSize
            });
        }
    } catch (error) {
        console.error('Voice matching error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            {
                error: 'Failed to process voice matching request',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}

// Cancel matching
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const queue = new MatchingQueue('voice');
        await queue.removeFromQueue(userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cancel voice matching error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel voice matching' },
            { status: 500 }
        );
    }
}
