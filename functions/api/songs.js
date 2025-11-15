// This serverless function runs on Cloudflare, not in the user's browser.
// It acts as a secure intermediary to communicate with Firebase.
// This function has been extended to act as a router for multiple actions.

import { initializeApp, getApps } from 'firebase/app';
// Use the "lite" version of Firestore for serverless environments to avoid timeouts
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, deleteDoc, limit } from 'firebase/firestore/lite';

// Default song list to be used if Firestore is empty
const PLAYABLE_SONGS_EXAMPLE_STR = "夜に駆ける,YOASOBI,J-Pop,new\nPretender,Official髭男dism (オフィシャルヒゲダンディズム),J-Pop\nLemon,米津玄師,J-Pop\n紅蓮華,LiSA,Anime\nドライフラワー,優里,J-Pop\n白日,King Gnu (キングヌー),J-Rock\nマリーゴールド,あいみょん,J-Pop\n猫,DISH//,J-Rock\nうっせぇわ,Ado,J-Pop\n廻廻奇譚,Eve,Anime\n炎,LiSA,Anime\nCry Baby,Official髭男dism (オフィシャルヒゲダンディズム),Anime\nアイドル,YOASOBI,Anime,new\nKICK BACK,米津玄師,Anime\n新時代,Ado,Anime\n旅路,藤井風,J-Pop\n何なんw,藤井風,J-Pop\ngrace,藤井風,J-Pop\nきらり,藤井風,J-Pop\nSubtitle,Official髭男dism (オフィシャルヒゲダンディズム),J-Pop\n怪獣の花唄,Vaundy,J-Rock\nミックスナッツ,Official髭男dism (オフィシャルヒゲダンディズム),Anime\n水平線,back number (バックナンバー),J-Pop\nシンデレラボーイ,Saucy Dog,J-Rock\nなんでもないや,RADWIMPS,Anime\nひまわりの約束,秦基博,J-Pop\nHANABI,Mr.Children,J-Pop\n天体観測,BUMP OF CHICKEN (バンプオブチキン),J-Rock\n残酷な天使のテーゼ,高橋洋子,Anime\n千本桜,黒うさP,Vocaloid,,練習中";

const DEFAULT_UI_CONFIG = {
    mainTitle: 'ともかなのリクエスト曲ー検索',
    subtitle: '弾ける曲 or ぷりんと楽譜にある曲かチェックできます',
    primaryColor: '#ec4899',
    twitcastingUrl: 'https://twitcasting.tv/g:101738740616323847745',
    xUrl: '',
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
    supportIconUrl: '',
    headingFontFamily: "'Kiwi Maru', serif",
    bodyFontFamily: "'Noto Sans JP', sans-serif",
    headingFontScale: 1.0,
    bodyFontScale: 1.0,
    specialButtons: {
        twitcas: { label: 'ツイキャス配信はこちら', enabled: true },
        x: { label: 'X (Twitter) はこちら', enabled: true },
        support: { label: '配信者支援', enabled: true },
    },
    navButtons: {
        search: { label: '曲を検索', enabled: true },
        printGakufu: { label: 'ぷりんと楽譜', enabled: true },
        list: { label: '曲リスト', enabled: true },
        ranking: { label: 'ランキング', enabled: true },
        news: { label: 'お知らせ', enabled: true },
        requests: { label: 'リクエスト', enabled: true },
        suggest: { label: 'おまかせ選曲', enabled: true },
        setlist: { label: 'セトリ提案', enabled: true },
    }
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// --- Firebase Initialization ---
// This helper function ensures Firebase is initialized only once.
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
    
    // Basic validation to ensure environment variables are present
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Firebase environment variables (FIREBASE_API_KEY, FIREBASE_PROJECT_ID) are not set correctly on the server.");
    }
    
    return initializeApp(firebaseConfig);
}

// --- Generic Response Helpers ---
const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
});

const errorResponse = (message, status = 500) => jsonResponse({ error: message }, status);

// --- Main Request Handler ---
export async function onRequest(context) {
    const { request, env } = context;

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    let app;
    try {
        app = await getFirebaseApp(env);
    } catch (e) {
        console.error("Firebase Initialization Failed:", e.message);
        // This is a critical server error, so we inform the client.
        return errorResponse("Server configuration error.", 500);
    }
    
    const db = getFirestore(app);
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // --- Action: Get Firebase Config (for client-side initialization) ---
    if (action === 'getFirebaseConfig') {
        const firebaseConfig = {
            apiKey: env.FIREBASE_API_KEY,
            authDomain: env.FIREBASE_AUTH_DOMAIN,
            projectId: env.FIREBASE_PROJECT_ID,
            storageBucket: env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
            appId: env.FIREBASE_APP_ID,
            measurementId: env.FIREBASE_MEASUREMENT_ID,
        };
        return jsonResponse(firebaseConfig);
    }

    // --- Action: Get UI Config ---
    if (action === 'getUiConfig') {
        try {
            const docRef = doc(db, 'config/ui');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return jsonResponse({ ...DEFAULT_UI_CONFIG, ...docSnap.data() });
            }
            return jsonResponse(DEFAULT_UI_CONFIG);
        } catch (error) {
            console.error('getUiConfig failed:', error);
            return errorResponse('Failed to fetch UI config.');
        }
    }

    // --- Action: Get Published Blog Posts ---
    if (action === 'getBlogPosts') {
        try {
            const postsRef = collection(db, 'blogPosts');
            const now = Date.now();
            const q = query(postsRef, where('isPublished', '==', true), where('createdAt', '<=', now), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return jsonResponse(posts);
        } catch (error) {
            console.error('getBlogPosts failed:', error);
            return errorResponse('Failed to fetch blog posts.');
        }
    }

    // --- Action: Get All Blog Posts (for Admin) ---
    if (action === 'getAdminBlogPosts') {
         try {
            const postsRef = collection(db, 'blogPosts');
            const q = query(postsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return jsonResponse(posts);
        } catch (error) {
            console.error('getAdminBlogPosts failed:', error);
            return errorResponse('Failed to fetch admin blog posts.');
        }
    }

    // --- Action: Get Setlist Suggestions ---
    if (action === 'getSetlistSuggestions') {
        try {
            const suggestionsRef = collection(db, 'setlistSuggestions');
            const q = query(suggestionsRef, orderBy('createdAt', 'desc'), limit(20));
            const querySnapshot = await getDocs(q);
            const suggestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return jsonResponse(suggestions);
        } catch (error) {
            console.error('getSetlistSuggestions failed:', error);
            return errorResponse('Failed to fetch setlist suggestions.');
        }
    }

    // --- Action: Get Recent Requests ---
    if (action === 'getRecentRequests') {
        try {
            const requestsRef = collection(db, 'songRequests');
            const q = query(requestsRef, orderBy('lastRequestedAt', 'desc'), limit(20));
            const querySnapshot = await getDocs(q);
            const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return jsonResponse(requests);
        } catch (error) {
            console.error('getRecentRequests failed:', error);
            return errorResponse('Failed to fetch recent requests.');
        }
    }
    
    // --- POST Requests Router ---
    if (request.method === 'POST') {
        try {
            const data = await request.json();
            
            // --- Action: Save Song List ---
            if (data.list) {
                const docRef = doc(db, 'songlist/default');
                await setDoc(docRef, { list: data.list });
                return jsonResponse({ success: true });
            }
            
            // --- Action: Save UI Config ---
            if (action === 'saveUiConfig') {
                const docRef = doc(db, 'config/ui');
                await setDoc(docRef, data, { merge: true });
                return jsonResponse({ success: true });
            }

            // --- Action: Save Blog Post ---
            if (action === 'saveBlogPost') {
                const { id, ...postData } = data;
                const docRef = id ? doc(db, 'blogPosts', id) : doc(collection(db, 'blogPosts'));
                await setDoc(docRef, {
                    ...postData,
                    createdAt: postData.createdAt || Date.now()
                }, { merge: true });
                return jsonResponse({ success: true });
            }
            
            // --- Action: Delete Blog Post ---
            if (action === 'deleteBlogPost') {
                if (!data.id) return errorResponse('Post ID is required.', 400);
                const docRef = doc(db, 'blogPosts', data.id);
                await deleteDoc(docRef);
                return jsonResponse({ success: true });
            }

            // --- Action: Save Setlist Suggestion ---
            if (action === 'saveSetlistSuggestion') {
                if (!data.songs || !data.requester) return errorResponse('Invalid suggestion data.', 400);
                const docRef = doc(collection(db, 'setlistSuggestions'));
                await setDoc(docRef, {
                    songs: data.songs,
                    requester: data.requester,
                    createdAt: Date.now()
                });
                return jsonResponse({ success: true });
            }

            return errorResponse('Invalid POST action.', 400);

        } catch (error) {
            console.error('POST request failed:', error);
            return errorResponse('Failed to process POST request.');
        }
    }

    // --- Default Action: Get Song List (GET request) ---
    try {
        const docRef = doc(db, 'songlist/default');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().list) {
            return jsonResponse({ list: docSnap.data().list });
        } else {
            // If the document doesn't exist or is empty, save and return the default list
            await setDoc(docRef, { list: PLAYABLE_SONGS_EXAMPLE_STR });
            return jsonResponse({ list: PLAYABLE_SONGS_EXAMPLE_STR });
        }
    } catch (error) {
        console.error('Default action (get song list) failed:', error);
        // Fallback to default list on error
        return jsonResponse({ list: PLAYABLE_SONGS_EXAMPLE_STR });
    }
}