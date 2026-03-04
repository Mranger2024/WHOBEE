import { z } from 'zod';

const serverSchema = z.object({
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    CENTRIFUGO_HTTP_API_URL: z.string().url(),
    CENTRIFUGO_API_KEY: z.string().min(1),
    CENTRIFUGO_TOKEN_HMAC_SECRET_KEY: z.string().min(1),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
});

const clientSchema = z.object({
    NEXT_PUBLIC_CENTRIFUGO_WS_URL: z.string().url(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().optional(),
});

export const validateEnv = () => {
    const isServer = typeof window === 'undefined';

    try {
        // Always validate client variables
        const clientParsed = clientSchema.parse({
            NEXT_PUBLIC_CENTRIFUGO_WS_URL: process.env.NEXT_PUBLIC_CENTRIFUGO_WS_URL,
            NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
            NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (isServer) {
            // Only validate server variables on the backend
            const serverParsed = serverSchema.parse(process.env);
            return { ...serverParsed, ...clientParsed };
        }

        // On the client, return just the public variables + placeholders for server ones to keep types happy
        return clientParsed as any;
    } catch (err) {
        if (err instanceof z.ZodError) {
            console.error(
                "❌ Invalid or missing environment variables:\n",
                err.issues.map((issue) => `- ${issue.path.join('.')}: ${issue.message}`).join('\n')
            );
            if (process.env.NODE_ENV === 'production') {
                throw new Error("Invalid environment variables. Check your deployment console.");
            }
        }
        throw err;
    }
};

export const env = validateEnv();
