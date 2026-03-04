import { NextResponse } from "next/server";
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
    try {
        const { token } = await req.json();

        if (!token) {
            return NextResponse.json(
                { error: "Token is required" },
                { status: 400 }
            );
        }

        // Add the FCM token to a Redis Set (to ensure uniqueness)
        // We use a set so that if the same user/browser allows notifications twice, 
        // it doesn't duplicate the token in our database.
        const added = await redis.sadd("push_subscribers", token);

        console.log(`[Push API] Received token. New subscriber? ${added === 1}`);

        return NextResponse.json({
            success: true,
            message: "Successfully subscribed to Traffic Surge alerts"
        });

    } catch (error) {
        console.error("Error saving push subscription:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
