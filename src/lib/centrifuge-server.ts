export class CentrifugoServer {
    private apiUrl: string;
    private apiKey: string;

    constructor() {
        this.apiUrl = process.env.CENTRIFUGO_API_URL || 'http://localhost:8000/api';
        this.apiKey = process.env.CENTRIFUGO_API_KEY || '';

        if (!this.apiKey) {
            console.warn('CENTRIFUGO_API_KEY is not set. Server-side publishing will fail.');
        }
    }

    async publish(channel: string, data: any, options: { client?: string } = {}) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `apikey ${this.apiKey}`
                },
                body: JSON.stringify({
                    method: 'publish',
                    params: {
                        channel,
                        data,
                        ...options
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Centrifugo API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to publish to Centrifugo:', error);
            throw error;
        }
    }

    async broadcast(channels: string[], data: any) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `apikey ${this.apiKey}`
                },
                body: JSON.stringify({
                    method: 'broadcast',
                    params: {
                        channels,
                        data
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Centrifugo API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to broadcast to Centrifugo:', error);
            throw error;
        }
    }
}

export const centrifugo = new CentrifugoServer();
