
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Song } from '../../types';
import { XIcon, YouTubeIcon, DocumentTextIcon } from '../../components/ui/Icons';

interface SuggestSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    songs: Song[];
    onSelect: (text: string) => void;
}

type GamePhase = 'idle' | 'spinning' | 'result';
type FilterType = 'all' | 'genre' | 'season' | 'artist';

const SEASONS = ['春', '夏', '秋', '冬'];

export const SuggestSongModal: React.FC<SuggestSongModalProps> = ({ isOpen, onClose, songs, onSelect }) => {
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [filterValue, setFilterValue] = useState<string>('');
    const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
    const [suggestedSong, setSuggestedSong] = useState<Song | null>(null);
    const [flickerSong, setFlickerSong] = useState<Song | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const intervalRef = useRef<number | null>(null);

    // 利用可能なフィルター選択肢を抽出
    // FIX: Cast to string[] to ensure 'a' and 'b' in sort are treated as strings with localeCompare.
    const availableGenres = useMemo(() => 
        ([...new Set(songs.map(s => s.genre).filter(Boolean))] as string[]).sort((a, b) => a.localeCompare(b, 'ja')),
    [songs]);

    // FIX: Cast to string[] to ensure 'a' and 'b' in sort are treated as strings with localeCompare.
    const availableArtists = useMemo(() => 
        ([...new Set(songs.map(s => s.artist).filter(Boolean))] as string[]).sort((a, b) => a.localeCompare(b, 'ja')),
    [songs]);

    // フィルター適用後の抽選対象リスト
    const pool = useMemo(() => {
        if (filterType === 'all') return songs;
        if (filterType === 'genre') return songs.filter(s => s.genre === filterValue);
        if (filterType === 'season') return songs.filter(s => s.season === filterValue);
        if (filterType === 'artist') return songs.filter(s => s.artist === filterValue);
        return songs;
    }, [songs, filterType, filterValue]);

    const startSpin = useCallback(() => {
        if (pool.length === 0) return;

        setIsCopied(false);
        setGamePhase('spinning');
        setSuggestedSong(null);

        // 高速で表示を切り替える
        intervalRef.current = window.setInterval(() => {
            const randomIndex = Math.floor(Math.random() * pool.length);
            setFlickerSong(pool[randomIndex]);
        }, 80);

        // 2秒後に結果を決定
        setTimeout(() => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            const finalSongIndex = Math.floor(Math.random() * pool.length);
            const finalSong = pool[finalSongIndex];
            setSuggestedSong(finalSong);
            setFlickerSong(null);
            setGamePhase('result');
        }, 1500);

    }, [pool]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setGamePhase('idle');
            setSuggestedSong(null);
            setFlickerSong(null);
            setIsCopied(false);
            setFilterType('all');
            setFilterValue('');
        }
    }, [isOpen]);

    const handleCopy = () => {
        if (suggestedSong) {
            const textToCopy = `${suggestedSong.title} / ${suggestedSong.artist}`;
            onSelect(textToCopy);
            setIsCopied(true);
        }
    };
    
    if (!isOpen) return null;

    const displaySong = flickerSong || suggestedSong;
    
    const FilterButton: React.FC<{ type: FilterType; label: string }> = ({ type, label }) => (
        <button
            onClick={() => { setFilterType(type); setFilterValue(''); setGamePhase('idle'); }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                filterType === type 
                ? 'bg-[var(--primary-color)] text-white shadow-md' 
                : 'bg-black/5 dark:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card-background-light dark:bg-card-background-dark rounded-3xl shadow-2xl w-full max-md text-center p-6 sm:p-8 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary-light dark:text-text-secondary-dark z-20"
                    disabled={gamePhase === 'spinning'}
                >
                    <XIcon className="w-6 h-6" />
                </button>

                <h2 className="text-xl sm:text-2xl font-black mb-6">おまかせ選曲ルーレット</h2>

                {/* フィルター設定セクション */}
                <div className="mb-6 space-y-4 animate-fade-in">
                    <div className="flex flex-wrap justify-center gap-2 mb-2">
                        <FilterButton type="all" label="すべて" />
                        <FilterButton type="genre" label="ジャンル別" />
                        <FilterButton type="season" label="季節別" />
                        <FilterButton type="artist" label="アーティスト別" />
                    </div>

                    <div className="min-h-[44px]">
                        {filterType === 'genre' && (
                            <select 
                                value={filterValue} 
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="w-full bg-input-bg-light dark:bg-input-bg-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--primary-color)]"
                            >
                                <option value="">ジャンルを選択してください</option>
                                {availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        )}
                        {filterType === 'season' && (
                            <div className="flex justify-center gap-3">
                                {SEASONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterValue(s)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${filterValue === s ? 'scale-125 border-2 border-[var(--primary-color)] bg-[var(--primary-color)]/10 shadow-lg' : 'opacity-40 grayscale hover:grayscale-0'}`}
                                    >
                                        {s === '春' && '🌸'}
                                        {s === '夏' && '☀️'}
                                        {s === '秋' && '🍂'}
                                        {s === '冬' && '❄️'}
                                    </button>
                                ))}
                            </div>
                        )}
                        {filterType === 'artist' && (
                            <select 
                                value={filterValue} 
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="w-full bg-input-bg-light dark:bg-input-bg-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[var(--primary-color)]"
                            >
                                <option value="">アーティストを選択してください</option>
                                {availableArtists.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        )}
                    </div>
                </div>
                
                {/* 抽選BOX */}
                <div className="relative group mb-8">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[var(--primary-color)] to-[var(--secondary-color)] rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative h-40 w-full flex flex-col items-center justify-center p-4 text-center bg-white dark:bg-gray-900 rounded-2xl border-2 border-border-light dark:border-border-dark overflow-hidden">
                        {gamePhase === 'idle' && (
                            <div className="space-y-2">
                                <p className="text-3xl sm:text-4xl">🎰</p>
                                <p className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-widest">
                                    {pool.length > 0 ? `${pool.length}曲が対象` : '対象の曲がありません'}
                                </p>
                            </div>
                        )}
                        {gamePhase === 'spinning' && displaySong && (
                            <div className="animate-pulse">
                                <h3 className="text-2xl sm:text-3xl font-black mb-1 truncate max-w-full" style={{color: 'var(--primary-color)'}}>{displaySong.title}</h3>
                                <p className="text-sm font-bold opacity-60 truncate max-w-full">{displaySong.artist}</p>
                            </div>
                        )}
                        {gamePhase === 'result' && displaySong && (
                             <div className="animate-pop">
                                 <h3 className="text-2xl sm:text-3xl font-black mb-1 truncate max-w-full" style={{color: 'var(--primary-color)'}}>{displaySong.title}</h3>
                                <p className="text-base sm:text-lg font-bold truncate max-w-full">{displaySong.artist}</p>
                                {displaySong.season && <span className="inline-block mt-2 text-xs bg-black/5 px-2 py-0.5 rounded-full">{displaySong.season}の曲</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* アクションボタン */}
                <div className="space-y-4">
                    {gamePhase === 'result' && suggestedSong && (
                        <div className="flex items-center justify-center gap-6 mb-6 animate-fade-in">
                             <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${suggestedSong.artist} ${suggestedSong.title}`)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
                                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center transition-transform group-hover:scale-110">
                                    <YouTubeIcon className="w-6 h-6 text-red-600" />
                                </div>
                                <span className="text-[10px] font-bold opacity-60">YouTube</span>
                            </a>
                            <a href={`https://www.google.com/search?q=${encodeURIComponent(`${suggestedSong.artist} ${suggestedSong.title} 歌詞`)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group">
                                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center transition-transform group-hover:scale-110">
                                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-[10px] font-bold opacity-60">歌詞</span>
                            </a>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                            onClick={startSpin} 
                            disabled={gamePhase === 'spinning' || pool.length === 0 || (filterType !== 'all' && !filterValue)}
                            className="w-full py-4 bg-[var(--primary-color)] hover:opacity-90 text-[var(--text-on-primary)] font-black rounded-2xl shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            {gamePhase === 'idle' ? 'スタート！' : 'もう一度まわす'}
                        </button>
                        
                        <button 
                            onClick={handleCopy} 
                            disabled={gamePhase !== 'result'} 
                            className={`w-full py-4 font-black rounded-2xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                                isCopied 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white dark:bg-gray-800 border-2 border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark disabled:opacity-30'
                            }`}
                        >
                            {isCopied ? 'コピーしました！' : '検索画面で開く'}
                        </button>
                    </div>
                    
                    {filterType !== 'all' && !filterValue && (
                        <p className="text-[10px] font-bold text-pink-500 animate-pulse">※先に{filterType === 'genre' ? 'ジャンル' : filterType === 'season' ? '季節' : 'アーティスト'}を選択してください</p>
                    )}
                </div>
            </div>
        </div>
    );
};
