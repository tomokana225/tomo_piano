import React, { useState } from 'react';
import { HeartIcon, CloudUploadIcon, ExternalLinkIcon } from '../components/ui/Icons';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { containsNGWord } from '../utils/validation';

interface RequestRankingViewProps {
    logRequest: (term: string, artist: string, requester: string) => Promise<void>;
    refreshRankings: () => void;
}

const RequestForm: React.FC<{
    logRequest: (term: string, artist: string, requester: string) => Promise<void>;
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
        <div className="bg-white dark:bg-gray-800/50 p-6 rounded-lg mb-8 border border-gray-200 dark:border-gray-700 shadow-md">
            <h3 className="text-xl font-bold text-center mb-4">リストにない曲をリクエスト</h3>
             <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="songTitle" className="block text-sm text-left font-medium text-gray-700 dark:text-gray-300 mb-1">曲名 <span className="text-red-500 dark:text-red-400">*</span></label>
                    <input
                        id="songTitle"
                        type="text"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="アイドル / YOASOBI"
                        required
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition"
                    />
                </div>
                <div>
                    <label htmlFor="casId_form" className="block text-sm text-left font-medium text-gray-700 dark:text-gray-300 mb-1">ツイキャスアカウント名 <span className="text-red-500 dark:text-red-400">*</span></label>
                    <input
                        id="casId_form"
                        type="text"
                        value={casId}
                        onChange={(e) => setCasId(e.target.value)}
                        placeholder="IDかアカウント名を入力"
                        required
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-left mt-1">配信者のみに公開されます。</p>
                </div>
                <div className="text-xs text-left text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-md space-y-1">
                    <p>※リクエストに必ずお応えできるわけではありません。</p>
                    <p>※<a href="https://www.print-gakufu.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline">「ぷりんと楽譜」<ExternalLinkIcon className="inline-block w-3 h-3"/></a>にある曲は初見で弾ける可能性があります。</p>
                </div>
                {sentMessage ? (
                    <p className="text-center text-green-600 dark:text-green-400 h-12 flex items-center justify-center">{sentMessage}</p>
                ) : (
                    <button type="submit" disabled={isSending} className="w-full h-12 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isSending ? <LoadingSpinner className="w-5 h-5"/> : <CloudUploadIcon className="w-5 h-5" />}
                        {isSending ? '送信中...' : 'この内容でリクエスト'}
                    </button>
                )}
            </form>
        </div>
    );
};


export const RequestRankingView: React.FC<RequestRankingViewProps> = ({ logRequest, refreshRankings }) => {
    return (
        <div className="w-full max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-3">
                <HeartIcon className="w-8 h-8 text-pink-500 dark:text-pink-400"/>
                曲のリクエスト
            </h2>
             <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">
                リストにない曲はこちらからリクエストできます。
                <br />
                送信されたリクエストは「ランキング」ページの「いいね数ランキング」に反映されます。
            </p>
            
            <RequestForm logRequest={logRequest} refreshRankings={refreshRankings} />
        </div>
    );
};
