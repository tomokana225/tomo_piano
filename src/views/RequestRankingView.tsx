import React, { useState } from 'react';
import { HeartIcon, CloudUploadIcon, ExternalLinkIcon } from '../components/ui/Icons';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { containsNGWord } from '../utils/validation';
import { RequestRankingItem, UiConfig } from '../types';

interface RequestRankingViewProps {
    recentRequests: RequestRankingItem[];
    logRequest: (term: string, artist: string, requester: string) => Promise<void>;
    refreshRankings: () => void;
    uiConfig: UiConfig;
}

const RequestForm: React.FC<{
    logRequest: (term: string, artist: string, requester: string) => Promise<void>;
    refreshRankings: () => void;
    uiConfig: UiConfig;
}> = ({ logRequest, refreshRankings, uiConfig }) => {
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
        if (containsNGWord(songTitle) || containsNGWord(casId)) {
            alert('不適切な単語が含まれているため、送信できません。');
            return;
        }
        setIsSending(true);
        await logRequest(songTitle, '', casId);
        setIsSending(false);
        setSentMessage(`「${songTitle}」をリクエストしました！`);
        setSongTitle('');
        // casId is kept for convenience
        refreshRankings();
        setTimeout(() => setSentMessage(''), 4000);
    };

    return (
        <div className="bg-card-background-light dark:bg-card-background-dark p-6 rounded-2xl mb-8 border border-border-light dark:border-border-dark shadow-sm">
            <h3 className="text-xl font-bold text-center mb-6">リストにない曲をリクエスト</h3>
             <form onSubmit={handleSubmit} className="space-y-5">
                 <div>
                    <label htmlFor="songTitle" className="block text-sm text-left font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">曲名 <span className="text-red-500">*</span></label>
                    <input
                        id="songTitle"
                        type="text"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="アイドル / YOASOBI"
                        required
                        className="w-full bg-input-bg-light dark:bg-input-bg-dark border border-border-light dark:border-border-dark rounded-xl py-2.5 px-4 text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all text-text-primary-light dark:text-text-primary-dark"
                        style={{'--tw-ring-color': 'var(--primary-color)'} as React.CSSProperties}
                    />
                </div>
                <div>
                    <label htmlFor="casId_form" className="block text-sm text-left font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">ツイキャスアカウント名 <span className="text-red-500">*</span></label>
                    <input
                        id="casId_form"
                        type="text"
                        value={casId}
                        onChange={(e) => setCasId(e.target.value)}
                        placeholder="IDかアカウント名を入力"
                        required
                        className="w-full bg-input-bg-light dark:bg-input-bg-dark border border-border-light dark:border-border-dark rounded-xl py-2.5 px-4 text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all text-text-primary-light dark:text-text-primary-dark"
                        style={{'--tw-ring-color': 'var(--primary-color)'} as React.CSSProperties}
                    />
                    <p className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark text-left mt-1.5 font-medium opacity-70">※この項目は配信者のみに公開されます。</p>
                </div>
                <div className="text-[11px] text-left text-text-secondary-light dark:text-text-secondary-dark bg-input-bg-light/50 dark:bg-black/20 p-4 rounded-xl space-y-1.5 border border-border-light/50 dark:border-border-dark/30">
                    <p className="flex items-start gap-1"><span>※</span><span>リクエストに必ずお応えできるわけではありません。</span></p>
                    {uiConfig.printGakufuUrl && (
                        <p className="flex items-start gap-1">
                            <span>※</span>
                            <span>
                                <a href={uiConfig.printGakufuUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-bold" style={{color: 'var(--primary-color)'}}>「ぷりんと楽譜」<ExternalLinkIcon className="inline-block w-3 h-3"/></a>
                                にある曲は初見で弾ける可能性があります。
                            </span>
                        </p>
                    )}
                </div>
                {sentMessage ? (
                    <p className="text-center text-green-600 dark:text-green-400 h-14 flex items-center justify-center font-bold animate-fade-in">{sentMessage}</p>
                ) : (
                    <button type="submit" disabled={isSending} className="w-full h-14 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-md">
                        {isSending ? <LoadingSpinner className="w-5 h-5"/> : <CloudUploadIcon className="w-5 h-5" />}
                        {isSending ? '送信中...' : 'この内容でリクエスト'}
                    </button>
                )}
            </form>
        </div>
    );
};

const RecentRequestsList: React.FC<{ requests: RequestRankingItem[] }> = ({ requests }) => {
    const formatDate = (timestamp?: number) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="mt-12">
            <h3 className="text-xl font-bold text-center mb-6">最近のリクエスト</h3>
            {requests && requests.length > 0 ? (
                <div className="space-y-3">
                    {requests.map((req) => (
                        /* hover:translate-x-1 を削除し、transition-all に変更 */
                        <div key={`${req.id}-${req.lastRequestedAt}`} className="bg-card-background-light dark:bg-card-background-dark border border-border-light dark:border-border-dark p-3 sm:p-4 rounded-xl flex justify-between items-center text-sm shadow-sm transition-all">
                            <div className="min-w-0">
                                <p className="font-bold truncate text-text-primary-light dark:text-text-primary-dark">{req.id}</p>
                                {req.artist && <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate mt-0.5">{req.artist}</p>}
                            </div>
                            <div className="text-right text-text-secondary-light dark:text-text-secondary-dark flex-shrink-0 ml-4 font-medium">
                                <p className="text-[10px] opacity-70 uppercase mb-0.5">Requested at</p>
                                <p className="text-[11px]">{formatDate(req.lastRequestedAt)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-card-background-light dark:bg-card-background-dark rounded-2xl border-2 border-dashed border-border-light dark:border-border-dark">
                    <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">まだリクエストはありません。</p>
                </div>
            )}
        </div>
    );
};

export const RequestRankingView: React.FC<RequestRankingViewProps> = ({ recentRequests, logRequest, refreshRankings, uiConfig }) => {
    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-3">
                <HeartIcon className="w-8 h-8 text-pink-500"/>
                曲のリクエスト
            </h2>
             <p className="text-center text-text-secondary-light dark:text-text-secondary-dark mb-10 text-sm font-medium">
                リストにない曲はこちらからリクエストできます。
            </p>
            
            <RequestForm logRequest={logRequest} refreshRankings={refreshRankings} uiConfig={uiConfig} />

            <RecentRequestsList requests={recentRequests} />
        </div>
    );
};