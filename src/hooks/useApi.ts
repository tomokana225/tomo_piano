import { useState, useEffect, useCallback } from 'react';
import { Song, RankingItem, ArtistRankingItem, RequestRankingItem, BlogPost, UiConfig, SetlistSuggestion, RankingPeriod } from '../types';
import { parseSongs } from '../utils/parser';

// Default UI Config to prevent crashes before data loads
const DEFAULT_UI_CONFIG: UiConfig = {
    mainTitle: 'Song Request Search',
    subtitle: 'Check if I can play the song or if it\'s on Print Gakufu',
    primaryColor: '#ec4899',
    xUrl: '',
    backgroundType: 'color',
    backgroundColor: '#f3f4f6',
    darkBackgroundColor: '#111827',
    backgroundImageUrl: '',
    backgroundOpacity: 0.1,
    twitcastingIconUrl: '',
    xIconUrl: '',
    supportIconUrl: '',
    navButtons: {
        search: { label: 'Search', enabled: true },
        printGakufu: { label: 'ぷりんと楽譜', enabled: true },
        list: { label: 'List', enabled: true },
        ranking: { label: 'Ranking', enabled: true },
        requests: { label: 'Requests', enabled: true },
        news: { label: 'お知らせ', enabled: true },
        suggest: { label: 'Suggest', enabled: true },
        setlist: { label: 'セトリ提案', enabled: true },
    }
};


export const useApi = () => {
    const [rawSongList, setRawSongList] = useState('');
    const [songs, setSongs] = useState<Song[]>([]);
    const [songRankingList, setSongRankingList] = useState<RankingItem[]>([]);
    const [artistRankingList, setArtistRankingList] = useState<ArtistRankingItem[]>([]);
    const [requestRankingList, setRequestRankingList] = useState<RequestRankingItem[]>([]);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [adminPosts, setAdminPosts] = useState<BlogPost[]>([]); // For admin panel
    const [uiConfig, setUiConfig] = useState<UiConfig>(DEFAULT_UI_CONFIG);
    const [setlistSuggestions, setSetlistSuggestions] = useState<SetlistSuggestion[]>([]);
    const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('all');

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
    
    const fetchData = useCallback(async () => {
        // This function fetches non-ranking data. Rankings are fetched separately.
        setIsLoading(true);
        setError(null);
        try {
            const [
                songsRes,
                postsRes,
                adminPostsRes,
                uiConfigRes,
                setlistSuggestionsRes,
            ] = await Promise.all([
                fetch('/api/songs'),
                fetch('/api/songs?action=getBlogPosts'),
                fetch('/api/songs?action=getAdminBlogPosts'),
                fetch('/api/songs?action=getUiConfig'),
                fetch('/api/songs?action=getSetlistSuggestions'),
            ]);
            
            if (!songsRes.ok || !postsRes.ok || !uiConfigRes.ok || !adminPostsRes.ok || !setlistSuggestionsRes.ok) {
                throw new Error('Failed to fetch initial data');
            }

            const songsData = await songsRes.json();
            const postsData = await postsRes.json();
            const adminPostsData = await adminPostsRes.json();
            const uiConfigData = await uiConfigRes.json();
            const setlistSuggestionsData = await setlistSuggestionsRes.json();
            
            setRawSongList(songsData.list || '');
            setSongs(parseSongs(songsData.list || ''));
            setPosts(postsData || []);
            setAdminPosts(adminPostsData || []);
            setUiConfig(uiConfigData || DEFAULT_UI_CONFIG);
            setSetlistSuggestions(setlistSuggestionsData || []);
            
            await fetchRankings('all'); // Fetch initial (all-time) rankings
            
        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [fetchRankings]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        // This effect re-fetches rankings when the period changes, but not on initial load.
        if (!isLoading) {
            fetchRankings(rankingPeriod);
        }
    }, [rankingPeriod, isLoading, fetchRankings]);

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

    const onSaveUiConfig = useCallback(async (config: UiConfig) => {
        const result = await postData('/api/songs?action=saveUiConfig', config);
        if (result.success) {
            setUiConfig(config);
        }
        return result.success;
    }, [postData]);
    
    const onSavePost = useCallback(async (post: Partial<BlogPost>) => {
        const result = await postData('/api/songs?action=saveBlogPost', post);
        if (result.success) {
            fetchData();
        }
        return result.success;
    }, [postData, fetchData]);

    const onDeletePost = useCallback(async (id: string) => {
        const result = await postData('/api/songs?action=deleteBlogPost', { id });
        if (result.success) {
            fetchData();
        }
        return result.success;
    }, [postData, fetchData]);
    
    const logSearch = useCallback((term: string) => {
        postData('/api/log-search', { term });
    }, [postData]);
    
    const logRequest = useCallback(async (term: string, artist: string, requester: string) => {
        await postData('/api/log-request', { term, artist, requester });
    }, [postData]);
    
    const saveSetlistSuggestion = useCallback(async (songs: string[], requester: string) => {
        const result = await postData('/api/songs?action=saveSetlistSuggestion', { songs, requester });
        if (result.success) {
            fetchData();
        }
        return result.success;
    }, [postData, fetchData]);

    const refreshRankings = useCallback(async () => {
        await fetchRankings(rankingPeriod);
    }, [rankingPeriod, fetchRankings]);


    return {
        rawSongList,
        songs,
        songRankingList,
        artistRankingList,
        requestRankingList,
        posts,
        adminPosts,
        uiConfig,
        setlistSuggestions,
        isLoading,
        error,
        rankingPeriod,
        setRankingPeriod,
        onSaveSongs,
        onSaveUiConfig,
        onSavePost,
        onDeletePost,
        logSearch,
        logRequest,
        saveSetlistSuggestion,
        refreshRankings,
        refetchPosts: fetchData,
    };
};