
// This serverless function runs on Cloudflare, not in the user's browser.
// It logs a user's presence to Firestore and tracks daily unique visits based on JST.

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

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }
    
    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: "Firebase Init Failed" }), { headers: CORS_HEADERS });
    }

    const db = getFirestore(app);

    try {
        const { clientId } = await request.json();
        if (!clientId) return new Response('Missing clientId', { status: 400 });

        const now = Date.now();
        const todayStr = getJSTDateStr();
        
        const userRef = doc(db, 'activeUsers', clientId.trim());
        const userSnap = await getDoc(userRef);
        
        let isFirstVisitToday = true;
        
        if (userSnap.exists()) {
            const lastSeen = userSnap.data().lastSeen || 0;
            const lastSeenDate = new Intl.DateTimeFormat('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: 'Asia/Tokyo'
            }).format(new Date(lastSeen)).replace(/\//g, '-');
            
            if (lastSeenDate === todayStr) {
                isFirstVisitToday = false;
            }
        }

        // アクティブ状態を更新
        await setDoc(userRef, { lastSeen: now, clientId: clientId.trim() }, { merge: true });

        // 今日初めてのアクセスなら総訪問者数をカウントアップ
        if (isFirstVisitToday) {
            const statsRef = doc(db, 'dailyStats', todayStr);
            const statsSnap = await getDoc(statsRef);
            if (statsSnap.exists()) {
                await updateDoc(statsRef, { totalVisits: increment(1) });
            } else {
                await setDoc(statsRef, { totalVisits: 1, date: todayStr }, { merge: true });
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });

    } catch (error) {
        console.error('Presence error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
    }
}
