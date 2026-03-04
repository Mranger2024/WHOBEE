import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, Messaging } from 'firebase/messaging';
import { env } from './env';

// Firebase Client Configuration
const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App only if the required keys are present
export const initializeFirebaseClient = (): FirebaseApp | null => {
    if (typeof window === 'undefined') return null;

    // Check if the developer has configured Firebase yet
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.warn('Firebase configuration is missing. Push notifications will be disabled.');
        return null;
    }

    if (!getApps().length) {
        const app = initializeApp(firebaseConfig);

        // Pass the config to the Service Worker so it can initialize itself
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'INIT_FIREBASE',
                        config: firebaseConfig
                    });
                }
            });
        }

        return app;
    }
    return getApp();
};

export const requestFirebaseToken = async (): Promise<string | null> => {
    try {
        const app = initializeFirebaseClient();
        if (!app) return null;

        const messaging = getMessaging(app);

        // Use the VAPID key from environment variables
        // The VAPID key is necessary to securely authorize push subscriptions
        const token = await getToken(messaging, {
            vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });

        if (token) {
            return token;
        } else {
            console.log('No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
        return null;
    }
};
