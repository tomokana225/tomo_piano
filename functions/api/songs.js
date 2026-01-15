
// This serverless function runs on Cloudflare, not in the user's browser.
// It acts as a secure intermediary to communicate with Firebase.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, deleteDoc, limit } from 'firebase/firestore/lite';

const DEFAULT_UI_CONFIG = {
    mainTitle: 'ともかなのリクエスト曲ー検索',
    subtitle: 'ピアノの配信でリクエストをする際に、その曲が配信者の弾ける曲かどうかを調べるアプリ',
    primaryColor: '#ec4899',
    twitcastingUrl: 'https://twitcasting.tv/g:101738740616323847745',
    xUrl: 'https://x.com/',
    youtubeUrl: 'https://www.youtube.com/',
    printGakufuUrl: 'https://www.print-gakufu.com/',
    ofuseUrl: '',
    doneruUrl: '',
    amazonWishlistUrl: '',
    backgroundType: 'image',
    backgroundColor: '#f3f4f6',
    darkBackgroundColor: '#111827',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop',
    backgroundOpacity: 0.1,
    twitcastingIconUrl: '',
    xIconUrl: '',
    youtubeIconUrl: '',
    supportIconUrl: '',
    headingFontFamily: "'Kiwi Maru', serif",
    bodyFontFamily: "'Noto Sans JP', sans-serif",
    headingFontScale: 1.0,
    bodyFontScale: 1.0,
    borderRadius: 'medium',
    cardStyle: 'elevated',
    shadowIntensity: 0.1,
    specialButtons: {
        twitcas: { label: 'ツイキャスはこちら', enabled: true },
        x: { label: 'X (Twitter) はこちら', enabled: true },
        youtube: { label: 'YouTubeはこちら', enabled: true },
        support: { label: '配信者をサポート', enabled: true },
    },
    navButtons: {
        search: { label: '曲を検索', enabled: true },
        profile: { label: 'プロフィール', enabled: true },
        list: { label: '曲リスト', enabled: true },
        ranking: { label: 'ランキング', enabled: true },
        news: { label: 'お知らせ', enabled: true },
        requests: { label: 'リクエスト', enabled: true },
        suggest: { label: 'おまかせ選曲', enabled: true },
        setlist: { label: 'セトリ提案', enabled: true },
        printGakufu: { label: 'ぷりんと楽譜', enabled: true },
        tutorial: { label: '使い方ガイド', enabled: true },
    }
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
};

async function getFirebaseApp(env) {
    if (getApps().length) return getApps()[0];
    return initializeApp({
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
        storageBucket: env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
        appId: env.FIREBASE_APP_ID,
        measurementId: env.FIREBASE_MEASUREMENT_ID,
    });
}

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
});

const errorResponse = (message, status = 500) => jsonResponse({ error: message }, status);

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        return errorResponse("Server configuration error.", 500);
    }
    
    const db = getFirestore(app);
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // --- Authentication Check (for mutations) ---
    const adminPassword = env.ADMIN_PASSWORD || 'admin225'; // Cloudflare Secret
    const providedPassword = request.headers.get('X-Admin-Password');
    
    const isAuthenticated = providedPassword === adminPassword;

    if (request.method === 'POST') {
        if (!isAuthenticated) {
            return errorResponse('Authentication failed.', 401);
        }

        try {
            const data = await request.json();
            
            // パスワード確認用（ping）
            if (data.ping) {
                return jsonResponse({ success: true });
            }

            if (data.list) {
                const docRef = doc(db, 'songlist/default');
                await setDoc(docRef, { list: data.list });
                return jsonResponse({ success: true });
            }
            
            if (action === 'saveUiConfig') {
                const docRef = doc(db, 'config/ui');
                // セキュリティのため、保存データからパスワード情報を削除
                const { adminPassword: _, ...configToSave } = data;
                await setDoc(docRef, configToSave, { merge: true });
                return jsonResponse({ success: true });
            }

            if (action === 'saveBlogPost') {
                const { id, ...postData } = data;
                const docRef = id ? doc(db, 'blogPosts', id) : doc(collection(db, 'blogPosts'));
                await setDoc(docRef, {
                    ...postData,
                    createdAt: postData.createdAt || Date.now()
                }, { merge: true });
                return jsonResponse({ success: true });
            }
            
            if (action === 'deleteBlogPost') {
                if (!data.id) return errorResponse('Post ID is required.', 400);
                const docRef = doc(db, 'blogPosts', data.id);
                await deleteDoc(docRef);
                return jsonResponse({ success: true });
            }

            return errorResponse('Invalid POST action.', 400);

        } catch (error) {
            return errorResponse('Failed to process POST request.');
        }
    }

    // --- GET Actions ---
    if (action === 'getUiConfig') {
        try {
            const docRef = doc(db, 'config/ui');
            const docSnap = await getDoc(docRef);
            let finalConfig = DEFAULT_UI_CONFIG;
            
            if (docSnap.exists()) {
                const firestoreConfig = docSnap.data();
                // セキュリティのため、万が一 Firestore に保存されていてもクライアントには送らない
                delete firestoreConfig.adminPassword; 
                
                finalConfig = {
                    ...DEFAULT_UI_CONFIG,
                    ...firestoreConfig,
                    specialButtons: { ...DEFAULT_UI_CONFIG.specialButtons, ...(firestoreConfig.specialButtons || {}) },
                    navButtons: { ...DEFAULT_UI_CONFIG.navButtons, ...(firestoreConfig.navButtons || {}) }
                };
            }
            return jsonResponse(finalConfig);
        } catch (error) {
            return errorResponse('Failed to fetch UI config.');
        }
    }

    // ... その他のアクション ...
    if (action === 'getBlogPosts') {
        const postsRef = collection(db, 'blogPosts');
        const now = Date.now();
        const q = query(postsRef, where('isPublished', '==', true), where('createdAt', '<=', now), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return jsonResponse(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    if (action === 'getAdminBlogPosts') {
        if (!isAuthenticated) return errorResponse('Forbidden', 403);
        const postsRef = collection(db, 'blogPosts');
        const q = query(postsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return jsonResponse(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    
    // Default: Return song list
    try {
        const docRef = doc(db, 'songlist/default');
        const docSnap = await getDoc(docRef);
        return jsonResponse({ list: docSnap.exists() ? docSnap.data().list : "" });
    } catch (error) {
        return jsonResponse({ list: "" });
    }
}
