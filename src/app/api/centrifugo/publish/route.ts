import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { channel, data } = body;

  if (!channel || !data) {
    return NextResponse.json({ error: 'Channel and data are required' }, { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_CENTRIFUGO_API_URL || 'http://localhost:8000/api';
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
