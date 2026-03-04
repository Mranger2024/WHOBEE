import { randomUUID } from 'crypto';
import { getRedisClient } from './redis';

export interface VoiceSession {
    sessionId: string;
    users: [string, string];
    createdAt: number;
    status: 'active' | 'ended';
}

export class VoiceSessionManager {
    private readonly SESSION_TTL = 300; // 5 minutes

    private get redis() {
        return getRedisClient();
    }

    async createSession(userA: string, userB: string): Promise<VoiceSession> {
        const sessionId = randomUUID();

        const session: VoiceSession = {
            sessionId,
            users: [userA, userB],
            createdAt: Date.now(),
            status: 'active'
        };

        await this.redis.setex(
            `session:${sessionId}`,
            this.SESSION_TTL,
            JSON.stringify(session)
        );

        return session;
    }

    async getSession(sessionId: string): Promise<VoiceSession | null> {
        try {
            console.log('Getting session from Redis:', sessionId);
            const data = await this.redis.get(`session:${sessionId}`);
            console.log('Redis data:', data);
            // Upstash Redis automatically parses JSON, so no need to JSON.parse
            return data as VoiceSession | null;
        } catch (error) {
            console.error('Error getting session from Redis:', error);
            throw error;
        }
    }

    async endSession(sessionId: string): Promise<void> {
        const session = await this.getSession(sessionId);
        if (session) {
            session.status = 'ended';
            await this.redis.setex(
                `session:${sessionId}`,
                60, // Keep for 1 min for cleanup
                JSON.stringify(session)
            );
        }
    }

    async isParticipant(sessionId: string, userId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        return session ? session.users.includes(userId) : false;
    }
}
