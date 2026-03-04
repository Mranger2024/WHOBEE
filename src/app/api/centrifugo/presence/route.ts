import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = searchParams.get('channel');

  if (!channel) {
    return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
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
        method: 'presence',
        params: { channel },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Centrifugo API error:', response.status, errorText);
      throw new Error(`Centrifugo API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Presence API Error:', error);
    return NextResponse.json({ error: 'Failed to get presence' }, { status: 500 });
  }
}
