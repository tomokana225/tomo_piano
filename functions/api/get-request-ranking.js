// This serverless function runs on Cloudflare.
// It retrieves the song request ranking data from Firestore.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore/lite';

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

const processRankingData = (requestData) => {
    return Object.entries(requestData)
        .map(([title, details]) => ({
            id: title.replace(/_/g, '.'),
            ...details
        }))
        .sort((a, b) => b.count - a.count);
};


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
        const url = new URL(request.url);
        const period = url.searchParams.get('period') || 'all';
        let rankings = [];

        if (period === 'all') {
            const requestsRef = collection(db, 'songRequests');
            const q = query(requestsRef, orderBy('count', 'desc'), limit(100));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                rankings.push({
                    id: doc.id, // This is the song title
                    ...doc.data()
                });
            });
        } else {
             const now = new Date();
            let docId;
            let collectionName;
            if (period === 'month') {
                const yyyy = now.getFullYear();
                const mm = (now.getMonth() + 1).toString().padStart(2, '0');
                docId = `${yyyy}-${mm}`;
                collectionName = 'monthlyRequestCounts';
            } else { // year
                docId = `${now.getFullYear()}`;
                collectionName = 'yearlyRequestCounts';
            }
            
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                rankings = processRankingData(docSnap.data());
            }
        }
        
        return jsonResponse(rankings, 200, {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=300'
        });

    } catch (error) {
        console.warn('Get request ranking failed:', error);
        return jsonResponse({ error: 'Failed to fetch request rankings.' }, 500, corsHeaders);
    }
}