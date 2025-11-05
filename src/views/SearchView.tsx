import React, { useState, useMemo, useCallback } from 'react';
import { Song, SearchResult } from '../types';
import { SearchIcon, XIcon, ExternalLinkIcon, CheckCircleIcon, CloudUploadIcon } from '../components/ui/Icons';
import { normalizeForSearch } from '../utils/normalization';
import { SongCard } from '../components/ui/SongCard';

interface SearchViewProps {
    songs: Song[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onAdminOpen: () => void;
    logSearchTerm: (term: string) => void;
    logRequest: (term: string) => void;
    fetchRankings: () => void;
    fetchRequestRankings: () => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ songs, searchTerm, setSearchTerm, onAdminOpen, logSearchTerm, logRequest, fetchRankings, fetchRequestRankings }) => {
    const [finalSearchTerm, setFinalSearchTerm] = useState('');
    const [lastLoggedTerm, setLastLoggedTerm] = useState('');
    const [isRequested, setIsRequested] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setIsRequested(false);
        setShowSuggestions(true);
    };

    const triggerSearch = (term: string) => {
        const termToSearch = term.trim();
        if (!termToSearch) return;

        setFinalSearchTerm(termToSearch);
        setShowSuggestions(false);

        if (termToSearch.toLowerCase().replace(/\s+/g, '') === 'admin') {
            onAdminOpen();
            setSearchTerm('');
            setFinalSearchTerm('');
            return;
        }

        const normalizedSearch = normalizeForSearch(termToSearch);
        if (lastLoggedTerm !== normalizedSearch) {
            logSearchTerm(termToSearch);
            setLastLoggedTerm(normalizedSearch);
            fetchRankings();
        }
    };

    const handleSearchSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        triggerSearch(searchTerm);
    };

    const handleSuggestionClick = (song: Song) => {
        setSearchTerm(song.title);
        triggerSearch(song.title);
    };

    const suggestions = useMemo(() => {
        const normalizedInput = normalizeForSearch(searchTerm);
        if (!normalizedInput || !showSuggestions) return [];

        return songs.filter(song =>
            normalizeForSearch(song.title).includes(normalizedInput) ||
            normalizeForSearch(song.artist).includes(normalizedInput)
        ).slice(0, 5);
    }, [searchTerm, songs, showSuggestions]);

    const searchResult: SearchResult = useMemo(() => {
        if (!finalSearchTerm) return { status: 'notFound', songs: [], searchTerm: '' };

        const normalizedSearch = normalizeForSearch(finalSearchTerm);
        const foundSongs = songs.filter(song =>
            normalizeForSearch(song.title).includes(normalizedSearch) ||
            normalizeForSearch(song.artist).includes(normalizedSearch)
        );

        if (foundSongs.length > 0) {
            return { status: 'found', songs: foundSongs, searchTerm: finalSearchTerm };
        }

        return { status: 'notFound', songs: [], searchTerm: finalSearchTerm };
    }, [finalSearchTerm, songs]);

    const handleRequest = () => {
        logRequest(finalSearchTerm);
        setIsRequested(true);
        fetchRequestRankings();
    };

    const clearSearch = () => {
        setSearchTerm('');
        setFinalSearchTerm('');
        setShowSuggestions(false);
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="relative mb-2">
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="曲名やアーティスト名で検索..."
                            value={searchTerm}
                            onChange={handleInputChange}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="w-full bg-gray-800 border-2 border-gray-700 rounded-full py-3 pl-5 pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition"
                            autoComplete="off"
                        />
                        {searchTerm && (
                            <button type="button" onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2">
                                <XIcon className="w-6 h-6 text-gray-400 hover:text-white" />
                            </button>
                        )}
                         {suggestions.length > 0 && (
                            <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                                {suggestions.map((song) => (
                                    <li key={`${song.title}-${song.artist}`}>
                                        <button
                                            type="button"
                                            onClick={() => handleSuggestionClick(song)}
                                            className="w-full text-left px-4 py-2 hover:bg-gray-600"
                                        >
                                            <span className="font-semibold">{song.title}</span>
                                            <span className="text-sm text-gray-400 ml-2">{song.artist}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition" style={{backgroundColor: 'var(--primary-color)'}}>
                        <SearchIcon className="w-5 h-5" />
                        <span>検索</span>
                    </button>
                </div>
            </form>

            {finalSearchTerm && (
                 <div className="mt-6">
                    {searchResult.status === 'found' && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-center text-green-400">レパートリーにあります！</h2>
                            <div className="space-y-3">
                                {searchResult.songs.map(song => <SongCard key={`${song.title}-${song.artist}`} song={song} />)}
                            </div>
                        </div>
                    )}

                    {searchResult.status === 'notFound' && (
                        <div className="text-center p-6 bg-gray-800 rounded-lg">
                            <h2 className="text-xl font-bold mb-4 text-yellow-400">「{finalSearchTerm}」はレパートリーにないようです</h2>
                            <p className="text-gray-300 mb-6">
                                ぷりんと楽譜で販売されている可能性があります。
                                <br />
                                また、今後の参考のために曲をリクエストできます。
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a href={`https://www.print-gakufu.com/search/result/keyword__${encodeURIComponent(finalSearchTerm)}/`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-transform transform hover:scale-105">
                                    <ExternalLinkIcon className="w-5 h-5" />
                                    ぷりんと楽譜で探す
                                </a>
                                <button onClick={handleRequest} disabled={isRequested} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-transform transform hover:scale-105 ${isRequested ? 'bg-green-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}>
                                    {isRequested ? <CheckCircleIcon className="w-5 h-5" /> : <CloudUploadIcon className="w-5 h-5" />}
                                    {isRequested ? 'リクエストしました！' : 'この曲をリクエスト'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
