// This serverless function runs on Cloudflare, not in the user's browser.
// It logs search terms to Firestore to build a popularity ranking.

import { initializeApp, getApps } from 'firebase/app';
// Use the full Firestore SDK to get access to advanced features like `increment`
import { getFirestore, doc, getDoc, writeBatch, increment } from 'firebase/firestore';

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

const extractKana = (text) => {
    const match = text.match(/(.+?)\s*[(（](.+?)[)）]/);
    if (match) {
        return {
            main: match[1].trim(),
            kana: match[2].trim()
        };
    }
    return { main: text.trim() };
};

const isNewKeyword = (s) => ['new', 'NEW', 'New', '新曲', '★', 'new!'].includes(s);
const isPracticingKeyword = (s) => ['練習中', '練習', 'practicing', 'Practicing', '勉強中'].includes(s);
const isSeasonKeyword = (s) => ['春', '夏', '秋', '冬'].includes(s);

const parseSongs = (str) => {
    if (!str) return [];
    return str.replace(/\r\n/g, '\n').split('\n').map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;
        
        const separator = trimmedLine.includes('\t') ? '\t' : ',';
        const parts = trimmedLine.split(separator).map(p => p.trim());
        
        // アーティスト, 曲名 の順
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        
        const artistParts = extractKana(parts[0]);
        const titleParts = extractKana(parts[1]);

        let isNew = false;
        let status = 'playable';
        let season = '';

        parts.slice(3).forEach(part => {
            if (!part) return;
            if (isNewKeyword(part)) isNew = true;
            if (isPracticingKeyword(part)) status = 'practicing';
            if (isSeasonKeyword(part)) season = part;
        });

        return {
            title: titleParts.main,
            artist: artistParts.main,
            titleKana: titleParts.kana,
            artistKana: artistParts.kana,
            genre: parts[2] || '',
            isNew: isNew,
            status: status === 'practicing' ? 'practicing' : 'playable',
            season: season || undefined
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
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    const successHeaders = { 'Content-Type': 'application/json', ...CORS_HEADERS };

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        return new Response(JSON.stringify({ success: true, message: "Server config error" }), { status: 200, headers: successHeaders });
    }

    const db = getFirestore(app);

    try {
        const { term } = await request.json();
        const searchTerm = normalizeForSearch(term);

        if (!searchTerm) {
            return new Response(JSON.stringify({ success: true, message: "No term provided" }), { status: 200, headers: successHeaders });
        }

        const songDocRef = doc(db, 'songlist/default');
        const docSnap = await getDoc(songDocRef);

        if (!docSnap.exists()) {
            return new Response(JSON.stringify({ success: true, message: "Song list not found" }), { status: 200, headers: successHeaders });
        }
        
        const songs = parseSongs(docSnap.data().list);
        let bestMatch = null;
        let highestScore = -1;

        const calculateScore = (song, term) => {
            const normalizedTitle = normalizeForSearch(song.title);
            const normalizedArtist = normalizeForSearch(song.artist);
            const normalizedTitleKana = normalizeForSearch(song.titleKana || '');
            const normalizedArtistKana = normalizeForSearch(song.artistKana || '');
            let score = 0;

            if (normalizedTitle === term || normalizedTitleKana === term) return 100;
            if (normalizedArtist === term || normalizedArtistKana === term) return 90;

            if (normalizedTitle.startsWith(term) || normalizedTitleKana.startsWith(term)) score = Math.max(score, 70);
            if (normalizedArtist.startsWith(term) || normalizedArtistKana.startsWith(term)) score = Math.max(score, 60);

            if (score > 0) return score;

            if (normalizedTitle.includes(term) || normalizedTitleKana.includes(term)) score = Math.max(score, 30);
            if (normalizedArtist.includes(term) || normalizedArtistKana.includes(term)) score = Math.max(score, 20);
            
            return score;
        };

        for (const song of songs) {
            const score = calculateScore(song, searchTerm);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = song;
            }
        }

        if (!bestMatch) {
            return new Response(JSON.stringify({ success: true, message: "No matching songs" }), { status: 200, headers: successHeaders });
        }
        
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const safeKey = bestMatch.title.replace(/\./g, '_'); // Firestore field paths cannot contain '.'

        const batch = writeBatch(db);
        
        // 1. Update all-time ranking
        const countRef = doc(db, 'songSearchCounts', bestMatch.title);
        batch.set(countRef, { count: increment(1), artist: bestMatch.artist }, { merge: true });

        // 2. Update monthly ranking
        const monthlyRef = doc(db, 'monthlySearchCounts', `${yyyy}-${mm}`);
        batch.set(monthlyRef, { [safeKey]: { count: increment(1), artist: bestMatch.artist } }, { merge: true });

        // 3. Update yearly ranking
        const yearlyRef = doc(db, 'yearlySearchCounts', `${yyyy}`);
        batch.set(yearlyRef, { [safeKey]: { count: increment(1), artist: bestMatch.artist } }, { merge: true });
        
        await batch.commit();

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: successHeaders });

    } catch (error) {
        console.warn('Logging search failed:', error);
        return new Response(JSON.stringify({ success: true, error: "Internal logging error" }), { status: 200, headers: successHeaders });
    }
}