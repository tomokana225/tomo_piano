import React, { useState } from 'react';
import { Song, RankingItem, ArtistRankingItem, RankingPeriod, RequestRankingItem } from '../types';
import { YouTubeIcon, DocumentTextIcon, ChevronDownIcon } from '../components/ui/Icons';

interface RankingViewProps {
    songs: Song[];
    songRanking: RankingItem[];
    artistRanking: ArtistRankingItem[];
    requestRanking: RequestRankingItem[];
    period: RankingPeriod;
    setPeriod: (period: RankingPeriod) => void;
}

const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return <span className="font-bold text-gray-500 dark:text-gray-400">{rank}</span>;
};

const ActionButton: React.FC<{ href: string, title: string, icon: React.ReactNode }> = ({ href, title, icon }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
        {icon}
    </a>
);

const SongRankingTab: React.FC<{ songs: RankingItem[] }> = ({ songs }) => {
    const [expandedSong, setExpandedSong] = useState<string | null>(null);

    return (
        <div className="space-y-3 animate-fade-in-fast">
            {songs.length > 0 ? songs.map((item, index) => {
                const isExpanded = expandedSong === item.id;
                const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artist} ${item.id}`)}`;
                const lyricsSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${item.artist} ${item.id} 歌詞`)}`;
                return (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md overflow-hidden">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setExpandedSong(isExpanded ? null : item.id)} className="flex items-center gap-3 flex-grow min-w-0 text-left">
                                <div className="text-xl w-8 text-center flex-shrink-0">{getMedal(index + 1)}</div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{item.id}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.artist}</p>
                                </div>
                            </button>
                            <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                                <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-6 h-6 text-red-600 hover:text-red-500" />} />
                                <ActionButton href={lyricsSearchUrl} title="歌詞を検索" icon={<DocumentTextIcon className="w-5 h-5" />} />
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="pl-11 pt-2 animate-fade-in">
                                <p className="text-base font-semibold text-cyan-600 dark:text-cyan-400">検索回数: {item.count}回</p>
                            </div>
                        )}
                    </div>
                );
            }) : <p className="text-center text-gray-500 dark:text-gray-400 mt-8">ランキングデータがありません。</p>}
        </div>
    );
};

const ArtistRankingTab: React.FC<{ artists: ArtistRankingItem[], songs: Song[] }> = ({ artists, songs }) => {
    const [expandedArtist, setExpandedArtist] = useState<string | null>(null);
    
    return (
        <div className="space-y-3 animate-fade-in-fast">
            {artists.length > 0 ? artists.map((item, index) => {
                const isExpanded = expandedArtist === item.id;
                const artistSongs = songs.filter(s => s.artist === item.id).sort((a,b) => a.title.localeCompare(b.title, 'ja'));

                return (
                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <button onClick={() => setExpandedArtist(isExpanded ? null : item.id)} className="w-full p-3 flex items-center justify-between text-left">
                            <div className="flex items-center gap-3">
                                <div className="text-xl w-8 text-center">{getMedal(index + 1)}</div>
                                <h3 className="font-bold text-base text-gray-900 dark:text-white">{item.id}</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-base font-semibold text-cyan-600 dark:text-cyan-400">{item.count}回</div>
                                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        {isExpanded && (
                            <div className="pl-12 pr-4 pb-3 pt-1 bg-gray-50 dark:bg-gray-700/50 animate-fade-in">
                                {artistSongs.length > 0 ? (
                                    <ul className="space-y-2">
                                        {artistSongs.map(song => (
                                            <li key={song.title} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-700 dark:text-gray-300">{song.title}</span>
                                                <div className="flex items-center gap-3">
                                                    <ActionButton href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${song.artist} ${song.title}`)}`} title="YouTube" icon={<YouTubeIcon className="w-5 h-5 text-red-600" />} />
                                                    <ActionButton href={`https://www.google.com/search?q=${encodeURIComponent(`${song.artist} ${song.title} 歌詞`)}`} title="歌詞" icon={<DocumentTextIcon className="w-4 h-4" />} />
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">レパートリーに登録されている曲はありません。</p>
                                )}
                            </div>
                        )}
                    </div>
                )
            }) : <p className="text-center text-gray-500 dark:text-gray-400 mt-8">ランキングデータがありません。</p>}
        </div>
    );
};

const LikeRankingTab: React.FC<{ requests: RequestRankingItem[] }> = ({ requests }) => {
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    return (
        <div className="space-y-3 animate-fade-in-fast">
            {requests.length > 0 ? requests.map((item, index) => {
                const isExpanded = expandedItem === item.id;
                const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artist} ${item.id}`)}`;
                const printGakufuUrl = `https://www.print-gakufu.com/search/result/score___keyword__${encodeURIComponent(item.id)}/`;
                return (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md overflow-hidden">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setExpandedItem(isExpanded ? null : item.id)} className="flex items-center gap-3 flex-grow min-w-0 text-left">
                                <div className="text-xl w-8 text-center flex-shrink-0">{getMedal(index + 1)}</div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{item.id}</h3>
                                    {item.artist && <p className="text-xs text-gray-500 dark:text-gray-400">{item.artist}</p>}
                                </div>
                            </button>
                            <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                                <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-6 h-6 text-red-600 hover:text-red-500" />} />
                                <ActionButton href={printGakufuUrl} title="ぷりんと楽譜で検索" icon={<DocumentTextIcon className="w-5 h-5" />} />
                            </div>
                        </div>
                        {isExpanded && (
                            <div className="pl-11 pt-2 animate-fade-in">
                                <p className="text-base font-semibold text-pink-600 dark:text-pink-400">いいね数: {item.count}票</p>
                            </div>
                        )}
                    </div>
                );
            }) : <p className="text-center text-gray-500 dark:text-gray-400 mt-8">ランキングデータがありません。</p>}
        </div>
    );
};


export const RankingView: React.FC<RankingViewProps> = ({ songs, songRanking, artistRanking, requestRanking, period, setPeriod }) => {
    const [mainTab, setMainTab] = useState<'search' | 'like'>('search');
    const [searchSubTab, setSearchSubTab] = useState<'song' | 'artist'>('song');

    const MainTabButton: React.FC<{ tab: 'search' | 'like', label: string }> = ({ tab, label }) => {
        const isActive = mainTab === tab;
        return (
            <button
                onClick={() => setMainTab(tab)}
                className={`w-1/2 py-3 text-center font-semibold rounded-t-lg transition-colors focus:outline-none ${isActive ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white' : 'bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700/80 text-gray-500 dark:text-gray-400'}`}
            >
                {label}
            </button>
        );
    };

    const SearchSubTabButton: React.FC<{ tab: 'song' | 'artist', label: string }> = ({ tab, label }) => {
        const isActive = searchSubTab === tab;
        return (
            <button
                onClick={() => setSearchSubTab(tab)}
                className={`flex-1 py-2 text-sm font-semibold transition-colors focus:outline-none ${isActive ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-600/50'}`}
            >
                {label}
            </button>
        );
    };

    const PeriodButton: React.FC<{ p: RankingPeriod, label: string }> = ({ p, label }) => {
        const isActive = period === p;
        return (
            <button
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-cyan-500 text-white' : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                style={{backgroundColor: isActive ? 'var(--primary-color)' : ''}}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-4">ランキング</h2>
            
            <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <PeriodButton p="all" label="すべて" />
                    <PeriodButton p="month" label="月間" />
                    <PeriodButton p="year" label="年間" />
                </div>
            </div>
            
            <div className="flex">
                <MainTabButton tab="search" label="検索数ランキング" />
                <MainTabButton tab="like" label="いいね数ランキング" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg">
                {mainTab === 'search' ? (
                    <div>
                        <div className="flex bg-gray-100 dark:bg-gray-900/50 rounded-t-md overflow-hidden border-b border-gray-200 dark:border-gray-700">
                             <SearchSubTabButton tab="song" label="曲" />
                             <SearchSubTabButton tab="artist" label="アーティスト" />
                        </div>
                        <div className="p-4">
                            {searchSubTab === 'song' ? <SongRankingTab songs={songRanking} /> : <ArtistRankingTab artists={artistRanking} songs={songs} />}
                        </div>
                    </div>
                ) : (
                    <div className="p-4">
                        <LikeRankingTab requests={requestRanking} />
                    </div>
                )}
            </div>
        </div>
    );
};
