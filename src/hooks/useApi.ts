import { useState, useEffect, useCallback } from 'react';
import { Song, RankingItem, ArtistRankingItem, RequestRankingItem, BlogPost, UiConfig, SetlistSuggestion, RankingPeriod } from '../types';
import { parseSongs } from '../utils/parser';

// Default UI Config to prevent crashes before data loads
const DEFAULT_UI_CONFIG: UiConfig = {
    mainTitle: 'ともかなのリクエスト曲一検索',
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
    // FIX: Add the missing 'x' property to the `specialButtons` object to align with the `UiConfig` type.
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


export const useApi = () => {
    const [rawSongList, setRawSongList] = useState('');
    const [songs, setSongs] = useState<Song[]>([]);
    const [songRankingList, setSongRankingList] = useState<RankingItem[]>([]);
    const [artistRankingList, setArtistRankingList] = useState<ArtistRankingItem[]>([]);
    const [requestRankingList, setRequestRankingList] = useState<RequestRankingItem[]>([]);
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
            const [rankingRes, requestRankingRes] = await Promise.all([
                fetch(`/api/get-ranking?period=${period}`),
                fetch(`/api/get-request-ranking?period=${period}`),
            ]);
            if (!rankingRes.ok || !requestRankingRes.ok) {
                console.error('Failed to fetch ranking data');
                return;
            }
            const rankingData = await rankingRes.json();
            const requestRankingData = await requestRankingRes.json();
            setSongRankingList(rankingData.songRanking || []);
            setArtistRankingList(rankingData.artistRanking || []);
            setRequestRankingList(requestRankingData || []);
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
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error(`Request failed: ${response.statusText}`);
            }
            return await response.json();
        } catch (err) {
            console.error('POST request failed:', err);
            return { success: false, error: err };
        }
    }, []);

    const onSaveSongs = useCallback(async (newSongList: string) => {
        const result = await postData('/api/songs', { list: newSongList });
        if (result.success) {
            setRawSongList(newSongList);
            setSongs(parseSongs(newSongList));
        }
        return result.success;
    }, [postData]);

    const onSaveUiConfig = useCallback(async (newConfig: UiConfig) => {
        const result = await postData('/api/songs?action=saveUiConfig', newConfig);
        if (result.success) {
            setUiConfig(newConfig);
        }
        return result.success;
    }, [postData]);

    const onSavePost = useCallback(async (post: Partial<BlogPost>) => {
        const result = await postData('/api/songs?action=saveBlogPost', post);
        if (result.success) {
            try {
                const [adminRes, publicRes] = await Promise.all([
                    fetch('/api/songs?action=getAdminBlogPosts'),
                    fetch('/api/songs?action=getBlogPosts')
                ]);
                const adminData = await adminRes.json();
                const publicData = await publicRes.json();
                setAdminPosts(adminData || []);
                setPosts(publicData || []);
            } catch (e) {
                console.error("Failed to refresh posts", e);
            }
        }
        return result.success;
    }, [postData]);

    const onDeletePost = useCallback(async (id: string) => {
        const result = await postData('/api/songs?action=deleteBlogPost', { id });
        if (result.success) {
            setAdminPosts(prev => prev.filter(p => p.id !== id));
            setPosts(prev => prev.filter(p => p.id !== id));
        }
        return result.success;
    }, [postData]);

    const logSearch = useCallback((term: string) => {
        postData('/api/log-search', { term });
    }, [postData]);

    const logRequest = useCallback(async (term: string, artist: string, requester: string) => {
        await postData('/api/log-request', { term, artist, requester });
    }, [postData]);

    const logLike = useCallback(async (term: string, artist: string) => {
        await postData('/api/log-like', { term, artist });
    }, [postData]);

    const saveSetlistSuggestion = useCallback(async (songs: string[], requester: string) => {
        const result = await postData('/api/songs?action=saveSetlistSuggestion', { songs, requester });
        return result.success;
    }, [postData]);
    
    const refreshRankings = useCallback(async () => {
         try {
            await Promise.all([
                fetchRankings(rankingPeriod),
                fetchLikeRankings(rankingPeriod),
                fetch('/api/songs?action=getRecentRequests').then(res => res.json()).then(data => setRecentRequests(data || []))
            ]);
        } catch (e) {
            console.error("Failed to refresh all ranking data", e);
        }
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
        rankingPeriod, setRankingPeriod,
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
