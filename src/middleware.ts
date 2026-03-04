import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { env } from '@/lib/env';

// Note: Upstash Redis works seamlessly in Edge Middleware via REST APIs
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Configure a sliding window rate limiter
// WebRTC generates bursts of ICE candidates (often 10-20 per second initially)
// 50 requests per 10 seconds allows for rapid signaling without triggering false positives
const ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(50, '10 s'),
    ephemeralCache: new Map(),
    analytics: true,
});

export async function middleware(request: NextRequest) {
    // 1. Skip middleware for static files, API routes, Next internal assets
    // We only want to block actual page visits. 
    // Wait, if an API is blocked, they can't match either, which is good.
    const path = request.nextUrl.pathname;
    if (
        path.startsWith('/_next') ||
        path.startsWith('/favicon.ico') ||
        path.startsWith('/whobee.png') ||
        path === '/banned'
    ) {
        return NextResponse.next();
    }

    // 2. Identify User's IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    // 3. Strict API Rate Limiting (Guard against DDoS & Spam)
    if (path.startsWith('/api/')) {
        try {
            const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);
            if (!success) {
                return NextResponse.json(
                    { error: 'Too Many Requests. Please try again later.' },
                    {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': limit.toString(),
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': reset.toString()
                        }
                    }
                );
            }
        } catch (error) {
            console.error('Rate Limiting failed:', error);
            // Fail open on error so we don't accidentally block legitimate traffic if Redis drops
        }
    }

    // 4. Check for Ban in Redis
    try {
        const banKey = `ip:banned:${ip}`;
        const isBanned = await redis.get(banKey);

        if (isBanned) {
            // If the user is on the /api, return a 403 Forbidden payload
            if (path.startsWith('/api/')) {
                return NextResponse.json(
                    { error: 'Forbidden: IP is banned due to community reports.' },
                    { status: 403 }
                );
            }

            // If they are trying to visit a page, redirect to the Banned explanations page
            if (path !== '/banned') {
                return NextResponse.redirect(new URL('/banned', request.url));
            }
        }
    } catch (error) {
        console.error('Middleware Redis check failed:', error);
        // Fail open if Redis is down so we don't block all traffic
    }

    return NextResponse.next();
}

// Config to run middleware only on relevant paths
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
