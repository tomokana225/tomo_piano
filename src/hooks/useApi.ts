import { useState, useEffect, useCallback } from 'react';
import { Song, RankingItem, ArtistRankingItem, RequestRankingItem, BlogPost, UiConfig, SetlistSuggestion } from '../types';
import { parseSongs } from '../utils/parser';

// Default UI Config to prevent crashes before data loads
const DEFAULT_UI_CONFIG: UiConfig = {
    mainTitle: 'Song Request Search',
    subtitle: 'Check if I can play the song or if it\'s on Print Gakufu',
    primaryColor: '#ec4899',
    backgroundType: 'color',
    backgroundColor: '#111827',
    backgroundImageUrl: '',
    backgroundOpacity: 0.1,
    navButtons: {
        search: { label: 'Search', enabled: true },
        list: { label: 'List', enabled: true },
        ranking: { label: 'Ranking', enabled: true },
        requests: { label: 'Requests', enabled: true },
        blog: { label: 'Blog', enabled: true },
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

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [
                songsRes,
                rankingRes,
                requestRankingRes,
                postsRes,
                adminPostsRes,
                uiConfigRes,
                setlistSuggestionsRes,
            ] = await Promise.all([
                fetch('/api/songs'),
                fetch('/api/get-ranking'),
                fetch('/api/get-request-ranking'),
                fetch('/api/songs?action=getBlogPosts'),
                fetch('/api/songs?action=getAdminBlogPosts'),
                fetch('/api/songs?action=getUiConfig'),
                fetch('/api/songs?action=getSetlistSuggestions'),
            ]);
            
            if (!songsRes.ok || !rankingRes.ok || !requestRankingRes.ok || !postsRes.ok || !uiConfigRes.ok || !adminPostsRes.ok || !setlistSuggestionsRes.ok) {
                throw new Error('Failed to fetch initial data');
            }

            const songsData = await songsRes.json();
            const rankingData = await rankingRes.json();
            const requestRankingData = await requestRankingRes.json();
            const postsData = await postsRes.json();
            const adminPostsData = await adminPostsRes.json();
            const uiConfigData = await uiConfigRes.json();
            const setlistSuggestionsData = await setlistSuggestionsRes.json();
            
            setRawSongList(songsData.list || '');
            setSongs(parseSongs(songsData.list || ''));
            setSongRankingList(rankingData.songRanking || []);
            setArtistRankingList(rankingData.artistRanking || []);
            setRequestRankingList(requestRankingData || []);
            setPosts(postsData || []);
            setAdminPosts(adminPostsData || []);
            setUiConfig(uiConfigData || DEFAULT_UI_CONFIG);
            setSetlistSuggestions(setlistSuggestionsData || []);
            
        } catch (err: any) {
            setError(err.message);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            fetchData(); // Refetch all data to get updated posts list
        }
        return result.success;
    }, [postData, fetchData]);

    const onDeletePost = useCallback(async (id: string) => {
        const result = await postData('/api/songs?action=deleteBlogPost', { id });
        if (result.success) {
            fetchData(); // Refetch all data
        }
        return result.success;
    }, [postData, fetchData]);
    
    const logSearch = useCallback((term: string) => {
        // Fire and forget, no need to wait for response
        postData('/api/log-search', { term });
    }, [postData]);
    
    const logRequest = useCallback(async (term: string, requester: string) => {
        // Wait for response, could be useful
        await postData('/api/log-request', { term, requester });
    }, [postData]);
    
    const saveSetlistSuggestion = useCallback(async (songs: string[], requester: string) => {
        const result = await postData('/api/songs?action=saveSetlistSuggestion', { songs, requester });
        if (result.success) {
            fetchData();
        }
        return result.success;
    }, [postData, fetchData]);

    const refreshRankings = useCallback(async () => {
        try {
            const [rankingRes, requestRankingRes] = await Promise.all([
                fetch('/api/get-ranking'),
                fetch('/api/get-request-ranking'),
            ]);
            if (rankingRes.ok) {
                const rankingData = await rankingRes.json();
                setSongRankingList(rankingData.songRanking || []);
                setArtistRankingList(rankingData.artistRanking || []);
            }
            if(requestRankingRes.ok) {
                 const requestRankingData = await requestRankingRes.json();
                 setRequestRankingList(requestRankingData || []);
            }
        } catch (err) {
            console.error("Failed to refresh rankings", err);
        }
    }, []);


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