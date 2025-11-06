// This serverless function runs on Cloudflare, not in the user's browser.
// It logs search terms to Firestore to build a popularity ranking.

import { initializeApp, getApps } from 'firebase/app';
// Use the lite Firestore SDK and transactions for atomic updates
import { getFirestore, doc, getDoc, runTransaction } from 'firebase/firestore/lite';

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

const parseSongs = (str) => {
    if (!str) return [];
    return str.replace(/\r\n/g, '\n').split('\n').map(line => {
        if (!line.trim()) return null;
        const parts = line.split(',');
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        return {
            title: parts[0].trim(),
            artist: parts[1].trim(),
            genre: parts[2]?.trim() || '',
            isNew: parts[3]?.trim()?.toLowerCase() === 'new',
            status: parts[4]?.trim()?.toLowerCase() === '練習中' ? 'practicing' : 'playable',
        };
    }).filter(Boolean);
};

const hiraToKata = (str) => {
  if (!str) return '';
  return str.replace(/[\u3041-\u3096]/g, (match) => {
    const charCode = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(charCode);
  });
};

const normalizeForSearch = (str) => {
  if (!str) return '';
  const halfWidth = str.replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
  const katakana = hiraToKata(halfWidth);
  return katakana.toLowerCase().replace(/[\s'’"”.,!&ー()]+/g, '');
};


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
    
    // For logging, we don't need to block execution on the client-side.
    // Respond immediately and log in the background.
    const logPromise = async () => {
        try {
            const app = await getFirebaseApp(env);
            const db = getFirestore(app);
            const { term } = await request.clone().json();
            const searchTerm = normalizeForSearch(term);
    
            if (!searchTerm) return;
    
            const songDocRef = doc(db, 'songlist/default');
            const docSnap = await getDoc(songDocRef);
    
            if (!docSnap.exists()) return;
            
            const songs = parseSongs(docSnap.data().list);
            let bestMatch = null;
            let highestScore = -1;
    
            const calculateScore = (song, term) => {
                const songTitle = normalizeForSearch(song.title);
                const songArtist = normalizeForSearch(song.artist);
                let score = 0;
                if (songTitle === term) score = 100;
                else if (songArtist === term) score = 90;
                else if (songTitle.startsWith(term)) score = 70;
                else if (songArtist.startsWith(term)) score = 60;
                else if (songTitle.includes(term)) score = 30;
                else if (songArtist.includes(term)) score = 20;
                return score;
            };
    
            for (const song of songs) {
                const score = calculateScore(song, searchTerm);
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = song;
                }
            }
    
            if (!bestMatch) return;
            
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = (now.getMonth() + 1).toString().padStart(2, '0');
            const safeKey = bestMatch.title.replace(/\./g, '_');
    
            await runTransaction(db, async (transaction) => {
                const countRef = doc(db, 'songSearchCounts', bestMatch.title);
                const countDoc = await transaction.get(countRef);
                const newAllTimeCount = (countDoc.data()?.count || 0) + 1;
                transaction.set(countRef, { count: newAllTimeCount, artist: bestMatch.artist }, { merge: true });
    
                const monthlyRef = doc(db, 'monthlySearchCounts', `${yyyy}-${mm}`);
                const monthlyDoc = await transaction.get(monthlyRef);
                const monthlyData = monthlyDoc.data() || {};
                const newMonthlyCount = (monthlyData[safeKey]?.count || 0) + 1;
                transaction.set(monthlyRef, { [safeKey]: { count: newMonthlyCount, artist: bestMatch.artist } }, { merge: true });
                
                const yearlyRef = doc(db, 'yearlySearchCounts', `${yyyy}`);
                const yearlyDoc = await transaction.get(yearlyRef);
                const yearlyData = yearlyDoc.data() || {};
                const newYearlyCount = (yearlyData[safeKey]?.count || 0) + 1;
                transaction.set(yearlyRef, { [safeKey]: { count: newYearlyCount, artist: bestMatch.artist } }, { merge: true });
            });
        } catch (error) {
            console.warn('Background search logging failed:', error);
        }
    };
    
    context.waitUntil(logPromise());

    return jsonResponse({ success: true }, 200, corsHeaders);
}