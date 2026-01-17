
// This serverless function runs on Cloudflare.
// It retrieves the daily visit statistics from Firestore based on JST.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore/lite';

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
    return initializeApp(firebaseConfig);
}

const getJSTDateStr = () => {
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Tokyo'
    }).format(new Date()).replace(/\//g, '-');
};

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        return new Response(JSON.stringify({ error: "Firebase Init Failed" }), { status: 500, headers: CORS_HEADERS });
    }

    const db = getFirestore(app);

    try {
        const todayStr = getJSTDateStr();
        const statsRef = doc(db, 'dailyStats', todayStr);
        const statsSnap = await getDoc(statsRef);
        
        let totalVisits = 0;
        if (statsSnap.exists()) {
            totalVisits = statsSnap.data().totalVisits || 0;
        }

        return new Response(JSON.stringify({ totalVisits, date: todayStr }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
    }
}
