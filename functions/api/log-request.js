// This serverless function runs on Cloudflare, not in the user's browser.
// It logs song requests to Firestore.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, runTransaction } from 'firebase/firestore/lite';

const ALLOWED_ORIGIN = 'https://tomo-piano.pages.dev';

const createCorsHeaders = (request) => {
    const origin = request.headers.get('Origin');
    const isAllowed = origin === ALLOWED_ORIGIN;
    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin'
    };
};

const jsonResponse = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
});

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

export async function onRequest(context) {
    const { request, env } = context;
    const corsHeaders = createCorsHeaders(request);
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method Not Allowed' }, 405, corsHeaders);
    }
    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
    }

    try {
        const app = await getFirebaseApp(env);
        const db = getFirestore(app);
        const { term, artist, requester } = await request.json();

        if (!term || typeof term !== 'string' || term.trim().length === 0) {
            return jsonResponse({ error: "Invalid song title provided." }, 400, corsHeaders);
        }
        
        const songTitle = term.trim();
        const safeKey = songTitle.replace(/\./g, '_');
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        
        const isAnonymousRequest = !requester || requester.trim() === '';

        await runTransaction(db, async (transaction) => {
            // 1. Update all-time request count
            const requestRef = doc(db, 'songRequests', songTitle);
            const requestDoc = await transaction.get(requestRef);
            const newRequestCount = (requestDoc.data()?.count || 0) + 1;
            const dataToSet = { 
                count: newRequestCount,
                artist: artist || '',
                lastRequester: isAnonymousRequest ? 'anonymous' : requester,
                isAnonymous: isAnonymousRequest,
                lastRequestedAt: Date.now()
            };
            transaction.set(requestRef, dataToSet, { merge: true });
            
            // 2. Update monthly request count
            const monthlyRef = doc(db, 'monthlyRequestCounts', `${yyyy}-${mm}`);
            const monthlyDoc = await transaction.get(monthlyRef);
            const monthlyData = monthlyDoc.data() || {};
            const newMonthlyCount = (monthlyData[safeKey]?.count || 0) + 1;
            transaction.set(monthlyRef, { [safeKey]: { count: newMonthlyCount, artist: artist || '' } }, { merge: true });

            // 3. Update yearly request count
            const yearlyRef = doc(db, 'yearlyRequestCounts', `${yyyy}`);
            const yearlyDoc = await transaction.get(yearlyRef);
            const yearlyData = yearlyDoc.data() || {};
            const newYearlyCount = (yearlyData[safeKey]?.count || 0) + 1;
            transaction.set(yearlyRef, { [safeKey]: { count: newYearlyCount, artist: artist || '' } }, { merge: true });
        });

        return jsonResponse({ success: true }, 200, corsHeaders);

    } catch (error) {
        console.warn('Logging request failed:', error);
        return jsonResponse({ error: 'Failed to log request.' }, 500, corsHeaders);
    }
}