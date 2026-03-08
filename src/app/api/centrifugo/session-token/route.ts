import { NextRequest, NextResponse } from 'next/server';
import { VoiceSessionManager } from '@/lib/session';
import { SignJWT } from 'jose';

// 🔒 SECURITY: Never use a hardcoded fallback — if the env var is missing, fail explicitly
const SECRET = process.env.CENTRIFUGO_TOKEN_HMAC_SECRET_KEY;

export async function POST(request: NextRequest) {
    if (!SECRET) {
        console.error('[session-token] CENTRIFUGO_TOKEN_HMAC_SECRET_KEY is not set!');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const { sessionId, userId } = await request.json();

        if (!sessionId || !userId) {
            return NextResponse.json(
                { error: 'sessionId and userId required' },
                { status: 400 }
            );
        }

        const sessionManager = new VoiceSessionManager();

        // Verify session exists and user is participant
        const isParticipant = await sessionManager.isParticipant(sessionId, userId);

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
        return NextResponse.json(
            { error: 'Failed to generate session token' },
            { status: 500 }
        );
    }
}
