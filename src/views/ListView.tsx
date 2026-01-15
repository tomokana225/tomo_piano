import React, { useState, useMemo } from 'react';
import { Song } from '../types';
// Fixed: Added MusicNoteIcon to the imports from Icons
import { ChevronRightIcon, ChevronLeftIcon, MusicNoteIcon } from '../components/ui/Icons';
import { SongCard } from '../components/ui/SongCard';

interface ListViewProps {
    songs: Song[];
    logLike: (term: string, artist: string) => Promise<void>;
    refreshRankings: () => void;
}

type ViewState =
    { mode: 'all' } |
    { mode: 'artist_select' } |
    { mode: 'genre_select' } |
    { mode: 'season_select' } |
    { mode: 'by_artist', artist: string } |
    { mode: 'by_genre', genre: string } |
    { mode: 'by_season', season: string };

const SEASONS = ['春', '夏', '秋', '冬'];

export const ListView: React.FC<ListViewProps> = ({ songs, logLike, refreshRankings }) => {
    const [viewState, setViewState] = useState<ViewState>({ mode: 'all' });
    const [isLiking, setIsLiking] = useState<string | null>(null);
    const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
    const [likeMessage, setLikeMessage] = useState('');

    const artists = useMemo(() => [...new Set(songs.map(s => s.artist))].sort((a: string, b: string) => a.localeCompare(b, 'ja')), [songs]);
    const genres = useMemo(() => [...new Set(songs.map(s => s.genre).filter(Boolean))].sort((a: string, b: string) => a.localeCompare(b, 'ja')), [songs]);
    const sortedSongs = useMemo(() => [...songs].sort((a, b) => a.title.localeCompare(b.title, 'ja')), [songs]);

    const countLabel = useMemo(() => {
        if (songs.length === 0) return '読み込み中...';
        
        switch (viewState.mode) {
            case 'by_artist':
                const artistSongsCount = songs.filter(s => s.artist === viewState.artist).length;
                return `全${artistSongsCount}曲`;
            case 'by_genre':
                const genreSongsCount = songs.filter(s => s.genre === viewState.genre).length;
                return `全${genreSongsCount}曲`;
            case 'by_season':
                const seasonSongsCount = songs.filter(s => s.season === viewState.season).length;
                return `全${seasonSongsCount}曲`;
            case 'artist_select':
                return `${artists.length}アーティスト`;
            case 'genre_select':
                return `${genres.length}ジャンル`;
            case 'season_select':
                return `季節を選択`;
            case 'all':
            default:
                return `全${songs.length}曲`;
        }
    }, [viewState, songs, artists, genres]);

    const handleBack = () => {
        if (viewState.mode === 'by_artist') {
            setViewState({ mode: 'artist_select' });
        } else if (viewState.mode === 'by_genre') {
            setViewState({ mode: 'genre_select' });
        } else if (viewState.mode === 'by_season') {
            setViewState({ mode: 'season_select' });
        }
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
    
    const renderContent = () => {
        if (songs.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <MusicNoteIcon className="w-12 h-12 mb-4 animate-bounce" />
                    <p className="text-sm">曲データを読み込んでいます...</p>
                </div>
            );
        }

        const songCards = (songsToRender: Song[]) => (
            <div className="space-y-2">
                {songsToRender.map((song, index) => 
                    <SongCard 
                        key={`${song.title}-${index}`} 
                        song={song}
                        onLike={handleLike}
                        isLiking={isLiking === song.title}
                        isLiked={likedSongs.has(song.title)}
                    />
                )}
            </div>
        );

        switch (viewState.mode) {
            case 'artist_select':
                return (
                    <div className="space-y-2">
                        {artists.map(artist => (
                             <div key={artist} onClick={() => setViewState({ mode: 'by_artist', artist })} className="bg-input-bg-light dark:bg-input-bg-dark p-3 sm:p-4 rounded-lg flex items-center justify-between cursor-pointer fancy-card shadow-sm border border-border-light dark:border-border-dark">
                                <h3 className="font-semibold text-sm sm:text-base text-text-primary-light dark:text-text-primary-dark">{artist}</h3>
                                <ChevronRightIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                            </div>
                        ))}
                    </div>
                );
            case 'genre_select':
                return (
                    <div className="space-y-2">
                        {genres.map(genre => (
                             <div key={genre} onClick={() => setViewState({ mode: 'by_genre', genre })} className="bg-input-bg-light dark:bg-input-bg-dark p-3 sm:p-4 rounded-lg flex items-center justify-between cursor-pointer fancy-card shadow-sm border border-border-light dark:border-border-dark">
                                <h3 className="font-semibold text-sm sm:text-base text-text-primary-light dark:text-text-primary-dark">{genre}</h3>
                                <ChevronRightIcon className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                            </div>
                        ))}
                    </div>
                );
            case 'season_select':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        {SEASONS.map(season => {
                            const seasonSongs = songs.filter(s => s.season === season);
                            return (
                                <button
                                    key={season}
                                    onClick={() => setViewState({ mode: 'by_season', season })}
                                    className="p-6 rounded-2xl bg-white dark:bg-gray-800 border-2 border-border-light dark:border-border-dark shadow-sm hover:border-[var(--primary-color)] transition-all flex flex-col items-center justify-center gap-2 group"
                                >
                                    <span className="text-3xl group-hover:scale-110 transition-transform">
                                        {season === '春' && '🌸'}
                                        {season === '夏' && '☀️'}
                                        {season === '秋' && '🍂'}
                                        {season === '冬' && '❄️'}
                                    </span>
                                    <h3 className="font-bold text-base">{season}の曲</h3>
                                    <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">{seasonSongs.length}曲登録</p>
                                </button>
                            );
                        })}
                    </div>
                );
            case 'by_artist':
                const songsByArtist = songs.filter(s => s.artist === viewState.artist).sort((a, b) => a.title.localeCompare(b.title, 'ja'));
                return songCards(songsByArtist);
             case 'by_genre':
                const songsByGenre = songs.filter(s => s.genre === viewState.genre).sort((a, b) => a.title.localeCompare(b.title, 'ja'));
                return songCards(songsByGenre);
            case 'by_season':
                const songsBySeason = songs.filter(s => s.season === viewState.season).sort((a, b) => a.title.localeCompare(b.title, 'ja'));
                return songCards(songsBySeason);
            case 'all':
            default:
                return songCards(sortedSongs);
        }
    };

    const ModeButton: React.FC<{ mode: ViewState['mode'], label: string }> = ({ mode, label }) => {
        const isActive = viewState.mode === mode || 
                         (mode === 'artist_select' && viewState.mode === 'by_artist') || 
                         (mode === 'genre_select' && viewState.mode === 'by_genre') ||
                         (mode === 'season_select' && viewState.mode === 'by_season');
        return (
            <button
                onClick={() => setViewState({ mode: mode as any })}
                className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs md:text-sm font-semibold transition ${isActive ? 'text-white' : 'bg-transparent text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/10'}`}
                style={{backgroundColor: isActive ? 'var(--primary-color)' : ''}}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in pb-10">
             <div className="mb-4">
                <div className="flex justify-center items-center p-1 rounded-full bg-black/5 dark:bg-white/5 max-w-lg mx-auto overflow-x-auto no-scrollbar gap-1">
                    <ModeButton mode="all" label="曲名順" />
                    <ModeButton mode="artist_select" label="アーティスト" />
                    <ModeButton mode="genre_select" label="ジャンル" />
                    <ModeButton mode="season_select" label="季節" />
                </div>
                 <p className="text-center text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-2">{countLabel}</p>
                 {likeMessage && <p className="text-center text-green-500 h-6 mt-1 flex items-center justify-center text-xs font-bold">{likeMessage}</p>}
             </div>
             
             {(viewState.mode === 'by_artist' || viewState.mode === 'by_genre' || viewState.mode === 'by_season') && (
                <div className="mb-4 text-center">
                    <button onClick={handleBack} className="flex items-center gap-1.5 text-xs font-semibold mb-2 mx-auto transition-opacity hover:opacity-70" style={{color: 'var(--primary-color)'}}>
                        <ChevronLeftIcon className="w-3.5 h-3.5" />
                        <span>戻る</span>
                    </button>
                    <h2 className="text-xl font-bold flex items-center justify-center gap-2">
                        {viewState.mode === 'by_season' && (
                             <span className="text-2xl">
                                {viewState.season === '春' && '🌸'}
                                {viewState.season === '夏' && '☀️'}
                                {viewState.season === '秋' && '🍂'}
                                {viewState.season === '冬' && '❄️'}
                            </span>
                        )}
                        {viewState.mode === 'by_artist' ? viewState.artist : 
                         viewState.mode === 'by_genre' ? viewState.genre : 
                         `${viewState.season}の曲`}
                    </h2>
                </div>
            )}
             
            {renderContent()}
        </div>
    );
};