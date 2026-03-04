import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const secret = process.env.CENTRIFUGO_TOKEN_HMAC_SECRET_KEY || '';
    if (!secret) {
      console.error('CENTRIFUGO_TOKEN_HMAC_SECRET_KEY is not set');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const token = await new SignJWT({
      sub: userId,
      channels: [`user:${userId}`] // Only authorize personal channel
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h') // Shorter TTL for user tokens
      .sign(new TextEncoder().encode(secret));

    return NextResponse.json({ token, userId });
  } catch (error) {
    console.error('Token Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
