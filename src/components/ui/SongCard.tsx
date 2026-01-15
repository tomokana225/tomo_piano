import React from 'react';
import { Song } from '../../types';
import { YouTubeIcon, DocumentTextIcon, HeartIcon, HeartIconSolid } from './Icons';
import { LoadingSpinner } from './LoadingSpinner';

interface SongCardProps {
    song: Song;
    onLike?: (song: Song) => void;
    isLiking?: boolean;
    isLiked?: boolean;
}

const ActionButton = ({ href, title, icon }: { href: string, title: string, icon: React.ReactNode }) => (
    <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer" 
        title={title} 
        className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-all duration-200 p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full hover:scale-110 active:scale-90"
    >
        {icon}
    </a>
);

export const SongCard: React.FC<SongCardProps> = ({ song, onLike, isLiking, isLiked }) => {
    const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`;
    const lyricsSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${song.artist} ${song.title} 歌詞`)}`;

    return (
        <div className="bg-input-bg-light dark:bg-input-bg-dark py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg flex justify-between items-center border border-border-light dark:border-border-dark fancy-card shadow-sm group">
            <div className="min-w-0 flex-grow">
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-sm sm:text-base lg:text-lg truncate text-text-primary-light dark:text-text-primary-dark leading-tight transition-colors">{song.title}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[11px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">{song.artist}</p>
                    <div className="flex items-center gap-1.5 ml-1">
                        {song.isNew && <span className="text-[9px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full leading-none animate-pulse">NEW</span>}
                        {song.status === 'practicing' && <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full leading-none">練習中</span>}
                        {song.genre && <span className="text-[9px] text-text-secondary-light dark:text-text-secondary-dark font-medium px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 leading-none">{song.genre}</span>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2 sm:ml-4">
                <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 hover:text-red-400" />} />
                <ActionButton href={lyricsSearchUrl} title="歌詞を検索" icon={<DocumentTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />} />
                 {onLike && (
                    <button 
                        onClick={() => onLike(song)} 
                        disabled={isLiking || isLiked} 
                        className="p-1.5 rounded-full hover:bg-pink-500/10 dark:hover:bg-pink-500/20 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 active:scale-90" 
                        title={isLiked ? "いいね済み" : "いいね！"}
                    >
                        {isLiking ? (
                            <LoadingSpinner className="w-4 h-4 text-pink-400" />
                        ) : isLiked ? (
                            <HeartIconSolid className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 animate-pop" />
                        ) : (
                            <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};