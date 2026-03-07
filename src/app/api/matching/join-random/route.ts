import { NextResponse } from "next/server";
import { redis } from '@/lib/redis';

type UserPreferences = {
    gender: "male" | "female" | "other";
    lookingFor: "male" | "female" | "any";
    interests: string[];
    region?: string;
};

type JoinBody = {
    clientId: string;
    preferences?: UserPreferences;
};

type WaitingUser = {
    clientId: string;
    preferences: UserPreferences;
    timestamp: number;
};

// Timeout threshold (5 seconds)
const TIMEOUT_MS = 5000;
const REDIS_HASH_KEY = 'random_waiting_users_prefs';

// Helper to publish messages into Centrifugo
async function publishToCentrifugo(channel: string, data: any) {
    const apiUrl = process.env.CENTRIFUGO_API_URL || "http://localhost:8000/api";
    const apiKey = process.env.CENTRIFUGO_API_KEY || "";

    const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
        },
        body: JSON.stringify({
            method: "publish",
            params: {
                channel,
                data,
            },
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("Centrifugo publish error:", text);
        throw new Error("centrifugo_publish_failed");
    }
}

// Check if two users match based on gender preferences
function isGenderMatch(userA: UserPreferences, userB: UserPreferences): boolean {
    const aMatchesB = userA.lookingFor === "any" || userA.lookingFor === userB.gender;
    const bMatchesA = userB.lookingFor === "any" || userB.lookingFor === userA.gender;
    return aMatchesB && bMatchesA;
}

// Calculate match score based on preferences
function calculateMatchScore(userA: UserPreferences, userB: UserPreferences): number {
    // Gender compatibility is required
    if (!isGenderMatch(userA, userB)) {
        return -1; // No match
    }

    let score = 0;

    // Interests overlap (10 points per common interest, max 50)
    const commonInterests = userA.interests.filter(i => userB.interests.includes(i));
    score += Math.min(commonInterests.length * 10, 50);

    // Region match (30 points)
    if (userA.region && userB.region && userA.region === userB.region) {
        score += 30;
    }

    // Add debugging
    console.log(`[Matching] Scored ${score} points between UserA(${userA.gender} looking for ${userA.lookingFor}) and UserB(${userB.gender} looking for ${userB.lookingFor})`);

    return score;
}

// Find best match in queue
function findBestMatch(newUser: UserPreferences, queue: WaitingUser[]): number {
    let bestIndex = -1;
    let bestScore = -1;

    for (let i = 0; i < queue.length; i++) {
        const score = calculateMatchScore(newUser, queue[i].preferences);

        if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }

    return bestIndex;
}

// Check if user has timed out (waiting > 5 seconds)
function hasTimedOut(user: WaitingUser): boolean {
    return Date.now() - user.timestamp > TIMEOUT_MS;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as JoinBody;

        if (!body?.clientId) {
            return NextResponse.json(
                { error: "clientId is required" },
                { status: 400 }
            );
        }

        const clientId = body.clientId;
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

        // Save IP address for reporting system
        await redis.setex(`user_ip:${clientId}`, 86400, ip);

        const preferences: UserPreferences = body.preferences || {
            gender: "other",
            lookingFor: "any",
            interests: [],
            region: undefined
        };

        // 1. Fetch all currently waiting users from Redis Hash
        const rawQueue = await redis.hgetall<Record<string, string>>(REDIS_HASH_KEY);
        let waitingQueue: WaitingUser[] = [];
        let myTimestamp = Date.now();

        if (rawQueue) {
            // Check if we already have a timestamp in the queue so polling doesn't reset it
            if (rawQueue[clientId]) {
                try {
                    const rawMyData = rawQueue[clientId];
                    const myData = typeof rawMyData === 'string' ? JSON.parse(rawMyData) : rawMyData;
                    if (myData.timestamp) myTimestamp = myData.timestamp;
                } catch (e) { }
            }

            const now = Date.now();
            for (const [id, dataStr] of Object.entries(rawQueue)) {
                if (id === clientId) continue; // Skip self if somehow already in queue
                try {
                    const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;

                    // Garbage Collection: Purge users older than 30 seconds (left the page)
                    if (now - data.timestamp > 30000) {
                        console.log(`[Join-Random] Garbage collecting stale user: ${id}`);
                        await redis.hdel(REDIS_HASH_KEY, id);
                        continue;
                    }

                    waitingQueue.push({
                        clientId: id,
                        preferences: data.preferences,
                        timestamp: data.timestamp
                    });
                } catch (e) {
                    console.error(`Failed to parse queue data for ${id}`);
                    // Clean up corrupted entry
                    await redis.hdel(REDIS_HASH_KEY, id);
                }
            }
        }

        // Sort by timestamp so oldest users get priority
        waitingQueue.sort((a, b) => a.timestamp - b.timestamp);

        // 2. Check for timed-out users first (fallback to random matching)
        // We only match with a timed-out user if they are NOT the current user
        const timedOutIndex = waitingQueue.findIndex(user => hasTimedOut(user));
        console.log(`[Join-Random] Incoming request from ${clientId}. Current queue size: ${waitingQueue.length}. Timed-Out-Index: ${timedOutIndex}`);

        if (timedOutIndex !== -1) {
            const partner = waitingQueue[timedOutIndex];

            // Atomically remove partner from queue
            const removeResult = await redis.hdel(REDIS_HASH_KEY, partner.clientId);

            // If removeResult is 0, someone else already matched with them concurrently
            if (removeResult === 1) {
                const roomId = `rand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                await publishToCentrifugo("random_matching", {
                    type: "match_found",
                    roomId,
                    clientA: partner.clientId,
                    clientB: clientId,
                    matchType: "timeout_fallback"
                });

                return NextResponse.json({
                    status: "matched",
                    roomId,
                    partnerId: partner.clientId,
                    matchType: "timeout_fallback"
                });
            }
        }

        // 3. Try to find best preference-based match
        const bestMatchIndex = findBestMatch(preferences, waitingQueue);

        if (bestMatchIndex !== -1) {
            // Match found!
            const partner = waitingQueue[bestMatchIndex];
            const matchScore = calculateMatchScore(preferences, partner.preferences);

            // Atomically remove partner from queue
            const removeResult = await redis.hdel(REDIS_HASH_KEY, partner.clientId);

            // If removeResult is 0, someone else snatched them
            if (removeResult === 1) {
                const roomId = `rand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

                await publishToCentrifugo("random_matching", {
                    type: "match_found",
                    roomId,
                    clientA: partner.clientId,
                    clientB: clientId,
                    matchType: "preference_based",
                    matchScore
                });

                return NextResponse.json({
                    status: "matched",
                    roomId,
                    partnerId: partner.clientId,
                    matchType: "preference_based",
                    matchScore
                });
            }
        }

        // 4. No match found (or concurrent snatch) – add self to queue
        await redis.hset(REDIS_HASH_KEY, {
            [clientId]: JSON.stringify({
                preferences,
                timestamp: myTimestamp
            })
        });

        // Get updated queue size
        const currentQueueSize = await redis.hlen(REDIS_HASH_KEY);

        await publishToCentrifugo("random_matching", {
            type: "waiting",
            clientId,
            queueSize: currentQueueSize
        });

        return NextResponse.json({
            status: "waiting",
            queueSize: currentQueueSize
        });

    } catch (err) {
        console.error("join-random error:", err);
        return NextResponse.json(
            { error: "Failed to join matching queue" },
            { status: 500 }
        );
    }
}

// Cancel matching
export async function DELETE(req: Request) {
    try {
        const body = await req.json();

        if (!body?.clientId) {
            return NextResponse.json(
                { error: "clientId is required" },
                { status: 400 }
            );
        }

        // Remove from the Redis hash
        await redis.hdel(REDIS_HASH_KEY, body.clientId);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Cancel matching error:", err);
        return NextResponse.json(
            { error: "Failed to cancel matching" },
            { status: 500 }
        );
    }
}
