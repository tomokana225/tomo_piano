
import React, { useState } from 'react';
import { RankingItem, ArtistRankingItem, RankingPeriod } from '../types';
import { YouTubeIcon, DocumentTextIcon } from '../components/ui/Icons';

interface RankingViewProps {
    songRanking: RankingItem[];
    artistRanking: ArtistRankingItem[];
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

const SongRankingTab: React.FC<{ songs: RankingItem[] }> = ({ songs }) => (
    <div className="space-y-3 animate-fade-in-fast">
        {songs.length > 0 ? songs.map((item, index) => {
            const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artist} ${item.id}`)}`;
            const printGakufuUrl = `https://www.print-gakufu.com/search/result/keyword__${encodeURIComponent(item.id)}/`;
            return (
                <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-4 flex-grow min-w-0">
                        <div className="text-2xl w-8 text-center flex-shrink-0">{getMedal(index + 1)}</div>
                        <div className="flex-grow min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{item.id}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.artist}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                        <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-6 h-6 text-red-600 hover:text-red-500" />} />
                        <ActionButton href={printGakufuUrl} title="ぷりんと楽譜で検索" icon={<DocumentTextIcon className="w-5 h-5" />} />
                        <div className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 w-12 text-right">{item.count}回</div>
                    </div>
                </div>
            );
        }) : <p className="text-center text-gray-500 dark:text-gray-400 mt-8">ランキングデータがありません。</p>}
    </div>
);

const ArtistRankingTab: React.FC<{ artists: ArtistRankingItem[] }> = ({ artists }) => (
    <div className="space-y-3 animate-fade-in-fast">
        {artists.length > 0 ? artists.map((item, index) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-md">
                <div className="flex items-center gap-4">
                    <div className="text-2xl w-8 text-center">{getMedal(index + 1)}</div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{item.id}</h3>
                </div>
                <div className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">{item.count}回</div>
            </div>
        )) : <p className="text-center text-gray-500 dark:text-gray-400 mt-8">ランキングデータがありません。</p>}
    </div>
);


export const RankingView: React.FC<RankingViewProps> = ({ songRanking, artistRanking, period, setPeriod }) => {
    const [activeTab, setActiveTab] = useState<'song' | 'artist'>('song');

    const TabButton: React.FC<{ tab: 'song' | 'artist', label: string }> = ({ tab, label }) => {
        const isActive = activeTab === tab;
        return (
            <button
                onClick={() => setActiveTab(tab)}
                className={`w-1/2 py-3 text-center font-semibold rounded-t-lg transition-colors focus:outline-none ${isActive ? 'bg-white dark:bg-gray-800' : 'bg-gray-200 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700/80 text-gray-500 dark:text-gray-400'}`}
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
            <h2 className="text-3xl font-bold text-center mb-4">人気曲ランキング</h2>
            
            <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <PeriodButton p="all" label="すべて" />
                    <PeriodButton p="month" label="月間" />
                    <PeriodButton p="year" label="年間" />
                </div>
            </div>
            
            <div className="flex">
                <TabButton tab="song" label="曲ランキング" />
                <TabButton tab="artist" label="アーティストランキング" />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-b-lg shadow-lg">
                {activeTab === 'song' ? <SongRankingTab songs={songRanking} /> : <ArtistRankingTab artists={artistRanking} />}
            </div>
        </div>
    );
};
