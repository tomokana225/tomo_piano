
// --- TYPE DEFINITIONS ---
export interface Song {
  title: string;
  artist: string;
  titleKana?: string;
  artistKana?: string;
  genre: string;
  isNew: boolean;
  status: 'playable' | 'practicing';
  season?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  createdAt: number;
  imageUrl?: string;
}

export interface NavButtonConfig {
    label: string;
    enabled: boolean;
}

export type Mode = 'search' | 'list' | 'ranking' | 'requests' | 'news' | 'setlist' | 'profile';
export type RankingPeriod = 'all' | 'month' | 'year';

// Added VisualElement interface to fix missing type errors
export interface VisualElement {
    id: string;
    page: Mode | 'all';
    type: 'image' | 'text';
    url?: string;
    content?: string;
    x: number;
    placement: 'header' | 'footer';
    width: number;
    opacity: number;
    rotation: number;
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
    twitcastingUrl: string;
    xUrl: string;
    youtubeUrl: string;
    printGakufuUrl: string;
    backgroundColor: string;
    darkBackgroundColor: string;
    backgroundImageUrl: string;
    backgroundOpacity: number;
    // Added missing background and icon properties
    backgroundType: 'color' | 'image';
    twitcastingIconUrl?: string;
    xIconUrl?: string;
    youtubeIconUrl?: string;
    supportIconUrl?: string;
    // Added missing notification and support link properties
    notificationEnabled?: boolean;
    discordWebhookUrl?: string;
    discordUserId?: string;
    ofuseUrl?: string;
    doneruUrl?: string;
    amazonWishlistUrl?: string;
    // Added missing profile and visual elements properties
    visualElements?: VisualElement[];
    profileName?: string;
    profileTitle?: string;
    profileBio?: string;
    profileImageUrl?: string;
    profileHeaderImageUrl?: string;
    headingFontFamily: string;
    bodyFontFamily: string;
    headingFontScale: number;
    bodyFontScale: number;
    borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
    cardStyle?: 'flat' | 'elevated' | 'glass';
    shadowIntensity?: number;
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

export interface SearchResult {
  status: 'found' | 'related' | 'notFound';
  songs: Song[];
  searchTerm: string;
}

export interface RankingItem {
  id: string;
  count: number;
  artist: string;
}

export interface ArtistRankingItem {
  id: string;
  count: number;
}

export interface RequestRankingItem {
    id: string;
    count: number;
    artist?: string;
    lastRequester?: string;
    lastRequestedAt?: number;
}

export interface SetlistSuggestion {
  id: string;
  requester: string;
  songs: string[];
  createdAt: number;
}
