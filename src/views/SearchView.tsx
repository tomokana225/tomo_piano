import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Song, SearchResult, UiConfig, RankingItem, Mode } from '../types';
import { normalizeForSearch } from '../utils/normalization';
import { SearchIcon, XIcon, PlusIcon, MusicNoteIcon, NewspaperIcon, LightBulbIcon, CloudUploadIcon, ChevronRightIcon, HeartIcon, TwitcasIcon, XSocialIcon, DocumentTextIcon } from '../components/ui/Icons';
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

const MAX_RELATED_SONGS = 5;

const NavCard: React.FC<{
    icon: React.FC<{ className?: string, style?: React.CSSProperties }>;
    title: string;
    onClick: () => void;
}> = ({ icon: Icon, title, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full flex items-center gap-2 p-3 sm:gap-4 sm:p-4 rounded-xl bg-card-background-light dark:bg-card-background-dark border border-border-light dark:border-border-dark shadow-md hover:shadow-lg hover:border-[var(--primary-color)] transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-color)] dark:focus:ring-offset-card-background-dark"
    aria-label={title}
  >
    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors duration-300 bg-black/5 dark:bg-white/10 group-hover:bg-black/10 dark:group-hover:bg-white/20 flex-shrink-0">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300" style={{ color: 'var(--primary-color)' }} />
    </div>
    <h3 className="font-bold text-sm sm:text-base text-text-primary-light dark:text-text-primary-dark text-left whitespace-nowrap truncate">{title}</h3>
    <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-auto text-text-secondary-light/70 dark:text-text-secondary-dark/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--primary-color)] flex-shrink-0" />
  </button>
);


export const SearchView: React.FC<SearchViewProps> = ({ songs, logSearch, logLike, logRequest, refreshRankings, searchTerm, setSearchTerm, onAdminLogin, uiConfig, songRankingList, setMode, openSuggestModal, openSupportModal }) => {
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Song[]>([]);
    const [isLiking, setIsLiking] = useState<string | null>(null);
    const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
    const [likeMessage, setLikeMessage] = useState('');
    // FIX: Changed ref type from HTMLDivElement to HTMLFormElement to match the element it's attached to.
    const searchContainerRef = useRef<HTMLFormElement>(null);
    const initialSearchTermRef = useRef(searchTerm);

    const popularSongs = useMemo(() => {
        return songRankingList
            .slice(0, 5) // Top 5
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
            setSuggestions([]);
            return;
        }

        const normalizedTerm = normalizeForSearch(term);
        let foundSongs: Song[] = [];
        let relatedSongs: Song[] = [];

        for (const { original, normalizedTitle, normalizedArtist, normalizedTitleKana, normalizedArtistKana } of normalizedSongs) {
            const titleMatch = normalizedTitle === normalizedTerm || normalizedTitleKana === normalizedTerm;
            const artistMatch = normalizedArtist === normalizedTerm || normalizedArtistKana === normalizedTerm;

            if (titleMatch || artistMatch) {
                foundSongs.push(original);
            } else if (
                (normalizedTitle.includes(normalizedTerm) || normalizedTitleKana.includes(normalizedTerm) ||
                 normalizedArtist.includes(normalizedTerm) || normalizedArtistKana.includes(normalizedTerm))
            ) {
                relatedSongs.push(original);
            }
        }

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
    
    // Auto-search if search term is passed in from another view
    useEffect(() => {
        if (initialSearchTermRef.current) {
            performSearch(initialSearchTermRef.current);
            initialSearchTermRef.current = ''; // Prevent re-searching on subsequent renders
        }
    }, [performSearch]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (!term.trim()) {
            setSearchResult(null);
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
            const password = prompt("管理者パスワードを入力してください:");
            if (password === 'admin.225') {
                onAdminLogin();
            } else if (password) {
                alert("パスワードが違います。");
            }
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
    
    const showLikeMessage = (msg: string) => {
        setLikeMessage(msg);
        setTimeout(() => setLikeMessage(''), 3000);
    };

    const handleLike = async (song: Song) => {
        if (likedSongs.has(song.title)) return;

        setIsLiking(song.title);
        await logLike(song.title, song.artist);
        setLikedSongs(prev => new Set(prev).add(song.title));
        await refreshRankings(); // Update like ranking data
        setIsLiking(null);
        showLikeMessage(`「${song.title}」にいいねしました！`);
    };

    const onAdminTrigger = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            const password = prompt("管理者パスワードを入力してください:");
            if (password === 'admin.225') { // Super secure password
                onAdminLogin();
            } else if (password) {
                alert("パスワードが違います。");
            }
        }
    }, [onAdminLogin]);
    
    // Close suggestions if clicked outside
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
                icon: uiConfig.twitcastingIconUrl ? () => <img src={uiConfig.twitcastingIconUrl} alt="Twitcas" className="w-6 h-6"/> : TwitcasIcon,
                config: uiConfig.specialButtons.twitcas,
                colorClasses: 'bg-[#2190b8] hover:bg-[#1c7a9e]',
            },
            x: {
                href: uiConfig.xUrl,
                icon: uiConfig.xIconUrl ? () => <img src={uiConfig.xIconUrl} alt="X" className="w-6 h-6"/> : XSocialIcon,
                config: uiConfig.specialButtons.x,
                colorClasses: 'bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black',
            },
            support: {
                onClick: openSupportModal,
                icon: uiConfig.supportIconUrl ? () => <img src={uiConfig.supportIconUrl} alt="Support" className="w-6 h-6"/> : HeartIcon,
                config: uiConfig.specialButtons.support,
                colorClasses: 'bg-pink-500 hover:bg-pink-600',
            }
        };
        const buttonOrder: (keyof typeof buttonConfigs)[] = ['twitcas', 'x', 'support'];
        return buttonOrder.map(key => buttonConfigs[key]).filter(btn => btn && btn.config?.enabled);
    }, [uiConfig, openSupportModal]);

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
                <p className="text-base sm:text-lg text-text-primary-light dark:text-text-primary-dark">{uiConfig.subtitle}</p>
            </div>
            <form onSubmit={handleSearchSubmit} className="mb-6 relative" ref={searchContainerRef}>
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark pointer-events-none" />
                    <input
                        type="search"
                        placeholder="曲名やアーティスト名で検索"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={onAdminTrigger}
                        className="w-full bg-input-bg-light dark:bg-input-bg-dark border-2 border-border-light dark:border-border-dark rounded-full py-3 sm:py-4 pl-12 pr-12 text-base sm:text-lg focus:outline-none focus:ring-2"
                        style={{'--tw-ring-color': 'var(--primary-color)'} as React.CSSProperties}
                        aria-label="検索"
                    />
                    {searchTerm && (
                        <button type="button" onClick={() => { setSearchTerm(''); setSearchResult(null); setSuggestions([]); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
                            <XIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
                {suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-2 bg-card-background-light dark:bg-card-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg">
                        {suggestions.map((song, index) => (
                            <li key={index} onClick={() => handleSuggestionClick(song)} className="px-4 py-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10">
                                {song.title} <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">- {song.artist}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </form>

             {likeMessage && <p className="text-center text-pink-500 h-6 mb-4 flex items-center justify-center">{likeMessage}</p>}

            {searchResult ? (
                <div className="space-y-4">
                    {searchResult.status === 'found' && (
                         <>
                            <h2 className="text-xl font-bold text-center">演奏できます！</h2>
                            {searchResult.songs.map((song, index) => <SongCard key={index} song={song} onLike={handleLike} isLiking={isLiking === song.title} isLiked={likedSongs.has(song.title)} />)}
                        </>
                    )}
                    {searchResult.status === 'related' && (
                        <>
                            <h2 className="text-xl font-bold text-center">もしかして？</h2>
                            {searchResult.songs.map((song, index) => <SongCard key={index} song={song} onLike={handleLike} isLiking={isLiking === song.title} isLiked={likedSongs.has(song.title)} />)}
                        </>
                    )}
                    {searchResult.status === 'notFound' && (
                        <div className="text-center p-6 bg-input-bg-light dark:bg-card-background-dark/50 rounded-lg">
                            <h2 className="text-xl font-bold mb-2">見つかりませんでした</h2>
                            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">リクエストしてみるか、ぷりんと楽譜で探してみてください。</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={() => setIsRequestModalOpen(true)} className="colorful-button flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg transition-transform transform hover:scale-105 shadow" style={{backgroundColor: 'var(--primary-color)'}}>
                                    <PlusIcon className="w-5 h-5" />
                                    リクエストする
                                </button>
                                {(() => {
                                    const printGakufuSearchUrl = `${uiConfig.printGakufuUrl || 'https://www.print-gakufu.com/'}search/result/score___keyword__${encodeURIComponent(searchResult.searchTerm)}/`;
                                    return (
                                        <a href={printGakufuSearchUrl} target="_blank" rel="noopener noreferrer" className="colorful-button flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-transform transform hover:scale-105 shadow">
                                            <DocumentTextIcon className="w-5 h-5" />
                                            ぷりんと楽譜で探す
                                        </a>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4">
                        {uiConfig.navButtons?.list?.enabled && <NavCard icon={MusicNoteIcon} title={uiConfig.navButtons.list.label} onClick={() => setMode('list')} />}
                        {uiConfig.navButtons?.news?.enabled && <NavCard icon={NewspaperIcon} title={uiConfig.navButtons.news.label} onClick={() => setMode('news')} />}
                        {uiConfig.navButtons?.suggest?.enabled && <NavCard icon={LightBulbIcon} title={uiConfig.navButtons.suggest.label} onClick={openSuggestModal} />}
                        {uiConfig.navButtons?.requests?.enabled && <NavCard icon={CloudUploadIcon} title={uiConfig.navButtons.requests.label} onClick={() => setMode('requests')} />}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {specialButtons.map((btn, index) => (
                            <a
                                key={index}
                                href={'href' in btn ? btn.href : undefined}
                                onClick={'onClick' in btn ? btn.onClick : undefined}
                                target={'href' in btn ? '_blank' : undefined}
                                rel={'href' in btn ? 'noopener noreferrer' : undefined}
                                className={`flex items-center justify-center gap-3 w-full text-center px-4 py-3 sm:px-6 sm:py-4 text-white rounded-lg font-bold transition-transform transform hover:scale-105 shadow-lg ${btn.colorClasses} whitespace-nowrap`}
                            >
                                <btn.icon className="w-6 h-6 flex-shrink-0"/>
                                {btn.config.label}
                            </a>
                        ))}
                    </div>
                    
                    {popularSongs.length > 0 && (
                         <div>
                            <h2 className="text-xl font-bold text-center mb-4">人気の曲</h2>
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