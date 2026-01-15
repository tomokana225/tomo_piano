
import { useState, useEffect, useCallback } from 'react';
import { Song, RankingItem, ArtistRankingItem, RequestRankingItem, BlogPost, UiConfig, SetlistSuggestion, RankingPeriod } from '../types';
import { parseSongs } from '../utils/parser';

const DEFAULT_UI_CONFIG: UiConfig = {
    mainTitle: 'ともかなのリクエスト曲一検索',
    subtitle: 'ピアノの配信でリクエストをする際に、その曲が配信者の弾ける曲かどうかを調べるアプリ',
    primaryColor: '#ec4899',
    twitcastingUrl: 'https://twitcasting.tv/g:101738740616323847745',
    xUrl: 'https://x.com/',
    youtubeUrl: 'https://www.youtube.com/',
    printGakufuUrl: 'https://www.print-gakufu.com/',
    backgroundType: 'image',
    backgroundColor: '#f3f4f6',
    darkBackgroundColor: '#111827',
    backgroundImageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070&auto=format&fit=crop',
    backgroundOpacity: 0.1,
    // Added missing default values for profile and other properties
    twitcastingIconUrl: '',
    xIconUrl: '',
    youtubeIconUrl: '',
    supportIconUrl: '',
    notificationEnabled: false,
    discordWebhookUrl: '',
    ofuseUrl: '',
    doneruUrl: '',
    amazonWishlistUrl: '',
    visualElements: [],
    profileName: '',
    profileTitle: '',
    profileBio: '',
    profileImageUrl: '',
    profileHeaderImageUrl: '',
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

export const useApi = () => {
    const [songs, setSongs] = useState<Song[]>([]);
    const [rawSongList, setRawSongList] = useState<string>('');
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [adminPosts, setAdminPosts] = useState<BlogPost[]>([]);
    const [uiConfig, setUiConfig] = useState<UiConfig>(DEFAULT_UI_CONFIG);
    const [adminPassword, setAdminPassword] = useState<string>(''); // クライアント側で一時保持
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [songsRes, postsRes, adminPostsRes, uiConfigRes] = await Promise.all([
                fetch('/api/songs'),
                fetch('/api/songs?action=getBlogPosts'),
                fetch('/api/songs?action=getAdminBlogPosts'),
                fetch('/api/songs?action=getUiConfig'),
            ]);
            const songsData = await songsRes.json();
            setRawSongList(songsData.list || '');
            setSongs(parseSongs(songsData.list || ''));
            setPosts(await postsRes.json());
            setAdminPosts(await adminPostsRes.json());
            setUiConfig({ ...DEFAULT_UI_CONFIG, ...(await uiConfigRes.json()) });
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const postData = useCallback(async (url: string, body: object) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Password': adminPassword // パスワードをヘッダーに乗せる
            },
            body: JSON.stringify(body),
        });
        return res.ok;
    }, [adminPassword]);

    return {
        songs, rawSongList, posts, adminPosts, uiConfig, isLoading,
        setAdminPassword, // 管理者ログイン時にセット
        onSaveSongs: (list: string) => postData('/api/songs', { list }),
        onSaveUiConfig: (config: UiConfig) => postData('/api/songs?action=saveUiConfig', config),
        onSavePost: (post: Partial<BlogPost>) => postData('/api/songs?action=saveBlogPost', post),
        onDeletePost: (id: string) => postData('/api/songs?action=deleteBlogPost', { id }),
        // Changed return type to Promise<void> to satisfy component props
        logSearch: async (term: string) => { await fetch('/api/log-search', { method: 'POST', body: JSON.stringify({ term }) }); },
        logRequest: async (term: string, artist: string, requester: string) => { await fetch('/api/log-request', { method: 'POST', body: JSON.stringify({ term, artist, requester }) }); },
        logLike: async (term: string, artist: string) => { await fetch('/api/log-like', { method: 'POST', body: JSON.stringify({ term, artist }) }); },
        refreshRankings: fetchData
    };
};
