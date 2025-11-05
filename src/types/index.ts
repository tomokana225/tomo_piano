// --- TYPE DEFINITIONS ---
export interface Song {
  title: string;
  artist: string;
  genre: string;
  isNew: boolean;
  status: 'playable' | 'practicing';
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

export interface UiConfig {
    mainTitle: string;
    subtitle: string;
    primaryColor: string;
    twitcastingUrl?: string;
    xUrl?: string;
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
    supportIconUrl?: string;
    navButtons: {
        search: NavButtonConfig;
        printGakufu: NavButtonConfig;
        list: NavButtonConfig;
        ranking: NavButtonConfig;
        requests: NavButtonConfig;
        blog: NavButtonConfig;
        suggest: NavButtonConfig;
        setlist: NavButtonConfig;
    }
}

export type Mode = 'search' | 'list' | 'ranking' | 'requests' | 'blog' | 'setlist';

export type RankingPeriod = 'all' | 'month' | 'year';