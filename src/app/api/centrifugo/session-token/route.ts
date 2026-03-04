import { NextRequest, NextResponse } from 'next/server';
import { VoiceSessionManager } from '@/lib/session';
import { SignJWT } from 'jose';

const SECRET = process.env.CENTRIFUGO_TOKEN_HMAC_SECRET_KEY || 'a7d8f4b29cbd44890fe32fa7bcb99100';

export async function POST(request: NextRequest) {
    console.log('=== Session Token API Called ===');
    try {
        const { sessionId, userId } = await request.json();
        console.log('Session ID:', sessionId);
        console.log('User ID:', userId);

        if (!sessionId || !userId) {
            return NextResponse.json(
                { error: 'sessionId and userId required' },
                { status: 400 }
            );
        }

        console.log('Creating VoiceSessionManager...');
        const sessionManager = new VoiceSessionManager();

        // Verify session exists and user is participant
        console.log('Checking if user is participant...');
        const isParticipant = await sessionManager.isParticipant(sessionId, userId);
        console.log('Is participant:', isParticipant);

        if (!isParticipant) {
            return NextResponse.json(
                { error: 'Unauthorized - not a session participant' },
                { status: 403 }
            );
        }

        // Issue session token using jose
        const token = await new SignJWT({
            sub: userId,
            channels: [`session:${sessionId}`]
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('5m') // 5 minutes
            .sign(new TextEncoder().encode(SECRET));

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Session token error:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        return NextResponse.json(
            {
                error: 'Failed to generate session token',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
