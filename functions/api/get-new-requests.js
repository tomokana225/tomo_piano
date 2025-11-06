// This serverless function runs on Cloudflare.
// It retrieves new song requests that were submitted via the form (i.e., not anonymous likes).

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore/lite';

const ALLOWED_ORIGIN = 'https://tomo-piano.pages.dev';

const createCorsHeaders = (request) => {
    const origin = request.headers.get('Origin');
    const isAllowed = origin === ALLOWED_ORIGIN;
    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    if (request.method !== 'GET') {
        return jsonResponse({ error: 'Method Not Allowed' }, 405, corsHeaders);
    }
    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
    }

    try {
        const app = await getFirebaseApp(env);
        const db = getFirestore(app);
        const requestsRef = collection(db, 'songRequests');
        
        // This efficient query filters for non-anonymous requests and orders them by date.
        // It requires a composite index on (isAnonymous, lastRequestedAt).
        // Firestore will provide a link in the error console to create it if it doesn't exist.
        const q = query(
            requestsRef, 
            where('isAnonymous', '==', false),
            orderBy('lastRequestedAt', 'desc'),
            limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const newRequests = [];
        querySnapshot.forEach((doc) => {
            newRequests.push({
                id: doc.id, // This is the song title
                ...doc.data()
            });
        });
        
        return jsonResponse(newRequests, 200, {
            ...corsHeaders,
            'Cache-Control': 'no-cache'
        });

    } catch (error) {
        console.warn('Get new requests failed:', error);
        // Provide a specific error if it's a missing index problem.
        if (error.code === 'failed-precondition') {
             return jsonResponse({ 
                 error: 'Query requires an index. Please check the Firebase console for a link to create it. This is a one-time setup.',
                 details: error.message 
             }, 500, corsHeaders);
        }
        return jsonResponse({ error: 'Failed to fetch new requests.' }, 500, corsHeaders);
    }
}