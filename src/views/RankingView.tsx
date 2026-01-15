import React, { useState } from 'react';
import { Song, RankingItem, ArtistRankingItem, RankingPeriod } from '../types';
import { YouTubeIcon, DocumentTextIcon, ChevronDownIcon } from '../components/ui/Icons';

interface RankingViewProps {
    songs: Song[];
    songRanking: RankingItem[];
    artistRanking: ArtistRankingItem[];
    songLikeRanking: RankingItem[];
    period: RankingPeriod;
    setPeriod: (period: RankingPeriod) => void;
}

const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return <span className="font-bold text-text-secondary-light dark:text-text-secondary-dark">{rank}</span>;
};

const ActionButton: React.FC<{ href: string, title: string, icon: React.ReactNode }> = ({ href, title, icon }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors">
        {icon}
    </a>
);

const SongRankingTab: React.FC<{ songs: RankingItem[] }> = ({ songs }) => {
    return (
        <div className="space-y-3 animate-fade-in">
            {songs.length > 0 ? songs.map((item, index) => {
                const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artist} ${item.id}`)}`;
                const lyricsSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${item.artist} ${item.id} 歌詞`)}`;
                return (
                    <div key={item.id} className="bg-input-bg-light dark:bg-input-bg-dark border border-border-light dark:border-border-dark p-2 sm:p-3 rounded-lg fancy-card shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0 text-left">
                                <div className="text-lg sm:text-xl w-8 text-center flex-shrink-0">{getMedal(index + 1)}</div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-sm sm:text-base truncate text-text-primary-light dark:text-text-primary-dark">{item.id}</h3>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">{item.artist}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 ml-2 flex-shrink-0">
                                <p className="text-sm font-semibold hidden sm:block text-text-primary-light dark:text-text-primary-dark">{item.count}回</p>
                                <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 hover:text-red-500" />} />
                                <ActionButton href={lyricsSearchUrl} title="歌詞を検索" icon={<DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />} />
                            </div>
                        </div>
                    </div>
                );
            }) : <p className="text-center text-text-secondary-light dark:text-text-secondary-dark mt-8">ランキングデータがありません。</p>}
        </div>
    );
};

const ArtistRankingTab: React.FC<{ artists: ArtistRankingItem[], songs: Song[] }> = ({ artists, songs }) => {
    const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
    
    return (
        <div className="space-y-3 animate-fade-in">
            {artists.length > 0 ? artists.map((item, index) => {
                const isExpanded = expandedArtist === item.id;
                const artistSongs = songs.filter(s => s.artist === item.id).sort((a,b) => a.title.localeCompare(b.title, 'ja'));

                return (
                    <div key={item.id} className="bg-input-bg-light dark:bg-input-bg-dark border border-border-light dark:border-border-dark rounded-lg overflow-hidden fancy-card shadow-sm">
                        <button onClick={() => setExpandedArtist(isExpanded ? null : item.id)} className="w-full p-2 sm:p-3 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0">
                                <div className="text-lg sm:text-xl w-8 text-center flex-shrink-0">{getMedal(index + 1)}</div>
                                <h3 className="font-bold text-sm sm:text-base truncate text-text-primary-light dark:text-text-primary-dark">{item.id}</h3>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                <div className="text-sm sm:text-base font-semibold text-text-primary-light dark:text-text-primary-dark">{item.count}回</div>
                                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        {isExpanded && (
                            <div className="pl-12 pr-4 pb-3 pt-1 bg-white dark:bg-gray-800 animate-fade-in">
                                {artistSongs.length > 0 ? (
                                    <ul className="space-y-2">
                                        {artistSongs.map(song => (
                                            <li key={song.title} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-800 dark:text-gray-200 truncate">{song.title}</span>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <ActionButton href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`} title="YouTube" icon={<YouTubeIcon className="w-5 h-5 text-red-600" />} />
                                                    <ActionButton href={`https://www.google.com/search?q=${encodeURIComponent(`${song.artist} ${song.title} 歌詞`)}`} title="歌詞" icon={<DocumentTextIcon className="w-4 h-4" />} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">レパートリーに登録されている曲はありません。</p>
                                )}
                            </div>
                        )}
                    </div>
                )
            }) : <p className="text-center text-text-secondary-light dark:text-text-secondary-dark mt-8">ランキングデータがありません。</p>}
        </div>
    );
};

const LikeRankingList: React.FC<{ songs: RankingItem[] }> = ({ songs }) => {
    return (
        <div className="space-y-3 animate-fade-in">
            {songs.length > 0 ? songs.map((item, index) => {
                const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artist} ${item.id}`)}`;
                const lyricsSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${item.artist} ${item.id} 歌詞`)}`;
                return (
                    <div key={item.id} className="bg-input-bg-light dark:bg-input-bg-dark border border-border-light dark:border-border-dark p-2 sm:p-3 rounded-lg fancy-card shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0 text-left">
                                <div className="text-lg sm:text-xl w-8 text-center flex-shrink-0">{getMedal(index + 1)}</div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-sm sm:text-base truncate text-text-primary-light dark:text-text-primary-dark">{item.id}</h3>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">{item.artist}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 ml-2 flex-shrink-0">
                                <p className="text-sm sm:text-base font-semibold text-pink-500 dark:text-pink-400">{item.count} いいね</p>
                                <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 hover:text-red-500" />} />
                                <ActionButton href={lyricsSearchUrl} title="歌詞を検索" icon={<DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5" />} />
                            </div>
                        </div>
                    </div>
                );
            }) : <p className="text-center text-text-secondary-light dark:text-text-secondary-dark mt-8">ランキングデータがありません。</p>}
        </div>
    );
};

const MainTabButton: React.FC<{ onClick: () => void, isActive: boolean, children: React.ReactNode }> = ({ onClick, isActive, children }) => {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-3 text-base font-bold transition-colors duration-200 border-b-4 -mb-px ${
                isActive
                    ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                    : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:border-gray-300 dark:hover:border-gray-600'
            }`}
        >
            {children}
        </button>
    );
};

const SegmentedControlButton: React.FC<{ onClick: () => void, isActive: boolean, children: React.ReactNode }> = ({ onClick, isActive, children }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 focus:outline-none ${isActive ? '' : 'bg-transparent text-text-secondary-light dark:text-text-secondary-dark hover:bg-black/5 dark:hover:bg-white/10'}`}
            style={{
                backgroundColor: isActive ? 'var(--primary-color)' : '',
                color: isActive ? 'var(--text-on-primary)' : ''
            }}
        >
            {children}
        </button>
    );
};

export const RankingView: React.FC<RankingViewProps> = ({ songs, songRanking, artistRanking, songLikeRanking, period, setPeriod }) => {
    const [rankingType, setRankingType] = useState<'search' | 'like'>('search');
    const [activeTab, setActiveTab] = useState<'song' | 'artist'>('song');

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-6">ランキング</h2>
            
            <div className="flex justify-center items-center gap-4 mb-6">
                <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark shrink-0">集計期間:</span>
                <div className="flex justify-center p-1 rounded-full bg-black/5 dark:bg-white/5">
                    <SegmentedControlButton onClick={() => setPeriod('all')} isActive={period === 'all'}>すべて</SegmentedControlButton>
                    <SegmentedControlButton onClick={() => setPeriod('month')} isActive={period === 'month'}>月間</SegmentedControlButton>
                    <SegmentedControlButton onClick={() => setPeriod('year')} isActive={period === 'year'}>年間</SegmentedControlButton>
                </div>
            </div>

            <div className="border-b border-border-light dark:border-border-dark flex justify-center mb-6">
                <MainTabButton onClick={() => setRankingType('search')} isActive={rankingType === 'search'}>
                    検索ランキング
                </MainTabButton>
                <MainTabButton onClick={() => setRankingType('like')} isActive={rankingType === 'like'}>
                    いいねランキング
                </MainTabButton>
            </div>
            
            {rankingType === 'search' && (
                <div className="animate-fade-in">
                    <div className="flex justify-center p-1 rounded-full bg-black/5 dark:bg-white/5 max-w-xs mx-auto mb-6">
                        <SegmentedControlButton onClick={() => setActiveTab('song')} isActive={activeTab === 'song'}>曲</SegmentedControlButton>
                        <SegmentedControlButton onClick={() => setActiveTab('artist')} isActive={activeTab === 'artist'}>アーティスト</SegmentedControlButton>
                    </div>

                    <div className="p-1 sm:p-2">
                        {activeTab === 'song' ? <SongRankingTab songs={songRanking} /> : <ArtistRankingTab artists={artistRanking} songs={songs} />}
                    </div>
                </div>
            )}
            
            {rankingType === 'like' && (
                <div className="p-1 sm:p-2 animate-fade-in">
                    <LikeRankingList songs={songLikeRanking} />
                </div>
            )}
        </div>
    );
};