import { NextResponse, type NextRequest } from 'next/server';

// 🔒 This endpoint is INTERNAL — it should only be called by Next.js server-side
// code (API routes), never directly from the browser.
// We enforce this by requiring a shared internal secret header.
export async function POST(request: NextRequest) {
  // 🔒 SECURITY: Internal secret check — blocks external callers (browsers, bots)
  // Set INTERNAL_API_SECRET in your .env.local to a long random string.
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const incomingSecret = request.headers.get('x-internal-secret');

  if (!internalSecret || incomingSecret !== internalSecret) {
    // Return 404 (not 401) so the endpoint appears non-existent to scanners
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const body = await request.json();
  const { channel, data } = body;

  if (!channel || !data) {
    return NextResponse.json({ error: 'Channel and data are required' }, { status: 400 });
  }

  const apiUrl = process.env.CENTRIFUGO_HTTP_API_URL || 'http://localhost:8000/api';
  const apiKey = process.env.CENTRIFUGO_API_KEY || '';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${apiKey}`,
      },
      body: JSON.stringify({
        method: 'publish',
        params: { channel, data },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Centrifugo API error:', response.status, errorText);
      throw new Error(`Centrifugo API error: ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Publish API Error:', error);
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
  }
}
