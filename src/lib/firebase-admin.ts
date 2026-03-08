import * as admin from 'firebase-admin';
import { env } from './env';

// Initialize Firebase Admin singleton
function initFirebaseAdmin(): admin.app.App | null {
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
        console.warn('[Firebase Admin] Credentials not configured');
        return null;
    }

    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    try {
        // Firebase private keys exported from the console have literal \n characters that must be parsed
        const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId: env.FIREBASE_PROJECT_ID,
                clientEmail: env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    } catch (error) {
        console.error('[Firebase Admin] Initialization error:', error);
        return null;
    }
}

const firebaseAdminApp = initFirebaseAdmin();

// 🔒 Use this in API routes to verify Firebase ID tokens
export const adminAuth = firebaseAdminApp ? admin.auth(firebaseAdminApp) : null;

// Legacy getter for backward compatibility
export function getFirebaseAdmin() {
    return firebaseAdminApp ? admin : null;
}
