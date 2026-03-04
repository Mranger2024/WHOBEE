import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel");
  const userId = url.searchParams.get("userId"); // Get userId from query params

  if (!channel) {
    return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
  }

  try {
    const secret = process.env.CENTRIFUGO_TOKEN_HMAC_SECRET_KEY;
    if (!secret) {
      console.error('CENTRIFUGO_TOKEN_HMAC_SECRET_KEY is not set');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    // Use provided userId or generate a new one
    // IMPORTANT: userId must match the connection token's sub claim
    const sub = userId || "user_" + Math.random().toString(36).substring(2, 9);

    // Create subscription token with channel claim
    const token = jwt.sign(
      {
        sub: sub,
        channel: channel,
        exp: Math.floor(Date.now() / 1000) + 3600
      },
      secret,
      { algorithm: 'HS256' }
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Subscription Token Error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
