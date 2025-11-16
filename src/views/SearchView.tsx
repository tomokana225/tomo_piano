import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Song, SearchResult, UiConfig, RankingItem } from '../types';
import { normalizeForSearch } from '../utils/normalization';
import { SearchIcon, XIcon, PlusIcon, DocumentTextIcon } from '../components/ui/Icons';
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
}

const MAX_RELATED_SONGS = 5;

export const SearchView: React.FC<SearchViewProps> = ({ songs, logSearch, logLike, logRequest, refreshRankings, searchTerm, setSearchTerm, onAdminLogin, uiConfig, songRankingList }) => {
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Song[]>([]);
    const [isLiking, setIsLiking] = useState<string | null>(null);
    const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
    const [likeMessage, setLikeMessage] = useState('');
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const initialSearchTermRef = useRef(searchTerm);

    const newSongs = useMemo(() => {
        return songs.filter(song => song.isNew).sort((a, b) => a.title.localeCompare(b.title, 'ja'));
    }, [songs]);

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
        setTimeout(() => setLikeMessage(''), 4000);
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

    const renderSearchResults = () => {
        if (!searchResult) return null;

        return (
            <div className="mt-8 animate-fade-in">
                {searchResult.status === 'found' && (
                    <>
                        <h2 className="text-2xl font-bold mb-4">
                            「<span style={{color: 'var(--primary-color)'}}>{searchResult.searchTerm}</span>」の検索結果 ({searchResult.songs.length}件)
                        </h2>
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
                    </>
                )}
                {searchResult.status === 'notFound' && (
                    <div className="text-center py-8 bg-input-bg-light dark:bg-card-background-dark/50 p-6 rounded-lg border border-border-light dark:border-border-dark">
                        <h3 className="text-xl font-semibold mb-2">検索結果が見つかりませんでした。</h3>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                            「<strong style={{color: 'var(--primary-color)'}}>{searchResult.searchTerm}</strong>」を含む曲はリストにありません。
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => setIsRequestModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-transform transform hover:scale-105"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>この曲をリクエストする</span>
                            </button>
                            {uiConfig.printGakufuUrl && (
                                <a
                                    href={`${uiConfig.printGakufuUrl}search/result/?search_type=all&q=${encodeURIComponent(searchResult.searchTerm)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-transform transform hover:scale-105"
                                >
                                    <DocumentTextIcon className="w-5 h-5" />
                                    <span>ぷりんと楽譜で探す</span>
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    const renderWelcomeContent = () => {
         if (searchResult) return null;
         return (
             <div className="mt-8 animate-fade-in space-y-8">
                 {/* Popular Songs */}
                 {popularSongs.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">人気の曲</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {popularSongs.map((song, index) => (
                                <SongCard 
                                    key={`${song.title}-${index}`} 
                                    song={song}
                                    onLike={handleLike}
                                    isLiking={isLiking === song.title}
                                    isLiked={likedSongs.has(song.title)}
                                />
                            ))}
                        </div>
                    </div>
                )}
                 
                 {/* New Songs */}
                 {newSongs.length > 0 && (
                     <div>
                        <h2 className="text-2xl font-bold mb-4">最近追加された曲</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {newSongs.map((song, index) => (
                               <SongCard 
                                    key={`${song.title}-${index}`} 
                                    song={song}
                                    onLike={handleLike}
                                    isLiking={isLiking === song.title}
                                    isLiked={likedSongs.has(song.title)}
                                />
                            ))}
                        </div>
                    </div>
                 )}

                 
             </div>
         );
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">{uiConfig.subtitle}</h2>
            <div ref={searchContainerRef} className="relative w-full max-w-lg mx-auto">
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && performSearch(searchTerm)}
                        placeholder="曲名、アーティスト名で検索"
                        className="w-full bg-card-background-light dark:bg-input-bg-dark border-2 border-border-light dark:border-border-dark rounded-full py-3 pl-12 pr-10 text-lg focus:outline-none focus:ring-2"
                        style={{'--tw-ring-color': 'var(--primary-color)'} as React.CSSProperties}
                    />
                    {searchTerm && (
                        <button onClick={() => { setSearchTerm(''); setSearchResult(null); }} className="absolute right-4 top-1/2 -translate-y-1/2">
                            <XIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                        </button>
                    )}
                </div>
                {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-card-background-light dark:bg-card-background-dark border border-border-light dark:border-border-dark rounded-lg shadow-lg">
                        <ul className="py-1">
                            {suggestions.map((song) => (
                                <li
                                    key={`${song.title}-${song.artist}`}
                                    onClick={() => {
                                        setSearchTerm(`${song.title} / ${song.artist}`);
                                        setSuggestions([]);
                                        performSearch(`${song.title} / ${song.artist}`);
                                    }}
                                    className="px-4 py-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                                >
                                    {song.title} <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">- {song.artist}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            {likeMessage && <p className="text-center text-green-500 h-6 mt-2 flex items-center justify-center">{likeMessage}</p>}

            {renderSearchResults()}
            {renderWelcomeContent()}
            
             <RequestSongModal 
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                songTitle={searchResult?.searchTerm || ''}
                logRequest={logRequest}
                onSuccess={handleRequestSuccess}
                uiConfig={uiConfig}
            />
        </div>
    );
};