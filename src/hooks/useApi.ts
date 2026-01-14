
import { useState, useEffect, useCallback } from 'react';
import { Song, RankingItem, ArtistRankingItem, RequestRankingItem, BlogPost, UiConfig, SetlistSuggestion, RankingPeriod } from '../types';
import { parseSongs } from '../utils/parser';

// Default UI Config to prevent crashes before data loads
const DEFAULT_UI_CONFIG: UiConfig = {
    mainTitle: 'ともかなのリクエスト曲一検索',
    subtitle: 'ピアノの配信でリクエストをする際に、その曲が配信者の弾ける曲かどうかを調べるアプリ',
    primaryColor: '#ec4899',
    adminPassword: 'admin225', // 追加: デフォルトパスワード
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
    const [adminPosts, setAdminPosts] = useState<BlogPost[]>([]);
    const [uiConfig, setUiConfig] = useState<UiConfig>(DEFAULT_UI_CONFIG);
    const [setlistSuggestions, setSetlistSuggestions] = useState<SetlistSuggestion[]>([]);
    const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('all');
    const [activeUserCount, setActiveUserCount] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRankings = useCallback(async (period: RankingPeriod) => {
        try {
            const rankingRes = await fetch(`/api/get-ranking?period=${period}`);
            if (!rankingRes.ok) return;
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
                throw new Error('Initial data fetch failed');
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
            setUiConfig({ ...DEFAULT_UI_CONFIG, ...uiConfigData });
            setSetlistSuggestions(setlistSuggestionsData || []);
            setRecentRequests(recentRequestsData || []);
            
            await Promise.all([fetchRankings('all'), fetchLikeRankings('all')]);
            
        } catch (err: any) {
            setError('サーバー通信エラー: モックデータモードで動作しています。変更はブラウザを閉じるまで有効です。');
            
            const mockSongList = "夜に駆ける,YOASOBI,J-Pop,new\nPretender,Official髭男dism,J-Pop\nLemon,米津玄師,J-Pop\nアイドル,YOASOBI,Anime,new\nSubtitle,Official髭男dism,J-Pop";
            setRawSongList(mockSongList);
            setSongs(parseSongs(mockSongList));
            setPosts([{
                id: 'mock-post-1',
                title: 'モックデータモードへようこそ',
                content: '現在バックエンドに接続されていません。管理画面からデザインのテストなどが可能です。',
                isPublished: true,
                createdAt: Date.now(),
                imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop'
            }]);
            setAdminPosts([{
                id: 'mock-post-1',
                title: 'モックデータモードへようこそ',
                content: '現在バックエンドに接続されていません。管理画面からデザインのテストなどが可能です。',
                isPublished: true,
                createdAt: Date.now(),
            }]);
            setUiConfig(DEFAULT_UI_CONFIG);
            setRecentRequests([
                { id: 'アイドル', count: 5, artist: 'YOASOBI', lastRequester: 'tester', lastRequestedAt: Date.now() },
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

    const postData = useCallback(async (url: string, body: object) => {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            return res.ok;
        } catch (err) {
            console.warn(`API call failed to ${url}, falling back to local state update.`, err);
            return false;
        }
    }, []);

    const onSaveSongs = useCallback(async (newSongList: string) => {
        const success = await postData('/api/songs', { list: newSongList });
        // APIの成否に関わらずローカルの状態を更新する
        setRawSongList(newSongList);
        setSongs(parseSongs(newSongList));
        return true;
    }, [postData]);

    const onSaveUiConfig = useCallback(async (config: UiConfig) => {
        const success = await postData('/api/songs?action=saveUiConfig', config);
        setUiConfig(config);
        return true;
    }, [postData]);

    const onSavePost = useCallback(async (post: Partial<BlogPost>) => {
        const success = await postData('/api/songs?action=saveBlogPost', post);
        if (success) {
            fetch('/api/songs?action=getAdminBlogPosts').then(res => res.json()).then(data => setAdminPosts(data || []));
            fetch('/api/songs?action=getBlogPosts').then(res => res.json()).then(data => setPosts(data || []));
        } else {
            // モックモード用：リストに無理やり突っ込む
            const updatedPosts = post.id 
                ? adminPosts.map(p => p.id === post.id ? { ...p, ...post } as BlogPost : p)
                : [{ ...post, id: `temp-${Date.now()}`, createdAt: Date.now() } as BlogPost, ...adminPosts];
            setAdminPosts(updatedPosts);
            setPosts(updatedPosts.filter(p => p.isPublished));
        }
        return true;
    }, [postData, adminPosts]);
    
    const onDeletePost = useCallback(async (id: string) => {
        const success = await postData('/api/songs?action=deleteBlogPost', { id });
        const updatedPosts = adminPosts.filter(p => p.id !== id);
        setAdminPosts(updatedPosts);
        setPosts(updatedPosts.filter(p => p.isPublished));
        return true;
    }, [postData, adminPosts]);

    const saveSetlistSuggestion = useCallback(async (songs: string[], requester: string) => {
        return await postData('/api/songs?action=saveSetlistSuggestion', { songs, requester });
    }, [postData]);

    const logSearch = useCallback((term: string) => {
        fetch('/api/log-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term }),
            keepalive: true
        }).catch(() => {});
    }, []);

    const logRequest = useCallback(async (term: string, artist: string, requester: string) => {
        await fetch('/api/log-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term, artist, requester }),
        }).catch(() => {});
    }, []);
    
    const logLike = useCallback(async (term: string, artist: string) => {
        await fetch('/api/log-like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ term, artist }),
        }).catch(() => {});
    }, []);

    const refreshRankings = useCallback(async () => {
        await Promise.all([fetchRankings(rankingPeriod), fetchLikeRankings(rankingPeriod)]);
        fetch('/api/songs?action=getRecentRequests').then(res => res.ok ? res.json() : []).then(data => setRecentRequests(data)).catch(() => {});
    }, [rankingPeriod, fetchRankings, fetchLikeRankings]);

    return {
        rawSongList, songs, songRankingList, artistRankingList, songLikeRankingList, posts, adminPosts, uiConfig, setlistSuggestions, recentRequests, isLoading, error, activeUserCount,
        rankingPeriod, setRankingPeriod, onSaveSongs, onSaveUiConfig, onSavePost, onDeletePost, logSearch, logRequest, logLike, saveSetlistSuggestion, refreshRankings,
    };
};
