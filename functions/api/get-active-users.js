// This serverless function runs on Cloudflare, not in the user's browser.
// It retrieves the count of active users from Firestore.

import { initializeApp, getApps } from 'firebase/app';
// Use the "lite" version of Firestore, which is more reliable in serverless environments.
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore/lite';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function getFirebaseApp(env) {
    if (getApps().length) {
        return getApps()[0];
    }
    const firebaseConfig = {
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
        measurementId: env.FIREBASE_MEASUREMENT_ID,
    };
    
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Firebase environment variables are not set correctly.");
    }
    
    return initializeApp(firebaseConfig);
}

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
});

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        console.warn("Firebase Init Failed:", e.message);
        return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const db = getFirestore(app);

    try {
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        const usersRef = collection(db, 'activeUsers');
        const q = query(usersRef, where('lastSeen', '>', fiveMinutesAgo));
        
        // Use getDocs and the size property, as it's more reliable in CF Workers than getCountFromServer
        const snapshot = await getDocs(q);
        const count = snapshot.size;

        return jsonResponse({ count }, 200);

    } catch (error) {
        console.warn('Get active users count failed:', error);
        return jsonResponse({ error: 'Failed to fetch active users count.' }, 500);
    }
}