// This serverless function runs on Cloudflare, not in the user's browser.
// It retrieves the search ranking data from Firestore.

import { initializeApp, getApps } from 'firebase/app';
// Use the lite version of Firestore for performance in a serverless environment
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

const processRankingData = (songData) => {
    const songRanking = Object.entries(songData)
        .map(([title, details]) => ({
            id: title.replace(/_/g, '.'), // Restore original title
            ...details
        }))
        .sort((a, b) => b.count - a.count);

    const artistCounts = new Map();
    songRanking.forEach(song => {
        if (song.artist) {
            artistCounts.set(song.artist, (artistCounts.get(song.artist) || 0) + song.count);
        }
    });
    
    const artistRanking = Array.from(artistCounts, ([artist, count]) => ({ id: artist, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50);

    return { songRanking, artistRanking };
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
        const period = url.searchParams.get('period') || 'all'; // 'all', 'month', 'year'

        let responsePayload = { songRanking: [], artistRanking: [] };

        if (period === 'all') {
            const countsRef = collection(db, 'songSearchCounts');
            const q = query(countsRef, orderBy('count', 'desc'), limit(100));
            const querySnapshot = await getDocs(q);
            const songRanking = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const artistCounts = new Map();
            songRanking.forEach(song => {
                if (song.artist) {
                    artistCounts.set(song.artist, (artistCounts.get(song.artist) || 0) + song.count);
                }
            });
            const artistRanking = Array.from(artistCounts, ([artist, count]) => ({ id: artist, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 50);
            responsePayload = { songRanking, artistRanking };

        } else {
            const now = new Date();
            let docId;
            let collectionName;
            if (period === 'month') {
                const yyyy = now.getFullYear();
                const mm = (now.getMonth() + 1).toString().padStart(2, '0');
                docId = `${yyyy}-${mm}`;
                collectionName = 'monthlySearchCounts';
            } else { // year
                docId = `${now.getFullYear()}`;
                collectionName = 'yearlySearchCounts';
            }
            
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                responsePayload = processRankingData(docSnap.data());
            }
        }
        
        return jsonResponse(responsePayload, 200, {
            ...corsHeaders,
            'Cache-Control': 'public, max-age=300',
        });

    } catch (error) {
        console.warn('Get ranking failed:', error);
        return jsonResponse({ error: 'Failed to fetch rankings.' }, 500, corsHeaders);
    }
}