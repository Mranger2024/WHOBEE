import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { RateLimiter } from '@/lib/redis';

// Report a user
export async function POST(request: NextRequest) {
    try {
        const { reportedUserId, reportedBy, reportedIp, reason } = await request.json();

        if (!reportedUserId || !reportedBy) {
            return NextResponse.json(
                { error: 'Reported user ID and reporter ID are required' },
                { status: 400 }
            );
        }

        // Rate limiting - max 5 reports per hour per user
        const rateLimiter = new RateLimiter();
        const allowed = await rateLimiter.isAllowed(reportedBy, 'report', 5, 3600);

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many reports. Please try again later.' },
                { status: 429 }
            );
        }

        const supabase = createClient();

        // Insert report
        const { error: insertError } = await supabase
            .from('user_reports')
            .insert({
                reported_user_id: reportedUserId,
                reported_by: reportedBy,
                reported_ip: reportedIp,
                reason: reason || 'No reason provided',
            });

        if (insertError) {
            throw insertError;
        }

        // Get total report count for this user/IP
        const { data: reportCount, error: countError } = await supabase
            .rpc('get_report_count', {
                p_user_id: reportedUserId,
                p_ip_address: reportedIp,
            });

        if (countError) {
            throw countError;
        }

        const count = reportCount || 0;

        // Auto-ban logic
        if (count >= 10) {
            // Permanent ban
            await supabase.from('banned_users').insert({
                user_id: reportedUserId,
                ip_address: reportedIp,
                ban_type: 'permanent',
                reason: `Automatically banned after ${count} reports`,
            });

            return NextResponse.json({
                success: true,
                message: 'Report submitted. User has been permanently banned.',
                reportCount: count,
                banned: true,
                banType: 'permanent',
            });
        } else if (count >= 5) {
            // Temporary ban (24 hours)
            const bannedUntil = new Date();
            bannedUntil.setHours(bannedUntil.getHours() + 24);

            await supabase.from('banned_users').insert({
                user_id: reportedUserId,
                ip_address: reportedIp,
                ban_type: 'temporary',
                banned_until: bannedUntil.toISOString(),
                reason: `Automatically banned for 24 hours after ${count} reports`,
            });

            return NextResponse.json({
                success: true,
                message: 'Report submitted. User has been temporarily banned for 24 hours.',
                reportCount: count,
                banned: true,
                banType: 'temporary',
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Report submitted successfully',
            reportCount: count,
            banned: false,
        });
    } catch (error) {
        console.error('Report user error:', error);
        return NextResponse.json(
            { error: 'Failed to submit report' },
            { status: 500 }
        );
    }
}

// Check if user/IP is banned
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const ipAddress = searchParams.get('ip');

        if (!userId && !ipAddress) {
            return NextResponse.json(
                { error: 'User ID or IP address is required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        const { data, error } = await supabase.rpc('is_banned', {
            p_user_id: userId,
            p_ip_address: ipAddress,
        });

        if (error) {
            throw error;
        }

        const banInfo = data?.[0];

        if (banInfo && banInfo.banned) {
            return NextResponse.json({
                banned: true,
                banType: banInfo.ban_type,
                bannedUntil: banInfo.banned_until,
                reason: banInfo.reason,
            });
        }

        return NextResponse.json({
            banned: false,
        });
    } catch (error) {
        console.error('Check ban status error:', error);
        return NextResponse.json(
            { error: 'Failed to check ban status' },
            { status: 500 }
        );
    }
}
