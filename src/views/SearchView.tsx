import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Song, SearchResult, Mode, UiConfig } from '../types';
import { normalizeForSearch } from '../utils/normalization';
import { SearchIcon, XIcon, PlusIcon, DocumentTextIcon, MusicNoteIcon, NewspaperIcon } from '../components/ui/Icons';
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
    setMode: (mode: Mode) => void;
    uiConfig: UiConfig;
}

const MAX_RELATED_SONGS = 5;

export const SearchView: React.FC<SearchViewProps> = ({ songs, logSearch, logLike, logRequest, refreshRankings, searchTerm, setSearchTerm, onAdminLogin, setMode, uiConfig }) => {
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Song[]>([]);
    const [isLiking, setIsLiking] = useState<string | null>(null);
    const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
    const [likeMessage, setLikeMessage] = useState('');
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const initialSearchTermRef = useRef(searchTerm);


    const normalizedSongs = useMemo(() => {
        return songs.map(song => ({
            original: song,
            normalizedTitle: normalizeForSearch(song.title),
            normalizedArtist: normalizeForSearch(song.artist),
            normalizedTitleKana: normalizeForSearch(song.titleKana || ''),
            normalizedArtistKana: normalizeForSearch(song.artistKana || '')
        }));
    }, [songs]);

    // Update suggestions based on search term
    useEffect(() => {
        // Don't show suggestions if a search has been executed and the term hasn't changed
        if (searchResult && normalizeForSearch(searchTerm) === normalizeForSearch(searchResult.searchTerm)) {
            setSuggestions([]);
            return;
        }

        if (searchTerm.trim().length > 1) {
            const normalizedTerm = normalizeForSearch(searchTerm);
            const filteredSuggestions = normalizedSongs
                .filter(s => 
                    s.normalizedTitle.includes(normalizedTerm) || 
                    s.normalizedArtist.includes(normalizedTerm) ||
                    s.normalizedTitleKana.includes(normalizedTerm) ||
                    s.normalizedArtistKana.includes(normalizedTerm)
                )
                .map(s => s.original)
                .slice(0, 10); // Limit to 10 suggestions
            setSuggestions(filteredSuggestions);
        } else {
            setSuggestions([]);
        }
    }, [searchTerm, normalizedSongs, searchResult]);

    const performSearch = useCallback((term: string) => {
        if (term.trim().toLowerCase() === 'admin') {
            onAdminLogin();
            setSearchTerm(''); 
            setSuggestions([]);
            setSearchResult(null);
            return;
        }
        
        if (!term.trim()) {
            setSearchResult(null);
            return;
        }

        setSuggestions([]); // Hide suggestions after search
        const normalizedTerm = normalizeForSearch(term);
        logSearch(normalizedTerm);
        
        let exactMatches: Song[] = [];
        let titleMatches: Song[] = [];
        let artistMatches: Song[] = [];
        
        for (const s of normalizedSongs) {
            const isMatch = s.normalizedTitle.includes(normalizedTerm) || 
                            s.normalizedArtist.includes(normalizedTerm) ||
                            s.normalizedTitleKana.includes(normalizedTerm) ||
                            s.normalizedArtistKana.includes(normalizedTerm);

            if (isMatch) {
                const isExactMatch = s.normalizedTitle === normalizedTerm || 
                                     s.normalizedArtist === normalizedTerm ||
                                     s.normalizedTitleKana === normalizedTerm ||
                                     s.normalizedArtistKana === normalizedTerm;

                if (isExactMatch) {
                    exactMatches.push(s.original);
                } else if (s.normalizedTitle.includes(normalizedTerm) || s.normalizedTitleKana.includes(normalizedTerm)) {
                    titleMatches.push(s.original);
                } else {
                    artistMatches.push(s.original);
                }
            }
        }
        
        const foundSongs = [...new Set([...exactMatches, ...titleMatches, ...artistMatches])];

        if (foundSongs.length > 0) {
            setSearchResult({ status: 'found', songs: foundSongs, searchTerm: term });
        } else {
            const relatedSongs: Song[] = [];
            setSearchResult({ 
                status: relatedSongs.length > 0 ? 'related' : 'notFound', 
                songs: relatedSongs.slice(0, MAX_RELATED_SONGS), 
                searchTerm: term 
            });
        }

    }, [logSearch, normalizedSongs, onAdminLogin, setSearchTerm]);
    
    useEffect(() => {
        // If the view is loaded with a pre-existing search term (e.g., from the suggest modal),
        // perform the search immediately on mount. This only runs once.
        if (initialSearchTermRef.current.trim()) {
            performSearch(initialSearchTermRef.current);
        }
    }, [performSearch]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const showLikeMessage = (msg: string) => {
        setLikeMessage(msg);
        setTimeout(() => setLikeMessage(''), 3000);
    };

    const handleLike = async (song: Song) => {
        if (likedSongs.has(song.title)) return; // Already liked this session

        setIsLiking(song.title);
        await logLike(song.title, song.artist);
        setLikedSongs(prev => new Set(prev).add(song.title));
        await refreshRankings();
        setIsLiking(null);
        showLikeMessage(`「${song.title}」にいいねしました！`);
    };

    const handleRequestSuccess = () => {
        refreshRankings();
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(searchTerm);
    };

    const handleSuggestionClick = (song: Song) => {
        const newSearchTerm = `${song.title}`;
        setSearchTerm(newSearchTerm);
        performSearch(newSearchTerm);
    };

    const renderResult = () => {
        if (!searchResult) {
            return (
                <div className="text-center text-text-secondary-light dark:text-text-secondary-dark mt-8">
                    <p>曲名やアーティスト名で検索してください。</p>
                </div>
            );
        }

        switch (searchResult.status) {
            case 'found':
                return (
                    <div className="mt-6 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4 text-center">「<span style={{color: 'var(--primary-color)'}}>{searchResult.searchTerm}</span>」の検索結果: {searchResult.songs.length}件</h2>
                        {likeMessage && <p className="text-center text-green-500 h-6 mb-2 flex items-center justify-center">{likeMessage}</p>}
                        <div className="space-y-3">
                            {searchResult.songs.map((song, index) => 
                                <SongCard 
                                    key={`${song.title}-${index}`} 
                                    song={song} 
                                    onLike={handleLike}
                                    isLiking={isLiking === song.title}
                                    isLiked={likedSongs.has(song.title)}
                                />
                            )}
                        </div>
                    </div>
                );
            case 'notFound':
                const printGakufuUrl = `https://www.print-gakufu.com/search/result/score___keyword__${encodeURIComponent(searchResult.searchTerm)}/`;
                return (
                    <div className="text-center text-text-secondary-light dark:text-text-secondary-dark mt-8 p-6 bg-input-bg-light dark:bg-card-background-dark/50 rounded-lg animate-fade-in border border-border-light dark:border-border-dark">
                        <p className="mb-4 text-text-primary-light dark:text-text-primary-dark">「<span className="font-bold" style={{color: 'var(--primary-color)'}}>{searchResult.searchTerm}</span>」は見つかりませんでした。</p>
                        <div className="flex flex-wrap justify-center items-center gap-4">
                            <button 
                                onClick={() => setIsRequestModalOpen(true)} 
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white transition-transform transform hover:scale-105 shadow"
                            >
                               <PlusIcon className="w-5 h-5" /> この曲をリクエストする
                            </button>
                            <a 
                                href={printGakufuUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-green-500 hover:bg-green-600 rounded-lg font-semibold text-white transition-transform transform hover:scale-105 shadow"
                            >
                               <DocumentTextIcon className="w-5 h-5" /> ぷりんと楽譜で探す
                            </a>
                        </div>
                    </div>
                );
            case 'related':
                 return (
                    <div className="mt-6 animate-fade-in">
                        <p className="text-center text-text-secondary-light dark:text-text-secondary-dark mb-4">「<span className="font-bold" style={{color: 'var(--primary-color)'}}>{searchResult.searchTerm}</span>」は見つかりませんでした。もしかして...</p>
                        <div className="space-y-3">
                            {searchResult.songs.map((song, index) => <SongCard key={`${song.title}-${index}`} song={song} />)}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="w-full max-w-2xl mx-auto" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-secondary-light dark:text-text-secondary-dark pointer-events-none" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="曲名 or アーティスト名"
                        className="w-full bg-input-bg-light dark:bg-input-bg-dark border border-border-light dark:border-border-dark rounded-full py-4 pl-14 pr-14 text-lg placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark focus:outline-none focus:ring-2"
                        style={{'--tw-ring-color': 'var(--primary-color)'} as React.CSSProperties}
                        autoComplete="off"
                    />
                    {searchTerm && (
                        <button type="button" onClick={() => { setSearchTerm(''); setSearchResult(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
                            <XIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-card-background-light dark:bg-card-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                        {suggestions.map((song, index) => (
                            <li 
                                key={`${song.title}-${index}`}
                                onClick={() => handleSuggestionClick(song)}
                                onMouseDown={(e) => e.preventDefault()}
                                className="px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition"
                            >
                                <span className="font-semibold">{song.title}</span>
                                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark ml-2">- {song.artist}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </form>

            {(uiConfig.navButtons.list.enabled || uiConfig.navButtons.news.enabled) && (
                <div className="mt-4 flex justify-center items-center gap-3">
                    {uiConfig.navButtons.list.enabled && (
                        <button
                            onClick={() => setMode('list')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-black/5 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/10 dark:hover:bg-white/10 transition"
                        >
                            <MusicNoteIcon className="w-5 h-5" />
                            <span>{uiConfig.navButtons.list.label}</span>
                        </button>
                    )}
                    {uiConfig.navButtons.news.enabled && (
                        <button
                            onClick={() => setMode('news')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-black/5 dark:bg-white/5 text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/10 dark:hover:bg-white/10 transition"
                        >
                            <NewspaperIcon className="w-5 h-5" />
                            <span>{uiConfig.navButtons.news.label}</span>
                        </button>
                    )}
                </div>
            )}

            <div className="mt-6">
                {renderResult()}
            </div>
            
            {isRequestModalOpen && searchResult?.searchTerm && (
                 <RequestSongModal 
                    isOpen={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                    songTitle={searchResult.searchTerm}
                    logRequest={logRequest}
                    onSuccess={handleRequestSuccess}
                />
            )}
        </div>
    );
};