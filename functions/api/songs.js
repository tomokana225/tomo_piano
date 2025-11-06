// This serverless function runs on Cloudflare, not in the user's browser.
// It acts as a secure intermediary to communicate with Firebase.
// This function has been extended to act as a router for multiple actions.

import { initializeApp, getApps } from 'firebase/app';
import { 
    getFirestore, doc, getDoc, setDoc, collection, getDocs, 
    query, where, orderBy, deleteDoc, addDoc, serverTimestamp, updateDoc 
} from 'firebase/firestore/lite';

// Default song list to be used if Firestore is empty
const PLAYABLE_SONGS_EXAMPLE_STR = "夜に駆ける,YOASOBI,J-Pop,new\nPretender,Official髭男dism (オフィシャルヒゲダンディズム),J-Pop\nLemon,米津玄師,J-Pop\n紅蓮華,LiSA,Anime\nドライフラワー,優里,J-Pop\n白日,King Gnu (キングヌー),J-Rock\nマリーゴールド,あいみょん,J-Pop\n猫,DISH//,J-Rock\nうっせぇわ,Ado,J-Pop\n廻廻奇譚,Eve,Anime\n炎,LiSA,Anime\nCry Baby,Official髭男dism (オフィシャルヒゲダンディズム),Anime\nアイドル,YOASOBI,Anime,new\nKICK BACK,米津玄師,Anime\n新時代,Ado,Anime\n旅路,藤井風,J-Pop\n何なんw,藤井風,J-Pop\ngrace,藤井風,J-Pop\nきらり,藤井風,J-Pop\nSubtitle,Official髭男dism (オフィシャルヒゲダンディズム),J-Pop\n怪獣の花唄,Vaundy,J-Rock\nミックスナッツ,Official髭男dism (オフィシャルヒゲダンディズム),Anime\n水平線,back number,J-Pop\nシンデレラボーイ,Saucy Dog,J-Rock\nなんでもないや,RADWIMPS,Anime\nひまわりの約束,秦基博,J-Pop\nHANABI,Mr.Children,J-Pop\n天体観測,BUMP OF CHICKEN,J-Rock\n残酷な天使のテーゼ,高橋洋子,Anime\n千本桜,黒うさP,Vocaloid,,練習中";

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

const ALLOWED_ORIGIN = 'https://tomo-piano.pages.dev';

const createCorsHeaders = (request) => {
    const origin = request.headers.get('Origin');
    const isAllowed = origin === ALLOWED_ORIGIN;
    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin'
    };
};

const jsonResponse = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
});

async function getFirebaseApp(env) {
    if (getApps().length) return getApps()[0];
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

// GET handlers
const handleGetSongList = async (db, corsHeaders) => {
    const docRef = doc(db, 'songlist/default');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, { list: PLAYABLE_SONGS_EXAMPLE_STR });
        return jsonResponse({ list: PLAYABLE_SONGS_EXAMPLE_STR }, 200, corsHeaders);
    }
    return jsonResponse(docSnap.data(), 200, corsHeaders);
};

const handleGetFirebaseConfig = (env, corsHeaders) => {
    const config = {
        apiKey: env.FIREBASE_API_KEY,
        authDomain: env.FIREBASE_AUTH_DOMAIN,
        projectId: env.FIREBASE_PROJECT_ID,
    };
    return jsonResponse(config, 200, corsHeaders);
};

const handleGetBlogPosts = async (db, isAdmin, corsHeaders) => {
    const postsRef = collection(db, 'blogPosts');
    const constraints = [orderBy('createdAt', 'desc')];
    if (!isAdmin) {
        constraints.unshift(where('isPublished', '==', true));
    }
    const q = query(postsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return jsonResponse(posts, 200, corsHeaders);
};

const handleGetUiConfig = async (db, corsHeaders) => {
    const docRef = doc(db, 'uiconfig/default');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, DEFAULT_UI_CONFIG);
        return jsonResponse(DEFAULT_UI_CONFIG, 200, corsHeaders);
    }
    return jsonResponse({ ...DEFAULT_UI_CONFIG, ...docSnap.data() }, 200, corsHeaders);
};

const handleGetSetlistSuggestions = async (db, corsHeaders) => {
    const suggestionsRef = collection(db, 'setlistSuggestions');
    const q = query(suggestionsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const suggestions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return jsonResponse(suggestions, 200, corsHeaders);
};


// POST handlers
const handleSaveSongList = async (db, request, corsHeaders) => {
    const { list } = await request.json();
    await setDoc(doc(db, 'songlist/default'), { list });
    return jsonResponse({ success: true }, 200, corsHeaders);
};

const handleSaveUiConfig = async (db, request, corsHeaders) => {
    const config = await request.json();
    await setDoc(doc(db, 'uiconfig/default'), config, { merge: true });
    return jsonResponse({ success: true }, 200, corsHeaders);
};

const handleSaveBlogPost = async (db, request, corsHeaders) => {
    const post = await request.json();
    if (post.id) {
        const docRef = doc(db, 'blogPosts', post.id);
        const { id, ...dataToUpdate } = post;
        await updateDoc(docRef, dataToUpdate);
    } else {
        await addDoc(collection(db, 'blogPosts'), { ...post, createdAt: post.createdAt || Date.now() });
    }
    return jsonResponse({ success: true }, 200, corsHeaders);
};

const handleDeleteBlogPost = async (db, request, corsHeaders) => {
    const { id } = await request.json();
    await deleteDoc(doc(db, 'blogPosts', id));
    return jsonResponse({ success: true }, 200, corsHeaders);
};

const handleSaveSetlistSuggestion = async (db, request, corsHeaders) => {
    const { songs, requester } = await request.json();
    await addDoc(collection(db, 'setlistSuggestions'), { songs, requester, createdAt: Date.now() });
    return jsonResponse({ success: true }, 200, corsHeaders);
};


export async function onRequest(context) {
    const { request, env } = context;
    const corsHeaders = createCorsHeaders(request);

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
    }

    try {
        const app = await getFirebaseApp(env);
        const db = getFirestore(app);
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        if (request.method === 'GET') {
            switch (action) {
                case 'getFirebaseConfig': return handleGetFirebaseConfig(env, corsHeaders);
                case 'getBlogPosts': return handleGetBlogPosts(db, false, corsHeaders);
                case 'getAdminBlogPosts': return handleGetBlogPosts(db, true, corsHeaders);
                case 'getUiConfig': return handleGetUiConfig(db, corsHeaders);
                case 'getSetlistSuggestions': return handleGetSetlistSuggestions(db, corsHeaders);
                default: return handleGetSongList(db, corsHeaders);
            }
        }

        if (request.method === 'POST') {
            switch (action) {
                case 'saveUiConfig': return handleSaveUiConfig(db, request, corsHeaders);
                case 'saveBlogPost': return handleSaveBlogPost(db, request, corsHeaders);
                case 'deleteBlogPost': return handleDeleteBlogPost(db, request, corsHeaders);
                case 'saveSetlistSuggestion': return handleSaveSetlistSuggestion(db, request, corsHeaders);
                default: return handleSaveSongList(db, request, corsHeaders);
            }
        }

        return jsonResponse({ error: 'Method Not Allowed' }, 405, corsHeaders);

    } catch (error) {
        console.error('API Error:', error);
        return jsonResponse({ error: 'An internal server error occurred.', details: error.message }, 500, corsHeaders);
    }
}
