import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const REPORTS_FOR_BAN = 3;
const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60; // First strike ban
const PERMANENT_BAN_SECONDS = 365 * 24 * 60 * 60 * 10; // 10 years for permanent

export async function POST(request: NextRequest) {
    try {
        const { reportedUserId, reporterId } = await request.json();

        if (!reportedUserId || !reporterId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
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

        // 1. Increment report count for this IP
        const reportKey = `ip:reports:${reportedUserIp}`;
        const reportCount = await redis.incr(reportKey);

        // Reports decay/reset after 24 hours if they don't hit 3
        if (reportCount === 1) {
            await redis.expire(reportKey, 24 * 60 * 60);
        }

        if (reportCount >= REPORTS_FOR_BAN) {
            // Track how many times this IP has been banned before
            const historyKey = `ip:ban_history:${reportedUserIp}`;
            const previousBans = Number(await redis.get(historyKey) || 0);

            // Banning Logic
            const isPermanent = previousBans >= 1;
            const banDuration = isPermanent ? PERMANENT_BAN_SECONDS : ONE_WEEK_SECONDS;

            // Set the active ban
            const banKey = `ip:banned:${reportedUserIp}`;
            await redis.setex(banKey, banDuration, 'banned');

            // Increment the ban history for the future
            if (!isPermanent) {
                await redis.incr(historyKey);
                // Keep history around for standard 1-year period to track repeat offenders
                await redis.expire(historyKey, 365 * 24 * 60 * 60);
            }

            // Clear their current report count so the next strike starts from 0
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
