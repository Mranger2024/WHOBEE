import { NextResponse } from 'next/server';

// This would be the URL to your Centrifugo server
const CENTRIFUGO_API_URL = process.env.CENTRIFUGO_API_URL || 'http://localhost:8000/api';
// This would be stored securely in your environment variables
const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY || 'test_api_key';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel parameter is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${CENTRIFUGO_API_URL}/history?channel=${encodeURIComponent(channel)}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `apikey ${CENTRIFUGO_API_KEY}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to get history');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting history:', error);
    return NextResponse.json(
      { error: 'Failed to get history' },
      { status: 500 }
    );
  }
}
