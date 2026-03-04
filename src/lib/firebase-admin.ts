import * as admin from 'firebase-admin';
import { env } from './env';

// Initialize Firebase Admin for server-side operations (like broadcasting the Traffic Surge)
export function getFirebaseAdmin() {
    // If the developer hasn't configured Firebase Admin yet, fail gracefully
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
        return null;
    }

    if (!admin.apps.length) {
        try {
            // Firebase private keys exported from the console have literal \n characters that must be parsed
            const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: env.FIREBASE_PROJECT_ID,
                    clientEmail: env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
        } catch (error) {
            console.error('Firebase admin initialization error', error);
            return null;
        }
    }
    return admin;
}
