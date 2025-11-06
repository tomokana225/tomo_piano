import React from 'react';
import { RankingItem, RankingPeriod } from '../types';
import { YouTubeIcon, DocumentTextIcon } from '../components/ui/Icons';

interface LikeRankingViewProps {
    songRanking: RankingItem[];
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

const SongRankingList: React.FC<{ songs: RankingItem[] }> = ({ songs }) => {
    return (
        <div className="space-y-3 animate-fade-in-fast">
            {songs.length > 0 ? songs.map((item, index) => {
                const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artist} ${item.id}`)}`;
                const lyricsSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${item.artist} ${item.id} 歌詞`)}`;
                return (
                    <div key={item.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-grow min-w-0 text-left">
                                <div className="text-xl w-8 text-center flex-shrink-0">{getMedal(index + 1)}</div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="font-bold text-base text-gray-900 dark:text-white">{item.id}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.artist}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 ml-2 flex-shrink-0">
                                <p className="text-base font-semibold text-cyan-600 dark:text-cyan-400">{item.count} いいね</p>
                                <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-6 h-6 text-red-600 hover:text-red-500" />} />
                                <ActionButton href={lyricsSearchUrl} title="歌詞を検索" icon={<DocumentTextIcon className="w-5 h-5" />} />
                            </div>
                        </div>
                    </div>
                );
            }) : <p className="text-center text-gray-500 dark:text-gray-400 mt-8">ランキングデータがありません。</p>}
        </div>
    );
};

export const LikeRankingView: React.FC<LikeRankingViewProps> = ({ songRanking, period, setPeriod }) => {

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
            <h2 className="text-3xl font-bold text-center mb-4">いいね数ランキング</h2>
            
            <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <PeriodButton p="all" label="すべて" />
                    <PeriodButton p="month" label="月間" />
                    <PeriodButton p="year" label="年間" />
                </div>
            </div>

            <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg shadow-inner">
                <SongRankingList songs={songRanking} />
            </div>
        </div>
    );
};