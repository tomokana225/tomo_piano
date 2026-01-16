
// This serverless function runs on Cloudflare, not in the user's browser.
// It logs a user's presence to Firestore and tracks daily unique visits.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore/lite';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }
    
    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        console.warn("Firebase Init Failed:", e.message);
        return jsonResponse({ success: true, message: "Server config error" });
    }

    const db = getFirestore(app);

    try {
        const { clientId } = await request.json();

        if (!clientId || typeof clientId !== 'string' || clientId.trim().length === 0) {
            return jsonResponse({ error: "clientId is required." }, 400);
        }
        
        const now = Date.now();
        const dateStr = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
        
        const userRef = doc(db, 'activeUsers', clientId.trim());
        const userSnap = await getDoc(userRef);
        
        let isFirstSeenToday = true;
        
        if (userSnap.exists()) {
            const lastSeen = userSnap.data().lastSeen || 0;
            const lastSeenDate = new Date(lastSeen).toISOString().split('T')[0];
            if (lastSeenDate === dateStr) {
                isFirstSeenToday = false;
            }
        }

        // Update active user status
        await setDoc(userRef, { lastSeen: now }, { merge: true });

        // If this is the first heartbeat today for this client, increment total daily visits
        if (isFirstSeenToday) {
            const statsRef = doc(db, 'dailyStats', dateStr);
            const statsSnap = await getDoc(statsRef);
            if (statsSnap.exists()) {
                await updateDoc(statsRef, { totalVisits: increment(1) });
            } else {
                await setDoc(statsRef, { totalVisits: 1, date: dateStr });
            }
        }

        return jsonResponse({ success: true });

    } catch (error) {
        console.warn('Logging presence failed:', error);
        return jsonResponse({ success: true, error: "Internal logging error" });
    }
}
