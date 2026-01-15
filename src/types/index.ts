
// --- TYPE DEFINITIONS ---
export interface Song {
  title: string;
  artist: string;
  titleKana?: string;
  artistKana?: string;
  genre: string;
  isNew: boolean;
  status: 'playable' | 'practicing';
  season?: string; // 追加: 季節（春, 夏, 秋, 冬）
}

export interface SearchResult {
  status: 'found' | 'related' | 'notFound';
  songs: Song[];
  searchTerm: string;
}

export interface RankingItem {
  id: string; // song title
  count: number;
  artist: string;
}

export interface ArtistRankingItem {
  id: string; // artist name
  count: number;
}

export interface RequestRankingItem {
    id: string; // requested song title
    count: number;
    artist?: string;
    lastRequester?: string;
    lastRequestedAt?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: number;
  imageUrl?: string;
}

export interface SetlistSuggestion {
  id: string;
  requester: string;
  songs: string[];
  createdAt: number;
}

export interface NavButtonConfig {
    label: string;
    enabled: boolean;
}

export interface VisualElement {
    id: string;
    page: Mode | 'all';
    type: 'image' | 'text';
    url?: string;
    content?: string;
    x: number; // percentage 0-100
    placement: 'header' | 'footer';
    width: number; // percentage 0-100
    opacity: number; // 0-1
    rotation: number; // degrees
    zIndex: number;
    fontSize?: number;
    color?: string;
}

export interface UiConfig {
    mainTitle: string;
    mainTitleFontSize?: number; 
    mainTitleColor?: string; 
    subtitle: string;
    primaryColor: string;
    adminPassword?: string;
    twitcastingUrl?: string;
    xUrl?: string;
    youtubeUrl?: string;
    printGakufuUrl?: string;
    ofuseUrl?: string;
    doneruUrl?: string;
    amazonWishlistUrl?: string;
    backgroundType: 'color' | 'image';
    backgroundColor: string;
    darkBackgroundColor: string;
    backgroundImageUrl: string;
    backgroundOpacity: number;
    twitcastingIconUrl?: string;
    xIconUrl?: string;
    youtubeIconUrl?: string;
    supportIconUrl?: string;
    headingFontFamily: string;
    bodyFontFamily: string;
    headingFontScale: number;
    bodyFontScale: number;
    // --- 通知設定 ---
    notificationEnabled?: boolean;
    discordWebhookUrl?: string;
    discordUserId?: string;
    // --- プロフィール設定 ---
    profileName?: string;
    profileTitle?: string;
    profileBio?: string;
    profileImageUrl?: string;
    profileHeaderImageUrl?: string; // 追加: ヘッダー画像
    // --- 新しいデザイン設定 ---
    borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
    cardStyle?: 'flat' | 'elevated' | 'glass';
    shadowIntensity?: number; // 0 to 1
    // ------------------------
    visualElements?: VisualElement[];
    specialButtons: {
        twitcas: NavButtonConfig;
        support: NavButtonConfig;
        x: NavButtonConfig;
        youtube: NavButtonConfig;
    };
    navButtons: {
        search: NavButtonConfig;
        list: NavButtonConfig;
        ranking: NavButtonConfig;
        requests: NavButtonConfig;
        news: NavButtonConfig;
        suggest: NavButtonConfig;
        setlist: NavButtonConfig;
        printGakufu: NavButtonConfig;
        tutorial: NavButtonConfig;
        profile: NavButtonConfig;
    }
}

export type Mode = 'search' | 'list' | 'ranking' | 'requests' | 'news' | 'setlist' | 'profile';

export type RankingPeriod = 'all' | 'month' | 'year';
