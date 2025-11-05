// FIX: Import useState from React to resolve 'Cannot find name' errors.
import React, { useState } from 'react';
import { RequestRankingItem } from '../types';
import { HeartIcon, YouTubeIcon, DocumentTextIcon, CloudUploadIcon, ExternalLinkIcon } from '../components/ui/Icons';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface RequestRankingViewProps {
    rankingList: RequestRankingItem[];
    logRequest: (term: string, requester: string) => Promise<void>;
    refreshRankings: () => void;
    onSetlistRequestStart: (requester: string) => void;
}

const RequestForm: React.FC<{
    logRequest: (term: string, requester: string) => Promise<void>;
    refreshRankings: () => void;
}> = ({ logRequest, refreshRankings }) => {
    const [songTitle, setSongTitle] = useState('');
    const [casId, setCasId] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sentMessage, setSentMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!songTitle.trim() || !casId.trim()) {
            alert('曲名とツイキャスアカウント名は必須です。');
            return;
        }
        setIsSending(true);
        await logRequest(songTitle, casId);
        setIsSending(false);
        setSentMessage(`「${songTitle}」をリクエストしました！`);
        setSongTitle('');
        // casId is kept for convenience
        refreshRankings();
        setTimeout(() => setSentMessage(''), 4000);
    };

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg mb-8 border border-gray-700">
            <h3 className="text-xl font-bold text-center mb-4">リストにない曲をリクエスト</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="songTitle" className="block text-sm text-left font-medium text-gray-300 mb-1">曲名 <span className="text-red-400">*</span></label>
                    <input
                        id="songTitle"
                        type="text"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="アイドル / YOASOBI"
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition"
                    />
                </div>
                <div>
                    <label htmlFor="casId_form" className="block text-sm text-left font-medium text-gray-300 mb-1">ツイキャスアカウント名 <span className="text-red-400">*</span></label>
                    <input
                        id="casId_form"
                        type="text"
                        value={casId}
                        onChange={(e) => setCasId(e.target.value)}
                        placeholder="@の後ろのIDを入力"
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition"
                    />
                    <p className="text-xs text-gray-400 text-left mt-1">配信者のみに公開されます。</p>
                </div>
                <div className="text-xs text-left text-gray-400 bg-gray-900/50 p-3 rounded-md space-y-1">
                    <p>※リクエストに必ずお応えできるわけではありません。</p>
                    <p>※<a href="https://www.print-gakufu.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">「ぷりんと楽譜」<ExternalLinkIcon className="inline-block w-3 h-3"/></a>にある曲は初見で弾ける可能性があります。</p>
                </div>
                {sentMessage ? (
                    <p className="text-center text-green-400 h-12 flex items-center justify-center">{sentMessage}</p>
                ) : (
                    <button type="submit" disabled={isSending} className="w-full h-12 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isSending ? <LoadingSpinner className="w-5 h-5"/> : <CloudUploadIcon className="w-5 h-5" />}
                        {isSending ? '送信中...' : 'この内容でリクエスト'}
                    </button>
                )}
            </form>
        </div>
    );
};


const SuggestSetlistAction: React.FC<{
    onSetlistRequestStart: (requester: string) => void;
}> = ({ onSetlistRequestStart }) => {
    const [voterId, setVoterId] = useState('');
    
    const handleStart = () => {
        if (!voterId.trim()) {
            alert('提案するには、まずツイキャスアカウント名を入力してください。');
            return;
        }
        onSetlistRequestStart(voterId);
    };

    return(
        <div className="bg-gray-800/50 p-6 rounded-lg mb-8 border border-gray-700">
            <h3 className="text-xl font-bold text-center mb-2">セトリを提案する</h3>
            <p className="text-center text-gray-400 mb-4 text-sm">次の配信で演奏してほしい曲のセットリスト（最大5曲）を提案できます。</p>
            <div className="mb-4">
                <label htmlFor="voterId_input" className="block text-sm text-left font-medium text-gray-300 mb-1">ツイキャスアカウント名 <span className="text-red-400">*</span></label>
                <input
                    id="voterId_input"
                    type="text"
                    value={voterId}
                    onChange={(e) => setVoterId(e.target.value)}
                    placeholder="@の後ろのIDを入力"
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition"
                />
            </div>
            <button onClick={handleStart} className="w-full h-12 flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold transition-transform transform hover:scale-105">
                曲を選んでセトリを提案
            </button>
        </div>
    );
};


export const RequestRankingView: React.FC<RequestRankingViewProps> = ({ rankingList, logRequest, refreshRankings, onSetlistRequestStart }) => {

    const getMedal = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return <span className="font-bold text-gray-400">{rank}</span>;
    };
    
    const ActionButton: React.FC<{ href: string, title: string, icon: React.ReactNode }> = ({ href, title, icon }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" title={title} className="text-gray-400 hover:text-white transition-colors">
            {icon}
        </a>
    );

    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-3">
                <HeartIcon className="w-8 h-8 text-pink-400"/>
                リクエスト
            </h2>
             <p className="text-center text-gray-400 mb-8 text-sm">
                リストにない曲はリクエスト！セットリストの提案もこちらから！
            </p>
            
            <RequestForm logRequest={logRequest} refreshRankings={refreshRankings} />
            <SuggestSetlistAction onSetlistRequestStart={onSetlistRequestStart} />
            
            <h3 className="text-xl font-bold text-center my-8">現在のリクエストランキング</h3>

            {rankingList.length > 0 ? (
                <div className="space-y-3">
                    {rankingList.map((item, index) => {
                        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(item.id)}`;
                        const printGakufuUrl = `https://www.print-gakufu.com/search/result/keyword__${encodeURIComponent(item.id)}/`;

                        return (
                            <div key={item.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-lg">
                                <div className="flex items-center gap-4 flex-grow min-w-0">
                                    <div className="text-2xl w-8 text-center flex-shrink-0">{getMedal(index + 1)}</div>
                                    <div className="flex-grow min-w-0">
                                        <h3 className="font-bold text-lg text-white truncate">{item.id}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                                    <ActionButton href={youtubeSearchUrl} title="YouTubeで検索" icon={<YouTubeIcon className="w-6 h-6 text-red-600 hover:text-red-500" />} />
                                    <ActionButton href={printGakufuUrl} title="ぷりんと楽譜で検索" icon={<DocumentTextIcon className="w-5 h-5" />} />
                                    <div className="text-lg font-semibold text-pink-400 w-12 text-right">{item.count}票</div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-400 mt-8">まだリクエストはありません。</p>
            )}
        </div>
    );
};
