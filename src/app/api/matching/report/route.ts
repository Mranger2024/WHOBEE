import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const REPORTS_FOR_BAN = 3;
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60;
const PERMANENT_BAN_SECONDS = 365 * 24 * 60 * 60 * 10; // 10 years

// 🔒 SECURITY: Rate limit the report endpoint to prevent mass-ban spam attacks.
// An attacker cannot flood this with requests to falsely ban innocent users.
const ratelimit = new Ratelimit({
    redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(5, '1 m'), // Max 5 reports per minute per IP
    ephemeralCache: new Map(),
});

export async function POST(request: NextRequest) {
    try {
        // 🔒 SECURITY: Rate limit by IP to prevent ban-spam abuse
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const { success } = await ratelimit.limit(`report:${ip}`);
        if (!success) {
            return NextResponse.json(
                { error: 'Too many requests. Please slow down.' },
                { status: 429 }
            );
        }

        const { reportedUserId, reporterId } = await request.json();

        // 🔒 SECURITY: Validate inputs are present and are non-empty strings
        if (!reportedUserId || !reporterId ||
            typeof reportedUserId !== 'string' ||
            typeof reporterId !== 'string') {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 🔒 SECURITY: A user cannot report themselves
        if (reportedUserId === reporterId) {
            return NextResponse.json(
                { error: 'Invalid report' },
                { status: 400 }
            );
        }

        // Get the reported user's IP
        const reportedUserIp = await redis.get(`user_ip:${reportedUserId}`);

        if (!reportedUserIp) {
            return NextResponse.json({
                success: true,
                message: 'User logged out before IP could be tracked, but report logged natively.',
                reportCount: 1
            });
        }

        // Increment report count for this IP
        const reportKey = `ip:reports:${reportedUserIp}`;
        const reportCount = await redis.incr(reportKey);

        // Reports decay/reset after 24 hours if they don't hit 3
        if (reportCount === 1) {
            await redis.expire(reportKey, 24 * 60 * 60);
        }

        if (reportCount >= REPORTS_FOR_BAN) {
            const historyKey = `ip:ban_history:${reportedUserIp}`;
            const previousBans = Number(await redis.get(historyKey) || 0);

            const isPermanent = previousBans >= 1;
            const banDuration = isPermanent ? PERMANENT_BAN_SECONDS : ONE_WEEK_SECONDS;

            const banKey = `ip:banned:${reportedUserIp}`;
            await redis.setex(banKey, banDuration, 'banned');

            if (!isPermanent) {
                await redis.incr(historyKey);
                await redis.expire(historyKey, 365 * 24 * 60 * 60);
            }

            await redis.del(reportKey);

            return NextResponse.json({
                success: true,
                message: isPermanent ? 'User permanently banned' : 'User banned for 1 week',
                banned: true,
                isPermanent,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Report submitted successfully',
            reportCount
        });
    } catch (error) {
        console.error('Error reporting user:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}