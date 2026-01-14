
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Song, SearchResult, UiConfig, RankingItem, Mode } from '../types';
import { normalizeForSearch } from '../utils/normalization';
import { SearchIcon, XIcon, PlusIcon, MusicNoteIcon, NewspaperIcon, LightBulbIcon, CloudUploadIcon, HeartIcon, TwitcasIcon, XSocialIcon, DocumentTextIcon, YouTubeIcon, UserGroupIcon } from '../components/ui/Icons';
import { SongCard } from '../components/ui/SongCard';
import { RequestSongModal } from '../features/suggest/RequestSongModal';

interface SearchViewProps {
    songs: Song[];
    logSearch: (term: string) => void;
    logLike: (term: string, artist: string) => Promise<void>;
    logRequest: (term: string, artist: string, requester: string) => Promise<void>;
    refreshRankings: () => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onAdminLogin: () => void;
    uiConfig: UiConfig;
    songRankingList: RankingItem[];
    setMode: (mode: Mode) => void;
    openSuggestModal: () => void;
    openSupportModal: () => void;
}

const MAX_RELATED_SONGS = 50; 

const NavCard: React.FC<{
    icon: React.FC<{ className?: string, style?: React.CSSProperties }>;
    title: string;
    onClick: () => void;
}> = ({ icon: Icon, title, onClick }) => (
  <button
    onClick={onClick}
    className="group relative w-full flex flex-col items-center justify-center p-4 sm:p-6 rounded-[2rem] bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900 border border-border-light dark:border-border-dark shadow-sm hover:shadow-xl hover:border-[var(--primary-color)]/50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 min-h-[100px] sm:min-h-[140px]"
    aria-label={title}
  >
    <div className="flex flex-col items-center gap-2 sm:gap-3 w-full">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-500 bg-gradient-to-br from-[var(--primary-color)]/5 to-[var(--primary-color)]/10 group-hover:scale-110 group-hover:from-[var(--primary-color)]/20 group-hover:to-[var(--primary-color)]/30">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300" style={{ color: 'var(--primary-color)' }} />
        </div>
        <div className="w-full text-center px-1 overflow-hidden">
            <h3 className="font-bold text-[11px] sm:text-sm md:text-base tracking-tight text-text-primary-light dark:text-text-primary-dark break-all sm:break-words leading-tight">
                {title}
            </h3>
        </div>
    </div>
  </button>
);


export const SearchView: React.FC<SearchViewProps> = ({ songs, logSearch, logLike, logRequest, refreshRankings, searchTerm, setSearchTerm, onAdminLogin, uiConfig, songRankingList, setMode, openSuggestModal, openSupportModal }) => {
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [matchedArtists, setMatchedArtists] = useState<{name: string, count: number}[]>([]);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Song[]>([]);
    const [isLiking, setIsLiking] = useState<string | null>(null);
    const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
    const [likeMessage, setLikeMessage] = useState('');
    const searchContainerRef = useRef<HTMLFormElement>(null);
    const initialSearchTermRef = useRef(searchTerm);

    const popularSongs = useMemo(() => {
        return songRankingList
            .slice(0, 5) 
            .map(rankItem => songs.find(s => s.title === rankItem.id && s.artist === rankItem.artist))
            .filter((s): s is Song => !!s);
    }, [songRankingList, songs]);

    const normalizedSongs = useMemo(() => {
        return songs.map(song => ({
            original: song,
            normalizedTitle: normalizeForSearch(song.title),
            normalizedArtist: normalizeForSearch(song.artist),
            normalizedTitleKana: normalizeForSearch(song.titleKana || ''),
            normalizedArtistKana: normalizeForSearch(song.artistKana || ''),
        }));
    }, [songs]);

    const performSearch = useCallback((term: string) => {
        if (!term.trim()) {
            setSearchResult(null);
            setMatchedArtists([]);
            setSuggestions([]);
            return;
        }

        const normalizedTerm = normalizeForSearch(term);
        let foundSongs: Song[] = [];
        let relatedSongs: Song[] = [];
        const artistMatchMap = new Map<string, number>();

        for (const { original, normalizedTitle, normalizedArtist, normalizedTitleKana, normalizedArtistKana } of normalizedSongs) {
            const exactTitleMatch = normalizedTitle === normalizedTerm || normalizedTitleKana === normalizedTerm;
            const exactArtistMatch = normalizedArtist === normalizedTerm || normalizedArtistKana === normalizedTerm;

            if (exactTitleMatch || exactArtistMatch) {
                foundSongs.push(original);
            } else if (
                normalizedTitle.includes(normalizedTerm) || normalizedTitleKana.includes(normalizedTerm) ||
                normalizedArtist.includes(normalizedTerm) || normalizedArtistKana.includes(normalizedTerm)
            ) {
                relatedSongs.push(original);
            }
            
            if (normalizedArtist.includes(normalizedTerm) || normalizedArtistKana.includes(normalizedTerm)) {
                artistMatchMap.set(original.artist, (artistMatchMap.get(original.artist) || 0) + 1);
            }
        }
        
        const artists = Array.from(artistMatchMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        
        setMatchedArtists(artists);

        if (foundSongs.length > 0) {
            setSearchResult({ status: 'found', songs: foundSongs, searchTerm: term });
            logSearch(term);
        } else if (relatedSongs.length > 0) {
            setSearchResult({ status: 'related', songs: relatedSongs.slice(0, MAX_RELATED_SONGS), searchTerm: term });
        } else {
            setSearchResult({ status: 'notFound', songs: [], searchTerm: term });
        }
        setSuggestions([]);

    }, [normalizedSongs, logSearch]);
    
    useEffect(() => {
        if (initialSearchTermRef.current) {
            performSearch(initialSearchTermRef.current);
            initialSearchTermRef.current = ''; 
        }
    }, [performSearch]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (!term.trim()) {
            setSearchResult(null);
            setMatchedArtists([]);
            setSuggestions([]);
            return;
        }
        
        const normalizedTerm = normalizeForSearch(term);
        const filteredSuggestions = normalizedSongs
            .filter(({ normalizedTitle, normalizedArtist, normalizedTitleKana, normalizedArtistKana }) =>
                normalizedTitle.startsWith(normalizedTerm) ||
                normalizedArtist.startsWith(normalizedTerm) ||
                normalizedTitleKana.startsWith(normalizedTerm) ||
                normalizedArtistKana.startsWith(normalizedTerm)
            )
            .map(s => s.original)
            .slice(0, 5);
        setSuggestions(filteredSuggestions);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const term = searchTerm.trim().toLowerCase();

        if (term === 'admin') {
            onAdminLogin();
            setSearchTerm('');
            setSearchResult(null);
            setSuggestions([]);
            return;
        }

        performSearch(searchTerm);
    };
    
    const handleSuggestionClick = (song: Song) => {
        setSearchTerm(song.title);
        performSearch(song.title);
    };
    
    const handleArtistFilterClick = (artistName: string) => {
        setSearchTerm(artistName);
        performSearch(artistName);
    };
    
    const showLikeMessage = (msg: string) => {
        setLikeMessage(msg);
        setTimeout(() => setLikeMessage(''), 3000);
    };

    const handleLike = async (song: Song) => {
        if (likedSongs.has(song.title)) return;

        setIsLiking(song.title);
        await logLike(song.title, song.artist);
        setLikedSongs(prev => new Set(prev).add(song.title));
        await refreshRankings();
        setIsLiking(null);
        showLikeMessage(`「${song.title}」にいいねしました！`);
    };

    const onAdminTrigger = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            onAdminLogin();
        }
    }, [onAdminLogin]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const specialButtons = useMemo(() => {
        if (!uiConfig.specialButtons) return [];
        const buttonConfigs = {
            twitcas: {
                href: uiConfig.twitcastingUrl,
                icon: uiConfig.twitcastingIconUrl ? () => <img src={uiConfig.twitcastingIconUrl} alt="Twitcas" className="w-4 h-4 sm:w-5 sm:h-5"/> : TwitcasIcon,
                config: uiConfig.specialButtons.twitcas,
                colorClasses: 'bg-[#2190b8] hover:bg-[#1c7a9e]',
            },
            x: {
                href: uiConfig.xUrl,
                icon: uiConfig.xIconUrl ? () => <img src={uiConfig.xIconUrl} alt="X" className="w-4 h-4 sm:w-5 sm:h-5"/> : XSocialIcon,
                config: uiConfig.specialButtons.x,
                colorClasses: 'bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black',
            },
            youtube: {
                href: uiConfig.youtubeUrl,
                icon: uiConfig.youtubeIconUrl ? () => <img src={uiConfig.youtubeIconUrl} alt="YouTube" className="w-4 h-4 sm:w-5 sm:h-5"/> : YouTubeIcon,
                config: uiConfig.specialButtons.youtube,
                colorClasses: 'bg-[#ff0000] hover:bg-[#cc0000]',
            },
            support: {
                onClick: openSupportModal,
                icon: uiConfig.supportIconUrl ? () => <img src={uiConfig.supportIconUrl} alt="Support" className="w-4 h-4 sm:w-5 sm:h-5"/> : HeartIcon,
                config: uiConfig.specialButtons.support,
                colorClasses: 'bg-pink-500 hover:bg-pink-600',
            }
        };
        const buttonOrder: (keyof typeof buttonConfigs)[] = ['twitcas', 'x', 'youtube', 'support'];
        return buttonOrder.map(key => buttonConfigs[key]).filter(btn => btn && btn.config?.enabled);
    }, [uiConfig, openSupportModal]);

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in px-4">
            <div className="text-center mb-8">
                <p className="text-sm sm:text-base text-text-secondary-light dark:text-text-secondary-dark font-medium tracking-wide">{uiConfig.subtitle}</p>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="mb-12 relative" ref={searchContainerRef}>
                <div className="relative group">
                    <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-light/60 dark:text-text-secondary-dark/60 transition-colors group-focus-within:text-[var(--primary-color)]" />
                    <input
                        type="search"
                        placeholder="曲名やアーティスト名で検索"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={onAdminTrigger}
                        className="w-full bg-input-bg-light dark:bg-input-bg-dark border-2 border-border-light dark:border-border-dark rounded-2xl py-4 pl-14 pr-12 text-base font-medium shadow-sm transition-all focus:outline-none focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[var(--primary-color)]/10"
                        style={{'--tw-ring-color': 'var(--primary-color)'} as React.CSSProperties}
                        aria-label="検索"
                    />
                    {searchTerm && (
                        <button type="button" onClick={() => { setSearchTerm(''); setSearchResult(null); setMatchedArtists([]); setSuggestions([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-text-secondary-light/60 dark:text-text-secondary-dark/60 hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors">
                            <XIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {suggestions.length > 0 && (
                    <ul className="absolute z-20 w-full mt-2 bg-card-background-light dark:bg-card-background-dark border border-border-light dark:border-border-dark rounded-2xl shadow-xl overflow-hidden backdrop-blur-lg">
                        {suggestions.map((song, index) => (
                            <li key={index} onClick={() => handleSuggestionClick(song)} className="px-5 py-3.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 border-b border-border-light/50 dark:border-border-dark/50 last:border-b-0 transition-colors">
                                <div className="flex items-center gap-3">
                                    <MusicNoteIcon className="w-4 h-4 opacity-40" />
                                    <span className="font-bold text-sm sm:text-base">{song.title}</span>
                                    <span className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium ml-auto">/ {song.artist}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </form>

             {likeMessage && <p className="text-center text-pink-500 h-6 mb-4 flex items-center justify-center font-bold animate-pulse text-sm">{likeMessage}</p>}

            {searchResult ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="px-5 py-1.5 bg-[var(--primary-color)] text-white text-xs font-bold rounded-full shadow-lg shadow-[var(--primary-color)]/20 uppercase tracking-widest">
                            {searchResult.songs.length} results found
                        </span>
                    </div>
                    
                    {matchedArtists.length > 0 && (
                        <div className="mb-8 flex flex-wrap justify-center gap-2.5">
                            {matchedArtists.slice(0, 5).map((artist, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleArtistFilterClick(artist.name)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-xl text-xs font-bold hover:border-[var(--primary-color)] hover:text-[var(--primary-color)] transition-all shadow-sm hover:shadow-md group"
                                >
                                    <UserGroupIcon className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                                    <span>{artist.name}</span>
                                    <span className="text-[10px] opacity-40 font-medium">{artist.count}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {searchResult.status === 'found' && (
                         <div className="space-y-4">
                            <h2 className="text-lg font-bold text-center mb-2 tracking-tight">レパートリーにあります！</h2>
                            {searchResult.songs.map((song, index) => <SongCard key={index} song={song} onLike={handleLike} isLiking={isLiking === song.title} isLiked={likedSongs.has(song.title)} />)}
                        </div>
                    )}
                    {searchResult.status === 'related' && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold text-center mb-2 tracking-tight">もしかしてこちらの曲ですか？</h2>
                            {searchResult.songs.map((song, index) => <SongCard key={index} song={song} onLike={handleLike} isLiking={isLiking === song.title} isLiked={likedSongs.has(song.title)} />)}
                        </div>
                    )}
                    {searchResult.status === 'notFound' && (
                        <div className="text-center p-10 bg-white/50 dark:bg-gray-800/30 backdrop-blur-sm rounded-3xl border-2 border-dashed border-border-light dark:border-border-dark">
                            <h2 className="text-xl font-bold mb-3 tracking-tight">検索結果が見つかりませんでした</h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-8">お探しの方はリクエストボタンから申請いただくか、<br className="hidden sm:block"/>ぷりんと楽譜で楽譜の有無をご確認ください。</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => setIsRequestModalOpen(true)} className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90 text-white font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-[var(--primary-color)]/20">
                                    <PlusIcon className="w-5 h-5" />
                                    リクエストする
                                </button>
                                {(() => {
                                    const printGakufuSearchUrl = `${uiConfig.printGakufuUrl || 'https://www.print-gakufu.com/'}search/result/score___keyword__${encodeURIComponent(searchResult.searchTerm)}/`;
                                    return (
                                        <a href={printGakufuSearchUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-green-600/20">
                                            <DocumentTextIcon className="w-5 h-5" />
                                            楽譜を探す
                                        </a>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="mb-10 grid grid-cols-2 gap-4 sm:gap-6">
                        {uiConfig.navButtons?.list?.enabled && <NavCard icon={MusicNoteIcon} title={uiConfig.navButtons.list.label} onClick={() => setMode('list')} />}
                        {uiConfig.navButtons?.news?.enabled && <NavCard icon={NewspaperIcon} title={uiConfig.navButtons.news.label} onClick={() => setMode('news')} />}
                        {uiConfig.navButtons?.suggest?.enabled && <NavCard icon={LightBulbIcon} title={uiConfig.navButtons.suggest.label} onClick={openSuggestModal} />}
                        {uiConfig.navButtons?.requests?.enabled && <NavCard icon={CloudUploadIcon} title={uiConfig.navButtons.requests.label} onClick={() => setMode('requests')} />}
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-12">
                        {specialButtons.map((btn, index) => (
                            <a
                                key={index}
                                href={'href' in btn ? btn.href : undefined}
                                onClick={'onClick' in btn ? btn.onClick : undefined}
                                target={'href' in btn ? '_blank' : undefined}
                                rel={'href' in btn ? 'noopener noreferrer' : undefined}
                                className={`flex items-center justify-center gap-2 w-full p-4 sm:p-5 text-white rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg min-h-[60px] ${btn.colorClasses}`}
                            >
                                <btn.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"/>
                                <span className="leading-tight text-center tracking-tight">{btn.config.label}</span>
                            </a>
                        ))}
                    </div>
                    
                    {popularSongs.length > 0 && (
                         <div className="mt-12">
                            <div className="flex items-center gap-3 justify-center mb-6">
                                <div className="h-px w-8 bg-border-light dark:bg-border-dark"></div>
                                <h2 className="text-base font-bold uppercase tracking-widest text-text-secondary-light/60">Popular Songs</h2>
                                <div className="h-px w-8 bg-border-light dark:bg-border-dark"></div>
                            </div>
                            <div className="space-y-3">
                                {popularSongs.map((song, index) => <SongCard key={index} song={song} onLike={handleLike} isLiking={isLiking === song.title} isLiked={likedSongs.has(song.title)} />)}
                            </div>
                        </div>
                    )}
                </>
            )}

            <RequestSongModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                songTitle={searchResult?.searchTerm || ''}
                logRequest={logRequest}
                onSuccess={refreshRankings}
                uiConfig={uiConfig}
            />
        </div>
    );
};
