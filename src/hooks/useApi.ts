import { useState, useEffect, useCallback } from 'react';
import { Song, RankingItem, ArtistRankingItem, RequestRankingItem, BlogPost, UiConfig, SetlistSuggestion, RankingPeriod } from '../types';
import { parseSongs } from '../utils/parser';

// Default UI Config to prevent crashes before data loads
const DEFAULT_UI_CONFIG: UiConfig = {
    mainTitle: 'ともかなのリクエスト曲一検索',
    subtitle: 'ともかなの弾ける曲を検索できます',
    primaryColor: '#ec4899',
    twitcastingUrl: 'https://twitcasting.tv/g:101738740616323847745',
    xUrl: 'https://x.com/',
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
    supportIconUrl: '',
    headingFontFamily: "'Kiwi Maru', serif",
    bodyFontFamily: "'Noto Sans JP', sans-serif",
    headingFontScale: 1.0,
    bodyFontScale: 1.0,
    specialButtons: {
        twitcas: { label: 'ツイキャスはこちら', enabled: true },
        x: { label: 'X (Twitter) はこちら', enabled: true },
        support: { label: '配信者をサポート', enabled: true },
    },
    navButtons: {
        search: { label: '曲を検索', enabled: true },
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


export const useApi = () => {
    const [rawSongList, setRawSongList] = useState('');
    const [songs, setSongs] = useState<Song[]>([]);
    const [songRankingList, setSongRankingList] = useState<RankingItem[]>([]);
    const [artistRankingList, setArtistRankingList] = useState<ArtistRankingItem[]>([]);
    const [songLikeRankingList, setSongLikeRankingList] = useState<RankingItem[]>([]);
    const [recentRequests, setRecentRequests] = useState<RequestRankingItem[]>([]);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [adminPosts, setAdminPosts] = useState<BlogPost[]>([]); // For admin panel
    const [uiConfig, setUiConfig] = useState<UiConfig>(DEFAULT_UI_CONFIG);
    const [setlistSuggestions, setSetlistSuggestions] = useState<SetlistSuggestion[]>([]);
    const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('all');
    const [activeUserCount, setActiveUserCount] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRankings = useCallback(async (period: RankingPeriod) => {
        try {
            const rankingRes = await fetch(`/api/get-ranking?period=${period}`);
            if (!rankingRes.ok) {
                console.error('Failed to fetch ranking data');
                return;
            }
            const rankingData = await rankingRes.json();
            setSongRankingList(rankingData.songRanking || []);
            setArtistRankingList(rankingData.artistRanking || []);
        } catch (err) {
            console.error("Failed to refresh rankings", err);
        }
    }, []);
    
    const fetchLikeRankings = useCallback(async (period: RankingPeriod) => {
        try {
            const res = await fetch(`/api/get-like-ranking?period=${period}`);
            if (!res.ok) {
                console.error('Failed to fetch like ranking data');
                setSongLikeRankingList([]);
                return;
            }
            const data = await res.json();
            setSongLikeRankingList(data || []);
        } catch (err) {
            console.error("Failed to refresh like rankings", err);
            setSongLikeRankingList([]);
        }
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [
                songsRes,
                postsRes,
                adminPostsRes,
                uiConfigRes,
                setlistSuggestionsRes,
                recentRequestsRes,
            ] = await Promise.all([
                fetch('/api/songs'),
                fetch('/api/songs?action=getBlogPosts'),
                fetch('/api/songs?action=getAdminBlogPosts'),
                fetch('/api/songs?action=getUiConfig'),
                fetch('/api/songs?action=getSetlistSuggestions'),
                fetch('/api/songs?action=getRecentRequests'),
            ]);
            
            if (!songsRes.ok || !postsRes.ok || !uiConfigRes.ok || !adminPostsRes.ok || !setlistSuggestionsRes.ok || !recentRequestsRes.ok) {
                throw new Error('Failed to fetch initial data');
            }

            const songsData = await songsRes.json();
            const postsData = await postsRes.json();
            const adminPostsData = await adminPostsRes.json();
            const uiConfigData = await uiConfigRes.json();
            const setlistSuggestionsData = await setlistSuggestionsRes.json();
            const recentRequestsData = await recentRequestsRes.json();
            
            setRawSongList(songsData.list || '');
            setSongs(parseSongs(songsData.list || ''));
            setPosts(postsData || []);
            setAdminPosts(adminPostsData || []);
            setUiConfig(uiConfigData || DEFAULT_UI_CONFIG);
            setSetlistSuggestions(setlistSuggestionsData || []);
            setRecentRequests(recentRequestsData || []);
            
            await Promise.all([
                fetchRankings('all'), 
                fetchLikeRankings('all')
            ]);
            
        } catch (err: any) {
            const devErrorMessage = 'サーバーからのデータ取得に失敗しました。開発用にモックデータを表示します。';
            setError(devErrorMessage);
            console.error("--- MOCK DATA MODE ACTIVATED ---");
            console.error("Failed to fetch initial data. Using default mock data for development.", err);
            
            const mockSongList = "夜に駆ける,YOASOBI,J-Pop,new\nPretender,Official髭男dism,J-Pop\nLemon,米津玄師,J-Pop\nアイドル,YOASOBI,Anime,new\nSubtitle,Official髭男dism,J-Pop";
            setRawSongList(mockSongList);
            setSongs(parseSongs(mockSongList));
            setPosts([{
                id: 'mock-post-1',
                title: 'ようこそ！ (開発用データ)',
                content: 'これは開発用のモックデータです。\n\nサーバーとの通信に失敗したため、ダミーのお知らせを表示しています。\n\n* リスト項目1\n* リスト項目2\n\n[リンクの例](https://google.com)',
                isPublished: true,
                createdAt: Date.now(),
                imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop'
            }]);
            setAdminPosts([{
                id: 'mock-post-1',
                title: 'ようこそ！ (開発用データ)',
                content: 'これは開発用のモックデータです。\n\nサーバーとの通信に失敗したため、ダミーのお知らせを表示しています。',
                isPublished: true,
                createdAt: Date.now(),
                imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop'
            }]);
            setUiConfig(DEFAULT_UI_CONFIG);
            setSetlistSuggestions([]);
            setRecentRequests([
                { id: 'アイドル', count: 5, artist: 'YOASOBI', lastRequester: 'test-user-1', lastRequestedAt: Date.now() - 100000 },
                { id: 'Lemon', count: 3, artist: '米津玄師', lastRequester: 'test-user-2', lastRequestedAt: Date.now() - 200000 },
            ]);
            
            await Promise.all([
                fetchRankings('all'), 
                fetchLikeRankings('all')
            ]);

        } finally {
            setIsLoading(false);
        }
    }, [fetchRankings, fetchLikeRankings]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!isLoading) {
            fetchRankings(rankingPeriod);
            fetchLikeRankings(rankingPeriod);
        }
    }, [rankingPeriod, isLoading, fetchRankings, fetchLikeRankings]);

    // Presence logic to count active users
    useEffect(() => {
        let clientId = localStorage.getItem('clientId');
        if (!clientId) {
            try {
                clientId = crypto.randomUUID();
                localStorage.setItem('clientId', clientId);
            } catch (e) {
                console.error("crypto.randomUUID() is not available. Using a fallback.");
                clientId = `fallback-${Date.now()}-${Math.random()}`;
                localStorage.setItem('clientId', clientId);
            }
        }

        const reportPresence = () => {
            if (document.visibilityState === 'visible') {
                fetch('/api/presence', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId }),
                    keepalive: true // Allows the request to be sent even if the page is being closed
                }).catch(console.error);
            }
        };

        const fetchActiveUsers = () => {
             if (document.visibilityState === 'visible') {
                fetch('/api/get-active-users')
                    .then(res => res.ok ? res.json() : Promise.reject(res))
                    .then(data => setActiveUserCount(data.count || 0))
                    .catch(console.error);
            }
        };

        reportPresence();
        fetchActiveUsers();

        const presenceInterval = setInterval(reportPresence, 60 * 1000); // every 1 minute
        const fetchInterval = setInterval(fetchActiveUsers, 60 * 1000); // every 1 minute
        
        document.addEventListener('visibilitychange', reportPresence);

        return () => {
            clearInterval(presenceInterval);
            clearInterval(fetchInterval);
            document.removeEventListener('visibilitychange', reportPresence);
        };
    }, []);

    const postData = useCallback(async (url: string, body: object) => {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const errorData = await res.json();
                console.error(`POST to ${url} failed:`, errorData.error);
                return false;
            }
            return true;
        } catch (err) {
            console.error(`Error during POST to ${url}:`, err);
            return false;
        }
    }, []);

    const onSaveSongs = useCallback(async (newSongList: string) => {
        const success = await postData('/api/songs', { list: newSongList });
        if (success) {
            setRawSongList(newSongList);
            setSongs(parseSongs(newSongList));
        }
        return success;
    }, [postData]);

    const onSaveUiConfig = useCallback(async (config: UiConfig) => {
        const success = await postData('/api/songs?action=saveUiConfig', config);
        if (success) {
            setUiConfig(config);
        }
        return success;
    }, [postData]);

    const onSavePost = useCallback(async (post: Partial<BlogPost>) => {
        const success = await postData('/api/songs?action=saveBlogPost', post);
        if (success) {
            // Refetch admin posts to get the latest list with new/updated post
            fetch('/api/songs?action=getAdminBlogPosts')
                .then(res => res.json())
                .then(data => setAdminPosts(data || []));
            // Also refetch public posts
            fetch('/api/songs?action=getBlogPosts')
                .then(res => res.json())
                .then(data => setPosts(data || []));
        }
        return success;
    }, [postData]);
    
    const onDeletePost = useCallback(async (id: string) => {
        const success = await postData('/api/songs?action=deleteBlogPost', { id });
        if (success) {
            // Refetch admin and public posts after deletion
            fetch('/api/songs?action=getAdminBlogPosts')
                .then(res => res.json())
                .then(data => setAdminPosts(data || []));
            fetch('/api/songs?action=getBlogPosts')
                .then(res => res.json())
                .then(data => setPosts(data || []));
        }
        return success;
    }, [postData]);

    const saveSetlistSuggestion = useCallback(async (songs: string[], requester: string) => {
        return await postData('/api/songs?action=saveSetlistSuggestion', { songs, requester });
    }, [postData]);

    // Use a fire-and-forget approach for logging
    const logSearch = useCallback((term: string) => {
        fetch('/api/log-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term }),
            keepalive: true // Important for requests that might not block UI
        }).catch(console.error);
    }, []);

    const logRequest = useCallback(async (term: string, artist: string, requester: string) => {
        await fetch('/api/log-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term, artist, requester }),
        });
    }, []);
    
    const logLike = useCallback(async (term: string, artist: string) => {
        await fetch('/api/log-like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term, artist }),
        });
    }, []);

    const refreshRankings = useCallback(async () => {
        // This function will re-fetch all ranking data
        await Promise.all([
            fetchRankings(rankingPeriod),
            fetchLikeRankings(rankingPeriod)
        ]);
        
        // Also refresh recent requests as they might have changed
        fetch('/api/songs?action=getRecentRequests')
            .then(res => res.ok ? res.json() : [])
            .then(data => setRecentRequests(data))
            .catch(console.error);

    }, [rankingPeriod, fetchRankings, fetchLikeRankings]);


    return {
        rawSongList,
        songs,
        songRankingList,
        artistRankingList,
        songLikeRankingList,
        posts,
        adminPosts,
        uiConfig,
        setlistSuggestions,
        recentRequests,
        isLoading,
        error,
        activeUserCount,
        rankingPeriod,
        setRankingPeriod,
        onSaveSongs,
        onSaveUiConfig,
        onSavePost,
        onDeletePost,
        logSearch,
        logRequest,
        logLike,
        saveSetlistSuggestion,
        refreshRankings,
    };
};